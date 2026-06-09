'use client';

import { useState } from 'react';
import {
  X, Globe, Phone, Mail, Sparkles, Zap, Check, MapPin, ExternalLink, Megaphone, Copy,
} from 'lucide-react';
import type { Prospect } from '@/lib/supabase';
import { scoreProspect, tierOf, TIER_META, scoreFactors } from '@/lib/lead-score';

type Draft = { subject: string; body: string };

const CH_LABEL: Record<string, string> = { call: '📞 Call', fb: '💬 FB', email: '✉️ Email', sms: '📱 SMS' };
const STATUS_META: Record<string, { label: string; cls: string }> = {
  to_contact: { label: 'To contact', cls: 'text-gray-600 bg-gray-50 border-gray-200' },
  contacted: { label: 'Contacted', cls: 'text-blue-700 bg-blue-50 border-blue-100' },
  follow_up: { label: 'Follow-up', cls: 'text-amber-700 bg-amber-50 border-amber-100' },
  not_interested: { label: 'Not interested', cls: 'text-red-600 bg-red-50 border-red-100' },
};

// Profile modal for a single scraped prospect: full details, clickable website/FB
// links, an ad-signal badge, and the per-prospect actions (enrich, AI compose,
// approve to lead).
export default function ProspectDetail({
  prospect,
  onClose,
  onChanged,
}: {
  prospect: Prospect;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [p, setP] = useState<Prospect>(prospect);
  const [enriching, setEnriching] = useState(false);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(
    p.ai_subject && p.ai_body ? { subject: p.ai_subject, body: p.ai_body } : null
  );
  const [approved, setApproved] = useState(p.status === 'approved');
  const [channel, setChannel] = useState<'call' | 'fb' | 'email' | 'sms'>('call');
  const [notes, setNotes] = useState('');
  const [logging, setLogging] = useState(false);
  const [status, setStatus] = useState<string>(p.outreach_status ?? 'to_contact');

  async function logOutreach(outcome: 'contacted' | 'follow_up' | 'not_interested' | 'interested') {
    setLogging(true);
    const res = await fetch('/api/outreach/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prospectId: p.id, channel, outcome, notes: notes.trim() || undefined }),
    })
      .then((r) => r.json())
      .catch(() => null);
    setLogging(false);
    if (!res?.ok) return;
    onChanged();
    if (outcome === 'interested') {
      onClose(); // graduated to the pipeline as a lead
      return;
    }
    setStatus(outcome);
  }

  async function enrich() {
    setEnriching(true);
    const res = await fetch('/api/outreach/enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prospectId: p.id }),
    })
      .then((r) => r.json())
      .catch(() => null);
    if (res?.enriched) {
      setP((prev) => ({
        ...prev,
        email: res.email ?? prev.email,
        facebook: res.facebook ?? prev.facebook,
        runs_ads: res.runs_ads,
        ad_platforms: res.ad_platforms,
      }));
      onChanged();
    }
    setEnriching(false);
  }

  async function compose() {
    setComposing(true);
    const res = await fetch('/api/outreach/compose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessName: p.name, businessType: p.business_type ?? '' }),
    })
      .then((r) => r.json())
      .catch(() => null);
    setDraft({ subject: res?.subject ?? 'Error', body: res?.body ?? 'Compose failed — try again.' });
    setComposing(false);
  }

  async function approve() {
    await fetch('/api/outreach/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prospectIds: [p.id] }),
    }).catch(() => {});
    setApproved(true);
    onChanged();
  }

  const adsKnown = p.runs_ads !== null && p.runs_ads !== undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-[16px] font-semibold text-gray-900">{p.name}</h2>
            <div className="text-[12px] text-gray-500 mt-0.5">
              {[p.business_type, p.area].filter(Boolean).join(' · ')}
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lead score */}
        {(() => {
          const sc = scoreProspect(p);
          const t = TIER_META[tierOf(sc)];
          const factors = scoreFactors(p);
          return (
            <div className="px-5 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[12px] font-semibold text-gray-700">Lead Score</span>
                <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 border ${t.cls}`}>
                  {t.emoji} {t.label} · {sc}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {factors.length === 0 ? (
                  <span className="text-[10px] text-gray-400">Walang signals pa — i-Enrich para tumaas ang score.</span>
                ) : (
                  factors.map((f, i) => (
                    <span
                      key={i}
                      className={`text-[10px] rounded px-1.5 py-0.5 border ${
                        f.points < 0 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      {f.label} {f.points >= 0 ? `+${f.points}` : f.points}
                    </span>
                  ))
                )}
              </div>
            </div>
          );
        })()}

        {/* Details */}
        <div className="px-5 py-4 space-y-2.5 text-[13px]">
          {p.address && (
            <Row icon={<MapPin className="w-4 h-4 text-gray-400" />} label="Address">
              {p.address}
            </Row>
          )}
          {typeof p.rating === 'number' && (
            <Row icon={<span className="text-[14px]">⭐</span>} label="Rating">
              <span className="font-medium text-amber-700">{p.rating}</span>
              {p.reviews_count ? <span className="text-gray-500"> ({p.reviews_count} reviews)</span> : null}
            </Row>
          )}
          <Row icon={<Phone className="w-4 h-4 text-gray-400" />} label="Phone">
            {p.phone || <span className="text-gray-400">—</span>}
          </Row>
          <Row icon={<Mail className="w-4 h-4 text-gray-400" />} label="Email">
            {p.email || <span className="text-gray-400">— (i-Enrich para hanapin)</span>}
          </Row>
          <Row icon={<Globe className="w-4 h-4 text-gray-400" />} label="Website">
            {p.website ? (
              <a href={p.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                {p.website.replace(/^https?:\/\//, '').slice(0, 40)}
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </Row>
          <Row icon={<span className="text-[14px]">📘</span>} label="Facebook">
            {p.facebook ? (
              <a href={p.facebook} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                {p.facebook.replace(/^https?:\/\/(www\.)?facebook\.com\//, 'fb.com/').slice(0, 36)}
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-gray-400">— (i-Enrich para hanapin)</span>
            )}
          </Row>
          <Row icon={<Megaphone className="w-4 h-4 text-gray-400" />} label="Nag-ads?">
            {!adsKnown ? (
              <span className="text-gray-400">— (i-Enrich para suriin)</span>
            ) : p.runs_ads ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-700 bg-green-50 border border-green-100 rounded-full px-2 py-0.5">
                ● Oo — {p.ad_platforms}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5">
                Walang na-detect na ad pixel{p.ad_platforms ? ` (${p.ad_platforms})` : ''}
              </span>
            )}
          </Row>
        </div>

        {/* AI draft */}
        {draft && (
          <div className="mx-5 mb-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-[12px] font-semibold text-gray-700">{draft.subject}</div>
            <pre className="text-[12px] text-gray-600 whitespace-pre-wrap font-sans mt-1">{draft.body}</pre>
            <button
              onClick={() => navigator.clipboard.writeText(`${draft.subject}\n\n${draft.body}`)}
              className="mt-1.5 flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              Copy
            </button>
          </div>
        )}

        {/* Log Outreach */}
        <div className="px-5 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[12px] font-semibold text-gray-700">Log Outreach</span>
            <span
              className={`text-[10px] font-medium rounded-full px-2 py-0.5 border ${(STATUS_META[status] ?? STATUS_META.to_contact).cls}`}
            >
              {(STATUS_META[status] ?? STATUS_META.to_contact).label}
            </span>
          </div>
          <div className="flex gap-1.5 mb-2">
            {(['call', 'fb', 'email', 'sms'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setChannel(c)}
                className={`text-[11px] rounded-lg px-2.5 py-1 border cursor-pointer ${
                  channel === c
                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {CH_LABEL[c]}
              </button>
            ))}
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)…"
            rows={2}
            className="w-full text-[12px] border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 mb-2"
          />
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => logOutreach('contacted')}
              disabled={logging}
              className="text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 disabled:opacity-50 cursor-pointer text-gray-700"
            >
              No answer / Contacted
            </button>
            <button
              onClick={() => logOutreach('follow_up')}
              disabled={logging}
              className="text-[11px] border border-amber-200 rounded-lg px-2.5 py-1.5 hover:bg-amber-50 disabled:opacity-50 cursor-pointer text-amber-700"
            >
              Follow-up
            </button>
            <button
              onClick={() => logOutreach('not_interested')}
              disabled={logging}
              className="text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 disabled:opacity-50 cursor-pointer text-gray-500"
            >
              Not interested
            </button>
            <button
              onClick={() => logOutreach('interested')}
              disabled={logging}
              className="text-[11px] bg-green-600 text-white rounded-lg px-2.5 py-1.5 hover:bg-green-700 disabled:opacity-50 cursor-pointer"
            >
              ✓ Interested → Lead
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 px-5 py-4 border-t border-gray-100">
          <button
            onClick={enrich}
            disabled={enriching || !p.website}
            className="flex items-center gap-1.5 text-[12px] border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 disabled:opacity-50 cursor-pointer text-gray-700"
          >
            <Zap className="w-3.5 h-3.5" />
            {enriching ? 'Sinusuri…' : 'Enrich (FB + ads + email)'}
          </button>
          <button
            onClick={compose}
            disabled={composing}
            className="flex items-center gap-1.5 text-[12px] border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 disabled:opacity-50 cursor-pointer text-gray-700"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {composing ? 'Composing…' : draft ? 'Regenerate' : 'AI message'}
          </button>
          <button
            onClick={approve}
            disabled={approved}
            className="flex items-center gap-1.5 text-[12px] bg-amber-500 text-white rounded-lg px-3 py-2 hover:bg-amber-600 disabled:opacity-50 cursor-pointer ml-auto"
          >
            <Check className="w-3.5 h-3.5" />
            {approved ? 'Approved ✓' : 'Approve → Lead'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="w-20 shrink-0 text-gray-400 text-[12px]">{label}</span>
      <span className="text-gray-800 break-words min-w-0">{children}</span>
    </div>
  );
}
