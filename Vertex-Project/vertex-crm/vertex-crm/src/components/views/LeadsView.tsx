// src/components/views/LeadsView.tsx
import { Users } from 'lucide-react'
import type { Lead, LeadStatus } from '@/types'
import { LeadsTable } from './DashboardView'

interface Props {
  leads:           Lead[]
  search:          string
  authenticated:   boolean
  onEmailLead:     (lead: Lead) => void
  onBookingLead:   (lead: Lead) => void
  onSignIn?:       () => void
  onStatusChange?: (lead: Lead, status: LeadStatus) => void
  onAddLead?:      () => void
}

export default function LeadsView({ leads, search, authenticated, onEmailLead, onBookingLead, onStatusChange, onAddLead }: Props) {
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
          <button onClick={onAddLead} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">
            + Add Lead
          </button>
        </div>
        <LeadsTable leads={filtered} authenticated={authenticated} onEmailLead={onEmailLead} onBookingLead={onBookingLead} onStatusChange={onStatusChange} />
      </div>
    </div>
  )
}
