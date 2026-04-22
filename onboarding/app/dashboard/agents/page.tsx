'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AGENTS, Agent } from '@/lib/platform-data';
import { cn } from '@/lib/utils';
import {
  Target, FileText, BarChart2, Search, Layers, GitPullRequest,
  Terminal, Trophy, TrendingUp, GraduationCap, Scale, Rocket,
  Globe, MessageSquare, Settings2, Plus, LayoutGrid, GitBranch,
  ChevronRight, Zap, Power, Wrench, Clock, Database, Shield,
} from 'lucide-react';

// ── Icon map ──────────────────────────────────────────────────────────────────

const AGENT_ICONS: Record<string, React.ElementType> = {
  strategy:        Target,
  docs:            FileText,
  analytics:       BarChart2,
  research:        Search,
  ops:             Layers,
  review:          GitPullRequest,
  engineering:     Terminal,
  competitive:     Trophy,
  sales:           TrendingUp,
  coach:           GraduationCap,
  prioritization:  Scale,
  release:         Rocket,
  market:          Globe,
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
        'relative inline-flex h-[18px] w-8 items-center rounded-full transition-colors flex-shrink-0',
        on ? 'bg-brand-accent' : 'bg-brand-line',
      )}
    >
      <span className={cn(
        'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform',
        on ? 'translate-x-[17px]' : 'translate-x-0.5',
      )} />
    </button>
  );
}

// ── Agent grid card ───────────────────────────────────────────────────────────

