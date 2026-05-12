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
