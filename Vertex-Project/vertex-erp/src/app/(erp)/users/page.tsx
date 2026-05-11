import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { listUsers, getSheetData } from '@/lib/sheets';
import { UsersClient } from './users-client';
import type { ErpRole } from '@/types';

export default async function UsersPage() {
  const session = await auth();
  if (!session || session.user.role !== 'Administrator') {
    redirect('/dashboard');
  }

  const [users, roleRows] = await Promise.all([
    listUsers(),
    getSheetData('erp_roles'),
  ]);

  const roles: ErpRole[] = roleRows.map(r => ({
    id:           r.id,
    roleName:     r.role_name,
    description:  r.description,
    isSystemRole: r.is_system_role === 'true',
    createdAt:    r.created_at,
  }));

  return <UsersClient initialUsers={users} roles={roles} />;
}
