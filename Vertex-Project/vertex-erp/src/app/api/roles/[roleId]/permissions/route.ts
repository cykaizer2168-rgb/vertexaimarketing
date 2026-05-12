import { auth } from '@/lib/auth';
import { setRolePermissions } from '@/lib/sheets';
import { NextResponse } from 'next/server';
import type { AccessLevel } from '@/types';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ roleId: string }> },
) {
  const session = await auth();
  if (!session || session.user.role !== 'Administrator') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { roleId } = await params;

  const body = await req.json() as { permissions?: Record<string, AccessLevel> };
  if (!body.permissions || typeof body.permissions !== 'object') {
    return NextResponse.json(
      { error: 'permissions object is required' },
      { status: 400 },
    );
  }

  try {
    await setRolePermissions(roleId, body.permissions);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save permissions' }, { status: 500 });
  }
}
