'use client';

import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Send, Bot, Loader2, X, Brain, FileText, Link2,
  Plus, Copy, Check, ChevronDown, Sparkles,
  PanelLeft, CheckCircle2, AlertTriangle, Zap,
  Target, BarChart2, Search, Layers, GitPullRequest,
  Terminal, Trophy, TrendingUp, GraduationCap, Scale, Rocket, Globe,
  MoreHorizontal, Trash2, MessageSquare, ArrowUpRight,
  Paperclip, AtSign, LayoutTemplate,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AGENTS, Agent } from '@/lib/platform-data';
import { api, Thread } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = 'user' | 'assistant';

interface Source { title: string; url: string; connector: string }

interface ArtifactCard {
  type: 'artifact';
  title: string;
  kind: 'prd' | 'analysis' | 'report' | 'summary' | 'ticket';
  sections?: number;
  status: 'draft' | 'ready';
}

interface PermissionCard {
  type: 'permission';
  action: string;
  destination: string;
  preview?: string;
  approved?: boolean;
  rejected?: boolean;
}

interface Message {
  id: string;
  role: Role;
  content: string;
  agent?: string;
  sources?: Source[];
  card?: ArtifactCard | PermissionCard;
  followUps?: string[];
  ts: Date;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const AGENT_ICONS: Record<string, React.ElementType> = {
  strategy: Target, docs: FileText, analytics: BarChart2, research: Search,
  ops: Layers, review: GitPullRequest, engineering: Terminal, competitive: Trophy,
  sales: TrendingUp, coach: GraduationCap, prioritization: Scale,
  release: Rocket, market: Globe, general: Bot,
};

const AGENT_GRADIENT: Record<string, string> = {
  strategy:      'from-violet-500 to-purple-600',
  docs:          'from-blue-500 to-indigo-600',
  analytics:     'from-emerald-500 to-teal-600',
  research:      'from-amber-500 to-orange-500',
  ops:           'from-orange-500 to-red-500',
  engineering:   'from-slate-500 to-slate-700',
  competitive:   'from-red-500 to-rose-600',
  sales:         'from-teal-500 to-cyan-600',
  coach:         'from-pink-500 to-rose-500',
  prioritization:'from-indigo-500 to-blue-600',
  release:       'from-cyan-500 to-blue-500',
  market:        'from-lime-500 to-green-600',
  general:       'from-brand-accent to-indigo-700',
};

const STARTERS: Record<string, { label: string; prompt: string }[]> = {
  docs: [
    { label: 'Write a PRD',            prompt: 'Help me write a PRD for mobile onboarding redesign'       },
    { label: 'Draft release notes',    prompt: 'Draft release notes for our Q2 analytics dashboard launch'},
    { label: 'Create user stories',    prompt: 'Generate user stories for the new export feature'         },
    { label: 'Write a design brief',   prompt: 'Write a design brief for the settings page redesign'      },
  ],
  analytics: [
    { label: 'Diagnose activation drop', prompt: 'Activation rate dropped 1.1% this week — investigate'  },
    { label: 'Funnel analysis',          prompt: 'Run a funnel analysis for our onboarding flow'          },
    { label: 'A/B test readout',         prompt: 'Summarize results of the pricing page A/B test'         },
    { label: 'Weekly metrics digest',    prompt: 'Give me this week\'s key product metrics summary'       },
  ],
  strategy: [
    { label: 'Build Q3 OKRs',          prompt: 'Help me define Q3 OKRs for a B2B SaaS PM tool'           },
    { label: 'GTM strategy',           prompt: 'Create a go-to-market strategy for our enterprise tier'   },
    { label: 'Roadmap prioritization', prompt: 'Help me prioritize the Q3 roadmap based on impact vs effort' },
    { label: 'Positioning statement',  prompt: 'Write a positioning statement for our analytics product'  },
  ],
  ops: [
    { label: 'Sprint summary',         prompt: 'Write a sprint 24 summary for stakeholders'               },
    { label: 'Daily standup',          prompt: 'Generate my daily standup update from Jira'               },
    { label: 'Grooming prep',          prompt: 'Prepare grooming notes for next week\'s sprint planning'  },
    { label: 'Release checklist',      prompt: 'Create a release checklist for v2.4 going out Friday'    },
  ],
  general: [
    { label: 'Write sprint summary',     prompt: 'Write a sprint 24 summary for stakeholders'            },
    { label: 'Draft a PRD',             prompt: 'Help me write a PRD for mobile onboarding redesign'     },
    { label: 'Diagnose activation drop', prompt: 'Activation rate dropped 1.1% this week — investigate' },
    { label: 'Build Q3 OKRs',           prompt: 'Help me define Q3 OKRs for a B2B SaaS PM tool'        },
  ],
};

const ARTIFACT_KIND_CONFIG = {
  prd:      { icon: FileText, label: 'PRD', color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100' },
  analysis: { icon: BarChart2, label: 'Analysis', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  report:   { icon: FileText, label: 'Report', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
  summary:  { icon: Layers, label: 'Summary', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  ticket:   { icon: GitPullRequest, label: 'Ticket', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
};

// ── Agent avatar ──────────────────────────────────────────────────────────────

function AgentAvatar({ agentId, size = 'sm' }: { agentId: string; size?: 'sm' | 'md' | 'lg' }) {
  const Icon = AGENT_ICONS[agentId] ?? Bot;
  const gradient = AGENT_GRADIENT[agentId] ?? 'from-brand-accent to-indigo-700';
  const sz = size === 'lg' ? 'w-12 h-12' : size === 'md' ? 'w-8 h-8' : 'w-6 h-6';
  const isz = size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3 h-3';
  return (
    <div className={cn('rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0', sz, gradient)}>
      <Icon className={cn('text-white', isz)} />
    </div>
  );
}

// ── Thread sidebar ────────────────────────────────────────────────────────────

function ThreadSidebar({
  threads, activeId, onSelect, onCreate, onDelete,
}: {
  threads: Thread[];
  activeId: string | null;
  onSelect: (t: Thread) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="w-[220px] flex-shrink-0 border-r border-brand-line bg-brand-surface flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-3 border-b border-brand-line">
        <span className="text-[11px] font-semibold text-brand-ink-3 uppercase tracking-widest">Threads</span>
        <button
          onClick={onCreate}
          className="p-1 rounded-md text-brand-ink-3 hover:text-brand-accent hover:bg-brand-accent-bg transition-colors"
          title="New conversation"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {threads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageSquare className="w-8 h-8 text-brand-ink-4 mb-3" />
            <p className="text-[12px] font-medium text-brand-ink-3 mb-1">No threads yet</p>
            <p className="text-[11px] text-brand-ink-4">Start a conversation below</p>
          </div>
        )}
        {threads.map(t => {
          const Icon = AGENT_ICONS[t.agent_id] ?? Bot;
          const isActive = t.id === activeId;
          return (
            <div
              key={t.id}
              className={cn(
                'group flex items-start gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all',
                isActive
                  ? 'bg-brand-accent-bg border border-brand-accent/20'
                  : 'hover:bg-brand-elevated border border-transparent',
              )}
              onClick={() => onSelect(t)}
            >
              <div className={cn(
                'w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 bg-gradient-to-br',
                AGENT_GRADIENT[t.agent_id] ?? 'from-brand-accent to-indigo-700',
              )}>
                <Icon className="w-2.5 h-2.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-[12px] font-medium truncate leading-tight', isActive ? 'text-brand-accent-text' : 'text-brand-ink-2')}>
                  {t.title}
                </p>
                <p className="text-[10px] text-brand-ink-4 mt-0.5 flex items-center gap-1">
                  <span className={cn('w-1.5 h-1.5 rounded-full inline-block', {
                    'bg-brand-green': t.status === 'published',
                    'bg-brand-amber': t.status === 'draft',
                    'bg-brand-ink-4': t.status === 'archived',
                  })} />
                  {t.status}
                </p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); onDelete(t.id); }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-brand-ink-4 hover:text-brand-red flex-shrink-0 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Source chips ──────────────────────────────────────────────────────────────

function SourceChips({ sources }: { sources: Source[] }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {sources.map((s, i) => (
        <a
          key={i}
          href={s.url}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-brand-elevated border border-brand-line text-[11px] text-brand-ink-2 hover:text-brand-accent hover:border-brand-accent/30 hover:bg-brand-accent-bg transition-all"
        >
          <Link2 className="w-2.5 h-2.5 flex-shrink-0" />
          <span className="font-medium">{s.connector}</span>
          <span className="text-brand-ink-4">·</span>
          <span className="truncate max-w-[140px]">{s.title}</span>
          <ArrowUpRight className="w-2.5 h-2.5 flex-shrink-0 opacity-50" />
        </a>
      ))}
    </div>
  );
}

// ── Artifact card ─────────────────────────────────────────────────────────────

function ArtifactCardBlock({ card }: { card: ArtifactCard }) {
  const cfg = ARTIFACT_KIND_CONFIG[card.kind];
  const Icon = cfg.icon;
  return (
    <div className={cn('mt-3 rounded-xl border p-4 flex items-start gap-3', cfg.border, cfg.bg)}>
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-white border', cfg.border)}>
        <Icon className={cn('w-4 h-4', cfg.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={cn('text-[10px] font-bold uppercase tracking-wider', cfg.color)}>{cfg.label}</span>
          <span className={cn(
            'text-[9px] font-semibold px-1.5 py-0.5 rounded-full',
            card.status === 'ready' ? 'bg-brand-green-bg text-brand-green' : 'bg-brand-amber-bg text-brand-amber',
          )}>
            {card.status === 'ready' ? 'Ready to review' : 'Draft'}
          </span>
        </div>
        <p className="text-[14px] font-semibold text-brand-ink leading-tight">{card.title}</p>
        {card.sections && (
          <p className="text-[11px] text-brand-ink-3 mt-0.5">{card.sections} sections</p>
        )}
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button className="text-[12px] font-medium text-brand-ink-2 hover:text-brand-ink px-3 py-1.5 rounded-lg border border-brand-line bg-white hover:bg-brand-elevated transition-all">
          Open
        </button>
        <button className={cn('text-[12px] font-medium text-white px-3 py-1.5 rounded-lg transition-all bg-gradient-to-r', AGENT_GRADIENT['docs'])}>
          Push to Notion
        </button>
      </div>
    </div>
  );
}

// ── Permission card ───────────────────────────────────────────────────────────

function PermissionCardBlock({
  card, onApprove, onReject,
}: { card: PermissionCard; onApprove: () => void; onReject: () => void }) {
  if (card.approved) {
    return (
      <div className="mt-3 rounded-xl border border-brand-green/30 bg-brand-green-bg p-4 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-brand-green flex-shrink-0" />
        <div>
          <p className="text-[13px] font-semibold text-brand-ink">Action approved</p>
          <p className="text-[11px] text-brand-ink-3">{card.action} → {card.destination}</p>
        </div>
      </div>
    );
  }
  if (card.rejected) {
    return (
      <div className="mt-3 rounded-xl border border-brand-line bg-brand-elevated p-4 flex items-center gap-3">
        <X className="w-4 h-4 text-brand-ink-3 flex-shrink-0" />
        <p className="text-[13px] text-brand-ink-3">Action cancelled</p>
      </div>
    );
  }
  return (
    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Permission required</span>
          </div>
          <p className="text-[14px] font-semibold text-brand-ink">{card.action}</p>
          <p className="text-[12px] text-brand-ink-2 mt-0.5">
            Destination: <span className="font-medium text-brand-ink">{card.destination}</span>
          </p>
          {card.preview && (
            <div className="mt-2 p-2.5 rounded-lg bg-white border border-amber-200 text-[12px] text-brand-ink-2 font-mono leading-relaxed">
              {card.preview}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 pl-11">
        <button
          onClick={onApprove}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-ink text-white text-[12px] font-semibold hover:bg-brand-ink/90 transition-all"
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
        </button>
        <button
          onClick={onReject}
          className="px-4 py-2 rounded-lg border border-brand-line bg-white text-[12px] font-medium text-brand-ink-2 hover:bg-brand-elevated transition-all"
        >
          Cancel
        </button>
        <button className="px-4 py-2 rounded-lg border border-brand-line bg-white text-[12px] font-medium text-brand-ink-2 hover:bg-brand-elevated transition-all">
          Edit
        </button>
      </div>
    </div>
  );
}

// ── Follow-up chips ───────────────────────────────────────────────────────────

function FollowUpChips({ chips, onSelect }: { chips: string[]; onSelect: (s: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {chips.map((c, i) => (
        <button
          key={i}
          onClick={() => onSelect(c)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-line bg-brand-surface text-[12px] text-brand-ink-2 hover:border-brand-accent/40 hover:text-brand-accent hover:bg-brand-accent-bg transition-all"
        >
          <Zap className="w-3 h-3" />
          {c}
        </button>
      ))}
    </div>
  );
}

// ── Markdown renderer ─────────────────────────────────────────────────────────

function fmt(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**'))
      return <strong key={i} className="font-semibold text-brand-ink">{p.slice(2, -2)}</strong>;
    if (p.startsWith('`') && p.endsWith('`'))
      return <code key={i} className="px-1.5 py-0.5 rounded bg-brand-elevated text-brand-ink text-[12px] font-mono border border-brand-line">{p.slice(1, -1)}</code>;
    return <span key={i}>{p}</span>;
  });
}

function MD({ content }: { content: string }) {
  return (
    <div className="space-y-1.5">
      {content.split('\n').map((line, i) => {
        if (line.startsWith('# '))
          return <h2 key={i} className="text-[18px] font-bold text-brand-ink mt-3 mb-1 leading-tight">{line.slice(2)}</h2>;
        if (line.startsWith('## '))
          return <h3 key={i} className="text-[15px] font-semibold text-brand-ink mt-2 mb-1 leading-tight">{line.slice(3)}</h3>;
        if (line.startsWith('### '))
          return <h4 key={i} className="text-[13px] font-semibold text-brand-ink mt-1.5 mb-0.5">{line.slice(4)}</h4>;
        if (line.startsWith('> '))
          return <blockquote key={i} className="border-l-2 border-brand-accent/40 pl-3 italic text-[13px] text-brand-ink-2">{fmt(line.slice(2))}</blockquote>;
        if (line.startsWith('- ') || line.startsWith('* '))
          return <li key={i} className="ml-4 list-disc text-[14px] leading-relaxed text-brand-ink-2">{fmt(line.slice(2))}</li>;
        if (line.match(/^\d+\. /))
          return <li key={i} className="ml-4 list-decimal text-[14px] leading-relaxed text-brand-ink-2">{fmt(line.replace(/^\d+\. /, ''))}</li>;
        if (line === '') return <div key={i} className="h-1.5" />;
        return <p key={i} className="text-[14px] leading-relaxed text-brand-ink-2">{fmt(line)}</p>;
      })}
    </div>
  );
}

// ── Message row ───────────────────────────────────────────────────────────────

function MessageRow({
  msg, agentId, onPermissionApprove, onPermissionReject, onFollowUp,
}: {
  msg: Message;
  agentId: string;
  onPermissionApprove: (msgId: string) => void;
  onPermissionReject: (msgId: string) => void;
  onFollowUp: (text: string) => void;
}) {
  const isUser = msg.role === 'user';
  const [copied, setCopied] = useState(false);

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[70%] px-4 py-3 rounded-2xl rounded-tr-sm bg-brand-accent text-white text-[14px] leading-relaxed shadow-sm">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 group">
      <AgentAvatar agentId={agentId} size="sm" />
      <div className="flex-1 min-w-0 pb-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[12px] font-semibold text-brand-ink">
            {AGENTS.find(a => a.id === (msg.agent ?? agentId))?.name ?? 'pmGPT'}
          </span>
          <span className="text-[11px] text-brand-ink-4">
            {msg.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <MD content={msg.content} />

        {/* Structured cards */}
        {msg.card?.type === 'artifact' && <ArtifactCardBlock card={msg.card} />}
        {msg.card?.type === 'permission' && (
          <PermissionCardBlock
            card={msg.card}
            onApprove={() => onPermissionApprove(msg.id)}
            onReject={() => onPermissionReject(msg.id)}
          />
        )}

        {/* Source chips */}
        {msg.sources && msg.sources.length > 0 && <SourceChips sources={msg.sources} />}

        {/* Follow-up chips */}
        {msg.followUps && msg.followUps.length > 0 && (
          <FollowUpChips chips={msg.followUps} onSelect={onFollowUp} />
        )}

        {/* Hover actions */}
        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => { navigator.clipboard.writeText(msg.content); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-brand-ink-3 hover:text-brand-ink hover:bg-brand-elevated text-[11px] transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-brand-green" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Empty / welcome state ─────────────────────────────────────────────────────

function WelcomeScreen({ agent, onSelect }: { agent: Agent; onSelect: (p: string) => void }) {
  const starters = STARTERS[agent.id] ?? STARTERS['general'];
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 max-w-2xl mx-auto w-full">
      <AgentAvatar agentId={agent.id} size="lg" />
      <h1 className="mt-4 text-[22px] font-bold text-brand-ink tracking-tight">{agent.name}</h1>
      <p className="mt-1.5 text-[14px] text-brand-ink-3 text-center max-w-md leading-relaxed">
        {agent.description}
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 w-full">
        {starters.map((s, i) => (
          <button
            key={i}
            onClick={() => onSelect(s.prompt)}
            className="group text-left p-4 rounded-xl border border-brand-line bg-brand-surface hover:border-brand-accent/40 hover:bg-brand-accent-bg hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-md bg-brand-accent-bg border border-brand-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-brand-accent group-hover:border-brand-accent transition-all">
                <Sparkles className="w-3 h-3 text-brand-accent group-hover:text-white transition-colors" />
              </div>
              <span className="text-[13px] font-medium text-brand-ink-2 group-hover:text-brand-ink leading-snug transition-colors">
                {s.label}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Agent dropdown ────────────────────────────────────────────────────────────

function AgentDropdown({
  agentId, onSelect,
}: { agentId: string; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const agent = AGENTS.find(a => a.id === agentId) ?? AGENTS[0];

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-brand-line bg-brand-surface hover:border-brand-accent/40 hover:bg-brand-accent-bg transition-all"
      >
        <AgentAvatar agentId={agentId} size="sm" />
        <span className="text-[13px] font-semibold text-brand-ink">{agent.name}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-brand-ink-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-72 bg-brand-surface border border-brand-line rounded-xl shadow-2xl z-50 py-1.5 overflow-hidden">
          <div className="px-3 py-2 border-b border-brand-line-2">
            <span className="text-[10px] font-semibold text-brand-ink-3 uppercase tracking-widest">Choose agent</span>
          </div>
          <div className="max-h-80 overflow-y-auto py-1">
            {AGENTS.map(a => {
              const isCurrent = a.id === agentId;
              return (
                <button
                  key={a.id}
                  onClick={() => { setOpen(false); onSelect(a.id); }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors',
                    isCurrent ? 'bg-brand-accent-bg' : 'hover:bg-brand-elevated',
                  )}
                >
                  <AgentAvatar agentId={a.id} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[13px] font-semibold', isCurrent ? 'text-brand-accent-text' : 'text-brand-ink')}>
                        {a.name}
                      </span>
                      {a.status === 'beta' && (
                        <span className="text-[9px] font-bold text-brand-amber bg-brand-amber-bg px-1.5 py-0.5 rounded-full">β</span>
                      )}
                    </div>
                    <p className="text-[11px] text-brand-ink-3 truncate">{a.description.slice(0, 52)}…</p>
                  </div>
                  {isCurrent && <CheckCircle2 className="w-4 h-4 text-brand-accent flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Input area ────────────────────────────────────────────────────────────────

function ChatInput({
  value, onChange, onSend, onStarterSelect, loading, placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onStarterSelect?: (p: string) => void;
  loading: boolean;
  placeholder: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); }
  }

  // Auto-grow textarea
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = Math.min(ref.current.scrollHeight, 200) + 'px';
    }
  }, [value]);

  return (
    <div className="border-t border-brand-line bg-brand-surface px-4 py-4">
      <div className="max-w-3xl mx-auto">
        <div className="relative rounded-2xl border border-brand-line bg-brand-canvas focus-within:border-brand-accent/50 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.08)] transition-all">
          <textarea
            ref={ref}
            rows={1}
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={loading}
            className="w-full resize-none bg-transparent px-4 pt-3.5 pb-10 text-[14px] text-brand-ink placeholder-brand-ink-4 focus:outline-none leading-relaxed disabled:opacity-50 min-h-[52px] max-h-[200px]"
          />
          {/* Action bar inside input */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-0.5">
              <button className="p-1.5 rounded-md text-brand-ink-4 hover:text-brand-ink-2 hover:bg-brand-elevated transition-colors" title="Attach file">
                <Paperclip className="w-3.5 h-3.5" />
              </button>
              <button className="p-1.5 rounded-md text-brand-ink-4 hover:text-brand-ink-2 hover:bg-brand-elevated transition-colors" title="Mention agent">
                <AtSign className="w-3.5 h-3.5" />
              </button>
              <button className="p-1.5 rounded-md text-brand-ink-4 hover:text-brand-ink-2 hover:bg-brand-elevated transition-colors" title="Templates">
                <LayoutTemplate className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={onSend}
              disabled={!value.trim() || loading}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] font-semibold transition-all',
                value.trim() && !loading
                  ? 'bg-brand-accent text-white hover:bg-brand-accent-dim shadow-sm hover:shadow-md'
                  : 'bg-brand-elevated text-brand-ink-4 cursor-not-allowed',
              )}
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {loading ? 'Thinking…' : 'Send'}
            </button>
          </div>
        </div>
        <p className="text-center text-[11px] text-brand-ink-4 mt-2">
          Press <kbd className="px-1 py-0.5 rounded bg-brand-elevated border border-brand-line font-mono text-[10px]">↵</kbd> to send · <kbd className="px-1 py-0.5 rounded bg-brand-elevated border border-brand-line font-mono text-[10px]">Shift ↵</kbd> for new line
        </p>
      </div>
    </div>
  );
}

// ── Thinking indicator ────────────────────────────────────────────────────────

function ThinkingIndicator({ agentId }: { agentId: string }) {
  const agent = AGENTS.find(a => a.id === agentId);
  return (
    <div className="flex gap-3">
      <AgentAvatar agentId={agentId} size="sm" />
      <div className="flex flex-col gap-1.5 pt-1">
        <span className="text-[12px] font-semibold text-brand-ink">{agent?.name ?? 'pmGPT'}</span>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-brand-accent/60"
                style={{ animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite` }}
              />
            ))}
          </div>
          <span className="text-[12px] text-brand-ink-3">Thinking…</span>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function ChatPageInner() {
  const params = useSearchParams();

  const [threads, setThreads]           = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [messages, setMessages]         = useState<Message[]>([]);
  const [input, setInput]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [agentId, setAgentId]           = useState(params.get('agent') || 'general');
  const [sidebarOpen, setSidebarOpen]   = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const agent = AGENTS.find(a => a.id === agentId) ?? AGENTS[0];

  useEffect(() => {
    api.threads.list()
      .then(ts => setThreads(ts))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const q = params.get('q');
    const a = params.get('agent');
    if (a) setAgentId(a);
    if (q) setTimeout(() => handleSend(q, a ?? agentId), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function selectThread(t: Thread) {
    setActiveThread(t);
    setAgentId(t.agent_id);
    setMessages([]);
    try {
      const msgs = await api.threads.messages(t.id);
      setMessages(msgs.map((m, i) => ({
        id: `${i}`, role: m.role as Role, content: m.content, ts: new Date(m.ts),
      })));
    } catch { /* keep empty */ }
  }

  function newConversation() {
    setActiveThread(null);
    setMessages([]);
  }

  async function deleteThread(id: string) {
    try {
      await api.threads.delete(id);
      setThreads(prev => prev.filter(t => t.id !== id));
      if (activeThread?.id === id) newConversation();
    } catch { /* ignore */ }
  }

  function handlePermissionApprove(msgId: string) {
    setMessages(prev => prev.map(m =>
      m.id === msgId && m.card?.type === 'permission'
        ? { ...m, card: { ...m.card, approved: true } }
        : m,
    ));
  }

  function handlePermissionReject(msgId: string) {
    setMessages(prev => prev.map(m =>
      m.id === msgId && m.card?.type === 'permission'
        ? { ...m, card: { ...m.card, rejected: true } }
        : m,
    ));
  }

  async function handleSend(text?: string, aid?: string) {
    const query = (text ?? input).trim();
    if (!query || loading) return;
    setInput('');

    const usedAgent = aid ?? agentId;
    const userMsg: Message = { id: `u${Date.now()}`, role: 'user', content: query, ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      let thread = activeThread;
      if (!thread) {
        thread = await api.threads.create({
          agent_id: usedAgent,
          title: query.slice(0, 60) + (query.length > 60 ? '…' : ''),
        });
        setActiveThread(thread);
        setThreads(prev => [thread!, ...prev]);
      }

      const data = await api.threads.chat(thread.id, {
        query,
        agent: usedAgent === 'general' ? undefined : usedAgent,
        history: messages.map(m => ({ role: m.role, content: m.content })),
      });

      // Build follow-up suggestions based on context
      const followUps = generateFollowUps(query, usedAgent);

      setMessages(prev => [...prev, {
        id: `a${Date.now()}`,
        role: 'assistant',
        content: data.response,
        agent: data.agent,
        sources: data.sources,
        followUps,
        ts: new Date(),
      }]);

      setThreads(prev => prev.map(t =>
        t.id === thread!.id
          ? { ...t, title: query.slice(0, 60) + (query.length > 60 ? '…' : '') }
          : t,
      ));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setMessages(prev => [...prev, {
        id: `e${Date.now()}`,
        role: 'assistant',
        content: `**Connection error:** ${msg}\n\nMake sure the pmGPT backend is running at \`http://localhost:8000\`.`,
        ts: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  }

  const agentPlaceholder = `Ask ${agent.name} anything…`;

  return (
    <div className="flex h-full overflow-hidden bg-brand-canvas">
      {/* Thread sidebar */}
      {sidebarOpen && (
        <ThreadSidebar
          threads={threads}
          activeId={activeThread?.id ?? null}
          onSelect={selectThread}
          onCreate={newConversation}
          onDelete={deleteThread}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-brand-surface border-b border-brand-line flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className={cn(
              'p-1.5 rounded-md transition-colors flex-shrink-0',
              sidebarOpen ? 'bg-brand-accent-bg text-brand-accent' : 'text-brand-ink-3 hover:bg-brand-elevated hover:text-brand-ink',
            )}
            title="Toggle threads"
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          <AgentDropdown
            agentId={agentId}
            onSelect={id => { setAgentId(id); if (activeThread) newConversation(); }}
          />

          {activeThread && (
            <div className="flex items-center gap-1.5 text-[12px] text-brand-ink-3 truncate max-w-xs">
              <span className="text-brand-line">·</span>
              <span className="truncate">{activeThread.title}</span>
            </div>
          )}

          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={newConversation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-line text-[12px] font-medium text-brand-ink-2 hover:bg-brand-elevated hover:text-brand-ink transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> New chat
            </button>
            <button className="p-1.5 rounded-md text-brand-ink-3 hover:bg-brand-elevated hover:text-brand-ink transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <WelcomeScreen agent={agent} onSelect={p => handleSend(p, agentId)} />
          ) : (
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
              {messages.map(msg => (
                <MessageRow
                  key={msg.id}
                  msg={msg}
                  agentId={msg.agent ?? agentId}
                  onPermissionApprove={handlePermissionApprove}
                  onPermissionReject={handlePermissionReject}
                  onFollowUp={p => handleSend(p, agentId)}
                />
              ))}
              {loading && <ThinkingIndicator agentId={agentId} />}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={() => handleSend()}
          loading={loading}
          placeholder={agentPlaceholder}
        />
      </div>
    </div>
  );
}

// ── Follow-up generator ───────────────────────────────────────────────────────

function generateFollowUps(query: string, agentId: string): string[] {
  const q = query.toLowerCase();
  if (agentId === 'docs' || q.includes('prd') || q.includes('spec'))
    return ['Add user stories', 'Generate Jira tickets', 'Push to Notion'];
  if (agentId === 'analytics' || q.includes('metric') || q.includes('drop'))
    return ['Drill into cohorts', 'Compare to last sprint', 'Create alert for this'];
  if (agentId === 'ops' || q.includes('sprint') || q.includes('standup'))
    return ['Post to Slack', 'Update Jira board', 'Schedule next standup'];
  if (agentId === 'strategy' || q.includes('okr') || q.includes('roadmap'))
    return ['Export to Notion', 'Share with stakeholders', 'Run prioritization'];
  if (agentId === 'competitive' || q.includes('competitor') || q.includes('battlecard'))
    return ['Update battlecard', 'Compare features', 'Schedule weekly sweep'];
  return ['Go deeper', 'Save to artifacts', 'Share with team'];
}

// ── Export with Suspense (useSearchParams needs it) ───────────────────────────

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-brand-accent" />
      </div>
    }>
      <ChatPageInner />
    </Suspense>
  );
}
