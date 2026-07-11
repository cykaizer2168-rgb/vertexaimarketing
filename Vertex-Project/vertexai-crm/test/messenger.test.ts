import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

import { parsePeso, scoreLead, tierFor, stageForTier } from '../lib/messenger-score.ts';
import { channelOf, handleMessengerInbound, type MessengerRepo } from '../lib/inbound-core.ts';
import { verifyMetaSignature } from '../lib/meta-signature.ts';
import { hasInternalKey } from '../lib/internal-auth.ts';
import {
  buildSystemPrompt,
  buildConversationPrompt,
  buildFollowupPrompt,
  mergeExtracted,
  allSlotsFilled,
  type AgentExtracted,
} from '../lib/messenger-agent.ts';
import { dueForFollowup, MAX_FOLLOWUPS, WINDOW_HOURS } from '../lib/messenger-followup.ts';

// ── parsePeso ───────────────────────────────────────────────────────────────
test('parsePeso understands M / k / libo / milyon and bare numbers', () => {
  assert.equal(parsePeso('1.5M'), 1_500_000);
  assert.equal(parsePeso('2 milyon'), 2_000_000);
  assert.equal(parsePeso('500k'), 500_000);
  assert.equal(parsePeso('200 libo'), 200_000);
  assert.equal(parsePeso('₱250,000'), 250_000);
  assert.equal(parsePeso('P100000'), 100_000);
  assert.equal(parsePeso('wala pa'), null);
  assert.equal(parsePeso(null), null);
});

// ── scoreLead + tiers ────────────────────────────────────────────────────────
test('HOT: big ticket + ASAP + wants a system + known industry', () => {
  const r = scoreLead({
    q1_business: 'Real estate developer',
    q2_need: 'Gusto ko ng buong system / automation',
    q3_ticket: '1.5M per closed sale',
    q4_timeline: 'ASAP, ngayon na',
  });
  assert.deepEqual(r.breakdown, { ticket: 45, timeline: 30, need: 25, industry: 10 });
  assert.equal(r.score, 110);
  assert.equal(r.tier, 'HOT');
  assert.equal(stageForTier(r.tier), 'qualified');
});

test('WARM: mid ticket + 1-2 months + wants leads', () => {
  const r = scoreLead({
    q1_business: 'Small online store',
    q2_need: 'Kailangan ko ng leads at ads',
    q3_ticket: '50,000',
    q4_timeline: 'maybe next month',
  });
  assert.equal(r.breakdown.ticket, 20);
  assert.equal(r.breakdown.timeline, 15);
  assert.equal(r.breakdown.need, 15);
  assert.equal(r.tier, 'WARM');
  assert.equal(stageForTier(r.tier), 'new');
});

test('NOT_FIT: tiny ticket, no urgency, vague need', () => {
  const r = scoreLead({
    q1_business: 'sari-sari',
    q2_need: 'tanong lang',
    q3_ticket: '500',
    q4_timeline: 'someday',
  });
  assert.ok(r.score < 30);
  assert.equal(r.tier, 'NOT_FIT');
  assert.equal(stageForTier(r.tier), 'cold');
});

test('tierFor honors the 70 / 30 thresholds', () => {
  assert.equal(tierFor(70), 'HOT');
  assert.equal(tierFor(69), 'WARM');
  assert.equal(tierFor(30), 'WARM');
  assert.equal(tierFor(29), 'NOT_FIT');
});

// ── channelOf dispatch (email regression guard) ──────────────────────────────
test('channelOf keeps email payloads on the email path', () => {
  // Original email shape — must NOT be captured by the messenger branch.
  assert.equal(channelOf({ from: 'Juan <juan@gmail.com>', subject: 'Re', text: 'hi', messageId: '<a@b>' }), 'email');
  assert.equal(channelOf({}), 'email');
  // Messenger shapes.
  assert.equal(channelOf({ channel: 'messenger', psid: '123', text: 'hi' }), 'messenger');
  assert.equal(channelOf({ psid: '123' }), 'messenger');
});

// ── handleMessengerInbound with a fake repo ──────────────────────────────────
function fakeRepo(overrides: Partial<MessengerRepo> = {}) {
  const calls = { messages: [] as any[], leads: [] as any[], activities: [] as any[], states: [] as any[] };
  const repo: MessengerRepo = {
    async messageExists() {
      return false;
    },
    async findLeadByPsid() {
      return null;
    },
    async createLead({ name, psid }) {
      const lead = { id: 'lead-1', name, stage: 'new' };
      calls.leads.push({ name, psid });
      return lead;
    },
    async ensureConversationState(psid, leadId) {
      calls.states.push({ psid, leadId });
    },
    async insertMessage(msg) {
      calls.messages.push(msg);
      return {};
    },
    async insertActivity(a) {
      calls.activities.push(a);
    },
    ...overrides,
  };
  return { repo, calls };
}

