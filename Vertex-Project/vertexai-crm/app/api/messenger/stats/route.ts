import { NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-admin';

// Aggregate stats for the Lead Capture page's Messenger card. Read-only counts,
// no PII — used by the admin UI to replace the old hardcoded numbers.
export async function GET() {
  const sb = createAdminSupabase();
  if (!sb) return NextResponse.json({ configured: false }, { status: 200 });

  const [{ count: leads }, { count: hot }, lastEvent] = await Promise.all([
    sb.from('leads').select('id', { count: 'exact', head: true }).eq('lead_source', 'messenger'),
    sb.from('conversation_state').select('psid', { count: 'exact', head: true }).eq('tier', 'HOT'),
    sb.from('conversation_state').select('updated_at').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
  ]);

  return NextResponse.json({
    configured: true,
    leads: leads ?? 0,
    hot: hot ?? 0,
    lastEventAt: lastEvent.data?.updated_at ?? null,
  });
}
