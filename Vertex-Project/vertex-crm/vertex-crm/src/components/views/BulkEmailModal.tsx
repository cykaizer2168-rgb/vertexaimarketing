'use client'
import { useState } from 'react'
import { Mail, X, CheckCircle, AlertCircle, Send, ChevronDown, ChevronUp } from 'lucide-react'
import type { Lead } from '@/types'

interface Props {
  leads: Lead[]
  onClose: () => void
}

const TEMPLATES = [
  {
    label: 'Cold Outreach — NetSuite Pain Points',
    subject: 'Quick question about your NetSuite setup, {{name}}',
    body: `Hi {{name}},

I came across {{company}} and noticed you're in the {{industry}} space — an industry where we've seen a lot of NetSuite setups that are either underleveraged or quietly causing bottlenecks.

I wanted to reach out because we specialize in NetSuite optimization and AI-powered ERP consulting. We've helped businesses like yours cut manual work, fix broken workflows, and layer AI on top of existing NetSuite data.

Would you be open to a quick 20-minute call this week? No pitch — just an honest look at where your NetSuite stands today.

Best,
Angelo Franco
NetSuitePro PH`,
  },
  {
    label: 'Follow-Up — Discovery Call Invite',
    subject: 'Free NetSuite health check for {{company}}',
    body: `Hi {{name}},

I wanted to follow up with a quick offer — we're doing free NetSuite health checks for {{industry}} companies this month.

In 30 minutes, we'll walk through your current setup and show you exactly what's misconfigured, what's underutilized, and where AI can unlock the most ROI for {{company}}.

No commitment, no sales pitch. Just an honest assessment.

Interested? Reply to this email or book directly using the link below.

Best,
Angelo Franco
NetSuitePro PH`,
  },
  {
    label: 'Blank Template',
    subject: '',
    body: '',
  },
]

function applyTemplate(text: string, lead: Lead): string {
  return text
    .replace(/\{\{name\}\}/g, lead.name || 'there')
    .replace(/\{\{company\}\}/g, lead.company || 'your company')
    .replace(/\{\{industry\}\}/g, lead.industry || 'your industry')
    .replace(/\{\{email\}\}/g, lead.email || '')
}

interface SendResult {
  lead: Lead
  status: 'pending' | 'sent' | 'error'
  error?: string
}

