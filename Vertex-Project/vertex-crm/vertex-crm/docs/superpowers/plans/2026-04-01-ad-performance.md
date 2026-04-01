# Ad Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "Ad Performance" tab to the CRM that displays Meta Ads metrics (spend, leads, CPL, ROAS, impressions, clicks, CTR) per campaign and per ad set, with per-campaign CPL thresholds that trigger amber badges and toast alerts when exceeded.

**Architecture:** n8n writes ad metrics to a Google Sheets "Ad Metrics" tab; the CRM reads via `GET /api/ad-metrics` and displays in `AdPerformanceView`. Per-campaign CPL thresholds are stored in `settings.json` and updated via `PATCH /api/ad-metrics`. `page.tsx` detects newly-paused ad sets on each refresh and fires toast alerts.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS v4, Google Sheets API, lucide-react, react-hot-toast

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `src/types/index.ts` | Add `AdMetric` interface |
| Modify | `src/lib/settings.ts` | Add `adMetricsTab`, `adThresholds` to `AppSettings` + `readSettings` |
| Modify | `src/lib/sheets.ts` | Add `getAdMetrics()` |
| Create | `src/app/api/ad-metrics/route.ts` | `GET` (read metrics + thresholds) + `PATCH` (save threshold) |
| Modify | `src/app/api/settings/route.ts` | Preserve new fields in POST merge |
| Create | `src/components/views/AdPerformanceView.tsx` | Stat cards + expandable campaign table |
| Modify | `src/app/dashboard/page.tsx` | Nav tab, state, fetch, badge, toast detection, render |

---

