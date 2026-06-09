'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { STAGE_COLORS, STAGE_DOT } from '@/lib/crm-mock';
import { useLeads } from '@/lib/use-leads';
import type { Lead } from '@/lib/supabase';
import AddLeadModal from '@/components/crm/add-lead-modal';
import LeadDetail from '@/components/crm/lead-detail';

const COLUMNS = [
  { key:'new',        label:'New' },
  { key:'contacted',  label:'Contacted' },
  { key:'proposal',   label:'Proposal Sent' },
  { key:'negotiating',label:'Negotiating' },
  { key:'closed_won', label:'Closed Won' },
] as const;

export default function PipelinePage() {
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Lead | null>(null);
  const { leads, loading, refetch, updateStage } = useLeads();

  const handleDrop = (leadId: string, stage: typeof COLUMNS[number]['key']) => {
    updateStage(leadId, stage);
  };

  return (
    <>
      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} onSaved={refetch} />}
      {selected && <LeadDetail lead={selected} onClose={() => setSelected(null)} onUpdated={refetch} />}
      <div className="bg-white/65 backdrop-blur-2xl border-b border-black/[0.06] px-4 h-[50px] flex items-center gap-2 shrink-0">
        <span className="flex-1 text-[14px] font-semibold text-gray-800">Pipeline Board</span>
        <button onClick={refetch} className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer text-gray-500">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <Link href="/crm" className="flex items-center gap-1 text-[12px] border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-gray-700"><ArrowLeft className="w-3.5 h-3.5" />Back</Link>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 text-[12px] border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-gray-700">+ Add Lead</button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden h-full">
          <div className="grid grid-cols-5 h-full min-h-[500px]">
            {COLUMNS.map(({ key, label }) => {
              const colLeads = leads.filter(l => l.stage === key);
              return (
                <div key={key} className="border-r border-gray-200 last:border-r-0 flex flex-col"
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { const id = e.dataTransfer.getData('leadId'); if (id) handleDrop(id, key); }}>
                  <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-gray-200 bg-gray-50">
                    <div className={`w-2 h-2 rounded-full ${STAGE_DOT[key]}`} />
                    <span className="text-[11.5px] font-semibold text-gray-600">{label}</span>
                    <span className="ml-auto text-[10px] text-gray-400 bg-white border border-gray-200 rounded-full px-1.5">{colLeads.length}</span>
                  </div>
                  <div className="flex-1 p-2 flex flex-col gap-2 overflow-y-auto">
                    {colLeads.map(l => (
                      <div key={l.id} draggable
                        onDragStart={e => e.dataTransfer.setData('leadId', l.id)}
                        onClick={() => setSelected(l)}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all active:opacity-60">
                        <div className="text-[12px] font-semibold text-gray-800">{l.name}</div>
                        <div className="text-[10.5px] text-gray-400 mt-0.5">📍 {l.location}</div>
                        {l.monthly_bill && <div className="text-[10px] text-gray-400 mt-0.5">💡 {l.monthly_bill}</div>}
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${STAGE_COLORS[l.stage]}`}>
                            {(l.system_type || l.lead_source || 'Website').split('+')[0].trim()}
                          </span>
                          {l.est_value && <span className="ml-auto text-[11px] font-semibold text-gray-700">₱{(l.est_value/1000).toFixed(0)}K</span>}
                        </div>
                      </div>
                    ))}
                    {colLeads.length === 0 && !loading && (
                      <div className="flex-1 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-[10px] text-gray-300 min-h-[60px]">
                        Drop here
                      </div>
                    )}
                    <button onClick={() => setShowAdd(true)} className="text-[11px] text-gray-400 border border-dashed border-gray-300 rounded-lg py-2 hover:text-gray-600 hover:border-gray-400 cursor-pointer text-center">
                      + Add lead
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
