'use client';

import { OnboardingState, DEFAULT_STATE } from './types';

const KEY = 'pmgpt_onboarding';

export function loadState(): OnboardingState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: Partial<OnboardingState>): void {
  if (typeof window === 'undefined') return;
  const current = loadState();
  localStorage.setItem(KEY, JSON.stringify({ ...current, ...state }));
}

export function clearState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}

export function updateStep(step: number): void {
  const s = loadState();
  saveState({ ...s, step });
}
