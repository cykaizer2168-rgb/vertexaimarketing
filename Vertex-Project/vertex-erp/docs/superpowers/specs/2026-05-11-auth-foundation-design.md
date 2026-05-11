# Auth Foundation Design — Phase A
**Date:** 2026-05-11
**Project:** Vertex ERP
**Scope:** Google Sheets as database, invite-only auth, role-enriched session

---

## Overview

Extend the existing NextAuth v5 + Google OAuth implementation to enforce invite-only access and attach a role to every authenticated session. The persistence layer is Google Sheets (using the existing `googleapis` service account setup in `src/lib/sheets.ts`). No Supabase needed.

---

## Goals

1. Block any Google account not pre-added in the spreadsheet from logging in.
2. Attach `role`, `roleId`, and `dbUserId` to the NextAuth session/JWT so all downstream code can read them without a Sheets round-trip.
3. Seed the spreadsheet with 10 default roles and the super admin row.

---

## Non-Goals (deferred to later phases)

- User management UI (`/users` page) — Phase B
- Role & permissions matrix UI (`/roles` page) — Phase C
- Dynamic sidebar filtering by role — Phase D
- Audit log page — Phase E
- Multi-branch / multi-department fields on users — Phase B

---

## Database: Google Sheets

Uses the existing `GOOGLE_SHEETS_ID` spreadsheet. Two new tabs are added manually before first deploy.

### Sheet: `erp_roles`

| Column | Example value | Notes |
|---|---|---|
| `id` | `role-administrator` | Stable slug, used as foreign key |
| `role_name` | `Administrator` | Display name |
| `description` | `Full system access` | |
| `is_system_role` | `true` | System roles cannot be deleted |
| `created_at` | `2026-05-11T00:00:00Z` | ISO string |

### Sheet: `erp_users`

| Column | Example value | Notes |
|---|---|---|
| `id` | `usr-cykaizer2168` | Stable slug or short UUID |
| `email` | `cykaizer2168@gmail.com` | Must match Google account email exactly — primary lookup key |
| `full_name` | `Admin` | Updated from Google profile on first login |
| `avatar_url` | _(blank)_ | Updated from Google profile on first login |
| `role_id` | `role-administrator` | FK → `erp_roles.id` |
| `status` | `active` | `active` or `disabled` |
| `last_login` | _(blank)_ | Updated on every successful sign-in |
| `created_at` | `2026-05-11T00:00:00Z` | ISO string |

### Seed Rows

**`erp_roles` initial data (10 rows):**

| id | role_name | description | is_system_role |
|---|---|---|---|
| role-administrator | Administrator | Full system access | true |
| role-accountant | Accountant | Financial and accounting modules | true |
| role-cashier | Cashier | POS and payments only | true |
| role-purchasing | Purchasing Officer | Purchase orders and suppliers | true |
| role-inventory | Inventory Staff | Inventory management | true |
| role-sales | Sales Staff | Sales orders and CRM | true |
| role-hr | HR Manager | HR and payroll modules | true |
| role-branch-manager | Branch Manager | Branch-level operations | true |
| role-auditor | Auditor | Read-only across all modules | true |
| role-viewer | Viewer | Dashboard and reports only | true |

**`erp_users` initial data (1 row):**

| id | email | full_name | avatar_url | role_id | status | last_login | created_at |
|---|---|---|---|---|---|---|---|
| usr-admin | cykaizer2168@gmail.com | _(blank)_ | _(blank)_ | role-administrator | active | _(blank)_ | 2026-05-11T00:00:00Z |

`full_name` and `avatar_url` are blank at seed time — populated on first Google sign-in.

---

## Sheets Helper Functions (extends `src/lib/sheets.ts`)

Four new functions added to the existing file:

### `findUserByEmail(email: string)`
Calls `getSheetData('erp_users')`, finds the row where `row.email === email`. Returns `{ rowIndex, user }` where `rowIndex` is the 1-based row number in the sheet (header = row 1, first data row = row 2). Returns `null` if not found.

### `findRoleById(roleId: string)`
Calls `getSheetData('erp_roles')`, finds the row where `row.id === roleId`. Returns the role object or `null`.

