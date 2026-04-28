'use client';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { WorkflowSummary, WorkflowStatus } from '@/lib/workflow-home-types';
import {
  Zap, Clock, Play, Edit2, Copy, Pause, ScrollText,
  CheckCircle2, AlertCircle, CircleDot, Circle, ChevronRight,
} from 'lucide-react';

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<WorkflowStatus, { label: string; cls: string; dot: string }> = {
  active: { label: 'Active',  cls: 'bg-brand-green-bg  text-brand-green  border-brand-green/20',  dot: 'bg-brand-green'  },
  draft:  { label: 'Draft',   cls: 'bg-brand-elevated  text-brand-ink-3  border-brand-line',       dot: 'bg-brand-ink-3'  },
  paused: { label: 'Paused',  cls: 'bg-brand-amber-bg  text-brand-amber  border-brand-amber/20',   dot: 'bg-brand-amber'  },
  error:  { label: 'Error',   cls: 'bg-brand-red-bg    text-brand-red    border-brand-red/20',     dot: 'bg-brand-red animate-pulse' },
};

function StatusBadge({ status }: { status: WorkflowStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border', s.cls)}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', s.dot)} />
      {s.label}
    </span>
  );
}

// ── Trigger chip ──────────────────────────────────────────────────────────────

function TriggerChip({ trigger }: { trigger: WorkflowSummary['trigger'] }) {
  const Icon = trigger.type === 'schedule' ? Clock : Zap;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-brand-ink bg-brand-elevated px-2 py-0.5 rounded border border-brand-line">
      <Icon className="w-3 h-3 text-brand-ink-3" />
      {trigger.label}
    </span>
  );
}

// ── Last run cell ─────────────────────────────────────────────────────────────

function LastRunCell({ lastRun, successRate, totalRuns }: Pick<WorkflowSummary, 'lastRun' | 'successRate' | 'totalRuns'>) {
  if (!lastRun) return <span className="text-[11px] text-brand-ink-3">No runs yet</span>;
  const mins = Math.round((Date.now() - lastRun.startedAt) / 60000);
  const timeAgo = mins < 60 ? `${mins}m ago` : `${Math.round(mins / 60)}h ago`;
  const Icon = lastRun.status === 'completed' ? CheckCircle2 : AlertCircle;
  const col  = lastRun.status === 'completed' ? 'text-brand-green' : 'text-brand-red';
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1">
        <Icon className={cn('w-3 h-3 flex-shrink-0', col)} />
        <span className="text-[11px] text-brand-ink">{timeAgo}</span>
      </div>
      <span className="text-[10px] text-brand-ink-3">{Math.round(successRate * 100)}% · {totalRuns} runs</span>
    </div>
  );
}

// ── Quick actions ─────────────────────────────────────────────────────────────

interface Actions {
  onEdit: () => void;
  onRun: () => void;
  onDuplicate: () => void;
  onPause: () => void;
  onViewLogs: () => void;
  status: WorkflowStatus;
}

function QuickActions({ onEdit, onRun, onDuplicate, onPause, onViewLogs, status }: Actions) {
  const btn = 'p-1.5 rounded-lg text-brand-ink-3 hover:text-brand-ink hover:bg-brand-elevated transition-colors';
  return (
    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={e => { e.stopPropagation(); onEdit(); }}       className={btn} title="Edit"><Edit2      className="w-3.5 h-3.5" /></button>
      <button onClick={e => { e.stopPropagation(); onRun(); }}        className={btn} title="Run test"><Play  className="w-3.5 h-3.5" /></button>
      <button onClick={e => { e.stopPropagation(); onDuplicate(); }}  className={btn} title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
      <button onClick={e => { e.stopPropagation(); onPause(); }}      className={btn} title={status === 'paused' ? 'Resume' : 'Pause'}>
        <Pause className="w-3.5 h-3.5" />
      </button>
      <button onClick={e => { e.stopPropagation(); onViewLogs(); }}   className={btn} title="View logs"><ScrollText className="w-3.5 h-3.5" /></button>
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────

export type WorkflowFilter = 'all' | WorkflowStatus;

interface Props {
  summaries: WorkflowSummary[];
  filter: WorkflowFilter;
  onEdit: (id: string) => void;
  onRun: (id: string) => void;
  onDuplicate: (id: string) => void;
  onPause: (id: string) => void;
  onViewLogs: (id: string) => void;
}

export function WorkflowTable({ summaries, filter, onEdit, onRun, onDuplicate, onPause, onViewLogs }: Props) {
  const visible = filter === 'all' ? summaries : summaries.filter(s => s.status === filter);

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <CircleDot className="w-8 h-8 text-brand-ink-4 mb-3" />
        <p className="text-[13px] text-brand-ink font-medium">No workflows match this filter</p>
        <p className="text-[12px] text-brand-ink-3 mt-1">Try switching to All or create a new workflow</p>
      </div>
    );
  }

  return (
    <div className="bg-brand-surface rounded-xl border border-brand-line overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[2fr_1fr_1.5fr_1.2fr_1fr_auto] gap-4 px-4 py-2.5 border-b border-brand-line bg-brand-canvas">
        {['Workflow', 'Status', 'Trigger', 'Last Run', 'Owner', ''].map(h => (
          <span key={h} className="text-[9px] font-bold uppercase tracking-widest text-brand-ink-3">{h}</span>
        ))}
      </div>

      {/* Rows */}
      {visible.map((s, i) => (
        <div
          key={s.id}
          onClick={() => onEdit(s.id)}
          className={cn(
            'group grid grid-cols-[2fr_1fr_1.5fr_1.2fr_1fr_auto] gap-4 px-4 py-3 items-center cursor-pointer transition-colors hover:bg-brand-elevated',
            i < visible.length - 1 && 'border-b border-brand-line',
          )}
        >
          {/* Name + description */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[13px] font-semibold text-brand-ink truncate">{s.name}</p>
              <ChevronRight className="w-3 h-3 text-brand-ink-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </div>
            <p className="text-[11px] text-brand-ink-3 truncate mt-0.5">{s.description}</p>
            {s.tags && s.tags.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {s.tags.slice(0, 3).map(t => (
                  <span key={t} className="text-[9px] bg-brand-elevated text-brand-ink-3 px-1.5 py-[1px] rounded border border-brand-line">{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div><StatusBadge status={s.status} /></div>

          {/* Trigger */}
          <div><TriggerChip trigger={s.trigger} /></div>

          {/* Last run */}
          <div><LastRunCell lastRun={s.lastRun} successRate={s.successRate} totalRuns={s.totalRuns} /></div>

          {/* Owner */}
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-brand-accent-bg border border-brand-accent/20 flex items-center justify-center text-[9px] font-bold text-brand-accent flex-shrink-0">
              {s.owner.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <span className="text-[11px] text-brand-ink truncate">{s.owner.split(' ')[0]}</span>
          </div>

          {/* Quick actions */}
          <QuickActions
            status={s.status}
            onEdit={() => onEdit(s.id)}
            onRun={() => onRun(s.id)}
            onDuplicate={() => onDuplicate(s.id)}
            onPause={() => onPause(s.id)}
            onViewLogs={() => onViewLogs(s.id)}
          />
        </div>
      ))}
    </div>
  );
}
