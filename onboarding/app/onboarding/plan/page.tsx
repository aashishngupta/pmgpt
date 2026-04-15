'use client';

import { useRouter } from 'next/navigation';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { loadState, saveState } from '@/lib/onboarding-store';
import { Check, ArrowRight, Zap, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    badge: '30-day full access',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    highlight: true,
    icon: '🎉',
    features: ['All 6 AI agents', 'Up to 3 connectors', '5 team members', '50 queries/day', 'Standard models (GPT-4o mini)', 'Community support'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$49',
    priceSub: '/mo per seat',
    badge: 'Most popular',
    badgeColor: 'bg-violet-100 text-violet-700',
    highlight: false,
    icon: <Zap className="w-5 h-5 text-violet-500" />,
    features: ['Everything in Free', 'Unlimited connectors', 'Unlimited team members', 'Unlimited queries', 'Frontier models (Claude Opus, GPT-4o)', 'MCP integrations', 'Priority support'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    badge: 'Contact us',
    badgeColor: 'bg-slate-100 text-slate-600',
    highlight: false,
    icon: <Building2 className="w-5 h-5 text-slate-600" />,
    features: ['Everything in Pro', 'SSO / SAML login', 'Data residency controls', 'Dedicated instance', 'SLA & audit logs', 'Dedicated success manager', 'Custom LLM routing'],
  },
];

export default function PlanPage() {
  const router = useRouter();
  const state = loadState();

  const handleStart = () => {
    saveState({ ...state, step: 4, workspace: { ...state.workspace, plan: 'free' } });
    router.push('/onboarding/business-model');
  };

  return (
    <OnboardingLayout>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">You're on the Free plan</h1>
        <p className="text-slate-500 text-sm">30 days of full access. No credit card needed. Upgrade anytime.</p>
      </div>

      <div className="grid gap-3 mb-6">
        {PLANS.map(plan => (
          <div
            key={plan.id}
            className={cn(
              'rounded-2xl border-2 p-5 transition-all',
              plan.highlight ? 'border-violet-500 bg-violet-50/50 shadow-sm' : 'border-slate-200 bg-white'
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="text-xl">{plan.icon}</div>
                <div>
                  <div className="font-semibold text-slate-900">{plan.name}</div>
                  <div className="text-sm text-slate-500">
                    {plan.price}<span className="text-xs text-slate-400">{plan.priceSub}</span>
                  </div>
                </div>
              </div>
              <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', plan.badgeColor)}>
                {plan.badge}
              </span>
            </div>
            <ul className="space-y-1.5">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            {plan.id === 'enterprise' && (
              <a href="mailto:92.aashish@gmail.com" className="inline-block mt-3 text-sm text-violet-600 hover:underline font-medium">
                Contact sales →
              </a>
            )}
          </div>
        ))}
      </div>

      <Button className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-base font-medium gap-2" onClick={handleStart}>
        Get Started — Free <ArrowRight className="w-4 h-4" />
      </Button>
      <p className="text-center text-xs text-slate-400 mt-3">No credit card required. Cancel anytime.</p>
    </OnboardingLayout>
  );
}
