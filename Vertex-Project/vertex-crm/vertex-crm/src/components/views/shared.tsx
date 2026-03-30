// src/components/views/shared.tsx
import type { ReactNode } from 'react'
import { Cpu, CheckCircle, AlertTriangle, Activity, Mail, Calendar } from 'lucide-react'

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

export const LOG_TEXT_COLORS: Record<string, string> = {
  enriched:      'text-blue-400',
  scored:        'text-emerald-400',
  alert:         'text-amber-400',
  workflow:      'text-purple-400',
  email_sent:    'text-sky-400',
  meeting_booked:'text-teal-400',
}

export const LOG_BORDER_COLORS: Record<string, string> = {
  enriched:      '#3b82f6',
  scored:        '#10b981',
  alert:         '#f59e0b',
  workflow:      '#a855f7',
  email_sent:    '#0ea5e9',
  meeting_booked:'#14b8a6',
}

export const LOG_ICONS: Record<string, ReactNode> = {
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
