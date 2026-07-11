import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { hasInternalKey, INTERNAL_KEY_HEADER } from '@/lib/internal-auth';

// Look up a lead + its conversation state by Facebook PSID.
// Internal endpoint (n8n) — requires the x-vertex-key shared secret.
export async function GET(req: NextRequest, ctx: { params: Promise<{ psid: string }> }) {
  if (!hasInternalKey(req.headers.get(INTERNAL_KEY_HEADER))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { psid } = await ctx.params;

  const sb = createAdminSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { data: lead } = await sb
    .from('leads')
    .select('id, name, stage, lead_source, psid')
    .eq('psid', psid)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: state } = await sb
    .from('conversation_state')
    .select('*')
    .eq('psid', psid)
    .maybeSingle();

  return NextResponse.json({ found: !!lead, lead: lead ?? null, state: state ?? null });
}
