'use client';

import { Logo } from '@/components/shared/Logo';
import { Progress } from '@/components/ui/progress';

interface Props {
  children: React.ReactNode;
  showProgress?: boolean;
  currentStep?: number;   // 1-3 for phase 2
  totalSteps?: number;
  phase?: string;
}

export function OnboardingLayout({ children, showProgress, currentStep = 1, totalSteps = 3, phase }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2.5">
          <Logo size={28} />
          <span className="font-semibold text-slate-800 text-lg tracking-tight">pmGPT</span>
        </div>
        <a href="mailto:92.aashish@gmail.com" className="text-sm text-slate-500 hover:text-violet-600 transition-colors">
          Need help? →
        </a>
      </header>

      {/* Progress bar for phase 2 */}
      {showProgress && (
        <div className="px-8 pb-2">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-slate-500">{phase || 'Setting up your workspace'}</p>
              <p className="text-xs text-slate-400">Step {currentStep} of {totalSteps}</p>
            </div>
            <Progress value={(currentStep / totalSteps) * 100} className="h-1.5" />
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          {children}
        </div>
      </main>

      <footer className="text-center py-4 text-xs text-slate-400">
        © 2026 pmGPT · <a href="#" className="hover:text-violet-500">Privacy</a> · <a href="#" className="hover:text-violet-500">Terms</a>
      </footer>
    </div>
  );
}
