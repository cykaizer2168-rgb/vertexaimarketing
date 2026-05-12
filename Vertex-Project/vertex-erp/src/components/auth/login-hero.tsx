'use client';

import { motion } from 'framer-motion';
import {
  Brain, ShieldCheck, Boxes, Zap, Building2, FileCheck,
  TrendingUp, ArrowUpRight,
} from 'lucide-react';

const features = [
  { icon: Brain,       text: 'AI-powered business insights'    },
  { icon: FileCheck,   text: 'BIR-ready accounting workflows'  },
  { icon: Boxes,       text: 'Smart inventory & POS'           },
  { icon: Zap,         text: 'AI-assisted ERP migration'       },
  { icon: Building2,   text: 'Multi-branch management'         },
  { icon: ShieldCheck, text: 'Secure cloud-based operations'   },
];

const kpis = [
  { label: 'Revenue',  value: '₱2.4M', change: '+12%', color: 'text-emerald-400' },
  { label: 'Orders',   value: '847',   change: '+5%',  color: 'text-blue-400'    },
  { label: 'Fulfil.',  value: '94%',   change: '+2%',  color: 'text-emerald-400' },
];

const transactions = [
  { type: 'Invoice', ref: '#INV-4821', amount: '₱12,400', status: 'Paid',    statusColor: 'text-emerald-400' },
  { type: 'PO',      ref: '#PO-3901',  amount: '₱8,200',  status: 'Pending', statusColor: 'text-amber-400'   },
];

