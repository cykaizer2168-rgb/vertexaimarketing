'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Search, Check, Phone, Mail, Globe, Megaphone } from 'lucide-react';
import { useProspects } from '@/lib/use-prospects';
import type { Prospect } from '@/lib/supabase';
import ProspectDetail from '@/components/crm/prospect-detail';
import { scoreProspect, tierOf, TIER_META } from '@/lib/lead-score';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  to_contact: { label: 'To contact', cls: 'text-gray-500 bg-gray-50 border-gray-200' },
  contacted: { label: 'Contacted', cls: 'text-blue-700 bg-blue-50 border-blue-100' },
  follow_up: { label: 'Follow-up', cls: 'text-amber-700 bg-amber-50 border-amber-100' },
  not_interested: { label: 'Not interested', cls: 'text-red-600 bg-red-50 border-red-100' },
};

export default function OutreachPage() {
  const { prospects, loading, refetch } = useProspects();
  const [type, setType] = useState('');
  const [area, setArea] = useState('');
  const [limit, setLimit] = useState(25);
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Prospect | null>(null);

  // Filters over the staged list.
  const [fType, setFType] = useState('all');
  const [fArea, setFArea] = useState('all');
  const [fRating, setFRating] = useState(0);
  const [fStatus, setFStatus] = useState('all');
  const [fTier, setFTier] = useState('all');

  const typeOptions = useMemo(
    () => Array.from(new Set(prospects.map((p) => p.business_type).filter(Boolean))) as string[],
    [prospects]
  );
  const areaOptions = useMemo(
    () => Array.from(new Set(prospects.map((p) => p.area).filter(Boolean))) as string[],
    [prospects]
  );
  const filtered = useMemo(
    () =>
      prospects
        .filter(
          (p) =>
            (fType === 'all' || p.business_type === fType) &&
            (fArea === 'all' || p.area === fArea) &&
            (fRating === 0 || (typeof p.rating === 'number' && p.rating >= fRating)) &&
            (fStatus === 'all' || (p.outreach_status ?? 'to_contact') === fStatus) &&
            (fTier === 'all' || tierOf(scoreProspect(p)) === fTier)
        )
        // Hottest leads first (highest score) so the best prospects float up.
        .sort((a, b) => scoreProspect(b) - scoreProspect(a)),
    [prospects, fType, fArea, fRating, fStatus, fTier]
  );

  const toggle = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  async function findProspects() {
    setBusy(true);
    try {
      await fetch('/api/outreach/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, area, limit }),
      });
    } catch {
      // ignore — refetch below shows whatever landed
    }
    await refetch();
    setBusy(false);
  }

  async function approveSelected() {
    if (sel.size === 0) return;
    await fetch('/api/outreach/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prospectIds: [...sel] }),
    }).catch(() => {});
    setSel(new Set());
    refetch();
  }

  return (
    <>
      {selected && (
        <ProspectDetail prospect={selected} onClose={() => setSelected(null)} onChanged={refetch} />
      )}

      <div className="bg-white/65 backdrop-blur-2xl border-b border-black/[0.06] px-4 h-[50px] flex items-center gap-2 shrink-0">
        <span className="flex-1 text-[14px] font-semibold text-gray-800">AI Outreach</span>
        <button onClick={refetch} className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer text-gray-500">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <Link
          href="/crm"
          className="flex items-center gap-1 text-[12px] border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-gray-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Link>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Search controls */}
        <div className="bg-white rounded-2xl ring-1 ring-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-4 flex flex-wrap items-end gap-3">
          <Field label="Business category">
            <input
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="e.g. dental clinic, coffee shop, hardware store"
              className="text-[12px] border border-gray-200 rounded-lg px-2 py-1.5 w-60 text-gray-700"
            />
          </Field>
          <Field label="Location">
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Quezon City, Makati"
              className="text-[12px] border border-gray-200 rounded-lg px-2 py-1.5 w-44 text-gray-700"
            />
          </Field>
          <Field label="Count">
            <input
              type="number"
              min={5}
              max={100}
              value={limit}
              onChange={(e) => setLimit(+e.target.value)}
              className="text-[12px] border border-gray-200 rounded-lg px-2 py-1.5 w-20 text-gray-700"
            />
          </Field>
          <button
            onClick={findProspects}
            disabled={busy || !type.trim() || !area.trim()}
            className="flex items-center gap-1.5 text-[12px] bg-amber-500 text-white rounded-lg px-4 py-2 hover:bg-amber-600 disabled:opacity-50 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            {busy ? 'Finding…' : 'Find Prospects'}
          </button>
        </div>

        {/* Review table */}
        <div className="bg-white rounded-2xl ring-1 ring-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-gray-200">
            <span className="text-[12px] font-semibold text-gray-700">Prospects ({filtered.length})</span>
            {/* Filters */}
            <Select value={fType} onChange={setFType} options={['all', ...typeOptions]} small />
            <Select value={fArea} onChange={setFArea} options={['all', ...areaOptions]} small />
            <select
              value={fRating}
              onChange={(e) => setFRating(+e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 bg-white cursor-pointer text-[11px]"
            >
              <option value={0}>All ratings</option>
              <option value={4}>4.0★+</option>
              <option value={4.5}>4.5★+</option>
              <option value={5}>5.0★</option>
            </select>
            <select
              value={fStatus}
              onChange={(e) => setFStatus(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 bg-white cursor-pointer text-[11px]"
            >
              <option value="all">All status</option>
              <option value="to_contact">To contact</option>
              <option value="contacted">Contacted</option>
              <option value="follow_up">Follow-up</option>
              <option value="not_interested">Not interested</option>
            </select>
            <select
              value={fTier}
              onChange={(e) => setFTier(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 bg-white cursor-pointer text-[11px]"
            >
              <option value="all">All scores</option>
              <option value="hot">🔥 Hot</option>
              <option value="warm">🟡 Warm</option>
              <option value="cold">🔵 Cold</option>
            </select>
            <button
              onClick={approveSelected}
              disabled={sel.size === 0}
              className="ml-auto flex items-center gap-1 text-[12px] border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40 cursor-pointer text-gray-700"
            >
              <Check className="w-3.5 h-3.5" />
              Approve selected ({sel.size}) → Leads
            </button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-[12px] text-gray-400">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-[12px] text-gray-400">
              No prospects yet — click &quot;Find Prospects&quot; above (or adjust the filters).
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map((p) => (
                <li key={p.id} className="px-4 py-3 flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={sel.has(p.id)}
                    onChange={() => toggle(p.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-pointer"
                  />
                  <button onClick={() => setSelected(p)} className="flex-1 min-w-0 text-left cursor-pointer">
                    <div className="text-[13px] font-medium text-gray-800 hover:text-amber-600 flex items-center gap-2">
                      {p.name}
                      {(() => {
                        const sc = scoreProspect(p);
                        const t = TIER_META[tierOf(sc)];
                        return (
                          <span className={`text-[10px] font-semibold rounded-full px-1.5 border ${t.cls}`}>
                            {t.emoji} {sc}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="text-[11px] text-gray-500 flex items-center gap-3 mt-0.5 flex-wrap">
                      <span>{[p.business_type, p.area].filter(Boolean).join(' · ')}</span>
                      {(() => {
                        const meta = STATUS_BADGE[p.outreach_status ?? 'to_contact'];
                        return meta ? (
                          <span className={`text-[10px] font-medium rounded-full px-1.5 border ${meta.cls}`}>
                            {meta.label}
                          </span>
                        ) : null;
                      })()}
                      {p.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {p.phone}
                        </span>
                      )}
                      {p.email && <Mail className="w-3 h-3 text-green-600" />}
                      {p.website && <Globe className="w-3 h-3 text-blue-500" />}
                      {typeof p.rating === 'number' && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-1.5">
                          ⭐ {p.rating}
                          {p.reviews_count ? ` (${p.reviews_count})` : ''}
                        </span>
                      )}
                      {p.runs_ads && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-50 border border-green-100 rounded-full px-1.5">
                          <Megaphone className="w-2.5 h-2.5" />
                          ads
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
  small,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  small?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 bg-white cursor-pointer ${small ? 'text-[11px]' : 'text-[12px]'}`}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o === 'all' ? 'All' : o}
        </option>
      ))}
    </select>
  );
}
