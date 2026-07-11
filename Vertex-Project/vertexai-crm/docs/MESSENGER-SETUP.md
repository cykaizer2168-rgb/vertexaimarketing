# Vertex Messenger Engine — Setup

Facebook Messenger AI sales agent. A Meta webhook feeds the CRM, which verifies
the signature and forwards to n8n; n8n relays each message to the CRM's AI agent
endpoint. The agent introduces Vertex, answers product questions in Taglish, and
naturally learns the four qualifying signals — then the CRM scores the lead
**deterministically** and routes it into the pipeline.

```
FB Messenger
   │  (message)
   ▼
Meta → POST /api/meta/webhook        ← CRM verifies X-Hub-Signature-256
   │  (raw event, forwarded)
   ▼
n8n  "Messenger Engine" webhook
   ├─ POST /api/messages/inbound      (channel:messenger — logs to CRM inbox, creates lead)
   ├─ POST /api/messenger/agent       (AI turn: reply + slot extraction)   [x-vertex-key]
   │        loads state + last ~12 messages → generateObject(OPENAI_MODEL, Vertex KB)
   │        merges business/need/ticket/timeline; on all-4-known → scoreLead()
   │        → HOT→qualified(+handoff)  WARM→new(drip)  NOT_FIT→cold
   └─ POST graph.facebook.com/v21.0/me/messages   (bot reply, Send API)

HOT lead_qualified webhook ─► n8n "Handoff Recovery" ─► Telegram claim + 20-min escalation
```

The AI writes the reply and fills the four slots; it does **not** decide the
tier — `lib/messenger-score.ts` does that from unit economics, so qualification
stays objective and testable. `GET /api/leads/by-psid/:psid` and
`PATCH /api/conversation-state/:psid` remain available (manual/scripted use);
the agent endpoint is the live conversational path.

## Scoring (in the CRM, `lib/messenger-score.ts`)

| Signal | Rule | Points |
|---|---|---|
| Ticket (value of ONE closed sale) | ≥ ₱1M / ₱100k–1M / ₱20k–100k | 45 / 40 / 20 |
| Timeline | ASAP / 1–2 months | 30 / 15 |
| Need | wants a system/automation / wants leads or ads | 25 / 15 |
| Industry | recognized high-ticket vertical | 10 |

**Tiers:** HOT ≥ 70 → `qualified` (fires handoff) · WARM 30–69 → stays `new` (follow-up drip) · NOT_FIT < 30 → `cold`.

---

## 1. Database migration

Run `docs/supabase-messenger.sql` in the Supabase SQL editor. It adds the
`conversation_state` table and `leads.psid`. A reversible DOWN block is included
at the bottom of the file.

## 2. CRM environment variables

Add to `.env.local` (see `.env.example`):

| Var | Purpose |
|---|---|
| `INTERNAL_API_KEY` | Shared secret for `x-vertex-key` on internal endpoints. Long random hex. |
| `META_VERIFY_TOKEN` | Any string; also pasted into the Meta webhook config. |
| `META_APP_SECRET` | Meta App Secret — used to verify `X-Hub-Signature-256`. |
| `N8N_MESSENGER_WEBHOOK_URL` | The n8n "Messenger Engine" webhook URL (see step 4). |
| `FACEBOOK_PAGE_ID` / `FACEBOOK_PAGE_ACCESS_TOKEN` | Page identity (n8n uses the token to send replies). |
| `OPENAI_API_KEY` | Powers the AI agent (already used elsewhere in the CRM). |
| `OPENAI_MODEL` | Model for the agent, e.g. `gpt-4o-mini` (default) — set a newer model here without code changes. |

## 3. Meta App configuration

1. In the Meta App dashboard → **Messenger → Settings**, add your Page and
   generate a **Page Access Token** → `FACEBOOK_PAGE_ACCESS_TOKEN`.
2. **Webhooks** → callback URL `https://<your-crm>/api/meta/webhook`,
   verify token = `META_VERIFY_TOKEN`. Meta calls `GET` once; the handshake
   echoes `hub.challenge` when the token matches.
3. Subscribe the Page to the **`messages`** field (and `messaging_postbacks`
   if you use buttons).
