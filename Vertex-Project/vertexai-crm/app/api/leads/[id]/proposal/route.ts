import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createAdminSupabase, fireStageWebhook, logMessage } from '@/lib/supabase-admin';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { amount, packageName, actor = 'Admin' } = await req.json().catch(() => ({}));

  const sb = createAdminSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { data: lead, error: fetchErr } = await sb.from('leads').select('*').eq('id', id).single();
  if (fetchErr || !lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  // Generate a unique accept token
  const token = randomUUID();
  const origin = req.nextUrl.origin;
  const acceptUrl = `${origin}/proposal/${token}`;

  // Update lead → Proposal stage + proposal fields
  const { error: updErr } = await sb.from('leads').update({
    stage: 'proposal',
    proposal_token: token,
    proposal_amount: amount ?? null,
    proposal_package: packageName ?? null,
    proposal_sent_at: new Date().toISOString(),
    proposal_accepted: false,
  }).eq('id', id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  // Log activity
  await sb.from('activities').insert({
    lead_id: id,
    type: 'proposal_sent',
    description: `Proposal sent${packageName ? ' — ' + packageName : ''}${amount ? ' (' + amount + ')' : ''}`,
    actor,
  });

  // Log to email thread
  await logMessage({
    leadId: id, direction: 'outbound', kind: 'proposal',
    subject: 'Ang iyong Vertex AI Marketing Proposal 🚀',
    body: `Package: ${packageName || 'Custom Kit'}\nInvestment: ${amount || 'Sa assessment'}\n\nI-click ang Accept Proposal button para tanggapin:\n${acceptUrl}`,
    from: 'cykaizer2168@gmail.com', to: lead.email,
  });

  // Fire n8n → proposal email WITH approve button
  await fireStageWebhook({
    event_type: 'proposal_sent',
    stage: 'proposal',
    stage_label: 'Proposal Sent',
    actor,
    name: lead.name,
    email: lead.email,
    mobile: lead.mobile,
    location: lead.location,
    monthly_bill: lead.monthly_bill,
    proposal_amount: amount ?? '',
    proposal_package: packageName ?? '',
    accept_url: acceptUrl,
  });

  return NextResponse.json({ success: true, acceptUrl });
}
