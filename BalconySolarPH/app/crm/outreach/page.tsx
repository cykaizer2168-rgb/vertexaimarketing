'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Search, Sparkles, Check, Phone, Mail, Copy, Zap } from 'lucide-react';
import { useProspects } from '@/lib/use-prospects';

const TYPES = ['Resto/cafe', 'Retail/shops', 'Offices/clinics', 'Hotels/inns'];
const AREAS = ['Makati', 'BGC / Taguig', 'Ortigas / Pasig', 'Quezon City', 'Manila'];
const PRODUCTS = ['Balcony Solar Kit 800W', 'Balcony Solar Kit 1.6kW', 'Custom Quote'];

type Draft = { subject: string; body: string; loading?: boolean };

export default function OutreachPage() {
  const { prospects, loading, refetch } = useProspects();
  const [type, setType] = useState(TYPES[0]);
  const [area, setArea] = useState(AREAS[0]);
  const [product, setProduct] = useState(PRODUCTS[0]);
  const [limit, setLimit] = useState(25);
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [enriching, setEnriching] = useState<Set<string>>(new Set());

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
      // The scrape runs synchronously (AI Search + AI Scraper) and can take 1-3 min.
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

  async function compose(id: string, name: string, btype: string | null) {
    setDrafts((d) => ({ ...d, [id]: { subject: '', body: '', loading: true } }));
    const res = await fetch('/api/outreach/compose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessName: name, businessType: btype ?? type, product }),
    })
      .then((r) => r.json())
      .catch(() => null);
    setDrafts((d) => ({
      ...d,
      [id]: { subject: res?.subject ?? 'Error', body: res?.body ?? 'Compose failed — try again.', loading: false },
    }));
  }

  async function enrich(id: string) {
    setEnriching((s) => new Set(s).add(id));
    try {
      // Scrapes the prospect's website for a public phone/email (~1 min).
      await fetch('/api/outreach/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospectId: id }),
      });
    } catch {
      // ignore — refetch shows whatever got filled in
    }
    await refetch();
    setEnriching((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
  }

  async function approve() {
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
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200">
            <span className="text-[12px] font-semibold text-gray-700">Prospects to review ({prospects.length})</span>
            <button
              onClick={approve}
              disabled={sel.size === 0}
              className="flex items-center gap-1 text-[12px] border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40 cursor-pointer text-gray-700"
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
          ) : prospects.length === 0 ? (
            <div className="py-16 text-center text-[12px] text-gray-400">
              Wala pang prospects — mag-&quot;Find Prospects&quot; sa itaas.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {prospects.map((p) => {
                const draft = drafts[p.id];
                return (
                  <li key={p.id} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={sel.has(p.id)}
                        onChange={() => toggle(p.id)}
                        className="mt-1 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-gray-800">{p.name}</div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-3 mt-0.5">
                          <span>{p.area ?? ''}</span>
                          {p.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {p.phone}
                            </span>
                          )}
                          {p.email ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <Mail className="w-3 h-3" />
                              {p.email}
                            </span>
                          ) : (
                            <span className="text-amber-600">call/FB only</span>
                          )}
                        </div>
                        {draft && (
                          <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                            {draft.loading ? (
                              <span className="text-[11px] text-gray-400">✨ Composing…</span>
                            ) : (
                              <>
                                <div className="text-[11px] font-semibold text-gray-700">{draft.subject}</div>
                                <pre className="text-[11px] text-gray-600 whitespace-pre-wrap font-sans mt-1">{draft.body}</pre>
                                <button
                                  onClick={() => navigator.clipboard.writeText(`${draft.subject}\n\n${draft.body}`)}
                                  className="mt-1.5 flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-700 cursor-pointer"
                                >
                                  <Copy className="w-3 h-3" />
                                  Copy
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        {p.website && (!p.phone || !p.email) && (
                          <button
                            onClick={() => enrich(p.id)}
                            disabled={enriching.has(p.id)}
                            className="flex items-center gap-1 text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 disabled:opacity-50 cursor-pointer text-gray-700"
                          >
                            <Zap className="w-3 h-3" />
                            {enriching.has(p.id) ? 'Enriching…' : 'Enrich'}
                          </button>
                        )}
                        <button
                          onClick={() => compose(p.id, p.name, p.business_type)}
                          className="flex items-center gap-1 text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 cursor-pointer text-gray-700"
                        >
                          <Sparkles className="w-3 h-3" />
                          {draft ? 'Regenerate' : 'AI message'}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
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

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-[12px] border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 bg-white cursor-pointer"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