## Task 1: AdMetric type + AppSettings extensions

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/lib/settings.ts`

- [ ] **Step 1: Add `AdMetric` interface to `src/types/index.ts`**

Open `src/types/index.ts` and append after the `SheetRow` interface at the bottom:

```ts
// ─── Ad Performance ───────────────────────────────────────────────────────────
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
  ctr:          number   // percentage, e.g. 2.4 = 2.4%
  cpl:          number
  roas:         number
  status:       'active' | 'paused' | 'paused_auto'
}
```

- [ ] **Step 2: Add `adMetricsTab` and `adThresholds` to `AppSettings` in `src/lib/settings.ts`**

Replace the `AppSettings` interface:

```ts
export interface AppSettings {
  sheetId:      string
  leadsTab:     string
  scopingTab:   string
  chatLogsTab:  string
  calendlyUrl:  string
  adminEmail:   string
  webhookUrl:   string
  adMetricsTab: string
  adThresholds: Record<string, number>
}
```

- [ ] **Step 3: Update `readSettings()` to include the new fields**

Replace the entire `readSettings` function with:

```ts
export async function readSettings(): Promise<AppSettings> {
  if (existsSync(SETTINGS_PATH)) {
    try {
      const raw    = await readFile(SETTINGS_PATH, 'utf-8')
      const parsed = JSON.parse(raw)
      return {
        sheetId:      parsed.sheetId      ?? process.env.GOOGLE_SHEET_ID              ?? '',
        leadsTab:     parsed.leadsTab     ?? process.env.GOOGLE_SHEET_LEADS_TAB       ?? 'Leads',
        scopingTab:   parsed.scopingTab   ?? process.env.GOOGLE_SHEET_SCOPING_TAB     ?? 'Scoping Calls',
        chatLogsTab:  parsed.chatLogsTab  ?? process.env.GOOGLE_SHEET_CHAT_LOGS_TAB   ?? 'Chat Logs',
        calendlyUrl:  parsed.calendlyUrl  ?? process.env.NEXT_PUBLIC_CALENDLY_URL     ?? '',
        adminEmail:   parsed.adminEmail   ?? process.env.NEXT_PUBLIC_ADMIN_EMAIL      ?? '',
        webhookUrl:   parsed.webhookUrl   ?? process.env.N8N_WEBHOOK_URL              ?? '',
        adMetricsTab: parsed.adMetricsTab ?? 'Ad Metrics',
        adThresholds: parsed.adThresholds ?? {},
      }
    } catch (err) {
      console.error('[settings] Failed to parse settings.json:', err)
    }
  }
  return {
    sheetId:      process.env.GOOGLE_SHEET_ID              || '',
    leadsTab:     process.env.GOOGLE_SHEET_LEADS_TAB       || 'Leads',
    scopingTab:   process.env.GOOGLE_SHEET_SCOPING_TAB     || 'Scoping Calls',
    chatLogsTab:  process.env.GOOGLE_SHEET_CHAT_LOGS_TAB   || 'Chat Logs',
    calendlyUrl:  process.env.NEXT_PUBLIC_CALENDLY_URL     || '',
    adminEmail:   process.env.NEXT_PUBLIC_ADMIN_EMAIL       || '',
    webhookUrl:   process.env.N8N_WEBHOOK_URL               || '',
    adMetricsTab: 'Ad Metrics',
    adThresholds: {},
  }
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd /Users/lukash0915/Vertex-Project/vertex-crm/vertex-crm && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/lib/settings.ts
git commit -m "feat: add AdMetric type and extend AppSettings for ad performance"
```

---

## Task 2: `getAdMetrics()` in sheets.ts

**Files:**
- Modify: `src/lib/sheets.ts`

- [ ] **Step 1: Add `AdMetric` import and `readSettings` import to `src/lib/sheets.ts`**

The current imports at the top of `src/lib/sheets.ts` are:
```ts
import { getSheetsClient } from './google'
import type { Lead, SheetRow } from '@/types'
```

Replace with:
```ts
import { getSheetsClient } from './google'
import type { Lead, SheetRow, AdMetric } from '@/types'
import { readSettings } from './settings'
```

- [ ] **Step 2: Append `getAdMetrics()` at the bottom of `src/lib/sheets.ts`**

```ts
// ─── Read ad performance metrics ─────────────────────────────────────────────
// Column order in "Ad Metrics" tab (written by n8n):
// A: date | B: campaign_id | C: campaign_name | D: ad_set_id | E: ad_set_name |
// F: spend | G: leads | H: impressions | I: clicks | J: ctr | K: cpl | L: roas | M: status
export async function getAdMetrics(): Promise<AdMetric[]> {
  try {
    const settings = await readSettings()
    const sheets   = await getSheetsClient()
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range:         `${settings.adMetricsTab}!A2:M`,
    })
    const rows = res.data.values || []
    // Deduplicate by adSetId — last occurrence wins (n8n appends newest rows at bottom)
    const seen = new Map<string, AdMetric>()
    for (const row of rows) {
      const adSetId = row[3] || ''
      if (!adSetId) continue
      seen.set(adSetId, {
        date:         row[0]  || '',
        campaignId:   row[1]  || '',
        campaignName: row[2]  || '',
        adSetId:      row[3]  || '',
        adSetName:    row[4]  || '',
        spend:        parseFloat(row[5])  || 0,
        leads:        parseInt(row[6])    || 0,
        impressions:  parseInt(row[7])    || 0,
        clicks:       parseInt(row[8])    || 0,
        ctr:          parseFloat(row[9])  || 0,
        cpl:          parseFloat(row[10]) || 0,
        roas:         parseFloat(row[11]) || 0,
        status:       (row[12] as AdMetric['status']) || 'active',
      })
    }
    return Array.from(seen.values())
  } catch (err) {
    console.error('[Sheets] getAdMetrics error:', err)
    return []
  }
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/lukash0915/Vertex-Project/vertex-crm/vertex-crm && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/sheets.ts
git commit -m "feat: add getAdMetrics() to sheets lib"
```

---

## Task 3: API routes — `/api/ad-metrics` + update settings route

**Files:**
- Create: `src/app/api/ad-metrics/route.ts`
- Modify: `src/app/api/settings/route.ts`

- [ ] **Step 1: Create `src/app/api/ad-metrics/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile } from 'fs/promises'
import { getAdMetrics } from '@/lib/sheets'
import { readSettings, SETTINGS_PATH } from '@/lib/settings'

/** GET /api/ad-metrics — fetch all ad metrics + current thresholds */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

- [ ] **Step 2: Update `src/app/api/settings/route.ts` POST handler to preserve new fields**

In the POST handler, replace the `updated` object construction:

