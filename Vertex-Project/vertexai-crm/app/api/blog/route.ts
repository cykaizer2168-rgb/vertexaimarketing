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

// GET — list all posts (admin: includes drafts).
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status });

  const sb = createAdminSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { data, error } = await sb
    .from('posts')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('updated_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data ?? [] });
}

// POST — create a new post.
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

  const { data, error } = await sb.from('posts').insert(row).select('*').single();
  if (error) {
    const status = error.code === '23505' ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  if (row.published) await firePortfolioRebuild();
  return NextResponse.json({ post: data }, { status: 201 });
}
