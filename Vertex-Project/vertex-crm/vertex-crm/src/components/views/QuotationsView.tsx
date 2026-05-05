// src/components/views/QuotationsView.tsx
import { FileText, DollarSign, TrendingUp, BarChart2, ExternalLink, CheckCircle, XCircle } from 'lucide-react'
import type { Quotation, QuotationStatus } from '@/types'

interface Props {
  quotations:     Quotation[]
  onUpdateStatus: (sheetRow: number, status: QuotationStatus) => Promise<void>
}

const STATUS_STYLE: Record<QuotationStatus, string> = {
  draft:    'bg-slate-500/10 text-slate-400 border-slate-500/20',
  sent:     'bg-blue-500/10  text-blue-400  border-blue-500/20',
  accepted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/10   text-red-400   border-red-500/20',
}

const SOURCE_LABEL: Record<string, string> = {
  messenger:    'Messenger',
  crm:          'CRM',
  landing_page: 'Landing Page',
}

export default function QuotationsView({ quotations, onUpdateStatus }: Props) {
  const total      = quotations.length
  const pipeline   = quotations.reduce((s, q) => s + q.totalContractValue, 0)
  const decided    = quotations.filter(q => q.status === 'accepted' || q.status === 'rejected')
  const accepted   = quotations.filter(q => q.status === 'accepted').length
  const acceptRate = decided.length > 0 ? Math.round((accepted / decided.length) * 100) : 0
  const avgDeal    = total > 0 ? Math.round(pipeline / total) : 0

  return (
    <div className="space-y-5">
      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Quotes',       value: total,                                       icon: FileText,   accent: '#3b82f6', sub: 'all time' },
          { label: 'Total Pipeline',     value: `₱${(pipeline / 1000).toFixed(1)}k`,         icon: DollarSign, accent: '#a855f7', sub: 'contract value' },
          { label: 'Acceptance Rate',    value: `${acceptRate}%`,                             icon: TrendingUp, accent: '#10b981', sub: `${accepted} of ${decided.length} decided` },
          { label: 'Avg Deal Size',      value: `₱${(avgDeal / 1000).toFixed(1)}k`,           icon: BarChart2,  accent: '#f59e0b', sub: 'per quote' },
        ].map(card => (
          <div key={card.label} className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: card.accent }} />
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-2">
              <card.icon className="w-3 h-3" style={{ color: card.accent }} />
              {card.label}
            </div>
            <div className="text-2xl font-semibold text-slate-100 font-mono tracking-tight mb-1">{card.value}</div>
            <div className="text-[11px] text-slate-500">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06]">
          <div className="text-sm font-semibold text-slate-200">All Quotations</div>
          <div className="text-[11px] text-slate-500">{total} quote{total !== 1 ? 's' : ''} total</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px]" style={{ minWidth: '1400px' }}>
            <thead>
              <tr className="bg-[#141425]">
                {[
                  'Quote ID', 'Lead', 'Company', 'Service', 'Tier',
                  'Setup Fee', 'Monthly', 'Months', 'Total Value',
                  'Inclusions', 'Validity', 'Notes', 'PDF',
                  'Sent At', 'Created', 'Status', 'Source', 'Actions',
                ].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-[10px] text-slate-500 uppercase tracking-wider font-medium border-b border-white/[0.06] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quotations.map(q => (
                <tr key={q.quoteId || q.sheetRow} className="border-b border-white/[0.04] hover:bg-blue-500/[0.04] transition-colors group">
                  <td className="px-3 py-2.5 font-mono text-slate-300 whitespace-nowrap">{q.quoteId || '—'}</td>
                  <td className="px-3 py-2.5">
                    <div className="text-slate-200 font-medium whitespace-nowrap">{q.leadName}</div>
                    <div className="text-slate-500 text-[11px]">{q.leadEmail}</div>
                  </td>
                  <td className="px-3 py-2.5 text-slate-300 whitespace-nowrap">{q.company}</td>
                  <td className="px-3 py-2.5 text-slate-300 whitespace-nowrap">{q.chosenService || '—'}</td>
                  <td className="px-3 py-2.5 text-slate-300 whitespace-nowrap">{q.chosenTier || '—'}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-300 whitespace-nowrap">₱{q.setupFee.toLocaleString()}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-300 whitespace-nowrap">₱{q.monthlyFee.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-slate-300 text-center">{q.monthsContract || '—'}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-200 font-semibold whitespace-nowrap">₱{q.totalContractValue.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-slate-400 max-w-[140px] truncate" title={q.inclusions}>{q.inclusions || '—'}</td>
                  <td className="px-3 py-2.5 text-slate-300 text-center">{q.validityDays ? `${q.validityDays}d` : '—'}</td>
                  <td className="px-3 py-2.5 text-slate-400 max-w-[120px] truncate" title={q.notes}>{q.notes || '—'}</td>
                  <td className="px-3 py-2.5">
                    {q.drivePdfUrl ? (
                      <a href={q.drivePdfUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap">
                        <ExternalLink className="w-3 h-3" /> View
                      </a>
                    ) : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-slate-400 whitespace-nowrap text-[11px]">{q.sentAt ? q.sentAt.split('T')[0] : '—'}</td>
                  <td className="px-3 py-2.5 text-slate-400 whitespace-nowrap text-[11px]">{q.createdAt ? q.createdAt.split('T')[0] : '—'}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[11px] px-2 py-0.5 rounded border font-medium capitalize ${STATUS_STYLE[q.status]}`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-400 whitespace-nowrap">{SOURCE_LABEL[q.source] ?? q.source}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {q.drivePdfUrl && (
                        <a href={q.drivePdfUrl} target="_blank" rel="noopener noreferrer" title="View PDF"
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#141425] border border-white/[0.06] text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/20 transition-colors">
                          <FileText className="w-3 h-3" />
                        </a>
                      )}
                      {q.status !== 'accepted' && (
                        <button title="Mark Accepted"
                          onClick={() => onUpdateStatus(q.sheetRow, 'accepted')}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#141425] border border-white/[0.06] text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-colors">
                          <CheckCircle className="w-3 h-3" />
                        </button>
                      )}
                      {q.status !== 'rejected' && (
                        <button title="Mark Rejected"
                          onClick={() => onUpdateStatus(q.sheetRow, 'rejected')}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#141425] border border-white/[0.06] text-slate-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-colors">
                          <XCircle className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {quotations.length === 0 && (
                <tr>
                  <td colSpan={18} className="px-4 py-12 text-center text-[13px] text-slate-600">
                    No quotations yet — generate your first quote from the Hot Leads table.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