```ts
const updated: AppSettings = {
  sheetId:      body.sheetId      ?? current.sheetId,
  leadsTab:     body.leadsTab     ?? current.leadsTab,
  scopingTab:   body.scopingTab   ?? current.scopingTab,
  chatLogsTab:  body.chatLogsTab  ?? current.chatLogsTab,
  calendlyUrl:  body.calendlyUrl  ?? current.calendlyUrl,
  adminEmail:   body.adminEmail   ?? current.adminEmail,
  webhookUrl:   body.webhookUrl   ?? current.webhookUrl,
  adMetricsTab: body.adMetricsTab ?? current.adMetricsTab,
  adThresholds: body.adThresholds ?? current.adThresholds,
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/lukash0915/Vertex-Project/vertex-crm/vertex-crm && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/app/api/ad-metrics/route.ts src/app/api/settings/route.ts
git commit -m "feat: add /api/ad-metrics GET and PATCH routes, preserve new settings fields"
```

---

## Task 4: `AdPerformanceView` component

**Files:**
- Create: `src/components/views/AdPerformanceView.tsx`

- [ ] **Step 1: Create `src/components/views/AdPerformanceView.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'
import type { AdMetric } from '@/types'

interface Props {
  metrics:         AdMetric[]
  thresholds:      Record<string, number>
  onSaveThreshold: (campaignId: string, threshold: number) => Promise<void>
}

interface CampaignGroup {
  campaignId:   string
  campaignName: string
  adSets:       AdMetric[]
  totalSpend:   number
  totalLeads:   number
  totalImpr:    number
  totalClicks:  number
  avgCtr:       number
  cpl:          number
  roas:         number
  status:       'active' | 'paused' | 'paused_auto'
}

function groupByCampaign(metrics: AdMetric[]): CampaignGroup[] {
  const map = new Map<string, AdMetric[]>()
  for (const m of metrics) {
    if (!map.has(m.campaignId)) map.set(m.campaignId, [])
    map.get(m.campaignId)!.push(m)
  }
  return Array.from(map.entries()).map(([campaignId, adSets]) => {
    const totalSpend  = adSets.reduce((s, m) => s + m.spend, 0)
    const totalLeads  = adSets.reduce((s, m) => s + m.leads, 0)
    const totalImpr   = adSets.reduce((s, m) => s + m.impressions, 0)
    const totalClicks = adSets.reduce((s, m) => s + m.clicks, 0)
    const avgCtr      = totalImpr > 0 ? (totalClicks / totalImpr) * 100 : 0
    const cpl         = totalLeads > 0 ? totalSpend / totalLeads : 0
    const roas        = totalSpend > 0
      ? adSets.reduce((s, m) => s + m.roas * m.spend, 0) / totalSpend
      : 0
    const hasAutoPaused = adSets.some(m => m.status === 'paused_auto')
    const allPaused     = adSets.every(m => m.status !== 'active')
    const status: CampaignGroup['status'] = hasAutoPaused ? 'paused_auto' : allPaused ? 'paused' : 'active'
    return {
      campaignId,
      campaignName: adSets[0].campaignName,
      adSets,
      totalSpend,
      totalLeads,
      totalImpr,
      totalClicks,
      avgCtr,
      cpl,
      roas,
      status,
    }
  })
}

function StatusBadge({ status }: { status: 'active' | 'paused' | 'paused_auto' }) {
  if (status === 'paused_auto') return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-mono font-semibold border border-red-500/20 whitespace-nowrap">
      CPL Exceeded
    </span>
  )
  if (status === 'paused') return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-400 font-mono font-semibold border border-slate-500/20">
      Paused
    </span>
  )
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-mono font-semibold border border-emerald-500/20">
      Active
    </span>
  )
}

function ThresholdInput({ campaignId, value, onSave }: {
  campaignId: string
  value:      number | undefined
  onSave:     (campaignId: string, threshold: number) => Promise<void>
}) {
  const [draft,   setDraft]   = useState(value !== undefined ? String(value) : '')
  const [saving,  setSaving]  = useState(false)

  async function save() {
    const n = parseFloat(draft)
    if (!isNaN(n) && n > 0) {
      setSaving(true)
      try { await onSave(campaignId, n) } finally { setSaving(false) }
    }
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-[11px] text-slate-500">₱</span>
      <input
        type="number"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={e => { if (e.key === 'Enter') save() }}
        disabled={saving}
        placeholder="—"
        className="w-20 bg-[#141425] border border-white/[0.08] rounded px-2 py-1 text-[12px] text-slate-200 outline-none focus:border-blue-500/50 disabled:opacity-50"
      />
    </div>
  )
}

export default function AdPerformanceView({ metrics, thresholds, onSaveThreshold }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const campaigns   = groupByCampaign(metrics)
  const totalSpend  = campaigns.reduce((s, c) => s + c.totalSpend, 0)
  const totalLeads  = campaigns.reduce((s, c) => s + c.totalLeads, 0)
  const avgCpl      = totalLeads > 0 ? totalSpend / totalLeads : 0
  const avgRoas     = totalSpend > 0
    ? campaigns.reduce((s, c) => s + c.roas * c.totalSpend, 0) / totalSpend
    : 0
  const pausedCount = metrics.filter(m => m.status === 'paused_auto').length

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const statCards = [
    { label: 'Total Spend',     value: `₱${totalSpend.toLocaleString()}`,  sub: 'All campaigns',                              accent: '#f59e0b' },
    { label: 'Avg CPL',         value: `₱${avgCpl.toFixed(0)}`,            sub: 'Spend ÷ leads',                              accent: '#3b82f6' },
    { label: 'Avg ROAS',        value: `${avgRoas.toFixed(2)}x`,           sub: 'Weighted by spend',                          accent: '#10b981' },
    { label: 'Paused Ad Sets',  value: pausedCount,                        sub: pausedCount > 0 ? 'CPL exceeded' : 'All running', accent: pausedCount > 0 ? '#ef4444' : '#64748b' },
  ]

  const thClass = 'text-[10px] text-slate-500 uppercase tracking-wider font-medium px-3 py-2 text-right'
  const tdClass = 'text-[12px] text-slate-300 px-3 py-2.5 text-right font-mono'

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3">
        {statCards.map(card => (
          <div key={card.label} className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: card.accent }} />
            <div className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-2">{card.label}</div>
            <div className="text-2xl font-mono font-bold text-slate-200 mb-1">{card.value}</div>
            <div className="text-[11px] text-slate-600">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Alert banner */}
      {pausedCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <div className="text-xs text-amber-300">
            {pausedCount} ad set{pausedCount > 1 ? 's' : ''} auto-paused — CPL exceeded threshold. Review below.
          </div>
        </div>
      )}

      {/* Campaign table */}
      <div className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <div className="text-sm font-semibold text-slate-200">Campaigns</div>
          <div className="text-[11px] text-slate-500">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} · {metrics.length} ad set{metrics.length !== 1 ? 's' : ''}</div>
        </div>

        {metrics.length === 0 ? (
          <div className="px-4 py-10 text-center text-[13px] text-slate-600">
            No ad metrics yet — n8n will populate this once connected.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className={thClass + ' text-left pl-4'}>Campaign / Ad Set</th>
                  <th className={thClass}>Spend</th>
                  <th className={thClass}>Leads</th>
                  <th className={thClass}>CPL</th>
                  <th className={thClass}>ROAS</th>
                  <th className={thClass}>Impressions</th>
                  <th className={thClass}>Clicks</th>
                  <th className={thClass}>CTR</th>
                  <th className={thClass}>CPL Threshold</th>
                  <th className={thClass}>Status</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => (
                  <>
                    {/* Campaign row */}
                    <tr
                      key={c.campaignId}
                      className="border-b border-white/[0.04] hover:bg-blue-500/[0.04] cursor-pointer"
                      onClick={() => toggleExpand(c.campaignId)}
                    >
                      <td className="px-3 py-2.5 pl-4 text-left">
                        <div className="flex items-center gap-2">
                          {expanded.has(c.campaignId)
                            ? <ChevronDown  className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            : <ChevronRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />}
                          <span className="font-semibold text-slate-200 text-[13px]">{c.campaignName}</span>
                        </div>
                      </td>
                      <td className={tdClass}>₱{c.totalSpend.toLocaleString()}</td>
                      <td className={tdClass}>{c.totalLeads}</td>
                      <td className={tdClass}>₱{c.cpl.toFixed(0)}</td>
                      <td className={tdClass}>{c.roas.toFixed(2)}x</td>
                      <td className={tdClass}>{c.totalImpr.toLocaleString()}</td>
                      <td className={tdClass}>{c.totalClicks.toLocaleString()}</td>
                      <td className={tdClass}>{c.avgCtr.toFixed(1)}%</td>
                      <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                        <ThresholdInput
                          campaignId={c.campaignId}
                          value={thresholds[c.campaignId]}
                          onSave={onSaveThreshold}
                        />
                      </td>
                      <td className={tdClass}><StatusBadge status={c.status} /></td>
                    </tr>

                    {/* Ad set rows */}
                    {expanded.has(c.campaignId) && c.adSets.map(m => (
                      <tr key={m.adSetId} className="border-b border-white/[0.04] bg-[#0a0a14]">
                        <td className="px-3 py-2 pl-10 text-left">
                          <span className="text-[12px] text-slate-400">{m.adSetName}</span>
                        </td>
                        <td className={tdClass}>₱{m.spend.toLocaleString()}</td>
                        <td className={tdClass}>{m.leads}</td>
                        <td className={tdClass}>₱{m.cpl.toFixed(0)}</td>
                        <td className={tdClass}>{m.roas.toFixed(2)}x</td>
                        <td className={tdClass}>{m.impressions.toLocaleString()}</td>
                        <td className={tdClass}>{m.clicks.toLocaleString()}</td>
                        <td className={tdClass}>{m.ctr.toFixed(1)}%</td>
                        <td className={tdClass + ' text-slate-600'}>—</td>
                        <td className={tdClass}><StatusBadge status={m.status} /></td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/lukash0915/Vertex-Project/vertex-crm/vertex-crm && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/views/AdPerformanceView.tsx
git commit -m "feat: AdPerformanceView with stat cards, expandable campaign table, CPL threshold inputs"
```

