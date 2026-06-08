# AI Outreach + Lead-Gen — Design Spec

**Date:** 2026-06-08
**Project:** Balcony Solar PH CRM (`BalconySolarPH`)
**Status:** Approved design → ready for implementation plan

## 1. Overview

A single CRM feature ("AI Outreach") that finds new B2B prospects from Google
Maps, stages them for review, and generates AI-written outreach messages
tailored to each business type and the product being pitched. It combines
lead-generation (web scraping via Oxylabs) with AI copywriting (Claude), while
keeping unqualified data out of the main pipeline through a staging/review step.

The feature targets local Philippine SMBs (restaurants, retail, offices, hotels)
as solar prospects. Because Google Maps exposes phone + website but **not**
email, outreach is **hybrid**: email where it can be enriched, phone/FB
otherwise — with a ready-to-use AI message in both cases.

## 2. Goals / Non-goals

### Goals
- Let the user pick **business type + area + product**, then fetch a list of
  matching businesses from Google Maps.
- Best-effort **email enrichment** by scraping each business website.
- Stage results in a **review area**; nothing enters the real pipeline until
  approved. Auto-dedup against existing leads.
- Generate a **personalized AI outreach message** per prospect (subject + body),
  conditioned on business type + product.
- Approved prospects become real `leads` (`lead_source = 'oxylabs_gmaps'`).

### Non-goals (explicitly out of scope for this iteration)
- Bulk email blasting / campaign analytics (parked: "Email Marketing").
- Automated cold-email sending at volume (deliverability + Data Privacy Act risk;
  see §9). Email sending, when added, goes through Resend with a warmed domain.
- Changing the inbound reply path — the existing n8n Gmail→CRM inbox stays as-is.
- B2C / condo-resident scraping.

## 3. Architecture

```
CRM /crm/outreach  ──POST {type, area, product, limit}──▶  n8n Webhook
                                                              │
                                          Oxylabs AI Studio (Google Maps search)
                                                              │
                                   (for businesses with a website)
                                          Oxylabs Scraper → find public email
                                                              │
                                          normalize → batch
                                                              ▼
CRM  ◀──POST /api/leads/import (batch of prospects)── n8n HTTP node
  │
  ├─ store in `prospects` (staging, deduped)
  ├─ /crm/outreach renders review table
  ├─ /api/outreach/compose → Claude (Vercel AI Gateway) → subject + body
  └─ Approve → copy row into `leads`
```

Scraping runs through **n8n + Oxylabs AI Studio** (free Oxylabs credits via the
user's Hostinger/OpenClaw plan; native Oxylabs node in n8n). The CRM triggers a
run on demand via an n8n **Webhook** node. n8n posts results back to the CRM.

Rationale: reuses infrastructure the user already runs (n8n on Hostinger) and the
free AI Studio credits, avoiding a separate paid Oxylabs API account. Lead-gen is
batch/async, so the n8n dependency is acceptable here (unlike the real-time inbox).

## 4. Components

Each unit has one purpose and a defined interface.

### 4.1 `prospects` table (Supabase) — staging store
Holds scraped businesses awaiting review. Converted into `leads` on approval.

| column | type | notes |
|---|---|---|
| id | uuid pk | `gen_random_uuid()` |
| created_at | timestamptz | `now()` |
| name | text not null | business name |
| phone | text | from Google Maps |
| website | text | from Google Maps |
| email | text | enriched from website, nullable |
| address | text | from Google Maps |
| area | text | search area used |
| business_type | text | search type used |
| product | text | product targeted in the run |
| source | text | default `'oxylabs_gmaps'` |
| source_url | text | Google Maps / website URL |
| external_id | text | dedupe key (place id or normalized phone+name) |
| ai_subject | text | cached AI draft, nullable |
| ai_body | text | cached AI draft, nullable |
| status | text | `new` \| `approved` \| `dismissed`; default `new` |
| lead_id | uuid | set when approved/converted, nullable |

- Unique index on `external_id` (NULLs distinct) to prevent re-import dupes,
  mirroring the `messages.external_id` dedupe pattern already in the codebase.

### 4.2 `POST /api/leads/import` — batch ingest (called by n8n)
- Auth: shared secret (`OUTREACH_IMPORT_SECRET`) via header or query, matching the
  existing `/api/messages/inbound` style of trusted-webhook ingestion.
- Body: `{ product, businessType, area, prospects: [{ name, phone, website,
  email, address, sourceUrl, externalId }] }`.
- Behavior: for each prospect, dedupe (skip if `external_id` already in
  `prospects` OR a matching `leads` row by phone/website/name); insert the rest
  with `status='new'`. Returns `{ inserted, skipped }`.

### 4.3 `POST /api/outreach/compose` — AI message generator
- Input: `{ prospectId }` (or `{ businessType, product, businessName }`).
- Calls Claude via **Vercel AI Gateway** (model string `anthropic/claude-sonnet-4-6`
  by default — good quality/cost for short copy). System prompt frames it as a
  Balcony Solar PH sales rep writing a concise, friendly Taglish/English B2B pitch
  tailored to the business type, referencing the product's benefit (e.g. offset
  aircon/kitchen load for restos).
- Output: `{ subject, body }`. Caches into `prospects.ai_subject/ai_body`.
- Default: one draft per (business_type + product), personalized with the
  business name; user can regenerate per prospect.

