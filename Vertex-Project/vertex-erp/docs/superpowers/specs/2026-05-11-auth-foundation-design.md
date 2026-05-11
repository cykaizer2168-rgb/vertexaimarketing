# Auth Foundation Design — Phase A
**Date:** 2026-05-11
**Project:** Vertex ERP
**Scope:** Database setup, invite-only auth, role-enriched session

---

## Overview

Extend the existing NextAuth v5 + Google OAuth implementation to enforce invite-only access and attach a role to every authenticated session. No user management UI or permissions matrix in this phase — those are Phases B and C.

---

## Goals

1. Block any Google account not pre-added in the database from logging in.
2. Attach `role`, `roleId`, and `dbUserId` to the NextAuth session/JWT so all downstream code can read them without a DB round-trip.
3. Seed the database with 10 default roles and the super admin account.

---

## Non-Goals (deferred to later phases)

- User management UI (`/users` page) — Phase B
- Role & permissions matrix UI (`/roles` page) — Phase C
- Dynamic sidebar filtering by role — Phase D
- Audit log page — Phase E
- Row-level security policies in Supabase — Phase D
- Multi-branch / multi-department fields on users — Phase B

---

## Database Schema

### Table: `roles`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `role_name` | `text` NOT NULL UNIQUE | e.g. "Administrator" |
| `description` | `text` | Human-readable description |
| `is_system_role` | `boolean` DEFAULT false | System roles cannot be deleted |
| `created_at` | `timestamptz` DEFAULT now() | |

### Table: `users`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `email` | `text` NOT NULL UNIQUE | Must match Google account email exactly |
| `full_name` | `text` | Populated from Google profile on first login |
| `avatar_url` | `text` | Populated from Google profile on first login |
| `role_id` | `uuid` FK → `roles.id` | Assigned by admin when adding the user |
| `status` | `text` NOT NULL DEFAULT 'active' | `'active'` or `'disabled'` |
| `last_login` | `timestamptz` | Updated on every successful sign-in |
| `created_at` | `timestamptz` DEFAULT now() | |

### Seed Data

**Default roles** (all marked `is_system_role = true` except custom-created ones):

1. Administrator — Full system access
2. Accountant — Financial and accounting modules
3. Cashier — POS and payments only
4. Purchasing Officer — Purchase orders and suppliers
5. Inventory Staff — Inventory management
6. Sales Staff — Sales orders and CRM
7. HR Manager — HR and payroll modules
8. Branch Manager — Branch-level operations
9. Auditor — Read-only across all modules
10. Viewer — Dashboard and reports only

**Super admin user:**
- Email: `cykaizer2168@gmail.com`
- Role: Administrator
- Status: active
- `full_name` and `avatar_url` are null at seed time — populated on first Google sign-in.

---

## Auth Flow

### Sign-in Callback

On every Google OAuth sign-in attempt:

1. Query `users` table WHERE `email = signingInEmail`.
2. If no row found → return `false`. NextAuth redirects to `/login?error=AccessDenied`.
3. If row found but `status = 'disabled'` → return `false`. Same redirect.
4. If row found and `status = 'active'` → return `true`, proceed.

The login page reads `?error=AccessDenied` from the URL and renders:
> "Your account is not authorized to access Vertex ERP. Please contact your administrator."

### JWT Callback

Runs after successful sign-in and on every token refresh:

1. On first sign-in (`user` object is present in callback args): fetch the full user row from Supabase including `role_id` and join to `roles.role_name`.
2. Attach to token: `dbUserId`, `roleId`, `role` (role_name string).
3. Update `last_login = now()` in the users table.
4. On subsequent calls (token refresh, no `user` object): pass token through unchanged.

### Session Callback

Pass `dbUserId`, `roleId`, and `role` from the JWT token into `session.user` so client components can read them.

---

## TypeScript Types

### `src/types/next-auth.d.ts` (new)

Extend NextAuth's `Session` and `JWT` interfaces:

```ts
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;        // role_name e.g. "Administrator"
      roleId: string;      // roles.id UUID
      dbUserId: string;    // users.id UUID
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

### `src/types/index.ts` updates

Replace the stub `User` type with:

```ts
export interface ErpUser {
  id: string;           // users.id
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  roleId: string;
  roleName: string;
  status: 'active' | 'disabled';
  lastLogin: string | null;
  createdAt: string;
}
```

---

## New Files

| File | Purpose |
|---|---|
| `src/lib/supabase.ts` | Server-side Supabase client (service role key). Used in auth callbacks and API routes. |
| `src/types/next-auth.d.ts` | Extends NextAuth Session + JWT with role fields. |
| `supabase/migrations/001_init.sql` | Creates `roles` and `users` tables. |
| `supabase/seed.sql` | Inserts 10 default roles + super admin row. |

---

## Modified Files

| File | Change |
|---|---|
| `src/lib/auth.ts` | Add `signIn`, updated `jwt`, updated `session` callbacks. |
| `src/types/index.ts` | Replace stub `User` type with `ErpUser`. |

---

## Environment Variables Required

```
SUPABASE_URL=               # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=  # Service role key (server-side only, never expose to client)
```

These go in `.env.local` (local) and Vercel environment variables (production).

---

## Supabase Client

`src/lib/supabase.ts` creates a server-side client using `@supabase/supabase-js` with the service role key. This client bypasses Row Level Security and is used exclusively in server-side code (auth callbacks, API routes). It is never imported in client components.

---

## Error States

| Scenario | Behaviour |
|---|---|
| Email not in users table | Sign-in blocked, login page shows "not authorized" message |
| User status = disabled | Sign-in blocked, same message |
| Supabase unreachable during sign-in | Sign-in blocked with generic error, logged to console |
| Role row missing (orphaned role_id) | Sign-in proceeds, `role` defaults to `"Unknown"`, `roleId` to empty string |

---

## Out of Scope for This Phase

- No RLS policies (added in Phase D when we know the full permission model)
- No `branch_id`, `department_id` columns on users (added in Phase B)
- No `permissions` or `role_permissions` tables (Phase C)
- No `navigation_items` table (Phase D)
- No `user_audit_logs` table (Phase E)
- No admin UI to add/edit users (Phase B)
