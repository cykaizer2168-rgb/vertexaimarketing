import { auth } from '@/lib/auth';
import { listUsers, addUser } from '@/lib/sheets';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== 'Administrator') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const users = await listUsers();
    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== 'Administrator') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json() as { email?: string; fullName?: string; roleId?: string };
  const { email, fullName, roleId } = body;

  if (!email || !fullName || !roleId) {
    return NextResponse.json(
      { error: 'email, fullName, and roleId are required' },
      { status: 400 },
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  try {
    const user = await addUser(email, fullName, roleId);
    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === 'EMAIL_EXISTS') {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: 'Failed to add user' }, { status: 500 });
  }
}
