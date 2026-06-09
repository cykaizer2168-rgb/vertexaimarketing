import { createServerSupabase } from './supabase-server';

// Admins are configured via the ADMIN_EMAILS env var (comma-separated).
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function getSessionUser() {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && adminEmails().includes(email.toLowerCase());
}

// Returns ok=true only for a logged-in admin; otherwise an HTTP status to return.
export async function requireAdmin(): Promise<
  { ok: true; email: string } | { ok: false; status: number }
> {
  const user = await getSessionUser();
  if (!user) return { ok: false, status: 401 };
  if (!isAdminEmail(user.email)) return { ok: false, status: 403 };
  return { ok: true, email: user.email! };
}
