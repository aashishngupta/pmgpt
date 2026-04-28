'use client';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { WorkflowSummary } from '@/lib/workflow-home-types';
import type { WorkflowFilter as WFFilter } from './WorkflowTable';
import { WorkflowOverviewStats } from './WorkflowOverviewStats';
import { WorkflowTable } from './WorkflowTable';
import { Plus } from 'lucide-react';

type FilterTab = 'all' | 'active' | 'draft' | 'paused' | 'error';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',    label: 'All'    },
  { key: 'active', label: 'Active' },
  { key: 'draft',  label: 'Draft'  },
  { key: 'paused', label: 'Paused' },
  { key: 'error',  label: 'Error'  },
];

interface Props {
  summaries: WorkflowSummary[];
  onNewWorkflow: () => void;
  onEdit: (id: string) => void;
  onRun: (id: string) => void;
  onDuplicate: (id: string) => void;
  onPause: (id: string) => void;
  onViewLogs: (id: string) => void;
}

export function WorkflowsHome({
  summaries, onNewWorkflow, onEdit, onRun, onDuplicate, onPause, onViewLogs,
}: Props) {
  const [filter, setFilter] = useState<FilterTab>('all');

  const counts: Record<FilterTab, number> = {
    all:    summaries.length,
    active: summaries.filter(s => s.status === 'active').length,
    draft:  summaries.filter(s => s.status === 'draft').length,
    paused: summaries.filter(s => s.status === 'paused').length,
    error:  summaries.filter(s => s.status === 'error').length,
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-brand-ink">Workflows</h1>
          <p className="text-[13px] text-brand-ink-3 mt-0.5">Automate your PM processes — triggers, agents, approvals, and actions.</p>
        </div>
        <button
          onClick={onNewWorkflow}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-accent text-white text-[13px] font-semibold rounded-xl hover:bg-brand-accent-dim transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Workflow
        </button>
      </div>

      {/* Stats */}
      <WorkflowOverviewStats summaries={summaries} />

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-4">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors',
              filter === tab.key
                ? 'bg-brand-elevated text-brand-ink border border-brand-line'
                : 'text-brand-ink-3 hover:text-brand-ink hover:bg-brand-elevated',
            )}
          >
            {tab.label}
            <span className={cn(
              'text-[10px] px-1.5 py-[1px] rounded-full font-semibold',
              filter === tab.key ? 'bg-brand-accent text-white' : 'bg-brand-elevated text-brand-ink-3',
            )}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <WorkflowTable
        summaries={summaries}
        filter={filter as WFFilter}
        onEdit={onEdit}
        onRun={onRun}
        onDuplicate={onDuplicate}
        onPause={onPause}
        onViewLogs={onViewLogs}
      />
    </div>
  );
}
