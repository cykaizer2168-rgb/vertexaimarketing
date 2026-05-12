# Roles & Permissions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/users/roles` page where Administrators can assign Full Permission / Edit / View / No Access to each of the 23 nav categories for each of the 10 ERP roles, stored in a new `erp_role_permissions` Google Sheet tab.

**Architecture:** Two new Sheets helpers read and write a flat `erp_role_permissions` tab. Two API routes (GET + PUT) sit in front of those helpers. A server page component fetches roles + permissions on load and passes them to a client component. The client renders a two-panel layout: role list on the left, per-role permission editor on the right. Saving replaces all permissions for the selected role atomically (clear + rewrite).

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Google Sheets API v4 (`googleapis`), Tailwind CSS. No test runner — TypeScript `--noEmit` check used instead.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/types/index.ts` | Modify | Add `AccessLevel` type |
| `src/lib/sheets.ts` | Modify | Add `listRolePermissions`, `setRolePermissions` |
| `src/app/api/roles/permissions/route.ts` | Create | GET — return all role permissions |
| `src/app/api/roles/[roleId]/permissions/route.ts` | Create | PUT — replace permissions for one role |
| `src/app/(erp)/users/roles/page.tsx` | Create | Server component — auth guard + data fetch |
| `src/app/(erp)/users/roles/roles-client.tsx` | Create | Client component — two-panel UI |

---

## Task 1: Add `AccessLevel` type to `src/types/index.ts`

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add `AccessLevel` to `src/types/index.ts`**

  The file currently ends with the `ErpRole` interface. Append after it:

  ```ts
  export type AccessLevel = 'full' | 'edit' | 'view' | 'none';
  ```

- [ ] **Step 2: Run TypeScript check**

  ```bash
  cd /Users/lukash0915/Vertex-Project/vertex-erp && npx tsc --noEmit
  ```

  Expected: no errors.

- [ ] **Step 3: Commit**

  ```bash
  git -C /Users/lukash0915 add "Vertex-Project/vertex-erp/src/types/index.ts" && \
  git -C /Users/lukash0915 commit -m "$(cat <<'EOF'
  feat(erp): add AccessLevel type for role permissions

  Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 2: Add Sheets helpers — `listRolePermissions` and `setRolePermissions`

**Files:**
- Modify: `src/lib/sheets.ts`

The existing file imports `ErpUser` from `@/types`. After this task it will also use `AccessLevel`.

`erp_role_permissions` columns: A=role_id, B=category_id, C=access_level

- [ ] **Step 1: Add `AccessLevel` to the existing type import in `src/lib/sheets.ts`**

  Current line 3:
  ```ts
  import type { ErpUser } from '@/types';
  ```

  Change to:
  ```ts
  import type { ErpUser, AccessLevel } from '@/types';
  ```

- [ ] **Step 2: Append `listRolePermissions` to `src/lib/sheets.ts`**

  Add after the last existing function (`updateUserById`):

  ```ts
  export async function listRolePermissions(): Promise<Record<string, Record<string, AccessLevel>>> {
    const rows = await getSheetData('erp_role_permissions');
    const result: Record<string, Record<string, AccessLevel>> = {};
    for (const row of rows) {
      if (!row.role_id || !row.category_id || !row.access_level) continue;
      if (!result[row.role_id]) result[row.role_id] = {};
      result[row.role_id][row.category_id] = row.access_level as AccessLevel;
    }
    return result;
  }
  ```

- [ ] **Step 3: Append `setRolePermissions` to `src/lib/sheets.ts`**

  Add after `listRolePermissions`:

  ```ts
  export async function setRolePermissions(
    roleId: string,
    perms: Record<string, AccessLevel>,
  ): Promise<void> {
    // NOTE: clear-and-rewrite is not atomic — concurrent saves to the same
    // role can interleave. Acceptable at SME scale.
    const sheetsClient = getSheetsClient();

    // 1. Read all current rows
    const allRows = await getSheetData('erp_role_permissions');

    // 2. Keep rows for other roles
    const otherRows = allRows
      .filter(r => r.role_id !== roleId)
      .map(r => [r.role_id, r.category_id, r.access_level]);

    // 3. Build new rows for this role (skip 'none' — absence means no access)
    const newRows = Object.entries(perms)
      .filter(([, level]) => level !== 'none')
      .map(([categoryId, level]) => [roleId, categoryId, level]);

    const allNewRows = [...otherRows, ...newRows];

    // 4. Clear data range (A2:C), preserving the header row
    await sheetsClient.spreadsheets.values.clear({
      spreadsheetId: SHEET_ID,
      range: 'erp_role_permissions!A2:C',
    });

    // 5. Write all rows back (if any)
    if (allNewRows.length > 0) {
      await sheetsClient.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: 'erp_role_permissions!A2',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: allNewRows },
      });
    }
  }
  ```

