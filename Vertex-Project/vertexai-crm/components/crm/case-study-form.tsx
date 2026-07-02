'use client';

import { useState } from 'react';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';
import type { CaseStudy, CaseStudySection, CaseStudyResult } from '@/lib/supabase';
import ImageUpload from './image-upload';
import ImagePrompt from './image-prompt';

type Draft = Omit<CaseStudy, 'id' | 'created_at' | 'updated_at'>;

const EMPTY: Draft = {
  slug: '', title: '', category: '', role: '', date: '', summary: '',
  hero_type: 'image', hero_src: '', hero_poster: '', hero_alt: '', hero_placeholder: true,
  og_image: '', sections: [], results: [], tech_stack: [], published: false, sort_order: 0,
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function CaseStudyForm({
  existing,
  onClose,
  onSaved,
}: {
  existing: CaseStudy | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [d, setD] = useState<Draft>(existing ? { ...EMPTY, ...existing } : EMPTY);
  const [techInput, setTechInput] = useState((existing?.tech_stack ?? []).join(', '));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(!!existing);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));

  const updateSection = (i: number, patch: Partial<CaseStudySection>) =>
    set('sections', d.sections.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const updateResult = (i: number, patch: Partial<CaseStudyResult>) =>
    set('results', d.results.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const save = async () => {
    setError(null);
    const payload: Draft = { ...d, tech_stack: techInput.split(',').map((t) => t.trim()).filter(Boolean) };
    if (!payload.title || !payload.slug) { setError('Title and slug are required.'); return; }
    setSaving(true);
    try {
      const res = await fetch(
        existing ? `/api/case-studies/${existing.id}` : '/api/case-studies',
        { method: existing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setError(json.error || 'Save failed'); setSaving(false); return; }
      onSaved();
      onClose();
    } catch {
      setError('Network error'); setSaving(false);
    }
  };

  const label = 'block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1';
  const input = 'w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[13px] text-gray-900 outline-none focus:ring-2 focus:ring-amber-400/40';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl h-full bg-[#f7f7f9] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-black/[0.06] px-5 h-[52px] flex items-center gap-3">
          <span className="flex-1 text-[14px] font-semibold text-gray-900">
            {existing ? 'Edit Case Study' : 'New Case Study'}
          </span>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-black/[0.05]"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-5">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-[13px] px-3 py-2">{error}</div>}

          {/* Basics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={label}>Title *</label>
              <input className={input} value={d.title}
                onChange={(e) => { set('title', e.target.value); if (!slugTouched) set('slug', slugify(e.target.value)); }} />
            </div>
            <div>
              <label className={label}>Slug * (URL)</label>
              <input className={input} value={d.slug}
                onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} />
            </div>
            <div>
              <label className={label}>Category</label>
              <input className={input} value={d.category ?? ''} onChange={(e) => set('category', e.target.value)} />
            </div>
            <div>
              <label className={label}>Role</label>
              <input className={input} value={d.role ?? ''} onChange={(e) => set('role', e.target.value)} />
            </div>
            <div>
              <label className={label}>Date</label>
              <input className={input} value={d.date ?? ''} onChange={(e) => set('date', e.target.value)} placeholder="2026" />
            </div>
            <div className="col-span-2">
              <label className={label}>Summary</label>
              <textarea className={input} rows={3} value={d.summary ?? ''} onChange={(e) => set('summary', e.target.value)} />
            </div>
          </div>

          {/* Hero media */}
          <div className="rounded-xl bg-white border border-black/[0.06] p-4 space-y-3">
            <div className="text-[12px] font-semibold text-gray-700">Hero media</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Type</label>
                <select className={input} value={d.hero_type} onChange={(e) => set('hero_type', e.target.value as 'image' | 'video')}>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-[13px] text-gray-700">
                  <input type="checkbox" checked={d.hero_placeholder} onChange={(e) => set('hero_placeholder', e.target.checked)} />
                  Show placeholder (walang media pa)
                </label>
              </div>
              <div className="col-span-2">
                <label className={label}>{d.hero_type === 'video' ? 'Video URL/path (src)' : 'Hero image'}</label>
                {d.hero_type === 'video' ? (
                  <input className={input} value={d.hero_src ?? ''} onChange={(e) => set('hero_src', e.target.value)} placeholder="/case-studies/demo.mp4" />
                ) : (
                  <ImageUpload value={d.hero_src} folder="case-studies" onChange={(url) => { set('hero_src', url); if (url) set('hero_placeholder', false); }} />
                )}
                {d.hero_type !== 'video' && (
                  <ImagePrompt title={d.title} keywords={[d.category ?? '', ...techInput.split(',').map((t) => t.trim())].filter(Boolean)} kind="case study hero" aspect="16:9" />
                )}
              </div>
              {d.hero_type === 'video' && (
                <div className="col-span-2">
                  <label className={label}>Poster (thumbnail)</label>
                  <input className={input} value={d.hero_poster ?? ''} onChange={(e) => set('hero_poster', e.target.value)} />
                </div>
              )}
              <div className="col-span-2">
                <label className={label}>Alt text</label>
                <input className={input} value={d.hero_alt ?? ''} onChange={(e) => set('hero_alt', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={label}>OG image (LinkedIn preview, 1200×630)</label>
                <input className={input} value={d.og_image ?? ''} onChange={(e) => set('og_image', e.target.value)} placeholder="https://angelo-franco-portfolio.vercel.app/case-studies/…-og.png" />
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="rounded-xl bg-white border border-black/[0.06] p-4 space-y-3">
            <div className="flex items-center">
              <span className="flex-1 text-[12px] font-semibold text-gray-700">Sections</span>
              <button onClick={() => set('sections', [...d.sections, { heading: '', body: '' }])} className="inline-flex items-center gap-1 text-[12px] text-amber-600 font-medium"><Plus className="w-3.5 h-3.5" /> Add section</button>
            </div>
            {d.sections.map((s, i) => (
              <div key={i} className="rounded-lg border border-black/[0.06] p-3 space-y-2">
                <div className="flex gap-2">
                  <input className={input} placeholder="Heading (e.g. The Challenge)" value={s.heading} onChange={(e) => updateSection(i, { heading: e.target.value })} />
                  <button onClick={() => set('sections', d.sections.filter((_, idx) => idx !== i))} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 shrink-0"><Trash2 className="w-4 h-4" /></button>
                </div>
                <textarea className={input} rows={3} placeholder="Body text" value={s.body} onChange={(e) => updateSection(i, { body: e.target.value })} />
              </div>
            ))}
          </div>

          {/* Results */}
          <div className="rounded-xl bg-white border border-black/[0.06] p-4 space-y-3">
            <div className="flex items-center">
              <span className="flex-1 text-[12px] font-semibold text-gray-700">Results (metrics)</span>
              <button onClick={() => set('results', [...d.results, { value: '', label: '' }])} className="inline-flex items-center gap-1 text-[12px] text-amber-600 font-medium"><Plus className="w-3.5 h-3.5" /> Add metric</button>
            </div>
            {d.results.map((r, i) => (
              <div key={i} className="flex gap-2">
                <input className={`${input} w-28`} placeholder="80%" value={r.value} onChange={(e) => updateResult(i, { value: e.target.value })} />
                <input className={input} placeholder="Manual work eliminated" value={r.label} onChange={(e) => updateResult(i, { label: e.target.value })} />
                <button onClick={() => set('results', d.results.filter((_, idx) => idx !== i))} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          {/* Tech stack */}
          <div>
            <label className={label}>Tech stack (comma-separated)</label>
            <input className={input} value={techInput} onChange={(e) => setTechInput(e.target.value)} placeholder="n8n, LLMs, REST APIs, NetSuite" />
          </div>

          {/* Publish */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-[13px] font-medium text-gray-800">
              <input type="checkbox" checked={d.published} onChange={(e) => set('published', e.target.checked)} />
              Published (live sa portfolio)
            </label>
            <div className="flex items-center gap-2 text-[13px] text-gray-600">
              <span>Sort order</span>
              <input type="number" className={`${input} w-20`} value={d.sort_order} onChange={(e) => set('sort_order', Number(e.target.value) || 0)} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white/85 backdrop-blur-xl border-t border-black/[0.06] px-5 py-3 flex items-center gap-3">
          {d.published && <span className="text-[11px] text-gray-400">Pag-save → magre-rebuild ang portfolio (~1-2 min)</span>}
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] text-gray-600 hover:bg-black/[0.05]">Cancel</button>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white text-[13px] font-semibold hover:bg-amber-600 disabled:opacity-60">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} {existing ? 'Save changes' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
