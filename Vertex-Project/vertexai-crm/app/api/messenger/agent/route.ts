import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { hasInternalKey, INTERNAL_KEY_HEADER } from '@/lib/internal-auth';
import { scoreAndRoute } from '@/lib/messenger-route';
import {
  agentSchema,
  buildSystemPrompt,
  buildConversationPrompt,
  mergeExtracted,
  allSlotsFilled,
  type AgentExtracted,
  type HistoryMsg,
} from '@/lib/messenger-agent';

// AI Sales Agent turn. n8n calls this per inbound Messenger message (after
// logging it). Returns the reply text to send via the Send API.
// Internal endpoint — requires x-vertex-key.
export async function POST(req: NextRequest) {
  if (!hasInternalKey(req.headers.get(INTERNAL_KEY_HEADER))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { psid, text } = (await req.json().catch(() => ({}))) as { psid?: string; text?: string };
  if (!psid) return NextResponse.json({ error: 'psid required' }, { status: 400 });

  const sb = createAdminSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const userText = (text ?? '').trim();

  // Load state + lead.
  const { data: row } = await sb.from('conversation_state').select('*').eq('psid', psid).maybeSingle();
  let leadId = (row?.lead_id as string | null) ?? null;
  if (!leadId) {
    const { data: lead } = await sb.from('leads').select('id').eq('psid', psid).maybeSingle();
    leadId = lead?.id ?? null;
  }

  // A human has taken over — bot stays silent.
  if (row?.state === 'HUMAN') {
    return NextResponse.json({ reply: '', silent: true });
  }

  const slots: AgentExtracted = {
    business: row?.q1_business ?? null,
    need: row?.q2_need ?? null,
    ticket: row?.q3_ticket ?? null,
    timeline: row?.q4_timeline ?? null,
  };

  // Recent thread for memory (oldest → newest).
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

  // Run the agent. On any failure, degrade gracefully so the customer still
  // gets a reply and we never break the Messenger flow.
  let reply = '';
  let extracted: Partial<AgentExtracted> = {};
  let wantsHuman = false;
  let complete = false;
  try {
    const { object } = await generateObject({
      model: openai(process.env.OPENAI_MODEL ?? 'gpt-4o-mini'),
      schema: agentSchema,
      system: buildSystemPrompt(),
      prompt: buildConversationPrompt(history, slots, userText),
      maxOutputTokens: 500,
    });
    reply = (object.reply ?? '').trim();
    extracted = object.extracted ?? {};
    wantsHuman = !!object.wantsHuman;
    complete = !!object.complete;
  } catch (err) {
    console.error('[messenger/agent] LLM failed:', err);
    return NextResponse.json({
      reply: 'Salamat po sa message! 🙏 May kukumpirma sa inyo mula sa aming team in a moment.',
      degraded: true,
    });
  }

  // Merge newly-extracted slots.
  const { patch, merged } = mergeExtracted(slots, extracted);
  const done = complete || allSlotsFilled(merged);

  // Persist state (fields + next state). scoreAndRoute will set DONE on completion.
  const nextState = wantsHuman ? 'HUMAN' : done ? 'DONE' : 'CHAT';
  const nowIso = new Date().toISOString();
  await sb
    .from('conversation_state')
    .upsert(
      { psid, lead_id: leadId, ...patch, state: nextState, updated_at: nowIso, last_inbound_at: nowIso },
      { onConflict: 'psid' },
    );

  // Score + route once qualified (and not being handed to a human).
  let tier: string | undefined;
  if (done && !wantsHuman) {
    const r = await scoreAndRoute(
      sb,
      psid,
      { q1_business: merged.business, q2_need: merged.need, q3_ticket: merged.ticket, q4_timeline: merged.timeline },
      leadId,
    );
    tier = r.tier;
  }

  // Log the bot's reply to the CRM thread.
  if (reply && leadId) {
    await sb.from('messages').insert({
      lead_id: leadId,
      direction: 'outbound',
      channel: 'messenger',
      kind: 'bot',
      subject: 'Messenger',
      body: reply,
      from_addr: null,
      to_addr: psid,
      external_id: null,
    });
  }

  return NextResponse.json({ reply, wantsHuman, complete: done, tier });
}
