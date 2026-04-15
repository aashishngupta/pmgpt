'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { Button } from '@/components/ui/button';
import { loadState, saveState } from '@/lib/onboarding-store';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const USE_CASES = [
  'Writing PRDs and specs',
  'Roadmap planning',
  'Customer feedback synthesis',
  'Sprint planning and user stories',
  'Product strategy and OKRs',
  'Competitive research',
  'Stakeholder communication',
  'Analytics interpretation',
  'PM interview prep / upskilling',
  'Team collaboration and alignment',
];

export default function UseCasesPage() {
  const router = useRouter();
  const state = loadState();
  const [selected, setSelected] = useState<string[]>(state.context.useCases);
  const [shaking, setShaking] = useState(false);
  const [error, setError] = useState('');
  const gridRef = useRef<HTMLDivElement>(null);

  const toggle = (id: string) => {
    setError('');
    if (selected.includes(id)) {
      setSelected(prev => prev.filter(x => x !== id));
    } else {
      if (selected.length >= 3) {
        setShaking(true);
        setError('Pick your top 3 — unselect one to choose another');
        setTimeout(() => setShaking(false), 400);
        return;
      }
      setSelected(prev => [...prev, id]);
    }
  };

  const handleContinue = () => {
    if (selected.length === 0) { setError('Please select at least one use case.'); return; }
    saveState({ ...state, step: 6, context: { ...state.context, useCases: selected } });
    router.push('/onboarding/tools');
  };

  return (
    <OnboardingLayout showProgress currentStep={2} totalSteps={3} phase="Setting up your workspace">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">What are you looking to use pmGPT for?</h1>
        <p className="text-slate-500 text-sm">
          Pick your top 3 — we'll prioritize these in your workspace
          <span className="ml-2 inline-flex items-center gap-1 bg-violet-100 text-violet-700 text-xs font-medium px-2 py-0.5 rounded-full">
            {selected.length}/3 selected
          </span>
        </p>
      </div>

      <div
        ref={gridRef}
        className={cn('flex flex-wrap gap-2 mb-4', shaking && 'shake')}
      >
        {USE_CASES.map(uc => (
          <button
            key={uc}
            onClick={() => toggle(uc)}
            className={cn(
              'px-4 py-2 rounded-full border-2 text-sm font-medium transition-all',
              selected.includes(uc)
                ? 'border-violet-500 bg-violet-100 text-violet-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-slate-50'
            )}
          >
            {uc}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      <Button
        className="w-full h-11 bg-violet-600 hover:bg-violet-700 gap-2"
        onClick={handleContinue}
        disabled={selected.length === 0}
      >
        Continue <ArrowRight className="w-4 h-4" />
      </Button>
    </OnboardingLayout>
  );
}
