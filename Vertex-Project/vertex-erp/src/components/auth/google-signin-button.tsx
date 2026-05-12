'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch {
      setLoading(false);
    }
  }

  return (
    <motion.button
      onClick={handleSignIn}
      disabled={loading}
      whileHover={!loading ? { scale: 1.01, y: -1 } : {}}
      whileTap={!loading ? { scale: 0.99 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className="relative w-full flex items-center justify-center gap-3 rounded-lg border border-[#E2E8F0] bg-white px-4 py-[11px] text-[13px] font-medium text-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[#FAFAFA] hover:border-[#CBD5E1] hover:shadow-[0_4px_10px_rgba(0,0,0,0.09)] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
      aria-label="Continue with Google"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
      ) : (
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
      )}
      <span>{loading ? 'Signing in…' : 'Continue with Google'}</span>
    </motion.button>
  );
}