---

## Task 5: Wire into `dashboard/page.tsx`

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Update imports**

Replace the existing import block at the top of `src/app/dashboard/page.tsx`:

```ts
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import {
  LayoutDashboard, Users, Cpu, Activity, Settings,
  Bell, RefreshCw, LogOut, LogIn, CalendarDays, Layers, Search, BarChart2,
} from 'lucide-react'
import type { Lead, AILog, LeadStatus, AdMetric } from '@/types'
import EmailModal          from '@/components/email/EmailModal'
import BookingModal        from '@/components/calendar/BookingModal'
import AddLeadModal, { type AddLeadData } from '@/components/views/AddLeadModal'
import AISidePanel         from '@/components/views/AISidePanel'
import DashboardView       from '@/components/views/DashboardView'
import LeadsView           from '@/components/views/LeadsView'
import AIInsightsView      from '@/components/views/AIInsightsView'
import AutomationLogsView  from '@/components/views/AutomationLogsView'
import CalendarView        from '@/components/views/CalendarView'
import SettingsView        from '@/components/views/SettingsView'
import AdPerformanceView   from '@/components/views/AdPerformanceView'
import toast, { Toaster } from 'react-hot-toast'
```

- [ ] **Step 2: Update `PageName` type**

Replace:
```ts
type PageName = 'Dashboard' | 'Leads (Active)' | 'AI Insights' | 'Calendar' | 'Automation Logs' | 'Settings'
```

