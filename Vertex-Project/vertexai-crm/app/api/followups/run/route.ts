import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase, logMessage } from '@/lib/supabase-admin';

const FOLLOWUP_SUBJECT: Record<string, string> = {
  roi: 'Ganito karami ang leads na kaya mong makuha 📈',
  survey: 'Libreng marketing audit para sa negosyo mo 🔍',
  urgency: 'Bawat araw na walang system = nawawalang benta ⏳',
  winback: 'Last call — libreng growth strategy chat 👋',
};

// Follow-up schedule: step N fires after `afterDays` since lead creation.
const SCHEDULE = [
  { step: 1, afterDays: 2,  kind: 'roi' },
  { step: 2, afterDays: 5,  kind: 'survey' },
  { step: 3, afterDays: 10, kind: 'urgency' },
  { step: 4, afterDays: 21, kind: 'winback' },
];

async function fireFollowup(payload: Record<string, unknown>) {
  const webhook = process.env.N8N_FOLLOWUP_WEBHOOK_URL;
  if (!webhook) return false;
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 8000);
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: c.signal,
    });
    clearTimeout(t);
    return true;
  } catch (err) {
    console.error('[followups] webhook failed:', err);
    return false;
  }
}

export async function GET(req: NextRequest) {
  // Optional protection: if CRON_SECRET is set, require it (Vercel cron sends it as Bearer)
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    const qp = req.nextUrl.searchParams.get('secret');
    if (auth !== `Bearer ${secret}` && qp !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const dryRun = req.nextUrl.searchParams.get('dryRun') === '1';

  const sb = createAdminSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  // Only follow up leads still in "new" (not yet contacted/converted/lost)
  const { data: leads, error } = await sb
    .from('leads')
    .select('*')
    .eq('stage', 'new')
    .eq('proposal_accepted', false);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const now = Date.now();
  const sent: { name: string; email: string; step: number; kind: string }[] = [];

  for (const lead of leads ?? []) {
    const ageDays = (now - new Date(lead.created_at).getTime()) / 86400000;
    const currentStep = lead.followup_step ?? 0;

    // Find the highest step that is now due but not yet sent
    const due = [...SCHEDULE].reverse().find(s => ageDays >= s.afterDays && currentStep < s.step);
    if (!due) continue;

    if (!dryRun) {
      const ok = await fireFollowup({
        kind: due.kind,
        step: due.step,
        name: lead.name,
        email: lead.email,
        location: lead.location,
        monthly_bill: lead.monthly_bill,
      });
      if (ok) {
        await sb.from('leads').update({
          followup_step: due.step,
          last_followup_at: new Date().toISOString(),
        }).eq('id', lead.id);
        await sb.from('activities').insert({
          lead_id: lead.id,
          type: 'followup',
          description: `Follow-up email #${due.step} (${due.kind}) sent`,
          actor: 'System',
        });
        await logMessage({
          leadId: lead.id, direction: 'outbound', kind: 'followup',
          subject: FOLLOWUP_SUBJECT[due.kind] ?? `Follow-up #${due.step}`,
          body: `Follow-up email #${due.step} (${due.kind}) — automated sequence.`,
          from: 'cykaizer2168@gmail.com', to: lead.email,
        });
      }
    }

    sent.push({ name: lead.name, email: lead.email, step: due.step, kind: due.kind });
  }

  return NextResponse.json({ success: true, dryRun, processed: leads?.length ?? 0, sent });
}
