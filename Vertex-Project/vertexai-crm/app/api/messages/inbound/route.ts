import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase, fireStageWebhook } from '@/lib/supabase-admin';
import {
  channelOf,
  handleMessengerInbound,
  type MessengerRepo,
  type MessengerMessageInsert,
} from '@/lib/inbound-core';

// Builds a Supabase-backed repo for the Messenger inbound handler.
function messengerRepo(sb: NonNullable<ReturnType<typeof createAdminSupabase>>): MessengerRepo {
  return {
    async messageExists(externalId) {
      const { data } = await sb
        .from('messages')
        .select('id')
        .eq('external_id', externalId)
        .limit(1)
        .maybeSingle();
      return !!data;
    },
    async findLeadByPsid(psid) {
      const { data } = await sb
        .from('leads')
        .select('id, name, stage')
        .eq('psid', psid)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data ?? null;
    },
    async createLead({ name, psid }) {
      const { data, error } = await sb
        .from('leads')
        .insert({ name, psid, stage: 'new', lead_source: 'messenger' })
        .select('id, name, stage')
        .single();
      if (error || !data) throw new Error(error?.message ?? 'createLead failed');
      return data;
    },
    async ensureConversationState(psid, leadId) {
      await sb
        .from('conversation_state')
        .upsert({ psid, lead_id: leadId, updated_at: new Date().toISOString() }, { onConflict: 'psid' });
    },
    async insertMessage(msg: MessengerMessageInsert) {
      const { error } = await sb.from('messages').insert(msg);
      if (error) return error.code === '23505' ? { duplicate: true } : { error: error.message };
      return {};
    },
    async insertActivity(a) {
      await sb.from('activities').insert(a);
    },
  };
}

// Receives inbound messages from n8n. Two channels:
//   - messenger: Facebook Messenger chat (state machine runs in n8n)
//   - email:     n8n IMAP/Email trigger (original behavior, unchanged)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  // ── Messenger branch ──────────────────────────────────────────────────────
  if (channelOf(body) === 'messenger') {
    const sb = createAdminSupabase();
    if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    const result = await handleMessengerInbound(messengerRepo(sb), body);
    return NextResponse.json(result.json, { status: result.status });
  }

  // ── Email branch (unchanged) ──────────────────────────────────────────────
  let { from, subject, text, messageId } = body as {
    from?: string;
    subject?: string;
    text?: string;
    messageId?: string;
  };

  // n8n IMAP "from" may be "Juan <juan@gmail.com>" — extract the email
  const match = (from ?? '').match(/<([^>]+)>/);
  const fromEmail = (match ? match[1] : from ?? '').trim().toLowerCase();
  if (!fromEmail) return NextResponse.json({ error: 'No sender email' }, { status: 400 });

  // Strip quoted reply history (everything after common reply markers)
  if (text) {
    text = text.split(/\n>|On .* wrote:|-----Original Message-----/)[0].trim();
  }

  const sb = createAdminSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  // Dedupe: the Gmail message id is our idempotency key. If this exact message was
  // already logged (retry / workflow re-poll), skip everything — no insert, no
  // activity, no duplicate Telegram alert.
  const extId = (messageId ?? '').trim() || null;
  if (extId) {
    const { data: existing } = await sb
      .from('messages')
      .select('id')
      .eq('external_id', extId)
      .limit(1)
      .maybeSingle();
    if (existing) return NextResponse.json({ success: true, duplicate: true });
  }

  // Find the lead by email (most recent if duplicates)
  const { data: lead } = await sb
    .from('leads')
    .select('id, name, location, stage')
    .ilike('email', fromEmail)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!lead) {
    // No matching lead — ignore (could be a non-lead email)
    return NextResponse.json({ success: true, matched: false });
  }

  const { error: insertErr } = await sb.from('messages').insert({
    lead_id: lead.id,
    direction: 'inbound',
    channel: 'email',
    kind: 'reply',
    subject: subject ?? 'Re: Vertex AI Marketing',
    body: text ?? '',
    from_addr: fromEmail,
    to_addr: 'cykaizer2168@gmail.com',
    external_id: extId,
  });

  // Backstop for the race where a concurrent delivery inserted the same message id
  // between our dedupe check and this insert (Postgres unique violation = 23505).
  if (insertErr) {
    if (insertErr.code === '23505') return NextResponse.json({ success: true, duplicate: true });
    return NextResponse.json({ error: 'Insert failed', detail: insertErr.message }, { status: 500 });
  }

  await sb.from('activities').insert({
    lead_id: lead.id,
    type: 'reply',
    description: '📩 Lead replied via email',
    actor: lead.name,
  });

  // Telegram alert: lead replied!
  await fireStageWebhook({
    event_type: 'lead_replied',
    stage: lead.stage,
    stage_label: 'Reply received',
    actor: lead.name,
    name: lead.name,
    email: fromEmail,
    location: lead.location,
  });

  return NextResponse.json({ success: true, matched: true, lead: lead.name });
}
