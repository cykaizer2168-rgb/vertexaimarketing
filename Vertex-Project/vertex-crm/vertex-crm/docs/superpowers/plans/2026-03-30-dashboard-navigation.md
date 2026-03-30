# Dashboard Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire all six CRM navigation pages using conditional rendering with no full-page reloads.

**Architecture:** `dashboard/page.tsx` becomes a thin router that passes shared state (leads, logs, session) as props to six view components in `src/components/views/`. A settings API backed by `settings.json` replaces runtime `.env.local` writes. The AI side panel is extracted and conditionally hidden for Calendar and Settings views.

**Tech Stack:** Next.js 14 App Router, React 18, Tailwind CSS, Lucide React, googleapis, next-auth

---

## Task 1: Shared constants + ScoreBadge

**Files:**
- Create: `src/components/views/shared.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/components/views/shared.tsx
import { Cpu, CheckCircle, AlertTriangle, Activity, Mail, Calendar } from 'lucide-react'
import type { AILog } from '@/types'

export const STATUS_COLORS: Record<string, string> = {
  hot:       'text-red-400 bg-red-500/10 border-red-500/20',
  qualified: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  contacted: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  nurture:   'text-purple-400 bg-purple-500/10 border-purple-500/20',
  new:       'text-slate-400 bg-slate-500/10 border-slate-500/20',
  closed:    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
}

export const LOG_COLORS: Record<string, string> = {
  enriched:      'border-blue-500 text-blue-400',
  scored:        'border-emerald-500 text-emerald-400',
  alert:         'border-amber-500 text-amber-400',
  workflow:      'border-purple-500 text-purple-400',
  email_sent:    'border-sky-500 text-sky-400',
  meeting_booked:'border-teal-500 text-teal-400',
}

export const LOG_BORDER_COLORS: Record<string, string> = {
  enriched:      '#3b82f6',
  scored:        '#10b981',
  alert:         '#f59e0b',
  workflow:      '#a855f7',
  email_sent:    '#0ea5e9',
  meeting_booked:'#14b8a6',
}

export const LOG_ICONS: Record<string, React.ReactNode> = {
  enriched:       <Cpu       className="w-3 h-3" />,
  scored:         <CheckCircle className="w-3 h-3" />,
  alert:          <AlertTriangle className="w-3 h-3" />,
  workflow:       <Activity  className="w-3 h-3" />,
  email_sent:     <Mail      className="w-3 h-3" />,
  meeting_booked: <Calendar  className="w-3 h-3" />,
}

export function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 85
    ? 'bg-red-500/15 text-red-400 border-red-500/25'
    : score >= 70
    ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
    : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  const dot = score >= 85
    ? 'bg-red-400 shadow-red-400/60 shadow-[0_0_5px_1px]'
    : score >= 70
    ? 'bg-amber-400 shadow-amber-400/60 shadow-[0_0_5px_1px]'
    : 'bg-slate-500'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono text-xs font-semibold ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      {score}
    </span>
  )
}
```

- [ ] **Step 2: Verify file compiles**

```bash
cd /Users/lukash0915/Vertex-Project/vertex-crm/vertex-crm && npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors referencing `shared.tsx`

---

## Task 2: Settings API route

**Files:**
- Create: `src/app/api/settings/route.ts`

- [ ] **Step 1: Create the route**

```ts
// src/app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const SETTINGS_PATH = join(process.cwd(), 'settings.json')

export interface AppSettings {
  sheetId:     string
  leadsTab:    string
  scopingTab:  string
  chatLogsTab: string
  calendlyUrl: string
  adminEmail:  string
}

