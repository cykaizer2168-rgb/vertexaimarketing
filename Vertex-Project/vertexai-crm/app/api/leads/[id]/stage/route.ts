import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase, fireStageWebhook, STAGE_LABEL } from '@/lib/supabase-admin';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { stage, actor = 'Admin', note } = await req.json().catch(() => ({}));

  const validStages = ['new', 'qualified', 'contacted', 'proposal', 'negotiating', 'closed_won', 'cold'];
  if (!stage || !validStages.includes(stage)) {
    return NextResponse.json({ error: 'Invalid stage' }, { status: 400 });
  }

  const sb = createAdminSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  // Fetch the lead so we can include details in the webhook/email
  const { data: lead, error: fetchErr } = await sb.from('leads').select('*').eq('id', id).single();
  if (fetchErr || !lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  // Update stage
  const { error: updErr } = await sb.from('leads').update({ stage }).eq('id', id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  // Log activity
  const description = note || `Stage moved to ${STAGE_LABEL[stage] ?? stage}`;
  await sb.from('activities').insert({ lead_id: id, type: 'stage_change', description, actor });

  // Fire n8n webhook (Telegram alert + stage-specific automations)
  await fireStageWebhook({
    event_type: stage === 'closed_won' ? 'closed_won' : 'stage_change',
    stage,
    stage_label: STAGE_LABEL[stage] ?? stage,
    actor,
    name: lead.name,
    email: lead.email,
    mobile: lead.mobile,
    location: lead.location,
    monthly_bill: lead.monthly_bill,
  });

  return NextResponse.json({ success: true, stage });
}
