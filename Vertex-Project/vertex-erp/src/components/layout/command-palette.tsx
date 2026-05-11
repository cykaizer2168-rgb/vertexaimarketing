'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, Star, ChevronRight, X } from 'lucide-react';
import { NAV_MODULES, flattenNav, type FlatNavItem } from './nav-data';
import { cn } from '@/lib/utils';

const ALL_ITEMS = flattenNav(NAV_MODULES);

interface RecentItem { href: string; label: string; breadcrumb: string; }

const BADGE_STYLE: Record<string, string> = {
  AI:   'bg-violet-50 text-violet-600 border-violet-200',
  NEW:  'bg-emerald-50 text-emerald-600 border-emerald-200',
  BETA: 'bg-amber-50 text-amber-600 border-amber-200',
};

interface Props {
  open: boolean;
  onClose: () => void;
  favorites: string[];
}

export function CommandPalette({ open, onClose, favorites }: Props) {
  const router    = useRouter();
  const inputRef  = useRef<HTMLInputElement>(null);
  const listRef   = useRef<HTMLDivElement>(null);

  const [query, setQuery]       = useState('');
  const [selected, setSelected] = useState(0);
  const [recents, setRecents]   = useState<RecentItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('erp-v2-recents');
      if (stored) setRecents(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  // Global ⌘K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose(); else { /* parent controls open */ }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelected(0);
    }
  }, [open]);

  const results: FlatNavItem[] = useMemo(() => query.trim()
    ? ALL_ITEMS.filter(item => {
        const q = query.toLowerCase();
        return (
          item.label.toLowerCase().includes(q) ||
          item.categoryLabel.toLowerCase().includes(q) ||
          item.moduleLabel.toLowerCase().includes(q)
        );
      }).slice(0, 12)
    : [],
  [query]);

  const favItems = useMemo(
    () => ALL_ITEMS.filter(i => favorites.includes(i.href)).slice(0, 5),
    [favorites]
  );
  const recentItems = useMemo(
    () => recents.map(r => ALL_ITEMS.find(i => i.href === r.href)).filter(Boolean).slice(0, 5) as FlatNavItem[],
    [recents]
  );

  const displayItems = useMemo(() => query.trim() ? results : [], [query, results]);
  const totalCount   = displayItems.length;

  const navigate = useCallback((item: FlatNavItem) => {
    router.push(item.href);
    onClose();
    // Update recents
    setRecents(prev => {
      const filtered = prev.filter(r => r.href !== item.href);
      const updated: RecentItem[] = [
        { href: item.href, label: item.label, breadcrumb: item.breadcrumb },
        ...filtered,
      ].slice(0, 8);
      localStorage.setItem('erp-v2-recents', JSON.stringify(updated));
      return updated;
    });
  }, [router, onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected(i => Math.min(i + 1, totalCount - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected(i => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && displayItems[selected]) {
        navigate(displayItems[selected]);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, selected, displayItems, totalCount, navigate, onClose]);

  // Reset selected when results change
  useEffect(() => setSelected(0), [query]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selected}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cp-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="cp-panel"
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.14, ease: [0.4, 0, 0.2, 1] }}
            className="fixed left-1/2 top-[14%] z-[101] w-full max-w-[560px] -translate-x-1/2 rounded-lg border border-[#E5E7EB] bg-white shadow-xl overflow-hidden"
          >
            {/* Input */}
            <div className="flex items-center gap-2.5 border-b border-[#E5E7EB] px-4 py-3">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search transactions, reports, settings…"
                className="flex-1 bg-transparent text-[13px] text-slate-800 placeholder:text-slate-400 outline-none"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-400 font-medium">
                Esc
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[400px] overflow-y-auto py-1.5">

              {/* Active search results */}
              {query.trim() && (
                <>
                  {results.length === 0 ? (
                    <div className="px-4 py-8 text-center text-[12px] text-slate-400">
                      No results for &ldquo;{query}&rdquo;
                    </div>
                  ) : (
                    <Section label={`${results.length} result${results.length !== 1 ? 's' : ''}`}>
                      {results.map((item, idx) => (
                        <ResultRow
                          key={item.id}
                          item={item}
                          idx={idx}
                          selected={selected === idx}
                          onSelect={() => navigate(item)}
                          onHover={() => setSelected(idx)}
                        />
                      ))}
                    </Section>
                  )}
                </>
              )}

              {/* Empty state: recents + favorites */}
              {!query.trim() && (
                <>
                  {recentItems.length > 0 && (
                    <Section label="Recent" icon={<Clock className="h-3 w-3" />}>
                      {recentItems.map((item, idx) => (
                        <ResultRow
                          key={item.id}
                          item={item}
                          idx={idx}
                          selected={selected === idx}
                          onSelect={() => navigate(item)}
                          onHover={() => setSelected(idx)}
                        />
                      ))}
                    </Section>
                  )}

                  {favItems.length > 0 && (
                    <Section label="Favorites" icon={<Star className="h-3 w-3" />}>
                      {favItems.map((item, idx) => (
                        <ResultRow
                          key={item.id}
                          item={item}
                          idx={idx + recentItems.length}
                          selected={selected === idx + recentItems.length}
                          onSelect={() => navigate(item)}
                          onHover={() => setSelected(idx + recentItems.length)}
                        />
                      ))}
                    </Section>
                  )}

                  {recentItems.length === 0 && favItems.length === 0 && (
                    <div className="px-4 py-8 text-center text-[12px] text-slate-400">
                      Start typing to search across all modules
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[#F1F5F9] px-4 py-2 bg-[#FAFAFA]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 text-[9px]">↑↓</kbd> navigate
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 text-[9px]">↵</kbd> open
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 text-[9px]">Esc</kbd> close
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Vertex ERP</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ label, icon, children }: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1">
      <div className="flex items-center gap-1.5 px-4 pb-1 pt-2">
        {icon && <span className="text-slate-400">{icon}</span>}
        <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-slate-400">{label}</span>
      </div>
      {children}
    </div>
  );
}

function ResultRow({ item, idx, selected, onSelect, onHover }: {
  item: FlatNavItem;
  idx: number;
  selected: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  return (
    <button
      data-idx={idx}
      onClick={onSelect}
      onMouseEnter={onHover}
      className={cn(
        'flex w-full items-center gap-3 px-4 py-2 text-left transition-colors',
        selected ? 'bg-blue-50' : 'hover:bg-slate-50'
      )}
    >
      <span className={cn(
        'flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-semibold',
        selected ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
      )}>
        {item.moduleLabel.slice(0, 2).toUpperCase()}
      </span>
      <div className="flex-1 min-w-0">
        <p className={cn('text-[12px] font-medium truncate', selected ? 'text-blue-700' : 'text-slate-700')}>
          {item.label}
        </p>
        <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
          {item.breadcrumb.split(' › ').map((part, i, arr) => (
            <span key={i} className="flex items-center gap-1">
              {part}
              {i < arr.length - 1 && <ChevronRight className="h-2.5 w-2.5" />}
            </span>
          ))}
        </p>
      </div>
      {item.badge && (
        <span className={cn('shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-semibold', BADGE_STYLE[item.badge])}>
          {item.badge}
        </span>
      )}
      {selected && <ChevronRight className="h-3 w-3 text-blue-400 shrink-0" />}
    </button>
  );
}
