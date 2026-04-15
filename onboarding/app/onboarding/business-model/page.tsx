'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { loadState, saveState } from '@/lib/onboarding-store';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const MODELS = [
  { id: 'B2B SaaS',            emoji: '🏢', desc: 'Selling software to businesses' },
  { id: 'B2C / Consumer',      emoji: '📱', desc: 'Building for end users directly' },
  { id: 'D2C Brand',           emoji: '🛍️', desc: 'Physical or digital products, sold direct' },
  { id: 'Marketplace',         emoji: '🔄', desc: 'Two-sided platform' },
  { id: 'Enterprise Software', emoji: '🏛️', desc: 'Large org, complex procurement' },
  { id: 'Other',               emoji: '✏️', desc: 'Let me describe' },
];

export default function BusinessModelPage() {
  const router = useRouter();
  const state = loadState();
  const [selected, setSelected] = useState<string[]>(state.context.businessModels);
  const [other, setOther] = useState('');
  const [error, setError] = useState('');

  const toggle = (id: string) => {
    setError('');
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleContinue = () => {
    if (selected.length === 0) { setError('Please select at least one option.'); return; }
    const models = selected.includes('Other') && other.trim()
      ? [...selected.filter(x => x !== 'Other'), other.trim()]
      : selected;
    saveState({ ...state, step: 5, context: { ...state.context, businessModels: models } });
    router.push('/onboarding/use-cases');
  };

  return (
    <OnboardingLayout showProgress currentStep={1} totalSteps={3} phase="Setting up your workspace">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">What kind of product are you building?</h1>
        <p className="text-slate-500 text-sm">This helps us configure the right agents and templates for you</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {MODELS.map(m => (
          <button
            key={m.id}
            onClick={() => toggle(m.id)}
            className={cn(
              'step-card text-left p-4 rounded-xl border-2 transition-all',
              selected.includes(m.id) ? 'selected' : ''
            )}
          >
            <div className="text-2xl mb-2">{m.emoji}</div>
            <div className="font-medium text-sm text-slate-800">{m.id}</div>
            <div className="text-xs text-slate-400 mt-0.5">{m.desc}</div>
          </button>
        ))}
      </div>

      {selected.includes('Other') && (
        <Input
          placeholder="Describe your business model…"
          value={other}
          onChange={e => setOther(e.target.value)}
          className="mb-4 h-11"
          autoFocus
        />
      )}

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      <Button className="w-full h-11 bg-violet-600 hover:bg-violet-700 gap-2" onClick={handleContinue}>
        Continue <ArrowRight className="w-4 h-4" />
      </Button>
    </OnboardingLayout>
  );
}
