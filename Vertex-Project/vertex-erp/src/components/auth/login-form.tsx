'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { LogIn, ShieldCheck, BarChart2, Package, Users, AlertCircle } from 'lucide-react';

const features = [
  { icon: BarChart2,   text: 'Financial Accounting & Reporting' },
  { icon: Package,     text: 'Inventory & Supply Chain' },
  { icon: Users,       text: 'HR, Payroll & Attendance' },
  { icon: ShieldCheck, text: 'BIR-Ready Tax Reports' },
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
