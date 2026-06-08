'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Search, Check, Phone, Mail, Globe, Megaphone } from 'lucide-react';
import { useProspects } from '@/lib/use-prospects';
import type { Prospect } from '@/lib/supabase';
import ProspectDetail from '@/components/crm/prospect-detail';

const TYPES = ['Resto/cafe', 'Retail/shops', 'Offices/clinics', 'Hotels/inns'];
const AREAS = ['Makati', 'BGC / Taguig', 'Ortigas / Pasig', 'Quezon City', 'Manila'];
const PRODUCTS = ['Balcony Solar Kit 800W', 'Balcony Solar Kit 1.6kW', 'Custom Quote'];

export default function OutreachPage() {
  const { prospects, loading, refetch } = useProspects();
  const [type, setType] = useState(TYPES[0]);
  const [area, setArea] = useState(AREAS[0]);
  const [product, setProduct] = useState(PRODUCTS[0]);
  const [limit, setLimit] = useState(25);
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Prospect | null>(null);

  // Filters over the staged list.
  const [fType, setFType] = useState('all');
  const [fArea, setFArea] = useState('all');

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
      prospects.filter(
        (p) => (fType === 'all' || p.business_type === fType) && (fArea === 'all' || p.area === fArea)
      ),
    [prospects, fType, fArea]
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
        body: JSON.stringify({ type, area, product, limit }),
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
        <ProspectDetail
          prospect={selected}
          product={product}
          onClose={() => setSelected(null)}
          onChanged={refetch}
        />
      )}

      <div className="bg-white border-b border-gray-200 px-4 h-[50px] flex items-center gap-2 shrink-0">
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
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-end gap-3">
          <Field label="Business type">
            <Select value={type} onChange={setType} options={TYPES} />
          </Field>
          <Field label="Area">
            <Select value={area} onChange={setArea} options={AREAS} />
          </Field>
          <Field label="Product">
            <Select value={product} onChange={setProduct} options={PRODUCTS} />
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
            disabled={busy}
            className="flex items-center gap-1.5 text-[12px] bg-amber-500 text-white rounded-lg px-4 py-2 hover:bg-amber-600 disabled:opacity-50 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            {busy ? 'Finding…' : 'Find Prospects'}
          </button>
        </div>

        {/* Review table */}
        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-gray-200">
            <span className="text-[12px] font-semibold text-gray-700">Prospects ({filtered.length})</span>
            {/* Filters */}
            <Select value={fType} onChange={setFType} options={['all', ...typeOptions]} small />
            <Select value={fArea} onChange={setFArea} options={['all', ...areaOptions]} small />
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
              Walang prospects — mag-&quot;Find Prospects&quot; sa itaas (o i-adjust ang filters).
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
                    <div className="text-[13px] font-medium text-gray-800 hover:text-amber-600">{p.name}</div>
                    <div className="text-[11px] text-gray-500 flex items-center gap-3 mt-0.5 flex-wrap">
                      <span>{[p.business_type, p.area].filter(Boolean).join(' · ')}</span>
                      {p.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {p.phone}
                        </span>
                      )}
                      {p.email && <Mail className="w-3 h-3 text-green-600" />}
                      {p.website && <Globe className="w-3 h-3 text-blue-500" />}
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
