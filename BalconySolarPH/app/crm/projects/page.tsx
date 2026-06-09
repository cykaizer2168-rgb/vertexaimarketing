'use client';

import Link from 'next/link';
import { ArrowLeft, Link2 } from 'lucide-react';

export default function ProjectsPage() {
  return (
    <>
      <div className="bg-white/65 backdrop-blur-2xl border-b border-black/[0.06] px-4 h-[50px] flex items-center gap-2 shrink-0">
        <span className="flex-1 text-[14px] font-semibold text-gray-800">Solar Projects</span>
        <Link href="/crm" className="flex items-center gap-1 text-[12px] border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-gray-700"><ArrowLeft className="w-3.5 h-3.5"/>Back</Link>
        <button className="flex items-center gap-1 text-[12px] bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700 cursor-pointer">+ New Project</button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white rounded-2xl ring-1 ring-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6 text-center">
          <div className="text-4xl mb-3">☀️</div>
          <h3 className="text-[14px] font-semibold text-gray-800 mb-2">Link Solar Projects to Leads</h3>
          <p className="text-[12.5px] text-gray-500 max-w-sm mx-auto mb-4">
            Connect your PanelSizer projects — system specs, ROI calculations, and savings data — directly to CRM lead records and auto-generate proposals.
          </p>
          <button className="flex items-center gap-2 mx-auto text-[12px] bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 cursor-pointer">
            <Link2 className="w-3.5 h-3.5"/> Link Project to Lead
          </button>
        </div>
      </div>
    </>
  );
}
