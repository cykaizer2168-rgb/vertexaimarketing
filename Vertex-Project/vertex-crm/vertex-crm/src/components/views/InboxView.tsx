'use client'

import { useState, useEffect, useCallback } from 'react'
import { Inbox, RefreshCw, Mail, MailOpen, Users, AlertCircle, ChevronRight, Send } from 'lucide-react'
import type { Lead } from '@/types'

interface InboxMessage {
  id:        string
  threadId:  string
  subject:   string
  from:      string
  fromName:  string
  fromEmail: string
  to:        string
  toName:    string
  toEmail:   string
  date:      string
  snippet:   string
  read:      boolean
  isSent:    boolean
}

interface FullMessage extends InboxMessage {
  body:   string
  isHtml: boolean
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffH = diffMs / (1000 * 60 * 60)
    if (diffH < 24) return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
    if (diffH < 24 * 7) return d.toLocaleDateString('en-PH', { weekday: 'short' })
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
}

const AVATAR_COLORS = [
  'from-blue-500 to-blue-700',
  'from-purple-500 to-purple-700',
  'from-emerald-500 to-emerald-700',
  'from-amber-500 to-amber-700',
  'from-pink-500 to-pink-700',
  'from-cyan-500 to-cyan-700',
]
function avatarColor(email: string): string {
  let hash = 0
  for (const c of email) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

interface Props {
  leads: Lead[]
}

export default function InboxView({ leads }: Props) {
  const [messages,    setMessages]    = useState<InboxMessage[]>([])
  const [selected,    setSelected]    = useState<FullMessage | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [loadingMsg,  setLoadingMsg]  = useState(false)
  const [error,       setError]       = useState('')
  const [filter,      setFilter]      = useState<'leads' | 'all' | 'sent'>('leads')
  const [box,         setBox]         = useState<'inbox' | 'sent'>('inbox')

  // Build a Set of lead emails for fast lookup
  const leadEmails = new Set(leads.map(l => l.email?.toLowerCase()).filter(Boolean))

  const fetchInbox = useCallback(async (targetBox: 'inbox' | 'sent' = box) => {
    setLoading(true)
    setError('')
    setSelected(null)
    try {
      const res = await fetch(`/api/gmail/inbox?box=${targetBox}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load inbox')
      setMessages(data.messages || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load inbox')
    } finally {
      setLoading(false)
    }
  }, [box])

  useEffect(() => { fetchInbox(box) }, [box]) // eslint-disable-line react-hooks/exhaustive-deps

  const openMessage = async (msg: InboxMessage) => {
    // Optimistically mark as read in list
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m))
    setLoadingMsg(true)
    setSelected(null)
    try {
      const res = await fetch(`/api/gmail/inbox?msgId=${msg.id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSelected({ ...msg, ...data })
    } catch {
      // Fallback: show snippet
      setSelected({ ...msg, to: '', body: msg.snippet, isHtml: false })
    } finally {
      setLoadingMsg(false)
    }
  }

  const displayed = filter === 'leads'
    ? messages.filter(m => leadEmails.has(m.fromEmail) || leadEmails.has(m.toEmail))
    : messages

  const unreadLeadCount = messages.filter(m => leadEmails.has(m.fromEmail) && !m.read).length

  return (
    <div className="flex h-full gap-0 -m-5" style={{ height: 'calc(100vh - 120px)' }}>

      {/* ── Left: Message list ── */}
      <div className="w-[360px] min-w-[300px] flex flex-col border-r border-white/[0.06] bg-[#09090f]">

        {/* List header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-slate-200">Inbox</span>
            {unreadLeadCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500 text-white font-mono font-semibold">
                {unreadLeadCount}
              </span>
            )}
          </div>
          <button
            onClick={() => fetchInbox(box)}
            disabled={loading}
            className={`w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-colors ${loading ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Box tabs */}
        <div className="flex items-center gap-1 px-3 pt-2 pb-0 border-b border-white/[0.06] flex-shrink-0">
          {(['inbox', 'sent'] as const).map(b => (
            <button
              key={b}
              onClick={() => { setBox(b); setFilter(b === 'sent' ? 'all' : 'leads') }}
              className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold border-b-2 transition-all ${
                box === b
                  ? 'border-blue-500 text-blue-300'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {b === 'inbox' ? <Inbox className="w-3 h-3" /> : <Send className="w-3 h-3" />}
              {b === 'inbox' ? 'Inbox' : 'Sent'}
            </button>
          ))}
        </div>

        {/* Filter toggle (inbox only) */}
        {box === 'inbox' && (
          <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.06] flex-shrink-0">
            <button
              onClick={() => setFilter('leads')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                filter === 'leads'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
              }`}
            >
              <Users className="w-3 h-3" /> Lead Replies
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-white/[0.08] text-slate-200 border border-white/[0.12]'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
              }`}
            >
              <Mail className="w-3 h-3" /> All Inbox
            </button>
          </div>
        )}

        {/* List body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <RefreshCw className="w-5 h-5 text-slate-600 animate-spin" />
              <span className="text-xs text-slate-600">Loading inbox…</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 px-6 text-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-xs text-red-400">{error}</span>
              <button onClick={() => fetchInbox(box)} className="text-xs text-blue-400 hover:text-blue-300">Retry</button>
            </div>
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-center px-6">
              <MailOpen className="w-6 h-6 text-slate-700" />
              <span className="text-xs text-slate-500">
                {box === 'sent'
                  ? 'No sent emails found.'
                  : filter === 'leads'
                  ? 'No replies from leads yet.\nEmails from leads in your CRM will appear here.'
                  : 'Inbox is empty'}
              </span>
            </div>
          ) : (
            displayed.map(msg => {
              const isSelected = selected?.id === msg.id
              const isLead     = leadEmails.has(msg.fromEmail) || leadEmails.has(msg.toEmail)
              return (
                <button
                  key={msg.id}
                  onClick={() => openMessage(msg)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-white/[0.04] transition-colors ${
                    isSelected
                      ? 'bg-blue-500/10 border-l-2 border-l-blue-500'
                      : 'hover:bg-white/[0.03]'
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColor(msg.isSent ? msg.toEmail : msg.fromEmail)} flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 mt-0.5`}>
                    {getInitials(msg.isSent ? msg.toName : msg.fromName)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className={`text-[12px] truncate ${msg.read ? 'text-slate-400 font-normal' : 'text-slate-100 font-semibold'}`}>
                        {msg.isSent ? `To: ${msg.toName || msg.toEmail}` : msg.fromName}
                      </span>
                      <span className="text-[10px] text-slate-600 flex-shrink-0">{formatDate(msg.date)}</span>
                    </div>
                    <div className={`text-[11px] truncate mb-0.5 ${msg.read ? 'text-slate-500' : 'text-slate-300'}`}>
                      {msg.subject}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-600 truncate leading-relaxed">{msg.snippet}</span>
                    </div>
                    {isLead && (
                      <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20 font-semibold uppercase tracking-wide">
                        Lead
                      </span>
                    )}
                  </div>

                  {/* Unread dot */}
                  {!msg.read && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-2" />
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Footer count */}
        {!loading && !error && (
          <div className="px-4 py-2 border-t border-white/[0.06] flex-shrink-0">
            <span className="text-[10px] text-slate-600">
              {displayed.length} message{displayed.length !== 1 ? 's' : ''}
              {filter === 'leads' && messages.length > displayed.length && ` · ${messages.length} total in inbox`}
            </span>
          </div>
        )}
      </div>

      {/* ── Right: Message detail ── */}
      <div className="flex-1 flex flex-col bg-[#09090f] overflow-hidden">
        {loadingMsg ? (
          <div className="flex-1 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-slate-600 animate-spin" />
          </div>
        ) : selected ? (
          <>
            {/* Message header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-white/[0.06]">
              <h2 className="text-base font-semibold text-slate-100 mb-2 leading-snug">{selected.subject}</h2>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColor(selected.fromEmail)} flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0`}>
                  {getInitials(selected.fromName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-200">{selected.fromName}</span>
                    {leadEmails.has(selected.fromEmail) && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20 font-semibold uppercase tracking-wide">
                        CRM Lead
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span className="font-mono">{selected.fromEmail}</span>
                    {selected.to && (
                      <>
                        <ChevronRight className="w-3 h-3" />
                        <span className="font-mono truncate max-w-[200px]">{selected.to}</span>
                      </>
                    )}
                    <span className="ml-2">{formatDate(selected.date)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Message body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                {selected.isHtml ? stripHtml(selected.body) : selected.body}
              </pre>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <Inbox className="w-6 h-6 text-slate-700" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-400">Select an email to read</div>
              <div className="text-xs text-slate-600 mt-1">
                {box === 'sent'
                  ? 'Showing emails you sent'
                  : filter === 'leads'
                  ? 'Showing replies from leads in your CRM'
                  : 'Showing all inbox messages'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
