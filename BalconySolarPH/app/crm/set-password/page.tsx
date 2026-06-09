'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, KeyRound } from 'lucide-react';
import { createBrowserSupabase } from '@/lib/supabase-browser';

export default function SetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      const supabase = createBrowserSupabase();
      // Establish the session from the invite link (code flow or hash tokens).
      const code = new URL(window.location.href).searchParams.get('code');
      if (code) {
        try {
          await supabase.auth.exchangeCodeForSession(code);
        } catch {
          // ignore — fall through to getSession
        }
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setReady(!!session);
      setChecking(false);
    })();
  }, []);

  async function save() {
    setErr('');
    if (password.length < 6) {
      setErr('Password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    router.push('/crm');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl ring-1 ring-black/[0.06] shadow-[0_24px_70px_-20px_rgba(0,0,0,0.25)] p-7">
        <div className="flex flex-col items-center mb-5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-white flex items-center justify-center mb-3 shadow-sm">
            <KeyRound className="w-5 h-5" />
          </div>
          <h1 className="text-[16px] font-semibold text-gray-900">Set your password</h1>
          <p className="text-[12px] text-gray-500 mt-1 text-center">Welcome to Balcony Solar PH CRM. Choose a password to finish.</p>
        </div>

        {checking ? (
          <div className="flex items-center justify-center py-8 text-[13px] text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Verifying invite…
          </div>
        ) : !ready ? (
          <div className="flex items-start gap-2 text-[12.5px] text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>This invite link is invalid or has expired. Ask your admin to send a new invite.</span>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password (min 6 characters)"
              className="w-full text-[13px] border border-gray-200 rounded-lg px-3 py-2.5 text-gray-800"
            />
            {err && <div className="text-[12px] text-red-600">{err}</div>}
            <button
              onClick={save}
              disabled={saving}
              className="w-full text-[13px] bg-amber-500 text-white rounded-lg px-4 py-2.5 hover:bg-amber-600 disabled:opacity-50 cursor-pointer font-medium"
            >
              {saving ? 'Saving…' : 'Set password & continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
