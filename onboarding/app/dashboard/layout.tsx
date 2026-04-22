import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { Bell, HelpCircle, Search } from 'lucide-react';

function TopBar() {
  return (
    <header className="h-[48px] bg-brand-surface border-b border-brand-line flex items-center px-5 gap-4 flex-shrink-0">

      {/* Search — command-palette style */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-brand-line bg-brand-elevated hover:border-brand-ink-4 transition-colors cursor-pointer group max-w-xs w-full">
        <Search className="w-3.5 h-3.5 text-brand-ink-3 flex-shrink-0" />
        <span className="text-[13px] text-brand-ink-4 flex-1 select-none">Search…</span>
        <kbd className="text-[10px] font-mono text-brand-ink-4 bg-brand-surface border border-brand-line px-1.5 py-0.5 rounded">
          ⌘K
        </kbd>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <button
          className="p-1.5 rounded-md text-brand-ink-3 hover:text-brand-ink hover:bg-brand-elevated transition-colors"
          title="Help"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
        <button
          className="relative p-1.5 rounded-md text-brand-ink-3 hover:text-brand-ink hover:bg-brand-elevated transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-[6px] h-[6px] rounded-full bg-brand-accent border-2 border-brand-surface" />
        </button>
        <div className="w-[28px] h-[28px] rounded-full bg-brand-accent flex items-center justify-center text-white text-[11px] font-semibold ml-1 cursor-pointer select-none">
          A
        </div>
      </div>
    </header>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-brand-canvas overflow-hidden">
      <SettingsSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
