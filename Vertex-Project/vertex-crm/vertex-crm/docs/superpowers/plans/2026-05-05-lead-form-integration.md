# Lead Form Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a visitor submits the landing page lead form, they are added to the CRM Leads tab instantly (source: `landing_page`) and a copy is stored in the Landing Page Leads tab.

**Architecture:** A new public POST endpoint `/api/inbound-lead` (API-key-gated) receives the form submission, writes two rows in parallel — one to the Leads tab via service account, one to the Landing Page Leads tab — then returns `{ success: true }`. The landing page HTML swaps its fetch target from the Apps Script URL to this endpoint.

**Tech Stack:** Next.js App Router Route Handler, `googleapis` (service account), `crypto.timingSafeEqual`, TypeScript

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/lib/google.ts` | Upgrade service account scope to read+write |
| Modify | `src/lib/sheets.ts` | Add `appendInboundLead()`, `appendLandingLead()`, `parsePlanValue()` |
| Create | `src/app/api/inbound-lead/route.ts` | Public POST endpoint with API key auth + CORS |
| Modify | `public/vertex-ai-marketing.html` | Swap fetch target + add API key header |
| Env var | Vercel dashboard | Add `INBOUND_LEAD_API_KEY` |

---

## Task 1: Upgrade service account scope to read+write

The service account currently uses `spreadsheets.readonly`. It must be able to append rows.

**Files:**
- Modify: `src/lib/google.ts:46-53`

- [ ] **Step 1: Update the scope**

In `src/lib/google.ts`, change the `getSheetsServiceClient` function:

```typescript
// ─── Google Sheets (Service Account — for landing page sheet) ────────────────
export async function getSheetsServiceClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key:  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth })
}
```

- [ ] **Step 2: Grant service account Editor access on the CRM sheet**

Open the Google Sheet at `process.env.GOOGLE_SHEET_ID` → Share → add the service account email (`GOOGLE_SERVICE_ACCOUNT_EMAIL` env var value) as **Editor**.

- [ ] **Step 3: Commit**

```bash
git add src/lib/google.ts
git commit -m "fix(google): upgrade service account scope to sheets read+write"
```

---

## Task 2: Add sheet helpers to `src/lib/sheets.ts`

Add three exports: a private helper `parsePlanValue`, and two public appenders.

**Files:**
- Modify: `src/lib/sheets.ts`

- [ ] **Step 1: Update the import on line 1 of `sheets.ts`** to include `getSheetsServiceClient`

```typescript
import { getSheetsClient, getSheetsServiceClient } from './google'
```

- [ ] **Step 2: Add `LANDING_TAB` constant** (after the existing tab constants, line ~8)

```typescript
const LANDING_TAB = process.env.GOOGLE_SHEET_LANDING_LEADS_TAB || 'Landing Page Leads'
```

- [ ] **Step 3: Add `parsePlanValue` helper and `appendInboundLead`** — paste at the end of `sheets.ts`

```typescript
// ─── Inbound lead helpers (used by /api/inbound-lead) ────────────────────────

function parsePlanValue(plan: string): number {
  if (plan.includes('4,999')) return 4999
  if (plan.includes('2,499')) return 2499
  if (plan.includes('999'))   return 999
  return 0
}

export async function appendInboundLead(data: {
  name:          string
  email:         string
  mobile:        string
  business:      string
  plan:          string
  preferredDate: string
}): Promise<void> {
  const sheets    = await getSheetsServiceClient()
  const now       = new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })
  const painPoints = [
    data.plan          && `Plan: ${data.plan}`,
    data.preferredDate && `Preferred Date: ${data.preferredDate}`,
  ].filter(Boolean).join(' | ')

  await sheets.spreadsheets.values.append({
    spreadsheetId:    SHEET_ID,
    range:            `${LEADS_TAB}!A:P`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [COLS.map(col => {
        switch (col) {
          case 'name':                 return data.name
          case 'email':                return data.email
          case 'phone':                return data.mobile
          case 'company':              return data.business
          case 'industry':             return ''
          case 'pain_points':          return painPoints
          case 'ai_score':             return '0'
          case 'suggested_automation': return ''
          case 'estimated_roi':        return ''
          case 'outreach_hook':        return ''
          case 'status':               return 'new'
          case 'estimated_value':      return String(parsePlanValue(data.plan))
          case 'source':               return 'landing_page'
          case 'created_at':           return now
          case 'last_contacted':       return ''
          default:                     return ''
        }
      })],
    },
  })
}
```

- [ ] **Step 4: Add `appendLandingLead`** — paste immediately after `appendInboundLead`

```typescript
export async function appendLandingLead(data: {
  name:          string
  email:         string
  mobile:        string
  business:      string
  plan:          string
  preferredDate: string
}): Promise<void> {
  const sheets    = await getSheetsServiceClient()
  const timestamp = new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })

  await sheets.spreadsheets.values.append({
    spreadsheetId:    SHEET_ID,
    range:            `${LANDING_TAB}!A:G`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[
        timestamp,
        data.name,
        data.mobile,
        data.email,
        data.business,
        data.plan,
        data.preferredDate,
      ]],
    },
  })
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /Users/lukash0915/Vertex-Project/vertex-crm/vertex-crm
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/sheets.ts
git commit -m "feat(sheets): add appendInboundLead and appendLandingLead helpers"
```

---

## Task 3: Create `/api/inbound-lead` route

**Files:**
- Create: `src/app/api/inbound-lead/route.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/app/api/inbound-lead/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { appendInboundLead, appendLandingLead } from '@/lib/sheets'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
}

