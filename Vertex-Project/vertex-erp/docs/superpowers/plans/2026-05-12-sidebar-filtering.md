# Sidebar Filtering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Filter the sidebar and command palette so each user only sees nav categories their role can access, with permissions fetched server-side to avoid any flash of unfiltered content.

**Architecture:** `layout.tsx` becomes a server component that fetches permissions and passes filtered `ErpNavModule[]` to a new `ErpShell` client component (extracted from the current layout). `Sidebar` and `CommandPalette` receive `modules` as a prop instead of importing `NAV_MODULES` directly.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, `auth()` from NextAuth v5, `listRolePermissions()` from `@/lib/sheets`, Tailwind CSS.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/components/layout/sidebar.tsx` | Modify | Accept `modules` prop; use it for rendering (keep `NAV_MODULES` for recents tracking only) |
| `src/components/layout/command-palette.tsx` | Modify | Accept `modules` prop; compute searchable items from it |
| `src/app/(erp)/erp-shell.tsx` | Create | Client component — all interactive state extracted from layout |
| `src/app/(erp)/layout.tsx` | Modify | Convert to server component; fetch + filter permissions; render ErpShell |

---

## Task 1: Add `modules` prop to `Sidebar`

**Files:**
- Modify: `src/components/layout/sidebar.tsx`

The sidebar currently imports `NAV_MODULES` directly and uses it for rendering module tabs, category lists, and favorites. We need it to accept filtered modules as a prop while keeping `NAV_MODULES` only for recents tracking (recents record all visited hrefs regardless of current permissions).

- [ ] **Step 1: Update `SidebarProps` and component signature**

  Find the `SidebarProps` interface (around line 34) and the `Sidebar` function signature (around line 43). Replace:

  ```ts
  interface SidebarProps {
    mobileOpen?:    boolean;
    onMobileClose?: () => void;
    favorites:      string[];
    onFavoritesChange: (favs: string[]) => void;
    onOpenPalette:  () => void;
  }

  export function Sidebar({
    mobileOpen, onMobileClose,
    favorites, onFavoritesChange,
    onOpenPalette,
  }: SidebarProps) {
  ```

  With:

  ```ts
  interface SidebarProps {
    modules:        ErpNavModule[];
    mobileOpen?:    boolean;
    onMobileClose?: () => void;
    favorites:      string[];
    onFavoritesChange: (favs: string[]) => void;
    onOpenPalette:  () => void;
  }

  export function Sidebar({
    modules,
    mobileOpen, onMobileClose,
    favorites, onFavoritesChange,
    onOpenPalette,
  }: SidebarProps) {
  ```

- [ ] **Step 2: Replace `NAV_MODULES` usages inside the `Sidebar` body**

  Find these lines inside the `Sidebar` component body (around lines 125–127):

  ```ts
  const currentModule = NAV_MODULES.find(m => m.id === activeModule) ?? NAV_MODULES[0];
  const allFlat       = flattenNav(NAV_MODULES);
  const favItems      = allFlat.filter(i => favorites.includes(i.href));
  ```

  Replace with:

  ```ts
  const currentModule = modules.find(m => m.id === activeModule) ?? modules[0];
  const allFlat       = flattenNav(modules);
  const favItems      = allFlat.filter(i => favorites.includes(i.href));
  ```

- [ ] **Step 3: Replace `NAV_MODULES` in the collapsed module tabs render**

  Find the collapsed module tab section (around line 225):

  ```tsx
  {NAV_MODULES.map(mod => {
    const Icon    = mod.icon;
    const isActive = mod.id === activeModule;
    return (
      <Tooltip key={mod.id}>
  ```

  Replace `NAV_MODULES.map` with `modules.map`:

  ```tsx
  {modules.map(mod => {
    const Icon    = mod.icon;
    const isActive = mod.id === activeModule;
    return (
      <Tooltip key={mod.id}>
  ```

- [ ] **Step 4: Replace `NAV_MODULES` in the expanded module tabs render**

  Find the expanded module tab section (around line 252):

  ```tsx
  {NAV_MODULES.map(mod => (
    <button
      key={mod.id}
      onClick={() => switchModule(mod.id)}
  ```

  Replace `NAV_MODULES.map` with `modules.map`:

  ```tsx
  {modules.map(mod => (
    <button
      key={mod.id}
      onClick={() => switchModule(mod.id)}
  ```

- [ ] **Step 5: Run TypeScript check**

  ```bash
  cd /Users/lukash0915/Vertex-Project/vertex-erp && npx tsc --noEmit
  ```

  Expected: errors about `<Sidebar>` missing the `modules` prop in `erp-shell.tsx` (doesn't exist yet) — those are acceptable. Fix any other errors.

- [ ] **Step 6: Commit**

  ```bash
  git -C /Users/lukash0915/Vertex-Project/vertex-erp add src/components/layout/sidebar.tsx && \
  git -C /Users/lukash0915/Vertex-Project/vertex-erp commit -m "$(cat <<'EOF'
  feat(erp): add modules prop to Sidebar for permission-based filtering

  Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 2: Add `modules` prop to `CommandPalette`

**Files:**
- Modify: `src/components/layout/command-palette.tsx`

The command palette has a module-level constant `const ALL_ITEMS = flattenNav(NAV_MODULES)` (line 10) that is computed once at import time from the full unfiltered nav. This must become a prop-driven value computed inside the component.

- [ ] **Step 1: Remove the module-level `ALL_ITEMS` constant and update imports**

  Find and remove line 10:
  ```ts
  const ALL_ITEMS = flattenNav(NAV_MODULES);
  ```

  Also update the import on line 7 — remove `NAV_MODULES` from the import (keep `flattenNav` and `FlatNavItem`):

  Change:
  ```ts
  import { NAV_MODULES, flattenNav, type FlatNavItem } from './nav-data';
  ```
  To:
  ```ts
  import { flattenNav, type ErpNavModule, type FlatNavItem } from './nav-data';
  ```

- [ ] **Step 2: Add `modules` to the `Props` interface and component signature**

  Find the `Props` interface (around line 20):
  ```ts
  interface Props {
    open: boolean;
    onClose: () => void;
    favorites: string[];
  }

  export function CommandPalette({ open, onClose, favorites }: Props) {
  ```

  Replace with:
  ```ts
  interface Props {
    open: boolean;
    onClose: () => void;
    favorites: string[];
    modules: ErpNavModule[];
  }

  export function CommandPalette({ open, onClose, favorites, modules }: Props) {
  ```

- [ ] **Step 3: Compute `allItems` inside the component**

  Add this line at the top of the `CommandPalette` function body, after the `useRouter` / `useRef` lines:

  ```ts
  const allItems = useMemo(() => flattenNav(modules), [modules]);
  ```

  Then replace every usage of `ALL_ITEMS` inside the component with `allItems`:

  - `results` useMemo (around line 63): `ALL_ITEMS.filter(...)` → `allItems.filter(...)`
  - `favItems` useMemo (around line 75): `ALL_ITEMS.filter(...)` → `allItems.filter(...)`
  - `recentItems` useMemo (around line 79): `ALL_ITEMS.find(...)` → `allItems.find(...)`

  The three useMemos after the change:
  ```ts
  const allItems = useMemo(() => flattenNav(modules), [modules]);

  const results: FlatNavItem[] = useMemo(() => query.trim()
    ? allItems.filter(item => {
        const q = query.toLowerCase();
        return (
          item.label.toLowerCase().includes(q) ||
          item.categoryLabel.toLowerCase().includes(q) ||
          item.moduleLabel.toLowerCase().includes(q)
        );
      }).slice(0, 12)
    : [],
  [query, allItems]);

  const favItems = useMemo(
    () => allItems.filter(i => favorites.includes(i.href)).slice(0, 5),
    [favorites, allItems]
  );
  const recentItems = useMemo(
    () => recents.map(r => allItems.find(i => i.href === r.href)).filter(Boolean).slice(0, 5) as FlatNavItem[],
    [recents, allItems]
  );
  ```

- [ ] **Step 4: Run TypeScript check**

  ```bash
  cd /Users/lukash0915/Vertex-Project/vertex-erp && npx tsc --noEmit
  ```

  Expected: errors about `<CommandPalette>` missing `modules` prop (callers not updated yet) — acceptable. Fix any other errors.

- [ ] **Step 5: Commit**

  ```bash
  git -C /Users/lukash0915/Vertex-Project/vertex-erp add src/components/layout/command-palette.tsx && \
  git -C /Users/lukash0915/Vertex-Project/vertex-erp commit -m "$(cat <<'EOF'
  feat(erp): add modules prop to CommandPalette for permission-based filtering

  Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 3: Create `ErpShell` client component

**Files:**
- Create: `src/app/(erp)/erp-shell.tsx`

This is an extraction of today's `layout.tsx` body into a client component that accepts `filteredModules` as a prop.

- [ ] **Step 1: Create `src/app/(erp)/erp-shell.tsx`**

  ```tsx
  'use client';

  import { useState, useEffect } from 'react';
  import { Sidebar } from '@/components/layout/sidebar';
  import { Topbar } from '@/components/layout/topbar';
  import { CommandPalette } from '@/components/layout/command-palette';
  import { Breadcrumbs } from '@/components/layout/breadcrumbs';
  import type { ErpNavModule } from '@/components/layout/nav-data';

  interface ErpShellProps {
    filteredModules: ErpNavModule[];
    children: React.ReactNode;
  }

  export function ErpShell({ filteredModules, children }: ErpShellProps) {
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
      </div>
    );
  }
  ```

- [ ] **Step 2: Run TypeScript check**

  ```bash
  cd /Users/lukash0915/Vertex-Project/vertex-erp && npx tsc --noEmit
  ```

  Expected: no new errors from this file. The existing errors about `layout.tsx` still passing `NAV_MODULES`-based Sidebar/CommandPalette will resolve in Task 4.

- [ ] **Step 3: Commit**

  ```bash
  git -C /Users/lukash0915/Vertex-Project/vertex-erp add 'src/app/(erp)/erp-shell.tsx' && \
  git -C /Users/lukash0915/Vertex-Project/vertex-erp commit -m "$(cat <<'EOF'
  feat(erp): extract ErpShell client component from layout

  Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 4: Convert `layout.tsx` to server component

**Files:**
- Modify: `src/app/(erp)/layout.tsx`

Replace the entire file. The old client component becomes a server component that fetches permissions and renders `<ErpShell>`.

- [ ] **Step 1: Replace `src/app/(erp)/layout.tsx` entirely**

  ```tsx
  import { auth } from '@/lib/auth';
  import { listRolePermissions } from '@/lib/sheets';
  import { NAV_MODULES, type ErpNavModule } from '@/components/layout/nav-data';
  import { ErpShell } from './erp-shell';
  import type { AccessLevel } from '@/types';

  function filterModules(
    modules: ErpNavModule[],
    rolePerms: Record<string, AccessLevel>,
  ): ErpNavModule[] {
    return modules
      .map(mod => ({
        ...mod,
        categories: mod.categories.filter(
          cat => (rolePerms[cat.id] ?? 'none') !== 'none',
        ),
      }))
      .filter(mod => mod.categories.length > 0);
  }

  export default async function ErpLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    const roleId = session?.user?.roleId ?? '';

    const allPerms = await listRolePermissions();
    const rolePerms = allPerms[roleId] ?? {};
    const filteredModules = filterModules(NAV_MODULES, rolePerms);

    return <ErpShell filteredModules={filteredModules}>{children}</ErpShell>;
  }
  ```

- [ ] **Step 2: Run TypeScript check — expect clean**

  ```bash
  cd /Users/lukash0915/Vertex-Project/vertex-erp && npx tsc --noEmit
  ```

  Expected: **no errors**. All four files now agree on the `modules` prop shape.

- [ ] **Step 3: Commit**

  ```bash
  git -C /Users/lukash0915/Vertex-Project/vertex-erp add 'src/app/(erp)/layout.tsx' && \
  git -C /Users/lukash0915/Vertex-Project/vertex-erp commit -m "$(cat <<'EOF'
  feat(erp): filter sidebar by role permissions via server component layout

  Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 5: Build and deploy

**Files:** none

- [ ] **Step 1: Run production build**

  ```bash
  cd /Users/lukash0915/Vertex-Project/vertex-erp && npm run build
  ```

  Expected: clean build. `(erp)/layout` should appear as a server component (no `ƒ` marker — it's a layout, not a route). `(erp)/erp-shell` is client-only and doesn't appear separately.

- [ ] **Step 2: Deploy to production**

  ```bash
  cd /Users/lukash0915/Vertex-Project/vertex-erp && vercel --prod
  ```

  Expected: `READY`, aliased to `https://vertex-erp-rose.vercel.app`.

---

## Verification checklist (manual, after deploy)

Before marking Phase D done, verify these scenarios in the live app:

| Scenario | Expected |
|---|---|
| Log in as Administrator | All 4 module tabs + all 24 categories visible |
| Log in as Cashier | Only Sales + Accounts Receivable categories visible under Transactions; no other modules |
| Log in as Auditor | All 24 categories visible (Auditor has `view` on all) |
| Command palette search as Cashier | Results only include Sales and A/R items |
| Favorites of hidden category (set before permissions changed) | Favorite href still navigable directly; sidebar star badge just won't appear |