With:
```ts
type PageName = 'Dashboard' | 'Leads (Active)' | 'AI Insights' | 'Calendar' | 'Automation Logs' | 'Settings' | 'Ad Performance'
```

- [ ] **Step 3: Add ad metrics state + refs inside `DashboardPage`**

After the existing `const [activePage, setActivePage] = useState<PageName>('Dashboard')` line, add:

```ts
const [adMetrics,    setAdMetrics]    = useState<AdMetric[]>([])
const [adThresholds, setAdThresholds] = useState<Record<string, number>>({})
const prevPausedRef      = useRef<Set<string>>(new Set())
const isFirstAdFetchRef  = useRef(true)
```

- [ ] **Step 4: Add `fetchAdMetrics` callback**

After the existing `fetchLeads` callback, add:

```ts
const fetchAdMetrics = useCallback(async () => {
  if (!session) return
  try {
    const res = await fetch('/api/ad-metrics')
    if (!res.ok) return
    const data = await res.json() as { metrics: AdMetric[]; thresholds: Record<string, number> }
    const metrics = data.metrics ?? []
    setAdMetrics(metrics)
    setAdThresholds(data.thresholds ?? {})

    // Detect newly paused ad sets — skip on first load to avoid false alerts
    const currentPaused = new Set(
      metrics.filter(m => m.status === 'paused_auto').map(m => m.adSetId)
    )
    if (!isFirstAdFetchRef.current) {
      for (const id of currentPaused) {
        if (!prevPausedRef.current.has(id)) {
          toast.error('Ad set paused — CPL exceeded threshold')
        }
      }
    }
    prevPausedRef.current     = currentPaused
    isFirstAdFetchRef.current = false
  } catch { /* keep empty on network error */ }
}, [session])
```

