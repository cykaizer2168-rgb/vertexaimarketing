// ============================================================================
// Vertex AI Marketing — Messenger AI Sales Agent (prompt + extraction logic).
//
// Pure/testable: builds the system + conversation prompts and merges the LLM's
// extracted qualifying signals into conversation_state. The actual generateObject
// call lives in the route (app/api/messenger/agent/route.ts).
// ============================================================================

import { jsonSchema } from 'ai';
import { VERTEX_KB, type VertexKB } from './vertex-kb.ts';
import { buildPersuasionBlock } from './vertex-persuasion.ts';

export interface AgentExtracted {
  business: string | null; // q1
  need: string | null; // q2
  ticket: string | null; // q3 — value of one closed sale
  timeline: string | null; // q4
}

export interface AgentOutput {
  reply: string;
  extracted: AgentExtracted;
  wantsHuman: boolean;
  complete: boolean;
}

// Structured-output schema (JSON Schema — no zod dependency).
export const agentSchema = jsonSchema<AgentOutput>({
  type: 'object',
  additionalProperties: false,
  required: ['reply', 'extracted', 'wantsHuman', 'complete'],
  properties: {
    reply: { type: 'string', description: 'The warm Taglish message to send back to the customer.' },
    extracted: {
      type: 'object',
      additionalProperties: false,
      required: ['business', 'need', 'ticket', 'timeline'],
      properties: {
        business: { type: ['string', 'null'], description: 'Their business type / industry, if known so far.' },
        need: { type: ['string', 'null'], description: 'What they want: leads, ads, website, or a full system/automation.' },
        ticket: { type: ['string', 'null'], description: 'Value of ONE closed sale/client (e.g. "₱50k", "1M"), if mentioned.' },
        timeline: { type: ['string', 'null'], description: 'When they want to start (ASAP, this month, 1-2 months).' },
      },
    },
    wantsHuman: { type: 'boolean', description: 'True if the customer explicitly asks to talk to a real person/agent.' },
    complete: { type: 'boolean', description: 'True once business, need, ticket AND timeline are all known.' },
  },
});

// System prompt: persona + grounded knowledge base + qualification goal.
export function buildSystemPrompt(kb: VertexKB = VERTEX_KB): string {
  const services = kb.services.map((s) => `- ${s.name}: ${s.blurb}`).join('\n');
  const props = kb.valueProps.map((v) => `- ${v}`).join('\n');
  const faq = kb.faq.map((f) => `Q: ${f.q}\nA: ${f.a}`).join('\n');
  const rails = kb.guardrails.map((g) => `- ${g}`).join('\n');

  return [
    'You are the AI sales assistant for Vertex AI Marketing on Facebook Messenger.',
    `About us: ${kb.intro}`,
    '',
    'SERVICES:',
    services,
    '',
    'WHY VERTEX:',
    props,
    '',
    'FAQ (answer from these; do not go beyond them):',
    faq,
    '',
    'STYLE:',
    '- Warm, friendly, professional Taglish (Filipino + English). Keep replies short (1-3 sentences), like a real chat.',
    '- On the FIRST message, briefly introduce Vertex AI Marketing, then start the conversation.',
    '- Happily answer questions about our services. Be genuinely helpful, never pushy.',
    '',
    'GOAL — while chatting naturally, work out four things (ask at most one at a time, only when it fits):',
    '1) their business/industry, 2) what they need (leads/ads/website/full system),',
    '3) the value of ONE closed sale/client for them (the money question — ask gently),',
    '4) when they want to start. Put whatever you learn into `extracted`; use null if not yet known.',
    'Set `complete` true once all four are known, and in that reply, warmly say a specialist will follow up.',
    'Set `wantsHuman` true if they ask to talk to a real person; then reassure them someone will jump in.',
    '',
    'GUARDRAILS:',
    rails,
    '- Do NOT quote any price; if asked how much, use the FAQ pricing answer and offer a quick call.',
    '',
    buildPersuasionBlock(),
  ].join('\n');
}

// Prompt for a PROACTIVE follow-up nudge when a lead goes quiet mid-chat.
// Same persona/knowledge (via the system prompt); this is the user-turn prompt.
export function buildFollowupPrompt(
  history: HistoryMsg[],
  slots: Partial<AgentExtracted>,
  attempt: number,
): string {
  const known = [
    `business: ${slots.business ?? '(unknown)'}`,
    `need: ${slots.need ?? '(unknown)'}`,
    `ticket: ${slots.ticket ?? '(unknown)'}`,
    `timeline: ${slots.timeline ?? '(unknown)'}`,
  ].join('\n');
  const thread = history.map((m) => `${m.direction === 'inbound' ? 'Customer' : 'Vertex'}: ${m.body}`).join('\n');

  return [
    'The customer went quiet and has not replied. Write ONE short, warm follow-up',
    `message (this is nudge #${attempt}) to gently re-engage them — reference the`,
    'conversation so far, add a little value or a soft reason to continue, and end',
    'with an easy question. Do not be pushy or repeat yourself. If you still need a',
    'qualifying detail, ask for just one. Keep `extracted` as-is unless they already',
    'gave info earlier.',
    '',
    'KNOWN SO FAR:',
    known,
    '',
    thread ? 'CONVERSATION:\n' + thread : 'CONVERSATION: (only a greeting so far)',
  ].join('\n');
}

export interface HistoryMsg {
  direction: 'inbound' | 'outbound';
  body: string;
}

// Render the running thread + known slots so the model has full context.
export function buildConversationPrompt(
  history: HistoryMsg[],
  state: Partial<AgentExtracted>,
  userText: string,
): string {
  const known = [
    `business: ${state.business ?? '(unknown)'}`,
    `need: ${state.need ?? '(unknown)'}`,
    `ticket: ${state.ticket ?? '(unknown)'}`,
    `timeline: ${state.timeline ?? '(unknown)'}`,
  ].join('\n');

  const thread = history
    .map((m) => `${m.direction === 'inbound' ? 'Customer' : 'Vertex'}: ${m.body}`)
    .join('\n');

  return [
    'KNOWN SO FAR:',
    known,
    '',
    thread ? 'CONVERSATION:\n' + thread : 'CONVERSATION: (this is the first message)',
    '',
    `Customer just said: ${userText}`,
    '',
    'Respond with the next message and update `extracted`.',
  ].join('\n');
}

// Merge the model's extraction into stored slots: only overwrite with a
// non-empty value, so a later null never wipes a known answer. Returns the
// conversation_state column patch (q1_business ... q4_timeline) for changed
// fields only, plus the effective merged answers.
const COL: Record<keyof AgentExtracted, string> = {
  business: 'q1_business',
  need: 'q2_need',
  ticket: 'q3_ticket',
  timeline: 'q4_timeline',
};

export function mergeExtracted(
  current: Partial<AgentExtracted>,
  extracted: Partial<AgentExtracted>,
): { patch: Record<string, string>; merged: AgentExtracted } {
  const patch: Record<string, string> = {};
  const merged: AgentExtracted = {
    business: current.business ?? null,
    need: current.need ?? null,
    ticket: current.ticket ?? null,
    timeline: current.timeline ?? null,
  };
  (Object.keys(COL) as (keyof AgentExtracted)[]).forEach((k) => {
    const v = extracted[k];
    if (typeof v === 'string' && v.trim()) {
      const val = v.trim();
      if (val !== current[k]) patch[COL[k]] = val;
      merged[k] = val;
    }
  });
  return { patch, merged };
}

export function allSlotsFilled(a: AgentExtracted): boolean {
  return !!(a.business && a.need && a.ticket && a.timeline);
}