4. Copy the **App Secret** → `META_APP_SECRET`.

> The CRM always answers Meta with a fast `200`; a bad signature returns `401`,
> a missing `META_APP_SECRET` returns `500` (fails closed — never accepts
> unverified events).

## 4. Import the n8n workflows

Import these files from `docs/n8n/`:

- `messenger-engine.json` — the AI agent conversation flow.
- `handoff-recovery.json` — HOT-lead claim + escalation.
- `messenger-followup.json` — schedule (every 15 min) → hits the follow-up cron.

Set these **n8n environment variables** (Settings → Variables, or host env) so
no secrets live in the workflow JSON:

| n8n var | Value |
|---|---|
| `CRM_BASE_URL` | `https://<your-crm>` (no trailing slash) |
| `INTERNAL_API_KEY` | same value as the CRM's `INTERNAL_API_KEY` |
| `FB_PAGE_TOKEN` | the Page Access Token |
| `TELEGRAM_CHAT_ID` | sales team chat id |

Attach your Telegram credential to the Telegram nodes. Then:

- Copy the **Messenger Engine** production webhook URL into the CRM's
  `N8N_MESSENGER_WEBHOOK_URL`.
- Point the CRM's `N8N_STAGE_WEBHOOK_URL` (or add an HTTP node in your existing
  stage workflow) at the **Handoff Recovery** webhook so `lead_qualified`
  events reach it. It ignores every non-qualified event, so it is safe to
  share the stage feed.

Activate both workflows.

## 5. Agent persona & knowledge base

The agent's product knowledge lives in **`lib/vertex-kb.ts`** — services, value
props, and a short FAQ. Edit it to add your exact packages and pricing. Until
you fill in prices, the agent will not quote a number; it uses the FAQ pricing
answer and offers a quick call. Tone and behavior rules live in
`buildSystemPrompt()` (`lib/messenger-agent.ts`).

**Persuasion / closing.** `lib/vertex-persuasion.ts` holds the ethical influence
playbook (value framing, social proof, gentle urgency) and an objection-handling
guide ("mahal", "isipin ko pa", "may agency na kami", etc.). It is folded into
the agent's system prompt, so replies stay convincing without fake scarcity,
invented stats, or pressure. Edit it to tune the sales approach.

## 5b. Follow-up nudges (24-hour window)

If a lead goes quiet mid-conversation, the CRM sends a persuasive re-engagement
message — **only inside Meta's 24-hour window** (`lib/messenger-followup.ts`:
first nudge after ~1h of silence, a second after ~6h, max 2, and never past
~23h from the customer's last message). The cron endpoint is
`GET /api/messenger/followup/run` (protect with `CRON_SECRET`; supports
`?dryRun=1`). Trigger it from the imported `messenger-followup.json` schedule,
Vercel Cron, or any scheduler. Sends use `FACEBOOK_PAGE_ACCESS_TOKEN` directly.
Qualified (`DONE`) and human-owned (`HUMAN`) conversations are never nudged.

## 6. HARD RULE — 24-hour window

The Send API only replies inside Meta's **24-hour standard messaging window**.
The bot answers reactively (each reply is a response to a fresh user message),
so it stays inside the window by design. Do **not** add delayed/scheduled Send
API messages outside 24h without an approved message tag.

## 7. Test it

1. **Webhook handshake:** hit `GET /api/meta/webhook?hub.mode=subscribe&hub.verify_token=<token>&hub.challenge=42`
   → responds `42`.
2. **Signature:** `POST /api/meta/webhook` without a valid `X-Hub-Signature-256`
   → `401`.
3. **End-to-end:** message the Page. The agent introduces Vertex, answers
   questions, and naturally works out your business/need/ticket/timeline. Check
   the CRM: the lead appears with `lead_source='messenger'`, the thread shows
   both sides of the chat, and once all four are known the pipeline stage
   reflects the tier (HOT → Qualified).
4. **Follow-ups:** `GET /api/messenger/followup/run?dryRun=1` (with the cron
   secret) lists who *would* be nudged without sending.
5. **Unit tests:** `npm test` (23 tests — scoring, dedupe, signature, auth,
   email-path regression, agent prompt + slot-merge, persuasion, follow-up
   window rules).
