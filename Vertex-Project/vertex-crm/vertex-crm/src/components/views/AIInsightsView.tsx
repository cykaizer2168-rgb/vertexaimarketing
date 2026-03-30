// src/components/views/AIInsightsView.tsx
import { Cpu, AlertTriangle, TrendingUp, Clock } from 'lucide-react'
import type { Lead, AILog } from '@/types'
import { ScoreBadge, LOG_TEXT_COLORS, LOG_BORDER_COLORS, LOG_ICONS } from './shared'

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
  const followUp  = leads.filter(isNeedsFollowUp).filter(l => l.status !== 'closed')
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
              <div className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${LOG_TEXT_COLORS[log.type] || 'text-slate-500'}`}>
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
