'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/shared/Logo';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Settings, Users, Puzzle, BookOpen, ChevronRight } from 'lucide-react';

const NAV = [
  { href: '/dashboard',           icon: LayoutDashboard, label: 'Home' },
  { href: '/settings',            icon: Settings,         label: 'Settings' },
  { href: '/settings/team',       icon: Users,            label: 'Team' },
  { href: '/settings/sources',    icon: Puzzle,           label: 'Sources' },
  { href: '/settings/context',    icon: BookOpen,         label: 'Context Library' },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-60 min-h-screen bg-white border-r border-slate-100 flex flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-100">
        <Logo size={26} />
        <span className="font-bold text-slate-800 tracking-tight">pmGPT</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(item => {
          const active = path === item.href || (item.href !== '/dashboard' && path.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-violet-50 text-violet-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
              {active && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            A
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-800 truncate">Aashish Gupta</div>
            <div className="text-xs text-slate-400">Free plan</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
