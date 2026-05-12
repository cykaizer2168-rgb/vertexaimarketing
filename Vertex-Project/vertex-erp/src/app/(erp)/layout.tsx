import { auth } from '@/lib/auth';
import { listRolePermissions } from '@/lib/sheets';
import { NAV_MODULES, type ErpNavModule } from '@/components/layout/nav-data';
import { ErpShell } from './erp-shell';
import type { AccessLevel } from '@/types';

function filterModules(
  modules: ErpNavModule[],
  rolePerms: Record<string, AccessLevel>,
): ErpNavModule[] {
  return modules
    .map(mod => ({
      ...mod,
      categories: mod.categories.filter(
        cat => (rolePerms[cat.id] ?? 'none') !== 'none',
      ),
    }))
    .filter(mod => mod.categories.length > 0);
}

export default async function ErpLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const roleId = session?.user?.roleId ?? '';

  const allPerms = await listRolePermissions();
  const rolePerms = allPerms[roleId] ?? {};
  const filteredModules = filterModules(NAV_MODULES, rolePerms);

  return <ErpShell filteredModules={filteredModules}>{children}</ErpShell>;
}
