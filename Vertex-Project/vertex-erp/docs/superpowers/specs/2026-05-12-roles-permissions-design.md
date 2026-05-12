# Roles & Permissions Design — Phase C
**Date:** 2026-05-12
**Project:** Vertex ERP
**Scope:** `/users/roles` page — manage access levels per role per nav category via Google Sheets

---

## Overview

Build the Roles & Permissions page at `/users/roles`. Administrators can assign one of four access levels (Full Permission, Edit, View, No Access) to each of the 23 nav categories for each of the 10 ERP roles. Data is stored in a new `erp_role_permissions` Google Sheet tab.

---

## Goals

1. Administrator sees a two-panel editor: role list on the left, permission editor on the right.
2. Selecting a role shows all 23 nav categories grouped by module, each with an access-level dropdown.
3. Administrator can change levels and save — saving replaces all permissions for that role atomically.
4. Non-administrators are redirected and receive 403 from all API routes.

---

## Non-Goals (deferred)

- Sidebar filtering based on permissions — Phase D
- Per-item (nav item level) granularity — only category-level in this phase
- Permission inheritance / role hierarchy
- Audit log of permission changes — Phase E

---

## Data Layer

### New Sheet: `erp_role_permissions`

| Column | Example | Notes |
|---|---|---|
| `role_id` | `role-accountant` | FK → `erp_roles.id` |
| `category_id` | `purchases` | Matches `ErpNavCategory.id` in `nav-data.ts` |
| `access_level` | `full` | `full` \| `edit` \| `view` only — no row = `none` |

**Key invariant:** `none` access is represented by the _absence_ of a row, not a stored value. Only `full`, `edit`, and `view` rows are persisted.

### The 23 Category IDs (from `nav-data.ts`)

**Transactions module:**
`purchases`, `item-receipt`, `ap-transactions`, `expenses`, `sales`, `ar-transactions`, `inventory-txn`, `financial-txn`

**Lists module:**
`relationships`, `accounting-list`, `inventory-list`, `fixed-assets`

**Reports module:**
`financial-reports`, `ar-reports`, `ap-reports`, `inventory-reports`, `tax-reports`, `hr-reports`, `ai-analytics`

**Setup module:**
`company`, `classification`, `users-roles`, `automation`, `integrations`

### Seed Defaults

| Role | Full | View | None (all others) |
|---|---|---|---|
| Administrator | all 23 | — | — |
| Accountant | ap-transactions, ar-transactions, financial-txn, accounting-list, fixed-assets, financial-reports, ar-reports, ap-reports, tax-reports | purchases, item-receipt, expenses, sales, inventory-txn, relationships, inventory-list, inventory-reports, ai-analytics | hr-reports, company, classification, users-roles, automation, integrations |
| Cashier | sales, ar-transactions | purchases, item-receipt | everything else |
| Purchasing Officer | purchases, item-receipt, ap-transactions | inventory-txn, inventory-list, ap-reports | everything else |
| Inventory Staff | inventory-txn, inventory-list | purchases, item-receipt | everything else |
| Sales Staff | sales, ar-transactions, relationships | inventory-txn, ar-reports | everything else |
| HR Manager | hr-reports | relationships | everything else |
| Branch Manager | sales, purchases | all reports, all lists | financial-txn, company, classification, users-roles, automation, integrations |
| Auditor | — | all 23 | — |
| Viewer | — | financial-reports, inventory-reports, ai-analytics | everything else |

---

## Type Definitions

### Add to `src/types/index.ts`

```ts
export type AccessLevel = 'full' | 'edit' | 'view' | 'none';

export interface CategoryPermission {
  categoryId: string;
  accessLevel: AccessLevel;
}
```

---

## Sheets Helpers (added to `src/lib/sheets.ts`)

### `listRolePermissions(): Promise<Record<string, Record<string, AccessLevel>>>`

