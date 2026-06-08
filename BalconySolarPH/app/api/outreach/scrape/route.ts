import { NextRequest, NextResponse } from 'next/server';
import { OxylabsAIStudioSDK } from 'oxylabs-ai-studio';
import { importProspects, type IncomingProspect } from '@/lib/prospects-import';

// Scrape jobs are slow (AI Search + per-page AI Scraper). Allow the longer runtime.
export const maxDuration = 300;

// JSON schema the AI Scraper uses to extract a structured business list from a page.
const BIZ_SCHEMA = {
  type: 'object',
  properties: {
    businesses: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          phone: { type: 'string' },
          website: { type: 'string' },
          address: { type: 'string' },
          rating: { type: 'number' },
          review_count: { type: 'number' },
        },
      },
    },
  },
};

// Skip government / public-sector entries (barangay & city health centers, gov't
// offices) — they're not commercial solar prospects.
const GOV_RE =
  /\b(barangay|brgy\.?|health center|city hall|municipal|municipality|national government|government center|department of|dept\.? of|bureau of|lupon|sangguniang|public market|dswd|doh|city health office|provincial|congress|senate|commission on|office of the)\b/i;

function toNum(v: unknown): number | undefined {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/[^\d.]/g, ''));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

// Finds B2B prospects with Oxylabs AI Studio: AI Search locates live listing pages
// for the query, then AI Scraper extracts structured businesses from each. Results
// are deduped + staged via importProspects().
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { type, area, product, limit } = body as {
    type?: string;
    area?: string;
    product?: string;
    limit?: number;
  };
  if (!type || !area) return NextResponse.json({ error: 'type and area required' }, { status: 400 });

  const apiKey = process.env.OXYLABS_AI_STUDIO_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Oxylabs not configured' }, { status: 500 });

  const cap = Math.min(Math.max(limit ?? 25, 1), 100);
  const sdk = new OxylabsAIStudioSDK({ apiKey, timeout: 120000, retryAttempts: 1 });

  try {
    // 1) Find live listing pages for the query. Bias toward commercial/private
    // businesses ("businesses and companies", "private") to avoid government /
    // barangay facilities polluting results.
    const search = await sdk.aiSearch.search({
      query: `directory of private ${type} businesses and companies in ${area} Philippines with contact number and website`,
      limit: 8,
      return_content: false,
      geo_location: 'PH',
    });
    // Skip non-HTML / unscrapable results (PDFs, scribd, Google support/maps) which
    // the AI Scraper can't extract a business list from. Keep the top few HTML pages.
    const BAD_URL = /\.pdf(\?|$)|\.docx?(\?|$)|scribd\.com|support\.google\.com|google\.com\/(travel|maps)/i;
    const urls = (search.data ?? [])
      .map((r) => r.url)
      .filter((u): u is string => !!u && !BAD_URL.test(u))
      .slice(0, 3);

    // 2) Extract structured businesses from each page until we reach the cap.
    const collected: IncomingProspect[] = [];
    for (const url of urls) {
      try {
        const res = await sdk.aiScraper.scrape({
          url,
          output_format: 'json',
          geo_location: 'PH',
          render_javascript: true,
          schema: BIZ_SCHEMA,
        });
        const businesses = (res?.data?.businesses ?? []) as Array<Record<string, unknown>>;
        for (const b of businesses) {
          const name = b?.name ? String(b.name) : '';
          if (!name) continue;
          const address = b?.address ? String(b.address) : '';
          // Skip government / public-sector entries.
          if (GOV_RE.test(`${name} ${address}`)) continue;

          const rating = toNum(b?.rating);
          const rc = toNum(b?.review_count ?? b?.reviews ?? b?.reviews_count);

          collected.push({
            name,
            phone: b?.phone ? String(b.phone) : undefined,
            website: b?.website ? String(b.website) : undefined,
            address: address || undefined,
            rating: rating !== undefined && rating <= 5 ? rating : undefined,
            reviewCount: rc,
            sourceUrl: url,
          });
        }
      } catch (err) {
        console.error('[outreach/scrape] page scrape failed:', url, err);
      }
      if (collected.length >= cap) break;
    }

    const result = await importProspects({
      product,
      businessType: type,
      area,
      prospects: collected.slice(0, cap),
    });
    return NextResponse.json({ found: collected.length, ...result });
  } catch (err) {
    console.error('[outreach/scrape] failed:', err);
    return NextResponse.json({ error: 'scrape failed' }, { status: 502 });
  }
}
