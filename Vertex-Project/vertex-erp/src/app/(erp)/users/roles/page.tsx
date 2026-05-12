import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getSheetData, listRolePermissions } from '@/lib/sheets';
import { RolesClient } from './roles-client';
import type { ErpRole } from '@/types';

export default async function RolesPage() {
  const session = await auth();
  if (!session || session.user.role !== 'Administrator') {
    redirect('/dashboard');
  }

  const [roleRows, permissions] = await Promise.all([
    getSheetData('erp_roles'),
    listRolePermissions(),
  ]);

  const roles: ErpRole[] = roleRows.map(r => ({
    id:           r.id,
    roleName:     r.role_name,
    description:  r.description,
    isSystemRole: r.is_system_role === 'true',
    createdAt:    r.created_at,
  }));

  return <RolesClient roles={roles} initialPermissions={permissions} />;
}