1. Call `getSheetData('erp_role_permissions')`.
2. Build and return a nested map: `{ [roleId]: { [categoryId]: accessLevel } }`.
3. Categories with no row are absent from the map (callers treat absence as `'none'`).

### `setRolePermissions(roleId: string, perms: Record<string, AccessLevel>): Promise<void>`

1. Call `getSheetData('erp_role_permissions')` to get all rows with their indices.
2. Collect indices of all rows where `row.role_id === roleId`.
3. Delete those rows in reverse-index order (to avoid row-shift corruption) using `spreadsheets.batchUpdate` with `deleteDimension` requests (dimension: `ROWS`, each specifying the 0-based `startIndex` and `endIndex`).
4. For each entry in `perms` where `accessLevel !== 'none'`, call `appendRow('erp_role_permissions', [roleId, categoryId, accessLevel])`.

**Atomicity note:** Delete then append is not atomic on Sheets. Concurrent saves to the same role could interleave. Acceptable risk at SME scale — document with a comment.

---

## API Routes

### `GET /api/roles/permissions`

- Verify session. Non-admin → `403`.
- Call `listRolePermissions()`.
- Return `200` with `{ permissions: Record<string, Record<string, AccessLevel>> }`.
- On error → `500 { error: 'Failed to load permissions' }`.

### `PUT /api/roles/[roleId]/permissions`

- Verify session. Non-admin → `403`.
- Parse body: `{ permissions: Record<string, AccessLevel> }`.
- Validate: `permissions` must be a non-null object.
- Call `setRolePermissions(roleId, permissions)`.
- Return `200 { ok: true }`.
- On error → `500 { error: 'Failed to save permissions' }`.

---

## UI Components

### `src/app/(erp)/users/roles/page.tsx` (server component)

1. `auth()` — non-admin → `redirect('/dashboard')`.
2. `Promise.all([getSheetData('erp_roles'), listRolePermissions()])`.
3. Map role rows to `ErpRole[]`.
4. Render `<RolesClient roles={roles} initialPermissions={permissions} />`.

### `src/app/(erp)/users/roles/roles-client.tsx` (client component)

**State:**
- `selectedRoleId: string` — default to first role id
- `permissions: Record<string, Record<string, AccessLevel>>` — full map, updated after each save
- `draft: Record<string, AccessLevel>` — local edits for selected role
- `dirty: boolean` — true when draft differs from saved state (enables Save)
- `saving: boolean` — disables Save during request

**Derived:**
```ts
const savedForRole = permissions[selectedRoleId] ?? {};
const dirty = CATEGORY_IDS.some(id => (draft[id] ?? 'none') !== (savedForRole[id] ?? 'none'));
```

**`refreshPermissions()` helper:**
```ts
async function refreshPermissions() {
  const res = await fetch('/api/roles/permissions');
  const data = await res.json();
  setPermissions(data.permissions);
}
```

**Layout:**

```
┌─────────────────────────────────────────────────────────┐
│ Left panel (160px)   │ Right panel (flex-1)             │
│ ─────────────────    │ ────────────────────────────      │
│ Administrator  7/23  │ Administrator — Permissions [Save]│
│ Accountant    14/23  │                                   │
│ Cashier        2/23  │ TRANSACTIONS                      │
│ ...                  │ Purchases          [Full ▾]       │
│                      │ Item Receipt       [View ▾]       │
│                      │ Accounts Payable   [Full ▾]       │
│                      │ ...                               │
│                      │ REPORTS                           │
│                      │ Financial Reports  [Full ▾]       │
│                      │ ...                               │
└─────────────────────────────────────────────────────────┘
```

**Left panel:** 10 role rows. Selected role: blue left border + blue text. Each row shows `"N / 23"` badge where N = count of categories where the stored `access_level` is `full`, `edit`, or `view` (i.e. non-`none`).

