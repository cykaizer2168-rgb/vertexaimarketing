# User Management Design — Phase B
**Date:** 2026-05-11
**Project:** Vertex ERP
**Scope:** `/users` page — list, add, edit, disable/enable users via Google Sheets

---

## Overview

Build the Manage Users page at `/users`. Administrators can view all users, add new ones (invite by email + assign role), edit existing users (name, role), and disable/enable accounts. "Delete" is a soft delete — it sets `status = 'disabled'`, never removes a row from the sheet.

---

## Goals

1. Administrator sees a searchable, filterable table of all ERP users.
2. Administrator can add a new user (email + name + role) — the added row makes that email eligible to log in.
3. Administrator can edit a user's name and role.
4. Administrator can disable (soft delete) or re-enable a user — toggling `status` between `active` and `disabled`.
5. Non-administrators are redirected away from this page and receive 403 from all API routes.

---

## Non-Goals (deferred)

- Branch and department assignment — columns don't exist in the sheet yet (Phase later)
- Email invitation notifications — adding a user just adds their row; no email is sent
- Bulk operations (bulk disable, bulk role change)
- Pagination — all users loaded at once (acceptable for SME scale)
- Password reset (Google OAuth only, no passwords)

---

## Data Layer

### Existing sheet: `erp_users`

Columns: `id | email | full_name | avatar_url | role_id | status | last_login | created_at`

No schema changes needed for Phase B.

### New Sheets helpers (added to `src/lib/sheets.ts`)

#### `listUsers(): Promise<ErpUser[]>`

1. Call `getSheetData('erp_users')` → raw user rows.
2. Call `getSheetData('erp_roles')` → raw role rows.
3. Build a `roleMap: Record<string, string>` from `role.id → role.role_name`.
4. Map each user row to `ErpUser`:
   - `id` = `row.id`
   - `email` = `row.email`
   - `fullName` = `row.full_name || null`
   - `avatarUrl` = `row.avatar_url || null`
   - `roleId` = `row.role_id`
   - `roleName` = `roleMap[row.role_id] ?? 'Unknown'`
   - `status` = `row.status as 'active' | 'disabled'`
   - `lastLogin` = `row.last_login || null`
   - `createdAt` = `row.created_at`
5. Return the mapped array.

#### `addUser(email: string, fullName: string, roleId: string): Promise<ErpUser>`

1. Call `getSheetData('erp_users')`. If any row has `row.email === email`, throw `Error('EMAIL_EXISTS')`.
2. Generate `id = 'usr-' + crypto.randomUUID().slice(0, 8)`.
3. Call `appendRow('erp_users', [id, email, fullName, '', roleId, 'active', '', new Date().toISOString()])`.
4. Fetch the role name: `findRoleById(roleId)`.
5. Return the constructed `ErpUser` object.

#### `updateUserById(id: string, fields: { fullName?: string; roleId?: string; status?: 'active' | 'disabled' }): Promise<void>`

1. Call `getSheetData('erp_users')`. Find the row where `row.id === id` and its index.
2. If not found, throw `Error('USER_NOT_FOUND')`.
3. Compute `rowIndex = idx + 2`.
4. For each provided field, call `updateRange` targeting the specific column:
   - `fullName` → column C: `erp_users!C${rowIndex}`
   - `roleId` → column E: `erp_users!E${rowIndex}`
   - `status` → column F: `erp_users!F${rowIndex}`
5. Only write columns for fields that are explicitly provided (partial update).

---

## API Routes

### `GET /api/users`
- Verify session via `auth()`. If `session.user.role !== 'Administrator'` → return `403`.
- Call `listUsers()`.
- Return `200` with `{ users: ErpUser[] }`.
- On error → return `500` with `{ error: 'Failed to load users' }`.

### `POST /api/users`
- Verify session. Non-admin → `403`.
- Parse body: `{ email: string, fullName: string, roleId: string }`.
- Validate: all three fields required; `email` must be a valid email format (regex check).
- Call `addUser(email, fullName, roleId)`.
- On `EMAIL_EXISTS` error → return `409` with `{ error: 'A user with this email already exists' }`.
- On success → return `201` with the new `ErpUser`.
- On other error → `500`.