- [ ] **Step 5: Add `fetchAdMetrics` to the existing useEffect**

Replace:
```ts
useEffect(() => { fetchLeads() }, [fetchLeads])
```

With:
```ts
useEffect(() => {
  fetchLeads()
  fetchAdMetrics()
}, [fetchLeads, fetchAdMetrics])
```

- [ ] **Step 6: Add `handleSaveThreshold` function**

After `handleAddLead`, add:

```ts
async function handleSaveThreshold(campaignId: string, threshold: number) {
  const res = await fetch('/api/ad-metrics', {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ campaignId, threshold }),
  })
  if (!res.ok) throw new Error('Failed to save threshold')
  setAdThresholds(prev => ({ ...prev, [campaignId]: threshold }))
  toast.success('Threshold saved')
}
```

- [ ] **Step 7: Add `pausedCount` derived value and "Ad Performance" to `navMain`**

Just before the `navMain` array definition, add:

```ts
const pausedCount = adMetrics.filter(m => m.status === 'paused_auto').length
```

In the `navMain` array, add the Ad Performance entry after Calendar:

```ts
const navMain: { label: PageName; icon: React.ElementType; badge?: number; badgeAmber?: boolean }[] = [
  { label: 'Dashboard',      icon: LayoutDashboard },
  { label: 'Leads (Active)', icon: Users,       badge: leads.filter(l => l.status !== 'closed').length },
  { label: 'AI Insights',    icon: Cpu,          badge: logs.filter(l => l.type === 'alert').length, badgeAmber: true },
  { label: 'Calendar',       icon: CalendarDays },
  { label: 'Ad Performance', icon: BarChart2,    badge: pausedCount || undefined, badgeAmber: true },
]
```

Note: `badge: pausedCount || undefined` means the badge only appears when `pausedCount > 0` (undefined suppresses the badge).

- [ ] **Step 8: Add `'Ad Performance'` case to `renderContent`**

In the `renderContent` function, add before the `default` case:

```tsx
case 'Ad Performance': return (
  <AdPerformanceView
    metrics={adMetrics}
    thresholds={adThresholds}
    onSaveThreshold={handleSaveThreshold}
  />
)
```

- [ ] **Step 9: Verify TypeScript**

```bash
cd /Users/lukash0915/Vertex-Project/vertex-crm/vertex-crm && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 10: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: wire Ad Performance tab into dashboard — nav, state, fetch, badge, toast detection"
```

---

## Task 6: Build verification

**Files:** none (read-only verification)

- [ ] **Step 1: Run TypeScript check**

```bash
cd /Users/lukash0915/Vertex-Project/vertex-crm/vertex-crm && npx tsc --noEmit 2>&1
```

Expected: no output (zero errors)

- [ ] **Step 2: Run Next.js production build**

```bash
cd /Users/lukash0915/Vertex-Project/vertex-crm/vertex-crm && npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully` with all routes listed including `/api/ad-metrics`

- [ ] **Step 3: Manual smoke test checklist**

With `npm run dev`:

- [ ] "Ad Performance" tab appears in sidebar nav
- [ ] Clicking it renders the view with 4 stat cards (all showing ₱0 / 0 — no data yet is OK)
- [ ] Empty state message shows: "No ad metrics yet — n8n will populate this once connected."
- [ ] No console errors in browser DevTools
- [ ] Refresh button (top right) triggers `fetchAdMetrics` without errors

- [ ] **Step 4: Commit if any fixes were needed**

```bash
git add -p
git commit -m "fix: build verification fixes for ad performance feature"
```
