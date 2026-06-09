'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Columns2, Users, Inbox, FormInput, SunMedium, BarChart2, Settings, LogOut, Megaphone, CalendarDays } from 'lucide-react';
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
  { label: 'Settings',        href: '#',               icon: Settings,        badge: null },
];

export default function CrmSidebar() {
  const path = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push('/crm/login');
    router.refresh();
  };

  return (
    <aside className="w-[210px] min-w-[210px] bg-[#0c1f44] flex flex-col h-screen sticky top-0">
      {/* Logo — white card so it stands out on navy */}
      <div className="px-3 py-4 border-b border-white/10">
        <div className="bg-white rounded-xl px-3 py-2.5 shadow-md flex items-center justify-center">
          <img
            src="/images/logo.png"
            alt="Balcony Solar PH"
            className="h-10 w-auto object-contain"
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {nav.map((item, i) => {
          if ('section' in item) {
            return (
              <div key={i} className="px-4 pt-4 pb-1 text-[10px] font-semibold text-white/35 uppercase tracking-wider">
                {item.section}
              </div>
            );
          }
          const active = item.href !== '#' && (item.href === '/crm' ? path === '/crm' : path.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-4 py-[9px] text-[12.5px] border-l-[3px] transition-all duration-100',
                active
                  ? 'bg-white/10 text-white border-yellow-400 font-semibold'
                  : 'text-white/65 border-transparent hover:bg-white/5 hover:text-white'
              )}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className={cn('text-[10px] rounded-full px-1.5 py-0.5 font-semibold', active ? 'bg-yellow-400 text-black' : 'bg-green-400/20 text-green-300')}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-4 py-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/10 text-white text-[11px] font-bold flex items-center justify-center shrink-0">BS</div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium text-white">Admin</div>
            <div className="text-[10px] text-white/45">Balcony Solar PH</div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-lg text-white/50 hover:text-red-300 hover:bg-red-500/20 transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
