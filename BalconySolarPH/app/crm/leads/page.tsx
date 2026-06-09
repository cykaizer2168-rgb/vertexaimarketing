'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, RefreshCw } from 'lucide-react';
import { STAGE_COLORS, STAGE_LABELS } from '@/lib/crm-mock';
import { useLeads } from '@/lib/use-leads';
import type { Lead } from '@/lib/supabase';
import AddLeadModal from '@/components/crm/add-lead-modal';
import LeadDetail from '@/components/crm/lead-detail';

export default function LeadsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [q, setQ] = useState('');
  const { leads, loading, refetch, isLive } = useLeads();

  const filtered = leads.filter(l =>
    l.name.toLowerCase().includes(q.toLowerCase()) ||
    (l.location ?? '').toLowerCase().includes(q.toLowerCase()) ||
    (l.email ?? '').toLowerCase().includes(q.toLowerCase())
  );

  return (
    <>
      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} onSaved={refetch} />}
      {selected && <LeadDetail lead={selected} onClose={() => setSelected(null)} onUpdated={refetch} />}
      <div className="bg-white/65 backdrop-blur-2xl border-b border-black/[0.06] px-4 h-[50px] flex items-center gap-2 shrink-0">
        <span className="flex-1 text-[14px] font-semibold text-gray-800">
          All Leads
          {isLive && <span className="ml-2 text-[10px] text-green-600 bg-green-50 border border-green-100 rounded-full px-2 py-0.5 font-medium align-middle">● Live</span>}
        </span>
        <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50">
          <Search className="w-3.5 h-3.5 text-gray-400" />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search leads…" className="text-[12px] bg-transparent outline-none w-36 text-gray-700 placeholder-gray-400" />
        </div>
        <button onClick={refetch} className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer text-gray-500">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <Link href="/crm" className="flex items-center gap-1 text-[12px] border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-gray-700"><ArrowLeft className="w-3.5 h-3.5"/>Back</Link>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 text-[12px] border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-gray-700">+ Add Lead</button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white rounded-2xl ring-1 ring-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-[12px] text-gray-400">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading leads from Supabase…
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['Name','Mobile','Location','Bill','Stage','Source','Submitted'].map(h => (
                      <th key={h} className="text-left text-[11px] font-semibold text-gray-500 px-4 py-2.5 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-[12px] text-gray-400">
                      {q ? 'No leads match your search.' : 'No leads yet. Submit the landing page form to see them here.'}
                    </td></tr>
                  ) : filtered.map((l) => (
                    <tr key={l.id} onClick={() => setSelected(l)} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors">
                      <td className="px-4 py-2.5 text-[12px] font-semibold text-gray-800">{l.name}</td>
                      <td className="px-4 py-2.5 text-[12px] text-gray-500">{l.mobile || '—'}</td>
                      <td className="px-4 py-2.5 text-[12px] text-gray-500">{l.location || '—'}</td>
                      <td className="px-4 py-2.5 text-[12px] text-gray-600">{l.monthly_bill || '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[10.5px] px-2 py-0.5 rounded-md border font-medium ${STAGE_COLORS[l.stage] ?? 'bg-gray-100 text-gray-500'}`}>
                          {STAGE_LABELS[l.stage] ?? l.stage}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[11.5px] text-gray-400 capitalize">{(l.lead_source ?? 'website').replace('_',' ')}</td>
                      <td className="px-4 py-2.5 text-[11px] text-gray-400 whitespace-nowrap">
                        {new Date(l.created_at).toLocaleDateString('en-PH',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-4 py-3 border-t border-gray-100 text-[11px] text-gray-400 flex items-center justify-between">
            <span>Showing {filtered.length} of {leads.length} leads</span>
            {!isLive && <span className="text-orange-500">⚠ Showing mock data — Supabase not connected</span>}
          </div>
        </div>
      </div>
    </>
  );
}
