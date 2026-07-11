// ============================================================================
// Meta webhook signature verification (X-Hub-Signature-256).
// Pure helper so it can be unit-tested without a live request.
// ============================================================================

import crypto from 'crypto';

// Verify Meta's `X-Hub-Signature-256: sha256=<hex>` header against the RAW
// request body using the app secret. Timing-safe. Returns false on any
// malformed input rather than throwing.
export function verifyMetaSignature(rawBody: string, header: string | null, appSecret: string): boolean {
  if (!header || !appSecret) return false;
  const [algo, sig] = header.split('=');
  if (algo !== 'sha256' || !sig) return false;

  const expected = crypto.createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex');

  // timingSafeEqual throws if the buffers differ in length — guard first.
  const a = Buffer.from(sig, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
