// src/components/views/DashboardView.tsx
import { useState } from 'react'
import { Users, Target, DollarSign, Zap, TrendingUp, ArrowUpRight,
         Mail, Calendar, MoreHorizontal, ChevronDown, AlertTriangle, FileText } from 'lucide-react'
import type { Lead, LeadStatus } from '@/types'
import { ScoreBadge, STATUS_COLORS } from './shared'
import toast from 'react-hot-toast'
import StatusDropdown from './StatusDropdown'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis,
} from 'recharts'

// ── Analytics helpers ─────────────────────────────────────────────────────────
const STATUS_CHART_COLORS: Record<string, string> = {
  new:       '#3b82f6',
  contacted: '#f59e0b',
  qualified: '#a855f7',
  hot:       '#ef4444',
  nurture:   '#06b6d4',
  closed:    '#10b981',
}

const SOURCE_COLORS: Record<string, string> = {
  google_sheets: '#3b82f6',
  manual:        '#10b981',
  n8n_webhook:   '#f59e0b',
  landing_page:  '#a855f7',
}

const SOURCE_LABELS: Record<string, string> = {
  google_sheets: 'Google Sheets',
  manual:        'Manual',
  n8n_webhook:   'n8n Webhook',
  landing_page:  'Landing Page',
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a2e] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-slate-200 shadow-xl">
      <span className="capitalize">{payload[0].name}</span>
      <span className="ml-2 font-mono font-semibold">{payload[0].value}</span>
    </div>
  )
}

