// src/components/views/AutomationLogsView.tsx
import { Activity, Zap, CheckCircle, AlertTriangle, Circle } from 'lucide-react'
import type { AILog } from '@/types'
import { LOG_TEXT_COLORS, LOG_BORDER_COLORS, LOG_ICONS } from './shared'

interface Props {
  logs: AILog[]
}

const WORKFLOWS = [
  { name: 'Lead Enrichment v2',   status: 'running' as const, runs: 47, errors: 0, lastRun: '2m ago'  },
  { name: 'AI Scoring Engine',    status: 'running' as const, runs: 47, errors: 0, lastRun: '2m ago'  },
  { name: 'G11:11 Messenger',     status: 'running' as const, runs: 12, errors: 0, lastRun: '8m ago'  },
  { name: 'FB Auto-Poster',       status: 'idle'    as const, runs: 0,  errors: 0, lastRun: '3h ago'  },
  { name: 'Scoping Call Trigger', status: 'running' as const, runs: 3,  errors: 0, lastRun: '41m ago' },
]

const STATUS_CONFIG = {
  running: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400 animate-pulse', Icon: CheckCircle },
  idle:    { color: 'text-slate-500',   bg: 'bg-slate-500/10 border-slate-500/20',     dot: 'bg-slate-600',                  Icon: Circle       },
  error:   { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20',         dot: 'bg-red-400 animate-pulse',      Icon: AlertTriangle },
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
                <div className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider mb-3 ${cfg.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {w.status}
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
                  <div className={`mt-0.5 flex-shrink-0 ${LOG_TEXT_COLORS[log.type] || 'text-slate-500'}`}>
                    {LOG_ICONS[log.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-slate-300 leading-relaxed">{log.message}</div>
                    <div className={`text-[10px] font-semibold uppercase tracking-wider mt-0.5 ${LOG_TEXT_COLORS[log.type] || 'text-slate-600'}`}>
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
