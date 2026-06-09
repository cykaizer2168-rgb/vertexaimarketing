'use client';

import Link from 'next/link';
import { ArrowLeft, Wand2, Pencil } from 'lucide-react';

const sequences = [
  {
    emoji:'🌞', title:'New Lead Welcome', status:'Live', statusColor:'bg-green-50 text-green-600 border-green-100',
    steps:[
      { num:1, title:'Welcome + System Quote', tag:'Immediate', tagColor:'bg-green-50 text-green-600', meta:'Auto on capture', wait:null },
      { num:2, title:'ROI + Meralco Savings',  tag:'Day 2',     tagColor:'bg-blue-50 text-blue-600',  meta:'68% open rate', wait:'Wait 2 days' },
      { num:3, title:'Site Survey CTA',         tag:'Day 5',     tagColor:'bg-blue-50 text-blue-600',  meta:'Calendly link', wait:'Wait 3 days' },
      { num:4, title:'Final Follow-up + Urgency',tag:'Day 10',  tagColor:'bg-orange-50 text-orange-600',meta:'If no reply', wait:'Wait 5 days' },
      { num:5, title:'Last Chance / Win-back',  tag:'Day 21',   tagColor:'bg-red-50 text-red-600',    meta:'Break-up email', wait:'Wait 11 days' },
    ],
  },
  {
    emoji:'🏗️', title:'Post-Survey Follow-up', status:'Active', statusColor:'bg-blue-50 text-blue-600 border-blue-100',
    steps:[
      { num:1, title:'Survey Thank You',           tag:'Immediate', tagColor:'bg-green-50 text-green-600',  meta:'After survey date', wait:null },
      { num:2, title:'Detailed Proposal Ready',    tag:'Day 3',     tagColor:'bg-blue-50 text-blue-600',    meta:'PDF attached',       wait:'Wait 3 days' },
      { num:3, title:'Financing Options + FAQ',    tag:'Day 7',     tagColor:'bg-orange-50 text-orange-600',meta:'BDO/BPI options',    wait:'Wait 4 days' },
      { num:4, title:'Decision Push + Testimonials',tag:'Day 14',  tagColor:'bg-orange-50 text-orange-600',meta:'Social proof',       wait:'Wait 7 days' },
    ],
  },
];

const winback = [
  { week:'Week 4', title:'Miss you check-in',    tag:'Soft nudge',    tagColor:'bg-gray-100 text-gray-500' },
  { week:'Week 6', title:'Meralco rate update',  tag:'Price urgency', tagColor:'bg-orange-50 text-orange-600' },
  { week:'Week 8', title:'New promo / discount', tag:'Offer',         tagColor:'bg-green-50 text-green-600' },
  { week:'Week 12',title:'Graceful unsubscribe', tag:'Break-up',      tagColor:'bg-red-50 text-red-600' },
];

export default function SequencesPage() {
  return (
    <>
      <div className="bg-white/65 backdrop-blur-2xl border-b border-black/[0.06] px-4 h-[50px] flex items-center gap-2 shrink-0">
        <span className="flex-1 text-[14px] font-semibold text-gray-800">Email Sequences</span>
        <Link href="/crm" className="flex items-center gap-1 text-[12px] border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-gray-700"><ArrowLeft className="w-3.5 h-3.5"/>Back</Link>
        <button className="flex items-center gap-1 text-[12px] bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700 cursor-pointer">+ New Sequence</button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-2 gap-4">
          {sequences.map(seq => (
            <div key={seq.title} className="bg-white rounded-2xl ring-1 ring-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
                <span className="flex-1 text-[13px] font-semibold text-gray-800">{seq.emoji} {seq.title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${seq.statusColor}`}>● {seq.status}</span>
              </div>
              <div className="p-4 flex flex-col gap-0">
                {seq.steps.map((s, i) => (
                  <div key={s.num}>
                    {s.wait && <div className="pl-3 py-1"><span className="text-[10px] text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{s.wait}</span></div>}
                    <div className="flex gap-3 items-start py-1">
                      <div className="w-5 h-5 rounded-full bg-gray-100 border border-gray-200 text-[10px] font-semibold text-gray-500 flex items-center justify-center shrink-0">{s.num}</div>
                      <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                        <div className="text-[12px] font-semibold text-gray-800">{s.title}</div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${s.tagColor}`}>{s.tag}</span>
                          <span className="text-[10px] text-gray-400">{s.meta}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 px-4 pb-4">
                <button className="flex-1 flex items-center justify-center gap-1.5 text-[11.5px] bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 cursor-pointer"><Wand2 className="w-3.5 h-3.5"/>AI Write Emails</button>
                <button className="flex items-center gap-1.5 text-[11.5px] border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 cursor-pointer text-gray-700"><Pencil className="w-3.5 h-3.5"/>Edit</button>
              </div>
            </div>
          ))}

          {/* Win-back full width */}
          <div className="col-span-2 bg-white rounded-2xl ring-1 ring-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
              <span className="flex-1 text-[13px] font-semibold text-gray-800">🔁 Win-Back / Cold Lead Reactivation</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-gray-200 text-gray-500 font-medium bg-gray-50">Draft</span>
            </div>
            <div className="grid grid-cols-4 gap-3 p-4">
              {winback.map(w => (
                <div key={w.week} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="text-[10px] text-gray-400 mb-1">{w.week}</div>
                  <div className="text-[12px] font-semibold text-gray-800 mb-2">{w.title}</div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${w.tagColor}`}>{w.tag}</span>
                </div>
              ))}
            </div>
            <div className="px-4 pb-4">
              <button className="flex items-center gap-1.5 text-[11.5px] bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 cursor-pointer"><Wand2 className="w-3.5 h-3.5"/>AI Write Full Win-Back Sequence</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
