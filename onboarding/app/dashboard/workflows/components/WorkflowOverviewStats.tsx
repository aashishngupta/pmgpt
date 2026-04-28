'use client';
import type { WorkflowSummary } from '@/lib/workflow-home-types';
import { Activity, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';

interface Props { summaries: WorkflowSummary[] }

export function WorkflowOverviewStats({ summaries }: Props) {
  const total   = summaries.length;
  const active  = summaries.filter(s => s.status === 'active').length;
  const errors  = summaries.filter(s => s.status === 'error').length;
  const avgRate = summaries.filter(s => s.totalRuns > 0).reduce((acc, s) => acc + s.successRate, 0)
    / (summaries.filter(s => s.totalRuns > 0).length || 1);

  const stats = [
    { label: 'Total Workflows', value: total,                     icon: Activity,      color: 'text-brand-ink',    bg: 'bg-brand-elevated'   },
    { label: 'Active',          value: active,                    icon: CheckCircle2,  color: 'text-brand-green',  bg: 'bg-brand-green-bg'   },
    { label: 'Errors',          value: errors,                    icon: AlertCircle,   color: 'text-brand-red',    bg: 'bg-brand-red-bg'     },
    { label: 'Avg Success Rate',value: `${Math.round(avgRate * 100)}%`, icon: TrendingUp, color: 'text-brand-accent', bg: 'bg-brand-accent-bg' },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {stats.map(s => (
        <div key={s.label} className="bg-brand-surface rounded-xl border border-brand-line px-4 py-3.5 flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${s.bg}`}>
            <s.icon className={`w-4 h-4 ${s.color}`} />
          </div>
          <div>
            <p className="text-[11px] text-brand-ink-3 font-medium">{s.label}</p>
            <p className={`text-[20px] font-bold leading-tight ${s.color}`}>{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
