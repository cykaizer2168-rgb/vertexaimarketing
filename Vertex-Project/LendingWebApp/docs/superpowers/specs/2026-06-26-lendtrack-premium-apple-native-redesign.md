# LendTrack — Premium Apple-Native Redesign

**Date:** 2026-06-26
**Status:** Approved (design), pending implementation plan
**Target file:** `Vertex-Project/LendingWebApp/index.html` (single-file app: inline CSS + JS, Google Apps Script backend)

## Goal

Elevate LendTrack from a competent-but-default iOS-style web app into a polished, first-party-feeling Apple-native app, **and** restructure the dashboard into a daily action view. This is a **CSS + markup restyle, not a rewrite** — all data logic and backend wiring are preserved.

### Decisions locked during brainstorming
- **Scope:** Premium visual polish **+** UX restructure (not a full product rethink).
- **Aesthetic:** Crisp Apple-native — perfected iOS, not a fintech/editorial reskin.
- **Dashboard:** Reframe as a daily "Today's collection" action view (hero summary + due/overdue lists), not a stats wall.
- **Brand:** Keep the name **LendTrack**; replace the 💰 emoji with a custom SVG monogram mark.
- **Dark mode:** Included (`prefers-color-scheme`) — core to the Apple-native feel.
- **Tables on desktop:** Collapse to grouped lists on mobile; retain wider table/row layout on desktop.

## Hard Constraints (non-negotiable)

1. **Preserve every JS binding.** All element `id`s the script reads/writes must remain:
   dashboard — `d-active`, `d-total-loans`, `d-outstanding`, `d-today`, `d-total-collected`, `d-overdue`, `d-interest`, `d-interest-sub`, `d-recent-payments`, `d-overdue-list`, `d-repayment-overdue`, `d-repayment-overdue-count`;
   lists — `borrowers-list`, `loans-list`, `payments-list`, `borrower-search`, `loan-status-filter`.
2. **Preserve every handler.** `showSection`, `renderLoans`, `renderBorrowers`/`filterBorrowers`, `openAddBorrowerModal`, `openNewLoanModal`, `openNewPaymentModal`, `handleFab`, and all nav `data-section` wiring must keep working unchanged.
3. **No backend changes.** GAS endpoint, payload shapes, and `GAS_URL` are untouched.
4. **PWA/Capacitor safe.** Keep `viewport-fit=cover`, `env(safe-area-inset-*)` handling, manifest, and service worker behavior intact.

## Design Sections

### 1. Design language — token refresh (`:root`)
Apply changes primarily through CSS custom properties so they cascade:
- **Color:** Refined iOS system blue (`#0A84FF` family, light `#007AFF`) replacing raw `#2563EB`; iOS system semantic green/red/orange; grouped greys (`#F2F2F7` surface, `#FFFFFF` card, iOS separator greys).
- **Type:** SF Pro stack retained. iOS type scale — large-title (~34px) screen headers, headline/body/footnote steps. Large numerals use SF Pro with tightened tracking and tabular figures (`font-variant-numeric: tabular-nums`) so money columns align.
- **Materials:** `backdrop-filter` blur on topbar + bottom nav; hairline separators (`0.5px`); grouped-inset radii (`10–12px`).
- **Motion:** Spring-like `cubic-bezier` press/scale states; sheet-style modal transitions.

### 2. Brand mark
Custom inline SVG monogram: a rounded-square "app tile" containing a stylized **L / coin-arc** glyph in system blue. Replaces 💰 in topbar (`.topbar-brand-icon`) and sidebar (`.sidebar-brand`). Name "LendTrack" unchanged. The same glyph is the visual basis for app/PWA icons (icon regeneration is out of scope for this pass unless trivial).

### 3. Dashboard → daily action view
Reorder/restyle markup inside `#section-dashboard`, reusing all existing bindings:
1. **Hero summary card** — Outstanding receivable (`d-outstanding`) as the dominant figure; supporting row with Due today + Collected today (`d-today`).
2. **Secondary stat row** — Active (`d-active`), Overdue (`d-overdue`), Interest (`d-interest`) demoted to a compact 3-up grid.
3. **Due Today** + **Overdue** grouped-inset lists — the current three `<table>`s (`d-recent-payments`, `d-overdue-list`, `d-repayment-overdue`) render as native grouped rows on mobile (borrower • amount • chevron, tappable). Desktop keeps the wider table/row layout.
   - **Note:** rows are injected by JS as `innerHTML`. Restyle requires updating both the CSS **and** the JS row-template strings while keeping the same container `id`s and data. This is the one place markup changes reach into the script.

### 4. List screens (Borrowers / Loans / Payments)
Restyle `.row-cards` into grouped-inset lists: leading initials avatar, primary + secondary text, trailing value, chevron. Search/filter fields get iOS rounded-field treatment. Containers and handlers unchanged; JS row templates updated to emit the new row structure.

### 5. Components
Re-skin to match: buttons (filled/tinted/plain iOS styles), modals (sheet-style presentation), badges (tinted pill), FAB, bottom nav (blur + active-tint), empty/loading states.

### 6. Dark mode
`@media (prefers-color-scheme: dark)` overriding the `:root` tokens — true-black/elevated-grey surfaces, adjusted separators, system blue tuned for dark. Implemented at the token layer so components inherit it.

## Out of Scope
- New features, new screens, or new data fields.
- Backend/GAS changes.
- App icon asset regeneration (unless a trivial drop-in of the new mark).
- Renaming the product.

## Success Criteria
- App visually reads as a polished first-party iOS app in both light and dark mode.
- Dashboard opens to a daily action view (hero + due/overdue lists).
- All four screens load and render live GAS data exactly as before.
- All existing handlers/IDs verified intact; no regression in PWA/safe-area/bottom-nav behavior.
