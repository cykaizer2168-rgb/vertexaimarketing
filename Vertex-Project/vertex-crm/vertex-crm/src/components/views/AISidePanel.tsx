// src/components/views/AISidePanel.tsx
import type { AILog, Lead } from '@/types'
import { LOG_TEXT_COLORS, LOG_BORDER_COLORS, LOG_ICONS } from './shared'

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
            <div className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${LOG_TEXT_COLORS[log.type] || 'text-slate-500'}`}>
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
