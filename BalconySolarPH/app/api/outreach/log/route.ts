import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { convertProspectToLead } from '@/lib/prospects-import';

// Logs a contact attempt on a prospect. Outcome "interested" auto-converts the
// prospect into a lead (stage 'contacted') and logs an activity. Other outcomes
// just update the prospect's outreach status.
const OUTCOMES = ['contacted', 'not_interested', 'follow_up', 'interested'] as const;
type Outcome = (typeof OUTCOMES)[number];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { prospectId, channel, outcome, notes } = body as {
    prospectId?: string;
    channel?: string;
    outcome?: Outcome;
    notes?: string;
  };
  if (!prospectId || !outcome || !OUTCOMES.includes(outcome)) {
    return NextResponse.json({ error: 'prospectId and valid outcome required' }, { status: 400 });
  }

  const sb = createAdminSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { data: p } = await sb.from('prospects').select('*').eq('id', prospectId).single();
  if (!p) return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });

  // "interested" graduates to the pipeline; keep its outreach_status readable too.
  const update: Record<string, unknown> = {
    outreach_status: outcome === 'interested' ? 'contacted' : outcome,
    last_channel: channel ?? null,
    contacted_at: new Date().toISOString(),
  };
  if (notes) update.outreach_notes = notes;
  await sb.from('prospects').update(update).eq('id', p.id);

  let leadId: string | null = p.lead_id ?? null;
  if (outcome === 'interested' && !leadId) {
    leadId = await convertProspectToLead(sb, p, 'contacted');
    if (leadId) {
      await sb.from('activities').insert({
        lead_id: leadId,
        type: 'contact',
        description: `📞 Interested via ${channel ?? 'outreach'}${notes ? ` — ${notes}` : ''}`,
        actor: p.name,
      });
    }
  }

  return NextResponse.json({ ok: true, outcome, leadId });
}
