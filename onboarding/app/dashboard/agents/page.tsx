'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AGENTS, Agent } from '@/lib/platform-data';
import { cn } from '@/lib/utils';
import {
  Target, FileText, BarChart2, Search, Layers,
  GitPullRequest, Terminal, Trophy, TrendingUp, GraduationCap,
  MessageSquare, Settings2, Copy, MoreHorizontal, Plus,
  LayoutGrid, GitBranch, ChevronRight, CheckCircle2,
  Zap, Power,
} from 'lucide-react';

// ── Icon map — no emojis ──────────────────────────────────────────────────────

const AGENT_ICONS: Record<string, React.ElementType> = {
  strategy:    Target,
  docs:        FileText,
  analytics:   BarChart2,
  research:    Search,
  ops:         Layers,
  review:      GitPullRequest,
  engineering: Terminal,
  competitive: Trophy,
  sales:       TrendingUp,
  coach:       GraduationCap,
};

// ── Agent metadata ────────────────────────────────────────────────────────────

const AGENT_PURPOSE: Record<string, string> = {
  strategy:    'Define product vision, prioritise ruthlessly, and align stakeholders on strategic bets.',
  docs:        'Produce production-ready PRDs, user stories, and specifications in minutes.',
  analytics:   'Interpret metrics, diagnose anomalies, and turn data into decisive product actions.',
  research:    'Synthesise customer signals, NPS, and interviews into prioritised insights.',
  ops:         'Run sprint ceremonies, generate standups, and keep execution moving.',
  review:      'Evaluate delivery quality, write release notes, and close sprint loops.',
  engineering: 'Bridge product and engineering with precise technical briefs and incident reports.',
  competitive: 'Map the competitive landscape and equip the team with up-to-date battlecards.',
  sales:       'Convert product knowledge into compelling sales collateral and ROI narratives.',
  coach:       'Support PM career growth with structured reviews and development plans.',
};

const AGENT_OUTPUTS: Record<string, string[]> = {
  strategy:    ['Roadmaps', 'OKRs', '1-Pagers'],
  docs:        ['PRDs', 'User Stories', 'Specs'],
  analytics:   ['KPI Reports', 'RCAs', 'A/B Readouts'],
  research:    ['VOC Reports', 'NPS Analysis', 'Surveys'],
  ops:         ['Sprint Summaries', 'Standups', 'Retros'],
  review:      ['Sprint Reviews', 'Release Notes', 'Changelogs'],
  engineering: ['Eng Briefs', 'Tech Specs', 'Incident Reports'],
  competitive: ['Battlecards', 'Win/Loss Reports', 'Comparisons'],
  sales:       ['One-Pagers', 'ROI Narratives', 'Demo Scripts'],
  coach:       ['Career Reviews', 'Growth Plans', 'Feedback Docs'],
};

// ── Primitives ────────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: Agent['status'] | 'inactive' }) {
  return (
    <span className={cn('text-[10px] font-semibold px-1.5 py-[3px] rounded uppercase tracking-wide', {
      'bg-brand-green-bg text-brand-green':  status === 'active',
      'bg-brand-amber-bg text-brand-amber':  status === 'beta',
      'bg-brand-elevated text-brand-ink-3':  status === 'inactive',
    })}>
      {status}
    </span>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onChange(!on); }}
      className={cn(
        'relative inline-flex h-4 w-7 items-center rounded-full transition-colors flex-shrink-0',
        on ? 'bg-brand-accent' : 'bg-brand-line',
      )}
    >
      <span className={cn(
        'inline-block h-3 w-3 rounded-full bg-white shadow transition-transform',
        on ? 'translate-x-3.5' : 'translate-x-0.5',
      )} />
    </button>
  );
}

// ── Grid card ─────────────────────────────────────────────────────────────────

