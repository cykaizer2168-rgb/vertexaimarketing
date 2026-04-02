# Sidebar Navigation Design

**Date:** 2026-04-02  
**Status:** Approved  
**Scope:** Replace the top header with a CRM-style sidebar layout. No changes to page logic, routing, or Supabase queries.

---

## Overview

Replace the existing sticky top header (`Header.jsx`) with a fixed left sidebar + thin top bar layout. A new `AppLayout` component wraps all authenticated pages. The four page files lose only their `<Header />` import and usage — all other logic is untouched.

---

## File Changes

### New
- `src/components/AppLayout.jsx` — sidebar + top bar shell, owns all nav/layout state

### Modified
- `src/App.jsx` — wrap the 4 protected routes in `<AppLayout>`
- `src/pages/Dashboard.jsx` — remove `import Header` + `<Header />`
- `src/pages/AdminUsers.jsx` — remove `import Header` + `<Header />`
- `src/pages/CostControl.jsx` — remove `import Header` + `<Header />`
- `src/pages/QuoteHistory.jsx` — remove `import Header` + `<Header />`
- `src/index.css` — add sidebar layout keyframes and utility rules

### Deleted
- `src/components/Header.jsx`

---

## AppLayout Component

### State
| State | Type | Persisted | Default |
|---|---|---|---|
| `collapsed` | boolean | `localStorage` key `solar_sidebar_collapsed` | `false` |
| `mobileOpen` | boolean | — | `false` |
| `showApiInput` | boolean | — | `false` |
| `apiKey` | string | `localStorage` key `solar_openai_key` | `''` |
| `showKey` | boolean | — | `false` |
| `theme` | string | `localStorage` key `solar_theme` | `'dark'` |

All state from `Header.jsx` migrates directly into `AppLayout.jsx`. No new state is introduced.

### Props
```jsx
<AppLayout>
  {children}   // the page component
</AppLayout>
```

### Role-based nav filtering
Identical logic to the current `Header.jsx`: `navLinks` array filtered by `role` from `useAuth()`.

---

## Sidebar Structure (Desktop, Expanded — 220px)

```
┌── ☀  SolarQuote PH ──────────────┐
│   [role badge]                    │
├───────────────────────────────────┤
│ ⊞  Dashboard          /dashboard  │  all roles
│ 📄 My Quotes          /quotes     │  all roles
│ · · · · · · · · · · · · · · · ·  │  divider (estimator+ only)
│ 📊 Cost Control    /cost-control  │  estimator, admin
│ 📦 Inventory        /inventory   │  estimator, admin — disabled, "Soon" pill
│ · · · · · · · · · · · · · · · ·  │  divider (admin only)
│ 👥 Users           /admin/users  │  admin
│ 📈 Analytics   /admin/analytics  │  admin — disabled, "Soon" pill
├───────────────────────────────────┤
│ 🔑  API Key                       │  click → inline input expands above
│ 🌙  Theme toggle                  │
├───────────────────────────────────┤
│ [avatar]  Display Name            │
│           email                   │
│ [Sign out button]                 │
│ [« Collapse toggle]               │
└───────────────────────────────────┘
```

**Placeholder items** (Inventory, Analytics): rendered in the nav list with `cursor: default`, reduced opacity (0.45), no `NavLink` — just a `<div>`. A small amber "Soon" pill sits to the right of the label. Section dividers only render when the user's role grants access to at least one item in that section.

**Sidebar background:** Always `#0a1628` regardless of app light/dark theme. This is intentional — content area follows the theme; sidebar stays dark.

---

## Sidebar Structure (Desktop, Collapsed — 60px)

- Icons only; labels hidden
- Active item: amber icon, subtle amber background
- Hover: tooltip showing item name (CSS `title` attribute or custom tooltip `<span>`)
- Collapse toggle: chevron icon at the bottom of the sidebar, rotates on state change
- Logo area: sun icon only (no text)
- Profile area: avatar only (no name/email)

---

## Top Bar (48px, sticky)

### Desktop
```
[ Current page title (derived from route) ]  ────  [ 🔑 ] [ 🌙 ] [ avatar ]
```

Page title map:
| Route | Title |
|---|---|
| `/dashboard` | Dashboard |
| `/quotes` | My Quotes |
| `/cost-control` | Cost Control |
| `/admin/users` | Users |
| `/admin/analytics` | Analytics |

### Mobile (< 768px)
```
[ ☰ hamburger ]  ☀ SolarQuote PH  ────  [ avatar ]
```
Hamburger tap → opens mobile sidebar drawer. Avatar tap → sign out dropdown (same as existing header dropdown).

---

## Mobile Behavior (< 768px)

### Sidebar drawer
- Fixed position, `translateX(-100%)` when closed, `translateX(0)` when open
- Width: 280px
- Semi-transparent dark overlay behind it (`rgba(0,0,0,0.6)`)
- Tap overlay or a nav item → closes drawer
- Contains the full sidebar (logo, nav items, bottom section)

### Bottom tab bar
Fixed at bottom, height 56px, background `var(--surface)`, border-top `1px solid var(--border)`. Role-dependent items:

| Tab | Route | Roles |
|---|---|---|
| ⊞ Home | `/dashboard` | all |
| 📄 Quotes | `/quotes` | all |
| 📊 Costs | `/cost-control` | estimator, admin |
| 👥 Users | `/admin/users` | admin |
| ☰ More | — (opens drawer) | all |

Max 5 tabs. "More" always present. If role doesn't show Costs or Users, those tabs are omitted and "More" shifts left.

Page content gets `padding-bottom: 56px` on mobile so nothing is hidden behind the tab bar.

---

## Layout CSS

```
┌─[sidebar: fixed, 220px or 60px]─┬─[main: margin-left matches sidebar width]─┐
│                                   │  [topbar: sticky, 48px]                   │
│                                   │  [page content scrolls]                   │
└───────────────────────────────────┴───────────────────────────────────────────┘
```

- Sidebar: `position: fixed; top: 0; left: 0; bottom: 0; width: 220px; z-index: 40; transition: width 0.2s ease`
- Main: `margin-left: 220px; transition: margin-left 0.2s ease`
- Collapsed overrides: sidebar `width: 60px`, main `margin-left: 60px`
- Mobile overrides (media `max-width: 767px`): sidebar `transform: translateX(-100%)`, main `margin-left: 0`

New CSS added to `index.css` stays in its own clearly-labelled block. No existing rules are modified.

---

## Active Nav State

```css
/* Active item */
border-left: 2px solid var(--amber);
background: var(--amber-bg);
color: var(--amber);

/* Hover (non-active) */
background: var(--surface2);
color: var(--text);
```

Implemented via `NavLink`'s `style={({ isActive }) => ...}` pattern, identical to the current header.

---

## API Key Panel (Sidebar)

Clicking the 🔑 icon in the sidebar bottom section toggles an inline input that slides open **above** the icon row within the sidebar. Same input/validation logic as the current header panel. In collapsed mode, clicking the 🔑 icon temporarily expands the sidebar to show the input.

---

## Constraints

- **No changes** to page components beyond removing `<Header />` (one import + one JSX tag per page)
- **No changes** to routing, Supabase queries, auth logic, or existing CSS variables
- **No new dependencies** — pure React + inline styles + the existing CSS file
- `Pending.jsx`, `Blocked.jsx`, `Login.jsx`, `AuthCallback.jsx` do **not** get `AppLayout` — they already have no header and should stay full-screen
