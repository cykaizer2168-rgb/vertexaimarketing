'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw, Pencil, Trash2, ExternalLink, RotateCw, Loader2 } from 'lucide-react';
import type { Post } from '@/lib/supabase';
import BlogPostForm from '@/components/crm/blog-post-form';

const PORTFOLIO = 'https://angelo-franco-portfolio.vercel.app';

export default function BlogPage() {
  const [items, setItems] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Post | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/blog');
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setError(json.error || 'Failed to load'); setItems([]); }
    else { setError(null); setItems(json.posts ?? []); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async (p: Post) => {
    if (!confirm(`Delete "${p.title}"? Hindi na maibabalik.`)) return;
    const res = await fetch(`/api/blog/${p.id}`, { method: 'DELETE' });
    setToast(res.ok ? 'Deleted.' : 'Delete failed.');
    if (res.ok) load();
  };

  const rebuild = async () => {
    setRebuilding(true);
    const res = await fetch('/api/case-studies/rebuild', { method: 'POST' });
    const json = await res.json().catch(() => ({}));
    setToast(res.ok ? 'Rebuild triggered — live in ~1-2 min.' : (json.error || 'Rebuild failed.'));
    setRebuilding(false);
  };

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); } }, [toast]);

  return (
    <>
      {showForm && <BlogPostForm existing={editing} onClose={() => setShowForm(false)} onSaved={load} />}
      {toast && <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] bg-gray-900 text-white text-[13px] px-4 py-2.5 rounded-xl shadow-lg">{toast}</div>}

      <div className="bg-white/65 backdrop-blur-2xl border-b border-black/[0.06] px-4 h-[50px] flex items-center gap-2 shrink-0">
        <span className="flex-1 text-[14px] font-semibold text-gray-800">Blog</span>
        <button onClick={load} title="Refresh" className="p-2 rounded-lg text-gray-500 hover:bg-black/[0.05]"><RefreshCw className="w-4 h-4" /></button>
        <button onClick={rebuild} disabled={rebuilding} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium text-gray-700 border border-black/[0.08] hover:bg-black/[0.03] disabled:opacity-60">
          {rebuilding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />} Rebuild site
        </button>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold text-white bg-amber-500 hover:bg-amber-600">
          <Plus className="w-3.5 h-3.5" /> New Article
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-[13px] text-gray-400 py-10 text-center">Loading…</div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-[13px] px-3 py-2">{error}</div>
        ) : items.length === 0 ? (
          <div className="text-[13px] text-gray-400 py-10 text-center">Wala pang article. I-click ang “New Article”.</div>
        ) : (
          <div className="grid gap-2.5 max-w-3xl">
            {items.map((p) => (
              <div key={p.id} className="group bg-white rounded-xl border border-black/[0.06] px-4 py-3 flex items-center gap-3 hover:shadow-[0_1px_6px_rgba(0,0,0,0.06)] transition-shadow">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-semibold text-gray-900 truncate">{p.title}</span>
                    <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-semibold ${p.published ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>{p.published ? 'Published' : 'Draft'}</span>
                  </div>
                  <div className="text-[11.5px] text-gray-400 truncate">/blog/{p.slug} · {(p.tags ?? []).join(', ') || '—'}</div>
                </div>
                {p.published && <a href={`${PORTFOLIO}/blog/${p.slug}`} target="_blank" rel="noopener noreferrer" title="View live" className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-black/[0.04]"><ExternalLink className="w-4 h-4" /></a>}
                <button onClick={() => { setEditing(p); setShowForm(true); }} title="Edit" className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-black/[0.04]"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => remove(p)} title="Delete" className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
