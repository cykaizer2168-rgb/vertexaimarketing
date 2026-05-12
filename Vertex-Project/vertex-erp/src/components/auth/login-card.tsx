'use client';

import { motion } from 'framer-motion';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { GoogleSignInButton } from './google-signin-button';

interface LoginCardProps {
  error?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:   'Your account is not authorized to access Vertex ERP. Contact your administrator.',
  OAuthSignin:    'Could not initiate Google sign-in. Please try again.',
  OAuthCallback:  'Authentication failed. Please try again.',
  Default:        'An error occurred during sign in. Please try again.',
};

export function LoginCard({ error }: LoginCardProps) {
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default) : null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[#F8FAFC] px-6 py-12 min-h-screen">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
        className="w-full max-w-[380px]"
      >
        {/* Mobile logo */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex items-center gap-2 mb-8 lg:hidden"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-blue-600 shadow-[0_2px_8px_rgba(37,99,235,0.4)]">
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
              <path d="M2 10L6 2L10 10M3.5 7.5H8.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-[14px] font-semibold text-[#111827]">Vertex ERP</span>
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-7"
        >
          <h1 className="text-[22px] font-semibold text-[#111827] tracking-tight leading-tight">
            Welcome back
          </h1>
          <p className="mt-1.5 text-[13px] text-[#6B7280]">
            Sign in to your Vertex ERP workspace
          </p>
        </motion.div>

        {/* Error banner */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3"
            role="alert"
          >
            <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[12px] text-red-700 leading-relaxed">{errorMessage}</p>
          </motion.div>
        )}

        {/* Login card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.25 }}
          className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]"
        >
          {/* Card identity */}
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#0F172A] shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
              <svg width="15" height="15" viewBox="0 0 12 12" fill="none">
                <path d="M2 10L6 2L10 10M3.5 7.5H8.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#111827] leading-tight">Vertex ERP</p>
              <p className="text-[11px] text-[#9CA3AF]">Enterprise Platform</p>
            </div>
          </div>

          <div className="mb-5 h-px bg-[#F3F4F6]" />

          <GoogleSignInButton />

          <div className="mt-4 flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-[#9CA3AF]" />
            <p className="text-[11px] text-[#9CA3AF]">Secured with Google OAuth 2.0</p>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="mt-5 text-center text-[11px] text-[#9CA3AF]"
        >
          By signing in you agree to our{' '}
          <a href="#" className="text-[#6B7280] hover:text-blue-600 transition-colors underline-offset-2 hover:underline">
            Terms of Service
          </a>
          {' '}and{' '}
          <a href="#" className="text-[#6B7280] hover:text-blue-600 transition-colors underline-offset-2 hover:underline">
            Privacy Policy
          </a>.
        </motion.p>

        {/* Trust row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-4 flex items-center justify-center gap-5"
        >
          {['SOC 2', 'ISO 27001', 'BIR Compliant'].map(badge => (
            <div key={badge} className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-[#9CA3AF] font-medium tracking-wide">{badge}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
