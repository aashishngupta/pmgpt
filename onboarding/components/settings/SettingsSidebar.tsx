'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/shared/Logo';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Building2, Bot, Users, Puzzle,
  BookOpen, Shield, ChevronRight, Settings
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    label: 'Dashboard',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { href: '/settings',           icon: Settings,       label: 'General' },
      { href: '/settings/agents',    icon: Bot,            label: 'Agents' },
      { href: '/settings/team',      icon: Users,          label: 'Team & Roles' },
      { href: '/settings/sources',   icon: Puzzle,         label: 'Sources & MCP' },
      { href: '/settings/context',   icon: BookOpen,       label: 'Context Library' },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { href: '/settings/workspace', icon: Building2,  label: 'Workspace' },
      { href: '/settings/security',  icon: Shield,     label: 'Security' },
    ],
  },
];

export function SettingsSidebar() {
  const path = usePathname();

  const isActive = (href: string) => {
    if (href === '/settings') return path === '/settings';
    if (href === '/dashboard') return path === '/dashboard';
    return path.startsWith(href);
  };

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-slate-100 flex flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-100">
        <Logo size={26} />
        <span className="font-bold text-slate-800 tracking-tight">pmGPT</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <div className="px-3 mb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const active = isActive(item.href);
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
            </div>
          </div>
        ))}
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
