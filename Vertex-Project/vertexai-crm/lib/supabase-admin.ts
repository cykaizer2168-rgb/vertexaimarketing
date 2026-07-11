import { createClient } from '@supabase/supabase-js';

// Server-only admin client (service role) — bypasses RLS. Never import in client code.
export function createAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// Trigger a rebuild of the public portfolio site (angelo-franco-portfolio) by asking
// the Vercel API to redeploy its latest production deployment. The build re-fetches
// published case studies from Supabase, so newly published/edited content goes live
// (~1-2 min). Best-effort: failure never breaks the CRM save.
//
// Env (server-only): VERCEL_TOKEN, PORTFOLIO_PROJECT_ID, VERCEL_TEAM_ID (optional),
// PORTFOLIO_PROJECT_NAME (optional, defaults to 'angelo-franco-portfolio').
export async function firePortfolioRebuild() {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.PORTFOLIO_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;
  const name = process.env.PORTFOLIO_PROJECT_NAME || 'angelo-franco-portfolio';
  if (!token || !projectId) return { triggered: false, reason: 'no-config' as const };

  const teamQ = teamId ? `&teamId=${teamId}` : '';
  const withTimeout = (ms: number) => {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), ms);
    return { signal: c.signal, done: () => clearTimeout(t) };
  };

  try {
    // 1. Find the latest production deployment to redeploy.
    const l = withTimeout(8000);
    const listRes = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${projectId}&target=production&limit=1${teamQ}`,
      { headers: { Authorization: `Bearer ${token}` }, signal: l.signal },
    );
    l.done();
    const list = await listRes.json();
    const latest = list?.deployments?.[0]?.uid;
    if (!latest) return { triggered: false, reason: 'no-deployment' as const };

    // 2. Redeploy it (forceNew bypasses dedupe → always a fresh build).
    const d = withTimeout(8000);
    const res = await fetch(
      `https://api.vercel.com/v13/deployments?forceNew=1${teamQ}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, deploymentId: latest, target: 'production' }),
        signal: d.signal,
      },
    );
    d.done();
    if (!res.ok) {
      console.error('[portfolio-rebuild] redeploy failed:', res.status, await res.text().catch(() => ''));
      return { triggered: false, reason: 'error' as const };
    }
    return { triggered: true as const };
  } catch (err) {
    console.error('[portfolio-rebuild] failed:', err);
    return { triggered: false, reason: 'error' as const };
  }
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
  qualified: 'Qualified (HOT)',
  contacted: 'Contacted',
  proposal: 'Proposal Sent',
  negotiating: 'Negotiating',
  closed_won: 'Closed Won',
  cold: 'Cold / Lost',
};
