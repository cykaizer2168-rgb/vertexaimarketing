import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-admin';

export const maxDuration = 30;

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// Enriches one prospect by fetching its website's raw HTML and extracting a public
// email, a Facebook page, and ad/tracking pixels (a signal that the business runs
// digital ads). Free (no Oxylabs credits). Best-effort + graceful on blocked sites.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { prospectId } = body as { prospectId?: string };
  if (!prospectId) return NextResponse.json({ error: 'prospectId required' }, { status: 400 });

  const sb = createAdminSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { data: p } = await sb
    .from('prospects')
    .select('id, website, email, facebook')
    .eq('id', prospectId)
    .single();

  if (!p) return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
  if (!p.website) return NextResponse.json({ enriched: false, reason: 'no website' });

  let html = '';
  try {
    const r = await fetch(p.website, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
    html = await r.text();
  } catch (err) {
    console.error('[outreach/enrich] fetch failed:', p.website, err);
    return NextResponse.json({ enriched: false, reason: 'could not read website' });
  }

  // Email — prefer a mailto:, else first plausible address (skip asset/noise emails).
  let email: string | null = null;
  const mailto = html.match(/mailto:([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})/i);
  if (mailto) {
    email = mailto[1];
  } else {
    const m = html.match(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/);
    if (m && !/\.(png|jpe?g|gif|svg|webp)/i.test(m[0]) && !/sentry|wixpress|example|sentry\.io|@2x/i.test(m[0])) {
      email = m[0];
    }
  }

  // Facebook page (skip share/plugin/tracking links).
  let facebook: string | null = null;
  const fb = html.match(
    /https?:\/\/(?:www\.)?facebook\.com\/(?!sharer|plugins|tr|dialog|events\/|groups\/|profile\.php)([A-Za-z0-9.\-]{2,})/i
  );
  if (fb) facebook = `https://www.facebook.com/${fb[1]}`;

  // Ad / tracking pixels in the page source.
  const metaPixel = /connect\.facebook\.net\/[^"']*fbevents\.js|fbq\s*\(\s*['"]init['"]|facebook\.com\/tr\?/i.test(html);
  const googleAds = /gtag\/js\?id=AW-|[^A-Za-z]AW-\d{6,}|googleadservices\.com|googlesyndication\.com/i.test(html);
  const gtm = /googletagmanager\.com\/gtm\.js|gtag\/js\?id=G-/i.test(html);
  const platforms = [metaPixel && 'Meta Pixel', googleAds && 'Google Ads', gtm && 'GTM/Analytics'].filter(
    Boolean
  ) as string[];
  const runsAds = metaPixel || googleAds;

  const update: { email?: string; facebook?: string; runs_ads: boolean; ad_platforms: string | null } = {
    runs_ads: runsAds,
    ad_platforms: platforms.join(', ') || null,
  };
  if (!p.email && email) update.email = email;
  if (!p.facebook && facebook) update.facebook = facebook;

  await sb.from('prospects').update(update).eq('id', p.id);

  return NextResponse.json({
    enriched: true,
    email: update.email ?? p.email,
    facebook: update.facebook ?? p.facebook,
    runs_ads: runsAds,
    ad_platforms: update.ad_platforms,
  });
}
