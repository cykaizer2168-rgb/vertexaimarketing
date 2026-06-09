import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAdminEmail } from '@/lib/admin-auth';
import { createAdminSupabase } from '@/lib/supabase-admin';

// List CRM users (admin only).
export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: 'Forbidden' }, { status: gate.status });

  const sb = createAdminSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { data, error } = await sb.auth.admin.listUsers();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const users = data.users.map((u) => ({
    id: u.id,
    email: u.email,
    name: (u.user_metadata?.name as string) ?? '',
    isAdmin: isAdminEmail(u.email),
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
  }));
  return NextResponse.json({ users });
}

// Create a new user with a set password (admin only).
export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: 'Forbidden' }, { status: gate.status });

  const body = await req.json().catch(() => ({}));
  const { email, password, name } = body as { email?: string; password?: string; name?: string };
  if (!email || !password || password.length < 6) {
    return NextResponse.json({ error: 'Email and a password (min 6 chars) are required' }, { status: 400 });
  }

  const sb = createAdminSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { data, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: name ?? '' },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, id: data.user?.id });
}

// Remove a user (admin only). Admins cannot be deleted via this endpoint.
export async function DELETE(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: 'Forbidden' }, { status: gate.status });

  const body = await req.json().catch(() => ({}));
  const { id, email } = body as { id?: string; email?: string };
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  if (isAdminEmail(email)) {
    return NextResponse.json({ error: 'Cannot remove an admin' }, { status: 400 });
  }

  const sb = createAdminSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { error } = await sb.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
