import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabase'
import { formatPHP, formatDate } from '../utils/compute'
import { generatePDF } from '../components/PDFExport'

const STATUS_COLORS = {
  draft: { bg: 'rgba(107,114,128,0.1)', color: '#9ca3af' },
  sent: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
  accepted: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e' },
  rejected: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
}

const SYSTEM_COLORS = {
  offgrid: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
  gridtied: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
  hybrid: { bg: 'rgba(20,184,166,0.1)', color: '#14b8a6' },
}

export default function QuoteHistory() {
  const { user, role, profile } = useAuth()
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [deleting, setDeleting] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(null)
  const [viewQuote, setViewQuote] = useState(null)

  useEffect(() => { fetchQuotes() }, [])

  const fetchQuotes = async () => {
    setLoading(true)
    let query = supabase
      .from('quotes')
      .select('id, created_at, client_name, client_address, system_type, total_revenue, status, monthly_savings, roi_months, bom, monthly_kwh, created_by')
      .order('created_at', { ascending: false })

    if (role !== 'master_admin') {
      query = query.eq('created_by', user.id)
    }

    const { data } = await query
    setQuotes(data || [])
    setLoading(false)
  }

  const deleteQuote = async (id) => {
    if (!window.confirm('Delete this quote?')) return
    setDeleting(id)
    await supabase.from('quotes').delete().eq('id', id)
    setQuotes(prev => prev.filter(q => q.id !== id))
    setDeleting(null)
  }

  const downloadPDF = async (quote) => {
    setPdfLoading(quote.id)
    try {
      await generatePDF({ quote, profile })
    } catch (e) {
      alert('Error generating PDF: ' + e.message)
    }
    setPdfLoading(null)
  }

  const filtered = quotes.filter(q => {
    const matchSearch = !search ||
      q.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      q.client_address?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || q.status === statusFilter.toLowerCase()
    return matchSearch && matchStatus
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>

        <h1 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 800, marginBottom: 20 }}>
          Quote History
        </h1>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by client name..."
            style={{
              width: '100%', padding: '12px 14px 12px 42px',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, color: 'var(--text)', fontSize: 16,
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Status filters */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20, paddingBottom: 4 }}>
          {['All', 'Draft', 'Sent', 'Accepted', 'Rejected'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: '7px 14px', borderRadius: 20, border: 'none', whiteSpace: 'nowrap',
              background: statusFilter === s ? 'var(--amber)' : 'var(--surface2)',
              color: statusFilter === s ? '#000' : 'var(--text-muted)',
              cursor: 'pointer', fontSize: 13, fontWeight: 500,
            }}>{s}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>No quotes found</div>
            <div style={{ fontSize: 14, marginTop: 8 }}>
              {search ? 'Try a different search' : 'Create your first quote on the Dashboard'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(q => {
              const statusMeta = STATUS_COLORS[q.status] || STATUS_COLORS.draft
              const sysMeta = SYSTEM_COLORS[q.system_type] || SYSTEM_COLORS.hybrid

              return (
                <div key={q.id} style={{
                  background: 'var(--surface)', borderRadius: 12,
                  border: '1px solid var(--border)', padding: '16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{q.client_name || 'No client name'}</div>
                      {q.client_address && (
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>{q.client_address}</div>
                      )}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                          background: statusMeta.bg, color: statusMeta.color,
                        }}>{q.status}</span>
                        {q.system_type && (
                          <span style={{
                            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                            background: sysMeta.bg, color: sysMeta.color,
                          }}>{q.system_type}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, color: 'var(--amber)' }}>
                        {formatPHP(q.total_revenue || 0)}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {formatDate(q.created_at)}
                      </div>
                    </div>
                  </div>

                  {(q.monthly_savings || q.roi_months) && (
                    <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 13 }}>
                      {q.monthly_savings > 0 && (
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Savings: </span>
                          <span style={{ color: 'var(--green)', fontWeight: 600 }}>{formatPHP(q.monthly_savings)}/mo</span>
                        </div>
                      )}
                      {q.roi_months > 0 && (
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Payback: </span>
                          <span style={{ fontWeight: 600 }}>{q.roi_months} months</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                    <button onClick={() => setViewQuote(q)} style={{
                      padding: '7px 16px', borderRadius: 8,
                      background: 'var(--amber-bg)', border: '1px solid var(--amber-border)',
                      color: 'var(--amber)', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                    }}>View</button>

                    <button
                      onClick={() => downloadPDF(q)}
                      disabled={pdfLoading === q.id}
                      style={{
                        padding: '7px 16px', borderRadius: 8,
                        background: 'var(--surface2)', border: '1px solid var(--border)',
                        color: 'var(--text)', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                      {pdfLoading === q.id ? (
                        <><div className="spinner" style={{ width: 12, height: 12 }} /> PDF</>
                      ) : 'Download PDF'}
                    </button>

                    <button
                      onClick={() => deleteQuote(q.id)}
                      disabled={deleting === q.id}
                      style={{
                        padding: '7px 16px', borderRadius: 8, marginLeft: 'auto',
                        background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.3)',
                        color: 'var(--red)', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                      }}>
                      {deleting === q.id ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* View quote sheet */}
      {viewQuote && (
        <>
          <div className="sheet-overlay" onClick={() => setViewQuote(null)} />
          <div className="sheet" style={{ maxHeight: '90vh' }}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700 }}>
                {viewQuote.client_name}
              </h3>
              <button onClick={() => setViewQuote(null)} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
              {[
                ['Address', viewQuote.client_address || '—'],
                ['System', viewQuote.system_type || '—'],
                ['Monthly kWh', `${viewQuote.monthly_kwh || 0} kWh`],
                ['Total', formatPHP(viewQuote.total_revenue || 0)],
                ['Monthly Savings', formatPHP(viewQuote.monthly_savings || 0)],
                ['Payback', `${viewQuote.roi_months || 0} months`],
                ['Date', formatDate(viewQuote.created_at)],
                ['Status', viewQuote.status],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                  <span style={{ fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => { downloadPDF(viewQuote); setViewQuote(null) }}
              style={{
                width: '100%', padding: '13px', borderRadius: 10, border: 'none',
                background: 'var(--amber)', color: '#000', cursor: 'pointer',
                fontSize: 15, fontWeight: 700, marginTop: 20,
              }}>
              Download PDF
            </button>
          </div>
        </>
      )}
    </div>
  )
}