**Right panel:**
- Header: role name + `Save` button (disabled when `!dirty || saving`)
- Module section headers (Transactions / Lists / Reports / Setup) as non-interactive dividers
- Each category row: category label + `<select>` with options: `Full Permission`, `Edit`, `View`, `No Access`
- Zebra striping, `text-[11px]`, `border-[#E5E7EB]` — matches `/users` aesthetic
- On role switch with unsaved changes: reset draft to saved state (no confirmation dialog)
- On Save success: inline `"Saved"` message for 2 seconds, then reset `dirty`
- On Save error: inline red error message

**`CATEGORY_IDS` constant** — ordered array of all 23 category IDs, defined at the top of `roles-client.tsx`:
```ts
const MODULES: { label: string; categories: { id: string; label: string }[] }[] = [
  { label: 'Transactions', categories: [
    { id: 'purchases',      label: 'Purchases' },
    { id: 'item-receipt',   label: 'Item Receipt' },
    { id: 'ap-transactions',label: 'Accounts Payable' },
    { id: 'expenses',       label: 'Expenses' },
    { id: 'sales',          label: 'Sales' },
    { id: 'ar-transactions',label: 'Accounts Receivable' },
    { id: 'inventory-txn',  label: 'Inventory' },
    { id: 'financial-txn',  label: 'Financial' },
  ]},
  { label: 'Lists', categories: [
    { id: 'relationships',  label: 'Relationship' },
    { id: 'accounting-list',label: 'Accounting' },
    { id: 'inventory-list', label: 'Inventory' },
    { id: 'fixed-assets',   label: 'Fixed Assets' },
  ]},
  { label: 'Reports', categories: [
    { id: 'financial-reports', label: 'Financial Reports' },
    { id: 'ar-reports',        label: 'A/R Reports' },
    { id: 'ap-reports',        label: 'A/P Reports' },
    { id: 'inventory-reports', label: 'Inventory Reports' },
    { id: 'tax-reports',       label: 'Tax Reports' },
    { id: 'hr-reports',        label: 'HR & Payroll' },
    { id: 'ai-analytics',      label: 'AI Analytics' },
  ]},
  { label: 'Setup', categories: [
    { id: 'company',       label: 'Company' },
    { id: 'classification',label: 'Classification' },
    { id: 'users-roles',   label: 'Users & Roles' },
    { id: 'automation',    label: 'Automation' },
    { id: 'integrations',  label: 'Integrations' },
  ]},
];
```

---

## Authorization

| Layer | Check |
|---|---|
| `page.tsx` | `session.user.role !== 'Administrator'` → `redirect('/dashboard')` |
| `GET /api/roles/permissions` | Non-admin → `403` |
| `PUT /api/roles/[roleId]/permissions` | Non-admin → `403` |

---

## File Map

| File | Action |
|---|---|
| `src/types/index.ts` | Add `AccessLevel`, `CategoryPermission` |
| `src/lib/sheets.ts` | Add `listRolePermissions`, `setRolePermissions` |
| `src/app/api/roles/permissions/route.ts` | New — GET handler |
| `src/app/api/roles/[roleId]/permissions/route.ts` | New — PUT handler |
| `src/app/(erp)/users/roles/page.tsx` | New — server component with auth guard |
| `src/app/(erp)/users/roles/roles-client.tsx` | New — two-panel interactive UI |

---

## Error States

| Scenario | Behaviour |
|---|---|
| Non-admin visits `/users/roles` | Redirected to `/dashboard` |
| Non-admin calls any API route | `403 { error: 'Forbidden' }` |
| Sheets API error on load | `500`, generic error in UI |
| Save fails | Inline red error in right panel, dirty state preserved |
| Switching roles with unsaved changes | Draft silently reset to saved state (no prompt) |

---

## Setup Steps (manual, one-time)

1. Open the Google Spreadsheet (`GOOGLE_SHEETS_ID`).
2. Create a tab named `erp_role_permissions` with header row: `role_id | category_id | access_level`.
3. Add seed rows per the defaults table above.
