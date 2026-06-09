import { NextResponse } from 'next/server';
import { getSessionUser, isAdminEmail } from '@/lib/admin-auth';

// Lightweight identity endpoint for the client (e.g. show admin-only nav).
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ email: null, isAdmin: false });
  return NextResponse.json({ email: user.email, isAdmin: isAdminEmail(user.email) });
}
