# Auth Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce invite-only Google OAuth login and attach a role (from Google Sheets) to every authenticated session in Vertex ERP.

**Architecture:** Two Google Sheets tabs (`erp_roles`, `erp_users`) serve as the user/role store. NextAuth v5's `signIn` callback rejects any email not found in `erp_users`. The `jwt` callback fetches the user's role and writes it to the token — so session consumers get `role`, `roleId`, and `dbUserId` without hitting Sheets again per request.

**Tech Stack:** Next.js 14 App Router, NextAuth v5 (beta), Google Sheets API v4 (`googleapis`), TypeScript strict mode, Tailwind CSS.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/types/next-auth.d.ts` | **Create** | Augments NextAuth `Session` + `JWT` interfaces with role fields |
| `src/types/index.ts` | **Modify** | Add `ErpUser` and `ErpRole` types; keep existing types |
| `src/lib/sheets.ts` | **Modify** | Add `updateRange`, `findUserByEmail`, `findRoleById`, `updateUserLastLogin`, `updateUserProfile` |
| `src/lib/auth.ts` | **Modify** | Add `signIn` callback; update `jwt` and `session` callbacks |
| `src/components/auth/login-form.tsx` | **Modify** | Accept `error` prop; show "not authorized" banner for `AccessDenied` |
| `src/app/(auth)/login/page.tsx` | **Modify** | Read `searchParams.error` and pass to `LoginForm` |

---

## Task 1: Create Google Sheet tabs (manual — no code)

**Files:** none

- [ ] **Step 1: Open the spreadsheet**

  Open the Google Spreadsheet referenced by your `GOOGLE_SHEETS_ID` env var.

- [ ] **Step 2: Create the `erp_roles` tab**

  Add a new sheet tab named exactly **`erp_roles`**. Row 1 is the header row. Paste these headers in A1–E1:

  ```
  id | role_name | description | is_system_role | created_at
  ```

  Then add these 10 data rows (A2–E11):

  ```
  role-administrator | Administrator    | Full system access               | true | 2026-05-11T00:00:00Z
  role-accountant    | Accountant       | Financial and accounting modules | true | 2026-05-11T00:00:00Z
  role-cashier       | Cashier          | POS and payments only            | true | 2026-05-11T00:00:00Z
  role-purchasing    | Purchasing Officer | Purchase orders and suppliers  | true | 2026-05-11T00:00:00Z
  role-inventory     | Inventory Staff  | Inventory management             | true | 2026-05-11T00:00:00Z
  role-sales         | Sales Staff      | Sales orders and CRM             | true | 2026-05-11T00:00:00Z
  role-hr            | HR Manager       | HR and payroll modules           | true | 2026-05-11T00:00:00Z
  role-branch-manager | Branch Manager  | Branch-level operations          | true | 2026-05-11T00:00:00Z
  role-auditor       | Auditor          | Read-only across all modules     | true | 2026-05-11T00:00:00Z
  role-viewer        | Viewer           | Dashboard and reports only       | true | 2026-05-11T00:00:00Z
  ```

- [ ] **Step 3: Create the `erp_users` tab**

  Add another new sheet tab named exactly **`erp_users`**. Paste these headers in A1–H1:

  ```
  id | email | full_name | avatar_url | role_id | status | last_login | created_at
  ```

  Add this 1 data row (A2–H2):

  ```
  usr-admin | cykaizer2168@gmail.com | (leave blank) | (leave blank) | role-administrator | active | (leave blank) | 2026-05-11T00:00:00Z
  ```

- [ ] **Step 4: Confirm service account access**

  Verify the service account email (value of `GOOGLE_SERVICE_ACCOUNT_EMAIL` env var) has **Editor** access to the spreadsheet. Share it if needed.

---

## Task 2: TypeScript type extensions

**Files:**
- Create: `src/types/next-auth.d.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Create `src/types/next-auth.d.ts`**

  ```ts
  import type { DefaultSession } from 'next-auth';

  declare module 'next-auth' {
    interface Session {
      user: {
        role: string;
        roleId: string;
        dbUserId: string;
      } & DefaultSession['user'];
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

- [ ] **Step 2: Update `src/types/index.ts`**

  Add these two interfaces after the existing exports (keep all existing types):

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

- [ ] **Step 3: Run TypeScript check**

  ```bash
  cd /Users/lukash0915/Vertex-Project/vertex-erp && npx tsc --noEmit
  ```

  Expected: no errors.

- [ ] **Step 4: Commit**

  ```bash
  git -C /Users/lukash0915 add \
    "Vertex-Project/vertex-erp/src/types/next-auth.d.ts" \
    "Vertex-Project/vertex-erp/src/types/index.ts" && \
  git -C /Users/lukash0915 commit -m "feat(erp): add NextAuth and ERP type extensions"
  ```

---

## Task 3: Extend sheets.ts with auth helpers

**Files:**
- Modify: `src/lib/sheets.ts`

The `erp_users` sheet columns (1-indexed): A=id, B=email, C=full_name, D=avatar_url, E=role_id, F=status, G=last_login, H=created_at.

- [ ] **Step 1: Add `updateRange` to `src/lib/sheets.ts`**

  Append after the existing `updateRow` function:

  ```ts
  export async function updateRange(
    range: string,
    values: (string | number)[][],
  ): Promise<void> {
    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
  }
  ```

- [ ] **Step 2: Add `findUserByEmail`**

  ```ts
  export async function findUserByEmail(
    email: string,
  ): Promise<{ rowIndex: number; user: Record<string, string> } | null> {
    const rows = await getSheetData('erp_users');
    const idx = rows.findIndex(r => r.email === email);
    if (idx === -1) return null;
    // header is row 1, first data row is row 2, so data index 0 → sheet row 2
    return { rowIndex: idx + 2, user: rows[idx] };
  }
  ```

- [ ] **Step 3: Add `findRoleById`**

  ```ts
  export async function findRoleById(
    roleId: string,
  ): Promise<Record<string, string> | null> {
    const rows = await getSheetData('erp_roles');
    return rows.find(r => r.id === roleId) ?? null;
  }
  ```

- [ ] **Step 4: Add `updateUserLastLogin`**

  ```ts
  export async function updateUserLastLogin(
    rowIndex: number,
    isoTimestamp: string,
  ): Promise<void> {
    // Column G = last_login
    await updateRange(`erp_users!G${rowIndex}`, [[isoTimestamp]]);
  }
  ```

- [ ] **Step 5: Add `updateUserProfile`**

  ```ts
  export async function updateUserProfile(
    rowIndex: number,
    fullName: string,
    avatarUrl: string,
  ): Promise<void> {
    // Columns C:D = full_name, avatar_url
    await updateRange(`erp_users!C${rowIndex}:D${rowIndex}`, [[fullName, avatarUrl]]);
  }
  ```

- [ ] **Step 6: Run TypeScript check**

  ```bash
  cd /Users/lukash0915/Vertex-Project/vertex-erp && npx tsc --noEmit
  ```

  Expected: no errors.

- [ ] **Step 7: Commit**

  ```bash
  git -C /Users/lukash0915 add \
    "Vertex-Project/vertex-erp/src/lib/sheets.ts" && \
  git -C /Users/lukash0915 commit -m "feat(erp): add Sheets helpers for invite-only auth"
  ```

---

## Task 4: Update auth.ts with invite-only callbacks

**Files:**
- Modify: `src/lib/auth.ts`

- [ ] **Step 1: Replace the contents of `src/lib/auth.ts`**

  ```ts
  import NextAuth from 'next-auth';
  import Google from 'next-auth/providers/google';
  import {
    findUserByEmail,
    findRoleById,
    updateUserLastLogin,
    updateUserProfile,
  } from './sheets';

  export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
    ],
    pages: {
      signIn: '/login',
    },
    session: { strategy: 'jwt' },
    callbacks: {
      async signIn({ user }) {
        if (!user.email) return false;
        try {
          const result = await findUserByEmail(user.email);
          if (!result) return false;
          if (result.user.status !== 'active') return false;
          return true;
        } catch (err) {
          console.error('[auth] signIn check failed:', err);
          return false;
        }
      },

      async jwt({ token, user }) {
        // user is only present on the first sign-in
        if (user?.email) {
          try {
            const result = await findUserByEmail(user.email);
            if (result) {
              const role = await findRoleById(result.user.role_id);
              token.dbUserId  = result.user.id;
              token.roleId    = result.user.role_id;
              token.role      = role?.role_name ?? 'Unknown';

              await updateUserLastLogin(result.rowIndex, new Date().toISOString());

              if (!result.user.full_name && user.name) {
                await updateUserProfile(
                  result.rowIndex,
                  user.name,
                  user.image ?? '',
                );
              }
            }
          } catch (err) {
            console.error('[auth] jwt role fetch failed:', err);
            token.dbUserId = '';
            token.roleId   = '';
            token.role     = 'Unknown';
          }
        }
        return token;
      },

      async session({ session, token }) {
        if (session.user) {
          session.user.id        = token.sub as string;
          session.user.role      = (token.role      as string) ?? 'Unknown';
          session.user.roleId    = (token.roleId    as string) ?? '';
          session.user.dbUserId  = (token.dbUserId  as string) ?? '';
        }
        return session;
      },
    },
  });
  ```

- [ ] **Step 2: Run TypeScript check**

  ```bash
  cd /Users/lukash0915/Vertex-Project/vertex-erp && npx tsc --noEmit
  ```

  Expected: no errors.

- [ ] **Step 3: Commit**

  ```bash
  git -C /Users/lukash0915 add \
    "Vertex-Project/vertex-erp/src/lib/auth.ts" && \
  git -C /Users/lukash0915 commit -m "feat(erp): invite-only signIn callback + role-enriched JWT"
  ```

---

## Task 5: Show "not authorized" error on login page

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/components/auth/login-form.tsx`

