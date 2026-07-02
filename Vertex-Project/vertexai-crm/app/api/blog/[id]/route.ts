import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { createAdminSupabase, firePortfolioRebuild } from '@/lib/supabase-admin';

function toRow(body: Record<string, unknown>) {
  return {
    slug: String(body.slug ?? '').trim(),
    title: String(body.title ?? '').trim(),
    excerpt: (body.excerpt as string) ?? null,
    cover_image: (body.cover_image as string) ?? null,
    body: (body.body as string) ?? null,
    tags: Array.isArray(body.tags) ? body.tags : [],
    author: (body.author as string) || 'Angelo B. Franco',
    og_image: (body.og_image as string) ?? null,
    published: body.published === true,
    sort_order: Number.isFinite(body.sort_order as number) ? (body.sort_order as number) : 0,
  };
}

// PUT — update a post.
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

  const { data, error } = await sb.from('posts').update(row).eq('id', id).select('*').single();
  if (error) {
    const status = error.code === '23505' ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  if (row.published) await firePortfolioRebuild();
  return NextResponse.json({ post: data });
}

// DELETE — remove a post (rebuild if it was live).
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status });

  const { id } = await ctx.params;
  const sb = createAdminSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { data: existing } = await sb.from('posts').select('published').eq('id', id).single();
  const { error } = await sb.from('posts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (existing?.published) await firePortfolioRebuild();
  return NextResponse.json({ ok: true });
}
