import { auth } from '@/lib/auth';
import { listRolePermissions } from '@/lib/sheets';
import { NAV_MODULES } from '@/components/layout/nav-data';
import { ErpShell } from './erp-shell';
import type { AccessLevel } from '@/types';

function allowedCategoryIds(
  rolePerms: Record<string, AccessLevel>,
): string[] {
  return NAV_MODULES.flatMap(mod =>
    mod.categories
      .filter(cat => (rolePerms[cat.id] ?? 'none') !== 'none')
      .map(cat => cat.id),
  );
}

export default async function ErpLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const roleId = session?.user?.roleId ?? '';

  let allowedIds: string[] = [];
  try {
    const allPerms = await listRolePermissions();
    const rolePerms = allPerms[roleId] ?? {};
    if (Object.keys(rolePerms).length > 0) {
      allowedIds = allowedCategoryIds(rolePerms);
    }
  } catch {
    // erp_role_permissions sheet not set up yet — show full nav (empty = show all)
  }

  return <ErpShell allowedIds={allowedIds}>{children}</ErpShell>;
}
