'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, RefreshCw, Search, Inbox as InboxIcon, MapPin, Mail, Phone,
  ChevronLeft, Zap, CircleUserRound, Sparkles, ArrowDownLeft, ArrowUpRight, Loader2,
} from 'lucide-react';
import { STAGE_COLORS, STAGE_LABELS } from '@/lib/crm-mock';
import { useLeads } from '@/lib/use-leads';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import type { Lead, Message } from '@/lib/supabase';
import LeadDetail from '@/components/crm/lead-detail';

const KIND_LABEL: Record<string, string> = {
  inquiry: 'Inquiry', welcome: 'Welcome Email', proposal: 'Proposal',
  followup: 'Follow-up', reply: 'Reply', note: 'Note',
};

const READ_KEY = 'crm_inbox_read';

export default function InboxPage() {
  const { leads, loading, refetch } = useLeads();
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [active, setActive] = useState<Lead | null>(null);
  const [manage, setManage] = useState<Lead | null>(null);
  const [q, setQ] = useState('');
  const [read, setRead] = useState<Set<string>>(new Set());
  const [thread, setThread] = useState<Message[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);

  // Load the conversation thread for the active lead
  useEffect(() => {
    if (!active) { setThread([]); return; }
    let cancelled = false;
    setThreadLoading(true);
    supabase.from('messages').select('*').eq('lead_id', active.id).order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!cancelled) { setThread((data as Message[]) ?? []); setThreadLoading(false); }
      });
    return () => { cancelled = true; };
  }, [active, supabase]);

  // Load read state from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(READ_KEY);
      if (raw) setRead(new Set(JSON.parse(raw)));
    } catch { /* ignore */ }
  }, []);

  const markRead = useCallback((id: string) => {
    setRead(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev).add(id);
      try { localStorage.setItem(READ_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const messages = useMemo(() => {
    return leads
      .filter(l => (l.message ?? '').trim().length > 0)
      .filter(l =>
        l.name.toLowerCase().includes(q.toLowerCase()) ||
        (l.message ?? '').toLowerCase().includes(q.toLowerCase()) ||
        (l.location ?? '').toLowerCase().includes(q.toLowerCase())
      );
  }, [leads, q]);

  const unreadCount = messages.filter(m => !read.has(m.id)).length;
  const initials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const open = (l: Lead) => { setActive(l); markRead(l.id); };

  return (
    <>
      {manage && <LeadDetail lead={manage} onClose={() => setManage(null)} onUpdated={refetch} />}

      {/* Topbar */}
      <div className="bg-white/65 backdrop-blur-2xl border-b border-black/[0.06] px-4 h-[50px] flex items-center gap-2 shrink-0">
        <span className="flex-1 text-[14px] font-semibold text-gray-800 flex items-center gap-2">
          Inbox
          {unreadCount > 0 && <span className="text-[10px] bg-[#0c1f44] text-white rounded-full px-2 py-0.5 font-semibold">{unreadCount} new</span>}
        </span>
        <button onClick={refetch} className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer text-gray-500">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <Link href="/crm" className="flex items-center gap-1 text-[12px] border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-gray-700"><ArrowLeft className="w-3.5 h-3.5" />Back</Link>
      </div>

      {/* Two-pane email layout */}
      <div className="flex-1 overflow-hidden p-3">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden h-full flex">

          {/* LEFT — message list */}
          <div className={`${active ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[340px] md:min-w-[340px] border-r border-gray-100`}>
            {/* Search */}
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <Search className="w-3.5 h-3.5 text-gray-400" />
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search messages…" className="text-[12.5px] bg-transparent outline-none w-full text-gray-700 placeholder-gray-400" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-16 text-[12px] text-gray-400">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading…
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <InboxIcon className="w-9 h-9 text-gray-300 mb-3" />
                  <p className="text-sm font-medium text-gray-600">{q ? 'No matches' : 'No messages yet'}</p>
                </div>
              ) : messages.map(l => {
                const isUnread = !read.has(l.id);
                const isActive = active?.id === l.id;
                return (
                  <button key={l.id} onClick={() => open(l)}
                    className={`w-full flex items-start gap-3 px-3.5 py-3 text-left border-b border-gray-50 transition-colors cursor-pointer relative
                      ${isActive ? 'bg-blue-50/60' : 'hover:bg-gray-50'}`}>
                    {isActive && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#0c1f44]" />}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold mt-0.5
                      ${isUnread ? 'bg-[#0c1f44] text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {initials(l.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[13px] truncate ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{l.name}</span>
                        {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                        <span className="ml-auto text-[10px] text-gray-400 shrink-0">{new Date(l.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <p className={`text-[11.5px] truncate ${isUnread ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>Vertex AI Marketing Inquiry · {l.location || '—'}</p>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">{l.message}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            {!loading && messages.length > 0 && (
              <div className="px-4 py-2.5 border-t border-gray-100 text-[10.5px] text-gray-400">{messages.length} message{messages.length !== 1 ? 's' : ''}</div>
            )}
          </div>

          {/* RIGHT — reading pane */}
          <div className={`${active ? 'flex' : 'hidden md:flex'} flex-col flex-1 min-w-0`}>
            {!active ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
                  <Mail className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-600">Select a message</p>
                <p className="text-xs text-gray-400 mt-1">I-click ang isang inquiry para basahin.</p>
              </div>
            ) : (
              <>
                {/* Reading header */}
                <div className="px-5 py-4 border-b border-gray-100">
                  <button onClick={() => setActive(null)} className="md:hidden flex items-center gap-1 text-[12px] text-gray-500 mb-3 cursor-pointer"><ChevronLeft className="w-4 h-4" />Balik</button>
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full bg-[#0c1f44] text-white text-[13px] font-bold flex items-center justify-center shrink-0">{initials(active.name)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-[15px] font-semibold text-gray-900">{active.name}</h2>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${STAGE_COLORS[active.stage] ?? 'bg-gray-100 text-gray-500'}`}>{STAGE_LABELS[active.stage] ?? active.stage}</span>
                      </div>
                      <p className="text-[12px] text-gray-400 mt-0.5">{active.email || 'no email'}</p>
                    </div>
                    <span className="text-[11px] text-gray-400 shrink-0">{new Date(active.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Reading body — conversation thread */}
                <div className="flex-1 overflow-y-auto px-5 py-5 bg-gray-50/40">
                  {/* meta chips */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    <span className="inline-flex items-center gap-1.5 text-[11.5px] bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-gray-600"><MapPin className="w-3 h-3 text-gray-400" />{active.location || '—'}</span>
                    <span className="inline-flex items-center gap-1.5 text-[11.5px] bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-gray-600"><Zap className="w-3 h-3 text-yellow-500" />{active.monthly_bill || '—'}</span>
                    <span className="inline-flex items-center gap-1.5 text-[11.5px] bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-gray-600"><Phone className="w-3 h-3 text-gray-400" />{active.mobile || '—'}</span>
                  </div>

                  {threadLoading ? (
                    <div className="flex items-center justify-center py-10 text-[12px] text-gray-400"><Loader2 className="w-4 h-4 animate-spin mr-2" />Loading conversation…</div>
                  ) : thread.length === 0 ? (
                    <div className="bg-white border border-gray-100 rounded-xl p-4 text-[14px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {active.message || 'No message content.'}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {thread.map(m => {
                        const out = m.direction === 'outbound';
                        return (
                          <div key={m.id} className={`flex ${out ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl border px-4 py-3 ${out ? 'bg-[#0c1f44] border-[#0c1f44] text-white rounded-br-sm' : 'bg-white border-gray-200 text-gray-800 rounded-bl-sm'}`}>
                              <div className={`flex items-center gap-1.5 mb-1.5 text-[10px] font-semibold uppercase tracking-wide ${out ? 'text-white/60' : 'text-gray-400'}`}>
                                {out ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                                {KIND_LABEL[m.kind] ?? m.kind}
                                <span className="font-normal normal-case">· {out ? 'Sent' : 'Received'}</span>
                              </div>
                              {m.subject && <p className={`text-[13px] font-semibold mb-1 ${out ? 'text-white' : 'text-gray-900'}`}>{m.subject}</p>}
                              <p className={`text-[13px] leading-relaxed whitespace-pre-wrap ${out ? 'text-white/85' : 'text-gray-600'}`}>{m.body}</p>
                              <p className={`text-[10px] mt-2 ${out ? 'text-white/45' : 'text-gray-400'}`}>{new Date(m.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Action bar */}
                <div className="px-5 py-3.5 border-t border-gray-100 flex flex-wrap gap-2">
                  <a href={`mailto:${active.email}?subject=Re: Vertex AI Marketing Inquiry`} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0c1f44] text-white text-[12.5px] font-semibold hover:opacity-90 cursor-pointer">
                    <Mail className="w-3.5 h-3.5" />Reply via Email
                  </a>
                  <a href={`tel:${(active.mobile ?? '').replace(/[^\d+]/g, '')}`} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-gray-700 text-[12.5px] font-medium hover:bg-gray-50 cursor-pointer">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />Call
                  </a>
                  <a href="https://m.me/vertexaimarketing" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-gray-700 text-[12.5px] font-medium hover:bg-gray-50 cursor-pointer">
                    <CircleUserRound className="w-3.5 h-3.5 text-blue-500" />Messenger
                  </a>
                  <button onClick={() => setManage(active)} className="ml-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-green-400 text-black text-[12.5px] font-semibold hover:opacity-90 cursor-pointer">
                    <Sparkles className="w-3.5 h-3.5" />Manage Lead
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
