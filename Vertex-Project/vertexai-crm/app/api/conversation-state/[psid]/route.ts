import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { hasInternalKey, INTERNAL_KEY_HEADER } from '@/lib/internal-auth';
import { type QualifyAnswers } from '@/lib/messenger-score';
import { scoreAndRoute } from '@/lib/messenger-route';

// Fields n8n may PATCH as the qualification conversation progresses.
const FIELDS = ['state', 'q1_business', 'q2_need', 'q3_ticket', 'q4_timeline'] as const;

export async function GET(req: NextRequest, ctx: { params: Promise<{ psid: string }> }) {
  if (!hasInternalKey(req.headers.get(INTERNAL_KEY_HEADER))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { psid } = await ctx.params;
  const sb = createAdminSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { data } = await sb.from('conversation_state').select('*').eq('psid', psid).maybeSingle();
  return NextResponse.json({ state: data ?? null });
}

// Merge conversation progress. When all four answers are present (or state is
// 'DONE'), score the lead and route it: HOT→qualified (+handoff webhook),
// WARM→new (stays in the follow-up drip), NOT_FIT→cold.
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ psid: string }> }) {
  if (!hasInternalKey(req.headers.get(INTERNAL_KEY_HEADER))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { psid } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const sb = createAdminSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  // Build the patch from whitelisted fields only.
  const patch: Record<string, unknown> = { psid, updated_at: new Date().toISOString() };
  for (const f of FIELDS) {
    if (typeof body[f] === 'string') patch[f] = body[f];
  }

  const { data: row, error: upErr } = await sb
    .from('conversation_state')
    .upsert(patch, { onConflict: 'psid' })
    .select('*')
    .single();
  if (upErr || !row) {
    return NextResponse.json({ error: upErr?.message ?? 'Upsert failed' }, { status: 500 });
  }

  const answers: QualifyAnswers = {
    q1_business: row.q1_business,
    q2_need: row.q2_need,
    q3_ticket: row.q3_ticket,
    q4_timeline: row.q4_timeline,
  };
  const complete =
    row.state === 'DONE' ||
    (answers.q1_business && answers.q2_need && answers.q3_ticket && answers.q4_timeline);

  if (!complete) {
    return NextResponse.json({ success: true, state: row, scored: false });
  }

  // Score + route (shared with the AI agent endpoint).
  const { score, tier, stage, routed } = await scoreAndRoute(
    sb,
    psid,
    answers,
    (row.lead_id as string | null) ?? null,
  );

  return NextResponse.json({ success: true, scored: true, score, tier, stage, routed });
}
