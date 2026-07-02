'use client';

import { useState } from 'react';
import { X, Loader2, Eye, Pencil } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Post } from '@/lib/supabase';
import ImageUpload from './image-upload';
import ImagePrompt from './image-prompt';

type Draft = Omit<Post, 'id' | 'created_at' | 'updated_at' | 'published_at'>;

const EMPTY: Draft = {
  slug: '', title: '', excerpt: '', cover_image: '', body: '', tags: [],
  author: 'Angelo B. Franco', og_image: '', published: false, sort_order: 0,
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function BlogPostForm({
  existing, onClose, onSaved,
}: { existing: Post | null; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState<Draft>(existing ? { ...EMPTY, ...existing } : EMPTY);
  const [tagsInput, setTagsInput] = useState((existing?.tags ?? []).join(', '));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(!!existing);
  const [tab, setTab] = useState<'write' | 'preview'>('write');

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setError(null);
    const payload: Draft = { ...d, tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean) };
    if (!payload.title || !payload.slug) { setError('Title and slug are required.'); return; }
    setSaving(true);
    try {
      const res = await fetch(existing ? `/api/blog/${existing.id}` : '/api/blog', {
        method: existing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setError(json.error || 'Save failed'); setSaving(false); return; }
      onSaved(); onClose();
    } catch { setError('Network error'); setSaving(false); }
  };

  const label = 'block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1';
  const input = 'w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[13px] text-gray-900 outline-none focus:ring-2 focus:ring-amber-400/40';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-3xl h-full bg-[#f7f7f9] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-black/[0.06] px-5 h-[52px] flex items-center gap-3">
          <span className="flex-1 text-[14px] font-semibold text-gray-900">{existing ? 'Edit Article' : 'New Article'}</span>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-black/[0.05]"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-[13px] px-3 py-2">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={label}>Title *</label>
              <input className={input} value={d.title}
                onChange={(e) => { set('title', e.target.value); if (!slugTouched) set('slug', slugify(e.target.value)); }} />
            </div>
            <div>
              <label className={label}>Slug * (URL)</label>
              <input className={input} value={d.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} />
            </div>
            <div>
              <label className={label}>Tags (comma-separated)</label>
              <input className={input} value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="NetSuite, AI Automation" />
            </div>
            <div className="col-span-2">
              <label className={label}>Excerpt (summary for cards + SEO)</label>
              <textarea className={input} rows={2} value={d.excerpt ?? ''} onChange={(e) => set('excerpt', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={label}>Cover image</label>
              <ImageUpload value={d.cover_image} folder="blog" onChange={(url) => set('cover_image', url)} />
              <ImagePrompt title={d.title} keywords={tagsInput} kind="blog cover" aspect="16:9" />
            </div>
          </div>

          {/* Markdown body: write / preview */}
          <div>
            <div className="flex items-center gap-1 mb-1">
              <label className={`${label} flex-1 mb-0`}>Body (Markdown)</label>
              <button onClick={() => setTab('write')} className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md ${tab === 'write' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-black/[0.05]'}`}><Pencil className="w-3 h-3" /> Write</button>
              <button onClick={() => setTab('preview')} className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md ${tab === 'preview' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-black/[0.05]'}`}><Eye className="w-3 h-3" /> Preview</button>
            </div>
            {tab === 'write' ? (
              <textarea className={`${input} font-mono text-[12.5px] leading-relaxed`} rows={18} value={d.body ?? ''} onChange={(e) => set('body', e.target.value)} placeholder={'## Heading\n\nWrite your article in **Markdown**.\n\n- bullet\n- points'} />
            ) : (
              <div className="prose prose-sm max-w-none rounded-lg border border-black/[0.08] bg-white p-4 min-h-[200px]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{d.body || '_Nothing to preview yet._'}</ReactMarkdown>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-[13px] font-medium text-gray-800">
              <input type="checkbox" checked={d.published} onChange={(e) => set('published', e.target.checked)} />
              Published (live sa blog)
            </label>
            <div className="flex items-center gap-2 text-[13px] text-gray-600">
              <span>Sort order</span>
              <input type="number" className={`${input} w-20`} value={d.sort_order} onChange={(e) => set('sort_order', Number(e.target.value) || 0)} />
            </div>
          </div>
        </div>

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
