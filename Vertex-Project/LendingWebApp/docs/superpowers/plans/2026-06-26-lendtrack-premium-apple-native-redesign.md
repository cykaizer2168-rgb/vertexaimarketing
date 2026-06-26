# LendTrack Premium Apple-Native Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the single-file LendTrack app (`Vertex-Project/LendingWebApp/index.html`) into a polished, first-party-feeling iOS app in light **and** dark mode, and restructure the dashboard into a daily action view — without changing any data logic or the Google Apps Script backend.

**Architecture:** Drive the visual change through the CSS `:root` token layer (one source of truth) plus a `prefers-color-scheme: dark` token override, so components inherit the new look. Convert the three dashboard `<table>`s into grouped-inset lists via responsive CSS only (JS untouched, all bindings preserved). The dashboard markup reorders into a hero summary + compact stat row, reusing every existing element `id`. The three list templates (`renderBorrowers`/`renderLoans`/`renderPayments`) get a small leading-initials-avatar addition via a shared helper.

**Tech Stack:** Plain HTML + inline CSS + vanilla JS (no build, no test runner, no framework). Backend is Google Apps Script via `api()`/`GAS_URL` — out of scope.

## Global Constraints

- **Single file only:** all edits are in `Vertex-Project/LendingWebApp/index.html`. No new files except the optional regenerated PWA icon (out of scope this pass).
- **Preserve every element `id` the script reads/writes** (each must appear exactly once in the DOM): `d-active`, `d-total-loans`, `d-outstanding`, `d-today`, `d-total-collected`, `d-overdue`, `d-interest`, `d-interest-sub`, `d-recent-payments`, `d-overdue-list`, `d-repayment-overdue`, `d-repayment-overdue-count`, `borrowers-list`, `loans-list`, `payments-list`, `borrower-search`, `loan-status-filter`, `topbar-title`, `loader-bar`, `fab`, `sidebar-desktop`.
- **Preserve every handler and `data-section`:** `showSection`, `renderLoans`, `renderBorrowers`, `filterBorrowers`, `renderPayments`, `loadDashboard`, `renderOverdueRepayments`, `refreshAll`, `handleFab`, `openAddBorrowerModal`, `openNewLoanModal`, `openNewPaymentModal`, and all `data-section="dashboard|borrowers|loans|payments"` attributes.
- **No backend/GAS changes.** Do not invent new data fields; only surface data already returned by `getDashboard` (`activeLoans`, `totalLoans`, `totalOutstanding`, `collectedToday`, `totalCollected`, `overdueLoans`, `totalInterestIncome`, `recentPayments[]`, `overdueList[]`).
- **PWA/Capacitor safe:** keep `viewport-fit=cover`, all `env(safe-area-inset-*)` rules, manifest link, and service worker registration intact.
- **Commit after each task** with the message shown in that task's final step.

## Binding-Preservation Gate (run after every task)

This is the automated regression check used in place of a test runner. Run from the project dir:

```bash
cd /Users/lukash0915/Vertex-Project/LendingWebApp
for id in d-active d-total-loans d-outstanding d-today d-total-collected d-overdue d-interest d-interest-sub d-recent-payments d-overdue-list d-repayment-overdue d-repayment-overdue-count borrowers-list loans-list payments-list borrower-search loan-status-filter topbar-title; do
  n=$(grep -c "id=\"$id\"" index.html); [ "$n" = "1" ] || echo "FAIL: $id appears $n times (expected 1)";
done; echo "binding check done"
```

Expected output: only `binding check done` (no `FAIL` lines).

## Visual Verification (run after every visual task)

```bash
cd /Users/lukash0915/Vertex-Project/LendingWebApp && python3 -m http.server 8765
```

Then open `http://localhost:8765/` in a browser. Because the live data needs the GAS backend (CORS), verify **layout/styling/dark-mode** visually; the lists may show "Loading…/empty" states locally — that is expected and fine. Toggle OS appearance (or DevTools → Rendering → "Emulate prefers-color-scheme") to check dark mode. Stop the server with Ctrl-C when done.

---

### Task 1: Design tokens + dark mode foundation

