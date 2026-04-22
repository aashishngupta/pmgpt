'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Zap, Plus, Play, Pause, Clock, Calendar, Webhook, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SKILLS = [
  { id: 1, name: 'Weekly Sprint Summary',    agent: 'ops',       trigger: 'Every Friday 5pm',         active: true,  runs: 12, lastRun: 'Apr 18' },
  { id: 2, name: 'Daily Metrics Digest',     agent: 'analytics', trigger: 'Daily 8:30 AM',            active: true,  runs: 31, lastRun: 'Today'  },
  { id: 3, name: 'PRD Review Feedback',      agent: 'docs',      trigger: 'On-demand',                active: true,  runs: 8,  lastRun: 'Apr 17' },
  { id: 4, name: 'Competitive Intel Sweep',  agent: 'competitive',trigger: 'Every Monday 9am',        active: false, runs: 6,  lastRun: 'Apr 13' },
  { id: 5, name: 'NPS Digest',               agent: 'research',  trigger: 'Monthly on 1st',           active: false, runs: 2,  lastRun: 'Apr 1'  },
];

export default function SkillsPage() {
  const [skills, setSkills] = useState(SKILLS);

  return (
    <div className="px-8 py-7 max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Skills</h1>
          <p className="text-sm text-slate-400 mt-0.5">Scheduled and on-demand AI workflows that run automatically</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700 gap-2 h-9 text-sm">
          <Plus className="w-4 h-4" /> New skill
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total skills', value: skills.length,                              color: 'text-slate-800'   },
          { label: 'Active',       value: skills.filter(s => s.active).length,        color: 'text-emerald-600' },
          { label: 'Total runs',   value: skills.reduce((s,k) => s + k.runs, 0),      color: 'text-violet-600'  },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={cn('text-2xl font-bold', s.color)}>{s.value}</div>
            <div className="text-xs text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {skills.map(skill => (
          <div key={skill.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 hover:border-violet-200 transition-all">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', skill.active ? 'bg-violet-100' : 'bg-slate-100')}>
              <Zap className={cn('w-4 h-4', skill.active ? 'text-violet-600' : 'text-slate-400')} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-bold text-slate-900">{skill.name}</span>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', skill.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                  {skill.active ? 'ACTIVE' : 'PAUSED'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {skill.trigger}</span>
                <span className="capitalize">· {skill.agent} agent</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Last: {skill.lastRun}</span>
                <span>· {skill.runs} runs</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                <Play className="w-3 h-3" /> Run now
              </Button>
              <button
                onClick={() => setSkills(prev => prev.map(s => s.id === skill.id ? { ...s, active: !s.active } : s))}
                className={cn('h-7 px-3 rounded-lg text-xs font-medium border transition-all', skill.active
                  ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                )}
              >
                {skill.active ? 'Pause' : 'Enable'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-violet-50 rounded-xl border border-violet-100 flex items-start gap-3">
        <Zap className="w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-violet-700 leading-relaxed">
          <strong>Build a skill from any workflow.</strong> Go to{' '}
          <Link href="/dashboard/workflows" className="underline">Workflows</Link> to create a multi-step pipeline,
          or use a <Link href="/dashboard/agents" className="underline">template</Link> from any agent to create an on-demand skill.
        </div>
      </div>
    </div>
  );
}