test('inbound: new PSID creates a lead and logs the message', async () => {
  const { repo, calls } = fakeRepo();
  const res = await handleMessengerInbound(repo, { channel: 'messenger', psid: 'PSID9', name: 'Ana', text: 'hello', mid: 'm1' });
  assert.equal(res.status, 200);
  assert.equal(res.json.created, true);
  assert.equal(calls.leads.length, 1);
  assert.equal(calls.leads[0].psid, 'PSID9');
  assert.equal(calls.messages.length, 1);
  assert.equal(calls.messages[0].channel, 'messenger');
  assert.equal(calls.messages[0].direction, 'inbound');
  assert.equal(calls.messages[0].external_id, 'm1');
  assert.equal(calls.activities.length, 1);
});

test('inbound: duplicate mid is skipped (no insert)', async () => {
  const { repo, calls } = fakeRepo({ messageExists: async () => true });
  const res = await handleMessengerInbound(repo, { channel: 'messenger', psid: 'PSID9', text: 'again', mid: 'm1' });
  assert.equal(res.json.duplicate, true);
  assert.equal(calls.messages.length, 0);
  assert.equal(calls.leads.length, 0);
});

test('inbound: missing psid → 400', async () => {
  const { repo } = fakeRepo();
  const res = await handleMessengerInbound(repo, { channel: 'messenger', text: 'x' });
  assert.equal(res.status, 400);
});

test('inbound: outbound bot message logs no "lead replied" activity', async () => {
  const { repo, calls } = fakeRepo({ findLeadByPsid: async () => ({ id: 'L', name: 'Ana', stage: 'new' }) });
  await handleMessengerInbound(repo, { channel: 'messenger', psid: 'p', text: 'Kumusta!', direction: 'outbound', mid: 'b1' });
  assert.equal(calls.messages[0].direction, 'outbound');
  assert.equal(calls.activities.length, 0);
});

// ── Meta signature verification ──────────────────────────────────────────────
test('verifyMetaSignature accepts a correct sha256 and rejects tampering', () => {
  const secret = 'app-secret-xyz';
  const body = JSON.stringify({ object: 'page', entry: [] });
  const good = 'sha256=' + crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex');
  assert.equal(verifyMetaSignature(body, good, secret), true);
  assert.equal(verifyMetaSignature(body + 'x', good, secret), false); // tampered body
  assert.equal(verifyMetaSignature(body, good, 'wrong-secret'), false);
  assert.equal(verifyMetaSignature(body, null, secret), false);
  assert.equal(verifyMetaSignature(body, 'md5=abc', secret), false);
});

// ── Internal key auth ────────────────────────────────────────────────────────
test('hasInternalKey compares against INTERNAL_API_KEY and fails closed', () => {
  const prev = process.env.INTERNAL_API_KEY;
  process.env.INTERNAL_API_KEY = 'topsecret';
  assert.equal(hasInternalKey('topsecret'), true);
  assert.equal(hasInternalKey('nope'), false);
  assert.equal(hasInternalKey(null), false);
  delete process.env.INTERNAL_API_KEY;
  assert.equal(hasInternalKey('topsecret'), false); // unset → closed
  if (prev !== undefined) process.env.INTERNAL_API_KEY = prev;
});

// ── AI agent: prompt + slot-merge (pure) ─────────────────────────────────────
test('buildSystemPrompt grounds the agent in Vertex knowledge + rules', () => {
  const sp = buildSystemPrompt();
  assert.match(sp, /Vertex AI Marketing/);
  assert.match(sp, /SERVICES:/);
  assert.match(sp, /Taglish/);
  assert.match(sp, /Do NOT quote any price/i);
});

test('buildConversationPrompt shows known slots + the latest message', () => {
  const p = buildConversationPrompt(
    [{ direction: 'inbound', body: 'hi' }, { direction: 'outbound', body: 'Kumusta!' }],
    { business: 'dental clinic', need: null, ticket: null, timeline: null },
    'magkano po?',
  );
  assert.match(p, /business: dental clinic/);
  assert.match(p, /need: \(unknown\)/);
  assert.match(p, /Customer: hi/);
  assert.match(p, /Vertex: Kumusta!/);
  assert.match(p, /magkano po\?/);
});

