import { createAdminSupabase } from './supabase-admin';

// Shape of an incoming scraped prospect (from the Oxylabs scrape route or n8n).
export type IncomingProspect = {
  name?: string;
  phone?: string;
  website?: string;
  email?: string;
  address?: string;
  sourceUrl?: string;
  externalId?: string;
  rating?: number;
  reviewCount?: number;
};

function normPhone(p?: string | null) {
  return (p ?? '').replace(/\D/g, '');
}

// Dedupes a batch against existing prospects (external_id) and leads (phone/name),
// then inserts the new ones with status='new'. Shared by /api/leads/import and the
// Oxylabs scrape route so the dedupe rules live in one place.
export async function importProspects(opts: {
  product?: string;
  businessType?: string;
  area?: string;
  prospects: IncomingProspect[];
}): Promise<{ inserted: number; skipped: number }> {
  const { product, businessType, area, prospects } = opts;
  const sb = createAdminSupabase();
  if (!sb) return { inserted: 0, skipped: prospects.length };

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
      rating: typeof p.rating === 'number' && Number.isFinite(p.rating) ? p.rating : null,
      reviews_count: typeof p.reviewCount === 'number' && Number.isFinite(p.reviewCount) ? p.reviewCount : null,
      status: 'new',
    });
    if (error) {
      // 23505 = duplicate external_id (already imported) -> count as skipped.
      skipped++;
      continue;
    }
    inserted++;
  }

  return { inserted, skipped };
}
