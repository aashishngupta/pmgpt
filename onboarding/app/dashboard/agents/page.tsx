'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AGENTS, Agent, AgentCategory } from '@/lib/platform-data';
import { cn } from '@/lib/utils';
import {
  Target, FileText, BarChart2, Search, Layers, GitPullRequest,
  Terminal, Trophy, TrendingUp, GraduationCap, Scale, Rocket, Globe,
  MessageSquare, Settings2, Plus, Zap, Clock, Shield, Power,
  MessageCircle, GitBranch, Home, RefreshCw,
} from 'lucide-react';

// ── Icon map ──────────────────────────────────────────────────────────────────

const AGENT_ICONS: Record<string, React.ElementType> = {
  strategy: Target, docs: FileText, analytics: BarChart2, research: Search,
  ops: Layers, review: GitPullRequest, engineering: Terminal, competitive: Trophy,
  sales: TrendingUp, coach: GraduationCap, prioritization: Scale,
  release: Rocket, market: Globe,
  social_signal: MessageSquare, signal_aggregator: Zap,
  research_orchestrator: Search, gtm: MessageCircle,
};

// ── Category config ───────────────────────────────────────────────────────────

const CATEGORIES: { id: AgentCategory | 'all'; label: string }[] = [
  { id: 'all',          label: 'All Agents'  },
  { id: 'intelligence', label: 'Intelligence' },
  { id: 'research',     label: 'Research'    },
  { id: 'strategy',     label: 'Strategy'    },
  { id: 'execution',    label: 'Execution'   },
  { id: 'ops',          label: 'Ops'         },
  { id: 'launch',       label: 'Launch'      },
  { id: 'quality',      label: 'Quality'     },
];

