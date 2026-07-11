// ============================================================================
// Vertex Messenger Engine — lead scoring (pure, no I/O — unit-testable).
//
// Scores a Messenger conversation on unit economics: the value of ONE closed
// sale (ticket), urgency (timeline), the need expressed, and the industry.
// Tiers:  HOT >= 70  ·  WARM 30-69  ·  NOT_FIT < 30
// ============================================================================

export interface QualifyAnswers {
  q1_business?: string | null; // their business / industry
  q2_need?: string | null; // what they want (system / leads / ads)
  q3_ticket?: string | null; // value of one closed sale (₱)
  q4_timeline?: string | null; // when they want to start
}

export interface ScoreBreakdown {
  ticket: number;
  timeline: number;
  need: number;
  industry: number;
}

export type Tier = 'HOT' | 'WARM' | 'NOT_FIT';

export interface ScoreResult {
  score: number;
  tier: Tier;
  breakdown: ScoreBreakdown;
}

export const HOT_THRESHOLD = 70;
export const WARM_THRESHOLD = 30;

// Parse a Peso figure from free text. Understands "1.5M", "500k", "₱250,000",
// "P100000", "200 libo" (thousand), "2 milyon" (million).
export function parsePeso(raw?: string | null): number | null {
  if (!raw) return null;
  // Strip thousands-separator commas entirely (so "250,000" → "250000",
  // not two separate numbers).
  const text = raw.toLowerCase().replace(/,/g, '');

  // "2 milyon" / "1.5 million" / "1m"
  const mil = text.match(/(\d+(?:\.\d+)?)\s*(m|mil|million|milyon)\b/);
  if (mil) return Math.round(parseFloat(mil[1]) * 1_000_000);

  // "200 libo" / "500k" / "300 thousand"
  const k = text.match(/(\d+(?:\.\d+)?)\s*(k|rb|thousand|libo)\b/);
  if (k) return Math.round(parseFloat(k[1]) * 1_000);

  // Bare number, optionally with a peso sign — take the largest run of digits.
  const nums = text.match(/\d+(?:\.\d+)?/g);
  if (!nums) return null;
  const max = Math.max(...nums.map((n) => parseFloat(n)));
  return Number.isFinite(max) ? Math.round(max) : null;
}

function scoreTicket(q3?: string | null): number {
  const v = parsePeso(q3);
  if (v === null) return 0;
  if (v >= 1_000_000) return 45;
  if (v >= 100_000) return 40;
  if (v >= 20_000) return 20;
  return 0;
}

function scoreTimeline(q4?: string | null): number {
  const t = (q4 ?? '').toLowerCase();
  if (!t) return 0;
  // ASAP / now / this week
  if (/\b(asap|ngayon|now|immediately|this week|ngayong linggo|agad|kaagad)\b/.test(t)) return 30;
  // 1-2 months
  if (/(1-2|1 to 2|isa|dalawa|next month|susunod|month|buwan|weeks?|linggo)/.test(t)) return 15;
  return 0;
}

function scoreNeed(q2?: string | null): number {
  const n = (q2 ?? '').toLowerCase();
  if (!n) return 0;
  // Wants a full system / automation → highest intent
  if (/(system|sistema|automat|crm|buo|end.?to.?end|full)/.test(n)) return 25;
  // Wants leads / ads / marketing help
  if (/(lead|ads|advertis|marketing|fb|facebook|boost|campaign|benta|sales)/.test(n)) return 15;
  return 0;
}

const INDUSTRY_RE =
  /(solar|real ?estate|property|insurance|clinic|dental|derma|resort|hotel|construction|automotive|car|financ|lending|school|academy|export|manufactur|logistics|b2b|agency|law|account)/i;

function scoreIndustry(q1?: string | null): number {
  return INDUSTRY_RE.test(q1 ?? '') ? 10 : 0;
}

export function tierFor(score: number): Tier {
  if (score >= HOT_THRESHOLD) return 'HOT';
  if (score >= WARM_THRESHOLD) return 'WARM';
  return 'NOT_FIT';
}

export function scoreLead(answers: QualifyAnswers): ScoreResult {
  const breakdown: ScoreBreakdown = {
    ticket: scoreTicket(answers.q3_ticket),
    timeline: scoreTimeline(answers.q4_timeline),
    need: scoreNeed(answers.q2_need),
    industry: scoreIndustry(answers.q1_business),
  };
  const score = breakdown.ticket + breakdown.timeline + breakdown.need + breakdown.industry;
  return { score, tier: tierFor(score), breakdown };
}

// Map a tier to the CRM pipeline stage it routes to.
//   HOT     → 'qualified' (fires stage webhook → human handoff)
//   WARM    → 'new'       (stays enrolled in the follow-up drip)
//   NOT_FIT → 'cold'
export function stageForTier(tier: Tier): 'qualified' | 'new' | 'cold' {
  if (tier === 'HOT') return 'qualified';
  if (tier === 'WARM') return 'new';
  return 'cold';
}
