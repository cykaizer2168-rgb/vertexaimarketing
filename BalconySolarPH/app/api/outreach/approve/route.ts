import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { convertProspectToLead } from '@/lib/prospects-import';

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
    const leadId = await convertProspectToLead(sb, p);
    if (leadId) converted++;
  }

  return NextResponse.json({ converted });
}
