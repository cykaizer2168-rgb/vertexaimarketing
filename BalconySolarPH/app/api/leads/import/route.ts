import { NextRequest, NextResponse } from 'next/server';
import { importProspects, type IncomingProspect } from '@/lib/prospects-import';

// Receives a batch of scraped prospects (e.g. from n8n or another source).
// Auth: shared secret. Dedupe + insert is delegated to importProspects().
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-import-secret') ?? new URL(req.url).searchParams.get('secret');
  if (!process.env.OUTREACH_IMPORT_SECRET || secret !== process.env.OUTREACH_IMPORT_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { product, businessType, area, prospects } = body as {
    product?: string;
    businessType?: string;
    area?: string;
    prospects?: IncomingProspect[];
  };
  if (!Array.isArray(prospects)) {
    return NextResponse.json({ error: 'prospects[] required' }, { status: 400 });
  }

  const result = await importProspects({ product, businessType, area, prospects });
  return NextResponse.json(result);
}
