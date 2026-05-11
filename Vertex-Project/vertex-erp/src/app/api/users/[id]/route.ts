import { auth } from '@/lib/auth';
import { updateUserById } from '@/lib/sheets';
import { NextResponse } from 'next/server';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || session.user.role !== 'Administrator') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const body = await req.json() as {
    fullName?: string;
    roleId?:   string;
    status?:   'active' | 'disabled';
  };

  const fields: { fullName?: string; roleId?: string; status?: 'active' | 'disabled' } = {};
  if (body.fullName !== undefined) fields.fullName = body.fullName;
  if (body.roleId   !== undefined) fields.roleId   = body.roleId;
  if (body.status   !== undefined) fields.status   = body.status;

  if (Object.keys(fields).length === 0) {
    return NextResponse.json(
      { error: 'At least one field must be provided' },
      { status: 400 },
    );
  }

  try {
    await updateUserById(id, fields);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'USER_NOT_FOUND') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