function AgentCard({ agent, active, onToggle }: {
  agent: Agent; active: boolean; onToggle: (v: boolean) => void;
}) {
  const Icon   = AGENT_ICONS[agent.id] ?? Zap;
  const router = useRouter();

  const enabledTools    = agent.tools.filter(t => t.enabled).length;
  const writeTools      = agent.tools.filter(t => t.category === 'write' && t.enabled).length;
  const activeTriggers  = agent.triggers.filter(t => t.enabled).length;

  return (
    <div className={cn(
      'group bg-brand-surface border rounded-xl p-4 flex flex-col gap-3 transition-all hover:shadow-sm',
      active ? 'border-brand-line hover:border-brand-ink-4' : 'border-brand-line opacity-50',
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className={cn('w-9 h-9 rounded-lg border border-brand-line flex items-center justify-center flex-shrink-0', agent.bg)}>
            <Icon className={cn('w-4.5 h-4.5', agent.color)} style={{ width: 18, height: 18 }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[13px] font-semibold text-brand-ink">{agent.name}</span>
              <StatusPill status={active ? agent.status : 'inactive'} />
            </div>
            <p className="text-[12px] text-brand-ink-3 mt-0.5 leading-snug line-clamp-2">
              {agent.description}
            </p>
          </div>
        </div>
        <Toggle on={active} onChange={onToggle} />
      </div>

      {/* Capabilities */}
      <div className="flex flex-wrap gap-1">
        {agent.capabilities.slice(0, 4).map(c => (
          <span key={c} className="text-[10px] text-brand-ink-2 px-1.5 py-[3px] rounded-md bg-brand-elevated border border-brand-line-2">
            {c}
          </span>
        ))}
        {agent.capabilities.length > 4 && (
          <span className="text-[10px] text-brand-ink-3 px-1 py-[3px]">+{agent.capabilities.length - 4} more</span>
        )}
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 py-2.5 border-t border-b border-brand-line-2">
        <div className="flex items-center gap-1.5 text-[11px] text-brand-ink-3" title="LLM model">
          <Zap className="w-3 h-3 flex-shrink-0" />
          <span className="font-mono truncate max-w-[80px]">{agent.llm.replace('claude-', '').replace('-', ' ')}</span>
        </div>
        <div className="w-px h-3 bg-brand-line-2" />
        <div className="flex items-center gap-1 text-[11px] text-brand-ink-3" title="Actions">
          <Wrench className="w-3 h-3 flex-shrink-0" />
          <span>{enabledTools} tools{writeTools > 0 ? `, ${writeTools} write` : ''}</span>
        </div>
        <div className="w-px h-3 bg-brand-line-2" />
        <div className={cn('flex items-center gap-1 text-[11px]', activeTriggers > 0 ? 'text-brand-accent' : 'text-brand-ink-3')} title="Triggers">
          <Clock className="w-3 h-3 flex-shrink-0" />
          <span>{activeTriggers > 0 ? `${activeTriggers} trigger${activeTriggers > 1 ? 's' : ''} on` : 'No triggers'}</span>
        </div>
      </div>

      {/* Connectors */}
      {agent.connectors.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          <Database className="w-3 h-3 text-brand-ink-4 flex-shrink-0" />
          {agent.connectors.slice(0, 4).map(c => (
            <span key={c} className="text-[10px] font-medium px-1.5 py-[2px] rounded bg-brand-elevated border border-brand-line text-brand-ink-2 uppercase tracking-wide">
              {c}
            </span>
          ))}
          {agent.connectors.length > 4 && (
            <span className="text-[10px] text-brand-ink-3">+{agent.connectors.length - 4}</span>
          )}
        </div>
      )}
      {agent.connectors.length === 0 && (
        <div className="flex items-center gap-1.5">
          <Database className="w-3 h-3 text-brand-ink-4" />
          <span className="text-[11px] text-brand-ink-3">No connectors — knowledge only</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 pt-0.5">
        <Link href={`/dashboard/chat?agent=${agent.id}`} onClick={e => e.stopPropagation()} className="flex-1">
          <button className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-brand-accent hover:bg-brand-accent-dim text-white text-[12px] font-medium transition-colors">
            <MessageSquare className="w-3 h-3" /> Chat
          </button>
        </Link>
        <button
          onClick={() => router.push(`/dashboard/agents/${agent.id}`)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-brand-line hover:bg-brand-elevated text-[12px] font-medium text-brand-ink-2 transition-colors"
        >
          <Settings2 className="w-3 h-3" /> Configure
        </button>
      </div>
    </div>
  );
}

// ── Flow / orchestration view ─────────────────────────────────────────────────

const AGENT_OUTPUTS: Record<string, string[]> = {
  strategy:       ['Roadmaps', 'OKRs', '1-Pagers'],
  docs:           ['PRDs', 'User Stories', 'Specs'],
  analytics:      ['KPI Digests', 'RCAs', 'A/B Readouts'],
  research:       ['VOC Reports', 'NPS Analysis', 'Surveys'],
  ops:            ['Sprint Summaries', 'Standups', 'Retros'],
  review:         ['Review Reports', 'Release Notes', 'Changelogs'],
  engineering:    ['Eng Briefs', 'Tech Specs', 'Incident Reports'],
  competitive:    ['Battlecards', 'Win/Loss Reports', 'Market Sweeps'],
  sales:          ['One-Pagers', 'ROI Narratives', 'Demo Scripts'],
  coach:          ['Career Reviews', 'Growth Plans', 'Feedback Docs'],
  prioritization: ['Ranked Backlogs', 'Score Tables', 'Trade-off Docs'],
  release:        ['Go/No-Go', 'UAT Checklists', 'Release Notes'],
  market:         ['TAM/SAM/SOM', 'Market Briefs', 'Trend Reports'],
};

function FlowView({ agents, activeMap }: { agents: Agent[]; activeMap: Record<string, boolean> }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[160px_20px_220px_20px_1fr_140px] items-center gap-2 px-4 pb-2 border-b border-brand-line-2">
        <span className="text-[10px] font-semibold text-brand-ink-3 uppercase tracking-widest text-right">Sources</span>
        <span />
        <span className="text-[10px] font-semibold text-brand-ink-3 uppercase tracking-widest pl-10">Agent</span>
        <span />
        <span className="text-[10px] font-semibold text-brand-ink-3 uppercase tracking-widest">Outputs</span>
        <span className="text-[10px] font-semibold text-brand-ink-3 uppercase tracking-widest text-right">Status</span>
      </div>

      {agents.map(agent => {
        const Icon    = AGENT_ICONS[agent.id] ?? Zap;
        const active  = activeMap[agent.id] !== false;
        const outputs = AGENT_OUTPUTS[agent.id] ?? [];
        return (
          <div key={agent.id} className={cn(
            'grid grid-cols-[160px_20px_220px_20px_1fr_140px] items-center gap-2 bg-brand-surface border rounded-xl px-4 py-3 transition-all hover:border-brand-ink-4',
            active ? 'border-brand-line' : 'border-brand-line opacity-50',
          )}>
            <div className="flex flex-wrap gap-1 justify-end">
              {agent.connectors.length === 0
                ? <span className="text-[10px] text-brand-ink-3">—</span>
                : agent.connectors.slice(0, 3).map(c => (
                    <span key={c} className="text-[10px] px-1.5 py-[3px] rounded bg-brand-elevated text-brand-ink-2 border border-brand-line">{c}</span>
                  ))
              }
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-brand-ink-4 justify-self-center" />
            <Link href={`/dashboard/agents/${agent.id}`}>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-brand-accent-bg border border-brand-accent hover:opacity-80 transition-opacity">
                <Icon className="w-3.5 h-3.5 text-brand-accent flex-shrink-0" />
                <span className="text-[13px] font-semibold text-brand-ink">{agent.name}</span>
              </div>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-brand-ink-4 justify-self-center" />
            <div className="flex flex-wrap gap-1">
              {outputs.map(o => (
                <span key={o} className="text-[11px] text-brand-ink-2 px-1.5 py-[3px] rounded bg-brand-elevated">{o}</span>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2.5">
              {agent.triggers.some(t => t.enabled) && (
                <span className="flex items-center gap-1 text-[10px] text-brand-accent">
                  <Clock className="w-2.5 h-2.5" /> auto
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
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState<'all' | 'active' | 'beta' | 'inactive'>('all');
  const [activeMap, setActiveMap] = useState<Record<string, boolean>>(
    Object.fromEntries(AGENTS.map(a => [a.id, a.status !== 'inactive'])),
  );

  const toggle = (id: string, val: boolean) =>
    setActiveMap(prev => ({ ...prev, [id]: val }));

  const filtered = AGENTS.filter(a => {
    const matchSearch = search === '' ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase()) ||
      a.capabilities.some(c => c.toLowerCase().includes(search.toLowerCase()));
    const matchFilter =
      filter === 'all'      ? true :
      filter === 'active'   ? activeMap[a.id] !== false && a.status === 'active' :
      filter === 'beta'     ? a.status === 'beta' :
      filter === 'inactive' ? activeMap[a.id] === false : true;
    return matchSearch && matchFilter;
  });

  const activeCount     = Object.values(activeMap).filter(Boolean).length;
  const triggersEnabled = AGENTS.reduce((s, a) => s + a.triggers.filter(t => t.enabled).length, 0);
  const writeToolsCount = AGENTS.reduce((s, a) => s + a.tools.filter(t => t.category === 'write' && t.requiresApproval).length, 0);

  return (
    <div className="px-7 py-6 max-w-[1240px] mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-brand-ink">Agents</h1>
          <p className="text-[13px] text-brand-ink-2 mt-0.5">
            {activeCount} of {AGENTS.length} active — configure behaviour, knowledge, tools, and triggers per agent
          </p>
        </div>
        <button className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-brand-accent hover:bg-brand-accent-dim text-white text-[13px] font-medium transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Agent
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Agents',      value: String(AGENTS.length),        icon: Zap,     color: 'text-brand-accent',   desc: 'configured'    },
          { label: 'Active Now',        value: String(activeCount),          icon: Power,   color: 'text-brand-green',    desc: 'receiving queries' },
          { label: 'Automated Triggers',value: String(triggersEnabled),      icon: Clock,   color: triggersEnabled > 0 ? 'text-brand-accent' : 'text-brand-ink-3', desc: 'running on schedule' },
          { label: 'Human-in-loop Actions', value: String(writeToolsCount), icon: Shield,  color: 'text-brand-amber',    desc: 'require approval' },
        ].map(s => (
          <div key={s.label} className="bg-brand-surface border border-brand-line rounded-xl p-4 flex items-center gap-3">
            <div className={cn('w-8 h-8 rounded-lg bg-brand-elevated border border-brand-line-2 flex items-center justify-center flex-shrink-0')}>
              <s.icon className={cn('w-4 h-4', s.color)} />
            </div>
            <div>
              <div className="text-[18px] font-mono font-bold text-brand-ink leading-none">{s.value}</div>
              <div className="text-[11px] text-brand-ink-3 mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-ink-3" />
          <input
            type="text"
            placeholder="Search agents…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-[13px] border border-brand-line rounded-lg bg-brand-surface text-brand-ink placeholder-brand-ink-4 focus:outline-none focus:border-brand-accent"
          />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-0.5 p-0.5 bg-brand-elevated rounded-lg border border-brand-line">
          {(['all', 'active', 'beta', 'inactive'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-[5px] rounded-md text-[12px] font-medium capitalize transition-all',
                filter === f
                  ? 'bg-brand-surface text-brand-ink shadow-sm border border-brand-line'
                  : 'text-brand-ink-3 hover:text-brand-ink',
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="ml-auto flex items-center gap-0.5 p-0.5 bg-brand-elevated rounded-lg border border-brand-line">
          {[
            { id: 'grid' as const, Icon: LayoutGrid, title: 'Grid view' },
            { id: 'flow' as const, Icon: GitBranch,  title: 'Orchestration view' },
          ].map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              title={v.title}
              className={cn('p-1.5 rounded-md transition-all',
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

      {/* Content */}
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
          <button className="border-2 border-dashed border-brand-line hover:border-brand-accent hover:bg-brand-accent-bg rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-brand-ink-3 hover:text-brand-accent transition-all min-h-[200px]">
            <div className="w-8 h-8 rounded-lg border-2 border-dashed border-current flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-[13px] font-medium">New agent</span>
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