- [ ] **Step 4: Run TypeScript check**

  ```bash
  cd /Users/lukash0915/Vertex-Project/vertex-erp && npx tsc --noEmit
  ```

  Expected: no errors.

- [ ] **Step 5: Commit**

  ```bash
  git -C /Users/lukash0915 add "Vertex-Project/vertex-erp/src/lib/sheets.ts" && \
  git -C /Users/lukash0915 commit -m "$(cat <<'EOF'
  feat(erp): add listRolePermissions and setRolePermissions to sheets helpers

  Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 3: API route — `GET /api/roles/permissions`

**Files:**
- Create: `src/app/api/roles/permissions/route.ts`

- [ ] **Step 1: Create `src/app/api/roles/permissions/route.ts`**

  ```ts
  import { auth } from '@/lib/auth';
  import { listRolePermissions } from '@/lib/sheets';
  import { NextResponse } from 'next/server';

  export async function GET() {
    const session = await auth();
    if (!session || session.user.role !== 'Administrator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
      const permissions = await listRolePermissions();
      return NextResponse.json({ permissions });
    } catch {
      return NextResponse.json({ error: 'Failed to load permissions' }, { status: 500 });
    }
  }
  ```

- [ ] **Step 2: Run TypeScript check**

  ```bash
  cd /Users/lukash0915/Vertex-Project/vertex-erp && npx tsc --noEmit
  ```

  Expected: no errors.

- [ ] **Step 3: Commit**

  ```bash
  git -C /Users/lukash0915 add "Vertex-Project/vertex-erp/src/app/api/roles/permissions/route.ts" && \
  git -C /Users/lukash0915 commit -m "$(cat <<'EOF'
  feat(erp): add GET /api/roles/permissions route handler

  Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 4: API route — `PUT /api/roles/[roleId]/permissions`

**Files:**
- Create: `src/app/api/roles/[roleId]/permissions/route.ts`

- [ ] **Step 1: Create `src/app/api/roles/[roleId]/permissions/route.ts`**

  ```ts
  import { auth } from '@/lib/auth';
  import { setRolePermissions } from '@/lib/sheets';
  import { NextResponse } from 'next/server';
  import type { AccessLevel } from '@/types';

  export async function PUT(
    req: Request,
    { params }: { params: Promise<{ roleId: string }> },
  ) {
    const session = await auth();
    if (!session || session.user.role !== 'Administrator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { roleId } = await params;

    const body = await req.json() as { permissions?: Record<string, AccessLevel> };
    if (!body.permissions || typeof body.permissions !== 'object') {
      return NextResponse.json(
        { error: 'permissions object is required' },
        { status: 400 },
      );
    }

    try {
      await setRolePermissions(roleId, body.permissions);
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json({ error: 'Failed to save permissions' }, { status: 500 });
    }
  }
  ```

- [ ] **Step 2: Run TypeScript check**

  ```bash
  cd /Users/lukash0915/Vertex-Project/vertex-erp && npx tsc --noEmit
  ```

  Expected: no errors.

- [ ] **Step 3: Commit**

  ```bash
  git -C /Users/lukash0915 add "Vertex-Project/vertex-erp/src/app/api/roles/[roleId]/permissions/route.ts" && \
  git -C /Users/lukash0915 commit -m "$(cat <<'EOF'
  feat(erp): add PUT /api/roles/[roleId]/permissions route handler

  Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 5: Server page component — `/users/roles`

**Files:**
- Create: `src/app/(erp)/users/roles/page.tsx`

- [ ] **Step 1: Create `src/app/(erp)/users/roles/page.tsx`**

  ```tsx
  import { auth } from '@/lib/auth';
  import { redirect } from 'next/navigation';
  import { getSheetData, listRolePermissions } from '@/lib/sheets';
  import { RolesClient } from './roles-client';
  import type { ErpRole } from '@/types';

  export default async function RolesPage() {
    const session = await auth();
    if (!session || session.user.role !== 'Administrator') {
      redirect('/dashboard');
    }

    const [roleRows, permissions] = await Promise.all([
      getSheetData('erp_roles'),
      listRolePermissions(),
    ]);

    const roles: ErpRole[] = roleRows.map(r => ({
      id:           r.id,
      roleName:     r.role_name,
      description:  r.description,
      isSystemRole: r.is_system_role === 'true',
      createdAt:    r.created_at,
    }));

    return <RolesClient roles={roles} initialPermissions={permissions} />;
  }
  ```

- [ ] **Step 2: Run TypeScript check**

  ```bash
  cd /Users/lukash0915/Vertex-Project/vertex-erp && npx tsc --noEmit
  ```

  Expected: one error about `./roles-client` not found — acceptable since Task 6 creates it. Fix any other errors.

- [ ] **Step 3: Commit**

  ```bash
  git -C /Users/lukash0915 add "Vertex-Project/vertex-erp/src/app/(erp)/users/roles/page.tsx" && \
  git -C /Users/lukash0915 commit -m "$(cat <<'EOF'
  feat(erp): add /users/roles server page with auth guard

  Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 6: Client UI component — `RolesClient`

