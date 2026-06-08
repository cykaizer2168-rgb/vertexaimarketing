# AI Outreach + Lead-Gen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "AI Outreach" feature that scrapes Google Maps B2B prospects (via n8n + Oxylabs), stages them for review, generates Claude-written outreach messages per business type + product, and converts approved prospects into leads.

**Architecture:** CRM page triggers an n8n webhook → Oxylabs scrapes Google Maps + enriches emails → posts a batch to a CRM ingest endpoint → prospects land in a staging table → user reviews, composes AI messages, and approves into `leads`. Inbound replies keep using the existing n8n inbox.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Supabase (`@supabase/supabase-js` admin + `@supabase/ssr` browser), Tailwind v4, lucide-react, Vercel AI SDK (`ai`) via Vercel AI Gateway (`anthropic/claude-sonnet-4.6` — gateway slug uses dots), n8n + Oxylabs AI Studio.

**Verification note:** This project has **no test runner** (`CLAUDE.md`). Each task verifies via `npx tsc --noEmit`, `curl` probes against the deployed endpoint, and SQL checks through the Supabase service key — the established workflow for this repo. Env loading in commands: `set -a && . ./.env.local && set +a`.

**Working directory:** all paths are relative to `/Users/lukash0915/BalconySolarPH`. Git repo root is `/Users/lukash0915` (home dir) on `main`; create a feature branch before the first commit.

---

## Phase 1 — Database + Ingest

### Task 1: `prospects` staging table

**Files:**
- Create: `docs/supabase-prospects.sql`

- [ ] **Step 1: Write the migration**

```sql
-- AI Outreach: staging table for scraped Google Maps prospects.
-- Run in Supabase SQL Editor: https://app.supabase.com -> SQL Editor

create table if not exists prospects (
  id            uuid default gen_random_uuid() primary key,
  created_at    timestamptz default now(),
  name          text not null,
  phone         text,
  website       text,
  email         text,
  address       text,
  area          text,
  business_type text,
  product       text,
  source        text default 'oxylabs_gmaps',
  source_url    text,
  external_id   text,
  ai_subject    text,
  ai_body       text,
  status        text default 'new',     -- new | approved | dismissed
  lead_id       uuid
);

-- Dedupe key (NULLs distinct, so blank ids never collide) — mirrors messages.external_id
create unique index if not exists prospects_external_id_key on prospects (external_id);

-- CRM dashboard reads via anon; writes happen via service role on the server.
alter table prospects enable row level security;
create policy "Allow anon read prospects" on prospects for select using (true);
```

- [ ] **Step 2: Apply it**

Run the SQL in the Supabase SQL Editor (paste from the file). It is idempotent.

- [ ] **Step 3: Verify the table + column exist**

Run:
```bash
set -a && . ./.env.local && set +a
curl -s -w "\nHTTP %{http_code}\n" "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/prospects?select=id,external_id,status&limit=1" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```
Expected: `HTTP 200` and `[]` (empty array).

- [ ] **Step 4: Commit**

```bash
git add BalconySolarPH/docs/supabase-prospects.sql
git commit -m "feat(outreach): add prospects staging table migration"
```

---

### Task 2: `Prospect` type

**Files:**
- Modify: `lib/supabase.ts` (append after the `Activity` interface)

- [ ] **Step 1: Add the type**

```typescript
export interface Prospect {
  id: string;
  created_at: string;
  name: string;
  phone: string | null;
  website: string | null;
  email: string | null;
  address: string | null;
  area: string | null;
  business_type: string | null;
  product: string | null;
  source: string;
  source_url: string | null;
  external_id: string | null;
  ai_subject: string | null;
  ai_body: string | null;
  status: 'new' | 'approved' | 'dismissed';
  lead_id: string | null;
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add BalconySolarPH/lib/supabase.ts
git commit -m "feat(outreach): add Prospect type"
```

---

### Task 3: `POST /api/leads/import` — batch ingest from n8n

**Files:**
- Create: `app/api/leads/import/route.ts`

- [ ] **Step 1: Write the route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-admin';

