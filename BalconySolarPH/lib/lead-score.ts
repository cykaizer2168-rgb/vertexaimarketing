import type { Prospect } from './supabase';

export type ScoreTier = 'hot' | 'warm' | 'cold';

// Lead score (0-100) computed from signals already captured on a prospect.
// Pure function — recomputed from current fields, so it stays in sync after enrich.
export function scoreProspect(p: Prospect): number {
  let s = 0;
  if (typeof p.rating === 'number') {
    if (p.rating >= 4.5) s += 25;
    else if (p.rating >= 4.0) s += 15;
    else if (p.rating >= 3.0) s += 5;
  }
  if (typeof p.reviews_count === 'number' && p.reviews_count >= 100) s += 10;
  if (p.runs_ads) s += 30;
  else if (p.ad_platforms) s += 5; // has tracking (e.g. GTM) but no ad pixel
  if (p.website) s += 10;
  if (p.email) s += 10;
  if (p.phone) s += 10;
  if (p.outreach_status === 'follow_up') s += 15;
  else if (p.outreach_status === 'contacted') s += 5;
  else if (p.outreach_status === 'not_interested') s -= 40;
  return Math.max(0, Math.min(100, s));
}

export function tierOf(score: number): ScoreTier {
  return score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold';
}

export const TIER_META: Record<ScoreTier, { label: string; emoji: string; cls: string }> = {
  hot: { label: 'Hot', emoji: '🔥', cls: 'text-red-700 bg-red-50 border-red-200' },
  warm: { label: 'Warm', emoji: '🟡', cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  cold: { label: 'Cold', emoji: '🔵', cls: 'text-blue-700 bg-blue-50 border-blue-200' },
};

// Human-readable breakdown of what contributed to the score (for the modal).
export function scoreFactors(p: Prospect): { label: string; points: number }[] {
  const f: { label: string; points: number }[] = [];
  if (typeof p.rating === 'number') {
    if (p.rating >= 4.5) f.push({ label: `Rating ${p.rating}★`, points: 25 });
    else if (p.rating >= 4.0) f.push({ label: `Rating ${p.rating}★`, points: 15 });
    else if (p.rating >= 3.0) f.push({ label: `Rating ${p.rating}★`, points: 5 });
  }
  if (typeof p.reviews_count === 'number' && p.reviews_count >= 100) f.push({ label: `${p.reviews_count} reviews`, points: 10 });
  if (p.runs_ads) f.push({ label: `Runs ads (${p.ad_platforms ?? 'pixels'})`, points: 30 });
  else if (p.ad_platforms) f.push({ label: `Has tracking (${p.ad_platforms})`, points: 5 });
  if (p.website) f.push({ label: 'Has website', points: 10 });
  if (p.email) f.push({ label: 'Has email', points: 10 });
  if (p.phone) f.push({ label: 'Has phone', points: 10 });
  if (p.outreach_status === 'follow_up') f.push({ label: 'Follow-up', points: 15 });
  else if (p.outreach_status === 'contacted') f.push({ label: 'Contacted', points: 5 });
  else if (p.outreach_status === 'not_interested') f.push({ label: 'Not interested', points: -40 });
  return f;
}