test('mergeExtracted only fills non-empty slots and maps to columns', () => {
  const current: AgentExtracted = { business: 'clinic', need: null, ticket: null, timeline: null };
  const { patch, merged } = mergeExtracted(current, { business: null, need: 'leads', ticket: '  ', timeline: 'ASAP' });
  // business unchanged (extraction was null) → not in patch, kept in merged
  assert.equal(patch.q1_business, undefined);
  assert.equal(merged.business, 'clinic');
  // need + timeline are new → patched with column names
  assert.equal(patch.q2_need, 'leads');
  assert.equal(patch.q4_timeline, 'ASAP');
  // blank ticket ignored
  assert.equal(patch.q3_ticket, undefined);
  assert.equal(merged.ticket, null);
});

test('allSlotsFilled is true only when all four are known', () => {
  assert.equal(allSlotsFilled({ business: 'a', need: 'b', ticket: 'c', timeline: 'd' }), true);
  assert.equal(allSlotsFilled({ business: 'a', need: 'b', ticket: null, timeline: 'd' }), false);
});

// ── Persuasion skill ─────────────────────────────────────────────────────────
test('system prompt carries persuasion + objection handling (ethical)', () => {
  const sp = buildSystemPrompt();
  assert.match(sp, /PERSUASION/);
  assert.match(sp, /OBJECTION HANDLING/);
  assert.match(sp, /too expensive|mahal/i);
  assert.match(sp, /no fake scarcity|no fake testimonials|invented stats/i);
});

test('buildFollowupPrompt writes a re-engagement nudge with context', () => {
  const p = buildFollowupPrompt([{ direction: 'outbound', body: 'Kumusta!' }], { business: 'resort' }, 1);
  assert.match(p, /follow-up/i);
  assert.match(p, /nudge #1/);
  assert.match(p, /business: resort/);
});

// ── Follow-up eligibility (24h window safe) ──────────────────────────────────
const MIN = 60_000;
const HOUR = 3_600_000;
const now = Date.parse('2026-07-11T12:00:00Z');

test('dueForFollowup: quiet 90 min, in-window, no nudges yet → due', () => {
  assert.equal(
    dueForFollowup(
      { state: 'CHAT', followups_sent: 0, last_inbound_at: new Date(now - 90 * MIN).toISOString(), updated_at: new Date(now - 90 * MIN).toISOString() },
      now,
    ),
    true,
  );
});

test('dueForFollowup: only 30 min of silence → not yet', () => {
  assert.equal(
    dueForFollowup(
      { state: 'CHAT', followups_sent: 0, last_inbound_at: new Date(now - 30 * MIN).toISOString(), updated_at: new Date(now - 30 * MIN).toISOString() },
      now,
    ),
    false,
  );
});

test('dueForFollowup: outside the 24h window → never', () => {
  assert.equal(
    dueForFollowup(
      { state: 'CHAT', followups_sent: 0, last_inbound_at: new Date(now - (WINDOW_HOURS + 1) * HOUR).toISOString(), updated_at: new Date(now - 2 * HOUR).toISOString() },
      now,
    ),
    false,
  );
});

test('dueForFollowup: cap + terminal states respected', () => {
  const base = { last_inbound_at: new Date(now - 2 * HOUR).toISOString(), updated_at: new Date(now - 2 * HOUR).toISOString() };
  assert.equal(dueForFollowup({ ...base, state: 'CHAT', followups_sent: MAX_FOLLOWUPS }, now), false); // cap hit
  assert.equal(dueForFollowup({ ...base, state: 'DONE', followups_sent: 0 }, now), false); // qualified
  assert.equal(dueForFollowup({ ...base, state: 'HUMAN', followups_sent: 0 }, now), false); // human-owned
});

test('dueForFollowup: second nudge needs 6h of silence', () => {
  const anchor = new Date(now - 8 * HOUR).toISOString();
  // 2h since last activity, already sent 1 → not yet (needs 6h)
  assert.equal(dueForFollowup({ state: 'CHAT', followups_sent: 1, last_inbound_at: anchor, updated_at: new Date(now - 2 * HOUR).toISOString() }, now), false);
  // 7h since last activity, still in-window (anchor 8h < 23h) → due
  assert.equal(dueForFollowup({ state: 'CHAT', followups_sent: 1, last_inbound_at: anchor, updated_at: new Date(now - 7 * HOUR).toISOString() }, now), true);
});