/** Preflight for cross-origin requests from the static landing page */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

/** POST /api/inbound-lead — receive landing page form submission */
export async function POST(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const apiKey   = req.headers.get('x-api-key') ?? ''
    const validKey = process.env.INBOUND_LEAD_API_KEY ?? ''
    let   keyValid = false
    if (apiKey && validKey) {
      const a = Buffer.from(apiKey,   'utf-8')
      const b = Buffer.from(validKey, 'utf-8')
      keyValid = a.length === b.length && timingSafeEqual(a, b)
    }
    if (!keyValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS })
    }

    // ── Validation ────────────────────────────────────────────────────────────
    const body = await req.json()
    const { name, email, mobile, business, plan = '', preferredDate = '' } = body

    if (!name || !email || !mobile || !business) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, mobile, business' },
        { status: 400, headers: CORS },
      )
    }

    // ── Write to both tabs in parallel ────────────────────────────────────────
    await Promise.all([
      appendInboundLead({ name, email, mobile, business, plan, preferredDate }),
      appendLandingLead({ name, email, mobile, business, plan, preferredDate }),
    ])

    return NextResponse.json({ success: true }, { headers: CORS })

  } catch (err: unknown) {
    // Log server-side but always return success — don't penalise the visitor
    console.error('[API /inbound-lead POST]', err instanceof Error ? err.message : err)
    return NextResponse.json({ success: true }, { headers: CORS })
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/inbound-lead/route.ts
git commit -m "feat(api): add /api/inbound-lead public endpoint with API key auth"
```

---

## Task 4: Add `INBOUND_LEAD_API_KEY` to Vercel

- [ ] **Step 1: Generate a strong secret**

```bash
openssl rand -hex 32
```

Copy the output — this is your `INBOUND_LEAD_API_KEY` value.

- [ ] **Step 2: Add to Vercel**

```bash
vercel env add INBOUND_LEAD_API_KEY production
# paste the value when prompted
```

Or via Vercel dashboard: Project → Settings → Environment Variables → add `INBOUND_LEAD_API_KEY` for Production.

- [ ] **Step 3: Note the key value** — you will need it in Task 5 for the landing page HTML.

---

## Task 5: Update the landing page HTML

The landing page is at `/Users/lukash0915/public/vertex-ai-marketing.html` (served as a static file by the Next.js project) and at `/Users/lukash0915/Desktop/vertex-ai-marketing.html`.

**Files:**
- Modify: `/Users/lukash0915/public/vertex-ai-marketing.html`

- [ ] **Step 1: Replace `SCRIPT_URL` and add `INBOUND_KEY`**

Find this line in the `<script>` block:
```javascript
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzVIixseiZ0wavLokauIKCe-jEl3dR1HHC2Z6UI0sLz2KrbfAf3WriZtJdnz_3MNKU7XA/exec';
```

Replace with:
```javascript
const SCRIPT_URL  = 'https://vertex-crm-two.vercel.app/api/inbound-lead';
const INBOUND_KEY = 'PASTE_YOUR_INBOUND_LEAD_API_KEY_HERE';
```

- [ ] **Step 2: Update the `submitModal` fetch call**

Find:
```javascript
await fetch(SCRIPT_URL, {
  method: 'POST',
  mode: 'no-cors',
  headers: { 'Content-Type': 'text/plain' },
  body: JSON.stringify({ name, mobile, email, business, plan, preferredDate: date }),
});
```

Replace with:
```javascript
await fetch(SCRIPT_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': INBOUND_KEY,
  },
  body: JSON.stringify({ name, mobile, email, business, plan, preferredDate: date }),
});
```

- [ ] **Step 3: Copy to Desktop**

```bash
cp /Users/lukash0915/public/vertex-ai-marketing.html /Users/lukash0915/Desktop/vertex-ai-marketing.html
```

- [ ] **Step 4: Commit**

```bash
cd /Users/lukash0915
git add public/vertex-ai-marketing.html
git commit -m "feat(landing): wire lead form to CRM inbound-lead endpoint"
```

---

## Task 6: Deploy and verify end-to-end

- [ ] **Step 1: Deploy the CRM to Vercel**

```bash
cd /Users/lukash0915/Vertex-Project/vertex-crm/vertex-crm
vercel --prod
```

- [ ] **Step 2: Smoke-test the endpoint**

```bash
curl -s -X POST https://vertex-crm-two.vercel.app/api/inbound-lead \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_KEY_HERE" \
  -d '{"name":"Test Lead","email":"test@test.com","mobile":"+63 912 345 6789","business":"Test Biz","plan":"Standard Business Ready — ₱2,499","preferredDate":"2026-05-10"}'
```

Expected response:
```json
{ "success": true }
```

- [ ] **Step 3: Verify Google Sheet rows**

Open the CRM Google Sheet and confirm:
- A new row appeared in the **Leads** tab with `source = landing_page`, `status = new`, `estimated_value = 2499`
- A new row appeared in the **Landing Page Leads** tab with all 7 columns populated

- [ ] **Step 4: Test from the landing page**

Open `/Users/lukash0915/public/vertex-ai-marketing.html` in a browser, fill in the lead form, submit. Confirm the same rows appear in both sheet tabs.

- [ ] **Step 5: Commit any final fixes, then push**

```bash
git add -A
git commit -m "chore: post-deploy verification fixes (if any)"
vercel --prod
```
