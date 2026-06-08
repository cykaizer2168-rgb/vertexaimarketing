import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-admin';

// Converts staged prospects into real leads. Idempotent per prospect:
// already-approved prospects are skipped.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { prospectIds } = body as { prospectIds?: string[] };
  if (!Array.isArray(prospectIds) || prospectIds.length === 0) {
    return NextResponse.json({ error: 'prospectIds[] required' }, { status: 400 });
  }

  const sb = createAdminSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { data: rows } = await sb.from('prospects').select('*').in('id', prospectIds);
  let converted = 0;

  for (const p of rows ?? []) {
    if (p.status === 'approved' && p.lead_id) continue;
    const { data: lead, error } = await sb
      .from('leads')
      .insert({
        name: p.name,
        mobile: p.phone ?? '',
        email: p.email ?? '',
        location: p.area ?? '',
        message: p.business_type ? `${p.business_type} — ${p.address ?? ''}`.trim() : (p.address ?? ''),
        stage: 'new',
        lead_source: 'oxylabs_gmaps',
        sequence_status: 'queued',
        notes: p.website ? `Website: ${p.website}` : null,
      })
      .select('id')
      .single();
    if (error || !lead) continue;
    await sb.from('prospects').update({ status: 'approved', lead_id: lead.id }).eq('id', p.id);
    converted++;
  }

  return NextResponse.json({ converted });
}
