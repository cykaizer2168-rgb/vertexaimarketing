'use client'
// src/components/views/SettingsView.tsx
import { useState, useEffect } from 'react'
import { Save, CheckCircle, ExternalLink, User, Database, Link } from 'lucide-react'
import toast from 'react-hot-toast'

interface AppSettings {
  sheetId:     string
  leadsTab:    string
  scopingTab:  string
  chatLogsTab: string
  calendlyUrl: string
  adminEmail:  string
}

interface Props {
  userEmail?: string
  userName?:  string
  userImage?: string
}

export default function SettingsView({ userEmail, userName, userImage }: Props) {
  const [settings, setSettings] = useState<AppSettings>({
    sheetId:     '',
    leadsTab:    'Leads',
    scopingTab:  'Scoping Calls',
    chatLogsTab: 'Chat Logs',
    calendlyUrl: '',
    adminEmail:  '',
  })
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then(async r => {
        if (!r.ok) throw new Error('Failed to load settings')
        const data = await r.json()
        setSettings(data)
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  const set = (key: keyof AppSettings, val: string) =>
    setSettings(prev => ({ ...prev, [key]: val }))

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(settings),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      toast.success('Settings saved')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-slate-600 text-sm">Loading settings…</div>
  }

  const tabFields: [keyof AppSettings, string][] = [
    ['leadsTab',    'Leads Tab'],
    ['scopingTab',  'Scoping Tab'],
    ['chatLogsTab', 'Chat Logs Tab'],
  ]

  return (
    <div className="max-w-2xl space-y-6">
      {/* Google Account */}
      <section className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-blue-400" />
          <div className="text-sm font-semibold text-slate-200">Google Account</div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-[#141425] border border-white/[0.06] rounded-lg">
          {userImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={userImage} alt={userName ?? 'User'} className="w-10 h-10 rounded-full flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {userName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'AF'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-slate-200">{userName || 'Angelo Franco'}</div>
            <div className="text-[11px] text-slate-500">{userEmail || '—'}</div>
          </div>
          {userEmail && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
              <CheckCircle className="w-3.5 h-3.5" /> Connected
            </div>
          )}
        </div>
        <p className="text-[11px] text-slate-600 mt-2">
          OAuth scopes: Gmail · Calendar · Sheets. Manage in{' '}
          <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors">
            Google Account settings <ExternalLink className="w-2.5 h-2.5 inline" />
          </a>
        </p>
      </section>

      {/* Google Sheet */}
      <section className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-emerald-400" />
          <div className="text-sm font-semibold text-slate-200">Google Sheets CRM</div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-1 block">Sheet ID</label>
            <input value={settings.sheetId} onChange={e => set('sheetId', e.target.value)}
              className="w-full bg-[#141425] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-slate-200 font-mono outline-none focus:border-blue-500/50 transition-colors"
              placeholder="1i_fOiBvv…" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {tabFields.map(([key, label]) => (
              <div key={key}>
                <label className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-1 block">{label}</label>
                <input value={settings[key]} onChange={e => set(key, e.target.value)}
                  className="w-full bg-[#141425] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-slate-200 outline-none focus:border-blue-500/50 transition-colors"
                  placeholder={label} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Config */}
      <section className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Link className="w-4 h-4 text-purple-400" />
          <div className="text-sm font-semibold text-slate-200">App Config</div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-1 block">Admin Email</label>
            <input value={settings.adminEmail} onChange={e => set('adminEmail', e.target.value)}
              type="email"
              className="w-full bg-[#141425] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-slate-200 outline-none focus:border-blue-500/50 transition-colors"
              placeholder="you@company.com" />
          </div>
          <div>
            <label className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-1 block">Calendly URL</label>
            <input value={settings.calendlyUrl} onChange={e => set('calendlyUrl', e.target.value)}
              className="w-full bg-[#141425] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-slate-200 outline-none focus:border-blue-500/50 transition-colors"
              placeholder="https://calendly.com/your-link" />
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
          {saving
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
