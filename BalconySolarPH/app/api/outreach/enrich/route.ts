import { NextRequest, NextResponse } from 'next/server';
import { OxylabsAIStudioSDK } from 'oxylabs-ai-studio';
import { createAdminSupabase } from '@/lib/supabase-admin';

// Single AI Scraper job — allow the longer runtime.
export const maxDuration = 120;

// Schema for extracting contact info from a business website.
const CONTACT_SCHEMA = {
  type: 'object',
  properties: {
    phone: { type: 'string' },
    email: { type: 'string' },
  },
};

// Enriches one prospect by scraping its website for a public phone/email, then
// fills in whatever is missing. On-demand (one prospect per call) to stay within
// the function timeout and let the user control credit spend.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { prospectId } = body as { prospectId?: string };
  if (!prospectId) return NextResponse.json({ error: 'prospectId required' }, { status: 400 });

  const apiKey = process.env.OXYLABS_AI_STUDIO_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Oxylabs not configured' }, { status: 500 });

  const sb = createAdminSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { data: prospect } = await sb
    .from('prospects')
    .select('id, website, phone, email')
    .eq('id', prospectId)
    .single();

  if (!prospect) return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
  if (!prospect.website) {
    return NextResponse.json({ enriched: false, reason: 'no website' });
  }

  const sdk = new OxylabsAIStudioSDK({ apiKey, timeout: 90000, retryAttempts: 1 });

  try {
    const res = await sdk.aiScraper.scrape({
      url: prospect.website,
      output_format: 'json',
      geo_location: 'PH',
      render_javascript: true,
      schema: CONTACT_SCHEMA,
    });
    const found = (res?.data ?? {}) as { phone?: string | null; email?: string | null };

    // Only fill what's missing; never overwrite existing data.
    const update: { phone?: string; email?: string } = {};
    if (!prospect.phone && found.phone) update.phone = String(found.phone).trim();
    if (!prospect.email && found.email) update.email = String(found.email).trim();

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ enriched: false, reason: 'nothing found' });
    }

    await sb.from('prospects').update(update).eq('id', prospect.id);
    return NextResponse.json({ enriched: true, ...update });
  } catch (err) {
    // Some sites fail to scrape on Oxylabs' side (blocked/timeout). Enrichment is
    // best-effort — degrade gracefully so the UI shows "no change", not an error.
    console.error('[outreach/enrich] scrape failed:', err);
    return NextResponse.json({ enriched: false, reason: 'could not read website' });
  }
}
