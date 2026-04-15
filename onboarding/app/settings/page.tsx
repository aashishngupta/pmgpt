'use client';

import { useState, useEffect } from 'react';
import { loadState, saveState } from '@/lib/onboarding-store';
import { OnboardingState } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, Globe, Palette, Bell, Download, Trash2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const TEAM_SIZES = ['Just me', '2–5', '6–20', '20+'];

export default function SettingsPage() {
  const [state, setState] = useState<OnboardingState | null>(null);
  const [saved, setSaved] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [teamSize, setTeamSize] = useState('');

  useEffect(() => {
    const s = loadState();
    setState(s);
    setCompanyName(s.workspace.companyName);
    setTeamSize(s.workspace.teamSize);
  }, []);

  if (!state) return null;

  const handleSave = () => {
    saveState({ workspace: { ...state.workspace, companyName, teamSize } });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">General Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your workspace preferences</p>
      </div>

      {/* Workspace info */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 mb-5">
        <div className="flex items-center gap-2 mb-5">
          <Building2 className="w-4 h-4 text-violet-600" />
          <h2 className="font-semibold text-slate-800">Workspace</h2>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Company name</Label>
            <Input
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              className="h-10"
              placeholder="Your company"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Team size</Label>
            <div className="flex gap-2">
              {TEAM_SIZES.map(size => (
                <button
                  key={size}
                  onClick={() => setTeamSize(size)}
                  className={cn(
                    'flex-1 h-10 rounded-lg border-2 text-sm font-medium transition-all',
                    teamSize === size
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300'
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Plan</Label>
            <div className="flex items-center gap-3">
              <Badge className="bg-violet-100 text-violet-700 border-0 capitalize">
                {state.workspace.plan}
              </Badge>
              <span className="text-xs text-slate-400">
                {state.workspace.plan === 'free' ? '30-day trial active' : 'Billed monthly'}
              </span>
              {state.workspace.plan === 'free' && (
                <Button size="sm" className="ml-auto h-7 text-xs bg-violet-600 hover:bg-violet-700">
                  Upgrade to Pro
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 mb-5">
        <div className="flex items-center gap-2 mb-5">
          <Palette className="w-4 h-4 text-violet-600" />
          <h2 className="font-semibold text-slate-800">Appearance</h2>
        </div>
        <div className="space-y-3">
          {['Light', 'Dark', 'System'].map(theme => (
            <label key={theme} className="flex items-center gap-3 cursor-pointer group">
              <div className={cn(
                'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all',
                theme === 'Light' ? 'border-violet-500' : 'border-slate-300 group-hover:border-violet-300'
              )}>
                {theme === 'Light' && <div className="w-2 h-2 rounded-full bg-violet-500" />}
              </div>
              <span className="text-sm text-slate-700">{theme}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 mb-5">
        <div className="flex items-center gap-2 mb-5">
          <Bell className="w-4 h-4 text-violet-600" />
          <h2 className="font-semibold text-slate-800">Notifications</h2>
        </div>
        <div className="space-y-4">
          {[
            { label: 'Weekly digest email', sub: 'Summary of your team\'s pmGPT activity', on: true },
            { label: 'Agent run completions', sub: 'Notify when a long-running agent task finishes', on: true },
            { label: 'Team activity', sub: 'When teammates make changes to shared docs', on: false },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-700">{item.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{item.sub}</div>
              </div>
              <button
                className={cn(
                  'w-10 h-5.5 rounded-full transition-all relative',
                  item.on ? 'bg-violet-600' : 'bg-slate-200'
                )}
              >
                <span className={cn(
                  'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all',
                  item.on ? 'left-5' : 'left-0.5'
                )} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Danger zone */}
      <section className="bg-white rounded-xl border border-red-100 p-6 mb-6">
        <h2 className="font-semibold text-slate-800 mb-4">Danger zone</h2>
        <Separator className="mb-4" />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-700">Export all data</div>
              <div className="text-xs text-slate-400">Download your workspace data as JSON</div>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-red-600">Delete workspace</div>
              <div className="text-xs text-slate-400">Permanently delete all data. Cannot be undone.</div>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs border-red-200 text-red-600 hover:bg-red-50">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button className="bg-violet-600 hover:bg-violet-700 px-6" onClick={handleSave}>
          Save changes
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle2 className="w-4 h-4" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}