export default function BulkEmailModal({ leads, onClose }: Props) {
  const [selected, setSelected]     = useState<Set<string>>(new Set(leads.map(l => l.id)))
  const [subject, setSubject]       = useState(TEMPLATES[0].subject)
  const [body, setBody]             = useState(TEMPLATES[0].body)
  const [templateIdx, setTemplateIdx] = useState(0)
  const [previewLead, setPreviewLead] = useState<Lead | null>(leads[0] ?? null)
  const [showPreview, setShowPreview] = useState(false)
  const [sending, setSending]       = useState(false)
  const [results, setResults]       = useState<SendResult[] | null>(null)
  const [rateMs] = useState(1500) // 1.5s between emails to avoid Gmail throttle

  const selectedLeads = leads.filter(l => selected.has(l.id))
  const sentCount  = results?.filter(r => r.status === 'sent').length ?? 0
  const errorCount = results?.filter(r => r.status === 'error').length ?? 0
  const isDone     = results !== null && results.every(r => r.status !== 'pending')

  function toggleAll() {
    if (selected.size === leads.length) setSelected(new Set())
    else setSelected(new Set(leads.map(l => l.id)))
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function applyTemplatePreset(idx: number) {
    setTemplateIdx(idx)
    setSubject(TEMPLATES[idx].subject)
    setBody(TEMPLATES[idx].body)
  }

  async function sendAll() {
    if (!subject.trim() || !body.trim()) return
    setSending(true)
    const initial: SendResult[] = selectedLeads.map(l => ({ lead: l, status: 'pending' }))
    setResults(initial)

    for (let i = 0; i < selectedLeads.length; i++) {
      const lead = selectedLeads[i]
      try {
        const res = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to:       lead.email,
            toName:   lead.name,
            subject:  applyTemplate(subject, lead),
            body:     applyTemplate(body, lead),
            leadId:   lead.id,
            sheetRow: lead.sheetRow,
          }),
        })
        const data = await res.json()
        setResults(prev => prev!.map(r =>
          r.lead.id === lead.id
            ? { ...r, status: res.ok ? 'sent' : 'error', error: data.error }
            : r
        ))
      } catch (e: unknown) {
        setResults(prev => prev!.map(r =>
          r.lead.id === lead.id
            ? { ...r, status: 'error', error: e instanceof Error ? e.message : 'Network error' }
            : r
        ))
      }
      // Rate limit — wait between sends
      if (i < selectedLeads.length - 1) {
        await new Promise(res => setTimeout(res, rateMs))
      }
    }
    setSending(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0f0f1a] border border-white/[0.08] rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Mail className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-200">Bulk Email</div>
              <div className="text-[11px] text-slate-500">
                {isDone
                  ? `Done — ${sentCount} sent, ${errorCount} failed`
                  : `${selectedLeads.length} recipient${selectedLeads.length !== 1 ? 's' : ''} selected`}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* Results view */}
          {results ? (
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Sent', count: sentCount, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
                  { label: 'Failed', count: errorCount, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
                  { label: 'Pending', count: results.filter(r => r.status === 'pending').length, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
                ].map(s => (
                  <div key={s.label} className={`rounded-xl border p-3 text-center ${s.color}`}>
                    <div className="text-2xl font-bold font-mono">{s.count}</div>
                    <div className="text-[10px] uppercase tracking-wide mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="overflow-y-auto max-h-72 rounded-xl border border-white/[0.06]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-white/[0.03] text-slate-500 uppercase tracking-wide text-[10px]">
                      <th className="text-left px-3 py-2">Recipient</th>
                      <th className="text-left px-3 py-2">Email</th>
                      <th className="text-left px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} className="border-t border-white/[0.04]">
                        <td className="px-3 py-2 text-slate-300">{r.lead.name}</td>
                        <td className="px-3 py-2 text-slate-500 font-mono">{r.lead.email}</td>
                        <td className="px-3 py-2">
                          {r.status === 'sent'    && <span className="text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Sent</span>}
                          {r.status === 'error'   && <span className="text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {r.error || 'Error'}</span>}
                          {r.status === 'pending' && <span className="text-yellow-400 animate-pulse">Sending…</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-5 space-y-5">

              {/* Template picker */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Template</label>
                <div className="flex gap-2 flex-wrap">
                  {TEMPLATES.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => applyTemplatePreset(i)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                        templateIdx === i
                          ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                          : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:border-white/[0.12]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Subject <span className="text-slate-600 normal-case tracking-normal font-normal">— use {'{{name}}'}, {'{{company}}'}, {'{{industry}}'}</span>
                </label>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500/40 transition-colors placeholder:text-slate-600"
                  placeholder="Your email subject..."
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Body</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={10}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500/40 transition-colors font-mono resize-none placeholder:text-slate-600"
                  placeholder="Write your email body..."
                />
              </div>

              {/* Preview toggle */}
              {previewLead && (
                <div className="border border-white/[0.06] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowPreview(p => !p)}
                    className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-white/[0.02] transition-colors"
                  >
                    <span>Preview for {previewLead.name}</span>
                    {showPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showPreview && (
                    <div className="p-4 border-t border-white/[0.06] bg-white/[0.01] space-y-2">
                      <div className="text-xs">
                        <span className="text-slate-600">Subject: </span>
                        <span className="text-slate-300">{applyTemplate(subject, previewLead)}</span>
                      </div>
                      <pre className="text-xs text-slate-400 whitespace-pre-wrap font-sans leading-relaxed">
                        {applyTemplate(body, previewLead)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Recipients */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Recipients ({selectedLeads.length}/{leads.length})
                  </label>
                  <button onClick={toggleAll} className="text-[11px] text-blue-400 hover:text-blue-300">
                    {selected.size === leads.length ? 'Deselect all' : 'Select all'}
                  </button>
                </div>
                <div className="border border-white/[0.06] rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                  {leads.map(l => (
                    <label
                      key={l.id}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-white/[0.03] border-b border-white/[0.04] last:border-0 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(l.id)}
                        onChange={() => toggleOne(l.id)}
                        className="accent-blue-500 w-3.5 h-3.5 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span
                          className="text-xs font-medium text-slate-300 cursor-pointer hover:text-blue-400"
                          onClick={e => { e.preventDefault(); setPreviewLead(l); setShowPreview(true) }}
                        >
                          {l.name}
                        </span>
                        <span className="text-xs text-slate-600 ml-2">{l.company}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono truncate max-w-[160px]">{l.email}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.06] flex items-center justify-between flex-shrink-0">
          <div className="text-[11px] text-slate-600">
            {!results && `Sends 1 email per ${rateMs / 1000}s to avoid Gmail limits`}
            {isDone && `Finished · ${sentCount} delivered`}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors">
              {isDone ? 'Close' : 'Cancel'}
            </button>
            {!results && (
              <button
                onClick={sendAll}
                disabled={sending || selectedLeads.length === 0 || !subject.trim() || !body.trim()}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-purple-500 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                {sending ? 'Sending…' : `Send to ${selectedLeads.length} lead${selectedLeads.length !== 1 ? 's' : ''}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
