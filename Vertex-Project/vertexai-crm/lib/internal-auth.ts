// ============================================================================
// Shared-secret auth for internal endpoints (n8n → CRM).
// Callers send `x-vertex-key: <INTERNAL_API_KEY>`.
// ============================================================================

import crypto from 'crypto';

// Timing-safe compare of two strings.
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// Returns true when the request carries the correct internal key.
// If INTERNAL_API_KEY is unset the endpoint is closed (returns false) —
// fail closed, never open.
export function hasInternalKey(headerValue: string | null): boolean {
  const expected = process.env.INTERNAL_API_KEY;
  if (!expected) return false;
  if (!headerValue) return false;
  return safeEqual(headerValue, expected);
}

export const INTERNAL_KEY_HEADER = 'x-vertex-key';