When NextAuth's `signIn` callback returns `false`, it redirects to `/login?error=AccessDenied`. The page server component reads that param and passes it as a prop so the client component never needs `useSearchParams`.

- [ ] **Step 1: Update `src/app/(auth)/login/page.tsx`**

  ```tsx
  import { LoginForm } from '@/components/auth/login-form';

  export default function LoginPage({
    searchParams,
  }: {
    searchParams: { error?: string };
  }) {
    return <LoginForm error={searchParams.error} />;
  }
  ```

- [ ] **Step 2: Update `src/components/auth/login-form.tsx`**

  Add the `error` prop and an error banner. Replace only the top of the file and the component signature — the rest of the JSX stays the same:

  ```tsx
  'use client';

  import { signIn } from 'next-auth/react';
  import { useState } from 'react';
  import { LogIn, ShieldCheck, BarChart2, Package, Users, AlertCircle } from 'lucide-react';

  const features = [
    { icon: BarChart2,    text: 'Financial Accounting & Reporting' },
    { icon: Package,      text: 'Inventory & Supply Chain' },
    { icon: Users,        text: 'HR, Payroll & Attendance' },
    { icon: ShieldCheck,  text: 'BIR-Ready Tax Reports' },
  ];

  interface LoginFormProps {
    error?: string;
  }

  export function LoginForm({ error }: LoginFormProps) {
    const [loading, setLoading] = useState(false);

    const handleGoogleSignIn = async () => {
      setLoading(true);
      await signIn('google', { callbackUrl: '/dashboard' });
    };

    return (
      <div className="flex min-h-screen font-sans">
        {/* Left — brand panel */}
        <div className="hidden lg:flex lg:w-[440px] flex-col justify-between bg-[#0F172A] px-10 py-10 shrink-0">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-600">
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                <path d="M2 10L6 2L10 10M3.5 7.5H8.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-[14px] font-semibold text-white tracking-tight">Vertex ERP</span>
            <span className="ml-1 text-[9px] font-medium text-blue-400 border border-blue-800 bg-blue-900/40 rounded px-1.5 py-0.5 uppercase tracking-wide">
              Enterprise
            </span>
          </div>

          {/* Main copy */}
          <div>
            <h1 className="text-[26px] font-semibold text-white leading-snug tracking-tight mb-3">
              Complete business management<br />for growing companies.
            </h1>
            <p className="text-[13px] text-slate-400 leading-relaxed mb-8 max-w-xs">
              Accounting, inventory, payroll, and BIR compliance — unified in one enterprise platform.
            </p>

            <div className="space-y-3">
              {features.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-800">
                    <Icon className="h-3 w-3 text-blue-400" />
                  </div>
                  <span className="text-[12px] text-slate-300">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-[10px] text-slate-600 uppercase tracking-widest">Secured · SOC 2</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>
        </div>

        {/* Right — sign in */}
        <div className="flex flex-1 flex-col items-center justify-center bg-[#F8FAFC] px-8">
          <div className="w-full max-w-[340px]">
            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 10L6 2L10 10M3.5 7.5H8.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-[14px] font-semibold text-slate-900">Vertex ERP</span>
            </div>

            <h2 className="text-[18px] font-semibold text-slate-900 mb-1 tracking-tight">Sign in</h2>
            <p className="text-[12px] text-slate-500 mb-6">Access your ERP dashboard</p>

            {/* Access denied banner */}
            {error === 'AccessDenied' && (
              <div className="mb-4 flex items-start gap-2.5 rounded border border-red-200 bg-red-50 px-3 py-2.5">
                <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-red-700 leading-relaxed">
                  Your account is not authorized to access Vertex ERP. Please contact your administrator.
                </p>
              </div>
            )}

            {/* Sign in box */}
            <div className="rounded border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 rounded border border-[#E5E7EB] bg-white px-4 py-2.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-60 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              >
                {!loading ? (
                  <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                    <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                ) : (
                  <LogIn className="h-3.5 w-3.5 text-slate-500" />
                )}
                {loading ? 'Signing in…' : 'Continue with Google'}
              </button>

              <div className="mt-3 flex items-center gap-2">
                <div className="h-px flex-1 bg-[#F1F5F9]" />
                <span className="text-[10px] text-slate-400">OR</span>
                <div className="h-px flex-1 bg-[#F1F5F9]" />
              </div>

              <div className="mt-3 space-y-2">
                <input
                  type="email"
                  placeholder="Work email"
                  className="w-full rounded border border-[#E5E7EB] px-3 py-2 text-[12px] text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 bg-white transition"
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full rounded border border-[#E5E7EB] px-3 py-2 text-[12px] text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 bg-white transition"
                />
                <button className="w-full rounded bg-blue-600 px-4 py-2.5 text-[12px] font-semibold text-white hover:bg-blue-700 transition-colors">
                  Sign In
                </button>
              </div>
            </div>

            <p className="mt-4 text-center text-[10px] text-slate-400">
              By signing in you agree to our{' '}
              <span className="text-blue-600 cursor-pointer hover:underline">Terms of Service</span>
              {' '}and{' '}
              <span className="text-blue-600 cursor-pointer hover:underline">Privacy Policy</span>.
            </p>
          </div>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 3: Run TypeScript check**

  ```bash
  cd /Users/lukash0915/Vertex-Project/vertex-erp && npx tsc --noEmit
  ```

  Expected: no errors.

- [ ] **Step 4: Commit**

  ```bash
  git -C /Users/lukash0915 add \
    "Vertex-Project/vertex-erp/src/app/(auth)/login/page.tsx" \
    "Vertex-Project/vertex-erp/src/components/auth/login-form.tsx" && \
  git -C /Users/lukash0915 commit -m "feat(erp): show AccessDenied error on login page"
  ```

---

## Task 6: End-to-end smoke test

**Files:** none — manual verification only

- [ ] **Step 1: Start the dev server**

  ```bash
  cd /Users/lukash0915/Vertex-Project/vertex-erp && npm run dev
  ```

- [ ] **Step 2: Test authorized sign-in**

  1. Open `http://localhost:3000/login` in a browser.
  2. Click "Continue with Google".
  3. Sign in with `cykaizer2168@gmail.com`.
  4. Expected: redirected to `/dashboard` with no errors.

