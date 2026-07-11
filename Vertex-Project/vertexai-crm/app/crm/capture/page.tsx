'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Code, Settings, Play, Check, Clock, MoreHorizontal } from 'lucide-react';

const sources = [
  {
    emoji:'🌐', title:'Website Lead Form', status:'Active', statusColor:'bg-green-50 text-green-600 border-green-100',
    stats:[['This week submissions','14'],['Sequence triggered','14 / 14 ✓']],
    note:'Captures: Name, Email, Phone, Location, Monthly Bill',
    action:{ icon: Code, label:'Get Embed Code', primary:true },
  },
  {
    emoji:'💬', title:'FB Messenger Bot', status:'Connected', statusColor:'bg-blue-50 text-blue-600 border-blue-100',
    stats:[['Leads via Messenger','31'],['Avg monthly bill','₱6,200'],['n8n webhook','Live ✓']],
    note:'Auto-tags, fires welcome email, logs to CRM',
    action:{ icon: Settings, label:'Configure Bot', primary:false },
  },
  {
    emoji:'📊', title:'Meta Ads Lead Form', status:'Paused', statusColor:'bg-orange-50 text-orange-600 border-orange-100',
    stats:[['Total leads captured','88'],['Cost per lead (avg)','₱120'],['Connected to CRM','Yes ✓']],
    note:'',
    action:{ icon: Play, label:'Resume Campaign', primary:true },
  },
];

const flow = [
  { state:'done', text:'Lead captured (any source)' },
  { state:'done', text:'CRM record created + tagged' },
  { state:'done', text:'Email #1 fires immediately' },
  { state:'pending', text:'Sequence steps scheduled (D2, D5, D10…)' },
  { state:'draft', text:'On reply → pause seq, notify team' },
];

const stateIcon = { done: <Check className="w-2.5 h-2.5"/>, pending: <Clock className="w-2.5 h-2.5"/>, draft: <MoreHorizontal className="w-2.5 h-2.5"/> };
const stateColor = { done:'bg-green-100 text-green-600', pending:'bg-blue-50 text-blue-500', draft:'bg-gray-100 text-gray-400' };

type MsgStats = { configured: boolean; leads: number; hot: number; lastEventAt: string | null };

export default function CapturePage() {
  const [msg, setMsg] = useState<MsgStats | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/messenger/stats')
      .then((r) => r.json())
      .then((d: MsgStats) => alive && setMsg(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Real Messenger stats replace the card's placeholders once loaded.
  const liveMessengerStats: [string, string][] | null = msg?.configured
    ? [
        ['Leads via Messenger', String(msg.leads)],
        ['HOT / qualified', String(msg.hot)],
        [
          'n8n webhook',
          msg.lastEventAt
            ? `Live ✓ (${new Date(msg.lastEventAt).toLocaleDateString()})`
            : 'No events yet',
        ],
      ]
    : null;

  return (
    <>
      <div className="bg-white/65 backdrop-blur-2xl border-b border-black/[0.06] px-4 h-[50px] flex items-center gap-2 shrink-0">
        <span className="flex-1 text-[14px] font-semibold text-gray-800">Lead Capture & Automation</span>
        <Link href="/crm" className="flex items-center gap-1 text-[12px] border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-gray-700"><ArrowLeft className="w-3.5 h-3.5"/>Back</Link>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-2 gap-4">
          {sources.map(s => {
            const stats =
              s.title === 'FB Messenger Bot' && liveMessengerStats ? liveMessengerStats : s.stats;
            return (
            <div key={s.title} className="bg-white rounded-2xl ring-1 ring-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
                <span className="flex-1 text-[13px] font-semibold text-gray-800">{s.emoji} {s.title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${s.statusColor}`}>{s.status}</span>
              </div>
              <div className="px-4 py-3 flex flex-col gap-2">
                {stats.map(([label, val]) => (
                  <div key={label} className="flex items-center justify-between text-[12px]">
                    <span className="text-gray-500">{label}</span>
                    <strong className="text-gray-800">{val}</strong>
                  </div>
                ))}
                {s.note && <><div className="h-px bg-gray-100 my-1"/><div className="text-[11px] text-gray-400">{s.note}</div></>}
                <button className={`mt-1 flex items-center gap-1.5 text-[11.5px] rounded-lg px-3 py-2 cursor-pointer ${s.action.primary ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                  <s.action.icon className="w-3.5 h-3.5"/> {s.action.label}
                </button>
              </div>
            </div>
            );
          })}

          {/* Flow diagram */}
          <div className="bg-white rounded-2xl ring-1 ring-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
              <span className="text-[13px] font-semibold text-gray-800">🔁 Capture → CRM Flow</span>
            </div>
            <div className="px-4 py-3 flex flex-col gap-0">
              {flow.map((f, i) => (
                <div key={i}>
                  <div className="flex items-center gap-3 py-1.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${stateColor[f.state as keyof typeof stateColor]}`}>
                      {stateIcon[f.state as keyof typeof stateIcon]}
                    </div>
                    <span className="text-[12px] text-gray-800">{f.text}</span>
                  </div>
                  {i < flow.length - 1 && <div className="w-px h-3 bg-gray-200 ml-2.5"/>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
