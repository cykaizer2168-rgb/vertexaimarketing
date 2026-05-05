'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { X, Send, Wand2, Loader2, Mail, ChevronDown, Sparkles } from 'lucide-react'
import type { Lead } from '@/types'
import toast from 'react-hot-toast'

interface EmailModalProps {
  lead: Lead
  onClose: () => void
}

const EMAIL_TEMPLATES = [
  {
    label: 'AI Outreach Hook (from CRM)',
    getSubject: (l: Lead) => `Quick question about ${l.company}'s operations, ${l.name.split(' ')[0]}`,
    getBody:    (l: Lead) => l.outreachHook
      ? `Hi ${l.name.split(' ')[0]},\n\n${l.outreachHook}\n\nI'd love to set up a quick 20-minute call to show you exactly how this would work for ${l.company}.\n\nWould any of these times work for you?\n\nBest,\nAngelo Franco\nVertex AI Marketing\nvertexaimarketing.cloud`
      : '',
  },
  {
    label: 'Scoping Call Invite',
    getSubject: (l: Lead) => `Scoping Call — AI Automation for ${l.company}`,
    getBody:    (l: Lead) =>
      `Hi ${l.name.split(' ')[0]},\n\nI've been looking into ${l.company}'s operations and I believe there's a significant opportunity to automate your workflows — specifically around ${l.suggestedAutomation.toLowerCase()}.\n\nBased on similar companies in the ${l.industry} space, we typically see:\n• 40–60% reduction in manual work\n• Faster response times\n• Clear ROI within 90 days\n\nI'd like to schedule a 30-minute scoping call to map out exactly what's possible for your team.\n\nYou can book directly here: ${process.env.NEXT_PUBLIC_CALENDLY_URL || '[calendly link]'}\n\nLooking forward to connecting!\n\nAngelo Franco\nSenior Automation Consultant\nVertex AI Marketing`,
  },
  {
    label: 'Follow-Up (No Response)',
    getSubject: (l: Lead) => `Re: AI Automation for ${l.company}`,
    getBody:    (l: Lead) =>
      `Hi ${l.name.split(' ')[0]},\n\nJust following up on my previous message — I know things get busy!\n\nI put together a quick breakdown of what an AI automation system could look like for ${l.company}. Would love to share it on a short call.\n\nIs this week or next week better for you?\n\nAngelo`,
  },
]

const AI_PROMPTS = [
  'Create a cold outreach email',
  'Write a follow-up for no response',
  'Draft a proposal email',
  'Write a discovery call invite',
  'Create a re-engagement email',
]