Rewrite the `:root` block to an iOS system palette and type scale, and add a `prefers-color-scheme: dark` override. This is the largest single visual lever; everything else inherits from it.

**Files:**
- Modify: `index.html` — the `:root { … }` block (currently lines 16–39) and add a new dark-mode block immediately after it.

**Interfaces:**
- Produces (CSS custom properties consumed by all later tasks): `--blue`, `--blue-d`, `--blue-50`, `--blue-100`, `--navy`, `--body`, `--muted`, `--border`, `--hairline`, `--card-border`, `--bg`, `--card`, `--green`, `--red`, `--orange`, `--radius`, `--radius-sm`, `--radius-lg`, `--shadow-sm`, `--shadow`, `--shadow-md`, `--bottom-nav-h`. Names are unchanged so existing rules keep working; only values change, plus new tokens `--card-2` (grouped-list inset surface), `--fill` (iOS tertiary fill), `--separator`.

- [ ] **Step 1: Replace the `:root` block**

Replace the existing `:root { … }` (lines 16–39) with:

```css
  :root {
    --blue:      #007AFF;   /* iOS system blue (light) */
    --blue-d:    #0A6CE0;
    --blue-50:   #EAF3FF;   /* tinted fill */
    --blue-100:  #D6E8FF;
    --navy:      #1C1C1E;   /* label */
    --body:      #3A3A3C;   /* secondary label */
    --muted:     #8E8E93;   /* tertiary label */
    --border:    #D1D1D6;   /* opaque separator */
    --hairline:  rgba(60,60,67,0.12);  /* iOS separator */
    --separator: rgba(60,60,67,0.18);
    --card-border: rgba(60,60,67,0.08);
    --bg:        #F2F2F7;   /* grouped background */
    --card:      #FFFFFF;
    --card-2:    #FFFFFF;
    --fill:      rgba(118,118,128,0.12); /* iOS tertiary fill */
    --green:     #34C759;
    --red:       #FF3B30;
    --orange:    #FF9500;
    --radius:    14px;
    --radius-sm: 10px;
    --radius-lg: 20px;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
    --shadow:    0 1px 3px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.05);
    --shadow-md: 0 6px 20px rgba(0,0,0,0.10);
    --bottom-nav-h: 64px;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --blue:      #0A84FF;   /* iOS system blue (dark) */
      --blue-d:    #409CFF;
      --blue-50:   rgba(10,132,255,0.16);
      --blue-100:  rgba(10,132,255,0.24);
      --navy:      #FFFFFF;
      --body:      #EBEBF5;
      --muted:     #98989F;
      --border:    rgba(84,84,88,0.65);
      --hairline:  rgba(84,84,88,0.55);
      --separator: rgba(84,84,88,0.65);
      --card-border: rgba(255,255,255,0.06);
      --bg:        #000000;   /* true black grouped bg */
      --card:      #1C1C1E;   /* elevated surface */
      --card-2:    #2C2C2E;
      --fill:      rgba(118,118,128,0.24);
      --green:     #30D158;
      --red:       #FF453A;
      --orange:    #FF9F0A;
      --shadow-sm: 0 1px 2px rgba(0,0,0,0.5);
      --shadow:    0 1px 3px rgba(0,0,0,0.5);
      --shadow-md: 0 6px 20px rgba(0,0,0,0.6);
    }
    /* Surfaces that were hard-coded white in light mode */
    .form-input, .form-select, .form-textarea,
    .pay-method-label { background: var(--card-2); }
    .search-wrap input:focus { background: var(--card-2); }
    .topbar { background: rgba(28,28,30,0.72); }
    .bottom-nav { background: rgba(28,28,30,0.72); }
  }
```

- [ ] **Step 2: Add tabular numerals to money figures**

In the `.stat-value` rule (currently line 89) add `font-variant-numeric: tabular-nums;` so columns of money align. Change the line to:

```css
  .stat-value { font-size: 26px; font-weight: 700; color: var(--navy); line-height: 1; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; }
```

- [ ] **Step 3: Run the binding-preservation gate**

Run the Binding-Preservation Gate command above. Expected: only `binding check done`, no `FAIL` lines.

