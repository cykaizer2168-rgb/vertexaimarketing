'use client';

import { useState } from 'react';
import { Mail, Loader2 } from 'lucide-react';

interface Props {
  leadId: string;
  leadEmail: string;
  defaultAmount?: string;
  defaultPackage?: string;
  onSent: (acceptUrl: string) => void;
}

const PACKAGES = ['Starter', 'Essential', 'Premium', 'Custom Kit'];

export default function ProposalForm({ leadId, leadEmail, defaultAmount, defaultPackage, onSent }: Props) {
  const [packageName, setPackageName] = useState(defaultPackage || 'Essential');
  const [amount, setAmount] = useState(defaultAmount || '');
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/proposal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, packageName }),
      });
      const data = await res.json();
      if (data.acceptUrl) onSent(data.acceptUrl);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-orange-700">Send Proposal (may approve button sa email)</p>

      <div>
        <label htmlFor="pkg" className="text-[11px] text-gray-500 block mb-1">Package</label>
        <select
          id="pkg"
          value={packageName}
          onChange={(e) => setPackageName(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 cursor-pointer focus:outline-none focus:border-orange-400"
        >
          {PACKAGES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="amt" className="text-[11px] text-gray-500 block mb-1">Amount</label>
        <input
          id="amt"
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="₱95,000 – ₱120,000"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400"
        />
      </div>

      <button
        onClick={send}
        disabled={sending}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold cursor-pointer disabled:opacity-60"
      >
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
        Send to {leadEmail}
      </button>
    </div>
  );
}
