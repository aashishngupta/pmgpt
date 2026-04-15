'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadState } from '@/lib/onboarding-store';
import { OnboardingState } from '@/lib/types';
import { AGENTS, USE_CASE_AGENT_MAP, BUSINESS_MODEL_CASES } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckSquare, Square, Puzzle, Users, Cog, CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const USE_CASE_ICONS: Record<string, string> = {
  'Writing PRDs and specs':           '📄',
  'Roadmap planning':                 '🗺️',
  'Customer feedback synthesis':      '💬',
  'Sprint planning and user stories': '⚡',
  'Product strategy and OKRs':        '🎯',
  'Competitive research':             '🔍',
  'Stakeholder communication':        '📢',
  'Analytics interpretation':         '📊',
  'PM interview prep / upskilling':   '🎓',
  'Team collaboration and alignment': '🤝',
};

const SETUP_CHECKLIST = [
  { id: 'workspace',  label: 'Workspace created',    done: true,  href: '/settings' },
  { id: 'team',       label: 'Invite your team',      done: false, href: '/settings/team' },
  { id: 'agents',     label: 'Configure agents',      done: false, href: '/settings/agents' },
  { id: 'tools',      label: 'Connect your tools',    done: false, href: '/settings/sources' },
];

export default function DashboardPage() {
  const [state, setState] = useState<OnboardingState | null>(null);

  useEffect(() => { setState(loadState()); }, []);
  if (!state) return null;

  const { auth, workspace, context } = state;
  const name = auth.name || 'there';
  const businessModel = context.businessModels[0] || 'default';
  const useCases = context.useCases.slice(0, 3);
  const cases = BUSINESS_MODEL_CASES[businessModel] || BUSINESS_MODEL_CASES.default;
  const completedCount = SETUP_CHECKLIST.filter(i => i.done).length;

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">

      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 opacity-80" />
              <span className="text-sm font-medium opacity-90">Your workspace is ready</span>
            </div>
            <h1 className="text-2xl font-bold mb-1">
              Welcome, {name}. 👋
            </h1>
            <p className="opacity-90 text-sm">
              Here's what pmGPT can do for your{' '}
              <span className="font-semibold">{businessModel !== 'default' ? businessModel : ''}</span>{' '}
              team →
            </p>
          </div>
          <Link href="/settings/sources">
            <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-1.5">
              <Puzzle className="w-3.5 h-3.5" /> Connect tools
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main content — 2/3 */}
        <div className="col-span-2 space-y-6">

          {/* Action cards from use cases */}
          {useCases.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Start here — your top priorities</h2>
              <div className="space-y-3">
                {useCases.map(uc => {
                  const agentId = USE_CASE_AGENT_MAP[uc];
                  const agent = AGENTS.find(a => a.id === agentId);
                  return (
                    <div key={uc} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 hover:border-violet-200 hover:shadow-sm transition-all group">
                      <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-xl flex-shrink-0', agent?.color)}>
                        {USE_CASE_ICONS[uc] || agent?.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-800 text-sm">{uc}</div>
                        <div className="text-xs text-slate-400 mt-0.5">via {agent?.name}</div>
                      </div>
                      <Button size="sm" className="bg-violet-600 hover:bg-violet-700 gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        Start <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* All agents */}
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">All agents</h2>
            <div className="grid grid-cols-2 gap-3">
              {AGENTS.map(agent => (
                <div key={agent.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:border-violet-200 hover:shadow-sm transition-all cursor-pointer group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-base', agent.color)}>
                      {agent.icon}
                    </div>
                    <span className="font-medium text-sm text-slate-800">{agent.name}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{agent.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Case studies */}
          {/* TODO: replace with real case study content */}
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">How teams use pmGPT</h2>
            <div className="grid grid-cols-2 gap-3">
              {cases.map((c, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 hover:border-violet-200 transition-all cursor-pointer">
                  <div className="text-xs font-medium text-violet-600 mb-2">Case Study</div>
                  <p className="text-sm font-medium text-slate-700 leading-snug">{c}</p>
                  <div className="mt-3 text-xs text-violet-600 font-medium flex items-center gap-1 hover:gap-2 transition-all">
                    Read more <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar — 1/3 */}
        <div className="space-y-4">

          {/* Setup checklist */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-slate-800">Complete your setup</h3>
              <Badge variant="secondary" className="text-xs">{completedCount}/{SETUP_CHECKLIST.length}</Badge>
            </div>
            <div className="space-y-3">
              {SETUP_CHECKLIST.map(item => (
                <Link key={item.id} href={item.href} className="flex items-center gap-2.5 group">
                  {item.done
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    : <Square className="w-4 h-4 text-slate-300 flex-shrink-0 group-hover:text-violet-400 transition-colors" />
                  }
                  <span className={cn(
                    'text-sm transition-colors',
                    item.done ? 'text-slate-400 line-through' : 'text-slate-700 group-hover:text-violet-600'
                  )}>
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-violet-50 rounded-xl border border-violet-100 p-5">
            <h3 className="font-semibold text-sm text-violet-800 mb-3">Quick actions</h3>
            <div className="space-y-2">
              <Link href="/settings/team/invite" className="flex items-center gap-2 text-sm text-violet-700 hover:text-violet-900 transition-colors">
                <Users className="w-3.5 h-3.5" /> Invite teammates
              </Link>
              <Link href="/settings/agents" className="flex items-center gap-2 text-sm text-violet-700 hover:text-violet-900 transition-colors">
                <Cog className="w-3.5 h-3.5" /> Configure agents
              </Link>
              <Link href="/settings/sources" className="flex items-center gap-2 text-sm text-violet-700 hover:text-violet-900 transition-colors">
                <Puzzle className="w-3.5 h-3.5" /> Connect tools
              </Link>
            </div>
          </div>

          {/* Plan widget */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700">Free plan</span>
              <Badge className="bg-emerald-100 text-emerald-700 text-xs border-0">Active</Badge>
            </div>
            <p className="text-xs text-slate-400 mb-3">30 days of full access. Upgrade for unlimited usage.</p>
            <Button size="sm" className="w-full bg-violet-600 hover:bg-violet-700 text-xs h-8">
              Upgrade to Pro
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