- [ ] **Step 4: Visual check (light + dark)**

Serve and open per Visual Verification. Confirm: backgrounds are iOS grey (`#F2F2F7`), accents are iOS blue, and dark mode flips to black surfaces with white labels and no white "holes" (inputs, search, topbar, bottom nav all dark).

- [ ] **Step 5: Commit**

```bash
cd /Users/lukash0915/Vertex-Project/LendingWebApp
git add index.html
git commit -m "design(lending): iOS system token palette + dark mode foundation"
```

---

### Task 2: Custom brand mark (replace 💰 emoji)

Replace the 💰 emoji with an inline SVG monogram (rounded "app tile" + coin-arc/L glyph in system blue) in both the topbar and the desktop sidebar.

**Files:**
- Modify: `index.html` — topbar brand (lines 416–419) and sidebar brand (lines 382–385). Add one CSS rule near `.topbar-brand` (line 62).

**Interfaces:**
- Consumes: `--blue` token from Task 1.
- Produces: CSS class `.brand-mark` (the SVG sizing wrapper) reused in both locations.

- [ ] **Step 1: Add the `.brand-mark` CSS**

Immediately after the `.topbar-brand-icon` rule (line 63), add:

```css
  .brand-mark { width: 26px; height: 26px; flex-shrink: 0; display: block; }
  .sidebar-brand .brand-mark { width: 24px; height: 24px; }
```

- [ ] **Step 2: Replace the topbar emoji**

Replace the topbar brand block (lines 416–419):

```html
    <div class="topbar-brand">
      <span class="topbar-brand-icon">💰</span>
      <span class="topbar-brand-text">LendTrack</span>
    </div>
```

with:

```html
    <div class="topbar-brand">
      <svg class="brand-mark" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="28" height="28" rx="7" fill="var(--blue)"/>
        <path d="M10 7.5v11.5a1 1 0 0 0 1 1h6.5" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="18.5" cy="10.5" r="2.4" stroke="#fff" stroke-width="2.2"/>
      </svg>
      <span class="topbar-brand-text">LendTrack</span>
    </div>
```

- [ ] **Step 3: Replace the sidebar emoji**

Replace the sidebar brand block (lines 382–385):

```html
  <div class="sidebar-brand">
    <h1>💰 LendTrack</h1>
    <span>Lending Manager</span>
  </div>
```

with:

```html
  <div class="sidebar-brand">
    <h1 style="display:flex;align-items:center;gap:8px;">
      <svg class="brand-mark" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="28" height="28" rx="7" fill="var(--blue)"/>
        <path d="M10 7.5v11.5a1 1 0 0 0 1 1h6.5" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="18.5" cy="10.5" r="2.4" stroke="#fff" stroke-width="2.2"/>
      </svg>
      LendTrack
    </h1>
    <span>Lending Manager</span>
  </div>
```

- [ ] **Step 4: Confirm the emoji is gone**

```bash
cd /Users/lukash0915/Vertex-Project/LendingWebApp && grep -c "💰" index.html
```

Expected output: `0`.

- [ ] **Step 5: Visual check + commit**

Serve and confirm the blue rounded mark renders in the topbar (mobile) and sidebar (desktop ≥768px). Then:

```bash
git add index.html
git commit -m "design(lending): replace emoji brand with custom SVG monogram"
```

---

### Task 3: Core component restyle (Apple-native)

Refine buttons, badges, cards, search field, modal sheet, FAB, and bottom nav to native iOS proportions. Mostly token-driven CSS tweaks; no markup or JS changes.

**Files:**
- Modify: `index.html` CSS — `.card` (97), `.card-header` (102), `.btn`/`.btn-primary` (110–125), `.badge*` (157–165), `.search-wrap input` (255), `.fab` (284), `.bnav-item` (307), `.modal` (227).

**Interfaces:**
- Consumes: all Task 1 tokens (`--fill`, `--blue`, `--card`, `--separator`, etc.).
- Produces: no new selectors; refined values only.

- [ ] **Step 1: Soften cards and headers**

Replace `.card` (lines 97–101) and `.card-header` (102–106) with:

```css
  .card {
    background: var(--card); border-radius: var(--radius);
    border: 1px solid var(--card-border); box-shadow: var(--shadow-sm); overflow: hidden;
    margin-bottom: 16px;
  }
  .card-header {
    padding: 14px 18px 10px; border-bottom: 1px solid var(--hairline);
    display: flex; align-items: center; justify-content: space-between;
    gap: 10px; flex-wrap: wrap;
  }
  .card-title { font-size: 13px; font-weight: 600; color: var(--muted); letter-spacing: 0.01em; text-transform: uppercase; }
```

(The `.card-title` line replaces the existing one at line 107.)

- [ ] **Step 2: Native button styles**

Replace `.btn-primary` (120–121) and `.btn-ghost` (123) with iOS tinted styles:

```css
  .btn-primary { background: var(--blue); color: #fff; box-shadow: none; }
  .btn-primary:active { filter: brightness(0.92); }
  .btn-ghost   { background: var(--fill); color: var(--blue); }
```

- [ ] **Step 3: Tinted pill badges**

Replace the badge color rules (lines 161–165) with token-based tints that adapt to dark mode:

```css
  .badge-green  { background: color-mix(in srgb, var(--green) 16%, transparent); color: var(--green); }
  .badge-blue   { background: var(--blue-50); color: var(--blue); }
  .badge-red    { background: color-mix(in srgb, var(--red) 16%, transparent); color: var(--red); }
  .badge-orange { background: color-mix(in srgb, var(--orange) 18%, transparent); color: var(--orange); }
  .badge-grey   { background: var(--fill); color: var(--muted); }
```

- [ ] **Step 4: Search field + FAB + bottom nav polish**

Replace `.search-wrap input` (255–259) so it uses the `--fill` token (works in dark mode):

```css
  .search-wrap input {
    padding: 11px 12px 11px 38px; border: 1px solid transparent; border-radius: var(--radius-sm);
    font-size: 15px; outline: none; width: 100%; background: var(--fill);
    color: var(--navy); transition: background 0.15s, box-shadow 0.15s;
  }
```

Replace the `.fab` `box-shadow` (line 289) with a softer one:

```css
    box-shadow: 0 4px 16px rgba(0,0,0,0.18);
```

- [ ] **Step 5: Binding gate + visual check**

Run the Binding-Preservation Gate (expect no FAIL). Serve and confirm buttons/badges/search/cards look native in both light and dark mode.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "design(lending): native iOS buttons, badges, cards, search polish"
```

---

### Task 4: Grouped-inset lists + leading initials avatars

Restyle `.row-cards`/`.row-card` into grouped-inset list rows and add a leading initials avatar to borrower/loan/payment rows via a shared JS helper.

**Files:**
- Modify: `index.html` CSS — `.row-cards`/`.row-card*` (142–154); add `.row-avatar` rule.
- Modify: `index.html` JS — add `initials()` + `avatarHtml()` helpers; edit `renderBorrowers` (1113), `renderLoans` (1289–1296), `renderPayments` (1541–1548) to prepend the avatar.

**Interfaces:**
- Consumes: `--card`, `--fill`, `--blue`, `--separator` tokens.
- Produces (JS helpers, global scope, callable from any render function):
  - `initials(name: string): string` — returns 1–2 uppercase letters.
  - `avatarHtml(name: string): string` — returns `<div class="row-avatar">XX</div>`.

- [ ] **Step 1: Restyle row cards as grouped rows**

Replace `.row-card` (143–146) and add avatar styles. New block (replacing 143–149):

```css
  .row-card {
    padding: 12px 16px; border-bottom: 1px solid var(--hairline);
    display: flex; flex-direction: column; gap: 6px;
  }
  .row-card:last-child { border-bottom: none; }
  .row-card-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .row-card-name { font-size: 16px; font-weight: 600; color: var(--navy); letter-spacing: -0.01em; }
  .row-avatar {
    width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
    display: inline-flex; align-items: center; justify-content: center;
    background: var(--blue-50); color: var(--blue);
    font-size: 14px; font-weight: 700; letter-spacing: 0.01em; margin-right: 12px;
  }
  .row-card-head { display: flex; align-items: center; }
  .row-card-head .row-card-top { flex: 1; }
