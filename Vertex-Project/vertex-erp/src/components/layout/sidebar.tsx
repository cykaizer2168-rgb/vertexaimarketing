'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronDown, PanelLeftClose, PanelLeftOpen,
  Search, Star, StarOff, Clock,
} from 'lucide-react';
import { NAV_MODULES, findByHref, flattenNav, type ErpNavModule } from './nav-data';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// ─── localStorage keys ───────────────────────────────────────────────────────
const LS = {
  COLLAPSED:  'erp-v2-collapsed',
  MODULE:     'erp-v2-module',
  OPEN_CATS:  'erp-v2-open-cats',
  FAVORITES:  'erp-v2-favorites',
  RECENTS:    'erp-v2-recents',
};

interface RecentItem { href: string; label: string; breadcrumb: string; }

const BADGE_STYLE: Record<string, string> = {
  AI:   'bg-violet-900/60 text-violet-300 border-violet-700',
  NEW:  'bg-emerald-900/60 text-emerald-300 border-emerald-700',
  BETA: 'bg-amber-900/60 text-amber-300 border-amber-700',
};

// ─── Props ───────────────────────────────────────────────────────────────────
interface SidebarProps {
  modules:        ErpNavModule[];
  mobileOpen?:    boolean;
  onMobileClose?: () => void;
  favorites:      string[];
  onFavoritesChange: (favs: string[]) => void;
  onOpenPalette:  () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function Sidebar({
  modules,
  mobileOpen, onMobileClose,
  favorites, onFavoritesChange,
  onOpenPalette,
}: SidebarProps) {
  const pathname = usePathname();

  const [collapsed,    setCollapsed]    = useState(false);
  const [activeModule, setActiveModule] = useState<string>('transactions');
  const [openCats,     setOpenCats]     = useState<string[]>(['purchases', 'sales']);
  const [recents,      setRecents]      = useState<RecentItem[]>([]);
  const [hoveredItem,  setHoveredItem]  = useState<string | null>(null);
  const [mounted,      setMounted]      = useState(false);

  // ── Hydrate from localStorage ──
  useEffect(() => {
    setMounted(true);
    try {
      const c = localStorage.getItem(LS.COLLAPSED);  if (c) setCollapsed(c === 'true');
      const m = localStorage.getItem(LS.MODULE);     if (m) setActiveModule(m);
      const g = localStorage.getItem(LS.OPEN_CATS);  if (g) setOpenCats(JSON.parse(g));
      const r = localStorage.getItem(LS.RECENTS);    if (r) setRecents(JSON.parse(r));
    } catch { /* ignore */ }
  }, []);

  // ── Track recents ──
  useEffect(() => {
    const match = findByHref(pathname, NAV_MODULES);
    if (!match) return;
    setRecents(prev => {
      const item: RecentItem = {
        href:       match.item.href,
        label:      match.item.label,
        breadcrumb: `${match.module.shortLabel} › ${match.category.label}`,
      };
      const filtered = prev.filter(r => r.href !== pathname);
      const updated  = [item, ...filtered].slice(0, 8);
      localStorage.setItem(LS.RECENTS, JSON.stringify(updated));
      return updated;
    });
    // Auto-activate the correct module when navigating
    setActiveModule(match.module.id);
    localStorage.setItem(LS.MODULE, match.module.id);
  }, [pathname]);

  // ── Helpers ──
  const toggleCollapsed = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem(LS.COLLAPSED, String(next));
      return next;
    });
  }, []);

  const switchModule = useCallback((id: string) => {
    setActiveModule(id);
    localStorage.setItem(LS.MODULE, id);
    if (collapsed) {
      setCollapsed(false);
      localStorage.setItem(LS.COLLAPSED, 'false');
    }
  }, [collapsed]);

  const toggleCat = useCallback((id: string) => {
    setOpenCats(prev => {
      const next = prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id];
      localStorage.setItem(LS.OPEN_CATS, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((href: string) => {
    const next = favorites.includes(href)
      ? favorites.filter(f => f !== href)
      : [...favorites, href];
    onFavoritesChange(next);
    localStorage.setItem(LS.FAVORITES, JSON.stringify(next));
  }, [favorites, onFavoritesChange]);

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));

  const currentModule = modules.find(m => m.id === activeModule) ?? modules[0];
  const allFlat       = flattenNav(modules);
  const favItems      = allFlat.filter(i => favorites.includes(i.href));

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] lg:hidden"
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: mounted ? (collapsed ? 52 : 240) : 240 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        style={{ width: 240 }}
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full flex-col border-r border-slate-800 bg-[#0B1120] overflow-hidden shrink-0',
          'lg:relative lg:z-auto',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* ── Logo bar ──────────────────────────────────────── */}
        <div className="flex h-11 shrink-0 items-center border-b border-slate-800 px-3 gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-blue-600">
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
              <path d="M2 10L6 2L10 10M3.5 7.5H8.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                key="logo-text"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.16 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <span className="text-[13px] font-semibold text-white tracking-tight">Vertex ERP</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={toggleCollapsed}
            className="hidden lg:flex ml-auto shrink-0 items-center justify-center h-6 w-6 rounded text-slate-600 hover:text-slate-400 hover:bg-slate-800 transition-colors"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={onMobileClose}
            className="lg:hidden ml-auto shrink-0 flex items-center justify-center h-6 w-6 rounded text-slate-600 hover:text-slate-400 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* ── Search trigger ──────────────────────────────────── */}
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  onClick={onOpenPalette}
                  className="mx-auto my-1.5 flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
                >
                  <Search className="h-3.5 w-3.5" />
                </button>
              }
            />
            <TooltipContent side="right" className="text-[11px]">Search (⌘K)</TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={onOpenPalette}
            className="mx-3 my-2 flex items-center gap-2 rounded border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-[11px] text-slate-500 hover:border-slate-700 hover:text-slate-400 transition-colors"
          >
            <Search className="h-3 w-3 shrink-0" />
            <span className="flex-1 text-left">Search…</span>
            <kbd className="hidden sm:inline-flex rounded border border-slate-700 bg-slate-800 px-1 py-0.5 text-[9px] text-slate-500">
              ⌘K
            </kbd>
          </button>
        )}

        {/* ── Module Tabs ─────────────────────────────────────── */}
        {collapsed ? (
          <div className="shrink-0 border-b border-slate-800/70 pb-1">
            {modules.map(mod => {
              const Icon    = mod.icon;
              const isActive = mod.id === activeModule;
              return (
                <Tooltip key={mod.id}>
                  <TooltipTrigger
                    render={
                      <button
                        onClick={() => switchModule(mod.id)}
                        className={cn(
                          'mx-auto my-0.5 flex h-8 w-8 items-center justify-center rounded transition-colors',
                          isActive
                            ? 'bg-blue-600/20 text-blue-400'
                            : 'text-slate-600 hover:bg-slate-800 hover:text-slate-400'
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </button>
                    }
                  />
                  <TooltipContent side="right" className="text-[11px]">{mod.label}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        ) : (
          <div className="flex shrink-0 border-b border-slate-800/70 px-2 py-1 gap-0.5">
            {modules.map(mod => (
              <button
                key={mod.id}
                onClick={() => switchModule(mod.id)}
                className={cn(
                  'flex-1 rounded px-1 py-1.5 text-[10px] font-semibold transition-colors whitespace-nowrap',
                  mod.id === activeModule
                    ? 'bg-blue-600/15 text-blue-400'
                    : 'text-slate-600 hover:bg-slate-800/50 hover:text-slate-400'
                )}
              >
                {mod.shortLabel}
              </button>
            ))}
          </div>
        )}

        {/* ── Scrollable nav body ─────────────────────────────── */}
        <ScrollArea className="flex-1 overflow-x-hidden">
          <div className="py-1.5">

            {/* Favorites section */}
            {!collapsed && favItems.length > 0 && (
              <FavoritesSection
                items={favItems}
                isActive={isActive}
                onToggleFavorite={toggleFavorite}
                onMobileClose={onMobileClose}
                hoveredItem={hoveredItem}
                onHoverItem={setHoveredItem}
              />
            )}

            {/* Recents section (only when no search, collapsed hidden) */}
            {!collapsed && recents.length > 0 && (
              <RecentsSection recents={recents} isActive={isActive} onMobileClose={onMobileClose} />
            )}

            {/* Divider if extras shown */}
            {!collapsed && (favItems.length > 0 || recents.length > 0) && (
              <div className="mx-3 my-1.5 border-t border-slate-800/60" />
            )}

            {/* Module label */}
            {!collapsed && (
              <p className="px-3 pb-1 pt-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-700">
                {currentModule.label}
              </p>
            )}

            {/* Categories */}
            {collapsed
              ? <CollapsedModuleNav
                  module={currentModule}
                  isActive={isActive}
                  onMobileClose={onMobileClose}
                />
              : <ExpandedModuleNav
                  module={currentModule}
                  openCats={openCats}
                  isActive={isActive}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                  onToggleCat={toggleCat}
                  onMobileClose={onMobileClose}
                  hoveredItem={hoveredItem}
                  onHoverItem={setHoveredItem}
                />
            }
          </div>
          <div className="h-6" />
        </ScrollArea>
      </motion.aside>
    </>
  );
}

// ─── Collapsed nav ───────────────────────────────────────────────────────────
function CollapsedModuleNav({
  module, isActive, onMobileClose,
}: {
  module: ErpNavModule;
  isActive: (href: string) => boolean;
  onMobileClose?: () => void;
}) {
  return (
    <>
      {module.categories.map((cat, idx) => (
        <div key={cat.id}>
          {idx > 0 && <div className="mx-2 my-0.5 border-t border-slate-800/50" />}
          {cat.items.map(item => {
            const active = isActive(item.href);
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger
                  render={
                    <Link
                      href={item.href}
                      onClick={onMobileClose}
                      className={cn(
                        'mx-auto my-0.5 flex h-7 w-8 items-center justify-center rounded transition-colors',
                        active
                          ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500'
                          : 'text-slate-600 hover:bg-slate-800 hover:text-slate-300 border-l-2 border-transparent'
                      )}
                    >
                      <div className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-blue-400' : 'bg-slate-600')} />
                    </Link>
                  }
                />
                <TooltipContent side="right" className="text-[11px] max-w-[180px]">
                  <span className="text-slate-400 text-[9px] block mb-0.5">{cat.label}</span>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      ))}
    </>
  );
}

// ─── Expanded nav ────────────────────────────────────────────────────────────
function ExpandedModuleNav({
  module, openCats, isActive, favorites, onToggleFavorite,
  onToggleCat, onMobileClose, hoveredItem, onHoverItem,
}: {
  module: ErpNavModule;
  openCats: string[];
  isActive: (href: string) => boolean;
  favorites: string[];
  onToggleFavorite: (href: string) => void;
  onToggleCat: (id: string) => void;
  onMobileClose?: () => void;
  hoveredItem: string | null;
  onHoverItem: (id: string | null) => void;
}) {
  return (
    <>
      {module.categories.map(cat => {
        const isOpen     = openCats.includes(cat.id);
        const CatIcon    = cat.icon;
        const hasActive  = cat.items.some(i => isActive(i.href));

        return (
          <div key={cat.id} className="px-2 mb-0.5">
            {/* Category toggle */}
            <button
              onClick={() => onToggleCat(cat.id)}
              className={cn(
                'group flex w-full items-center justify-between rounded px-1.5 py-1.5 transition-colors',
                hasActive
                  ? 'text-blue-400'
                  : 'text-slate-500 hover:bg-slate-800/40 hover:text-slate-300'
              )}
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-2 min-w-0">
                <CatIcon className="h-3 w-3 shrink-0 opacity-70" />
                <span className="text-[11px] font-semibold truncate">{cat.label}</span>
              </div>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.17 }}
                className="shrink-0 ml-1"
              >
                <ChevronDown className="h-3 w-3 opacity-50" />
              </motion.span>
            </button>

            {/* Category items */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key={cat.id + '-body'}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className="ml-3 border-l border-slate-800/70 pl-1 pb-1">
                    {cat.items.map(item => {
                      const active    = isActive(item.href);
                      const isFav     = favorites.includes(item.href);
                      const hovered   = hoveredItem === item.id;

                      return (
                        <div
                          key={item.id}
                          className="relative group/item flex items-center"
                          onMouseEnter={() => onHoverItem(item.id)}
                          onMouseLeave={() => onHoverItem(null)}
                        >
                          <Link
                            href={item.href}
                            onClick={onMobileClose}
                            className={cn(
                              'flex flex-1 items-center gap-1.5 rounded-r py-1 pl-2 pr-7 text-[11px] transition-colors border-l-2 -ml-px min-w-0',
                              active
                                ? 'border-blue-500 bg-blue-600/12 text-blue-300 font-medium'
                                : 'border-transparent text-slate-500 hover:bg-slate-800/50 hover:text-slate-200'
                            )}
                          >
                            <span className="truncate">{item.label}</span>
                            {item.badge && (
                              <span className={cn('shrink-0 rounded border px-1 py-0.5 text-[8px] font-semibold leading-none', BADGE_STYLE[item.badge])}>
                                {item.badge}
                              </span>
                            )}
                          </Link>

                          {/* Star / favorite button */}
                          <button
                            onClick={e => { e.preventDefault(); onToggleFavorite(item.href); }}
                            className={cn(
                              'absolute right-1 flex h-5 w-5 shrink-0 items-center justify-center rounded transition-all',
                              isFav
                                ? 'text-amber-400 opacity-100'
                                : hovered
                                  ? 'text-slate-500 hover:text-amber-400 opacity-100'
                                  : 'opacity-0'
                            )}
                            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            {isFav
                              ? <Star className="h-3 w-3 fill-amber-400" />
                              : <StarOff className="h-3 w-3" />
                            }
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </>
  );
}

// ─── Favorites section ────────────────────────────────────────────────────────
function FavoritesSection({
  items, isActive, onToggleFavorite, onMobileClose, hoveredItem, onHoverItem,
}: {
  items: ReturnType<typeof flattenNav>;
  isActive: (href: string) => boolean;
  onToggleFavorite: (href: string) => void;
  onMobileClose?: () => void;
  hoveredItem: string | null;
  onHoverItem: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="px-2 mb-0.5">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between rounded px-1.5 py-1.5 text-slate-500 hover:bg-slate-800/40 hover:text-slate-300 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400 opacity-80" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em]">Favorites</span>
          <span className="text-[9px] text-slate-600">({items.length})</span>
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.17 }}>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="ml-3 border-l border-slate-800/70 pl-1 pb-1">
              {items.map(item => {
                const active  = isActive(item.href);
                const hovered = hoveredItem === ('fav-' + item.id);
                return (
                  <div
                    key={item.id}
                    className="relative group/fav flex items-center"
                    onMouseEnter={() => onHoverItem('fav-' + item.id)}
                    onMouseLeave={() => onHoverItem(null)}
                  >
                    <Link
                      href={item.href}
                      onClick={onMobileClose}
                      className={cn(
                        'flex flex-1 items-center gap-1.5 rounded-r py-1 pl-2 pr-7 text-[11px] transition-colors border-l-2 -ml-px min-w-0',
                        active
                          ? 'border-blue-500 bg-blue-600/12 text-blue-300 font-medium'
                          : 'border-transparent text-slate-500 hover:bg-slate-800/50 hover:text-slate-200'
                      )}
                    >
                      <span className="truncate">{item.label}</span>
                      <span className="text-[9px] text-slate-600 shrink-0 hidden group-hover/fav:inline">
                        {item.breadcrumb}
                      </span>
                    </Link>
                    <button
                      onClick={e => { e.preventDefault(); onToggleFavorite(item.href); }}
                      className={cn(
                        'absolute right-1 flex h-5 w-5 shrink-0 items-center justify-center rounded transition-all text-amber-400',
                        hovered ? 'opacity-100' : 'opacity-0'
                      )}
                    >
                      <Star className="h-3 w-3 fill-amber-400" />
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Recents section ─────────────────────────────────────────────────────────
function RecentsSection({
  recents, isActive, onMobileClose,
}: {
  recents: RecentItem[];
  isActive: (href: string) => boolean;
  onMobileClose?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="px-2 mb-0.5">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between rounded px-1.5 py-1.5 text-slate-500 hover:bg-slate-800/40 hover:text-slate-300 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 opacity-60" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em]">Recent</span>
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.17 }}>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="ml-3 border-l border-slate-800/70 pl-1 pb-1">
              {recents.slice(0, 6).map(r => {
                const active = isActive(r.href);
                return (
                  <Link
                    key={r.href}
                    href={r.href}
                    onClick={onMobileClose}
                    className={cn(
                      'flex flex-col rounded-r py-1 pl-2 text-[11px] transition-colors border-l-2 -ml-px min-w-0',
                      active
                        ? 'border-blue-500 bg-blue-600/12 text-blue-300 font-medium'
                        : 'border-transparent text-slate-500 hover:bg-slate-800/50 hover:text-slate-200'
                    )}
                  >
                    <span className="truncate">{r.label}</span>
                    <span className="text-[9px] text-slate-700 truncate">{r.breadcrumb}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
