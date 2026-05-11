'use client';

import { Bell, Menu, LogOut, Settings, User, ChevronDown, Search } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TopbarProps {
  onMenuToggle: () => void;
  onOpenPalette?: () => void;
}

export function Topbar({ onMenuToggle, onOpenPalette }: TopbarProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <header className="flex h-11 shrink-0 items-center border-b border-[#E5E7EB] bg-white px-4 gap-3">
      {/* Sidebar toggle — mobile opens drawer, desktop handled by sidebar itself */}
      <button
        className="flex items-center justify-center h-7 w-7 rounded text-slate-500 hover:bg-slate-100 transition-colors lg:hidden"
        onClick={onMenuToggle}
        aria-label="Toggle navigation"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Company + Fiscal Year selector */}
      <div className="hidden sm:flex items-center gap-1 cursor-pointer group">
        <div>
          <span className="text-[12px] font-semibold text-slate-800">Juan dela Cruz Trading</span>
          <span className="mx-1.5 text-slate-300 text-[11px]">|</span>
          <span className="text-[11px] text-slate-500">FY 2024</span>
        </div>
        <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-slate-600 transition-colors ml-0.5" />
      </div>

      {/* Search — clicking opens command palette */}
      <button
        onClick={onOpenPalette}
        className="hidden md:flex flex-1 max-w-xs items-center gap-2 rounded border border-slate-200 bg-slate-50 px-2.5 py-1 ml-2 cursor-text hover:border-slate-300 hover:bg-white transition-colors text-left"
      >
        <Search className="h-3 w-3 text-slate-400 shrink-0" />
        <span className="flex-1 text-[11px] text-slate-400 min-w-0">Search transactions, invoices…</span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1 py-0.5 text-[9px] text-slate-400 font-medium">
          ⌘K
        </kbd>
      </button>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-1">
        {/* Notifications */}
        <button className="relative flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
        </button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1.5 rounded px-1.5 py-1 hover:bg-slate-100 transition-colors outline-none ml-1">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user?.image ?? ''} alt={user?.name ?? 'User'} />
              <AvatarFallback className="bg-blue-600 text-white text-[9px] font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-left">
              <p className="text-[11px] font-medium text-slate-700 leading-none">{user?.name ?? 'User'}</p>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400 hidden sm:block" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48 text-xs">
            <DropdownMenuLabel className="text-[11px]">
              <div>
                <p className="font-medium text-slate-800">{user?.name ?? 'User'}</p>
                <p className="text-slate-500 font-normal truncate">{user?.email ?? ''}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-[12px] gap-2">
              <User className="h-3.5 w-3.5 text-slate-500" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-[12px] gap-2">
              <Settings className="h-3.5 w-3.5 text-slate-500" />
              Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-[12px] gap-2 text-red-600"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