export default function EmailModal({ lead, onClose }: EmailModalProps) {
  const [subject, setSubject]       = useState('')
  const [body, setBody]             = useState('')
  const [sending, setSending]       = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [aiPrompt, setAiPrompt]     = useState('')
  const [aiLoading, setAiLoading]   = useState(false)
  const [showPromptSugg, setShowPromptSugg] = useState(false)
  const promptRef = useRef<HTMLInputElement>(null)

  const applyTemplate = (idx: number) => {
    const t = EMAIL_TEMPLATES[idx]
    setSubject(t.getSubject(lead))
    setBody(t.getBody(lead))
    setShowTemplates(false)
  }

  const generateWithAI = async (promptOverride?: string) => {
    const p = (promptOverride ?? aiPrompt).trim()
    if (!p) return
    setAiLoading(true)
    setShowPromptSugg(false)
    try {
      const res = await fetch('/api/ai-compose', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: p,
          lead: {
            name:                 lead.name,
            company:              lead.company,
            industry:             lead.industry,
            painPoints:           lead.painPoints,
            suggestedAutomation:  lead.suggestedAutomation,
            estimatedValue:       lead.estimatedValue,
            outreachHook:         lead.outreachHook,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.subject) setSubject(data.subject)
      if (data.body)    setBody(data.body)
      toast.success('AI email generated!')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'AI generation failed'
      toast.error(message)
    } finally {
      setAiLoading(false)
    }
  }

  const handlePromptKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') generateWithAI()
    if (e.key === 'Escape') setShowPromptSugg(false)
  }

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Subject and body are required')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/send-email', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to:       lead.email,
          toName:   lead.name,
          subject,
          body,
          leadId:   lead.id,
          sheetRow: lead.sheetRow,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Email sent to ${lead.name}!`)
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Send failed'
      toast.error(message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-bg-1 border border-surface-border rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-border flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center">
            <Mail className="w-4 h-4 text-brand-blue" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-200">New Email</div>
            <div className="text-xs text-slate-500">To: {lead.name} &lt;{lead.email}&gt; · {lead.company}</div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-bg-2 text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* AI Compose Bar */}
        <div className="px-5 py-3 border-b border-surface-border flex-shrink-0 space-y-2">
          {/* Prompt input */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/25 rounded-xl px-3 py-2 focus-within:border-purple-500/50 transition-colors">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
              <input
                ref={promptRef}
                value={aiPrompt}
                onChange={e => { setAiPrompt(e.target.value); setShowPromptSugg(e.target.value.length === 0) }}
                onFocus={() => setShowPromptSugg(aiPrompt.length === 0)}
                onBlur={() => setTimeout(() => setShowPromptSugg(false), 150)}
                onKeyDown={handlePromptKey}
                placeholder='Ask AI — e.g. "create me a proposal" or "write a follow-up"'
                className="flex-1 bg-transparent text-xs text-slate-200 placeholder-purple-300/30 outline-none"
              />
              <button
                onClick={() => generateWithAI()}
                disabled={aiLoading || !aiPrompt.trim()}
                className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold text-purple-300 bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors flex-shrink-0"
              >
                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {aiLoading ? 'Generating…' : 'Generate'}
              </button>
            </div>

            {/* Prompt suggestions dropdown */}
            {showPromptSugg && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f0f1a] border border-purple-500/20 rounded-xl shadow-xl z-20 overflow-hidden">
                {AI_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onMouseDown={() => { setAiPrompt(p); generateWithAI(p) }}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-400 hover:bg-purple-500/10 hover:text-slate-200 transition-colors border-b border-white/[0.04] last:border-0 flex items-center gap-2"
                  >
                    <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0" />
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Static template picker — kept as secondary option */}
          <div className="relative">
            <button
              onClick={() => setShowTemplates(v => !v)}
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <Wand2 className="w-3 h-3" />
              Or use a static template
              <ChevronDown className="w-3 h-3" />
            </button>
            {showTemplates && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-bg-2 border border-surface-border2 rounded-xl shadow-xl z-10 overflow-hidden">
                {EMAIL_TEMPLATES.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => applyTemplate(i)}
                    className="w-full text-left px-4 py-3 text-xs text-slate-300 hover:bg-bg-3 hover:text-slate-100 transition-colors border-b border-surface-border last:border-0"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Subject */}
        <div className="px-5 py-3 border-b border-surface-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 w-14 flex-shrink-0">Subject</span>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Email subject..."
              className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none"
            />
          </div>
        </div>

        {/* Body */}
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Write your email here, or use an AI template above..."
          className="flex-1 px-5 py-4 bg-transparent text-sm text-slate-300 placeholder-slate-600 outline-none resize-none min-h-[260px] font-mono leading-relaxed"
        />

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-surface-border flex-shrink-0">
          <div className="text-xs text-slate-500">
            AI Score: <span className="text-brand-blue font-mono font-semibold">{lead.aiScore}</span>
            &nbsp;·&nbsp;
            {lead.estimatedValue > 0 && (
              <span>Value: <span className="text-emerald-400 font-mono">₱{lead.estimatedValue.toLocaleString()}</span></span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex items-center gap-2 px-4 py-2 bg-brand-blue hover:bg-brand-blue-dim text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              {sending ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
