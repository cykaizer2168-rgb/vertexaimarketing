'use client';

import { usePathname } from 'next/navigation';
import CrmSidebar from '@/components/crm/sidebar';

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const isLogin = path === '/crm/login';

  // Login page renders standalone — no sidebar
  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="crm-shell flex h-screen overflow-hidden bg-[#f5f5f7] bg-[radial-gradient(125%_125%_at_50%_0%,#ffffff_0%,#f4f4f6_42%,#eceef1_100%)] text-gray-900">
      <CrmSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">{children}</div>
    </div>
  );
}
