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
        },
      },
    },
  },
};

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
        const businesses: Array<Record<string, string | null>> = res?.data?.businesses ?? [];
        for (const b of businesses) {
          if (b?.name) {
            collected.push({
              name: b.name,
              phone: b.phone ?? undefined,
              website: b.website ?? undefined,
              address: b.address ?? undefined,
              sourceUrl: url,
            });
          }
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