function AgentCard({ agent, active, onToggle }: {
  agent: Agent; active: boolean; onToggle: (v: boolean) => void;
}) {
  const Icon   = AGENT_ICONS[agent.id] ?? Zap;
  const router = useRouter();

  return (
    <div className={cn(
      'bg-brand-surface border rounded-lg p-3.5 flex flex-col gap-2.5 transition-all',
      active ? 'border-brand-line' : 'border-brand-line opacity-55',
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className={cn('w-7 h-7 rounded-md border border-brand-line flex items-center justify-center flex-shrink-0', agent.bg)}>
            <Icon className={cn('w-3.5 h-3.5', agent.color)} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[12px] font-semibold text-brand-ink">{agent.name}</span>
              <StatusPill status={active ? agent.status : 'inactive'} />
            </div>
            <p className="text-[11px] text-brand-ink-3 mt-0.5 leading-snug line-clamp-2">
              {AGENT_PURPOSE[agent.id] ?? agent.description}
            </p>
          </div>
        </div>
        <Toggle on={active} onChange={onToggle} />
      </div>

      {/* Capabilities */}
      <div className="flex flex-wrap gap-1">
        {agent.capabilities.slice(0, 3).map(c => (
          <span key={c} className="text-[10px] text-brand-ink-2 px-1.5 py-[2px] rounded bg-brand-elevated">
            {c}
          </span>
        ))}
        {agent.capabilities.length > 3 && (
          <span className="text-[10px] text-brand-ink-3 px-1 py-[2px]">
            +{agent.capabilities.length - 3}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center py-2 border-t border-b border-brand-line-2 divide-x divide-brand-line-2">
        {[
          { label: 'queries',      val: agent.stats.queries.toLocaleString() },
          { label: 'latency',      val: `${(agent.stats.avgLatencyMs / 1000).toFixed(1)}s` },
          { label: 'sat.',         val: `${agent.stats.satisfactionPct}%`, highlight: agent.stats.satisfactionPct >= 90 },
        ].map(s => (
          <div key={s.label} className="flex-1 text-center px-1.5">
            <div className={cn('text-[12px] font-mono font-semibold',
              s.highlight === false ? 'text-brand-amber' : s.highlight ? 'text-brand-green' : 'text-brand-ink'
            )}>
              {s.val}
            </div>
            <div className="text-[9px] text-brand-ink-3 uppercase tracking-wide mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* LLM + connectors */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-[9px] font-mono px-1.5 py-[2px] rounded bg-brand-sidebar text-brand-ink-inv border border-brand-sidebar-border">
          {agent.llm.replace('claude-', '').replace('gpt-', 'gpt-')}
        </span>
        {agent.connectors.slice(0, 3).map(c => (
          <span key={c} className="text-[9px] font-medium px-1.5 py-[2px] rounded bg-brand-elevated text-brand-ink-2 border border-brand-line uppercase tracking-wide">
            {c}
          </span>
        ))}
        {agent.connectors.length > 3 && (
          <span className="text-[9px] text-brand-ink-3">+{agent.connectors.length - 3}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <Link href={`/dashboard/chat?agent=${agent.id}`} onClick={e => e.stopPropagation()} className="flex-1">
          <button className="w-full flex items-center justify-center gap-1 py-1.5 rounded-md bg-brand-accent hover:bg-brand-accent-dim text-white text-[11px] font-medium transition-colors">
            <MessageSquare className="w-3 h-3" /> Chat
          </button>
        </Link>
        <button
          onClick={() => router.push(`/dashboard/agents/${agent.id}`)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-brand-line hover:bg-brand-elevated text-[11px] font-medium text-brand-ink-2 transition-colors"
        >
          <Settings2 className="w-3 h-3" /> Config
        </button>
        <button
          className="p-1.5 rounded-md border border-brand-line hover:bg-brand-elevated text-brand-ink-3 transition-colors"
          title="More options"
        >
          <MoreHorizontal className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ── Flow / orchestration view ─────────────────────────────────────────────────

function FlowView({ agents, activeMap }: { agents: Agent[]; activeMap: Record<string, boolean> }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[180px_16px_220px_16px_1fr_120px] items-center gap-2 px-4 mb-3">
        <span className="text-[10px] font-semibold text-brand-ink-3 uppercase tracking-widest text-right">Data Sources</span>
        <span />
        <span className="text-[10px] font-semibold text-brand-ink-3 uppercase tracking-widest pl-10">Agent</span>
        <span />
        <span className="text-[10px] font-semibold text-brand-ink-3 uppercase tracking-widest">Outputs</span>
        <span className="text-[10px] font-semibold text-brand-ink-3 uppercase tracking-widest text-right">Status</span>
      </div>

      {agents.map(agent => {
        const Icon   = AGENT_ICONS[agent.id] ?? Zap;
        const active = activeMap[agent.id] !== false;
        const outputs = AGENT_OUTPUTS[agent.id] ?? [];
        return (
          <div key={agent.id} className={cn(
            'grid grid-cols-[180px_16px_220px_16px_1fr_120px] items-center gap-2 bg-brand-surface border rounded-lg px-4 py-3 transition-all hover:border-brand-ink-4',
            active ? 'border-brand-line' : 'border-brand-line opacity-50',
          )}>
            {/* Sources */}
            <div className="flex flex-wrap gap-1 justify-end">
              {agent.connectors.map(c => (
                <span key={c} className="text-[10px] font-medium px-1.5 py-[3px] rounded bg-brand-elevated text-brand-ink-2 border border-brand-line">
                  {c}
                </span>
              ))}
            </div>

            <ChevronRight className="w-3.5 h-3.5 text-brand-ink-4 justify-self-center" />

            {/* Agent node */}
            <Link href={`/dashboard/agents/${agent.id}`}>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-brand-accent-bg border border-brand-accent hover:border-brand-accent-dim transition-colors">
                <Icon className="w-3.5 h-3.5 text-brand-accent flex-shrink-0" />
                <span className="text-[13px] font-semibold text-brand-ink">{agent.name}</span>
              </div>
            </Link>

            <ChevronRight className="w-3.5 h-3.5 text-brand-ink-4 justify-self-center" />

            {/* Outputs */}
            <div className="flex flex-wrap gap-1">
              {outputs.map(o => (
                <span key={o} className="text-[11px] text-brand-ink-2 px-1.5 py-[3px] rounded bg-brand-elevated">
                  {o}
                </span>
              ))}
            </div>

            {/* Status + templates */}
            <div className="flex items-center justify-end gap-2">
              {agent.templates.length > 0 && (
                <span className="text-[10px] text-brand-ink-3 flex items-center gap-0.5">
                  <Zap className="w-2.5 h-2.5" />{agent.templates.length}
                </span>
              )}
              <StatusPill status={active ? agent.status : 'inactive'} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const [view,      setView]      = useState<'grid' | 'flow'>('grid');
  const [filter,    setFilter]    = useState<'all' | 'active' | 'beta' | 'inactive'>('all');
  const [activeMap, setActiveMap] = useState<Record<string, boolean>>(
    Object.fromEntries(AGENTS.map(a => [a.id, a.status !== 'inactive'])),
  );

  const toggle = (id: string, val: boolean) =>
    setActiveMap(prev => ({ ...prev, [id]: val }));

  const filtered = AGENTS.filter(a => {
    if (filter === 'all')      return true;
    if (filter === 'active')   return activeMap[a.id] !== false && a.status === 'active';
    if (filter === 'beta')     return a.status === 'beta';
    if (filter === 'inactive') return activeMap[a.id] === false;
    return true;
  });

  const activeCount     = Object.values(activeMap).filter(Boolean).length;
  const totalQueries    = AGENTS.reduce((s, a) => s + a.stats.queries, 0);
  const avgSatisfaction = Math.round(AGENTS.reduce((s, a) => s + a.stats.satisfactionPct, 0) / AGENTS.length);

  return (
    <div className="px-7 py-6 max-w-[1200px] mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-brand-ink">Agents</h1>
          <p className="text-[13px] text-brand-ink-2 mt-0.5">
            {activeCount} of {AGENTS.length} active — configure behaviour, access, and model per agent
          </p>
        </div>
        <button className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-brand-accent hover:bg-brand-accent-dim text-white text-[13px] font-medium transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Agent
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Agents',    value: String(AGENTS.length),          icon: Zap,           color: 'text-brand-accent' },
          { label: 'Active',          value: String(activeCount),            icon: Power,         color: 'text-brand-green'  },
          { label: 'Total Queries',   value: totalQueries.toLocaleString(),  icon: MessageSquare, color: 'text-brand-ink-2'  },
          { label: 'Avg Satisfaction',value: `${avgSatisfaction}%`,         icon: CheckCircle2,  color: 'text-brand-amber'  },
        ].map(s => (
          <div key={s.label} className="bg-brand-surface border border-brand-line rounded-lg p-4 flex items-center gap-3">
            <s.icon className={cn('w-4 h-4 flex-shrink-0', s.color)} />
            <div>
              <div className="text-[16px] font-mono font-bold text-brand-ink">{s.value}</div>
              <div className="text-[11px] text-brand-ink-3 uppercase tracking-wide">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-0.5 bg-brand-elevated rounded-md border border-brand-line">
          {(['all', 'active', 'beta', 'inactive'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-[5px] rounded text-[12px] font-medium capitalize transition-all',
                filter === f
                  ? 'bg-brand-surface text-brand-ink shadow-sm border border-brand-line'
                  : 'text-brand-ink-3 hover:text-brand-ink',
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 p-0.5 bg-brand-elevated rounded-md border border-brand-line">
          {([
            { id: 'grid' as const, Icon: LayoutGrid, title: 'Grid view' },
            { id: 'flow' as const, Icon: GitBranch,  title: 'Orchestration view' },
          ]).map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              title={v.title}
              className={cn('p-1.5 rounded transition-all',
                view === v.id
                  ? 'bg-brand-surface shadow-sm text-brand-ink border border-brand-line'
                  : 'text-brand-ink-3 hover:text-brand-ink',
              )}
            >
              <v.Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </div>

      {/* View */}
      {view === 'grid' ? (
        <div className="grid grid-cols-3 gap-3">
          {filtered.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              active={activeMap[agent.id] !== false}
              onToggle={v => toggle(agent.id, v)}
            />
          ))}
          <button className="border-2 border-dashed border-brand-line hover:border-brand-accent hover:bg-brand-accent-bg rounded-lg p-5 flex flex-col items-center justify-center gap-2 text-brand-ink-3 hover:text-brand-accent transition-all">
            <div className="w-7 h-7 rounded-md border-2 border-dashed border-current flex items-center justify-center">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <span className="text-[12px] font-medium">New agent</span>
            <span className="text-[11px] text-center leading-snug opacity-70">
              Custom persona, system prompt,<br />tools, and templates
            </span>
          </button>
        </div>
      ) : (
        <FlowView agents={filtered} activeMap={activeMap} />
      )}

    </div>
  );
}