const CATEGORY_META: Record<AgentCategory, { label: string; description: string; color: string }> = {
  intelligence: { label: 'Intelligence — Signal Collection',  description: 'Monitor internal metrics, user feedback, competitor moves, and community signals',    color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  research:     { label: 'Research Synthesis',               description: 'Aggregate, cluster, and surface signals — the PM\'s unified research interface',        color: 'text-amber-600 bg-amber-50 border-amber-100'       },
  strategy:     { label: 'Strategy',                          description: 'OKRs, roadmaps, strategic bets, prioritization, and stakeholder alignment',            color: 'text-violet-600 bg-violet-50 border-violet-100'    },
  execution:    { label: 'Execution',                         description: 'PRDs, user stories, Jira tickets, RFCs, and acceptance criteria',                      color: 'text-blue-600 bg-blue-50 border-blue-100'          },
  ops:          { label: 'Sprint & Ops',                      description: 'Sprint planning, standups, retros, meeting notes, and routine PM automation',          color: 'text-orange-600 bg-orange-50 border-orange-100'    },
  launch:       { label: 'Launch',                            description: 'GTM planning, launch messaging, sales enablement, release management',                  color: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100' },
  quality:      { label: 'Quality & Growth',                  description: 'PRD reviews, spec quality checks, and PM career coaching',                             color: 'text-pink-600 bg-pink-50 border-pink-100'          },
};

const CATEGORY_COLORS: Record<AgentCategory, string> = {
  strategy:     'text-violet-600 bg-violet-50 border-violet-100',
  execution:    'text-blue-600 bg-blue-50 border-blue-100',
  research:     'text-amber-600 bg-amber-50 border-amber-100',
  intelligence: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  ops:          'text-orange-600 bg-orange-50 border-orange-100',
  launch:       'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100',
  quality:      'text-pink-600 bg-pink-50 border-pink-100',
};

// ── Trust level config ────────────────────────────────────────────────────────

const TRUST_CONFIG = {
  sandboxed:  { label: 'Read-only',  color: 'text-brand-ink-3 bg-brand-elevated border-brand-line', icon: Shield  },
  assisted:   { label: 'Assisted',   color: 'text-amber-600 bg-amber-50 border-amber-100',           icon: Shield  },
  autonomous: { label: 'Autonomous', color: 'text-red-600 bg-red-50 border-red-100',                 icon: Shield  },
};

// ── Surface tags ──────────────────────────────────────────────────────────────

const SURFACE_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  chat:       { label: 'Chat',       icon: MessageCircle },
  workflow:   { label: 'Workflow',   icon: GitBranch     },
  home:       { label: 'Home',       icon: Home          },
  background: { label: 'Background', icon: RefreshCw     },
};

// ── Health dot ────────────────────────────────────────────────────────────────

function HealthDot({ score }: { score: number }) {
  const color = score >= 93 ? 'bg-brand-green' : score >= 85 ? 'bg-brand-amber' : 'bg-brand-red';
  return <span className={cn('inline-block w-1.5 h-1.5 rounded-full flex-shrink-0', color)} />;
}

// ── Toggle ────────────────────────────────────────────────────────────────────

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

// ── Agent card ────────────────────────────────────────────────────────────────

function AgentCard({ agent, active, onToggle }: {
  agent: Agent; active: boolean; onToggle: (v: boolean) => void;
}) {
  const Icon        = AGENT_ICONS[agent.id] ?? Zap;
  const router      = useRouter();
  const catStyle    = CATEGORY_COLORS[agent.category];
  const trustCfg    = TRUST_CONFIG[agent.trustLevel];
  const TrustIcon   = trustCfg.icon;
  const activeTriggers = agent.triggers.filter(t => t.enabled).length;

  return (
    <div className={cn(
      'group bg-brand-surface border rounded-2xl p-5 flex flex-col gap-4 transition-all hover:shadow-md hover:border-brand-ink-4 cursor-pointer',
      active ? 'border-brand-line' : 'border-brand-line opacity-60',
    )}
      onClick={() => router.push(`/dashboard/agents/${agent.id}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            'w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0',
            agent.bg, 'border-current/10',
          )}>
            <Icon className={cn('w-5 h-5', agent.color)} />
          </div>
          {/* Identity */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[13px] font-semibold text-brand-ink leading-tight">{agent.name}</span>
              {agent.status === 'beta' && (
                <span className="text-[9px] font-bold px-1.5 py-[2px] rounded bg-brand-amber-bg text-brand-amber uppercase tracking-wide border border-brand-amber/20">Beta</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className={cn('text-[10px] font-semibold px-1.5 py-[2px] rounded-md border uppercase tracking-wide', catStyle)}>
                {agent.category}
              </span>
              <span className={cn('flex items-center gap-1 text-[10px] font-medium px-1.5 py-[2px] rounded-md border', trustCfg.color)}>
                <TrustIcon className="w-2.5 h-2.5" />
                {trustCfg.label}
              </span>
            </div>
          </div>
        </div>
        <Toggle on={active} onChange={onToggle} />
      </div>

      {/* Description */}
      <p className="text-[12px] text-brand-ink-3 leading-relaxed line-clamp-2 -mt-1">
        {agent.description}
      </p>

      {/* Output types */}
      <div className="flex flex-wrap gap-1">
        {agent.primaryOutputTypes.map(t => (
          <span key={t} className="text-[10px] text-brand-ink-2 bg-brand-elevated px-1.5 py-[3px] rounded-md border border-brand-line-2">
            {t}
          </span>
        ))}
      </div>

      {/* Invocation surfaces */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {agent.invocationSurfaces.map(s => {
          const cfg = SURFACE_CONFIG[s];
          if (!cfg) return null;
          const SIcon = cfg.icon;
          return (
            <span key={s} className="flex items-center gap-1 text-[10px] text-brand-ink-3 bg-brand-canvas px-1.5 py-[3px] rounded border border-brand-line-2">
              <SIcon className="w-2.5 h-2.5" />
              {cfg.label}
            </span>
          );
        })}
        {activeTriggers > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-brand-accent bg-brand-accent-bg px-1.5 py-[3px] rounded border border-brand-accent/20">
            <Clock className="w-2.5 h-2.5" />
            {activeTriggers} trigger{activeTriggers > 1 ? 's' : ''} on
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 py-3 border-t border-b border-brand-line-2 -mx-1 px-1">
        <div className="flex items-center gap-1.5">
          <HealthDot score={agent.healthScore} />
          <span className="text-[11px] font-semibold text-brand-ink">{agent.healthScore}</span>
          <span className="text-[10px] text-brand-ink-3">health</span>
        </div>
        <div className="w-px h-3 bg-brand-line-2" />
        <span className="text-[11px] text-brand-ink-3">
          <span className="font-semibold text-brand-ink">{agent.stats.satisfactionPct}%</span> sat
        </span>
        <div className="w-px h-3 bg-brand-line-2" />
        <span className="text-[11px] text-brand-ink-3">
          <span className="font-semibold text-brand-ink">
            {agent.stats.queries >= 1000 ? `${(agent.stats.queries / 1000).toFixed(1)}k` : agent.stats.queries}
          </span> qr
        </span>
        <div className="w-px h-3 bg-brand-line-2 ml-auto" />
        <span className="text-[10px] font-mono text-brand-ink-3">{(agent.stats.avgLatencyMs / 1000).toFixed(1)}s</span>
      </div>

      {/* Connectors */}
      {agent.connectors.length > 0 ? (
        <div className="flex flex-wrap gap-1 -mt-1">
          {agent.connectors.slice(0, 4).map(c => (
            <span key={c} className="text-[10px] font-medium px-1.5 py-[2px] rounded bg-brand-elevated border border-brand-line text-brand-ink-2 uppercase tracking-wide">
              {c}
            </span>
          ))}
          {agent.connectors.length > 4 && (
            <span className="text-[10px] text-brand-ink-3 py-[2px]">+{agent.connectors.length - 4}</span>
          )}
        </div>
      ) : (
        <span className="text-[11px] text-brand-ink-4 -mt-1">No connectors — knowledge only</span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 pt-0.5">
        <Link
          href={`/dashboard/chat?agent=${agent.id}`}
          onClick={e => e.stopPropagation()}
          className="flex-1"
        >
          <button className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-brand-accent hover:bg-brand-accent-dim text-white text-[12px] font-medium transition-colors">
            <MessageSquare className="w-3 h-3" /> Chat
          </button>
        </Link>
        <button
          onClick={e => { e.stopPropagation(); router.push(`/dashboard/agents/${agent.id}`); }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-brand-line hover:bg-brand-elevated text-[12px] font-medium text-brand-ink-2 transition-colors"
        >
          <Settings2 className="w-3 h-3" /> Configure
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const [category, setCategory] = useState<AgentCategory | 'all'>('all');
  const [search,   setSearch]   = useState('');
  const [activeMap, setActiveMap] = useState<Record<string, boolean>>(
    Object.fromEntries(AGENTS.map(a => [a.id, a.status !== 'inactive'])),
  );

  const toggle = (id: string, val: boolean) =>
    setActiveMap(prev => ({ ...prev, [id]: val }));

  const filtered = AGENTS.filter(a => {
    const matchCat    = category === 'all' || a.category === category;
    const matchSearch = search === '' ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase()) ||
      a.capabilities.some(c => c.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const activeCount     = Object.values(activeMap).filter(Boolean).length;
  const triggersEnabled = AGENTS.reduce((s, a) => s + a.triggers.filter(t => t.enabled).length, 0);
  const writeCount      = AGENTS.reduce((s, a) => s + a.tools.filter(t => t.category === 'write' && t.requiresApproval).length, 0);
  const avgHealth       = Math.round(AGENTS.reduce((s, a) => s + a.healthScore, 0) / AGENTS.length);

  return (
    <div className="px-7 py-6 max-w-[1280px] mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-brand-ink tracking-tight">Agents</h1>
          <p className="text-[13px] text-brand-ink-3 mt-0.5">
            {activeCount} of {AGENTS.length} active — your AI workforce for every PM workflow
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-accent hover:bg-brand-accent-dim text-white text-[13px] font-semibold transition-colors shadow-sm">
          <Plus className="w-3.5 h-3.5" /> New Agent
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Agents',      value: String(AGENTS.length),   icon: Zap,    accent: 'text-brand-accent'   },
          { label: 'Active',            value: String(activeCount),      icon: Power,  accent: 'text-brand-green'    },
          { label: 'Auto Triggers',     value: String(triggersEnabled),  icon: Clock,  accent: triggersEnabled > 0 ? 'text-brand-accent' : 'text-brand-ink-3' },
          { label: 'Approval-gated',    value: String(writeCount),       icon: Shield, accent: 'text-brand-amber'    },
        ].map(s => (
          <div key={s.label} className="bg-brand-surface border border-brand-line rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-elevated border border-brand-line-2 flex items-center justify-center flex-shrink-0">
              <s.icon className={cn('w-4 h-4', s.accent)} />
            </div>
            <div>
              <div className="text-[20px] font-mono font-bold text-brand-ink leading-none">{s.value}</div>
              <div className="text-[11px] text-brand-ink-3 mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Category tabs */}
        <div className="flex items-center gap-0.5 p-1 bg-brand-elevated rounded-xl border border-brand-line">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id as AgentCategory | 'all')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap',
                category === c.id
                  ? 'bg-brand-surface text-brand-ink shadow-sm border border-brand-line'
                  : 'text-brand-ink-3 hover:text-brand-ink',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-ink-3" />
          <input
            type="text"
            placeholder="Search agents…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-[12px] border border-brand-line rounded-xl bg-brand-surface text-brand-ink placeholder-brand-ink-4 focus:outline-none focus:border-brand-accent w-56 transition-all focus:w-72"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-4">
        {filtered.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            active={activeMap[agent.id] !== false}
            onToggle={v => toggle(agent.id, v)}
          />
        ))}

        {/* New agent card */}
        <button className="border-2 border-dashed border-brand-line hover:border-brand-accent hover:bg-brand-accent-bg rounded-2xl p-5 flex flex-col items-center justify-center gap-3 text-brand-ink-3 hover:text-brand-accent transition-all min-h-[260px]">
          <div className="w-10 h-10 rounded-xl border-2 border-dashed border-current flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </div>
          <div className="text-center">
            <p className="text-[13px] font-semibold">New agent</p>
            <p className="text-[11px] opacity-70 mt-1 leading-snug">Custom persona, model,<br />system prompt & tools</p>
          </div>
        </button>
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="w-10 h-10 text-brand-ink-4 mb-3" />
          <p className="text-[15px] font-semibold text-brand-ink">No agents found</p>
          <p className="text-[13px] text-brand-ink-3 mt-1">Try a different search term or category filter</p>
        </div>
      )}
    </div>
  );
}
