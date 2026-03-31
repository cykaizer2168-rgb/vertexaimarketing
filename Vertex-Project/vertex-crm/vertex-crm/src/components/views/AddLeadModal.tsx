'use client'
// src/components/views/AddLeadModal.tsx
import { useState, useEffect, useRef } from 'react'
import { X, UserPlus } from 'lucide-react'

const INDUSTRIES = [
  'Real Estate',
  'E-Commerce / Retail',
  'Food & Beverage',
  'Healthcare / Medical',
  'Logistics / Freight',
  'Construction / Engineering',
  'Finance / Insurance',
  'Education / Training',
  'BPO / Outsourcing',
  'Technology / SaaS',
  'Manufacturing',
  'Other',
]

export interface AddLeadData {
  name:        string
  email:       string
  company:     string
  industry:    string
  phone?:      string
  painPoints?: string
}

interface Props {
  onClose: () => void
  onAdd:   (data: AddLeadData) => Promise<void>
}

export default function AddLeadModal({ onClose, onAdd }: Props) {
  const [name,          setName]          = useState('')
  const [email,         setEmail]         = useState('')
  const [company,       setCompany]       = useState('')
  const [industry,      setIndustry]      = useState('')
  const [otherIndustry, setOtherIndustry] = useState('')
  const [phone,         setPhone]         = useState('')
  const [painPoints,    setPainPoints]    = useState('')
  const [submitting,    setSubmitting]    = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const effectiveIndustry = industry === 'Other' ? otherIndustry.trim() : industry
  const canSubmit = name.trim() && email.trim() && company.trim() && effectiveIndustry && !submitting

  async function handleSubmit() {
    if (!canSubmit) return
    setError(null)
    setSubmitting(true)
    try {
      await onAdd({
        name:        name.trim(),
        email:       email.trim(),
        company:     company.trim(),
        industry:    effectiveIndustry,
        phone:       phone.trim()      || undefined,
        painPoints:  painPoints.trim() || undefined,
      })
      onClose()
      // Do not reset submitting — component is about to unmount
    } catch {
      setSubmitting(false)
      setError('Failed to add lead. Please try again.')
    }
  }

  const inputCls = 'w-full bg-[#141425] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-slate-200 outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-600'
  const labelCls = 'text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-1 block'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg mx-4 bg-[#0f0f1a] border border-white/[0.08] rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
            <UserPlus className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-200">Add New Lead</div>
            <div className="text-xs text-slate-500">Fill in the basics — AI scoring happens automatically</div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#141425] text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Name <span className="text-red-400">*</span></label>
              <input ref={nameRef} value={name} onChange={e => setName(e.target.value)}
                className={inputCls} placeholder="Juan dela Cruz" />
            </div>
            <div>
              <label className={labelCls}>Email <span className="text-red-400">*</span></label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email"
                className={inputCls} placeholder="juan@company.com" />
            </div>
            <div>
              <label className={labelCls}>Company <span className="text-red-400">*</span></label>
              <input value={company} onChange={e => setCompany(e.target.value)}
                className={inputCls} placeholder="Acme Corp" />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)}
                className={inputCls} placeholder="+63 9xx xxx xxxx" />
            </div>
          </div>

          <div>
            <label className={labelCls}>Industry <span className="text-red-400">*</span></label>
            <select value={industry} onChange={e => setIndustry(e.target.value)}
              className={`${inputCls} cursor-pointer`}>
              <option value="" disabled>Select industry…</option>
              {INDUSTRIES.map(i => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
            {industry === 'Other' && (
              <input
                value={otherIndustry}
                onChange={e => setOtherIndustry(e.target.value)}
                className={`${inputCls} mt-2`}
                placeholder="Specify industry…"
                autoFocus
              />
            )}
          </div>

          <div>
            <label className={labelCls}>Pain Points / Notes</label>
            <textarea value={painPoints} onChange={e => setPainPoints(e.target.value)}
              rows={3}
              className={`${inputCls} resize-none`}
              placeholder="Manual processes in invoicing, no CRM in place…" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/[0.06]">
          {error && (
            <p className="flex-1 text-[11px] text-red-400">{error}</p>
          )}
          <button onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 bg-[#141425] border border-white/[0.06] rounded-lg hover:text-slate-200 hover:bg-[#1a1a2e] transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {submitting
              ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <UserPlus className="w-3.5 h-3.5" />
            }
            {submitting ? 'Adding…' : 'Add Lead'}
          </button>
        </div>
      </div>
    </div>
  )
}
