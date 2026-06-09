import { createClient } from '@supabase/supabase-js';

// Server-only admin client (service role) — bypasses RLS. Never import in client code.
export function createAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// Fire a CRM stage/event webhook to n8n (separate from the lead-capture webhook).
// Falls back to the main lead webhook if the stage webhook isn't configured.
export async function fireStageWebhook(payload: Record<string, unknown>) {
  const webhook = process.env.N8N_STAGE_WEBHOOK_URL ?? process.env.N8N_WEBHOOK_URL;
  if (!webhook) return;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(t);
  } catch (err) {
    console.error('[stage-webhook] failed:', err);
  }
}

// Fire the dedicated appointment webhook (n8n "Appointment Emails" workflow) that
// emails the owner + the lead. Separate from the Telegram stage webhook.
export async function fireAppointmentWebhook(payload: Record<string, unknown>) {
  const webhook = process.env.N8N_APPOINTMENT_WEBHOOK_URL;
  if (!webhook) return;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(t);
  } catch (err) {
    console.error('[appointment-webhook] failed:', err);
  }
}

// Log an email/message to a lead's conversation thread. Safe — never throws.
export async function logMessage(opts: {
  leadId: string;
  direction: 'outbound' | 'inbound';
  kind: string;
  subject?: string;
  body?: string;
  from?: string;
  to?: string;
}) {
  try {
    const sb = createAdminSupabase();
    if (!sb) return;
    await sb.from('messages').insert({
      lead_id: opts.leadId,
      direction: opts.direction,
      channel: 'email',
      kind: opts.kind,
      subject: opts.subject ?? null,
      body: opts.body ?? null,
      from_addr: opts.from ?? null,
      to_addr: opts.to ?? null,
    });
  } catch (err) {
    console.error('[logMessage] failed:', err);
  }
}

export const STAGE_LABEL: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  proposal: 'Proposal Sent',
  negotiating: 'Negotiating',
  closed_won: 'Closed Won',
  cold: 'Cold / Lost',
};
