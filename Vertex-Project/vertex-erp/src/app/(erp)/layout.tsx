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

  let filteredModules = NAV_MODULES;
  try {
    const allPerms = await listRolePermissions();
    const rolePerms = allPerms[roleId] ?? {};
    const filtered = filterModules(NAV_MODULES, rolePerms);
    // Only apply filtering if we got real permission data for this role
    if (Object.keys(rolePerms).length > 0 && filtered.length > 0) {
      filteredModules = filtered;
    }
  } catch {
    // erp_role_permissions sheet not set up yet — show full nav
  }

  return <ErpShell filteredModules={filteredModules}>{children}</ErpShell>;
}