### 4.4 `/crm/outreach` — page + review UI
- Controls: business type, area, product, count → **Find Prospects** (fires the
  n8n webhook, then polls/refreshes the `prospects` list).
- Review table: each prospect shows contact channel (✉️ email vs ☎️ phone/FB), an
  **AI message** expander (compose/regenerate, copy-to-clipboard), and checkboxes.
- Actions: **Approve selected → Leads** (convert), **Dismiss**.

### 4.5 n8n "Prospect Scraper" workflow
- **Webhook** trigger receives `{ type, area, product, limit, callbackSecret }`.
- **Oxylabs AI Studio** node (Search/Scraper) queries Google Maps: `"{type} in {area}"`.
- For results with a website: **Oxylabs Scraper** node fetches the site and
  extracts a public email (regex for `mailto:` / `info@`/`contact@`).
- **Code** node normalizes to the import shape and builds `externalId`.
- **HTTP Request** node POSTs the batch to `/api/leads/import` with the secret.
- Generated + stored under `docs/n8n/` like the existing workflows, with a
  generator script for reproducibility.

## 5. Data flow (happy path)
1. User sets type=Resto/cafe, area=Makati, product=Balcony Solar Kit 800W, count=25.
2. CRM POSTs to the n8n webhook.
3. n8n queries Oxylabs Google Maps → 25 businesses (name/phone/website/address).
4. n8n enriches emails for those with websites.
5. n8n POSTs the batch to `/api/leads/import`.
6. CRM dedupes + inserts into `prospects` (`status='new'`).
7. `/crm/outreach` shows the new prospects; user composes AI messages.
8. User approves → rows copied into `leads`; `prospects.status='approved'`,
   `lead_id` set.

## 6. API contracts (summary)
- `POST /api/leads/import` → `{ inserted: number, skipped: number }`
- `POST /api/outreach/compose` → `{ subject: string, body: string }`
- `POST /api/outreach/approve` `{ prospectIds: string[] }` → `{ converted: number }`
  (converts prospects to leads; also handles dedupe vs existing leads)

## 7. Dedup strategy
- Import time: skip if `prospects.external_id` exists, or a `leads` row matches by
  normalized phone, or website host, or exact name+area.
- `external_id` = Google Maps place id when available, else
  `slug(name)+'|'+normalizedPhone`.

## 8. Error handling
- n8n run failure: `/crm/outreach` shows "scrape failed / no results"; user can retry.
- Oxylabs returns a business with no website: skip enrichment, mark phone-only.
- `compose` LLM failure: surface an inline error + retry button; never block the
  review table.
- `import` partial failures: per-row try/catch; return counts; never 500 the whole
  batch for one bad row.

## 9. Security & compliance
- `/api/leads/import` protected by `OUTREACH_IMPORT_SECRET` (env, set on CRM + n8n).
- The **n8n webhook trigger** is itself protected by a secret path/header token so
  it cannot be triggered by third parties (it spends Oxylabs credits). The CRM
  holds this token in `N8N_PROSPECT_WEBHOOK_URL` / an accompanying secret.
- Service-role Supabase stays server-only (existing `createAdminSupabase`).
- **Data Privacy Act + deliverability:** only public business contact data is
  collected. Email outreach is secondary, throttled, and deferred to a warmed
  Resend domain — no cold bulk blasting from `vertexconsultingpartner.com`. Primary
  outreach is warm (call/FB/contact-form) using the AI-drafted message.

## 10. Env vars (new)
- `N8N_PROSPECT_WEBHOOK_URL` — CRM → n8n trigger.
- `OUTREACH_IMPORT_SECRET` — shared secret for `/api/leads/import`.
- `AI_GATEWAY_API_KEY` (or Vercel AI Gateway OIDC) — for the compose route.
- Oxylabs AI Studio credentials live in **n8n** (via Hostinger credits), not the CRM.

## 11. Build phases
1. **DB + import** — `prospects` table (SQL migration) + `/api/leads/import` + dedupe.
2. **n8n scraper** — Webhook → Oxylabs (Maps + email enrich) → POST; generator script.
3. **Outreach page** — `/crm/outreach` UI: search controls, trigger, review table,
   approve/dismiss + `/api/outreach/approve`.
4. **AI composer** — `/api/outreach/compose` (Claude via AI Gateway) + UI wiring,
   caching, regenerate.

Each phase is independently shippable and testable.

## 12. Success criteria
- A search returns ≥1 deduped prospect into the review table within one run.
- Approving a prospect creates a matching `leads` row with `lead_source='oxylabs_gmaps'`.
- Compose returns a business-type-appropriate subject + body and caches it.
- No duplicate prospect/lead is created on a repeated run (dedupe holds).
- Inbound reply pipeline (n8n inbox) is unaffected.

## 13. Open questions (decide during planning)
- Exact Oxylabs AI Studio node config for Google Maps (Search vs Scraper vs
  Browser Agent) — confirm during Phase 2 against the live n8n node.
- AI message language default (Taglish vs English) and tone — confirm with user;
  default Taglish-leaning, professional.
- Per-prospect compose vs per-(type+product) template reuse — default template
  reuse with name personalization to save credits/tokens.
