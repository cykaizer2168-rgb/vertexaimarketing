'use client';

import { useState } from 'react';
import { Users, Mail, Eye, Target, ArrowRight, Bell, Check, Clock, MoreHorizontal, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { STAGE_COLORS, STAGE_DOT } from '@/lib/crm-mock';
import { useLeads, useLeadStats } from '@/lib/use-leads';
import AddLeadModal from '@/components/crm/add-lead-modal';

const PIPELINE_STAGES = ['new','contacted','proposal','negotiating','closed_won'] as const;
const STAGE_LABEL: Record<string,string> = { new:'New', contacted:'Contacted', proposal:'Proposal', negotiating:'Negotiation', closed_won:'Closed' };

const sequence = [
  { title:'Welcome + Quote Summary',   meta:'Immediate · Auto on capture', state:'sent' },
  { title:'ROI + Meralco Savings',     meta:'Day 2 · 68% open rate',      state:'sent' },
  { title:'Site Survey Booking',       meta:'Day 5 · Calendly link',       state:'pending' },
  { title:'Follow-up + Urgency',       meta:'Day 10 · If no reply',        state:'draft' },
  { title:'Win-back / Last Chance',    meta:'Day 21 · Break-up email',     state:'draft' },
];

const activity = [
  { color:'bg-green-400',  text:'New lead from website form', time:'Live' },
  { color:'bg-blue-400',   text:'Sequence welcome email queued', time:'On submit' },
  { color:'bg-yellow-400', text:'Messenger bot connected', time:'Active' },
  { color:'bg-blue-400',   text:'CRM pipeline tracking active', time:'Live' },
];

export default function CrmDashboard() {
  const [showAdd, setShowAdd] = useState(false);
  const { leads, loading, isLive, refetch } = useLeads();
  const stats = useLeadStats(leads);

  const statCards = [
    { icon: Users,  label:'Total Leads',      val: String(stats.total),      sub: `+${stats.thisWeek} this week`,    color:'text-blue-500' },
    { icon: Mail,   label:'Active Leads',      val: String(stats.active),     sub: 'In pipeline',                     color:'text-green-500' },
    { icon: Eye,    label:'Open Rate',          val: '68%',                    sub: 'Avg across sequences',            color:'text-yellow-500' },
    { icon: Target, label:'Conversion',         val: `${stats.conversion}%`,  sub: `${stats.closedWon} closed`,       color:'text-green-500' },
  ];

  return (
    <>
      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} onSaved={refetch} />}

      {/* Topbar */}
      <div className="bg-white/65 backdrop-blur-2xl border-b border-black/[0.06] px-4 h-[50px] flex items-center gap-2 shrink-0">
        <span className="flex-1 text-[14px] font-semibold text-gray-800">Dashboard</span>
        {isLive && (
          <span className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 border border-green-100 rounded-full px-2 py-0.5 font-medium">
            ● Supabase Live
          </span>
        )}
        <button onClick={refetch} className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer text-gray-500" title="Refresh">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer text-gray-700">
          + Add Lead
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
          <Mail className="w-3.5 h-3.5" /> Send Campaign
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-3">
          {statCards.map(({ icon: Icon, label, val, sub, color }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-3">
              <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                {label}<Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="text-[22px] font-semibold text-gray-800 leading-none">{val}</div>
              <div className="text-[11px] text-gray-400 mt-1">{sub}</div>
            </div>
          ))}
        </div>

        {/* Two-col */}
        <div className="grid grid-cols-[1fr_300px] gap-3">

          {/* Pipeline preview */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200">
              <span className="flex-1 text-[13px] font-semibold text-gray-800">
                Lead Pipeline
                {loading && <span className="ml-2 text-[10px] text-gray-400">Loading…</span>}
              </span>
              <Link href="/crm/pipeline" className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-2 py-1 cursor-pointer">
                Full view <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-5 min-h-[260px]">
              {PIPELINE_STAGES.map((stage) => {
                const stageLeads = leads.filter(l => l.stage === stage);
                return (
                  <div key={stage} className="border-r border-gray-200 last:border-r-0">
                    <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-gray-200">
                      <div className={`w-1.5 h-1.5 rounded-full ${STAGE_DOT[stage]}`} />
                      <span className="text-[11px] font-semibold text-gray-500">{STAGE_LABEL[stage]}</span>
                      <span className="ml-auto text-[10px] text-gray-400 bg-gray-100 rounded-full px-1.5">{stageLeads.length}</span>
                    </div>
                    <div className="p-1.5 flex flex-col gap-1.5">
                      {stageLeads.slice(0,3).map(l => (
                        <div key={l.id} className="bg-gray-50 border border-gray-200 rounded-lg p-2 cursor-pointer hover:border-blue-300 transition-colors">
                          <div className="text-[11.5px] font-semibold text-gray-800 truncate">{l.name}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5 truncate">{l.location}</div>
                          <div className="flex items-center gap-1 mt-1.5">
                            <span className={`text-[9.5px] px-1.5 py-0.5 rounded-md border font-medium ${STAGE_COLORS[stage]}`}>
                              {(l.system_type || 'New').split(' ')[0]}
                            </span>
                            {l.est_value && <span className="ml-auto text-[10px] font-semibold text-gray-700">₱{(l.est_value/1000).toFixed(0)}K</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-3">
            {/* Active sequence */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200">
                <Mail className="w-4 h-4 text-blue-500" />
                <span className="flex-1 text-[13px] font-semibold text-gray-800">Active Sequence</span>
                <span className="text-[10px] text-green-600 bg-green-50 border border-green-100 rounded-full px-2 py-0.5 font-medium">● Live</span>
              </div>
              <div className="px-3 py-2 flex flex-col gap-0">
                {sequence.map((s, i) => (
                  <div key={i} className="flex gap-2 py-1.5 relative">
                    {i < sequence.length - 1 && <div className="absolute left-[8px] top-[22px] bottom-[-6px] w-px bg-gray-200" />}
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 z-10 mt-0.5 ${s.state==='sent'?'bg-green-100 text-green-600':s.state==='pending'?'bg-blue-50 text-blue-500':'bg-gray-100 text-gray-400'}`}>
                      {s.state==='sent'?<Check className="w-2.5 h-2.5"/>:s.state==='pending'?<Clock className="w-2.5 h-2.5"/>:<MoreHorizontal className="w-2.5 h-2.5"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11.5px] font-medium text-gray-800 truncate">{s.title}</div>
                      <div className="text-[10px] text-gray-400">{s.meta}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-3 pb-3">
                <Link href="/crm/sequences" className="flex items-center justify-center gap-1 w-full text-[11.5px] border border-gray-200 rounded-lg py-1.5 text-gray-600 hover:bg-gray-50 cursor-pointer">
                  Manage Sequences
                </Link>
              </div>
            </div>

            {/* Activity */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200">
                <Bell className="w-4 h-4 text-blue-500" />
                <span className="text-[13px] font-semibold text-gray-800">Recent Activity</span>
              </div>
              <div className="px-3 py-1">
                {leads.slice(0,4).map((l, i) => (
                  <div key={l.id} className="flex gap-2 items-start py-2 border-b border-gray-100 last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-green-400" />
                    <div>
                      <div className="text-[11.5px] text-gray-800">New lead: {l.name}</div>
                      <div className="text-[10px] text-gray-400">{l.location} · {l.monthly_bill}</div>
                    </div>
                  </div>
                ))}
                {leads.length === 0 && !loading && (
                  <div className="py-4 text-center text-[11px] text-gray-400">No leads yet — submit the landing page form to see them here</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
