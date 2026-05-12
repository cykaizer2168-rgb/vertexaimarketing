'use client';

import { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { CommandPalette } from '@/components/layout/command-palette';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { Toaster } from '@/components/ui/sonner';
import { NAV_MODULES } from '@/components/layout/nav-data';

interface ErpShellProps {
  allowedIds: string[];
  children: React.ReactNode;
}

export function ErpShell({ allowedIds, children }: ErpShellProps) {
  const filteredModules = useMemo(() => {
    if (allowedIds.length === 0) return NAV_MODULES;
    return NAV_MODULES
      .map(mod => ({
        ...mod,
        categories: mod.categories.filter(cat => allowedIds.includes(cat.id)),
      }))
      .filter(mod => mod.categories.length > 0);
  }, [allowedIds]);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [favorites, setFavorites]     = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('erp-v2-favorites');
      if (stored) setFavorites(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(o => !o);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  function handleFavoritesChange(favs: string[]) {
    setFavorites(favs);
    try {
      localStorage.setItem('erp-v2-favorites', JSON.stringify(favs));
    } catch { /* ignore */ }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <Sidebar
        modules={filteredModules}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        favorites={favorites}
        onFavoritesChange={handleFavoritesChange}
        onOpenPalette={() => setPaletteOpen(true)}
      />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar
          onMenuToggle={() => setMobileOpen(o => !o)}
          onOpenPalette={() => setPaletteOpen(true)}
        />
        <Breadcrumbs />
        <main className="flex-1 overflow-y-auto p-5">
          {children}
        </main>
        <footer className="shrink-0 border-t border-[#E5E7EB] bg-white px-5 py-2 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">Vertex ERP</span>
          <span className="text-[10px] text-slate-400">© 2026 Vertex Consulting. All Rights Reserved.</span>
        </footer>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        favorites={favorites}
        modules={filteredModules}
      />
      <Toaster richColors position="top-right" />
    </div>
  );
}
