'use client';

import { useState } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ErpUser, ErpRole } from '@/types';

interface UsersClientProps {
  initialUsers: ErpUser[];
  roles: ErpRole[];
}

function getInitials(name: string | null, email: string): string {
  if (name) return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  return email.slice(0, 2).toUpperCase();
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function UsersClient({ initialUsers, roles }: UsersClientProps) {
  const [users, setUsers]           = useState<ErpUser[]>(initialUsers);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [addOpen, setAddOpen]       = useState(false);
  const [editTarget, setEditTarget] = useState<ErpUser | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [addForm, setAddForm]       = useState({ email: '', fullName: '', roleId: '' });
  const [editForm, setEditForm]     = useState({ fullName: '', roleId: '' });
  const [addError, setAddError]     = useState('');
  const [editError, setEditError]   = useState('');
  const [saving, setSaving]         = useState(false);

  async function refreshUsers() {
    const res = await fetch('/api/users');
    if (res.ok) {
      const data = await res.json() as { users: ErpUser[] };
      setUsers(data.users);
    }
  }

  const filtered = users
    .filter(u =>
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.fullName ?? '').toLowerCase().includes(search.toLowerCase())
    )
    .filter(u => !roleFilter   || u.roleId === roleFilter)
    .filter(u => !statusFilter || u.status === statusFilter);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError('');
    setSaving(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      if (!res.ok) {
        const data = await res.json() as { error: string };
        setAddError(data.error ?? 'Failed to add user');
        return;
      }
      setAddOpen(false);
      setAddForm({ email: '', fullName: '', roleId: '' });
      await refreshUsers();
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setEditError('');
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${editTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const data = await res.json() as { error: string };
        setEditError(data.error ?? 'Failed to update user');
        return;
      }
      setEditTarget(null);
      await refreshUsers();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(user: ErpUser) {
    setTogglingId(user.id);
    try {
      await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: user.status === 'active' ? 'disabled' : 'active' }),
      });
      await refreshUsers();
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold text-slate-900">Manage Users</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {users.length} user{users.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          onClick={() => { setAddForm({ email: '', fullName: '', roleId: '' }); setAddError(''); setAddOpen(true); }}
          className="flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-3 w-3" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 rounded border border-[#E5E7EB] bg-white px-2.5 py-1.5 w-[220px]">
          <Search className="h-3 w-3 text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or email..."
            className="flex-1 bg-transparent text-[11px] text-slate-700 placeholder:text-slate-400 outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="rounded border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-[11px] text-slate-700 outline-none cursor-pointer"
        >
          <option value="">All Roles</option>
          {roles.map(r => <option key={r.id} value={r.id}>{r.roleName}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="rounded border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-[11px] text-slate-700 outline-none cursor-pointer"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded border border-[#E5E7EB] bg-white overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-[#F1F5F9] bg-[#FAFAFA]">
              <th className="px-4 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-[0.06em] text-[10px]">User</th>
              <th className="px-4 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-[0.06em] text-[10px]">Role</th>
              <th className="px-4 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-[0.06em] text-[10px]">Status</th>
              <th className="px-4 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-[0.06em] text-[10px]">Last Login</th>
              <th className="px-4 py-2.5 text-right font-semibold text-slate-500 uppercase tracking-[0.06em] text-[10px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[11px] text-slate-400">
                  {users.length === 0
                    ? 'No users found. Add your first user.'
                    : 'No users match the current filters.'}
                </td>
              </tr>
            ) : (
              filtered.map((user, idx) => (
                <tr
                  key={user.id}
                  className={cn(
                    'border-b border-[#F1F5F9] last:border-0',
                    idx % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white',
                  )}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-semibold text-blue-700">
                        {getInitials(user.fullName, user.email)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{user.fullName ?? '—'}</p>
                        <p className="text-[10px] text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                      {user.roleName}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={cn(
                      'rounded px-1.5 py-0.5 text-[10px] font-semibold',
                      user.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-600',
                    )}>
                      {user.status === 'active' ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{formatDate(user.lastLogin)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditTarget(user);
                          setEditForm({ fullName: user.fullName ?? '', roleId: user.roleId });
                          setEditError('');
                        }}
                        className="rounded px-2 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        disabled={togglingId === user.id}
                        className={cn(
                          'rounded px-2 py-1 text-[10px] font-medium transition-colors disabled:opacity-50',
                          user.status === 'active'
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-emerald-600 hover:bg-emerald-50',
                        )}
                      >
                        {togglingId === user.id
                          ? '...'
                          : user.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add User modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="w-full max-w-[400px] rounded-lg border border-[#E5E7EB] bg-white shadow-xl mx-4">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] px-5 py-3.5">
              <h2 className="text-[13px] font-semibold text-slate-900">Add User</h2>
              <button onClick={() => setAddOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-3.5">
              {addError && (
                <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                  {addError}
                </p>
              )}
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="user@gmail.com"
                  className="w-full rounded border border-[#E5E7EB] px-3 py-1.5 text-[12px] text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={addForm.fullName}
                  onChange={e => setAddForm(f => ({ ...f, fullName: e.target.value }))}
                  placeholder="Juan dela Cruz"
                  className="w-full rounded border border-[#E5E7EB] px-3 py-1.5 text-[12px] text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">Role</label>
                <select
                  required
                  value={addForm.roleId}
                  onChange={e => setAddForm(f => ({ ...f, roleId: e.target.value }))}
                  className="w-full rounded border border-[#E5E7EB] px-3 py-1.5 text-[12px] text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition cursor-pointer"
                >
                  <option value="">Select a role...</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.roleName}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="rounded border border-[#E5E7EB] px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  {saving ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="w-full max-w-[400px] rounded-lg border border-[#E5E7EB] bg-white shadow-xl mx-4">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] px-5 py-3.5">
              <h2 className="text-[13px] font-semibold text-slate-900">Edit User</h2>
              <button onClick={() => setEditTarget(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-5 space-y-3.5">
              {editError && (
                <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                  {editError}
                </p>
              )}
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))}
                  className="w-full rounded border border-[#E5E7EB] px-3 py-1.5 text-[12px] text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">Role</label>
                <select
                  required
                  value={editForm.roleId}
                  onChange={e => setEditForm(f => ({ ...f, roleId: e.target.value }))}
                  className="w-full rounded border border-[#E5E7EB] px-3 py-1.5 text-[12px] text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition cursor-pointer"
                >
                  {roles.map(r => <option key={r.id} value={r.id}>{r.roleName}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="rounded border border-[#E5E7EB] px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
