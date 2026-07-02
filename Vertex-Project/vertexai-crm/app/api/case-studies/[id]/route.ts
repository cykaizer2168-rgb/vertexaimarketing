import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { createAdminSupabase, firePortfolioRebuild } from '@/lib/supabase-admin';

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

// PUT — update an existing case study.
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const row = toRow(body);
  if (!row.slug || !row.title) {
    return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 });
  }

  const sb = createAdminSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { data, error } = await sb.from('case_studies').update(row).eq('id', id).select('*').single();
  if (error) {
    const status = error.code === '23505' ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  // Any edit to a published case study should refresh the live site.
  if (row.published) await firePortfolioRebuild();

  return NextResponse.json({ caseStudy: data });
}

// DELETE — remove a case study (and rebuild if it was live).
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status });

  const { id } = await ctx.params;
  const sb = createAdminSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { data: existing } = await sb.from('case_studies').select('published').eq('id', id).single();
  const { error } = await sb.from('case_studies').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (existing?.published) await firePortfolioRebuild();

  return NextResponse.json({ ok: true });
}
