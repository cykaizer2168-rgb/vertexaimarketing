'use client'
import { useState, useRef } from 'react'
import { Upload, X, CheckCircle, AlertCircle, FileText } from 'lucide-react'

interface ParsedLead {
  name: string
  email: string
  phone: string
  company: string
  industry: string
  painPoints: string
}

interface Props {
  onClose: () => void
  onImported: (count: number) => void
}

// Flexible CSV header aliases → internal field
const FIELD_MAP: Record<string, keyof ParsedLead> = {
  name: 'name', fullname: 'name', 'full name': 'name', contact: 'name',
  email: 'email', 'email address': 'email', 'work email': 'email',
  phone: 'phone', mobile: 'phone', telephone: 'phone', 'phone number': 'phone',
  company: 'company', business: 'company', organization: 'company', 'company name': 'company',
  industry: 'industry', sector: 'industry',
  painpoints: 'painPoints', 'pain points': 'painPoints', notes: 'painPoints',
  message: 'painPoints', description: 'painPoints',
}

function parseCSV(text: string): ParsedLead[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase())
  const fieldMap = headers.map(h => FIELD_MAP[h] ?? null)

  return lines.slice(1).map(line => {
    // Handle quoted commas
    const cols: string[] = []
    let cur = '', inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ }
      else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = '' }
      else cur += ch
    }
    cols.push(cur.trim())

    const lead: ParsedLead = { name:'', email:'', phone:'', company:'', industry:'', painPoints:'' }
    fieldMap.forEach((field, i) => {
      if (field && cols[i]) lead[field] = cols[i].replace(/^"|"$/g, '')
    })
    return lead
  }).filter(l => l.name || l.email)
}

export default function ImportLeadsModal({ onClose, onImported }: Props) {
  const [step, setStep]     = useState<'upload' | 'preview' | 'done'>('upload')
  const [leads, setLeads]   = useState<ParsedLead[]>([])
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    if (!file) return
    setFileName(file.name)
    setError('')
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const parsed = parseCSV(text)
      if (parsed.length === 0) {
        setError('No valid leads found. Make sure your CSV has a header row with columns like: name, email, company, phone, industry.')
        return
      }
      setLeads(parsed)
      setStep('preview')
    }
    reader.readAsText(file)
  }

  async function confirmImport() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')
      setStep('done')
      onImported(data.imported)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0f0f1a] border border-white/[0.08] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Upload className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-200">Import Leads from CSV</div>
              <div className="text-[11px] text-slate-500">
                {step === 'upload' && 'Upload your scraped leads file'}
                {step === 'preview' && `${leads.length} leads ready to import`}
                {step === 'done' && 'Import complete'}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* STEP: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
                className="border-2 border-dashed border-white/[0.1] rounded-xl p-10 text-center cursor-pointer hover:border-blue-500/40 hover:bg-blue-500/5 transition-all"
              >
                <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <div className="text-sm font-semibold text-slate-300 mb-1">Drop your CSV file here</div>
                <div className="text-xs text-slate-500">or click to browse</div>
                {fileName && <div className="mt-3 text-xs text-blue-400 font-mono">{fileName}</div>}
              </div>
              <input ref={inputRef} type="file" accept=".csv,.txt" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />

              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <div className="text-xs font-semibold text-slate-400 mb-2">Expected CSV columns</div>
                <div className="font-mono text-[11px] text-slate-500">name, email, phone, company, industry, painPoints</div>
                <div className="text-[11px] text-slate-600 mt-2">Column names are flexible — aliases like "full name", "work email", "business" are auto-detected.</div>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* STEP: PREVIEW */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-white/[0.03] text-slate-500 uppercase tracking-wide text-[10px]">
                      <th className="text-left px-3 py-2.5">#</th>
                      <th className="text-left px-3 py-2.5">Name</th>
                      <th className="text-left px-3 py-2.5">Email</th>
                      <th className="text-left px-3 py-2.5">Company</th>
                      <th className="text-left px-3 py-2.5">Phone</th>
                      <th className="text-left px-3 py-2.5">Industry</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.slice(0, 50).map((l, i) => (
                      <tr key={i} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                        <td className="px-3 py-2 text-slate-600 font-mono">{i + 1}</td>
                        <td className="px-3 py-2 text-slate-300 font-medium">{l.name || <span className="text-slate-600">—</span>}</td>
                        <td className="px-3 py-2 text-blue-400 font-mono">{l.email || <span className="text-slate-600">—</span>}</td>
                        <td className="px-3 py-2 text-slate-400">{l.company || <span className="text-slate-600">—</span>}</td>
                        <td className="px-3 py-2 text-slate-500">{l.phone || <span className="text-slate-600">—</span>}</td>
                        <td className="px-3 py-2 text-slate-500">{l.industry || <span className="text-slate-600">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {leads.length > 50 && (
                  <div className="px-3 py-2 text-xs text-slate-600 border-t border-white/[0.04]">
                    +{leads.length - 50} more leads not shown in preview
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* STEP: DONE */}
          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-green-400" />
              </div>
              <div className="text-sm font-semibold text-slate-200">
                {leads.length} leads imported successfully
              </div>
              <div className="text-xs text-slate-500">They are now visible in the Leads tab with status &quot;new&quot;</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.06] flex justify-end gap-2">
          {step === 'upload' && (
            <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors">
              Cancel
            </button>
          )}
          {step === 'preview' && (
            <>
              <button onClick={() => setStep('upload')} className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors">
                Back
              </button>
              <button
                onClick={confirmImport}
                disabled={loading}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-lg transition-colors"
              >
                {loading ? 'Importing...' : `Import ${leads.length} Leads`}
              </button>
            </>
          )}
          {step === 'done' && (
            <button onClick={onClose} className="px-5 py-2 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
