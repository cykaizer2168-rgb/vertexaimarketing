import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { agentSchema, buildSystemPrompt, buildFollowupPrompt, type HistoryMsg } from '@/lib/messenger-agent';
import { dueForFollowup, MAX_FOLLOWUPS } from '@/lib/messenger-followup';
import { sendMessengerText } from '@/lib/fb-send';

const MAX_PER_RUN = 25;

// Proactive Messenger follow-ups for leads who went quiet mid-conversation.
// Only sends inside Meta's 24-hour window (see lib/messenger-followup.ts).
// Protect with CRON_SECRET (Bearer or ?secret=). Trigger on a schedule.
export async function GET(req: NextRequest) {
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

  // Coarse candidate set: still in-conversation, under the nudge cap.
  const { data: rows, error } = await sb
    .from('conversation_state')
    .select('*')
    .not('state', 'in', '("DONE","HUMAN")')
    .lt('followups_sent', MAX_FOLLOWUPS);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const now = Date.now();
  const due = (rows ?? []).filter((r) => dueForFollowup(r, now)).slice(0, MAX_PER_RUN);
  const sent: { psid: string; attempt: number }[] = [];

  for (const row of due) {
    const psid = row.psid as string;
    const leadId = (row.lead_id as string | null) ?? null;
    const attempt = (row.followups_sent ?? 0) + 1;
    const slots = {
      business: row.q1_business ?? null,
      need: row.q2_need ?? null,
      ticket: row.q3_ticket ?? null,
      timeline: row.q4_timeline ?? null,
    };

    // Recent thread for context.
    let history: HistoryMsg[] = [];
    if (leadId) {
      const { data: msgs } = await sb
        .from('messages')
        .select('direction, body')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true })
        .limit(12);
      history = (msgs ?? []).map((m) => ({
        direction: m.direction === 'outbound' ? 'outbound' : 'inbound',
        body: m.body ?? '',
      }));
    }

    let reply = '';
    try {
      const { object } = await generateObject({
        model: openai(process.env.OPENAI_MODEL ?? 'gpt-4o-mini'),
        schema: agentSchema,
        system: buildSystemPrompt(),
        prompt: buildFollowupPrompt(history, slots, attempt),
        maxOutputTokens: 350,
      });
      reply = (object.reply ?? '').trim();
    } catch (err) {
      console.error('[messenger/followup] LLM failed for', psid, err);
      continue;
    }
    if (!reply) continue;

    if (dryRun) {
      sent.push({ psid, attempt });
      continue;
    }

    const res = await sendMessengerText(psid, reply);
    if (!res.ok) {
      console.error('[messenger/followup] send failed for', psid, res.error);
      continue;
    }

    // Record it: thread message, activity, bump counters.
    if (leadId) {
      await sb.from('messages').insert({
        lead_id: leadId,
        direction: 'outbound',
        channel: 'messenger',
        kind: 'followup',
        subject: 'Messenger',
        body: reply,
        from_addr: null,
        to_addr: psid,
        external_id: null,
      });
      await sb.from('activities').insert({
        lead_id: leadId,
        type: 'followup',
        description: `Messenger follow-up #${attempt} sent`,
        actor: 'Messenger Bot',
      });
    }
    await sb
      .from('conversation_state')
      .update({ followups_sent: attempt, updated_at: new Date().toISOString() })
      .eq('psid', psid);

    sent.push({ psid, attempt });
  }

  return NextResponse.json({ success: true, dryRun, candidates: rows?.length ?? 0, due: due.length, sent });
}
