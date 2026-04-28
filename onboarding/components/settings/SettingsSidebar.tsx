'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/shared/Logo';
import { cn } from '@/lib/utils';
import { tokenStore, authApi } from '@/lib/auth';
import {
  LayoutDashboard, MessageSquare, Bot, GitBranch,
  Plug, FileText, Settings, Building2, Users,
  Shield, Search, ChevronDown, LogOut, BarChart2,
  FolderOpen, Activity, Lock, SlidersHorizontal,
} from 'lucide-react';

const NAV_PRIMARY = [
  { href: '/dashboard',           icon: LayoutDashboard,   label: 'Home'       },
  { href: '/dashboard/chat',      icon: MessageSquare,     label: 'Chat'       },
  { href: '/dashboard/agents',    icon: Bot,               label: 'Agents'     },
  { href: '/dashboard/workflows', icon: GitBranch,         label: 'Workflows'  },
  { href: '/dashboard/artifacts', icon: FolderOpen,        label: 'Artifacts'  },
  { href: '/dashboard/connectors',icon: Plug,              label: 'Connectors' },
  { href: '/dashboard/workspace', icon: SlidersHorizontal, label: 'Workspace'  },
];

const NAV_SECONDARY = [
  { href: '/dashboard/analytics',     icon: BarChart2,  label: 'Analytics'     },
  { href: '/dashboard/observability', icon: Activity,   label: 'Observability' },
  { href: '/dashboard/audit',         icon: Lock,       label: 'Governance'    },
];

const NAV_SETTINGS = [
  { href: '/settings',           icon: Settings,  label: 'General'   },
  { href: '/settings/team',      icon: Users,     label: 'Team'      },
  { href: '/settings/workspace', icon: Building2, label: 'Workspace' },
  { href: '/settings/security',  icon: Shield,    label: 'Security'  },
];