export function LoginHero() {
  return (
    <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] shrink-0 flex-col justify-between bg-[#0F172A] px-9 py-8 relative overflow-hidden">

      {/* Dot grid + glow orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.8) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full bg-blue-600/20 blur-[90px]" />
        <div className="absolute -bottom-20 -left-20 h-[280px] w-[280px] rounded-full bg-blue-900/20 blur-[70px]" />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 flex items-center gap-2.5"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.5)]">
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
            <path d="M2 10L6 2L10 10M3.5 7.5H8.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="text-[14px] font-semibold text-white tracking-tight">Vertex ERP</span>
        <span className="ml-0.5 rounded px-1.5 py-0.5 text-[9px] font-semibold text-blue-300 border border-blue-800 bg-blue-900/50 uppercase tracking-wider">
          Enterprise
        </span>
      </motion.div>

      {/* Main content block */}
      <div className="relative z-10 flex flex-col gap-5">

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <h2 className="text-[21px] xl:text-[23px] font-semibold text-white leading-snug tracking-tight mb-2">
            AI-Powered ERP for Modern<br />Filipino Businesses
          </h2>
          <p className="text-[12px] text-slate-400 leading-relaxed max-w-[340px]">
            Manage accounting, inventory, operations, tax compliance, and AI automation in one intelligent platform.
          </p>
        </motion.div>

        {/* ── Dashboard mockup ── */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Glow behind card */}
          <div className="absolute left-1/2 -translate-x-1/2 h-10 w-4/5 bg-blue-600/20 blur-[24px] -mb-3 pointer-events-none" />

          <motion.div
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            className="rounded-2xl border border-white/10 bg-[#111827] shadow-[0_24px_64px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.04)] overflow-hidden"
          >
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0D1526] border-b border-white/[0.06]">
              <div className="flex gap-1.5">
                <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
                <div className="h-2 w-2 rounded-full bg-[#FFBD2E]" />
                <div className="h-2 w-2 rounded-full bg-[#28C840]" />
              </div>
              <div className="mx-2 flex-1">
                <div className="mx-auto h-[18px] w-[160px] rounded-full bg-white/[0.06] flex items-center justify-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] text-slate-400">erp.vertexconsulting.ph</span>
                </div>
              </div>
              <div className="rounded-[4px] px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/30">
                <span className="text-[8px] font-bold text-blue-400 uppercase tracking-wider">AI</span>
              </div>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-3 gap-2 px-3.5 pt-3 pb-2">
              {kpis.map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-lg bg-white/[0.04] border border-white/[0.06] px-2.5 py-2"
                >
                  <p className="text-[9px] text-slate-500 mb-0.5">{kpi.label}</p>
                  <p className="text-[15px] font-bold text-white leading-tight">{kpi.value}</p>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <ArrowUpRight className={`h-2.5 w-2.5 ${kpi.color}`} />
                    <span className={`text-[9px] font-semibold ${kpi.color}`}>{kpi.change}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Revenue chart */}
            <div className="px-3.5 pb-2">
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 pt-2.5 pb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-medium text-slate-400">Revenue This Month</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-white">₱2,441,280</span>
                    <span className="text-[8px] font-semibold text-emerald-400">↑12.4%</span>
                  </div>
                </div>
                <svg
                  viewBox="0 0 280 58"
                  className="w-full h-[58px]"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#3B82F6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0"   />
                    </linearGradient>
                  </defs>
                  {/* Subtle grid */}
                  {[14, 28, 42].map(y => (
                    <line key={y} x1="0" y1={y} x2="280" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                  ))}
                  {/* Area fill */}
                  <path
                    d="M 0 46 C 18 44, 36 34, 60 38 C 82 42, 100 26, 128 21 C 152 16, 170 30, 200 18 C 222 8, 250 13, 280 7 L 280 58 L 0 58 Z"
                    fill="url(#areaGrad)"
                  />
                  {/* Line */}
                  <path
                    d="M 0 46 C 18 44, 36 34, 60 38 C 82 42, 100 26, 128 21 C 152 16, 170 30, 200 18 C 222 8, 250 13, 280 7"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Live endpoint dot */}
                  <circle cx="280" cy="7" r="3"   fill="#3B82F6" />
                  <circle cx="280" cy="7" r="5.5" fill="#3B82F6" fillOpacity="0.22" />
                </svg>
              </div>
            </div>

            {/* Transactions */}
            <div className="px-3.5 pb-2">
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.04]">
                  <span className="text-[9px] font-medium text-slate-400">Recent Activity</span>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-[8px] text-blue-400 font-medium">Live</span>
                  </div>
                </div>
                {transactions.map((tx, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between px-3 py-1.5 ${i < transactions.length - 1 ? 'border-b border-white/[0.03]' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] bg-blue-900/50 border border-blue-800/40">
                        <TrendingUp className="h-2.5 w-2.5 text-blue-400" />
                      </div>
                      <p className="text-[9px] font-medium text-slate-300">{tx.type} <span className="text-slate-500">{tx.ref}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-semibold text-white">{tx.amount}</p>
                      <p className={`text-[8px] font-medium ${tx.statusColor}`}>{tx.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI insights */}
            <div className="px-3.5 pb-3.5">
              <div className="rounded-lg border border-blue-500/25 bg-blue-500/10 px-3 py-2 flex items-start gap-2">
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] bg-blue-600/40 mt-0.5">
                  <Brain className="h-2.5 w-2.5 text-blue-400" />
                </div>
                <p className="text-[9px] text-blue-300/90 leading-relaxed">
                  <span className="font-semibold text-blue-200">AI Insight: </span>
                  Revenue trending 12% above forecast. 3 purchase orders require approval.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.38 }}
          className="grid grid-cols-2 gap-x-4 gap-y-2"
        >
          {features.map(({ icon: Icon, text }, i) => (
            <motion.div
              key={text}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.42 + i * 0.05 }}
              className="flex items-center gap-2"
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] bg-blue-900/60 border border-blue-800/60">
                <Icon className="h-2.5 w-2.5 text-blue-400" />
              </div>
              <span className="text-[11px] text-slate-400 leading-tight">{text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.55 }}
        className="relative z-10 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-slate-600">All systems operational</span>
        </div>
        <div className="flex items-center gap-4">
          {['SOC 2', 'ISO 27001', 'BIR Ready'].map(badge => (
            <span key={badge} className="text-[10px] text-slate-600">{badge}</span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