function AnalyticsSection({ leads }: { leads: Lead[] }) {
  const statusData = Object.entries(
    leads.reduce<Record<string, number>>((acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  const industryData = Object.entries(
    leads.reduce<Record<string, number>>((acc, l) => {
      if (l.industry) acc[l.industry] = (acc[l.industry] || 0) + 1
      return acc
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }))

  const sourceData = Object.entries(
    leads.reduce<Record<string, number>>((acc, l) => {
      acc[l.source] = (acc[l.source] || 0) + 1
      return acc
    }, {})
  ).map(([src, value]) => ({
    name:  SOURCE_LABELS[src] || src,
    value,
    color: SOURCE_COLORS[src] || '#64748b',
  }))

  return (
    <div className="grid grid-cols-3 gap-3">

      {/* ── Status Distribution ── */}
      <div className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl p-4">
        <div className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-3">Status Breakdown</div>
        <div className="flex items-center gap-3">
          <ResponsiveContainer width={96} height={96}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={26} outerRadius={44}
                dataKey="value" strokeWidth={0} paddingAngle={2}>
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={STATUS_CHART_COLORS[entry.name] || '#64748b'} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
            {statusData.map(entry => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: STATUS_CHART_COLORS[entry.name] || '#64748b' }} />
                <span className="text-[11px] text-slate-400 capitalize truncate">{entry.name}</span>
                <span className="text-[11px] text-slate-200 font-mono ml-auto">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Top Industries ── */}
      <div className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl p-4">
        <div className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-3">Top Industries</div>
        {industryData.length === 0 ? (
          <div className="text-[11px] text-slate-600 mt-6 text-center">No data</div>
        ) : (
          <ResponsiveContainer width="100%" height={128}>
            <BarChart data={industryData} layout="vertical" barSize={7} margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={90}
                tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}
                background={{ fill: '#141425', radius: 4 }} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Lead Sources ── */}
      <div className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl p-4">
        <div className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-3">Lead Sources</div>
        <div className="flex items-center gap-3">
          <ResponsiveContainer width={96} height={96}>
            <PieChart>
              <Pie data={sourceData} cx="50%" cy="50%" innerRadius={26} outerRadius={44}
                dataKey="value" strokeWidth={0} paddingAngle={2}>
                {sourceData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
            {sourceData.map(entry => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
                <span className="text-[11px] text-slate-400 truncate">{entry.name}</span>
                <span className="text-[11px] text-slate-200 font-mono ml-auto">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}

interface Props {
  leads:            Lead[]
  search:           string
  authenticated:    boolean
  onEmailLead:      (lead: Lead) => void
  onBookingLead:    (lead: Lead) => void
  onSignIn:         () => void
  onStatusChange?:  (lead: Lead, status: LeadStatus) => void
  onAddLead?:       () => void
  onGenerateQuote?: (lead: Lead) => void
}

export default function DashboardView({
  leads, search, authenticated, onEmailLead, onBookingLead, onSignIn, onStatusChange, onAddLead, onGenerateQuote
}: Props) {
  const filtered = leads.filter(l =>
    !search || [l.name, l.company, l.industry].some(v =>
      v.toLowerCase().includes(search.toLowerCase())
    )
  )

  const stats = {
    total:    leads.length,
    newLeads: leads.filter(l => l.status === 'new').length,
    pipeline: leads.reduce((s, l) => s + l.estimatedValue, 0),
    hotLeads: leads.filter(l => l.status === 'hot').length,
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
          { label:'Total Leads',      value: stats.total,                             sub:'All time',            icon: Users,      accent:'#3b82f6', badge:`${stats.hotLeads} hot` },
          { label:'New Leads',        value: stats.newLeads,                          sub:'Awaiting contact',    icon: Target,     accent:'#10b981', badge: stats.newLeads > 0 ? 'Needs action' : 'All clear' },
          { label:'Pipeline Value',   value: `₱${(stats.pipeline/1000).toFixed(0)}k`, sub:'Est. total revenue',  icon: DollarSign, accent:'#a855f7', badge:'Est. total' },
          { label:'Active n8n Flows', value: 11,                                      sub:'0 errors today',      icon: Zap,        accent:'#f59e0b', badge:'All healthy' },
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

      {/* Analytics */}
      <AnalyticsSection leads={leads} />

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
            <button onClick={onAddLead} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">
              + Add Lead
            </button>
          </div>
        </div>
        <LeadsTable leads={filtered} authenticated={authenticated} onEmailLead={onEmailLead} onBookingLead={onBookingLead} onStatusChange={onStatusChange} onGenerateQuote={onGenerateQuote} />
      </div>

    </div>
  )
}

// ── Shared table used by DashboardView and LeadsView ──────────────────────────
export function LeadsTable({ leads, authenticated, onEmailLead, onBookingLead, onStatusChange, onGenerateQuote }: {
  leads:            Lead[]
  authenticated:    boolean
  onEmailLead:      (lead: Lead) => void
  onBookingLead:    (lead: Lead) => void
  onStatusChange?:  (lead: Lead, status: LeadStatus) => void
  onGenerateQuote?: (lead: Lead) => void
}) {
  const [openId, setOpenId] = useState<string | null>(null)
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
                <div className="relative inline-block">
                  <span
                    onMouseDown={e => { e.stopPropagation(); onStatusChange && setOpenId(prev => prev === lead.id ? null : lead.id); }}
                    className={`text-[11px] px-2 py-0.5 rounded border font-medium capitalize ${STATUS_COLORS[lead.status] || STATUS_COLORS.new} ${onStatusChange ? 'cursor-pointer hover:ring-1 hover:ring-white/20' : ''}`}
                  >
                    {lead.status}
                  </span>
                  {onStatusChange && openId === lead.id && (
                    <StatusDropdown
                      currentStatus={lead.status}
                      onSelect={status => onStatusChange(lead, status)}
                      onClose={() => setOpenId(null)}
                    />
                  )}
                </div>
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
                  {onGenerateQuote && (
                    <button title="Generate Quote"
                      onClick={() => onGenerateQuote(lead)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#141425] border border-white/[0.06] text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-colors">
                      <FileText className="w-3 h-3" />
                    </button>
                  )}
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