// Receives a batch of scraped prospects from the n8n "Prospect Scraper" workflow.
// Auth: shared secret. Dedupes against existing prospects (external_id) and leads
// (phone/website/name) before inserting with status='new'.
type IncomingProspect = {
  name?: string;
  phone?: string;
  website?: string;
  email?: string;
  address?: string;
  sourceUrl?: string;
  externalId?: string;
};

function normPhone(p?: string | null) {
  return (p ?? '').replace(/\D/g, '');
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-import-secret') ?? new URL(req.url).searchParams.get('secret');
  if (!process.env.OUTREACH_IMPORT_SECRET || secret !== process.env.OUTREACH_IMPORT_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { product, businessType, area, prospects } = body as {
    product?: string; businessType?: string; area?: string; prospects?: IncomingProspect[];
  };
  if (!Array.isArray(prospects)) {
    return NextResponse.json({ error: 'prospects[] required' }, { status: 400 });
  }

  const sb = createAdminSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  // Pull existing dedupe keys once.
  const { data: existingLeads } = await sb.from('leads').select('name, mobile');
  const leadPhones = new Set((existingLeads ?? []).map((l) => normPhone(l.mobile)).filter(Boolean));
  const leadNames = new Set((existingLeads ?? []).map((l) => (l.name ?? '').trim().toLowerCase()).filter(Boolean));

  let inserted = 0;
  let skipped = 0;

  for (const p of prospects) {
    const name = (p.name ?? '').trim();
    if (!name) { skipped++; continue; }
    const externalId = (p.externalId ?? '').trim()
      || `${name.toLowerCase().replace(/\s+/g, '-')}|${normPhone(p.phone)}`;

    // Dedupe vs existing leads
    if ((normPhone(p.phone) && leadPhones.has(normPhone(p.phone))) || leadNames.has(name.toLowerCase())) {
      skipped++; continue;
    }

    const { error } = await sb.from('prospects').insert({
      name,
      phone: p.phone ?? null,
      website: p.website ?? null,
      email: p.email ?? null,
      address: p.address ?? null,
      area: area ?? null,
      business_type: businessType ?? null,
      product: product ?? null,
      source: 'oxylabs_gmaps',
      source_url: p.sourceUrl ?? null,
      external_id: externalId,
      status: 'new',
    });
    if (error) {
      // 23505 = duplicate external_id (already imported) -> count as skipped, not a failure
      if (error.code === '23505') { skipped++; continue; }
      skipped++; continue;
    }
    inserted++;
  }

  return NextResponse.json({ inserted, skipped });
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Add the env var locally + on Vercel**

```bash
echo 'OUTREACH_IMPORT_SECRET="<generate-a-long-random-string>"' >> .env.local
npx vercel env add OUTREACH_IMPORT_SECRET production   # paste the same value
```

- [ ] **Step 4: Deploy + verify dedupe/insert end-to-end**

```bash
npx vercel --prod --yes
set -a && . ./.env.local && set +a
EP="https://balcony-solar-ph.vercel.app/api/leads/import"
# Unauthorized check
curl -s -o /dev/null -w "no-secret HTTP %{http_code}\n" -X POST "$EP" -H "Content-Type: application/json" -d '{"prospects":[]}'
# Authorized insert
curl -s -X POST "$EP" -H "Content-Type: application/json" -H "x-import-secret: $OUTREACH_IMPORT_SECRET" \
  -d '{"product":"Balcony Solar Kit 800W","businessType":"Resto/cafe","area":"Makati","prospects":[{"name":"Plan Test Cafe","phone":"0917 000 0000","website":"https://example.com","externalId":"plan-test-cafe|09170000000"}]}'
# Duplicate -> should skip
curl -s -X POST "$EP" -H "Content-Type: application/json" -H "x-import-secret: $OUTREACH_IMPORT_SECRET" \
  -d '{"prospects":[{"name":"Plan Test Cafe","externalId":"plan-test-cafe|09170000000"}]}'
```
Expected: first `HTTP 401`; second `{"inserted":1,"skipped":0}`; third `{"inserted":0,"skipped":1}`.

- [ ] **Step 5: Clean up the test row**

```bash
curl -s -X DELETE "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/prospects?external_id=eq.plan-test-cafe%7C09170000000" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H "Prefer: return=representation"
```
Expected: returns the deleted row (array of length 1).

- [ ] **Step 6: Commit**

```bash
git add BalconySolarPH/app/api/leads/import/route.ts
git commit -m "feat(outreach): batch prospect ingest endpoint with dedupe"
```

---

### Task 4: `POST /api/outreach/approve` — convert prospects to leads

**Files:**
- Create: `app/api/outreach/approve/route.ts`

- [ ] **Step 1: Write the route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-admin';

// Converts staged prospects into real leads. Idempotent per prospect:
// already-approved prospects are skipped.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { prospectIds } = body as { prospectIds?: string[] };
  if (!Array.isArray(prospectIds) || prospectIds.length === 0) {
    return NextResponse.json({ error: 'prospectIds[] required' }, { status: 400 });
  }

  const sb = createAdminSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { data: rows } = await sb.from('prospects').select('*').in('id', prospectIds);
  let converted = 0;

  for (const p of rows ?? []) {
    if (p.status === 'approved' && p.lead_id) continue;
    const { data: lead, error } = await sb.from('leads').insert({
      name: p.name,
      mobile: p.phone ?? '',
      email: p.email ?? '',
      location: p.area ?? '',
      message: p.business_type ? `${p.business_type} — ${p.address ?? ''}`.trim() : (p.address ?? ''),
      stage: 'new',
      lead_source: 'oxylabs_gmaps',
      sequence_status: 'queued',
      notes: p.website ? `Website: ${p.website}` : null,
    }).select('id').single();
    if (error || !lead) continue;
    await sb.from('prospects').update({ status: 'approved', lead_id: lead.id }).eq('id', p.id);
    converted++;
  }

  return NextResponse.json({ converted });
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Deploy + verify a prospect converts to a lead**

```bash
npx vercel --prod --yes
set -a && . ./.env.local && set +a
URL="$NEXT_PUBLIC_SUPABASE_URL"; KEY="$SUPABASE_SERVICE_ROLE_KEY"
# seed a prospect
curl -s -X POST "https://balcony-solar-ph.vercel.app/api/leads/import" -H "Content-Type: application/json" \
  -H "x-import-secret: $OUTREACH_IMPORT_SECRET" \
  -d '{"businessType":"Resto/cafe","area":"Makati","prospects":[{"name":"Approve Test Resto","phone":"0917 111 1111","externalId":"approve-test|09171111111"}]}' >/dev/null
PID=$(curl -s "$URL/rest/v1/prospects?external_id=eq.approve-test%7C09171111111&select=id" -H "apikey: $KEY" -H "Authorization: Bearer $KEY" | python3 -c "import sys,json;print(json.load(sys.stdin)[0]['id'])")
# approve
curl -s -X POST "https://balcony-solar-ph.vercel.app/api/outreach/approve" -H "Content-Type: application/json" -d "{\"prospectIds\":[\"$PID\"]}"
# verify a lead now exists with that source
curl -s "$URL/rest/v1/leads?lead_source=eq.oxylabs_gmaps&name=eq.Approve%20Test%20Resto&select=id,name,lead_source" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
```
Expected: `{"converted":1}`, then a leads row with `lead_source":"oxylabs_gmaps"`.

- [ ] **Step 4: Clean up test rows**

```bash
curl -s -X DELETE "$URL/rest/v1/leads?lead_source=eq.oxylabs_gmaps&name=eq.Approve%20Test%20Resto" -H "apikey: $KEY" -H "Authorization: Bearer $KEY" -H "Prefer: return=representation" | python3 -c "import sys,json;print('leads deleted:',len(json.load(sys.stdin)))"
curl -s -X DELETE "$URL/rest/v1/prospects?external_id=eq.approve-test%7C09171111111" -H "apikey: $KEY" -H "Authorization: Bearer $KEY" -H "Prefer: return=representation" | python3 -c "import sys,json;print('prospects deleted:',len(json.load(sys.stdin)))"
```

- [ ] **Step 5: Commit**

```bash
git add BalconySolarPH/app/api/outreach/approve/route.ts
git commit -m "feat(outreach): approve endpoint converts prospects to leads"
```

---

## Phase 2 — n8n Prospect Scraper

### Task 5: n8n workflow (Webhook → Oxylabs → POST)

**Files:**
- Create: `docs/n8n/prospect-scraper-code-node.js`
- Create: `docs/n8n/generate-prospect-scraper-workflow.js`
- Generated: `docs/n8n/balcony-prospect-scraper-workflow.json`

- [ ] **Step 1: Write the normalize Code node**

```javascript
// docs/n8n/prospect-scraper-code-node.js
// Normalizes Oxylabs Google Maps results -> { product, businessType, area, prospects[] }
// for the CRM /api/leads/import endpoint. n8n Code node, "Run Once for All Items".
//
// Expects the webhook body (product, type, area) to be available on the first item's
// json via $('Webhook').first().json.body, and Oxylabs results in $input.

const wh = $('Webhook').first().json.body || {};
const product = wh.product || '';
const businessType = wh.type || '';
const area = wh.area || '';

// Oxylabs result shape varies by node; handle the common "organic/local" arrays.
const items = $input.all();
const out = [];

for (const item of items) {
  const d = item.json;
  const results =
    d?.results ||
    d?.data?.results ||
    d?.local_results ||
    (Array.isArray(d) ? d : [d]);

  for (const r of (results || [])) {
    const name = r.title || r.name || r.business_name;
    if (!name) continue;
    out.push({
      name: String(name),
      phone: r.phone || r.phone_number || null,
      website: r.website || r.url || null,
      email: r.email || null, // filled by a later enrichment node if present
      address: r.address || r.formatted_address || null,
      sourceUrl: r.link || r.url || r.website || null,
      externalId: r.place_id || r.cid || `${String(name).toLowerCase().replace(/\s+/g,'-')}|${(r.phone||'').replace(/\D/g,'')}`,
    });
  }
}

return [{ json: { product, businessType, area, prospects: out } }];
```

- [ ] **Step 2: Write the generator**

```javascript
// docs/n8n/generate-prospect-scraper-workflow.js
// Run: node generate-prospect-scraper-workflow.js
const fs = require('fs');
const path = require('path');

const jsCode = fs.readFileSync(path.join(__dirname, 'prospect-scraper-code-node.js'), 'utf8');

const workflow = {
  name: 'Balcony Solar PH — Prospect Scraper (Oxylabs Google Maps)',
  nodes: [
    {
      parameters: {
        httpMethod: 'POST',
        path: 'balcony-prospect-scraper',
        responseMode: 'lastNode',
        options: {},
      },
      id: 'webhook-001',
      name: 'Webhook',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2,
      position: [240, 400],
    },
    {
      // Placeholder HTTP call to Oxylabs AI Studio / Web Scraper API.
      // Configure during implementation against the live Oxylabs node/credentials
      // (Search or Scraper with a Google Maps query: "{{type}} in {{area}}").
      parameters: {
        method: 'POST',
        url: 'https://realtime.oxylabs.io/v1/queries',
        authentication: 'genericCredentialType',
        sendBody: true,
        specifyBody: 'json',
        jsonBody:
          '={{ JSON.stringify({ source: "google_maps", query: ($json.body.type + " in " + $json.body.area), pages: 1, parse: true }) }}',
        options: {},
      },
      id: 'oxylabs-002',
      name: 'Oxylabs Google Maps',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [480, 400],
    },
    {
      parameters: { jsCode },
      id: 'normalize-003',
      name: 'Normalize',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [720, 400],
    },
    {
      parameters: {
        method: 'POST',
        url: 'https://balcony-solar-ph.vercel.app/api/leads/import',
        sendHeaders: true,
        headerParameters: { parameters: [{ name: 'x-import-secret', value: '={{ $env.OUTREACH_IMPORT_SECRET }}' }] },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: '={{ JSON.stringify($json) }}',
        options: {},
      },
      id: 'send-004',
      name: 'Send to CRM',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [960, 400],
    },
  ],
  connections: {
    Webhook: { main: [[{ node: 'Oxylabs Google Maps', type: 'main', index: 0 }]] },
    'Oxylabs Google Maps': { main: [[{ node: 'Normalize', type: 'main', index: 0 }]] },
    Normalize: { main: [[{ node: 'Send to CRM', type: 'main', index: 0 }]] },
  },
  settings: { executionOrder: 'v1' },
  active: false,
};

const outPath = path.join(__dirname, 'balcony-prospect-scraper-workflow.json');
fs.writeFileSync(outPath, JSON.stringify(workflow, null, 2));
console.log('Prospect scraper workflow written to:', outPath);
```

- [ ] **Step 3: Generate + sanity-check the JSON**

Run:
```bash
cd docs/n8n && node generate-prospect-scraper-workflow.js && python3 -m json.tool balcony-prospect-scraper-workflow.json >/dev/null && echo "valid JSON" && cd -
```
Expected: "Prospect scraper workflow written to: …" then "valid JSON".

- [ ] **Step 4: Import + wire in n8n (manual)**

Import `balcony-prospect-scraper-workflow.json` into n8n. Replace the placeholder
"Oxylabs Google Maps" HTTP node with the **Oxylabs AI Studio** node (Search/Scraper)
using the Hostinger credits credential; query = `{{ $json.body.type }} in {{ $json.body.area }}`.
Optionally add an enrichment branch: for items with a website, an Oxylabs Scraper node
that fetches the site and a regex node extracting `info@/contact@`. Set the n8n env
`OUTREACH_IMPORT_SECRET` to match the CRM. Copy the Webhook **Production URL**. Activate.

- [ ] **Step 5: End-to-end verify (manual trigger)**

```bash
set -a && . ./.env.local && set +a
curl -s -X POST "<n8n-webhook-production-url>" -H "Content-Type: application/json" \
  -d '{"type":"Resto/cafe","area":"Makati","product":"Balcony Solar Kit 800W","limit":5}'
# then confirm rows arrived
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/prospects?order=created_at.desc&limit=5&select=name,phone,website,email,business_type" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | python3 -m json.tool
```
Expected: real Makati cafes appear in `prospects`.

- [ ] **Step 6: Commit**

```bash
git add BalconySolarPH/docs/n8n/prospect-scraper-code-node.js BalconySolarPH/docs/n8n/generate-prospect-scraper-workflow.js BalconySolarPH/docs/n8n/balcony-prospect-scraper-workflow.json
git commit -m "feat(outreach): n8n prospect scraper workflow (Oxylabs Google Maps)"
```

---

## Phase 3 — Outreach Page + Review UI

### Task 6: `useProspects` data hook

**Files:**
- Create: `lib/use-prospects.ts`

- [ ] **Step 1: Write the hook**

```typescript
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { type Prospect } from './supabase';
import { createBrowserSupabase } from './supabase-browser';

export function useProspects() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createBrowserSupabase(), []);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('prospects')
      .select('*')
      .eq('status', 'new')
      .order('created_at', { ascending: false });
    setProspects((data as Prospect[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetch(); }, [fetch]);

  return { prospects, loading, refetch: fetch };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add BalconySolarPH/lib/use-prospects.ts
git commit -m "feat(outreach): useProspects hook"
```

---

### Task 7: Outreach page (controls + trigger + review table)

**Files:**
- Create: `app/crm/outreach/page.tsx`
- Create: `app/api/outreach/scrape/route.ts` (CRM → n8n trigger proxy, keeps the webhook URL/secret server-side)
- Modify: `components/crm/sidebar.tsx:18` (add nav item after "Projects")

- [ ] **Step 1: Write the trigger proxy route**

```typescript
// app/api/outreach/scrape/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Server-side proxy so the n8n webhook URL/secret never reaches the browser.
export async function POST(req: NextRequest) {
  const hook = process.env.N8N_PROSPECT_WEBHOOK_URL;
  if (!hook) return NextResponse.json({ error: 'Scraper not configured' }, { status: 500 });
  const body = await req.json().catch(() => ({}));
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 25000);
    const res = await fetch(hook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(t);
    return NextResponse.json({ triggered: res.ok });
  } catch (err) {
    console.error('[outreach/scrape] trigger failed:', err);
    return NextResponse.json({ triggered: false, error: 'trigger failed' }, { status: 502 });
  }
}
```

- [ ] **Step 2: Add the env var**

```bash
echo 'N8N_PROSPECT_WEBHOOK_URL="<n8n-webhook-production-url>"' >> .env.local
npx vercel env add N8N_PROSPECT_WEBHOOK_URL production   # paste same value
```

- [ ] **Step 3: Write the page**

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Search, Sparkles, Check, X, Phone, Mail, Copy } from 'lucide-react';
import { useProspects } from '@/lib/use-prospects';

const TYPES = ['Resto/cafe', 'Retail/shops', 'Offices/clinics', 'Hotels/inns'];
const AREAS = ['Makati', 'BGC / Taguig', 'Ortigas / Pasig', 'Quezon City', 'Manila'];
const PRODUCTS = ['Balcony Solar Kit 800W', 'Balcony Solar Kit 1.6kW', 'Custom Quote'];

export default function OutreachPage() {
  const { prospects, loading, refetch } = useProspects();
  const [type, setType] = useState(TYPES[0]);
  const [area, setArea] = useState(AREAS[0]);
  const [product, setProduct] = useState(PRODUCTS[0]);
  const [limit, setLimit] = useState(25);
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<Record<string, { subject: string; body: string; loading?: boolean }>>({});

  const toggle = (id: string) =>
    setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  async function findProspects() {
    setBusy(true);
    await fetch('/api/outreach/scrape', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, area, product, limit }),
    }).catch(() => {});
    // n8n is async; give it a moment then refresh.
    setTimeout(() => { refetch(); setBusy(false); }, 6000);
  }

  async function compose(id: string, name: string, btype: string | null) {
    setDrafts((d) => ({ ...d, [id]: { subject: '', body: '', loading: true } }));
    const res = await fetch('/api/outreach/compose', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessName: name, businessType: btype ?? type, product }),
    }).then((r) => r.json()).catch(() => null);
    setDrafts((d) => ({ ...d, [id]: { subject: res?.subject ?? 'Error', body: res?.body ?? 'Compose failed — try again.', loading: false } }));
  }

  async function approve() {
    if (sel.size === 0) return;
    await fetch('/api/outreach/approve', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prospectIds: [...sel] }),
    }).catch(() => {});
    setSel(new Set());
    refetch();
  }

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-4 h-[50px] flex items-center gap-2 shrink-0">
        <span className="flex-1 text-[14px] font-semibold text-gray-800">AI Outreach</span>
        <button onClick={refetch} className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer text-gray-500">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <Link href="/crm" className="flex items-center gap-1 text-[12px] border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-gray-700"><ArrowLeft className="w-3.5 h-3.5" />Back</Link>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Search controls */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-end gap-3">
          <Field label="Business type"><Select value={type} onChange={setType} options={TYPES} /></Field>
          <Field label="Area"><Select value={area} onChange={setArea} options={AREAS} /></Field>
          <Field label="Product"><Select value={product} onChange={setProduct} options={PRODUCTS} /></Field>
          <Field label="Count">
            <input type="number" min={5} max={100} value={limit} onChange={(e) => setLimit(+e.target.value)}
              className="text-[12px] border border-gray-200 rounded-lg px-2 py-1.5 w-20 text-gray-700" />
          </Field>
          <button onClick={findProspects} disabled={busy}
            className="flex items-center gap-1.5 text-[12px] bg-amber-500 text-white rounded-lg px-4 py-2 hover:bg-amber-600 disabled:opacity-50 cursor-pointer">
            <Search className="w-3.5 h-3.5" />{busy ? 'Finding…' : 'Find Prospects'}
          </button>
        </div>

        {/* Review table */}
        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200">
            <span className="text-[12px] font-semibold text-gray-700">Prospects to review ({prospects.length})</span>
            <button onClick={approve} disabled={sel.size === 0}
              className="flex items-center gap-1 text-[12px] border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40 cursor-pointer text-gray-700">
              <Check className="w-3.5 h-3.5" />Approve selected ({sel.size}) → Leads
            </button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-[12px] text-gray-400"><RefreshCw className="w-4 h-4 animate-spin mr-2" />Loading…</div>
          ) : prospects.length === 0 ? (
            <div className="py-16 text-center text-[12px] text-gray-400">Wala pang prospects — mag-&quot;Find Prospects&quot; sa itaas.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {prospects.map((p) => {
                const draft = drafts[p.id];
                return (
                  <li key={p.id} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <input type="checkbox" checked={sel.has(p.id)} onChange={() => toggle(p.id)} className="mt-1 cursor-pointer" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-gray-800">{p.name}</div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-3 mt-0.5">
                          <span>{p.area ?? ''}</span>
                          {p.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.phone}</span>}
                          {p.email
                            ? <span className="flex items-center gap-1 text-green-600"><Mail className="w-3 h-3" />{p.email}</span>
                            : <span className="text-amber-600">call/FB only</span>}
                        </div>
                        {draft && (
                          <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                            {draft.loading ? <span className="text-[11px] text-gray-400">✨ Composing…</span> : (
                              <>
                                <div className="text-[11px] font-semibold text-gray-700">{draft.subject}</div>
                                <pre className="text-[11px] text-gray-600 whitespace-pre-wrap font-sans mt-1">{draft.body}</pre>
                                <button onClick={() => navigator.clipboard.writeText(`${draft.subject}\n\n${draft.body}`)}
                                  className="mt-1.5 flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-700 cursor-pointer"><Copy className="w-3 h-3" />Copy</button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <button onClick={() => compose(p.id, p.name, p.business_type)}
                        className="flex items-center gap-1 text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 cursor-pointer text-gray-700 shrink-0">
                        <Sparkles className="w-3 h-3" />{draft ? 'Regenerate' : 'AI message'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1"><span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">{label}</span>{children}</label>;
}
function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="text-[12px] border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 bg-white cursor-pointer">
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
```

- [ ] **Step 4: Add the sidebar nav item**

In `components/crm/sidebar.tsx`, add after the Projects entry (line ~18). Ensure `Megaphone` is imported from `lucide-react` in the existing import block at the top of the file.

```tsx
  { label: 'AI Outreach',     href: '/crm/outreach',   icon: Megaphone,       badge: null },
```

- [ ] **Step 5: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: exit 0; `/crm/outreach` shows in the build route list.

- [ ] **Step 6: Deploy + eyeball**

```bash
npx vercel --prod --yes
```
Open `https://balcony-solar-ph.vercel.app/crm/outreach`: controls render, the review table loads existing `new` prospects, "Find Prospects" triggers without error.

- [ ] **Step 7: Commit**

```bash
git add BalconySolarPH/app/crm/outreach/page.tsx BalconySolarPH/app/api/outreach/scrape/route.ts BalconySolarPH/components/crm/sidebar.tsx
git commit -m "feat(outreach): outreach page, scrape trigger proxy, sidebar nav"
```

---

## Phase 4 — AI Composer

### Task 8: `POST /api/outreach/compose` (Claude via Vercel AI Gateway)

**Files:**
- Modify: `package.json` (add `ai` dependency)
- Create: `app/api/outreach/compose/route.ts`

> **Before coding:** consult the `claude-api` and `vercel:ai-sdk` skills + context7 for the current `ai` package `generateText` signature and AI Gateway model-string usage — the SDK API changes often. The code below is the expected shape; adjust to the verified current API.

- [ ] **Step 1: Install the AI SDK**

```bash
npm install ai
```

- [ ] **Step 2: Write the route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';

// Generates a short B2B solar outreach message tailored to the business type +
// product. Uses Claude via the Vercel AI Gateway (model string "provider/model").
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { businessName, businessType, product } = body as {
    businessName?: string; businessType?: string; product?: string;
  };
  if (!businessName) return NextResponse.json({ error: 'businessName required' }, { status: 400 });

  const system = [
    'Ikaw ay sales rep ng Balcony Solar PH na nagbebenta ng murang plug-in solar sa maliliit na negosyo sa Pilipinas.',
    'Sumulat ng maikli (80-120 words), magalang, Taglish na cold outreach email.',
    'Naka-angkop sa uri ng negosyo ang benepisyo (hal. resto = bawas sa kuryente ng aircon/kitchen).',
    'Banggitin ang produkto. Magtapos ng simpleng call-to-action (libreng assessment).',
    'Output format EXACTLY:\nSUBJECT: <one line>\nBODY:\n<body>',
  ].join(' ');

  const prompt = `Business: ${businessName}\nType: ${businessType ?? 'SMB'}\nProduct: ${product ?? 'Balcony Solar Kit'}`;

  try {
    const { text } = await generateText({
      model: 'anthropic/claude-sonnet-4.6',
      system,
      prompt,
      maxOutputTokens: 400,
    });
    const subjMatch = text.match(/SUBJECT:\s*(.+)/i);
    const bodyMatch = text.match(/BODY:\s*([\s\S]+)/i);
    const subject = (subjMatch?.[1] ?? 'Solar savings para sa inyong negosyo').trim();
    const bodyText = (bodyMatch?.[1] ?? text).trim();
    return NextResponse.json({ subject, body: bodyText });
  } catch (err) {
    console.error('[outreach/compose] failed:', err);
    return NextResponse.json({ error: 'compose failed' }, { status: 502 });
  }
}
```

- [ ] **Step 3: Configure AI Gateway auth (prefer OIDC)**

Preferred: in production on Vercel the AI SDK authenticates to the AI Gateway via
the project's **OIDC token automatically** — no key to rotate. For local dev, pull
the OIDC token instead of hardcoding a key:

```bash
npx vercel link        # once, if not linked
npx vercel env pull .env.local   # refreshes VERCEL_OIDC_TOKEN for local AI Gateway auth
```

Fallback only if you cannot use OIDC (e.g., a non-Vercel host): set an explicit key.
```bash
echo 'AI_GATEWAY_API_KEY="<vercel-ai-gateway-key>"' >> .env.local
npx vercel env add AI_GATEWAY_API_KEY production
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 5: Deploy + verify a real composition**

```bash
npx vercel --prod --yes
curl -s -X POST "https://balcony-solar-ph.vercel.app/api/outreach/compose" -H "Content-Type: application/json" \
  -d '{"businessName":"Juan'\''s Cafe","businessType":"Resto/cafe","product":"Balcony Solar Kit 800W"}' | python3 -m json.tool
```
Expected: JSON with non-empty `subject` and a Taglish `body` mentioning solar savings for a cafe.

- [ ] **Step 6: Verify in the UI**

Open `/crm/outreach`, click **AI message** on a prospect → a tailored draft appears; **Regenerate** and **Copy** work.

- [ ] **Step 7: Commit**

```bash
git add BalconySolarPH/package.json BalconySolarPH/package-lock.json BalconySolarPH/app/api/outreach/compose/route.ts
git commit -m "feat(outreach): AI composer endpoint (Claude via AI Gateway)"
```

---

## Final verification (whole feature)
- [ ] Trigger a real scrape from `/crm/outreach` → prospects appear (deduped).
- [ ] Compose AI messages for a few → tailored Taglish drafts.
- [ ] Approve a couple → matching `leads` rows with `lead_source='oxylabs_gmaps'`.
- [ ] Re-run the same scrape → no duplicate prospects/leads.
- [ ] Confirm the n8n inbound inbox still logs replies (unchanged).
- [ ] Optional: dismiss flow (`status='dismissed'`) if added later (YAGNI for now).