### `PUT /api/users/[id]`
- Verify session. Non-admin → `403`.
- Parse body: `{ fullName?: string, roleId?: string, status?: 'active' | 'disabled' }`.
- At least one field must be provided, else return `400`.
- Call `updateUserById(id, fields)`.
- On `USER_NOT_FOUND` → return `404`.
- On success → return `200` with `{ ok: true }`.
- On other error → `500`.

---

## UI Components

### `src/app/(erp)/users/page.tsx` (server component)

1. Call `auth()`. If no session or `session.user.role !== 'Administrator'` → `redirect('/dashboard')`.
2. Call `listUsers()` and `getSheetData('erp_roles')` in parallel via `Promise.all`.
3. Map raw roles to `ErpRole[]`.
4. Render `<UsersClient initialUsers={users} roles={roles} />`.

### `src/app/(erp)/users/users-client.tsx` (client component)

**State:**
- `users: ErpUser[]` — starts from `initialUsers`, refreshed after mutations
- `search: string` — filters by name or email client-side
- `roleFilter: string` — `''` means all roles; otherwise filters by `roleId`
- `statusFilter: string` — `''` | `'active'` | `'disabled'`
- `addOpen: boolean` — controls Add User dialog
- `editTarget: ErpUser | null` — controls Edit User dialog (null = closed)
- `loading: boolean` — disables buttons during API calls

**Derived:**
```ts
const filtered = users
  .filter(u => !search || u.email.includes(search.toLowerCase()) || (u.fullName ?? '').toLowerCase().includes(search.toLowerCase()))
  .filter(u => !roleFilter || u.roleId === roleFilter)
  .filter(u => !statusFilter || u.status === statusFilter);
```

**`refreshUsers()` helper:**
```ts
async function refreshUsers() {
  const res = await fetch('/api/users');
  const data = await res.json();
  setUsers(data.users);
}
```
Called after every successful mutation.

**Table columns:**
| Column | Content |
|---|---|
| User | Avatar circle (initials) + full name + email |
| Role | Role name badge (slate background) |
| Status | `active` → green badge, `disabled` → red badge |
| Last Login | Formatted date, or `—` if never |
| Actions | Dropdown: Edit, Disable / Enable |

Avatar shows first two initials of `fullName` if `avatarUrl` is null.

**Add User dialog:**
- Fields: Email (text input), Full Name (text input), Role (select dropdown from `roles` prop)
- Submit: `POST /api/users` → on success close dialog + `refreshUsers()`
- Error: show inline error message (e.g., "Email already exists")

**Edit User dialog:**
- Pre-filled with `editTarget` values
- Fields: Full Name (text input), Role (select dropdown)
- Submit: `PUT /api/users/[editTarget.id]` → on success close dialog + `refreshUsers()`

**Disable/Enable action:**
- Single PUT call: `PUT /api/users/[id]` with `{ status: 'active' | 'disabled' }` (toggled)
- Inline loading state on the row while in flight
- No confirmation dialog — immediate toggle

---

## Authorization

| Layer | Check |
|---|---|
| Page (`page.tsx`) | `session.user.role !== 'Administrator'` → `redirect('/dashboard')` |
| `GET /api/users` | `session.user.role !== 'Administrator'` → `403` |
| `POST /api/users` | `session.user.role !== 'Administrator'` → `403` |
| `PUT /api/users/[id]` | `session.user.role !== 'Administrator'` → `403` |

---

## File Map

| File | Action |
|---|---|
| `src/lib/sheets.ts` | Add `listUsers`, `addUser`, `updateUserById` |
| `src/app/(erp)/users/page.tsx` | New — server component with auth guard |
| `src/app/(erp)/users/users-client.tsx` | New — full interactive UI |
| `src/app/api/users/route.ts` | New — GET + POST handlers |
| `src/app/api/users/[id]/route.ts` | New — PUT handler |

---

## Error States

| Scenario | Behaviour |
|---|---|
| Non-admin visits `/users` | Redirected to `/dashboard` |
| Non-admin calls any API route | `403 { error: 'Forbidden' }` |
| Adding duplicate email | `409`, inline error in Add dialog |
| Editing non-existent user | `404`, toast/alert in UI |
| Sheets API error | `500`, generic error shown |
| No users in sheet | Empty state: "No users found. Add your first user." |

---

## Out of Scope for This Phase

- Branch / department columns on user rows
- Email invitation sending
- Bulk operations
- Pagination
- Avatar image upload
- User activity / audit log display (Phase E)
