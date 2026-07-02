import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { createAdminSupabase, firePortfolioRebuild } from '@/lib/supabase-admin';

// Normalize an incoming case study payload into DB columns.
function toRow(body: Record<string, unknown>) {
  return {
    slug: String(body.slug ?? '').trim(),
    title: String(body.title ?? '').trim(),
    category: (body.category as string) ?? null,
    role: (body.role as string) ?? null,
    date: (body.date as string) ?? null,
    summary: (body.summary as string) ?? null,
    hero_type: body.hero_type === 'video' ? 'video' : 'image',
    hero_src: (body.hero_src as string) ?? null,
    hero_poster: (body.hero_poster as string) ?? null,
    hero_alt: (body.hero_alt as string) ?? null,
    hero_placeholder: body.hero_placeholder !== false,
    og_image: (body.og_image as string) ?? null,
    sections: Array.isArray(body.sections) ? body.sections : [],
    results: Array.isArray(body.results) ? body.results : [],
    tech_stack: Array.isArray(body.tech_stack) ? body.tech_stack : [],
    published: body.published === true,
    sort_order: Number.isFinite(body.sort_order as number) ? (body.sort_order as number) : 0,
  };
}

// GET — list all case studies (admin: includes drafts).
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status });

  const sb = createAdminSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { data, error } = await sb
    .from('case_studies')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('updated_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ caseStudies: data ?? [] });
}

// POST — create a new case study.
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const row = toRow(body);
  if (!row.slug || !row.title) {
    return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 });
  }

  const sb = createAdminSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { data, error } = await sb.from('case_studies').insert(row).select('*').single();
  if (error) {
    const status = error.code === '23505' ? 409 : 500; // unique_violation → 409
    return NextResponse.json({ error: error.message }, { status });
  }

  // Publishing a new case study should refresh the live site.
  if (row.published) await firePortfolioRebuild();

  return NextResponse.json({ caseStudy: data }, { status: 201 });
}
