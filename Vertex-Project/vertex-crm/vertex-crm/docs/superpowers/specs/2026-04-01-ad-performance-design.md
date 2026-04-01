# Ad Performance Design

## Goal

Add a new "Ad Performance" navigation tab to the CRM that displays Meta Ads metrics (spend, leads, CPL, ROAS, impressions, clicks, CTR) per campaign and per ad set. Supports per-campaign CPL thresholds that trigger alerts when exceeded. n8n writes the data to Google Sheets; the CRM reads and displays it.

## Architecture

Data flows one way: n8n polls Meta Ads API hourly → writes rows to a Google Sheets "Ad Metrics" tab → CRM reads via `GET /api/ad-metrics` → `AdPerformanceView` displays it.

Per-campaign CPL thresholds are stored in `settings.json` under `adThresholds: Record<campaignId, number>`. The CRM detects paused ad sets (`status: 'paused_auto'`) on each data refresh and fires toast alerts for newly paused ones.

`page.tsx` holds `adMetrics` and `adThresholds` state. The paused-ad-set count is derived at render time and shown as an amber badge on the "Ad Performance" nav item.

## Google Sheets "Ad Metrics" Tab

Column order (n8n writes, CRM reads):

```
date | campaign_id | campaign_name | ad_set_id | ad_set_name |
spend | leads | impressions | clicks | ctr | cpl | roas | status
```

- `ctr` — percentage value (e.g. `2.4` = 2.4%)
- `status` — one of: `active`, `paused`, `paused_auto`
- `paused_auto` — set by n8n when CPL exceeded threshold and ad set was paused via Meta API
- One row per ad set per day (n8n appends daily; CRM shows latest row per ad set)

## Type

New `AdMetric` interface added to `src/types.ts`:

```ts
export interface AdMetric {
  date:         string
  campaignId:   string
  campaignName: string
  adSetId:      string
  adSetName:    string
  spend:        number
  leads:        number
  impressions:  number
  clicks:       number
  ctr:          number
  cpl:          number
  roas:         number
  status:       'active' | 'paused' | 'paused_auto'
}
```

## Settings

`AppSettings` in `src/lib/settings.ts` gets a new field:

```ts
adThresholds: Record<string, number>  // campaignId → CPL threshold in PHP
```

Default: `{}` (empty — no threshold set). Persisted in `settings.json`. Falls back to `{}` if field is missing (safe merge-on-read pattern).

## API

### `GET /api/ad-metrics`

- Requires authenticated session (same auth check as `/api/leads`)
- Calls `getAdMetrics()` in `src/lib/sheets.ts`
- Returns `{ metrics: AdMetric[], thresholds: Record<string, number> }`
- Also returns current `adThresholds` from `readSettings()` so the view has both in one request

### `PATCH /api/ad-metrics`

Request body:
```ts
{ campaignId: string; threshold: number }
```

- Reads current settings, updates `adThresholds[campaignId] = threshold`, writes back to `settings.json`
- Returns `{ success: true }`

## `getAdMetrics()` in `src/lib/sheets.ts`

Reads the "Ad Metrics" tab. Returns one `AdMetric` per ad set — the **latest row** per `ad_set_id` (last occurrence wins, since n8n appends newest rows at the bottom).

```ts
export async function getAdMetrics(): Promise<AdMetric[]>
```

Sheet tab name configurable via `AppSettings.adMetricsTab` (default: `'Ad Metrics'`). Add `adMetricsTab: string` to `AppSettings`.

## `AdPerformanceView` Component

File: `src/components/views/AdPerformanceView.tsx`

Props:
```ts
interface Props {
  metrics:    AdMetric[]
  thresholds: Record<string, number>
  onSaveThreshold: (campaignId: string, threshold: number) => Promise<void>
}
```

### Stat Cards (top row, 4 columns)

| Card | Computation | Accent color |
|------|------------|--------------|
| Total Spend | sum of all ad set spend | amber (`#f59e0b`) |
| Avg CPL | total spend ÷ total leads | blue (`#3b82f6`) |
| Avg ROAS | weighted avg across campaigns | emerald (`#10b981`) |
| Paused Ad Sets | count of `paused_auto` rows | red (`#ef4444`), slate if 0 |

### Alert Banner

Shown above table when `pausedCount > 0`:

```tsx
<div className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
  <div className="text-xs text-amber-300">
    {pausedCount} ad set{pausedCount > 1 ? 's' : ''} auto-paused — CPL exceeded threshold. Review below.
  </div>
</div>
```

