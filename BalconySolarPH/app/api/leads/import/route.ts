import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-admin';

// Receives a batch of scraped prospects from the n8n "Prospect Scraper" workflow.
// Auth: shared secret. Dedupes against existing prospects (external_id) and leads
// (phone/name) before inserting with status='new'.
type IncomingProspect = {
  name?: string;
  phone?: string;
  website?: string;
  email?: string;
  address?: string;
  sourceUrl?: string;
  externalId?: string;
};

function normPhone(p?: string | null) {
  return (p ?? '').replace(/\D/g, '');
}

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

  const sb = createAdminSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  // Pull existing dedupe keys once.
  const { data: existingLeads } = await sb.from('leads').select('name, mobile');
  const leadPhones = new Set((existingLeads ?? []).map((l) => normPhone(l.mobile)).filter(Boolean));
  const leadNames = new Set(
    (existingLeads ?? []).map((l) => (l.name ?? '').trim().toLowerCase()).filter(Boolean)
  );

  let inserted = 0;
  let skipped = 0;

  for (const p of prospects) {
    const name = (p.name ?? '').trim();
    if (!name) {
      skipped++;
      continue;
    }
    const externalId =
      (p.externalId ?? '').trim() || `${name.toLowerCase().replace(/\s+/g, '-')}|${normPhone(p.phone)}`;

    // Dedupe vs existing leads
    if ((normPhone(p.phone) && leadPhones.has(normPhone(p.phone))) || leadNames.has(name.toLowerCase())) {
      skipped++;
      continue;
    }

    const { error } = await sb.from('prospects').insert({
      name,
      phone: p.phone ?? null,
      website: p.website ?? null,
      email: p.email ?? null,
      address: p.address ?? null,
      area: area ?? null,
      business_type: businessType ?? null,
      product: product ?? null,
      source: 'oxylabs_gmaps',
      source_url: p.sourceUrl ?? null,
      external_id: externalId,
      status: 'new',
    });
    if (error) {
      // 23505 = duplicate external_id (already imported) -> count as skipped, not a failure
      skipped++;
      continue;
    }
    inserted++;
  }

  return NextResponse.json({ inserted, skipped });
}
