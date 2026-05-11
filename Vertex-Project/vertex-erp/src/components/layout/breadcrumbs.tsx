'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { NAV_MODULES, findByHref } from './nav-data';

export function Breadcrumbs() {
  const pathname = usePathname();
  const match    = findByHref(pathname, NAV_MODULES);

  if (!match || pathname === '/dashboard') return null;

  return (
    <div className="flex items-center gap-1 px-5 py-1.5 border-b border-[#F1F5F9] bg-white text-[11px] text-slate-500">
      <Link href="/dashboard" className="flex items-center gap-1 hover:text-blue-600 transition-colors">
        <Home className="h-3 w-3" />
      </Link>
      <ChevronRight className="h-3 w-3 text-slate-300" />
      <span className="text-slate-400">{match.module.label}</span>
      <ChevronRight className="h-3 w-3 text-slate-300" />
      <span className="text-slate-400">{match.category.label}</span>
      <ChevronRight className="h-3 w-3 text-slate-300" />
      <span className="font-medium text-slate-700">{match.item.label}</span>
    </div>
  );
}