- [ ] **Step 3: Verify role in session**

  Add a temporary debug line to `src/app/(erp)/dashboard/page.tsx`:

  ```tsx
  import { auth } from '@/lib/auth';

  export default async function DashboardPage() {
    const session = await auth();
    console.log('[debug] session.user:', JSON.stringify(session?.user, null, 2));
    // ... rest of existing content
  }
  ```

  Check the terminal running `npm run dev`. Expected output similar to:

  ```json
  {
    "name": "Admin",
    "email": "cykaizer2168@gmail.com",
    "image": "https://...",
    "role": "Administrator",
    "roleId": "role-administrator",
    "dbUserId": "usr-admin"
  }
  ```

  Remove the `console.log` line after verifying.

- [ ] **Step 4: Test unauthorized sign-in**

  1. Sign out from the dashboard.
  2. Navigate to `http://localhost:3000/login`.
  3. Click "Continue with Google".
  4. Sign in with any Gmail account that is **not** in the `erp_users` sheet.
  5. Expected: redirected back to `/login?error=AccessDenied`.
  6. Expected: red error banner visible: "Your account is not authorized to access Vertex ERP."

- [ ] **Step 5: Verify last_login updated in sheet**

  Open the `erp_users` tab in Google Sheets. Check that column G (last_login) for the super admin row now contains an ISO timestamp from when you signed in.

