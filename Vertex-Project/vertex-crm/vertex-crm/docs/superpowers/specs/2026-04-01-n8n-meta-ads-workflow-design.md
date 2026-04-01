# n8n Meta Ads Auto-Optimization Workflow Design

## Goal

Build an n8n workflow that runs hourly, pulls Meta Ads metrics per ad set, evaluates two auto-pause rules against per-campaign CPL thresholds stored in the CRM, pauses violating ad sets via the Meta API, writes metrics to Google Sheets for the CRM to display, and notifies the CRM via webhook.

## Architecture

Data flows in a single direction per hourly run:

```
Meta Ads API → n8n (evaluate rules) → Meta API (pause if needed)
                                     → Google Sheets "Ad Metrics" tab (write metrics)
                                     → CRM webhook (notify of pauses)
```

n8n reads CPL thresholds from the CRM via `GET /api/ad-metrics` using an API key (`x-api-key` header). The CRM is the single source of truth for thresholds — n8n never stores them independently.

## Auto-Pause Rules

Two rules evaluated per ad set each hour:

| Rule | Condition | Action |
|------|-----------|--------|
| CPL exceeded | `cpl > thresholds[campaignId]` | Pause ad set |
| Budget burn with no leads | `spend / daily_budget >= 0.8 AND leads == 0` | Pause ad set |

- Manual resume only — n8n never auto-resumes paused ad sets.
- If no threshold is set for a campaign, Rule 1 is skipped for that campaign.
- Both rules are evaluated independently — either can trigger a pause.

## n8n Workflow Nodes

```
[Schedule Trigger]
  every hour (0 * * * *)
        ↓
[HTTP Request: GET /api/ad-metrics]
  URL: {CRM_URL}/api/ad-metrics
  Headers: x-api-key: {N8N_API_KEY}
  Output: thresholds (Record<campaignId, number>)
        ↓
[HTTP Request: Meta Ads — Ad Set List]
  GET https://graph.facebook.com/v19.0/act_{META_AD_ACCOUNT_ID}/adsets
  Params: fields=id,name,campaign_id,daily_budget,status, access_token={META_ACCESS_TOKEN}
  Output: array of { id, name, campaign_id, daily_budget, status }
        ↓
[HTTP Request: Meta Ads — Insights]
  GET https://graph.facebook.com/v19.0/act_{META_AD_ACCOUNT_ID}/insights
  Params: level=adset, fields=adset_id,spend,impressions,clicks,actions, date_preset=today, access_token={META_ACCESS_TOKEN}
  Output: array of { adset_id, spend, impressions, clicks, actions[] }
        ↓
[Code Node: Merge + Evaluate Rules]
  - Joins ad set list + insights on adset_id
  - Computes: leads (from actions where action_type=lead), ctr, cpl, roas=0
  - Evaluates Rule 1 and Rule 2 per ad set
  - Outputs: { allMetrics: AdMetricRow[], toAction: { adSetId, reason }[] }
        ↓
[Google Sheets: Append Rows]
  Appends one row per ad set to "Ad Metrics" tab (all ad sets, every hour)
  Column order: date, campaign_id, campaign_name, ad_set_id, ad_set_name,
                spend, leads, impressions, clicks, ctr, cpl, roas, status
  Status value: 'active' | 'paused' | 'paused_auto'
        ↓
[IF: toAction.length > 0]
  YES ↓
[Split In Batches: one per ad set to pause]
        ↓
[HTTP Request: Meta API — Pause Ad Set]
  POST https://graph.facebook.com/v19.0/{adSetId}
  Body: status=PAUSED&access_token={META_ACCESS_TOKEN}
        ↓
[Google Sheets: Update Row]
  Finds the row just appended for this ad_set_id (by date + ad_set_id)
  Updates column M (status) to 'paused_auto'
        ↓
[HTTP Request: POST CRM webhook]
  URL: {CRM_WEBHOOK_URL}
  Body: { type: "ad_set_paused", adSetId, campaignId, reason, timestamp }
```

## Google Sheets "Ad Metrics" Tab

Column order (A–M):

| Col | Field | Type | Notes |
|-----|-------|------|-------|
| A | date | string | ISO date `YYYY-MM-DD` |
| B | campaign_id | string | Meta campaign ID |
| C | campaign_name | string | |
| D | ad_set_id | string | Meta ad set ID |
| E | ad_set_name | string | |
| F | spend | number | PHP amount (or USD — match Meta account currency) |
| G | leads | number | From Meta actions where `action_type=lead` |
| H | impressions | number | |
| I | clicks | number | |
| J | ctr | number | `clicks / impressions * 100`, 2 decimal places |
| K | cpl | number | `spend / leads`, 0 if leads = 0 |
| L | roas | number | Set to `0` by n8n (future: AI-enriched from CRM pipeline value) |
| M | status | string | `active`, `paused`, or `paused_auto` |

**Write strategy:** n8n appends one row per ad set per run. The CRM's `getAdMetrics()` deduplicates by keeping the last row per `ad_set_id` — so the most recent hourly snapshot always wins. No row updates needed except for the `paused_auto` status update.

**Initial status value written:** n8n reads the ad set's current status from the Meta API (`status` field on the adset object):
- Meta `ACTIVE` → write `active`
- Meta `PAUSED` (user-paused) → write `paused`
- After auto-pause action → update that row to `paused_auto`

## CRM Changes: API Key Auth on `GET /api/ad-metrics`

### New env var

Add to `.env.local`:
```
N8N_API_KEY=<generate a random 32-char hex string>
```

### Updated auth check in `src/app/api/ad-metrics/route.ts`

The GET handler currently requires `getServerSession`. Update to also accept an API key:

```ts
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const apiKey  = req.headers.get('x-api-key')
  const validKey = process.env.N8N_API_KEY

  if (!session && !(validKey && apiKey === validKey)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ... rest of handler unchanged
}
```

The PATCH handler remains session-only (thresholds are only changed from the browser).

## n8n Environment Variables

| Variable | Description |
|----------|-------------|
| `CRM_URL` | Base URL of the deployed CRM e.g. `https://your-crm.vercel.app` |
| `N8N_API_KEY` | Same value as `N8N_API_KEY` in CRM `.env.local` |
| `META_ACCESS_TOKEN` | Long-lived token from Meta Business Manager (60-day, refresh before expiry) |
| `META_AD_ACCOUNT_ID` | Ad account ID in format `act_123456789` |
| `GOOGLE_SHEETS_ID` | Same Google Sheet ID used by the CRM |
| `CRM_WEBHOOK_URL` | n8n webhook URL configured in CRM Settings (for ad_set_paused events) |

## Deliverables

| Action | File |
|--------|------|
| Create | `n8n/workflows/meta-ads-optimization.json` — importable n8n workflow |
| Modify | `src/app/api/ad-metrics/route.ts` — add API key auth to GET handler |
| Modify | `.env.local` — add `N8N_API_KEY` (documented in `.env.example`) |

## Out of Scope

- Auto-resume when CPL normalizes (manual resume only)
- Budget increase on high-performing ad sets
- Per-ad-set thresholds (per-campaign only)
- Meta App Review process (prerequisite — user must complete separately)
- Historical trend charts / time-series analysis
- ROAS-based pause rule (CPL + budget burn rules only in v1)
