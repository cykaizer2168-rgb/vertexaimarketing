import { NextRequest, NextResponse } from 'next/server';

// Server-side proxy so the n8n webhook URL never reaches the browser.
export async function POST(req: NextRequest) {
  const hook = process.env.N8N_PROSPECT_WEBHOOK_URL;
  if (!hook) return NextResponse.json({ error: 'Scraper not configured' }, { status: 500 });
  const body = await req.json().catch(() => ({}));
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 25000);
    const res = await fetch(hook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(t);
    return NextResponse.json({ triggered: res.ok });
  } catch (err) {
    console.error('[outreach/scrape] trigger failed:', err);
    return NextResponse.json({ triggered: false, error: 'trigger failed' }, { status: 502 });
  }
}
