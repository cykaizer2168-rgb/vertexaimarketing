'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { RefreshCw, Inbox, MessageSquare, Users } from 'lucide-react'
import type { LandingLead, ChatLog } from '@/types'

type Tab = 'leads' | 'chatLogs'

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-white/[0.04]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-white/[0.06] rounded animate-pulse" style={{ width: `${60 + (i * 17) % 35}%` }} />
        </td>
      ))}
    </tr>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ tab }: { tab: Tab }) {
  return (
    <tr>
      <td colSpan={tab === 'leads' ? 7 : 6} className="px-4 py-16 text-center">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          {tab === 'leads'
            ? <Users className="w-8 h-8 opacity-40" />
            : <MessageSquare className="w-8 h-8 opacity-40" />}
          <p className="text-sm">No {tab === 'leads' ? 'leads' : 'chat logs'} yet</p>
          <p className="text-xs text-slate-700">Entries will appear here once your landing page receives submissions</p>
        </div>
      </td>
    </tr>
  )
}

// ─── Leads table ─────────────────────────────────────────────────────────────
function LeadsTable({ rows, loading }: { rows: LandingLead[]; loading: boolean }) {
  const headers = ['Timestamp', 'Full Name', 'Business Name', 'Contact', 'Email', 'Interest', 'Message']
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-white/[0.06]">
            {headers.map(h => (
              <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
            : rows.length === 0
              ? <EmptyState tab="leads" />
              : rows.map((r, i) => (
                <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatTs(r.timestamp)}</td>
                  <td className="px-4 py-3 text-slate-200 font-medium whitespace-nowrap">{r.fullName || '—'}</td>
                  <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{r.businessName || '—'}</td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{r.contact || '—'}</td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{r.email || '—'}</td>
                  <td className="px-4 py-3">
                    {r.interest
                      ? <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[11px] font-medium border border-blue-500/20 whitespace-nowrap">{r.interest}</span>
                      : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-400 max-w-[260px]">
                    <span className="line-clamp-2">{r.message || '—'}</span>
                  </td>
                </tr>
              ))
          }
        </tbody>
      </table>
    </div>
  )
}

// ─── Chat Logs table ──────────────────────────────────────────────────────────
function ChatLogsTable({ rows, loading }: { rows: ChatLog[]; loading: boolean }) {
  const headers = ['Timestamp', 'Source', 'Session ID', 'User Message', 'Bot Reply', 'Summary']
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-white/[0.06]">
            {headers.map(h => (
              <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
            : rows.length === 0
              ? <EmptyState tab="chatLogs" />
              : rows.map((r, i) => (
                <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatTs(r.timestamp)}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[11px] font-medium border border-purple-500/20 whitespace-nowrap">
                      {r.source || 'chat'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">{truncate(r.sessionId, 16)}</td>
                  <td className="px-4 py-3 text-slate-300 max-w-[200px]">
                    <span className="line-clamp-2">{r.userMessage || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 max-w-[200px]">
                    <span className="line-clamp-2">{r.botReply || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-[180px]">
                    <span className="line-clamp-2">{r.summary || '—'}</span>
                  </td>
                </tr>
              ))
          }
        </tbody>
      </table>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTs(ts: string) {
  if (!ts) return '—'
  try {
    const d = new Date(ts)
    if (isNaN(d.getTime())) return ts
    return d.toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return ts }
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + '…' : s
}

// ─── Main view ────────────────────────────────────────────────────────────────
export default function LandingDataView() {
  const [activeTab,  setActiveTab]  = useState<Tab>('leads')
  const [leads,      setLeads]      = useState<LandingLead[]>([])
  const [chatLogs,   setChatLogs]   = useState<ChatLog[]>([])
  const [loading,    setLoading]    = useState(true)
  const [lastSync,   setLastSync]   = useState<Date | null>(null)
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchTab = useCallback(async (tab: Tab, silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch(`/api/sheets?tab=${tab}`)
      if (!res.ok) throw new Error('fetch failed')
      const json = await res.json() as { data: LandingLead[] | ChatLog[] }
      if (tab === 'leads') setLeads(json.data as LandingLead[])
      else setChatLogs(json.data as ChatLog[])
      setLastSync(new Date())
    } catch { /* keep existing data */ }
    finally { if (!silent) setLoading(false) }
  }, [])

  // Fetch on tab change
  useEffect(() => {
    setLoading(true)
    fetchTab(activeTab)
  }, [activeTab, fetchTab])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => fetchTab(activeTab, true), 30_000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [activeTab, fetchTab])

  const currentCount = activeTab === 'leads' ? leads.length : chatLogs.length

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-200">Incoming Leads</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Live data from <span className="text-slate-400">vertexaimarketing.cloud</span>
            {lastSync && <> · synced {lastSync.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</>}
          </p>
        </div>
        <button
          onClick={() => fetchTab(activeTab)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-slate-400 hover:text-slate-200 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] rounded-lg transition-colors disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="flex border-b border-white/[0.06]">
          {([
            { id: 'leads',    label: 'Leads',     icon: Users,         count: leads.length },
            { id: 'chatLogs', label: 'Chat Logs',  icon: MessageSquare, count: chatLogs.length },
          ] as const).map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-3 text-[13px] font-medium transition-colors border-b-2 -mb-px ${
                activeTab === id
                  ? 'text-blue-400 border-blue-500'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {label}
              {!loading && count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${
                  activeTab === id ? 'bg-blue-500/20 text-blue-400' : 'bg-white/[0.06] text-slate-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
          <div className="flex-1" />
          {!loading && currentCount > 0 && (
            <div className="flex items-center px-4 text-[11px] text-slate-600">
              {currentCount} {activeTab === 'leads' ? 'entries' : 'logs'} · newest first
            </div>
          )}
        </div>

        {/* Table */}
        <div className="min-h-[300px]">
          {activeTab === 'leads'
            ? <LeadsTable    rows={leads}    loading={loading} />
            : <ChatLogsTable rows={chatLogs} loading={loading} />}
        </div>
      </div>

      {/* Auto-refresh note */}
      <p className="text-[11px] text-slate-700 text-center">
        Auto-refreshes every 30 seconds
      </p>
    </div>
  )
}