### Campaign Table

Grouped by `campaignId`. Each campaign is one collapsible section.

**Campaign header row:**
- Chevron icon (expand/collapse)
- Campaign name
- Aggregated: total spend, total leads, avg CPL, avg ROAS, total impressions, total clicks, avg CTR
- Status badge: `Active` (emerald), `Paused` (slate), `CPL Exceeded` (red) — red if any ad set is `paused_auto`
- CPL Threshold input: `₱` prefix + number input, placeholder `—`, saves on blur or Enter key

**Ad set rows (expanded, indented):**
- Same columns as campaign row (not aggregated — raw values)
- Status badge per ad set: `Active` (emerald), `Paused` (slate), `CPL Exceeded` (red for `paused_auto`)
- No threshold input (threshold is per-campaign, not per-ad-set)
- Row background: `bg-[#0a0a14]` (slightly darker than card bg) to visually distinguish from campaign rows

**Column order:** Name | Spend | Leads | CPL | ROAS | Impressions | Clicks | CTR | CPL Threshold | Status

### Expand/Collapse State

Local `useState<Set<string>>` for expanded campaign IDs. Toggle on chevron click. All campaigns collapsed by default.

## `page.tsx` Changes

### New state
```ts
const [adMetrics,    setAdMetrics]    = useState<AdMetric[]>([])
const [adThresholds, setAdThresholds] = useState<Record<string, number>>({})
const [prevPaused,   setPrevPaused]   = useState<Set<string>>(new Set())
```

### Fetch on mount
```ts
const fetchAdMetrics = useCallback(async () => {
  if (!session) return
  const res = await fetch('/api/ad-metrics')
  if (res.ok) {
    const data = await res.json()
    setAdMetrics(data.metrics ?? [])
    setAdThresholds(data.thresholds ?? {})
  }
}, [session])

useEffect(() => { fetchAdMetrics() }, [fetchAdMetrics])
```

### Paused detection (toast on new pauses)
After each `fetchAdMetrics`, compare current `paused_auto` ad set IDs to `prevPaused`. For each newly paused ID, fire `toast.error('Ad set paused — CPL exceeded threshold')`. Then update `prevPaused`.

### Nav badge
```ts
const pausedCount = adMetrics.filter(m => m.status === 'paused_auto').length
```
Added to `navMain` as `{ label: 'Ad Performance', icon: BarChart2, badge: pausedCount, badgeAmber: true }`.

### handleSaveThreshold
```ts
async function handleSaveThreshold(campaignId: string, threshold: number) {
  const res = await fetch('/api/ad-metrics', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaignId, threshold }),
  })
  if (!res.ok) throw new Error('Failed to save threshold')
  setAdThresholds(prev => ({ ...prev, [campaignId]: threshold }))
  toast.success('Threshold saved')
}
```

### renderContent addition
```tsx
case 'Ad Performance': return (
  <AdPerformanceView
    metrics={adMetrics}
    thresholds={adThresholds}
    onSaveThreshold={handleSaveThreshold}
  />
)
```

`FULL_WIDTH_PAGES` — Ad Performance is NOT full width (keeps AI side panel).

## AppSettings Addition

Two new fields in `AppSettings`:
```ts
adMetricsTab: string           // default: 'Ad Metrics'
adThresholds: Record<string, number>  // default: {}
```

Merge-on-read in `readSettings()`:
```ts
adMetricsTab: parsed.adMetricsTab ?? 'Ad Metrics',
adThresholds: parsed.adThresholds ?? {},
```

## Files Modified / Created

| Action | File |
|--------|------|
| Create | `src/components/views/AdPerformanceView.tsx` |
| Create | `src/app/api/ad-metrics/route.ts` |
| Modify | `src/lib/sheets.ts` — add `getAdMetrics()` |
| Modify | `src/lib/settings.ts` — add `adMetricsTab`, `adThresholds` |
| Modify | `src/app/api/settings/route.ts` — handle new fields |
| Modify | `src/app/dashboard/page.tsx` — nav tab, state, fetch, badge, toast, handler |
| Modify | `src/types.ts` — add `AdMetric` interface |

## Out of Scope

- n8n workflow (separate spec)
- Auto-resume when CPL normalizes (v2)
- Budget increase on high-performing ad sets (v2)
- Per-ad-set threshold (per-campaign only in v1)
- Historical trend charts / time-series graphs (v2)
- Real-time Meta API polling from CRM (n8n handles polling)
