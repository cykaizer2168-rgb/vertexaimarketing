import { auth } from '@/lib/auth';
import { listRolePermissions } from '@/lib/sheets';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== 'Administrator') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const permissions = await listRolePermissions();
    return NextResponse.json({ permissions });
  } catch {
    return NextResponse.json({ error: 'Failed to load permissions' }, { status: 500 });
  }
}