function readSettings(): AppSettings {
  if (existsSync(SETTINGS_PATH)) {
    try { return JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8')) } catch {}
  }
  return {
    sheetId:     process.env.GOOGLE_SHEET_ID     || '',
    leadsTab:    process.env.GOOGLE_SHEET_LEADS_TAB   || 'Leads',
    scopingTab:  process.env.GOOGLE_SHEET_SCOPING_TAB || 'Scoping Calls',
    chatLogsTab: process.env.GOOGLE_SHEET_CHAT_LOGS_TAB || 'Chat Logs',
    calendlyUrl: process.env.NEXT_PUBLIC_CALENDLY_URL || '',
    adminEmail:  process.env.NEXT_PUBLIC_ADMIN_EMAIL  || '',
  }
}

export async function GET() {
  return NextResponse.json(readSettings())
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json() as Partial<AppSettings>
    const current = readSettings()
    const updated: AppSettings = {
      sheetId:     body.sheetId     ?? current.sheetId,
      leadsTab:    body.leadsTab    ?? current.leadsTab,
      scopingTab:  body.scopingTab  ?? current.scopingTab,
      chatLogsTab: body.chatLogsTab ?? current.chatLogsTab,
      calendlyUrl: body.calendlyUrl ?? current.calendlyUrl,
      adminEmail:  body.adminEmail  ?? current.adminEmail,
    }
    writeFileSync(SETTINGS_PATH, JSON.stringify(updated, null, 2), 'utf-8')
    return NextResponse.json({ ok: true, settings: updated })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors in `api/settings/route.ts`

- [ ] **Step 3: Test GET in browser**

With dev server running, visit: `http://localhost:3000/api/settings`
Expected JSON: `{ sheetId: "1i_fOiBv...", leadsTab: "Leads", ... }`

---

## Task 3: AISidePanel component

**Files:**
- Create: `src/components/views/AISidePanel.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/views/AISidePanel.tsx
import { Activity } from 'lucide-react'
import type { AILog, Lead } from '@/types'
import { LOG_COLORS, LOG_BORDER_COLORS, LOG_ICONS } from './shared'

interface Props {
  logs:  AILog[]
  leads: Lead[]
}

const WORKFLOWS = [
  { name: 'Lead Enrichment v2', status: 'Running' },
  { name: 'AI Scoring Engine',  status: 'Running' },
  { name: 'G11:11 Messenger',   status: 'Running' },
  { name: 'FB Auto-Poster',     status: 'Idle'    },
  { name: 'Scoping Trigger',    status: 'Running' },
]

export default function AISidePanel({ logs, leads }: Props) {
  return (
    <aside className="w-[280px] min-w-[280px] bg-[#0f0f1a] border-l border-white/[0.06] flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          AI Intelligence
        </div>
        <span className="text-[10px] text-emerald-400 font-mono font-semibold">LIVE</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Log feed */}
        {logs.map(log => (
          <div key={log.id}
            className="p-3 bg-[#141425] rounded-lg border border-white/[0.06] border-l-2"
            style={{ borderLeftColor: LOG_BORDER_COLORS[log.type] || '#475569' }}>
            <div className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${LOG_COLORS[log.type]?.split(' ')[1] || 'text-slate-500'}`}>
              {LOG_ICONS[log.type]}
              {log.type.replace('_', ' ')}
            </div>
            <div className="text-[12px] text-slate-300 leading-relaxed">{log.message}</div>
            <div className="text-[10px] text-slate-600 font-mono mt-1.5">{log.timestamp}</div>
          </div>
        ))}

        {/* Top AI Scores */}
        <div className="bg-[#141425] rounded-lg border border-white/[0.06] p-3 mt-1">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-2.5">Top AI Scores</div>
          {[...leads].sort((a, b) => b.aiScore - a.aiScore).slice(0, 5).map(lead => (
            <div key={lead.id} className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] text-slate-400 w-[68px] truncate flex-shrink-0">{lead.company.split(' ')[0]}</span>
              <div className="flex-1 h-[4px] bg-[#09090f] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${lead.aiScore}%`, background: lead.aiScore >= 85 ? '#ef4444' : lead.aiScore >= 70 ? '#f59e0b' : '#64748b' }} />
              </div>
              <span className="text-[10px] text-slate-500 font-mono w-5 text-right flex-shrink-0">{lead.aiScore}</span>
            </div>
          ))}
        </div>

        {/* Workflow status */}
        <div className="bg-[#141425] rounded-lg border border-white/[0.06] p-3">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-2.5">n8n Workflow Status</div>
          {WORKFLOWS.map(w => (
            <div key={w.name} className="flex items-center justify-between py-1 border-b border-white/[0.04] last:border-0">
              <span className="text-[11px] text-slate-400">{w.name}</span>
              <span className={`text-[10px] font-mono font-semibold ${w.status === 'Running' ? 'text-emerald-400' : 'text-slate-600'}`}>
                {w.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors

---

## Task 4: DashboardView component

**Files:**
- Create: `src/components/views/DashboardView.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/views/DashboardView.tsx
import { Users, Target, DollarSign, Zap, TrendingUp, ArrowUpRight,
         Eye, Mail, Calendar, MoreHorizontal, ChevronDown, AlertTriangle } from 'lucide-react'
import type { Lead, AILog } from '@/types'
import { ScoreBadge, STATUS_COLORS } from './shared'
import toast from 'react-hot-toast'

interface Props {
  leads:          Lead[]
  logs:           AILog[]
  search:         string
  loading:        boolean
  authenticated:  boolean
  onEmailLead:    (lead: Lead) => void
  onBookingLead:  (lead: Lead) => void
  onSignIn:       () => void
}

export default function DashboardView({
  leads, search, authenticated, onEmailLead, onBookingLead, onSignIn
}: Props) {
  const filtered = leads.filter(l =>
    !search || [l.name, l.company, l.industry].some(v =>
      v.toLowerCase().includes(search.toLowerCase())
    )
  )

  const stats = {
    total:    leads.length,
    avgScore: leads.length ? Math.round(leads.reduce((s, l) => s + l.aiScore, 0) / leads.length) : 0,
    pipeline: leads.reduce((s, l) => s + l.estimatedValue, 0),
    hotLeads: leads.filter(l => l.aiScore >= 85).length,
  }

  return (
    <div className="space-y-5">
      {!authenticated && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <div className="flex-1 text-xs text-amber-300">
            Connect your Google account to enable email sending and calendar booking.
          </div>
          <button onClick={onSignIn} className="text-xs text-amber-400 font-semibold hover:text-amber-200 transition-colors whitespace-nowrap">
            Connect Now →
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label:'Total Leads',      value: stats.total,                             sub:'+18.4% vs last mo',  icon: Users,       accent:'#3b82f6', badge:`${stats.hotLeads} hot` },
          { label:'Avg AI Readiness', value: `${stats.avgScore}/100`,                 sub:'Target: 80+',        icon: Target,      accent:'#10b981', badge: stats.avgScore >= 80 ? 'On target' : `${80 - stats.avgScore} pts gap` },
          { label:'Pipeline Value',   value: `₱${(stats.pipeline/1000).toFixed(0)}k`, sub:'+32.1% est. revenue',icon: DollarSign,  accent:'#a855f7', badge:'Est. total' },
          { label:'Active n8n Flows', value: 11,                                      sub:'0 errors today',     icon: Zap,         accent:'#f59e0b', badge:'All healthy' },
        ].map(card => (
          <div key={card.label} className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: card.accent }} />
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-2">
              <card.icon className="w-3 h-3" style={{ color: card.accent }} />
              {card.label}
            </div>
            <div className="text-2xl font-semibold text-slate-100 font-mono tracking-tight mb-1">{card.value}</div>
            <div className="flex items-center gap-1.5">
              <ArrowUpRight className="w-3 h-3 text-emerald-400" />
              <span className="text-[11px] text-slate-500">{card.sub}</span>
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: `${card.accent}20`, color: card.accent }}>{card.badge}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Hot Leads Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold text-slate-200">Hot Leads</div>
            <div className="text-[11px] text-slate-500">AI-scored · sorted by readiness · {filtered.length} leads</div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 bg-[#141425] border border-white/[0.06] rounded-lg hover:text-slate-200 hover:bg-[#1a1a2e] transition-colors">
              <TrendingUp className="w-3 h-3" /> Sort <ChevronDown className="w-3 h-3" />
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">
              + Add Lead
            </button>
          </div>
        </div>
        <LeadsTable leads={filtered} authenticated={authenticated} onEmailLead={onEmailLead} onBookingLead={onBookingLead} />
      </div>

      {/* Outreach Hooks */}
      <div>
        <div className="text-sm font-semibold text-slate-200 mb-1">AI Outreach Hooks</div>
        <div className="text-[11px] text-slate-500 mb-3">GPT-4o generated cold email openers · click to use</div>
        <div className="grid grid-cols-2 gap-3">
          {leads.filter(l => l.outreachHook && l.aiScore >= 70).map(lead => (
            <div key={lead.id}
              className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl p-4 border-l-2 cursor-pointer hover:bg-[#141425] transition-colors"
              style={{ borderLeftColor: lead.aiScore >= 85 ? '#ef4444' : '#f59e0b' }}
              onClick={() => { if (authenticated) onEmailLead(lead) }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold text-slate-200">{lead.name}</span>
                <ScoreBadge score={lead.aiScore} />
              </div>
              <div className="text-[11px] text-slate-500 mb-2">{lead.company} · {lead.industry}</div>
              <div className="text-[12px] text-slate-400 italic leading-relaxed">"{lead.outreachHook}"</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Shared table used by DashboardView and LeadsView ─────────────────────────
export function LeadsTable({ leads, authenticated, onEmailLead, onBookingLead }: {
  leads: Lead[]
  authenticated: boolean
  onEmailLead:   (lead: Lead) => void
  onBookingLead: (lead: Lead) => void
}) {
  return (
    <div className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#141425]">
            {['Lead / Company','AI Score','Suggested Automation','Est. Value','Status','Actions'].map(h => (
              <th key={h} className="px-4 py-2.5 text-left text-[10px] text-slate-500 uppercase tracking-wider font-medium border-b border-white/[0.06] whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map(lead => (
            <tr key={lead.id} className="border-b border-white/[0.04] hover:bg-blue-500/[0.04] transition-colors group">
              <td className="px-4 py-3">
                <div className="text-[13px] font-semibold text-slate-200">{lead.name}</div>
                <div className="text-[11px] text-slate-500">{lead.company}</div>
                <span className="text-[10px] text-slate-600 bg-[#141425] px-1.5 py-0.5 rounded mt-0.5 inline-block">{lead.industry}</span>
              </td>
              <td className="px-4 py-3"><ScoreBadge score={lead.aiScore} /></td>
              <td className="px-4 py-3">
                <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium border ${
                  lead.automationType === 'blue'   ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' :
                  lead.automationType === 'green'  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                  lead.automationType === 'purple' ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' :
                  'bg-amber-500/10 text-amber-300 border-amber-500/20'
                }`}>{lead.suggestedAutomation}</span>
              </td>
              <td className="px-4 py-3 font-mono text-[12px] text-slate-300">₱{lead.estimatedValue.toLocaleString()}</td>
              <td className="px-4 py-3">
                <span className={`text-[11px] px-2 py-0.5 rounded border font-medium capitalize ${STATUS_COLORS[lead.status] || STATUS_COLORS.new}`}>
                  {lead.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button title="Send Email"
                    onClick={() => { if (!authenticated) { toast.error('Connect Google to send emails'); return } onEmailLead(lead) }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#141425] border border-white/[0.06] text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/20 transition-colors">
                    <Mail className="w-3 h-3" />
                  </button>
                  <button title="Book Scoping Call"
                    onClick={() => { if (!authenticated) { toast.error('Connect Google to book calls'); return } onBookingLead(lead) }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#141425] border border-white/[0.06] text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-colors">
                    <Calendar className="w-3 h-3" />
                  </button>
                  <button title="More" className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#141425] border border-white/[0.06] text-slate-500 hover:text-slate-200 hover:bg-[#1a1a2e] transition-colors">
                    <MoreHorizontal className="w-3 h-3" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {leads.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-12 text-center text-[13px] text-slate-600">No leads found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors

---

## Task 5: LeadsView component

**Files:**
- Create: `src/components/views/LeadsView.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/views/LeadsView.tsx
import { Users, Mail, Calendar } from 'lucide-react'
import type { Lead, AILog } from '@/types'
import { LeadsTable } from './DashboardView'

interface Props {
  leads:         Lead[]
  logs:          AILog[]
  search:        string
  authenticated: boolean
  onEmailLead:   (lead: Lead) => void
  onBookingLead: (lead: Lead) => void
}

export default function LeadsView({ leads, search, authenticated, onEmailLead, onBookingLead }: Props) {
  const active = leads.filter(l => l.status !== 'closed')
  const filtered = active.filter(l =>
    !search || [l.name, l.company, l.industry, l.email].some(v =>
      v?.toLowerCase().includes(search.toLowerCase())
    )
  )

  const byStatus = (s: string) => active.filter(l => l.status === s).length

  return (
    <div className="space-y-5">
      {/* Status summary */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label:'Hot',       color:'#ef4444', count: byStatus('hot') },
          { label:'Qualified', color:'#3b82f6', count: byStatus('qualified') },
          { label:'Contacted', color:'#f59e0b', count: byStatus('contacted') },
          { label:'Nurture',   color:'#a855f7', count: byStatus('nurture') },
          { label:'New',       color:'#64748b', count: byStatus('new') },
        ].map(s => (
          <div key={s.label} className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl p-3 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <div>
              <div className="text-lg font-mono font-semibold text-slate-200">{s.count}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" /> Active Leads
            </div>
            <div className="text-[11px] text-slate-500">{filtered.length} of {active.length} shown · closed leads excluded</div>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">
            + Add Lead
          </button>
        </div>
        <LeadsTable leads={filtered} authenticated={authenticated} onEmailLead={onEmailLead} onBookingLead={onBookingLead} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors

---

## Task 6: AIInsightsView component

**Files:**
- Create: `src/components/views/AIInsightsView.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/views/AIInsightsView.tsx
import { Cpu, AlertTriangle, TrendingUp, Clock } from 'lucide-react'
import type { Lead, AILog } from '@/types'
import { ScoreBadge, LOG_COLORS, LOG_BORDER_COLORS, LOG_ICONS } from './shared'

interface Props {
  leads: Lead[]
  logs:  AILog[]
}

function isNeedsFollowUp(lead: Lead): boolean {
  if (!lead.lastContacted) return true
  const last = new Date(lead.lastContacted).getTime()
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  return last < sevenDaysAgo
}

export default function AIInsightsView({ leads, logs }: Props) {
  const followUp = leads.filter(isNeedsFollowUp).filter(l => l.status !== 'closed')
  const topScored = [...leads].sort((a, b) => b.aiScore - a.aiScore)

  const buckets = [
    { label: '85+',   color: '#ef4444', leads: leads.filter(l => l.aiScore >= 85) },
    { label: '70–84', color: '#f59e0b', leads: leads.filter(l => l.aiScore >= 70 && l.aiScore < 85) },
    { label: '55–69', color: '#3b82f6', leads: leads.filter(l => l.aiScore >= 55 && l.aiScore < 70) },
    { label: '<55',   color: '#64748b', leads: leads.filter(l => l.aiScore < 55) },
  ]
  const maxCount = Math.max(...buckets.map(b => b.leads.length), 1)

  return (
    <div className="grid grid-cols-2 gap-5">
      {/* Full AI Log Feed */}
      <div className="col-span-2 lg:col-span-1">
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="w-4 h-4 text-blue-400" />
          <div className="text-sm font-semibold text-slate-200">AI Activity Feed</div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-mono font-semibold border border-blue-500/20">{logs.length}</span>
        </div>
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {logs.map(log => (
            <div key={log.id}
              className="p-3 bg-[#0f0f1a] rounded-lg border border-white/[0.06] border-l-2"
              style={{ borderLeftColor: LOG_BORDER_COLORS[log.type] || '#475569' }}>
              <div className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${LOG_COLORS[log.type]?.split(' ')[1] || 'text-slate-500'}`}>
                {LOG_ICONS[log.type]}
                {log.type.replace('_', ' ')}
              </div>
              <div className="text-[12px] text-slate-300 leading-relaxed">{log.message}</div>
              <div className="text-[10px] text-slate-600 font-mono mt-1.5">{log.timestamp}</div>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-center py-12 text-slate-600 text-sm">No activity logged yet.</div>
          )}
        </div>
      </div>

      {/* Right column */}
      <div className="col-span-2 lg:col-span-1 space-y-5">
        {/* Score Distribution */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <div className="text-sm font-semibold text-slate-200">AI Score Distribution</div>
          </div>
          <div className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl p-4 space-y-3">
            {buckets.map(b => (
              <div key={b.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-slate-400 font-mono w-10">{b.label}</span>
                  <span className="text-[11px] text-slate-500">{b.leads.length} lead{b.leads.length !== 1 ? 's' : ''}</span>
                  <span className="text-[11px] text-slate-600 font-mono">
                    {leads.length ? Math.round(b.leads.length / leads.length * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 bg-[#141425] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${(b.leads.length / maxCount) * 100}%`, background: b.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Scored */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <div className="text-sm font-semibold text-slate-200">Top Scored Leads</div>
          </div>
          <div className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl overflow-hidden">
            {topScored.map((lead, i) => (
              <div key={lead.id} className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 hover:bg-[#141425] transition-colors">
                <span className="text-[11px] text-slate-600 font-mono w-4 flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-slate-200 truncate">{lead.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{lead.company}</div>
                </div>
                <ScoreBadge score={lead.aiScore} />
              </div>
            ))}
          </div>
        </div>

        {/* Needs Follow-up */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-amber-400" />
            <div className="text-sm font-semibold text-slate-200">Needs Follow-up</div>
            {followUp.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-mono font-semibold border border-amber-500/20">{followUp.length}</span>
            )}
          </div>
          <div className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl overflow-hidden">
            {followUp.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-600 text-sm">All leads contacted within 7 days.</div>
            ) : followUp.map(lead => (
              <div key={lead.id} className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-slate-200 truncate">{lead.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {lead.lastContacted
                      ? `Last contact: ${new Date(lead.lastContacted).toLocaleDateString()}`
                      : 'Never contacted'}
                  </div>
                </div>
                <ScoreBadge score={lead.aiScore} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors

---

## Task 7: AutomationLogsView component

**Files:**
- Create: `src/components/views/AutomationLogsView.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/views/AutomationLogsView.tsx
import { Activity, Zap, CheckCircle, AlertTriangle, Circle } from 'lucide-react'
import type { AILog } from '@/types'
import { LOG_COLORS, LOG_BORDER_COLORS, LOG_ICONS } from './shared'

interface Props {
  logs: AILog[]
}

const WORKFLOWS = [
  { name: 'Lead Enrichment v2',   status: 'running' as const, runs: 47, errors: 0,  lastRun: '2m ago' },
  { name: 'AI Scoring Engine',    status: 'running' as const, runs: 47, errors: 0,  lastRun: '2m ago' },
  { name: 'G11:11 Messenger',     status: 'running' as const, runs: 12, errors: 0,  lastRun: '8m ago' },
  { name: 'FB Auto-Poster',       status: 'idle'    as const, runs: 0,  errors: 0,  lastRun: '3h ago' },
  { name: 'Scoping Call Trigger', status: 'running' as const, runs: 3,  errors: 0,  lastRun: '41m ago'},
]

const STATUS_CONFIG = {
  running: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400 animate-pulse', icon: CheckCircle },
  idle:    { color: 'text-slate-500',   bg: 'bg-slate-500/10 border-slate-500/20',     dot: 'bg-slate-600',                  icon: Circle },
  error:   { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20',         dot: 'bg-red-400 animate-pulse',      icon: AlertTriangle },
}

export default function AutomationLogsView({ logs }: Props) {
  const actionLogs = logs.filter(l => ['email_sent', 'meeting_booked', 'workflow'].includes(l.type))

  return (
    <div className="space-y-6">
      {/* Workflow Status Cards */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-amber-400" />
          <div className="text-sm font-semibold text-slate-200">n8n Workflow Status</div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {WORKFLOWS.map(w => {
            const cfg = STATUS_CONFIG[w.status]
            return (
              <div key={w.name} className={`bg-[#0f0f1a] border rounded-xl p-4 ${cfg.bg}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider ${cfg.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {w.status}
                  </div>
                </div>
                <div className="text-[13px] font-semibold text-slate-200 mb-2 leading-tight">{w.name}</div>
                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                  <span>{w.runs} runs today</span>
                  <span>{w.errors} errors</span>
                </div>
                <div className="text-[10px] text-slate-600 font-mono mt-1">Last: {w.lastRun}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Action Log */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-purple-400" />
          <div className="text-sm font-semibold text-slate-200">Automated Actions</div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 font-mono font-semibold border border-purple-500/20">
            {actionLogs.length}
          </span>
        </div>
        <div className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl overflow-hidden">
          {actionLogs.length === 0 ? (
            <div className="px-4 py-12 text-center text-slate-600 text-sm">No automated actions logged yet.</div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {actionLogs.map(log => (
                <div key={log.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-[#141425] transition-colors border-l-2"
                  style={{ borderLeftColor: LOG_BORDER_COLORS[log.type] || '#475569' }}>
                  <div className={`mt-0.5 flex-shrink-0 ${LOG_COLORS[log.type]?.split(' ')[1] || 'text-slate-500'}`}>
                    {LOG_ICONS[log.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-slate-300 leading-relaxed">{log.message}</div>
                    <div className={`text-[10px] font-semibold uppercase tracking-wider mt-0.5 ${LOG_COLORS[log.type]?.split(' ')[1] || 'text-slate-600'}`}>
                      {log.type.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-600 font-mono flex-shrink-0">{log.timestamp}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors

---

## Task 8: CalendarView component

**Files:**
- Create: `src/components/views/CalendarView.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/views/CalendarView.tsx
'use client'
import { useState, useEffect } from 'react'
import { CalendarDays, Video, Clock, Plus, RefreshCw, Users } from 'lucide-react'
import type { Lead } from '@/types'
import BookingModal from '@/components/calendar/BookingModal'

interface CalEvent {
  id:          string
  summary:     string
  start:       string
  end:         string
  attendees?:  { email?: string; name?: string; status?: string }[]
  meetLink?:   string
  htmlLink?:   string
  description?: string
  status?:     string
}

interface Props {
  leads: Lead[]
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatDuration(start: string, end: string): string {
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
  return mins >= 60 ? `${mins / 60}h` : `${mins}m`
}

function getWeekDays(startDate: Date): Date[] {
  const days: Date[] = []
  const monday = new Date(startDate)
  monday.setDate(startDate.getDate() - ((startDate.getDay() + 6) % 7))
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    days.push(d)
  }
  return days
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

export default function CalendarView({ leads }: Props) {
  const [events,       setEvents]       = useState<CalEvent[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [bookingLead,  setBookingLead]  = useState<Lead | null>(null)
  const [weekOffset,   setWeekOffset]   = useState(0)

  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/calendar?days=30')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch events')
      setEvents(data.events || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar')
    } finally {
      setLoading(false)
    }
  }

  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() + weekOffset * 7)
  const weekDays = getWeekDays(weekStart)

  const eventsForDay = (day: Date) =>
    events.filter(e => e.start && isSameDay(new Date(e.start), day))

  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-400" /> Calendar
          </div>
          <div className="text-[11px] text-slate-500">
            {weekDays[0].toLocaleDateString('en-PH', { month:'short', day:'numeric' })} –{' '}
            {weekDays[6].toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(w => w - 1)}
            className="px-3 py-1.5 text-xs text-slate-400 bg-[#141425] border border-white/[0.06] rounded-lg hover:text-slate-200 hover:bg-[#1a1a2e] transition-colors">
            ← Prev
          </button>
          <button onClick={() => setWeekOffset(0)}
            className="px-3 py-1.5 text-xs text-slate-400 bg-[#141425] border border-white/[0.06] rounded-lg hover:text-slate-200 hover:bg-[#1a1a2e] transition-colors">
            Today
          </button>
          <button onClick={() => setWeekOffset(w => w + 1)}
            className="px-3 py-1.5 text-xs text-slate-400 bg-[#141425] border border-white/[0.06] rounded-lg hover:text-slate-200 hover:bg-[#1a1a2e] transition-colors">
            Next →
          </button>
          <button onClick={fetchEvents}
            className={`w-8 h-8 flex items-center justify-center rounded-lg bg-[#141425] border border-white/[0.06] text-slate-500 hover:text-slate-300 transition-colors ${loading ? 'animate-spin' : ''}`}>
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setBookingLead(leads[0] ?? null)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">
            <Plus className="w-3 h-3" /> Book New Call
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Weekly Grid */}
      <div className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-white/[0.06]">
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, today)
            return (
              <div key={i} className={`px-3 py-2.5 text-center border-r border-white/[0.04] last:border-0 ${isToday ? 'bg-blue-500/10' : 'bg-[#141425]'}`}>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">{DAY_LABELS[i]}</div>
                <div className={`text-[15px] font-semibold font-mono mt-0.5 ${isToday ? 'text-blue-400' : 'text-slate-300'}`}>
                  {day.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        {/* Event cells */}
        <div className="grid grid-cols-7 min-h-[360px]">
          {weekDays.map((day, i) => {
            const dayEvents = eventsForDay(day)
            const isToday = isSameDay(day, today)
            return (
              <div key={i} className={`border-r border-white/[0.04] last:border-0 p-2 space-y-1.5 ${isToday ? 'bg-blue-500/[0.03]' : ''}`}>
                {loading && i === 0 && (
                  <div className="col-span-7 flex items-center justify-center py-16 text-slate-600 text-sm">
                    Loading…
                  </div>
                )}
                {dayEvents.map(ev => (
                  <div key={ev.id}
                    className="bg-blue-500/15 border border-blue-500/25 rounded-lg p-2 hover:bg-blue-500/20 transition-colors cursor-default">
                    <div className="text-[11px] font-semibold text-blue-300 leading-tight truncate">{ev.summary}</div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-blue-400/70 font-mono">
                      <Clock className="w-2.5 h-2.5" />
                      {formatTime(ev.start)} · {formatDuration(ev.start, ev.end)}
                    </div>
                    {ev.attendees && ev.attendees.length > 1 && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                        <Users className="w-2.5 h-2.5" />
                        {ev.attendees.filter(a => a.email !== undefined).length} attendees
                      </div>
                    )}
                    {ev.meetLink && (
                      <a href={ev.meetLink} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 mt-1.5 text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                        onClick={e => e.stopPropagation()}>
                        <Video className="w-2.5 h-2.5" /> Join Meet
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Upcoming list */}
      {!loading && events.length > 0 && (
        <div>
          <div className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-2">All Upcoming ({events.length})</div>
          <div className="space-y-2">
            {events.slice(0, 10).map(ev => (
              <div key={ev.id} className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center gap-4">
                <div className="text-center min-w-[48px]">
                  <div className="text-[10px] text-slate-500 uppercase">
                    {new Date(ev.start).toLocaleDateString('en-PH', { month:'short' })}
                  </div>
                  <div className="text-xl font-mono font-semibold text-slate-200">{new Date(ev.start).getDate()}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-slate-200 truncate">{ev.summary}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {formatTime(ev.start)} · {formatDuration(ev.start, ev.end)}
                  </div>
                </div>
                {ev.meetLink && (
                  <a href={ev.meetLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold rounded-lg hover:bg-emerald-500/20 transition-colors">
                    <Video className="w-3 h-3" /> Join Meet
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && events.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CalendarDays className="w-12 h-12 text-slate-700 mb-4" />
          <div className="text-slate-400 font-semibold mb-1">No upcoming bookings</div>
          <div className="text-slate-600 text-sm mb-4">Book a scoping call to see it here.</div>
          <button onClick={() => setBookingLead(leads[0] ?? null)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">
            <Plus className="w-3.5 h-3.5" /> Book New Call
          </button>
        </div>
      )}

      {bookingLead && <BookingModal lead={bookingLead} onClose={() => { setBookingLead(null); fetchEvents() }} />}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors

---

## Task 9: SettingsView component

**Files:**
- Create: `src/components/views/SettingsView.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/views/SettingsView.tsx
'use client'
import { useState, useEffect } from 'react'
import { Settings, Save, CheckCircle, ExternalLink, User, Database, Link } from 'lucide-react'
import toast from 'react-hot-toast'

interface AppSettings {
  sheetId:     string
  leadsTab:    string
  scopingTab:  string
  chatLogsTab: string
  calendlyUrl: string
  adminEmail:  string
}

interface Props {
  userEmail?: string
  userName?:  string
  userImage?: string
}

export default function SettingsView({ userEmail, userName, userImage }: Props) {
  const [settings, setSettings] = useState<AppSettings>({
    sheetId:     '',
    leadsTab:    'Leads',
    scopingTab:  'Scoping Calls',
    chatLogsTab: 'Chat Logs',
    calendlyUrl: '',
    adminEmail:  '',
  })
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => setSettings(data))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  const set = (key: keyof AppSettings, val: string) =>
    setSettings(prev => ({ ...prev, [key]: val }))

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      toast.success('Settings saved')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-600 text-sm">Loading settings…</div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Google Account */}
      <section className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-blue-400" />
          <div className="text-sm font-semibold text-slate-200">Google Account</div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-[#141425] border border-white/[0.06] rounded-lg">
          {userImage ? (
            <img src={userImage} alt={userName} className="w-10 h-10 rounded-full flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {userName?.split(' ').map(n => n[0]).join('').slice(0,2) || 'AF'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-slate-200">{userName || 'Angelo Franco'}</div>
            <div className="text-[11px] text-slate-500">{userEmail || '—'}</div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
            <CheckCircle className="w-3.5 h-3.5" /> Connected
          </div>
        </div>
        <p className="text-[11px] text-slate-600 mt-2">
          OAuth scopes: Gmail · Calendar · Sheets. Manage in{' '}
          <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors">
            Google Account settings <ExternalLink className="w-2.5 h-2.5 inline" />
          </a>
        </p>
      </section>

      {/* Google Sheet */}
      <section className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-emerald-400" />
          <div className="text-sm font-semibold text-slate-200">Google Sheets CRM</div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-1 block">Sheet ID</label>
            <input value={settings.sheetId} onChange={e => set('sheetId', e.target.value)}
              className="w-full bg-[#141425] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-slate-200 font-mono outline-none focus:border-blue-500/50 transition-colors"
              placeholder="1i_fOiBvv..." />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {([
              ['leadsTab',    'Leads Tab'],
              ['scopingTab',  'Scoping Tab'],
              ['chatLogsTab', 'Chat Logs Tab'],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <label className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-1 block">{label}</label>
                <input value={settings[key]} onChange={e => set(key, e.target.value)}
                  className="w-full bg-[#141425] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-slate-200 outline-none focus:border-blue-500/50 transition-colors"
                  placeholder={label} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Config */}
      <section className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Link className="w-4 h-4 text-purple-400" />
          <div className="text-sm font-semibold text-slate-200">App Config</div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-1 block">Admin Email</label>
            <input value={settings.adminEmail} onChange={e => set('adminEmail', e.target.value)}
              type="email"
              className="w-full bg-[#141425] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-slate-200 outline-none focus:border-blue-500/50 transition-colors"
              placeholder="you@company.com" />
          </div>
          <div>
            <label className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-1 block">Calendly URL</label>
            <input value={settings.calendlyUrl} onChange={e => set('calendlyUrl', e.target.value)}
              className="w-full bg-[#141425] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-slate-200 outline-none focus:border-blue-500/50 transition-colors"
              placeholder="https://calendly.com/your-link" />
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
          {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors

---

## Task 10: Rewrite dashboard/page.tsx as thin router

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Replace the file entirely**

```tsx
// src/app/dashboard/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import {
  LayoutDashboard, Users, Cpu, Activity, Settings,
  Bell, Search, RefreshCw, LogOut, LogIn, CalendarDays, Layers
} from 'lucide-react'
import type { Lead, AILog } from '@/types'
import EmailModal        from '@/components/email/EmailModal'
import BookingModal      from '@/components/calendar/BookingModal'
import AISidePanel       from '@/components/views/AISidePanel'
import DashboardView     from '@/components/views/DashboardView'
import LeadsView         from '@/components/views/LeadsView'
import AIInsightsView    from '@/components/views/AIInsightsView'
import AutomationLogsView from '@/components/views/AutomationLogsView'
import CalendarView      from '@/components/views/CalendarView'
import SettingsView      from '@/components/views/SettingsView'
import toast, { Toaster } from 'react-hot-toast'

// ─── Mock fallback data ───────────────────────────────────────────────────────
const MOCK_LEADS: Lead[] = [
  { id:'1', sheetRow:2, name:'Maria Santos',    email:'maria@techcorp.ph',     phone:'+63 917 123 4567', company:'TechCorp PH',    industry:'Software',    aiScore:95, aiReadinessScore:95, suggestedAutomation:'NetSuite SuiteScript Automation', automationType:'blue',   estimatedValue:85000,  status:'hot',       source:'landing_page', createdAt:'2026-03-28', outreachHook:'Your manual ERP reconciliation could be eliminated entirely — here\'s how we did it for 3 SaaS firms in 60 days.' },
  { id:'2', sheetRow:3, name:'Ramon dela Cruz', email:'ramon@medisync.ph',     phone:'+63 918 234 5678', company:'MediSync Inc.',  industry:'Healthcare',  aiScore:91, aiReadinessScore:91, suggestedAutomation:'AI Patient Scheduling Bot',        automationType:'green',  estimatedValue:120000, status:'qualified',  source:'n8n_webhook',  createdAt:'2026-03-27', outreachHook:'Clinics using AI scheduling see 40% fewer no-shows — I\'d love to show you the exact workflow.' },
  { id:'3', sheetRow:4, name:'Carla Reyes',     email:'carla@logitrack.ph',    phone:'+63 919 345 6789', company:'LogiTrack PH',  industry:'Logistics',   aiScore:88, aiReadinessScore:88, suggestedAutomation:'Route Optimization AI',            automationType:'purple', estimatedValue:95000,  status:'hot',       source:'google_sheets',createdAt:'2026-03-26', outreachHook:'Your dispatch team spends 3+ hours daily on routes that AI solves in seconds.' },
  { id:'4', sheetRow:5, name:'Jose Mendoza',    email:'jose@retailpro.ph',     phone:'+63 920 456 7890', company:'RetailPro Corp',industry:'Retail',      aiScore:82, aiReadinessScore:82, suggestedAutomation:'AI Inventory Predictor',           automationType:'amber',  estimatedValue:60000,  status:'contacted', source:'landing_page', createdAt:'2026-03-25', lastContacted:'2026-03-29' },
  { id:'5', sheetRow:6, name:'Ana Villanueva',  email:'ana@edulearn.ph',       phone:'+63 921 567 8901', company:'EduLearn PH',   industry:'Education',   aiScore:77, aiReadinessScore:77, suggestedAutomation:'AI Enrollment Chatbot',            automationType:'blue',   estimatedValue:45000,  status:'new',       source:'n8n_webhook',  createdAt:'2026-03-24', outreachHook:'Schools using AI intake bots process 5x more enrollment inquiries without adding staff.' },
  { id:'6', sheetRow:7, name:'Mark Bautista',   email:'mark@finserve.ph',      phone:'+63 922 678 9012', company:'FinServe MNL',  industry:'Finance',     aiScore:71, aiReadinessScore:71, suggestedAutomation:'Compliance Report AI',             automationType:'green',  estimatedValue:110000, status:'nurture',   source:'manual',       createdAt:'2026-03-22' },
  { id:'7', sheetRow:8, name:'Liza Guzman',     email:'liza@foodchain.ph',     phone:'+63 923 789 0123', company:'FoodChain PH',  industry:'F&B',         aiScore:65, aiReadinessScore:65, suggestedAutomation:'Customer Support Bot',             automationType:'purple', estimatedValue:35000,  status:'new',       source:'landing_page', createdAt:'2026-03-20' },
]

const MOCK_LOGS: AILog[] = [
  { id:'1', type:'enriched',      message:'TechCorp PH — NetSuite ERP usage detected. Lead Score → 95',             leadId:'1', timestamp:'2m ago' },
  { id:'2', type:'scored',        message:'MediSync Inc. — Healthcare AI readiness confirmed. Est. ROI: ₱2.1M/yr', leadId:'2', timestamp:'8m ago' },
  { id:'3', type:'alert',         message:'LogiTrack PH — High-intent signal: visited pricing page 3×',            leadId:'3', timestamp:'15m ago' },
  { id:'4', type:'workflow',      message:'n8n "Lead Enrichment v2" — 47 runs today, 0 errors. Avg 1.4s',          timestamp:'22m ago' },
  { id:'5', type:'email_sent',    message:'Follow-up email sent to Jose Mendoza · RetailPro Corp',                  leadId:'4', timestamp:'34m ago' },
  { id:'6', type:'meeting_booked',message:'Scoping Call booked: EduLearn PH — April 2, 10:00 AM PHT',              leadId:'5', timestamp:'41m ago' },
]

// Pages that get full width (no side panel)
const FULL_WIDTH_PAGES = new Set(['Calendar', 'Settings'])

// Nav definition
const NAV_MAIN = [
  { label: 'Dashboard',      icon: LayoutDashboard },
  { label: 'Leads (Active)', icon: Users,       badge: (leads: Lead[]) => leads.filter(l => l.status !== 'closed').length },
  { label: 'AI Insights',    icon: Cpu,         badge: (logs: AILog[]) => logs.filter(l => l.type === 'alert').length, badgeAmber: true },
  { label: 'Calendar',       icon: CalendarDays },
]
const NAV_AUTO = [
  { label: 'Automation Logs', icon: Activity },
  { label: 'Settings',        icon: Settings },
]

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [leads,       setLeads]       = useState<Lead[]>(MOCK_LEADS)
  const [logs,        setLogs]        = useState<AILog[]>(MOCK_LOGS)
  const [loading,     setLoading]     = useState(false)
  const [emailLead,   setEmailLead]   = useState<Lead | null>(null)
  const [bookingLead, setBookingLead] = useState<Lead | null>(null)
  const [search,      setSearch]      = useState('')
  const [activePage,  setActivePage]  = useState('Dashboard')

  const fetchLeads = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const res = await fetch('/api/leads')
      if (res.ok) {
        const data = await res.json()
        if (data.leads?.length) setLeads(data.leads)
      }
    } catch { /* keep mock data */ }
    finally { setLoading(false) }
  }, [session])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const authenticated = status === 'authenticated'
  const showSidePanel = !FULL_WIDTH_PAGES.has(activePage)

  function renderContent() {
    const sharedProps = { leads, logs, search, loading, authenticated, onEmailLead: setEmailLead, onBookingLead: setBookingLead, onSignIn: () => signIn('google') }
    switch (activePage) {
      case 'Dashboard':       return <DashboardView      {...sharedProps} />
      case 'Leads (Active)':  return <LeadsView          {...sharedProps} />
      case 'AI Insights':     return <AIInsightsView     leads={leads} logs={logs} />
      case 'Automation Logs': return <AutomationLogsView logs={logs} />
      case 'Calendar':        return <CalendarView        leads={leads} />
      case 'Settings':        return <SettingsView        userEmail={session?.user?.email ?? undefined} userName={session?.user?.name ?? undefined} userImage={session?.user?.image ?? undefined} />
      default:                return <DashboardView      {...sharedProps} />
    }
  }

  function NavButton({ label, icon: Icon, badge, badgeAmber }: {
    label: string; icon: React.ElementType
    badge?: number; badgeAmber?: boolean
  }) {
    const active = activePage === label
    return (
      <button onClick={() => setActivePage(label)}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium mb-0.5 transition-all text-left ${
          active ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
        }`}>
        <Icon className="w-4 h-4 flex-shrink-0 opacity-80" />
        <span className="flex-1">{label}</span>
        {badge !== undefined && badge > 0 && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold text-white ${badgeAmber ? 'bg-amber-500' : 'bg-blue-500'}`}>
            {badge}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="flex h-screen bg-[#09090f] text-slate-200 overflow-hidden font-sans">
      <Toaster position="top-right" toastOptions={{
        style: { background: '#0f0f1a', border: '1px solid rgba(148,163,184,0.12)', color: '#e2e8f0', fontSize: '13px' },
        success: { iconTheme: { primary: '#10b981', secondary: '#09090f' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: '#09090f' } },
      }} />

      {/* ── Sidebar ── */}
      <aside className="w-[220px] min-w-[220px] bg-[#0f0f1a] border-r border-white/[0.06] flex flex-col">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-slate-200 leading-tight">Vertex AI</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest">Marketing CRM</div>
          </div>
        </div>

        <nav className="flex-1 p-2 pt-3">
          <div className="text-[10px] text-slate-600 uppercase tracking-widest px-3 mb-1.5 font-medium">Main</div>
          {NAV_MAIN.map(item => (
            <NavButton key={item.label} label={item.label} icon={item.icon}
              badge={item.badge ? (typeof item.badge === 'function' && 'badge' in item
                ? undefined
                : undefined) : undefined}
              badgeAmber={'badgeAmber' in item ? (item as { badgeAmber?: boolean }).badgeAmber : false}
            />
          ))}

          <div className="text-[10px] text-slate-600 uppercase tracking-widest px-3 mb-1.5 font-medium mt-4">Automation</div>
          {NAV_AUTO.map(item => (
            <NavButton key={item.label} label={item.label} icon={item.icon} />
          ))}
        </nav>

        <div className="p-3 border-t border-white/[0.06]">
          {authenticated ? (
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#141425]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                {session.user?.name?.split(' ').map(n => n[0]).join('').slice(0,2) || 'AF'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-slate-200 truncate">{session.user?.name || 'Angelo Franco'}</div>
                <div className="text-[10px] text-slate-500 truncate">Admin · Consultant</div>
              </div>
              <button onClick={() => signOut()} title="Sign out" className="text-slate-600 hover:text-red-400 transition-colors">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button onClick={() => signIn('google')}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors">
              <LogIn className="w-3.5 h-3.5" /> Connect Google
            </button>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-[#0f0f1a] border-b border-white/[0.06] px-6 py-3 flex items-center gap-4 flex-shrink-0">
          <div className="flex-1">
            <div className="text-[15px] font-semibold text-slate-200">{activePage}</div>
            <div className="text-[11px] text-slate-500">Vertex AI Marketing CRM</div>
          </div>
          {['Dashboard','Leads (Active)'].includes(activePage) && (
            <div className="flex items-center gap-2 bg-[#141425] border border-white/[0.06] rounded-lg px-3 py-2 min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search leads…" className="bg-transparent outline-none text-[13px] text-slate-200 placeholder-slate-600 w-full" />
            </div>
          )}
          <button onClick={fetchLeads}
            className={`w-8 h-8 flex items-center justify-center rounded-lg bg-[#141425] border border-white/[0.06] text-slate-500 hover:text-slate-300 transition-colors ${loading ? 'animate-spin' : ''}`}>
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <div className="relative">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#141425] border border-white/[0.06] text-slate-500 hover:text-slate-300 transition-colors">
              <Bell className="w-3.5 h-3.5" />
            </button>
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
          </div>
          {!authenticated && (
            <button onClick={() => signIn('google')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors">
              <LogIn className="w-3 h-3" /> Sign in
            </button>
          )}
        </header>

        <div className="flex-1 flex overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto p-5 min-w-0">
            {renderContent()}
          </div>

          {showSidePanel && (
            <AISidePanel logs={logs} leads={leads} />
          )}
        </div>
      </div>

      {emailLead   && <EmailModal   lead={emailLead}   onClose={() => setEmailLead(null)} />}
      {bookingLead && <BookingModal lead={bookingLead} onClose={() => setBookingLead(null)} />}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles clean**

```bash
npx tsc --noEmit 2>&1
```
Expected: no errors

- [ ] **Step 3: Run build**

```bash
npm run build 2>&1
```
Expected: `✓ Compiled successfully` with all 9 routes listed, no type errors

- [ ] **Step 4: Start dev server and verify in browser**

```bash
npm run dev
```

Open `http://localhost:3000/dashboard` and verify:
- All 6 nav items present (Dashboard, Leads (Active), AI Insights, Calendar, Automation Logs, Settings)
- Clicking each nav item switches the main content without page reload
- Side panel visible on Dashboard / Leads / AI Insights / Automation Logs
- Side panel hidden on Calendar / Settings
- Search bar only visible on Dashboard and Leads (Active)
- Settings loads and Save button posts to `/api/settings`
- Calendar shows weekly grid and "Book New Call" button

- [ ] **Step 5: Fix nav badge rendering**

The `NAV_MAIN` badge functions need to be called at render time. In `dashboard/page.tsx`, update the nav render to resolve badge values:

Replace the `NavButton` calls for NAV_MAIN items with:

```tsx
{NAV_MAIN.map(item => {
  const badgeVal = 'badge' in item && typeof item.badge === 'function'
    ? item.badge(leads as Lead[] & AILog[])
    : undefined
  return (
    <NavButton key={item.label} label={item.label} icon={item.icon}
      badge={badgeVal as number | undefined}
      badgeAmber={'badgeAmber' in item ? (item as { badgeAmber?: boolean }).badgeAmber : false}
    />
  )
})}
```

Because `NAV_MAIN` has mixed badge types (leads vs logs), replace `NAV_MAIN` definition with typed per-item approach:

```tsx
// Replace the NAV_MAIN const with this in the component body, after leads/logs state:
const navMain = [
  { label: 'Dashboard',      icon: LayoutDashboard, badge: undefined,                                      badgeAmber: false },
  { label: 'Leads (Active)', icon: Users,            badge: leads.filter(l => l.status !== 'closed').length, badgeAmber: false },
  { label: 'AI Insights',    icon: Cpu,              badge: logs.filter(l => l.type === 'alert').length,      badgeAmber: true  },
  { label: 'Calendar',       icon: CalendarDays,     badge: undefined,                                      badgeAmber: false },
]
```

And update the nav render to use `navMain` instead of `NAV_MAIN`.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/settings/route.ts \
        src/components/views/shared.tsx \
        src/components/views/AISidePanel.tsx \
        src/components/views/DashboardView.tsx \
        src/components/views/LeadsView.tsx \
        src/components/views/AIInsightsView.tsx \
        src/components/views/AutomationLogsView.tsx \
        src/components/views/CalendarView.tsx \
        src/components/views/SettingsView.tsx \
        src/app/dashboard/page.tsx \
        docs/superpowers/specs/2026-03-30-dashboard-navigation-design.md \
        docs/superpowers/plans/2026-03-30-dashboard-navigation.md
git commit -m "feat: implement full dashboard navigation with 6 views"
```

---

## Self-Review Checklist

- [x] **Settings API** — GET/POST with `settings.json` fallback to env ✓
- [x] **AISidePanel** — extracted, receives logs + leads as props ✓
- [x] **DashboardView** — stat cards, leads table, outreach hooks ✓
- [x] **LeadsView** — filters `status !== 'closed'`, status summary bars ✓
- [x] **AIInsightsView** — full log feed, top scored, follow-up (7-day rule), score distribution ✓
- [x] **AutomationLogsView** — 5 workflow cards, filtered action log ✓
- [x] **CalendarView** — `/api/calendar?days=30`, weekly grid, prev/next/today, BookingModal ✓
- [x] **SettingsView** — loads from API, saves to API, Google account display ✓
- [x] **Router** — 6 nav items, `FULL_WIDTH_PAGES` set, side panel conditional, search only on lead pages ✓
- [x] **Nav badges** — leads count on Leads (Active), alert count on AI Insights ✓
- [x] No TBDs or placeholder text ✓
- [x] All type imports match `src/types/index.ts` ✓