- [ ] **Step 6: Commit cleanup**

  ```bash
  git -C /Users/lukash0915 add \
    "Vertex-Project/vertex-erp/src/app/(erp)/dashboard/page.tsx" && \
  git -C /Users/lukash0915 commit -m "chore(erp): remove debug session log from dashboard"
  ```

---

## Task 7: Build and deploy

**Files:** none

- [ ] **Step 1: Run production build**

  ```bash
  cd /Users/lukash0915/Vertex-Project/vertex-erp && npm run build
  ```

  Expected: clean build with no errors.

- [ ] **Step 2: Add env vars to Vercel (if not already set)**

  The following vars must be present in the Vercel project environment. Check with:

  ```bash
  vercel env ls
  ```

  Required vars (all should already exist from previous deploys):
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `NEXTAUTH_SECRET`
  - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
  - `GOOGLE_PRIVATE_KEY`
  - `GOOGLE_SHEETS_ID`

  If any are missing, add them:

  ```bash
  vercel env add VARIABLE_NAME production
  ```

- [ ] **Step 3: Deploy to production**

  ```bash
  cd /Users/lukash0915/Vertex-Project/vertex-erp && vercel --prod
  ```

- [ ] **Step 4: Smoke test production**

  1. Visit the production URL.
  2. Sign in with `cykaizer2168@gmail.com`.
  3. Confirm you reach the dashboard.
  4. Sign out, try an unauthorized account, confirm the error banner appears.
