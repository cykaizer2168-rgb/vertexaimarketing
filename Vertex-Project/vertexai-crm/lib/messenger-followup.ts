// ============================================================================
// Messenger follow-up eligibility (pure — no I/O, unit-testable).
//
// HARD RULE: the Send API only allows standard messages within Meta's 24-hour
// window (measured from the customer's LAST message). We stay safely inside it
// and cap the number of proactive nudges.
// ============================================================================

export const MAX_FOLLOWUPS = 2;
export const WINDOW_HOURS = 23; // safety margin under Meta's 24h
// Required silence before each nudge, indexed by how many we've already sent.
export const SILENCE_MINUTES = [60, 360]; // 1st nudge after 1h, 2nd after 6h

export interface FollowupRow {
  state?: string | null;
  followups_sent?: number | null;
  last_inbound_at?: string | null; // customer's last message (window anchor)
  updated_at?: string | null; // last activity (bot or customer)
}

// Should we send a proactive follow-up to this conversation right now?
export function dueForFollowup(row: FollowupRow, now: number = Date.now()): boolean {
  const state = row.state ?? 'NEW';
  if (state === 'DONE' || state === 'HUMAN') return false; // qualified or human-owned

  const sent = row.followups_sent ?? 0;
  if (sent >= MAX_FOLLOWUPS) return false;

  if (!row.last_inbound_at) return false; // no window anchor → never send
  const hoursSinceInbound = (now - new Date(row.last_inbound_at).getTime()) / 3_600_000;
  if (!(hoursSinceInbound >= 0) || hoursSinceInbound >= WINDOW_HOURS) return false; // outside 24h window

  const lastActivity = row.updated_at ? new Date(row.updated_at).getTime() : new Date(row.last_inbound_at).getTime();
  const minutesSinceActivity = (now - lastActivity) / 60_000;
  const required = SILENCE_MINUTES[sent] ?? SILENCE_MINUTES[SILENCE_MINUTES.length - 1];
  return minutesSinceActivity >= required;
}