### `updateUserLastLogin(rowIndex: number, isoTimestamp: string)`
Calls `updateRow('erp_users', rowIndex, ...)` to write the timestamp into the `last_login` column for that row. Only overwrites the `last_login` cell, preserving all other columns.

### `updateUserProfile(rowIndex: number, fullName: string, avatarUrl: string)`
Calls `updateRow('erp_users', rowIndex, ...)` to write `full_name` and `avatar_url` from the Google profile. Only runs when those cells are currently blank (first login).

---

## Auth Flow

### Sign-in Callback

On every Google OAuth sign-in attempt:

1. Call `findUserByEmail(email)`.
2. If `null` → return `false`. NextAuth redirects to `/login?error=AccessDenied`.
3. If found but `status === 'disabled'` → return `false`. Same redirect.
4. If found and `status === 'active'` → return `true`, proceed.

The login page reads `?error=AccessDenied` from the URL search params and shows:
> "Your account is not authorized to access Vertex ERP. Please contact your administrator."

### JWT Callback

Runs after successful sign-in and on every token refresh:

1. When `user` object is present in callback args (first sign-in):
   - Call `findUserByEmail(email)` to get the user row and its `rowIndex`.
   - Call `findRoleById(user.role_id)` to get the role name.
   - Attach to token: `dbUserId`, `roleId`, `role` (role_name string).
   - Call `updateUserLastLogin(rowIndex, new Date().toISOString())`.
   - If `full_name` or `avatar_url` is blank, call `updateUserProfile(rowIndex, ...)`.
2. On subsequent token refreshes (no `user` object): pass token through unchanged.

### Session Callback

Pass `dbUserId`, `roleId`, and `role` from the JWT token into `session.user`.

---

## TypeScript Types

### `src/types/next-auth.d.ts` (new)

```ts
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;        // role_name e.g. "Administrator"
      roleId: string;      // erp_roles.id slug e.g. "role-administrator"
      dbUserId: string;    // erp_users.id
    }
  }
}
declare module '@auth/core/jwt' {
  interface JWT {
    role: string;
    roleId: string;
    dbUserId: string;
  }
}
```

### `src/types/index.ts` update

Replace the stub `User` type with:

```ts
export interface ErpUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  roleId: string;
  roleName: string;
  status: 'active' | 'disabled';
  lastLogin: string | null;
  createdAt: string;
}

export interface ErpRole {
  id: string;
  roleName: string;
  description: string;
  isSystemRole: boolean;
  createdAt: string;
}
```

---

## Files Changed / Created

| File | Action | Notes |
|---|---|---|
| `src/lib/sheets.ts` | Updated | Add 4 new helper functions |
| `src/lib/auth.ts` | Updated | Add `signIn`, updated `jwt`, updated `session` callbacks |
| `src/types/next-auth.d.ts` | New | Extend Session + JWT types |
| `src/types/index.ts` | Updated | Add `ErpUser`, `ErpRole` types |

No new environment variables — the existing `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, and `GOOGLE_SHEETS_ID` variables are reused.

---

## Setup Steps (manual, one-time)

Before running the app:

1. Open the Google Spreadsheet referenced by `GOOGLE_SHEETS_ID`.
2. Create a new tab named **`erp_roles`** with the header row and 10 seed rows above.
3. Create a new tab named **`erp_users`** with the header row and the super admin row above.
4. Ensure the service account email has **Editor** access to the spreadsheet.

---

## Error States

| Scenario | Behaviour |
|---|---|
| Email not in `erp_users` | Sign-in blocked, login page shows "not authorized" message |
| User `status = disabled` | Sign-in blocked, same message |
| Sheets API unreachable during sign-in | Sign-in blocked, generic error shown, error logged to console |
| `role_id` in user row doesn't match any role | Sign-in proceeds, `role` defaults to `"Unknown"`, `roleId` = the raw string |

---

## Out of Scope for This Phase

- No RLS (Sheets has no row-level security; access control is enforced at the application layer)
- No `branch_id`, `department_id` columns (added in Phase B)
- No permissions / navigation_items sheets (Phase C / D)
- No audit log sheet (Phase E)
- No admin UI to add/edit users (Phase B)