```

- [ ] **Step 2: Add the JS helpers**

Immediately before `function renderBorrowers()` (line 1099) insert:

```javascript
function initials(name) {
  const parts = String(name || '?').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function avatarHtml(name) {
  return `<div class="row-avatar">${initials(name)}</div>`;
}
```

- [ ] **Step 3: Add avatar to borrower rows**

In `renderBorrowers` (line 1113), replace:

```javascript
    return `<div class="row-card">
      <div class="row-card-top">
        <div class="row-card-name">${b.Name}</div>
```

with:

```javascript
    return `<div class="row-card">
      <div class="row-card-head">
      ${avatarHtml(b.Name)}
      <div class="row-card-top">
        <div class="row-card-name">${b.Name}</div>
```

Then, in the same template, close the new `row-card-head` wrapper: find the closing `</div>` that ends `row-card-top` (the line `</div>` immediately before `<div class="row-card-meta">` at line 1117) and change that single `</div>` to `</div></div>`.

- [ ] **Step 4: Add avatar to loan rows**

In `renderLoans` (line 1289), replace:

```javascript
    return `<div class="row-card">
      <div class="row-card-top">
        <div class="row-card-name">${l.BorrowerName}</div>
```

with:

```javascript
    return `<div class="row-card">
      <div class="row-card-head">
      ${avatarHtml(l.BorrowerName)}
      <div class="row-card-top">
        <div class="row-card-name">${l.BorrowerName}</div>
```

Then change the `</div>` that closes `row-card-top` (the line before `<div class="row-card-meta">` at line 1297) from `</div>` to `</div></div>`.

- [ ] **Step 5: Add avatar to payment rows**

In `renderPayments` (line 1541), replace:

```javascript
    return `<div class="row-card">
    <div class="row-card-top">
      <div style="display:flex;flex-direction:column;gap:3px;">
        <div class="row-card-name">${p.BorrowerName}</div>
```

with:

```javascript
    return `<div class="row-card">
    <div class="row-card-head">
    ${avatarHtml(p.BorrowerName)}
    <div class="row-card-top">
      <div style="display:flex;flex-direction:column;gap:3px;">
        <div class="row-card-name">${p.BorrowerName}</div>
```

Then change the `</div>` that closes this `row-card-top` (the line before `<div class="row-card-meta">` at line 1549) from `</div>` to `</div></div>`.

- [ ] **Step 6: Syntax + binding check**

Verify the template literals are still balanced (no stray backticks) and bindings survive:

```bash
cd /Users/lukash0915/Vertex-Project/LendingWebApp
node --check <(sed -n '/<script>/,/<\/script>/p' index.html | sed '1d;$d') 2>&1 | head -5 || echo "note: node --check on extracted script (ignore if no <script> wrapper match)"
```

Then run the Binding-Preservation Gate (expect no FAIL). If `node --check` reports a syntax error, fix the unbalanced `</div>`/backtick before continuing.

- [ ] **Step 7: Visual check + commit**

Serve; if you have backend access the lists show rows with a round blue initials avatar on the left. If running locally without backend, at minimum confirm no JS console errors on load. Then:

```bash
git add index.html
git commit -m "design(lending): grouped-inset list rows with initials avatars"
```

---

### Task 5: Dashboard → daily action view (hero + compact stats + grouped lists)

Restructure the dashboard markup into a hero summary card + compact 3-up stat row, reorder the activity tables (most-actionable first), and make the tables render as grouped-inset rows on mobile via responsive CSS. Reuse every existing `id`; do **not** touch `loadDashboard`/`renderOverdueRepayments` JS.

**Files:**
- Modify: `index.html` markup — `#section-dashboard` (lines 430–502).
- Modify: `index.html` CSS — add a dashboard hero block + responsive `table → grouped rows` rules (add near `.dash-bottom`, line 281).

**Interfaces:**
- Consumes: tokens from Task 1; reuses ids `d-outstanding`, `d-today`, `d-overdue`, `d-active`, `d-total-loans`, `d-interest`, `d-interest-sub`, `d-total-collected`, and tbody ids `d-repayment-overdue`, `d-overdue-list`, `d-recent-payments`, plus `d-repayment-overdue-count`.
- Produces: CSS classes `.dash-hero`, `.dash-hero-value`, `.dash-hero-row`, `.dash-stat-3`.

- [ ] **Step 1: Add dashboard CSS**

Immediately after the `.dash-bottom` rule (line 281), add:

```css
  /* ── DASHBOARD HERO ── */
  .dash-hero {
    background: var(--card); border-radius: var(--radius-lg);
    border: 1px solid var(--card-border); box-shadow: var(--shadow-sm);
    padding: 20px 20px 18px; margin-bottom: 14px;
  }
  .dash-hero-label { font-size: 13px; font-weight: 600; color: var(--muted); }
  .dash-hero-value {
    font-size: 40px; font-weight: 800; color: var(--navy); line-height: 1.05;
    letter-spacing: -0.04em; font-variant-numeric: tabular-nums; margin: 4px 0 14px;
  }
  .dash-hero-row { display: flex; gap: 10px; }
  .dash-hero-chip {
    flex: 1; background: var(--fill); border-radius: var(--radius-sm);
    padding: 10px 12px; display: flex; flex-direction: column; gap: 2px;
  }
  .dash-hero-chip .k { font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.03em; }
  .dash-hero-chip .v { font-size: 16px; font-weight: 700; color: var(--navy); font-variant-numeric: tabular-nums; }
  .dash-stat-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
  .dash-stat-3 .stat-card { padding: 14px; }
  .dash-stat-3 .stat-value { font-size: 20px; }

  /* ── DASHBOARD TABLE → GROUPED ROWS ON MOBILE ── */
  @media (max-width: 767px) {
    .dash-bottom table, .card > .table-wrap > table { display: block; }
    .dash-bottom thead, .card > .table-wrap > table thead { display: none; }
    .dash-bottom tbody, .card > .table-wrap > table tbody { display: block; }
    .dash-bottom tbody tr, .card > .table-wrap > table tbody tr {
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 4px 12px; padding: 12px 16px;
      border-bottom: 1px solid var(--hairline);
    }
    .dash-bottom tbody td, .card > .table-wrap > table tbody td {
      border: none; padding: 0; font-size: 14px;
    }
    .dash-bottom tbody td.td-name, .card > .table-wrap > table tbody td.td-name { flex: 1 1 100%; }
  }
```

- [ ] **Step 2: Replace the dashboard stats markup with hero + 3-up**

Replace the `<div class="stats-grid"> … </div>` block (lines 431–457) with:

```html
      <div class="dash-hero">
        <div class="dash-hero-label">Outstanding receivable</div>
        <div class="dash-hero-value" id="d-outstanding">—</div>
        <div class="dash-hero-row">
          <div class="dash-hero-chip"><span class="k">Collected today</span><span class="v" id="d-today">—</span></div>
          <div class="dash-hero-chip"><span class="k">Overdue</span><span class="v" id="d-overdue">—</span></div>
        </div>
      </div>

      <div class="dash-stat-3">
        <div class="stat-card blue">
          <div class="stat-label">Active Loans</div>
          <div class="stat-value" id="d-active">—</div>
          <div class="stat-sub" id="d-total-loans">— total loans</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Interest Income</div>
          <div class="stat-value" id="d-interest" style="color:var(--blue)">—</div>
          <div class="stat-sub" id="d-interest-sub">from all loans</div>
        </div>
        <div class="stat-card green">
          <div class="stat-label">Collected</div>
          <div class="stat-value" id="d-total-collected">—</div>
          <div class="stat-sub">all time</div>
        </div>
      </div>
```

Note: `d-total-collected` now lives in a `.stat-value`; `loadDashboard` sets its `textContent` to `peso(totalCollected) + ' total'`. Leave the JS as-is — the trailing " total" is acceptable; it reads fine as the stat value. (If undesired during review, the one-line JS change is `peso(res.totalCollected)` without `+ ' total'`, but that is optional and out of this task's required scope.)

- [ ] **Step 3: Reorder activity cards (most-actionable first)**

Currently the order is: `dash-bottom` (Recent Payments + Overdue Loans) then the standalone "Repayment Overdue" card (lines 480–501). Move the **Repayment Overdue** card (the whole `<div class="card" style="margin-top:20px;"> … </div>`, lines 480–501) to sit **immediately before** the `<div class="dash-bottom">` block (line 459), and remove its inline `style="margin-top:20px;"`. Result order: Repayment Overdue → (Recent Payments, Overdue Loans). Do not change any `id` or table structure inside the moved card.

- [ ] **Step 4: Binding gate**

Run the Binding-Preservation Gate. Expected: no FAIL (every id still appears exactly once — `d-outstanding`, `d-today`, `d-overdue` moved into the hero; `d-interest`/`d-total-collected`/`d-active` in the 3-up).

- [ ] **Step 5: Visual check (light + dark, mobile + desktop)**

Serve and open. Mobile (<768px): hero card with large Outstanding figure, two chips, a 3-up stat row, then Repayment-Overdue list rendering as grouped rows (no horizontal table). Desktop (≥768px): the `@media (min-width:768px)` rules still apply — `.dash-bottom` is a 2-col grid and tables keep table layout. Confirm dark mode looks right.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat(lending): dashboard daily-action view (hero + compact stats + grouped activity)"
```

---

### Task 6: Final verification + deploy

**Files:** none modified (verification + deploy only).

- [ ] **Step 1: Full binding + handler sweep**

Run the Binding-Preservation Gate, then verify handlers/sections are intact:

```bash
cd /Users/lukash0915/Vertex-Project/LendingWebApp
for fn in 'function renderBorrowers' 'function renderLoans' 'function renderPayments' 'function loadDashboard' 'function renderOverdueRepayments' 'function refreshAll' 'function showSection\|function showSection'; do :; done
for tok in 'data-section="dashboard"' 'data-section="borrowers"' 'data-section="loans"' 'data-section="payments"' 'viewport-fit=cover' 'serviceWorker' 'safe-area-inset'; do
  grep -q "$tok" index.html && echo "OK: $tok" || echo "MISSING: $tok";
done
```

Expected: all `OK:` lines, no `MISSING:`.

- [ ] **Step 2: Live-data smoke test**

Serve locally (or use a preview deploy if CORS blocks the GAS call) and confirm: dashboard hero populates with a real outstanding figure, each of the four tabs loads its data, dark mode renders, and the bottom nav still switches sections. If the GAS backend blocks `localhost` via CORS, deploy a Vercel **preview** first and test there.

- [ ] **Step 3: Deploy to production**

Deploy via the project's existing Vercel flow (this folder deploys independently). Use the Vercel deploy skill or:

```bash
cd /Users/lukash0915/Vertex-Project/LendingWebApp && vercel --prod
```

Confirm the production URL shows the redesign and live data loads. Report the deployed URL.

---

## Self-Review (completed during planning)

- **Spec coverage:** Design language → Task 1; dark mode → Task 1; brand mark → Task 2; components → Task 3; list screens (grouped lists + avatars) → Task 4; dashboard daily-action restructure + desktop-keeps-tables → Task 5; success-criteria verification + deploy → Task 6. All spec sections mapped.
- **Honest data note:** the spec's "Due today" hero figure does not exist in the `getDashboard` payload, so the hero surfaces **Outstanding** (big) with **Collected today** + **Overdue** as supporting chips — all real fields. No backend change, consistent with the "no invented data" constraint. Captured in Task 5 Step 2.
- **Binding safety:** every `id` is moved, never duplicated; the Binding-Preservation Gate runs after each task. Dashboard tables keep their JS templates untouched (responsive CSS only), eliminating the highest-risk edit.
- **Type/name consistency:** `initials()`/`avatarHtml()` defined in Task 4 Step 2 and consumed in Steps 3–5 with matching names; CSS classes (`.row-avatar`, `.dash-hero*`, `.dash-stat-3`) are defined before they are referenced.
