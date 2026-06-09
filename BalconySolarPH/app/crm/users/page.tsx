'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, UserPlus, Trash2, ShieldCheck, Lock, X } from 'lucide-react';

type User = {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  created_at: string;
  last_sign_in_at: string | null;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/users');
    if (res.status === 401 || res.status === 403) {
      setForbidden(true);
      setUsers([]);
      setLoading(false);
      return;
    }
    const d = await res.json().catch(() => ({ users: [] }));
    setForbidden(false);
    setUsers(d.users ?? []);
    setLoading(false);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function addUser() {
    setErr('');
    if (!email.trim() || password.length < 6) {
      setErr('Email and a password (min 6 chars) are required.');
      return;
    }
    setSaving(true);
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), name: name.trim(), password }),
    });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setErr(d.error ?? 'Failed to add user');
      return;
    }
    setShowForm(false);
    setEmail('');
    setName('');
    setPassword('');
    load();
  }

  async function removeUser(u: User) {
    if (u.isAdmin) return;
    if (!confirm(`Remove ${u.email}?`)) return;
    await fetch('/api/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.id, email: u.email }),
    }).catch(() => {});
    load();
  }

  return (
    <>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div
            className="bg-white rounded-2xl ring-1 ring-black/[0.06] shadow-[0_24px_70px_-20px_rgba(0,0,0,0.35)] w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-[15px] font-semibold text-gray-900">Add user</h2>
              <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <Field label="Email">
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="user@example.com" className="w-full text-[13px] border border-gray-200 rounded-lg px-2.5 py-2 text-gray-800" />
              </Field>
              <Field label="Name (optional)">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Juan Dela Cruz" className="w-full text-[13px] border border-gray-200 rounded-lg px-2.5 py-2 text-gray-800" />
              </Field>
              <Field label="Password">
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="text" placeholder="min 6 characters" className="w-full text-[13px] border border-gray-200 rounded-lg px-2.5 py-2 text-gray-800" />
              </Field>
              {err && <div className="text-[12px] text-red-600">{err}</div>}
              <p className="text-[11px] text-gray-400">Share the email + password with the new user. They can change it after signing in.</p>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="text-[12px] border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 cursor-pointer text-gray-700">
                Cancel
              </button>
              <button onClick={addUser} disabled={saving} className="text-[12px] bg-amber-500 text-white rounded-lg px-4 py-2 hover:bg-amber-600 disabled:opacity-50 cursor-pointer">
                {saving ? 'Adding…' : 'Add user'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/65 backdrop-blur-2xl border-b border-black/[0.06] px-4 h-[50px] flex items-center gap-2 shrink-0">
        <span className="flex-1 text-[14px] font-semibold text-gray-800">Users</span>
        <button onClick={load} className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer text-gray-500">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
        {!forbidden && (
          <button
            onClick={() => {
              setErr('');
              setShowForm(true);
            }}
            className="flex items-center gap-1.5 text-[12px] bg-amber-500 text-white rounded-lg px-3 py-1.5 hover:bg-amber-600 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add user
          </button>
        )}
        <Link href="/crm" className="flex items-center gap-1 text-[12px] border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-gray-700">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Link>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[12px] text-gray-400">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading…
          </div>
        ) : forbidden ? (
          <div className="max-w-sm mx-auto mt-16 text-center bg-white rounded-2xl ring-1 ring-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-8">
            <Lock className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <div className="text-[14px] font-semibold text-gray-800">Admins only</div>
            <div className="text-[12px] text-gray-500 mt-1">You don&apos;t have permission to manage users.</div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl ring-1 ring-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 text-[12px] font-semibold text-gray-700">
              {users.length} user{users.length === 1 ? '' : 's'}
            </div>
            <ul className="divide-y divide-gray-100">
              {users.map((u) => (
                <li key={u.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                    {(u.name || u.email || '?').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-gray-800 flex items-center gap-2">
                      {u.name || u.email}
                      {u.isAdmin && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-1.5">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {u.email}
                      {u.last_sign_in_at && ` · last sign-in ${new Date(u.last_sign_in_at).toLocaleDateString('en-PH')}`}
                    </div>
                  </div>
                  {!u.isAdmin && (
                    <button onClick={() => removeUser(u)} title="Remove user" className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      {children}
    </label>
  );
}
