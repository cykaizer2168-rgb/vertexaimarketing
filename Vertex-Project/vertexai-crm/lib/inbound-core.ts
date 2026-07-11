// ============================================================================
// Inbound message routing core.
//
// The email path lives inline in the route (unchanged). This module owns the
// Messenger branch, written against a small repo interface so the logic is
// unit-testable without a live Supabase.
// ============================================================================

// Decide which channel an inbound payload belongs to. Messenger payloads carry
// channel:'messenger' or a psid; everything else is treated as email (the
// original behavior — email callers never set these fields).
export function channelOf(body: unknown): 'messenger' | 'email' {
  const b = (body ?? {}) as Record<string, unknown>;
  if (b.channel === 'messenger') return 'messenger';
  if (typeof b.psid === 'string' && b.psid.trim()) return 'messenger';
  return 'email';
}

export interface MessengerInboundBody {
  channel?: string;
  psid?: string;
  name?: string;
  text?: string;
  mid?: string; // Meta message id — idempotency key
  direction?: 'inbound' | 'outbound';
}

export interface MessengerLead {
  id: string;
  name: string;
  stage: string;
}

export interface MessengerMessageInsert {
  lead_id: string;
  direction: 'inbound' | 'outbound';
  channel: 'messenger';
  kind: string;
  subject: string;
  body: string;
  from_addr: string | null;
  to_addr: string | null;
  external_id: string | null;
}

export interface MessengerRepo {
  messageExists(externalId: string): Promise<boolean>;
  findLeadByPsid(psid: string): Promise<MessengerLead | null>;
  createLead(input: { name: string; psid: string }): Promise<MessengerLead>;
  ensureConversationState(psid: string, leadId: string): Promise<void>;
  // Returns { duplicate:true } on a unique-violation race, { error } on failure.
  insertMessage(msg: MessengerMessageInsert): Promise<{ duplicate?: boolean; error?: string }>;
  insertActivity(a: { lead_id: string; type: string; description: string; actor: string }): Promise<void>;
}

export interface InboundResult {
  status: number;
  json: Record<string, unknown>;
}

export async function handleMessengerInbound(
  repo: MessengerRepo,
  body: MessengerInboundBody,
): Promise<InboundResult> {
  const psid = (body.psid ?? '').trim();
  if (!psid) return { status: 400, json: { error: 'psid required' } };

  const text = typeof body.text === 'string' ? body.text : '';
  const mid = (body.mid ?? '').trim() || null;
  const direction: 'inbound' | 'outbound' = body.direction === 'outbound' ? 'outbound' : 'inbound';

  // Dedupe on Meta's message id (retry / webhook re-delivery).
  if (mid && (await repo.messageExists(mid))) {
    return { status: 200, json: { success: true, duplicate: true } };
  }

  // Find-or-create the lead for this PSID.
  let lead = await repo.findLeadByPsid(psid);
  let created = false;
  if (!lead) {
    lead = await repo.createLead({ name: (body.name ?? '').trim() || 'Messenger Lead', psid });
    created = true;
  }
  await repo.ensureConversationState(psid, lead.id);

  const ins = await repo.insertMessage({
    lead_id: lead.id,
    direction,
    channel: 'messenger',
    kind: direction === 'inbound' ? 'reply' : 'bot',
    subject: 'Messenger',
    body: text,
    from_addr: direction === 'inbound' ? psid : null,
    to_addr: direction === 'inbound' ? null : psid,
    external_id: mid,
  });
  if (ins.duplicate) return { status: 200, json: { success: true, duplicate: true } };
  if (ins.error) return { status: 500, json: { error: 'Insert failed', detail: ins.error } };

  if (direction === 'inbound') {
    await repo.insertActivity({
      lead_id: lead.id,
      type: 'reply',
      description: '📩 Lead replied via Messenger',
      actor: lead.name,
    });
  }

  return { status: 200, json: { success: true, matched: true, created, lead_id: lead.id, psid } };
}