**Files:**
- Create: `src/app/(erp)/users/roles/roles-client.tsx`

- [ ] **Step 1: Create `src/app/(erp)/users/roles/roles-client.tsx`**

  ```tsx
  'use client';

  import { useState, useMemo, Fragment } from 'react';
  import { cn } from '@/lib/utils';
  import type { ErpRole, AccessLevel } from '@/types';

  const MODULES = [
    { label: 'Transactions', categories: [
      { id: 'purchases',       label: 'Purchases' },
      { id: 'item-receipt',    label: 'Item Receipt' },
      { id: 'ap-transactions', label: 'Accounts Payable' },
      { id: 'expenses',        label: 'Expenses' },
      { id: 'sales',           label: 'Sales' },
      { id: 'ar-transactions', label: 'Accounts Receivable' },
      { id: 'inventory-txn',   label: 'Inventory' },
      { id: 'financial-txn',   label: 'Financial' },
    ]},
    { label: 'Lists', categories: [
      { id: 'relationships',   label: 'Relationship' },
      { id: 'accounting-list', label: 'Accounting' },
      { id: 'inventory-list',  label: 'Inventory' },
      { id: 'fixed-assets',    label: 'Fixed Assets' },
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
      { id: 'company',        label: 'Company' },
      { id: 'classification', label: 'Classification' },
      { id: 'users-roles',    label: 'Users & Roles' },
      { id: 'automation',     label: 'Automation' },
      { id: 'integrations',   label: 'Integrations' },
    ]},
  ];

  const ALL_CATEGORY_IDS = MODULES.flatMap(m => m.categories.map(c => c.id));

  const ACCESS_OPTIONS: { value: AccessLevel; label: string }[] = [
    { value: 'full', label: 'Full Permission' },
    { value: 'edit', label: 'Edit' },
    { value: 'view', label: 'View' },
    { value: 'none', label: 'No Access' },
  ];

  interface RolesClientProps {
    roles: ErpRole[];
    initialPermissions: Record<string, Record<string, AccessLevel>>;
  }

  export function RolesClient({ roles, initialPermissions }: RolesClientProps) {
    const [permissions, setPermissions] = useState(initialPermissions);
    const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id ?? '');
    const [draft, setDraft] = useState<Record<string, AccessLevel>>(
      () => initialPermissions[roles[0]?.id ?? ''] ?? {},
    );
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

    const dirty = useMemo(() => {
      const saved = permissions[selectedRoleId] ?? {};
      return ALL_CATEGORY_IDS.some(
        id => (draft[id] ?? 'none') !== (saved[id] ?? 'none'),
      );
    }, [draft, permissions, selectedRoleId]);

    function selectRole(roleId: string) {
      setSelectedRoleId(roleId);
      setDraft(permissions[roleId] ?? {});
      setSaveStatus('idle');
    }

    function getPermissionCount(roleId: string): number {
      const perms = permissions[roleId] ?? {};
      return ALL_CATEGORY_IDS.filter(id => (perms[id] ?? 'none') !== 'none').length;
    }

    async function handleSave() {
      setSaving(true);
      setSaveStatus('idle');
      try {
        const res = await fetch(`/api/roles/${selectedRoleId}/permissions`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permissions: draft }),
        });
        if (!res.ok) {
          setSaveStatus('error');
          return;
        }
        const permRes = await fetch('/api/roles/permissions');
        if (permRes.ok) {
          const data = await permRes.json() as { permissions: Record<string, Record<string, AccessLevel>> };
          setPermissions(data.permissions);
        }
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } finally {
        setSaving(false);
      }
    }

    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-[15px] font-semibold text-slate-900">Roles & Permissions</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Set access levels for each role across all nav categories.
          </p>
        </div>

        <div
          className="flex rounded border border-[#E5E7EB] bg-white overflow-hidden"
          style={{ minHeight: '520px' }}
        >
          {/* Left panel: role list */}
          <div className="w-[168px] shrink-0 border-r border-[#E5E7EB] flex flex-col">
            <div className="px-3 py-2 border-b border-[#F1F5F9]">
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-[0.06em]">
                Roles
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => selectRole(role.id)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 border-b border-[#F8FAFC] transition-colors',
                    selectedRoleId === role.id
                      ? 'border-l-2 border-l-blue-500 bg-blue-50'
                      : 'hover:bg-slate-50',
                  )}
                >
                  <p className={cn(
                    'text-[11px] font-medium leading-snug',
                    selectedRoleId === role.id ? 'text-blue-700' : 'text-slate-800',
                  )}>
                    {role.roleName}
                  </p>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    {getPermissionCount(role.id)} / {ALL_CATEGORY_IDS.length}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Right panel: permission editor */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#F1F5F9] shrink-0">
              <p className="text-[12px] font-semibold text-slate-900">
                {roles.find(r => r.id === selectedRoleId)?.roleName ?? ''} — Permissions
              </p>
              <div className="flex items-center gap-2">
                {saveStatus === 'saved' && (
                  <span className="text-[10px] text-emerald-600 font-medium">Saved</span>
                )}
                {saveStatus === 'error' && (
                  <span className="text-[10px] text-red-600 font-medium">Save failed</span>
                )}
                <button
                  onClick={handleSave}
                  disabled={!dirty || saving}
                  className="rounded bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-40"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>

            {/* Permission rows */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-[11px] border-collapse">
                <tbody>
                  {MODULES.map(mod => (
                    <Fragment key={mod.label}>
                      <tr>
                        <td
                          colSpan={2}
                          className="px-4 py-1.5 bg-[#F1F5F9] text-[9px] font-bold text-slate-500 uppercase tracking-[0.06em]"
                        >
                          {mod.label}
                        </td>
                      </tr>
                      {mod.categories.map((cat, idx) => (
                        <tr
                          key={cat.id}
                          className={cn(
                            'border-b border-[#F8FAFC]',
                            idx % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white',
                          )}
                        >
                          <td className="px-4 py-2 text-slate-700">{cat.label}</td>
                          <td className="px-4 py-2 w-[160px]">
                            <select
                              value={draft[cat.id] ?? 'none'}
                              onChange={e =>
                                setDraft(d => ({
                                  ...d,
                                  [cat.id]: e.target.value as AccessLevel,
                                }))
                              }
                              className="w-full rounded border border-[#E5E7EB] bg-white px-2 py-1 text-[11px] text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                            >
                              {ACCESS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Run TypeScript check**

  ```bash
  cd /Users/lukash0915/Vertex-Project/vertex-erp && npx tsc --noEmit
  ```

  Expected: no errors.

- [ ] **Step 3: Commit**

  ```bash
  git -C /Users/lukash0915 add "Vertex-Project/vertex-erp/src/app/(erp)/users/roles/roles-client.tsx" && \
  git -C /Users/lukash0915 commit -m "$(cat <<'EOF'
  feat(erp): add RolesClient — two-panel role permission editor

  Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 7: Build and deploy

**Files:** none

- [ ] **Step 1: Run production build**

  ```bash
  cd /Users/lukash0915/Vertex-Project/vertex-erp && npm run build
  ```

  Expected: clean build. `/users/roles` should appear as `ƒ` (dynamic) in the route table.

- [ ] **Step 2: Deploy to production**

  ```bash
  cd /Users/lukash0915/Vertex-Project/vertex-erp && vercel --prod
  ```

  Expected: `READY` status, aliased to `https://vertex-erp-rose.vercel.app`.

---

## Manual setup reminder (one-time, before first use)

Before visiting `/users/roles` in production, add the `erp_role_permissions` tab to the Google Spreadsheet (`1el-EMUF-ukGm3xJLjkhF5R1Se2Q03NckLzepIn5HgTE`):

1. Create tab named **`erp_role_permissions`**
2. Header row: `role_id` | `category_id` | `access_level`
3. Add seed rows per the defaults table in the design spec (`docs/superpowers/specs/2026-05-12-roles-permissions-design.md`)
