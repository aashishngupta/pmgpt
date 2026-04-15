'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { Button } from '@/components/ui/button';
import { loadState, saveState } from '@/lib/onboarding-store';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const TOOLS = [
  { id: 'Jira',              emoji: '🔵', color: 'bg-blue-50' },
  { id: 'Linear',            emoji: '⚫', color: 'bg-slate-50' },
  { id: 'Notion',            emoji: '⬜', color: 'bg-slate-50' },
  { id: 'Confluence',        emoji: '🔷', color: 'bg-blue-50' },
  { id: 'Slack',             emoji: '💬', color: 'bg-yellow-50' },
  { id: 'Amplitude',         emoji: '📈', color: 'bg-orange-50' },
  { id: 'Mixpanel',          emoji: '🔮', color: 'bg-purple-50' },
  { id: 'Intercom',          emoji: '💙', color: 'bg-blue-50' },
  { id: 'Zendesk',           emoji: '🟢', color: 'bg-green-50' },
  { id: 'Figma',             emoji: '🎨', color: 'bg-pink-50' },
  { id: 'Google Workspace',  emoji: '🌈', color: 'bg-blue-50' },
  { id: 'None yet',          emoji: '✨', color: 'bg-slate-50' },
];

export default function ToolsPage() {
  const router = useRouter();
  const state = loadState();
  const [selected, setSelected] = useState<string[]>(state.context.existingTools);

  const toggle = (id: string) => {
    if (id === 'None yet') { setSelected(['None yet']); return; }
    setSelected(prev => {
      const without = prev.filter(x => x !== 'None yet');
      return without.includes(id) ? without.filter(x => x !== id) : [...without, id];
    });
  };

  const handleContinue = () => {
    saveState({ ...state, step: 7, context: { ...state.context, existingTools: selected } });
    router.push('/dashboard');
  };

  return (
    <OnboardingLayout showProgress currentStep={3} totalSteps={3} phase="Setting up your workspace">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Which tools does your team already use?</h1>
        <p className="text-slate-500 text-sm">We'll suggest the right connectors later — no setup needed now</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {TOOLS.map(tool => (
          <button
            key={tool.id}
            onClick={() => toggle(tool.id)}
            className={cn(
              'rounded-xl border-2 p-3 text-center transition-all',
              selected.includes(tool.id)
                ? 'border-violet-500 bg-violet-50'
                : 'border-slate-200 bg-white hover:border-violet-300 hover:bg-slate-50'
            )}
          >
            <div className="text-2xl mb-1">{tool.emoji}</div>
            <div className="text-xs font-medium text-slate-700 leading-tight">{tool.id}</div>
          </button>
        ))}
      </div>

      <Button className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-base gap-2" onClick={handleContinue}>
        Take me to pmGPT <ArrowRight className="w-4 h-4" />
      </Button>
      <p className="text-center text-xs text-slate-400 mt-3">
        You can connect tools anytime from Settings → Sources
      </p>
    </OnboardingLayout>
  );
}
