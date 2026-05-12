# Sidebar Filtering Design — Phase D
**Date:** 2026-05-12
**Project:** Vertex ERP
**Scope:** Filter the sidebar and command palette based on the logged-in user's role permissions

---

## Overview

When a user logs in, the sidebar should only show nav categories their role has access to (`full`, `edit`, or `view`). Categories with `none` access (or absent from the permissions sheet) are hidden entirely. Module tabs with zero visible categories are also hidden. This is display-only filtering — no route-level protection is added.

---

## Goals

1. Sidebar shows only categories the current user's role can access.
2. Module tabs with no accessible categories are hidden.
3. Command palette search results respect the same filtering.
4. Administrators see everything (all 24 categories).
5. No flash of unfiltered content — permissions resolved server-side before render.

---

## Non-Goals

- Route-level access protection (e.g., redirect when navigating directly to a restricted URL) — deferred to Phase E or later.
- Per-nav-item (sub-category) granularity — filtering is at the category level only.
- Caching or memoizing the permissions fetch across requests.

---

## Architecture

### Approach: Server component layout + client shell

`layout.tsx` becomes a server component. It fetches permissions and passes filtered modules to a new `ErpShell` client component that handles all interactive state.

**Data flow:**
1. `layout.tsx` (server) calls `auth()` → gets `session.user.roleId`
2. Calls `listRolePermissions()` → gets `Record<string, Record<string, AccessLevel>>`
3. Extracts `permissions[roleId] ?? {}` — the current user's category permission map
4. Calls `filterModules(NAV_MODULES, rolePerms)` → `ErpNavModule[]` with inaccessible categories removed
5. Renders `<ErpShell filteredModules={filtered}>{children}</ErpShell>`
6. `ErpShell` passes `filteredModules` to `<Sidebar>` and `<CommandPalette>`

---

## Filtering Logic

```ts
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
```

- `full`, `edit`, `view` → category visible in sidebar
- `none` or absent → category hidden
- Module with zero visible categories → module tab hidden
- Favorites and Recents sections use the full unfiltered `NAV_MODULES` for href tracking (only the rendered category list is filtered)

---

## File Map

| File | Action | Change |
|---|---|---|
| `src/app/(erp)/layout.tsx` | Modify | Convert to server component; add `filterModules`; render `<ErpShell>` |
| `src/app/(erp)/erp-shell.tsx` | Create | Client component — extracted interactive state from old layout |
| `src/components/layout/sidebar.tsx` | Modify | Accept `modules: ErpNavModule[]` prop; use it for category rendering and `flattenNav`/`findByHref` |
| `src/components/layout/command-palette.tsx` | Modify | Accept `modules: ErpNavModule[]` prop; use it for search results |

---

## Component Details

### `layout.tsx` (server component)

```tsx
import { auth } from '@/lib/auth';
import { listRolePermissions } from '@/lib/sheets';
import { NAV_MODULES } from '@/components/layout/nav-data';
import { ErpShell } from './erp-shell';
import type { AccessLevel } from '@/types';
import type { ErpNavModule } from '@/components/layout/nav-data';

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

### `erp-shell.tsx` (new client component)

Exact extract of today's `layout.tsx` body, with:
- `'use client'` directive
- Prop: `filteredModules: ErpNavModule[]`
- Passes `filteredModules` to `<Sidebar modules={filteredModules}>` and `<CommandPalette modules={filteredModules}>`
- Default `activeModule` state initialises to `filteredModules[0]?.id ?? 'transactions'` so a stored localStorage value pointing to a now-hidden module doesn't leave the sidebar showing an empty panel

### `sidebar.tsx` changes

Add `modules` prop to `SidebarProps`:
```ts
interface SidebarProps {
  modules: ErpNavModule[];
  // ...existing props
}
```

Replace all internal uses of `NAV_MODULES` for rendering with the `modules` prop:
- `flattenNav(modules)` (for favorites filtering)
- `currentModule = modules.find(...)` (active module lookup)
- Module tab rendering loop uses `modules`

Keep `NAV_MODULES` for recents tracking (`findByHref(pathname, NAV_MODULES)` and `flattenNav(NAV_MODULES)`) — recents record all visited hrefs, not just accessible ones.

### `command-palette.tsx` changes

Add `modules: ErpNavModule[]` prop. Replace `flattenNav(NAV_MODULES)` with `flattenNav(modules)` for the searchable items list.

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| `auth()` returns no session | `roleId` defaults to `''`; `rolePerms` defaults to `{}`; all categories hidden (user sees empty sidebar — this shouldn't happen as login redirects unauthenticated users) |
| `listRolePermissions()` throws | Let the error propagate — Next.js will render the error boundary. The layout failing is a fatal error. |
| Role has no rows in `erp_role_permissions` | `rolePerms` is `{}`; all categories treated as `none` and hidden |
| Administrator role | Seed data gives `full` to all 24 categories — sidebar shows everything |
