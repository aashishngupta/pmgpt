import { SettingsSidebar } from '@/components/settings/SettingsSidebar';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <SettingsSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
