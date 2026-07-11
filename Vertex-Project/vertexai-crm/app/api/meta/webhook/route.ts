import { NextRequest, NextResponse } from 'next/server';
import { verifyMetaSignature } from '@/lib/meta-signature';

// ── GET: Meta webhook verification handshake ────────────────────────────────
// Meta calls this once when you subscribe the webhook. Echo hub.challenge back
// when the verify token matches META_VERIFY_TOKEN.
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const mode = p.get('hub.mode');
  const token = p.get('hub.verify_token');
  const challenge = p.get('hub.challenge');

  if (mode === 'subscribe' && token && token === process.env.META_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? '', { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

// ── POST: inbound Messenger events ──────────────────────────────────────────
// Thin forwarder: verify Meta's signature against the RAW body, then hand the
// raw event to n8n which runs the qualification state machine. We always return
// 200 quickly (Meta retries/​disables slow endpoints); the forward is
// best-effort with a short timeout.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const appSecret = process.env.META_APP_SECRET;

  if (!appSecret) {
    // Misconfigured — do not accept unverified events.
    return NextResponse.json({ error: 'not configured' }, { status: 500 });
  }
  if (!verifyMetaSignature(raw, req.headers.get('x-hub-signature-256'), appSecret)) {
    return NextResponse.json({ error: 'bad signature' }, { status: 401 });
  }

  const target = process.env.N8N_MESSENGER_WEBHOOK_URL;
  if (target) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    try {
      await fetch(target, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-hub-signature-256': req.headers.get('x-hub-signature-256') ?? '' },
        body: raw,
        signal: controller.signal,
      });
    } catch {
      // Swallow — Meta must still get its 200 so it keeps delivering.
    } finally {
      clearTimeout(timer);
    }
  }

  return NextResponse.json({ received: true });
}
