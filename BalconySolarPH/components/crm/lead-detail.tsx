'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Phone, Mail, MapPin, Loader2, CheckCircle2, FileText, Handshake, Trophy, XCircle, Clock, Copy } from 'lucide-react';
import type { Lead, Activity } from '@/lib/supabase';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { STAGE_COLORS, STAGE_LABELS } from '@/lib/crm-mock';
import ProposalForm from './proposal-form';

interface Props { lead: Lead; onClose: () => void; onUpdated: () => void; }

const ACT_ICON: Record<string, typeof FileText> = {
  stage_change: Clock,
  proposal_sent: FileText,
  proposal_accepted: CheckCircle2,
  contact: Phone,
  note: FileText,
};

export default function LeadDetail({ lead, onClose, onUpdated }: Props) {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [showProposal, setShowProposal] = useState(false);
  const [acceptUrl, setAcceptUrl] = useState<string | null>(null);
  const [stage, setStage] = useState(lead.stage);
  const accepted = !!lead.proposal_accepted;

  const loadActivities = useCallback(async () => {
    const { data } = await supabase.from('activities').select('*').eq('lead_id', lead.id).order('created_at', { ascending: false });
    setActivities((data as Activity[]) ?? []);
  }, [supabase, lead.id]);

  useEffect(() => { loadActivities(); }, [loadActivities]);

  const moveStage = async (newStage: string, label: string) => {
    setBusy(label);
    await fetch(`/api/leads/${lead.id}/stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    });
    setStage(newStage as Lead['stage']);
    setBusy(null);
    await loadActivities();
    onUpdated();
  };

  // Action buttons per current stage
  const actions: { label: string; stage: string; icon: typeof Phone; color: string }[] = [];
  if (stage === 'new')         actions.push({ label: 'Mark Contacted', stage: 'contacted', icon: Phone, color: 'bg-blue-600 hover:bg-blue-700' });
  if (stage === 'negotiating') actions.push({ label: 'Mark Won', stage: 'closed_won', icon: Trophy, color: 'bg-green-600 hover:bg-green-700' });
  if (stage === 'proposal')    actions.push({ label: 'Mark Negotiating', stage: 'negotiating', icon: Handshake, color: 'bg-blue-600 hover:bg-blue-700' });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center gap-3 z-10">
          <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0">
            {lead.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">{lead.name}</div>
            <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${STAGE_COLORS[stage] ?? 'bg-gray-100 text-gray-500'}`}>
              {STAGE_LABELS[stage] ?? stage}{accepted ? ' · Accepted ✓' : ''}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer"><X className="w-4 h-4 text-gray-500" /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Contact info */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600"><Phone className="w-3.5 h-3.5 text-gray-400" />{lead.mobile || '—'}</div>
            <div className="flex items-center gap-2 text-gray-600"><Mail className="w-3.5 h-3.5 text-gray-400" />{lead.email || '—'}</div>
            <div className="flex items-center gap-2 text-gray-600"><MapPin className="w-3.5 h-3.5 text-gray-400" />{lead.location || '—'}</div>
            <div className="flex items-center gap-2 text-gray-600"><span className="text-gray-400">💡</span>{lead.monthly_bill || '—'}</div>
            {lead.message && <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-100">{lead.message}</p>}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {actions.map(a => (
              <button key={a.stage} onClick={() => moveStage(a.stage, a.label)} disabled={!!busy}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60 ${a.color}`}>
                {busy === a.label ? <Loader2 className="w-4 h-4 animate-spin" /> : <a.icon className="w-4 h-4" />}{a.label}
              </button>
            ))}

            {/* Send Proposal (available from contacted onward) */}
            {['contacted', 'proposal', 'negotiating'].includes(stage) && (
              <button onClick={() => setShowProposal(s => !s)} disabled={!!busy}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60">
                <FileText className="w-4 h-4" />{stage === 'proposal' ? 'Re-send Proposal' : 'Send Proposal'}
              </button>
            )}

            {/* Mark Lost — always available except when won */}
            {stage !== 'closed_won' && stage !== 'cold' && (
              <button onClick={() => moveStage('cold', 'Mark Lost')} disabled={!!busy}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm font-medium transition-colors cursor-pointer disabled:opacity-60">
                <XCircle className="w-4 h-4" />Mark Lost / Cold
              </button>
            )}
          </div>

          {/* Proposal form */}
          {showProposal && (
            <ProposalForm
              leadId={lead.id}
              leadEmail={lead.email}
              defaultAmount={lead.proposal_amount ?? ''}
              defaultPackage={lead.proposal_package ?? 'Essential'}
              onSent={(url) => {
                setAcceptUrl(url);
                setStage('proposal');
                setShowProposal(false);
                loadActivities();
                onUpdated();
              }}
            />
          )}

          {/* Accept link (for manual sharing) */}
          {acceptUrl && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-xs">
              <p className="text-green-700 font-semibold mb-1">✓ Proposal sent! Accept link:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate text-gray-600 bg-white rounded px-2 py-1 border border-gray-200">{acceptUrl}</code>
                <button onClick={() => navigator.clipboard.writeText(acceptUrl)} className="p-1.5 hover:bg-white rounded cursor-pointer"><Copy className="w-3.5 h-3.5 text-gray-500" /></button>
              </div>
            </div>
          )}

          {/* Activity timeline */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Activity</p>
            <div className="space-y-0">
              {activities.length === 0 && <p className="text-xs text-gray-400">Wala pang activity.</p>}
              {activities.map((a, i) => {
                const Icon = ACT_ICON[a.type] ?? Clock;
                return (
                  <div key={a.id} className="flex gap-3 pb-3 relative">
                    {i < activities.length - 1 && <div className="absolute left-[11px] top-6 bottom-0 w-px bg-gray-200" />}
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0 z-10">
                      <Icon className="w-3 h-3 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700">{a.description}</p>
                      <p className="text-[10px] text-gray-400">{a.actor} · {new Date(a.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
