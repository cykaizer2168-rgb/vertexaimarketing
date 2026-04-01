'use client'

import { Fragment, useState } from 'react'
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
      try {
        await onSave(campaignId, n)
      } catch {
        // parent (handleSaveThreshold) already shows toast.error
      } finally {
        setSaving(false)
      }
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
    { label: 'Total Spend',     value: `₱${totalSpend.toLocaleString()}`,  sub: 'All campaigns',                                  accent: '#f59e0b' },
    { label: 'Avg CPL',         value: `₱${avgCpl.toFixed(0)}`,            sub: 'Spend ÷ leads',                                  accent: '#3b82f6' },
    { label: 'Avg ROAS',        value: `${avgRoas.toFixed(2)}x`,           sub: 'Weighted by spend',                              accent: '#10b981' },
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
                  <Fragment key={c.campaignId}>
                    {/* Campaign row */}
                    <tr
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
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