function NavItem({
  href, icon: Icon, label, badge, isActive, expanded,
}: { href: string; icon: React.ElementType; label: string; badge?: string; isActive: boolean; expanded: boolean }) {
  return (
    <Link
      href={href}
      title={!expanded ? label : undefined}
      className={cn(
        'group flex items-center rounded-md text-[13px] font-medium transition-all duration-150',
        expanded ? 'gap-2 px-2.5 py-[5px]' : 'justify-center px-0 py-[5px]',
        isActive
          ? 'bg-brand-sidebar-active text-brand-ink-inv'
          : 'text-brand-ink-inv-2 hover:bg-brand-sidebar-hover hover:text-brand-ink-inv',
      )}
    >
      <div className="relative flex-shrink-0">
        <Icon className={cn(
          'w-[15px] h-[15px] transition-colors',
          isActive ? 'text-brand-ink-inv' : 'text-brand-ink-inv-2 group-hover:text-brand-ink-inv',
        )} />
        {badge && !expanded && (
          <span className="absolute -top-1 -right-1 w-[6px] h-[6px] rounded-full bg-brand-accent" />
        )}
      </div>
      {expanded && (
        <>
          <span className="flex-1 truncate leading-none">{label}</span>
          {badge && (
            <span className="text-[10px] font-semibold px-1.5 py-[2px] rounded bg-brand-accent text-white min-w-[18px] text-center leading-none">
              {badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

export function SettingsSidebar() {
  const path   = usePathname();
  const router = useRouter();
  const [expanded, setExpanded]   = useState(false);
  const [user, setUser]           = useState<{ name: string; email: string } | null>(null);
  const [workspace, setWorkspace] = useState<{ name: string } | null>(null);

  useEffect(() => {
    setUser(tokenStore.getUser());
    setWorkspace(tokenStore.getWorkspace());
  }, []);

  function handleLogout() {
    authApi.logout();
    router.push('/login');
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') return path === '/dashboard';
    if (href === '/settings')  return path === '/settings';
    return path.startsWith(href);
  };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? 'PM';

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={cn(
        'h-screen bg-brand-sidebar border-r border-brand-sidebar-border flex flex-col flex-shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out',
        expanded ? 'w-[216px]' : 'w-[48px]',
      )}
    >
      {/* Workspace */}
      <div className={cn('pt-3 pb-2 border-b border-brand-sidebar-border', expanded ? 'px-3' : 'px-1.5')}>
        <button className={cn(
          'w-full flex items-center rounded-md hover:bg-brand-sidebar-hover transition-colors',
          expanded ? 'gap-2.5 px-2 py-2' : 'justify-center px-0 py-2',
        )}>
          <Logo size={20} />
          {expanded && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-[13px] font-semibold text-brand-ink-inv leading-tight tracking-tight truncate">
                  {workspace?.name ?? 'pmGPT'}
                </div>
                <div className="text-[10px] text-brand-ink-inv-2 leading-tight">Free plan</div>
              </div>
              <ChevronDown className="w-3 h-3 text-brand-ink-inv-2 flex-shrink-0" />
            </>
          )}
        </button>
      </div>

      {/* Search */}
      <div className={cn('py-2', expanded ? 'px-3' : 'px-1.5')}>
        <button
          title={!expanded ? 'Search' : undefined}
          className={cn(
            'w-full flex items-center rounded-md bg-brand-sidebar-hover hover:bg-brand-sidebar-active text-[12px] text-brand-ink-inv-2 transition-colors',
            expanded ? 'gap-2 px-2.5 py-[6px]' : 'justify-center px-0 py-[6px]',
          )}
        >
          <Search className="w-3.5 h-3.5 flex-shrink-0" />
          {expanded && (
            <>
              <span className="flex-1 text-left">Search</span>
              <kbd className="text-[10px] font-mono opacity-50">⌘K</kbd>
            </>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className={cn('flex-1 py-1 overflow-y-auto flex flex-col gap-4', expanded ? 'px-2' : 'px-1.5')}>
        {/* Primary */}
        <div className="space-y-[1px]">
          {NAV_PRIMARY.map(item => (
            <NavItem key={item.href} {...item} isActive={isActive(item.href)} expanded={expanded} />
          ))}
        </div>

        {/* Divider */}
        <div className={cn('h-px bg-brand-sidebar-border opacity-40', expanded ? 'mx-2' : 'mx-1')} />

        {/* Secondary */}
        <div className="space-y-[1px]">
          {expanded && (
            <div className="px-2.5 mb-1 text-[10px] font-semibold text-brand-ink-inv-2 uppercase tracking-[0.08em] opacity-50 whitespace-nowrap">
              Reporting
            </div>
          )}
          {NAV_SECONDARY.map(item => (
            <NavItem key={item.href} {...item} isActive={isActive(item.href)} expanded={expanded} />
          ))}
        </div>

        {/* Divider */}
        <div className={cn('h-px bg-brand-sidebar-border opacity-40', expanded ? 'mx-2' : 'mx-1')} />

        {/* Settings */}
        <div className="space-y-[1px]">
          {expanded && (
            <div className="px-2.5 mb-1 text-[10px] font-semibold text-brand-ink-inv-2 uppercase tracking-[0.08em] opacity-50 whitespace-nowrap">
              Settings
            </div>
          )}
          {NAV_SETTINGS.map(item => (
            <NavItem key={item.href} {...item} isActive={isActive(item.href)} expanded={expanded} />
          ))}
        </div>
      </nav>

      {/* User */}
      <div className={cn('py-3 border-t border-brand-sidebar-border', expanded ? 'px-3' : 'px-1.5')}>
        {expanded ? (
          <div className="flex items-center gap-1">
            <Link href="/settings" className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-brand-sidebar-hover transition-colors">
                <div className="w-6 h-6 rounded-full bg-brand-accent flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-brand-ink-inv truncate leading-tight">
                    {user?.name ?? 'User'}
                  </div>
                  <div className="text-[10px] text-brand-ink-inv-2 leading-tight truncate">
                    {user?.email ?? ''}
                  </div>
                </div>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 rounded-md text-brand-ink-inv-2 hover:text-brand-ink-inv hover:bg-brand-sidebar-hover transition-colors flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <Link href="/settings" title={user?.name ?? 'Settings'}>
              <div className="w-6 h-6 rounded-full bg-brand-accent flex items-center justify-center text-white text-[10px] font-bold hover:ring-2 hover:ring-brand-accent/50 transition-all">
                {initials}
              </div>
            </Link>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1 rounded-md text-brand-ink-inv-2 hover:text-brand-ink-inv hover:bg-brand-sidebar-hover transition-colors"
            >
              <LogOut className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
