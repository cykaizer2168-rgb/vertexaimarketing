# n8n Meta Ads Auto-Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add API key auth to `GET /api/ad-metrics` so n8n can read CPL thresholds, and create an importable n8n workflow that pulls Meta Ads metrics hourly, evaluates CPL/budget rules, pauses violating ad sets, and writes results to Google Sheets.

**Architecture:** The CRM exposes thresholds via `GET /api/ad-metrics` with `x-api-key` header auth (no Google OAuth needed from n8n). The n8n workflow runs hourly: fetch thresholds → fetch Meta ad sets + insights → merge + evaluate two auto-pause rules → append all rows to Google Sheets "Ad Metrics" tab → pause violating ad sets via Meta API → POST `ad_set_paused` event to CRM webhook URL.

**Tech Stack:** Next.js 14 App Router (TypeScript), n8n v1.x workflow JSON, Meta Graph API v19.0, Google Sheets API via n8n credential.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/app/api/ad-metrics/route.ts` | Accept `x-api-key` header in GET handler alongside existing session auth |
| Modify | `.env.local` | Add `CRM_N8N_SECRET` shared secret |
| Modify | `.env.local.example` | Document `CRM_N8N_SECRET` |
| Create | `n8n/workflows/meta-ads-optimization.json` | Importable n8n workflow — 10 nodes, full logic |

---

## Task 1: Add `CRM_N8N_SECRET` env var

**Files:**
- Modify: `.env.local`
- Modify: `.env.local.example`

- [ ] **Step 1: Generate a random 32-character hex secret**

Run in terminal:
```bash
openssl rand -hex 16
```

Copy the output (looks like `a3f9b2c1...`). This is your `CRM_N8N_SECRET`.

- [ ] **Step 2: Add the secret to `.env.local`**

Open `.env.local` and append below the `NEXT_PUBLIC_ADMIN_EMAIL` line:

```bash
# ─── n8n ↔ CRM shared secret ─────────────────────────────────────────────────
# n8n sends this in x-api-key header when calling GET /api/ad-metrics
CRM_N8N_SECRET=<paste-your-generated-secret-here>
```

- [ ] **Step 3: Document in `.env.local.example`**

Open `.env.local.example` and add after the existing `# ─── n8n Webhook` block:

```bash
# ─── n8n → CRM auth ──────────────────────────────────────────────────────────
# Shared secret: n8n sends this as x-api-key when reading CPL thresholds.
# Generate with: openssl rand -hex 16
# Must match CRM_N8N_SECRET set in n8n's environment variables.
CRM_N8N_SECRET=your-32-char-hex-secret
```

- [ ] **Step 4: Commit**

```bash
git add .env.local.example
git commit -m "docs: document CRM_N8N_SECRET env var for n8n auth"
```

> **Note:** `.env.local` is gitignored — do not add it to the commit.

---

## Task 2: Add API key auth to `GET /api/ad-metrics`

**Files:**
- Modify: `src/app/api/ad-metrics/route.ts`

The current GET handler only accepts `getServerSession`. n8n has no Google session — it uses the `x-api-key` header instead. PATCH stays session-only.

- [ ] **Step 1: Update the GET handler signature and auth check**

Open `src/app/api/ad-metrics/route.ts`. Replace:

