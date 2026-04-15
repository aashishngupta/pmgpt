'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { loadState, saveState } from '@/lib/onboarding-store';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLES = ['Founder / CEO', 'CPO', 'Head of Product', 'VP Product', 'Senior PM', 'PM', 'Aspiring PM'];
const TEAM_SIZES = [
  { value: 'solo',  label: 'Just me',  desc: 'Solo founder or PM' },
  { value: '2-5',   label: '2–5',      desc: 'Small team' },
  { value: '6-20',  label: '6–20',     desc: 'Growing team' },
  { value: '20+',   label: '20+',      desc: 'Enterprise' },
];

export default function WorkspacePage() {
  const router = useRouter();
  const state = loadState();
  const [company, setCompany] = useState(state.workspace.companyName);
  const [role, setRole] = useState(state.workspace.userRole);
  const [teamSize, setTeamSize] = useState(state.workspace.teamSize);
  const [error, setError] = useState('');

  const handleContinue = () => {
    if (!company.trim()) { setError('Company name is required.'); return; }
    if (!role) { setError('Please select your role.'); return; }
    if (!teamSize) { setError('Please select your team size.'); return; }
    saveState({ ...state, step: 3, workspace: { ...state.workspace, companyName: company, userRole: role, teamSize } });
    router.push('/onboarding/plan');
  };

  return (
    <OnboardingLayout>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Let's set up your workspace</h1>
        <p className="text-slate-500 text-sm">Takes 30 seconds. We'll personalise pmGPT for your team.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="company">Company name</Label>
          <Input
            id="company"
            placeholder="Acme Corp"
            value={company}
            onChange={e => { setCompany(e.target.value); setError(''); }}
            className="h-11"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Your role</Label>
          <Select value={role} onValueChange={v => { setRole(v); setError(''); }}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Team size</Label>
          <div className="grid grid-cols-4 gap-2">
            {TEAM_SIZES.map(t => (
              <button
                key={t.value}
                onClick={() => { setTeamSize(t.value); setError(''); }}
                className={cn(
                  'rounded-xl p-3 border-2 text-center transition-all',
                  teamSize === t.value
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-slate-200 hover:border-violet-300 hover:bg-slate-50'
                )}
              >
                <div className="font-semibold text-sm text-slate-800">{t.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button className="w-full h-11 bg-violet-600 hover:bg-violet-700 gap-2" onClick={handleContinue}>
          Continue <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </OnboardingLayout>
  );
}
