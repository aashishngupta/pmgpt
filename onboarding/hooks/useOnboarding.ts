'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingState, DEFAULT_STATE } from '@/lib/types';
import { loadState, saveState } from '@/lib/onboarding-store';

const STEP_ROUTES: Record<number, string> = {
  1: '/onboarding/signup',
  2: '/onboarding/workspace',
  3: '/onboarding/plan',
  4: '/onboarding/business-model',
  5: '/onboarding/use-cases',
  6: '/onboarding/tools',
  7: '/dashboard',
};

export function useOnboarding() {
  const router = useRouter();
  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  const update = useCallback((patch: Partial<OnboardingState>) => {
    setState(prev => {
      const next = { ...prev, ...patch };
      saveState(next);
      return next;
    });
  }, []);

  const next = useCallback(() => {
    const nextStep = state.step + 1;
    update({ step: nextStep });
    const route = STEP_ROUTES[nextStep];
    if (route) router.push(route);
  }, [state.step, update, router]);

  const goTo = useCallback((step: number) => {
    update({ step });
    const route = STEP_ROUTES[step];
    if (route) router.push(route);
  }, [update, router]);

  return { state, update, next, goTo, hydrated };
}