```ts
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

With:

```ts
export async function GET(req: NextRequest) {
  try {
    const session  = await getServerSession(authOptions)
    const apiKey   = req.headers.get('x-api-key')
    const validKey = process.env.CRM_N8N_SECRET

    if (!session && !(validKey && apiKey === validKey)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
```

The file already imports `NextRequest` — no new imports needed.

- [ ] **Step 2: Verify the file looks correct**

Full file after edit:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile } from 'fs/promises'
import { getAdMetrics } from '@/lib/sheets'
import { readSettings, SETTINGS_PATH } from '@/lib/settings'

/** GET /api/ad-metrics — fetch all ad metrics + current thresholds */
export async function GET(req: NextRequest) {
  try {
    const session  = await getServerSession(authOptions)
    const apiKey   = req.headers.get('x-api-key')
    const validKey = process.env.CRM_N8N_SECRET

    if (!session && !(validKey && apiKey === validKey)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [metrics, settings] = await Promise.all([getAdMetrics(), readSettings()])
    return NextResponse.json({ metrics, thresholds: settings.adThresholds })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[API /ad-metrics GET]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** PATCH /api/ad-metrics — save per-campaign CPL threshold */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { campaignId, threshold } = await req.json()
    if (!campaignId || typeof threshold !== 'number') {
      return NextResponse.json({ error: 'Missing campaignId or threshold' }, { status: 400 })
    }

    const current = await readSettings()
    const updated = {
      ...current,
      adThresholds: { ...current.adThresholds, [campaignId]: threshold },
    }
    await writeFile(SETTINGS_PATH, JSON.stringify(updated, null, 2), 'utf-8')
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[API /ad-metrics PATCH]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 3: Manually verify auth works**

Start dev server if not running: `npm run dev`

**Test 1 — no auth → 401:**
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/ad-metrics
```
Expected: `401`

**Test 2 — wrong key → 401:**
```bash
curl -s -o /dev/null -w "%{http_code}" \
  -H "x-api-key: wrong-key" \
  http://localhost:3000/api/ad-metrics
```
Expected: `401`

**Test 3 — correct key → 200:**
```bash
CRM_N8N_SECRET_VALUE=$(grep CRM_N8N_SECRET .env.local | cut -d= -f2)
curl -s -w "\n%{http_code}" \
  -H "x-api-key: $CRM_N8N_SECRET_VALUE" \
  http://localhost:3000/api/ad-metrics
```
Expected: `200` with JSON body `{ "metrics": [...], "thresholds": {...} }`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/ad-metrics/route.ts
git commit -m "feat: add API key auth to GET /api/ad-metrics for n8n access"
```

---

## Task 3: Create n8n workflow JSON

**Files:**
- Create: `n8n/workflows/meta-ads-optimization.json`

This is the importable n8n workflow. It contains 10 nodes:

| # | Node | Type |
|---|------|------|
| 1 | Schedule Trigger | `scheduleTrigger` — every hour |
| 2 | Get CRM Thresholds | `httpRequest` — GET /api/ad-metrics with x-api-key |
| 3 | Get Meta Ad Sets | `httpRequest` — Graph API adsets endpoint |
| 4 | Get Meta Insights | `httpRequest` — Graph API insights endpoint |
| 5 | Merge + Evaluate Rules | `code` — join data, evaluate CPL + budget rules |
| 6 | Prepare Sheet Rows | `code` — spread allMetrics into individual items |
| 7 | Append to Google Sheets | `googleSheets` — append all ad set rows |
| 8 | Extract Pause Actions | `code` — extract toAction; returns 0 items if none (stops flow) |
| 9 | Pause Ad Set | `httpRequest` — POST to Meta API to pause |
| 10 | Notify CRM Webhook | `httpRequest` — POST ad_set_paused event to CRM |

**Data flow detail:**
- Node 5 outputs one item: `{ allMetrics: AdMetricRow[], toAction: { adSetId, campaignId, adSetName, reason }[] }`
- Node 5 pre-sets `status = 'paused_auto'` on rows that will be paused, so Google Sheets gets the correct status in one write
- Node 8 returns `[]` when `toAction` is empty → nodes 9 and 10 are skipped automatically

**Rule evaluation in Node 5:**
- Rule 1: `cpl > thresholds[campaignId]` (skipped if no threshold set for that campaign)
- Rule 2: `spend / daily_budget >= 0.8 AND leads === 0` (daily_budget divided by 100 — Meta returns cents)
- Both rules evaluated; Rule 1 takes priority if both fire simultaneously for the same ad set

- [ ] **Step 1: Create the `n8n/workflows/` directory**

```bash
mkdir -p n8n/workflows
```

- [ ] **Step 2: Create the workflow JSON file**

Create `n8n/workflows/meta-ads-optimization.json` with this exact content:

```json
{
  "name": "Meta Ads Auto-Optimization",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "hours",
              "hoursInterval": 1
            }
          ]
        }
      },
      "id": "node-schedule-trigger",
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [240, 300]
    },
    {
      "parameters": {
        "url": "={{ $env.CRM_URL }}/api/ad-metrics",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "x-api-key",
              "value": "={{ $env.CRM_N8N_SECRET }}"
            }
          ]
        },
        "options": {}
      },
      "id": "node-get-crm-thresholds",
      "name": "Get CRM Thresholds",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [460, 300]
    },
    {
      "parameters": {
        "url": "=https://graph.facebook.com/v19.0/act_{{ $env.META_AD_ACCOUNT_ID }}/adsets",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "fields",
              "value": "id,name,campaign_id,campaign{name},daily_budget,status"
            },
            {
              "name": "access_token",
              "value": "={{ $env.META_ACCESS_TOKEN }}"
            }
          ]
        },
        "options": {}
      },
      "id": "node-get-meta-adsets",
      "name": "Get Meta Ad Sets",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [680, 300]
    },
    {
      "parameters": {
        "url": "=https://graph.facebook.com/v19.0/act_{{ $env.META_AD_ACCOUNT_ID }}/insights",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "level",
              "value": "adset"
            },
            {
              "name": "fields",
              "value": "adset_id,spend,impressions,clicks,actions"
            },
            {
              "name": "date_preset",
              "value": "today"
            },
            {
              "name": "access_token",
              "value": "={{ $env.META_ACCESS_TOKEN }}"
            }
          ]
        },
        "options": {}
      },
      "id": "node-get-meta-insights",
      "name": "Get Meta Insights",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [900, 300]
    },
    {
      "parameters": {
        "mode": "runOnceForAllItems",
        "jsCode": "const thresholds = $('Get CRM Thresholds').first().json.thresholds || {};\nconst adSets = $('Get Meta Ad Sets').first().json.data || [];\nconst insightsRaw = $('Get Meta Insights').first().json.data || [];\n\n// Build insights lookup: adSetId → { spend, impressions, clicks, leads }\nconst insightsByAdSetId = {};\nfor (const row of insightsRaw) {\n  const actions = Array.isArray(row.actions) ? row.actions : [];\n  const leads = actions\n    .filter(a => a.action_type === 'lead')\n    .reduce((sum, a) => sum + parseInt(a.value || '0', 10), 0);\n  insightsByAdSetId[row.adset_id] = {\n    spend: parseFloat(row.spend || '0'),\n    impressions: parseInt(row.impressions || '0', 10),\n    clicks: parseInt(row.clicks || '0', 10),\n    leads,\n  };\n}\n\nconst today = new Date().toISOString().split('T')[0];\nconst toAction = [];\n\nconst allMetrics = adSets.map(adSet => {\n  const adSetId = adSet.id;\n  const campaignId = adSet.campaign_id;\n  const ins = insightsByAdSetId[adSetId] || { spend: 0, impressions: 0, clicks: 0, leads: 0 };\n  const { spend, impressions, clicks, leads } = ins;\n\n  // Meta returns daily_budget in cents — divide by 100 for currency amount\n  const dailyBudget = parseFloat(adSet.daily_budget || '0') / 100;\n  const ctr = impressions > 0 ? Math.round(clicks / impressions * 10000) / 100 : 0;\n  const cpl = leads > 0 ? Math.round(spend / leads * 100) / 100 : 0;\n\n  let status = adSet.status === 'PAUSED' ? 'paused' : 'active';\n\n  // Rule 1: CPL exceeded threshold (skipped if no threshold for this campaign)\n  const threshold = thresholds[campaignId];\n  let shouldPause = false;\n  let reason = '';\n  if (typeof threshold === 'number' && cpl > threshold) {\n    shouldPause = true;\n    reason = 'cpl_exceeded';\n  }\n\n  // Rule 2: 80% budget burn with 0 leads (evaluated independently)\n  if (dailyBudget > 0 && spend / dailyBudget >= 0.8 && leads === 0) {\n    if (!shouldPause) {\n      shouldPause = true;\n      reason = 'budget_burn_no_leads';\n    }\n  }\n\n  if (shouldPause) {\n    toAction.push({ adSetId, campaignId, adSetName: adSet.name, reason });\n  }\n\n  return {\n    date: today,\n    campaign_id: campaignId,\n    campaign_name: (adSet.campaign && adSet.campaign.name) || '',\n    ad_set_id: adSetId,\n    ad_set_name: adSet.name || '',\n    spend,\n    leads,\n    impressions,\n    clicks,\n    ctr,\n    cpl,\n    roas: 0,\n    status,\n  };\n});\n\n// Pre-mark paused_auto so Google Sheets gets the correct status in one write\nconst pauseAdSetIds = new Set(toAction.map(a => a.adSetId));\nfor (const m of allMetrics) {\n  if (pauseAdSetIds.has(m.ad_set_id)) m.status = 'paused_auto';\n}\n\nreturn [{ json: { allMetrics, toAction } }];"
      },
      "id": "node-merge-evaluate",
      "name": "Merge + Evaluate Rules",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1120, 300]
    },
    {
      "parameters": {
        "mode": "runOnceForAllItems",
        "jsCode": "const { allMetrics } = $input.first().json;\nreturn allMetrics.map(m => ({ json: m }));"
      },
      "id": "node-prepare-rows",
      "name": "Prepare Sheet Rows",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1340, 300]
    },
    {
      "parameters": {
        "operation": "append",
        "documentId": {
          "__rl": true,
          "value": "={{ $env.GOOGLE_SHEETS_ID }}",
          "mode": "id"
        },
        "sheetName": {
          "__rl": true,
          "value": "Ad Metrics",
          "mode": "name"
        },
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "date": "={{ $json.date }}",
            "campaign_id": "={{ $json.campaign_id }}",
            "campaign_name": "={{ $json.campaign_name }}",
            "ad_set_id": "={{ $json.ad_set_id }}",
            "ad_set_name": "={{ $json.ad_set_name }}",
            "spend": "={{ $json.spend }}",
            "leads": "={{ $json.leads }}",
            "impressions": "={{ $json.impressions }}",
            "clicks": "={{ $json.clicks }}",
            "ctr": "={{ $json.ctr }}",
            "cpl": "={{ $json.cpl }}",
            "roas": "={{ $json.roas }}",
            "status": "={{ $json.status }}"
          }
        },
        "options": {}
      },
      "id": "node-append-sheets",
      "name": "Append to Google Sheets",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.5,
      "position": [1560, 300],
      "credentials": {
        "googleSheetsOAuth2Api": {
          "id": "REPLACE_WITH_CREDENTIAL_ID",
          "name": "Google Sheets account"
        }
      }
    },
    {
      "parameters": {
        "mode": "runOnceForAllItems",
        "jsCode": "const { toAction } = $('Merge + Evaluate Rules').first().json;\nif (!toAction || toAction.length === 0) return [];\nreturn toAction.map(a => ({ json: a }));"
      },
      "id": "node-extract-pause",
      "name": "Extract Pause Actions",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1780, 300]
    },
    {
      "parameters": {
        "url": "=https://graph.facebook.com/v19.0/{{ $json.adSetId }}",
        "method": "POST",
        "sendBody": true,
        "contentType": "form-urlencoded",
        "bodyParameters": {
          "parameters": [
            {
              "name": "status",
              "value": "PAUSED"
            },
            {
              "name": "access_token",
              "value": "={{ $env.META_ACCESS_TOKEN }}"
            }
          ]
        },
        "options": {}
      },
      "id": "node-pause-adset",
      "name": "Pause Ad Set",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [2000, 300]
    },
    {
      "parameters": {
        "url": "={{ $env.CRM_WEBHOOK_URL }}",
        "method": "POST",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({ type: 'ad_set_paused', adSetId: $json.adSetId, campaignId: $json.campaignId, reason: $json.reason, timestamp: new Date().toISOString() }) }}",
        "options": {}
      },
      "id": "node-notify-crm",
      "name": "Notify CRM Webhook",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [2220, 300]
    }
  ],
  "connections": {
    "Schedule Trigger": {
      "main": [
        [{ "node": "Get CRM Thresholds", "type": "main", "index": 0 }]
      ]
    },
    "Get CRM Thresholds": {
      "main": [
        [{ "node": "Get Meta Ad Sets", "type": "main", "index": 0 }]
      ]
    },
    "Get Meta Ad Sets": {
      "main": [
        [{ "node": "Get Meta Insights", "type": "main", "index": 0 }]
      ]
    },
    "Get Meta Insights": {
      "main": [
        [{ "node": "Merge + Evaluate Rules", "type": "main", "index": 0 }]
      ]
    },
    "Merge + Evaluate Rules": {
      "main": [
        [{ "node": "Prepare Sheet Rows", "type": "main", "index": 0 }]
      ]
    },
    "Prepare Sheet Rows": {
      "main": [
        [{ "node": "Append to Google Sheets", "type": "main", "index": 0 }]
      ]
    },
    "Append to Google Sheets": {
      "main": [
        [{ "node": "Extract Pause Actions", "type": "main", "index": 0 }]
      ]
    },
    "Extract Pause Actions": {
      "main": [
        [{ "node": "Pause Ad Set", "type": "main", "index": 0 }]
      ]
    },
    "Pause Ad Set": {
      "main": [
        [{ "node": "Notify CRM Webhook", "type": "main", "index": 0 }]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1"
  },
  "staticData": null,
  "tags": [],
  "triggerCount": 0,
  "versionId": "1"
}
```

- [ ] **Step 3: Commit the workflow file**

```bash
git add n8n/workflows/meta-ads-optimization.json
git commit -m "feat: add n8n meta ads auto-optimization workflow"
```

---

## Task 4: Set up Google Sheets "Ad Metrics" tab

**This is a one-time manual setup in Google Sheets — no code required.**

The n8n Google Sheets "Append" node uses column header names to map data. Row 1 of the "Ad Metrics" tab must have exactly these headers in columns A–M:

- [ ] **Step 1: Open the Google Sheet**

Open `https://docs.google.com/spreadsheets/d/1i_fOiBvvMywjgecXOwXisO5Cge8D3V-k8hvhfR7djt4`

- [ ] **Step 2: Create the "Ad Metrics" tab if it doesn't exist**

Click the `+` button at the bottom to add a new sheet. Rename it to `Ad Metrics` (case-sensitive — must match `AppSettings.adMetricsTab`).

- [ ] **Step 3: Add header row**

In row 1, enter the following values in columns A through M:

| A | B | C | D | E | F | G | H | I | J | K | L | M |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| date | campaign_id | campaign_name | ad_set_id | ad_set_name | spend | leads | impressions | clicks | ctr | cpl | roas | status |

---

## Task 5: Import workflow into n8n and configure

**This is a manual configuration step in the n8n UI.**

- [ ] **Step 1: Import the workflow**

1. Open your n8n instance at `https://n8n.srv1356414.hstgr.cloud`
2. Go to **Workflows** → **Add workflow** → **Import from file**
3. Select `n8n/workflows/meta-ads-optimization.json`

- [ ] **Step 2: Set n8n environment variables**

In n8n, go to **Settings** → **Environment Variables** (or edit `n8n/.env` on the server). Add:

| Variable | Value |
|----------|-------|
| `CRM_URL` | `https://your-crm-domain.vercel.app` (your deployed CRM URL) |
| `CRM_N8N_SECRET` | Same value as `CRM_N8N_SECRET` in CRM `.env.local` |
| `META_ACCESS_TOKEN` | Long-lived token from Meta Business Manager (60-day; set a calendar reminder to refresh) |
| `META_AD_ACCOUNT_ID` | Your ad account ID without `act_` prefix (e.g., `123456789`) |
| `GOOGLE_SHEETS_ID` | `1i_fOiBvvMywjgecXOwXisO5Cge8D3V-k8hvhfR7djt4` |
| `CRM_WEBHOOK_URL` | Leave blank for now — CRM detects paused ad sets via Google Sheets polling |

- [ ] **Step 3: Assign Google Sheets credential**

1. Open the imported workflow
2. Click the **"Append to Google Sheets"** node
3. Under **Credential**, select your existing Google Sheets OAuth credential
4. The `REPLACE_WITH_CREDENTIAL_ID` placeholder in the JSON is replaced automatically when you select the credential in the UI

- [ ] **Step 4: Test the workflow manually**

1. In the workflow editor, click **"Test workflow"** (runs once, bypasses the hourly schedule)
2. Check execution output — each node should show a green checkmark
3. Verify in Google Sheets that a new row was appended to the "Ad Metrics" tab
4. If any ad sets should have been paused (CPL exceeded or 80%+ budget + 0 leads), verify they show `paused_auto` status in Google Sheets and `PAUSED` status in Meta Ads Manager

- [ ] **Step 5: Activate the workflow**

Toggle the workflow from **Inactive** to **Active**. It will now run every hour at minute 0.

---

## Self-Review Notes

- **Spec coverage:** All three spec deliverables covered: API key auth on GET (Task 2), env var (Task 1), n8n workflow JSON (Task 3). Google Sheets setup and n8n import are prerequisites not in the spec's deliverables but needed for the workflow to function.
- **Status pre-marking:** The spec says "After auto-pause action → update that row to `paused_auto`" via a separate Google Sheets Update node. This plan instead pre-marks `status = 'paused_auto'` in the Code node before the Sheets append — achieving the same end state in one write instead of two, which is simpler and less error-prone.
- **No test runner:** CLAUDE.md confirms no test runner is configured. Verification steps use `curl` for the API and n8n's built-in test execution for the workflow.
- **`CRM_N8N_SECRET` vs `N8N_API_KEY`:** The spec uses `N8N_API_KEY` but `.env.local.example` already has `N8N_API_KEY` for a different purpose (n8n REST API auth from the CRM side). This plan uses `CRM_N8N_SECRET` to avoid naming ambiguity.
