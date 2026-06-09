'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Columns2, Users, Inbox, FormInput, SunMedium, BarChart2, Settings, LogOut, Megaphone, CalendarDays, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createBrowserSupabase } from '@/lib/supabase-browser';

const nav = [
  { section: 'Main' },
  { label: 'Dashboard',       href: '/crm',            icon: LayoutDashboard, badge: null },
  { label: 'Pipeline',        href: '/crm/pipeline',   icon: Columns2,        badge: '9' },
  { label: 'All Leads',       href: '/crm/leads',      icon: Users,           badge: null },
  { section: 'Automation' },
  { label: 'Inbox',           href: '/crm/inbox',      icon: Inbox,           badge: null },
  { label: 'Lead Capture',    href: '/crm/capture',    icon: FormInput,       badge: null },
  { label: 'AI Outreach',     href: '/crm/outreach',   icon: Megaphone,       badge: null },
  { label: 'Calendar',        href: '/crm/calendar',   icon: CalendarDays,    badge: null },
  { section: 'Tools' },
  { label: 'Projects',        href: '/crm/projects',   icon: SunMedium,       badge: null },
  { label: 'Reports',         href: '#',               icon: BarChart2,       badge: null },
  { label: 'Users',           href: '/crm/users',      icon: UserCog,         badge: null, adminOnly: true },
  { label: 'Settings',        href: '#',               icon: Settings,        badge: null },
];

export default function CrmSidebar() {
  const path = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => setIsAdmin(!!d.isAdmin))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push('/crm/login');
    router.refresh();
  };

  return (
    <aside className="w-[224px] min-w-[224px] flex flex-col h-screen sticky top-0 bg-white/55 backdrop-blur-2xl border-r border-black/[0.06]">
      {/* Logo */}
      <div className="px-4 py-4">
        <div className="bg-white rounded-2xl px-3 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] flex items-center justify-center">
          <img src="/images/logo.png" alt="Balcony Solar PH" className="h-9 w-auto object-contain" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 pb-2 overflow-y-auto">
        {nav.map((item, i) => {
          if ('adminOnly' in item && item.adminOnly && !isAdmin) return null;
          if ('section' in item) {
            return (
              <div key={i} className="px-3 pt-4 pb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-[0.08em]">
                {item.section}
              </div>
            );
          }
          const active = item.href !== '#' && (item.href === '/crm' ? path === '/crm' : path.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-2.5 px-3 py-[8px] my-[1px] rounded-xl text-[13px] transition-all duration-150',
                active
                  ? 'bg-white text-gray-900 font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.05]'
                  : 'text-gray-500 hover:bg-black/[0.04] hover:text-gray-900'
              )}
            >
              <Icon className={cn('w-[17px] h-[17px] shrink-0 transition-colors', active ? 'text-amber-500' : 'text-gray-400 group-hover:text-gray-600')} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span
                  className={cn(
                    'text-[10px] rounded-full px-1.5 py-0.5 font-semibold',
                    active ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-600'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-black/[0.06]">
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-black/[0.03] transition-colors">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-sm">
            BS
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-semibold text-gray-900">Admin</div>
            <div className="text-[10.5px] text-gray-400">Balcony Solar PH</div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
