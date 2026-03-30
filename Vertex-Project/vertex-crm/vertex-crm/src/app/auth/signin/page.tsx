'use client'

import { signIn } from 'next-auth/react'
import { Layers, Mail, Calendar, Sheet, Zap } from 'lucide-react'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#09090f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-200">Vertex AI Marketing</div>
            <div className="text-xs text-slate-500 uppercase tracking-widest">CRM Dashboard</div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#0f0f1a] border border-white/[0.08] rounded-2xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-slate-200 mb-2">Welcome back, Boss</h1>
            <p className="text-sm text-slate-500">Sign in with Google to access your CRM, send emails, and schedule scoping calls.</p>
          </div>

          {/* Feature list */}
          <div className="space-y-3 mb-8">
            {[
              { icon: Mail,     color: 'text-blue-400 bg-blue-500/10',    label: 'Send branded emails via Gmail' },
              { icon: Calendar, color: 'text-emerald-400 bg-emerald-500/10', label: 'Book scoping calls with Google Meet' },
              { icon: Sheet,    color: 'text-amber-400 bg-amber-500/10',  label: 'Sync leads from Google Sheets' },
              { icon: Zap,      color: 'text-purple-400 bg-purple-500/10', label: 'Trigger n8n automation workflows' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${f.color}`}>
                  <f.icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm text-slate-400">{f.label}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-xs text-slate-600 text-center mt-4">
            Grants access to Gmail, Calendar, and Sheets.<br/>Your data stays in your Google account.
          </p>
        </div>
      </div>
    </div>
  )
}
