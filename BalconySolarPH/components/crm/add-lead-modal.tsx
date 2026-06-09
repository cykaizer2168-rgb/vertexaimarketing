'use client';

import { useState } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';

interface Props { onClose: () => void; onSaved?: () => void; }

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-[12.5px] text-gray-800 bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-all';

export default function AddLeadModal({ onClose, onSaved }: Props) {
  const [tab, setTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName:'', lastName:'', email:'', mobile:'', location:'', source:'website',
    notes:'', systemType:'On-Grid + Battery', monthlyBill:'', systemSize:'', investment:'', stage:'new',
    sequence:'welcome',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${form.lastName}${form.firstName ? ', ' + form.firstName : ''}`.trim(),
          mobile: form.mobile, email: form.email, location: form.location,
          bill: form.monthlyBill, message: form.notes,
          system_type: form.systemType, stage: form.stage, lead_source: form.source,
          est_value: form.investment ? Number(form.investment) : null,
        }),
      });
    } finally { setSaving(false); onSaved?.(); onClose(); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl border border-gray-200 w-[440px] max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 sticky top-0 bg-white z-10">
          <UserPlus className="w-4 h-4 text-blue-500" />
          <span className="flex-1 text-[13.5px] font-semibold text-gray-800">Add New Lead</span>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded cursor-pointer"><X className="w-4 h-4 text-gray-500" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-4">
          {['Contact Info','System Details','Email Sequence'].map((t,i) => (
            <button key={t} onClick={() => setTab(i)}
              className={`px-3 py-2 text-[12.5px] border-b-2 -mb-px transition-colors cursor-pointer ${tab===i ? 'text-blue-600 border-blue-500 font-semibold' : 'text-gray-400 border-transparent hover:text-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Tab 0 — Contact */}
        {tab === 0 && (
          <div className="grid grid-cols-2 gap-3 p-4">
            <div><label className="text-[11px] font-semibold text-gray-400 block mb-1">First Name</label><input className={inputCls} placeholder="Maria" value={form.firstName} onChange={e=>set('firstName',e.target.value)} /></div>
            <div><label className="text-[11px] font-semibold text-gray-400 block mb-1">Last Name</label><input className={inputCls} placeholder="Dela Cruz" value={form.lastName} onChange={e=>set('lastName',e.target.value)} /></div>
            <div><label className="text-[11px] font-semibold text-gray-400 block mb-1">Email</label><input className={inputCls} type="email" placeholder="maria@gmail.com" value={form.email} onChange={e=>set('email',e.target.value)} /></div>
            <div><label className="text-[11px] font-semibold text-gray-400 block mb-1">Phone</label><input className={inputCls} placeholder="+63 9XX XXX XXXX" value={form.mobile} onChange={e=>set('mobile',e.target.value)} /></div>
            <div><label className="text-[11px] font-semibold text-gray-400 block mb-1">City / Location</label><input className={inputCls} placeholder="Makati City" value={form.location} onChange={e=>set('location',e.target.value)} /></div>
            <div><label className="text-[11px] font-semibold text-gray-400 block mb-1">Lead Source</label>
              <select className={inputCls} value={form.source} onChange={e=>set('source',e.target.value)}>
                {['website','messenger','meta_ads','referral','walk_in'].map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
              </select>
            </div>
            <div className="col-span-2"><label className="text-[11px] font-semibold text-gray-400 block mb-1">Notes</label><textarea className={`${inputCls} resize-none h-14`} placeholder="Monthly bill, unit type, budget..." value={form.notes} onChange={e=>set('notes',e.target.value)} /></div>
          </div>
        )}

        {/* Tab 1 — System */}
        {tab === 1 && (
          <div className="grid grid-cols-2 gap-3 p-4">
            <div><label className="text-[11px] font-semibold text-gray-400 block mb-1">System Type</label>
              <select className={inputCls} value={form.systemType} onChange={e=>set('systemType',e.target.value)}>
                {['Starter','Essential','Premium','On-Grid + Battery','Plug-in Solar'].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="text-[11px] font-semibold text-gray-400 block mb-1">Monthly Bill</label><input className={inputCls} placeholder="₱6,000" value={form.monthlyBill} onChange={e=>set('monthlyBill',e.target.value)} /></div>
            <div><label className="text-[11px] font-semibold text-gray-400 block mb-1">Est. System (kWp)</label><input className={inputCls} type="number" placeholder="1.2" value={form.systemSize} onChange={e=>set('systemSize',e.target.value)} /></div>
            <div><label className="text-[11px] font-semibold text-gray-400 block mb-1">Est. Investment (₱)</label><input className={inputCls} type="number" placeholder="120000" value={form.investment} onChange={e=>set('investment',e.target.value)} /></div>
            <div className="col-span-2"><label className="text-[11px] font-semibold text-gray-400 block mb-1">Pipeline Stage</label>
              <select className={inputCls} value={form.stage} onChange={e=>set('stage',e.target.value)}>
                {[['new','New'],['contacted','Contacted'],['proposal','Proposal Sent'],['negotiating','Negotiating'],['closed_won','Closed Won']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Tab 2 — Sequence */}
        {tab === 2 && (
          <div className="p-4 flex flex-col gap-3">
            <div><label className="text-[11px] font-semibold text-gray-400 block mb-1">Email Sequence</label>
              <select className={inputCls} value={form.sequence} onChange={e=>set('sequence',e.target.value)}>
                <option value="welcome">🌞 New Lead Welcome (5 emails, 21 days)</option>
                <option value="post_survey">🏗️ Post-Survey Follow-up (4 emails, 14 days)</option>
                <option value="winback">🔁 Win-back Sequence (4 emails, 12 weeks)</option>
                <option value="none">None — manual only</option>
              </select>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="text-[11px] font-semibold text-gray-400 mb-2">📧 Email #1 Preview — Welcome + Quote Summary</div>
              <div className="text-[11.5px] text-gray-700 leading-relaxed">
                Hi [Name],<br /><br />
                Salamat sa iyong interes sa solar! ☀️<br /><br />
                Based on your monthly bill of <strong>[bill]</strong>, we&apos;ve sized a system that can save you up to <strong>₱2,500+/month</strong> — that&apos;s a <strong>3–4 year payback</strong>.<br /><br />
                <span className="text-gray-400 italic">[ROI breakdown + Book Assessment CTA follow in body]</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 px-4 pb-4">
          <button onClick={onClose} className="px-4 py-2 text-[12px] border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-[12px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer flex items-center gap-1.5 disabled:opacity-60">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            Save & Start Sequence
          </button>
        </div>
      </div>
    </div>
  );
}
