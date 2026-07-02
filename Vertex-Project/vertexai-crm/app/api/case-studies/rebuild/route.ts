import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { firePortfolioRebuild } from '@/lib/supabase-admin';

// POST — manually trigger a portfolio rebuild (e.g. after editing content/media).
export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status });

  const result = await firePortfolioRebuild();
  if (!result.triggered) {
    const notConfigured = result.reason === 'no-config';
    return NextResponse.json(
      { error: notConfigured ? 'Rebuild not configured (set VERCEL_TOKEN + PORTFOLIO_PROJECT_ID)' : 'Rebuild trigger failed' },
      { status: notConfigured ? 400 : 502 },
    );
  }
  return NextResponse.json({ ok: true });
}
