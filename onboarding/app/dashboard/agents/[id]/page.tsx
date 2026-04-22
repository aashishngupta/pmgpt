'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AGENTS } from '@/lib/platform-data';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Target, FileText, BarChart2, Search, Layers,
  GitPullRequest, Terminal, Trophy, TrendingUp, GraduationCap,
  ArrowLeft, Save, CheckCircle2, AlertTriangle, RotateCcw,
  MessageSquare, Send, Bot, User, Loader2, Copy, Check,
  Thermometer, Hash, Database, Shield, Brain, Zap,
  ToggleLeft, ToggleRight, ChevronDown, Info, Play,
  SlidersHorizontal, FileCode, UserCheck, FlaskConical,
} from 'lucide-react';

// ── Icon map ──────────────────────────────────────────────────────────────────

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

// ── Static agent enrichment ───────────────────────────────────────────────────

const AGENT_GOALS: Record<string, string[]> = {
  strategy:    ['Clarify product vision and north star', 'Prioritise roadmap items using evidence-based frameworks', 'Align cross-functional stakeholders on direction', 'Identify strategic risks before they materialise'],
  docs:        ['Reduce time to first draft by 80%', 'Enforce consistent document structure across the team', 'Generate Jira-ready stories from high-level briefs', 'Maintain a living spec that evolves with the product'],
  analytics:   ['Surface anomalies before they become incidents', 'Turn raw metrics into actionable decisions', 'Interpret A/B results with statistical rigour', 'Build shared understanding of product health'],
  research:    ['Synthesise qualitative signal at scale', 'Identify top customer pain points from unstructured feedback', 'Design surveys that yield high-quality data', 'Track evolving user needs across cohorts'],
  ops:         ['Keep sprint ceremonies efficient and documented', 'Produce standup updates that save time', 'Surface blockers before they stall delivery', 'Close the loop on every sprint with a structured retro'],
  review:      ['Ensure high-quality delivery documentation', 'Generate release notes from commit history and tickets', 'Maintain a changelog that serves both internal and external audiences'],
  engineering: ['Translate product requirements into engineering-ready briefs', 'Reduce back-and-forth between PM and engineering', 'Generate technical scoping estimates', 'Document incidents with clear root-cause structure'],
  competitive: ['Maintain up-to-date competitive intelligence', 'Equip sales with accurate and current battlecards', 'Identify whitespace opportunities vs competitors', 'Track competitive moves and respond proactively'],
  sales:       ['Enable sales team to articulate product value clearly', 'Generate personalised collateral for enterprise prospects', 'Translate PRDs into buyer-facing language', 'Produce ROI narratives grounded in real metrics'],
  coach:       ['Accelerate PM professional development', 'Create structured growth plans with measurable milestones', 'Deliver calibration-grade performance feedback', 'Help PMs prepare for promotion conversations'],
};

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'instructions' | 'personality' | 'access' | 'sandbox';

interface SandboxMessage {
  id: string; role: 'user' | 'assistant'; content: string; ts: Date;
}

interface PersonalityConfig {
  tonality: number;
  style: 'direct' | 'analytical' | 'narrative' | 'concise';
  length: 'brief' | 'balanced' | 'thorough';
  format: 'structured' | 'hybrid' | 'prose';
  includes: Record<string, boolean>;
  excludes: Record<string, boolean>;
}

interface InstructionConfig {
  systemPrompt: string;
  behaviors: Record<string, boolean>;
}

const LLM_OPTIONS = [
  { value: 'claude-opus-4-6',   label: 'Claude Opus 4.6',   provider: 'Anthropic', tier: '$$$$' },
  { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', provider: 'Anthropic', tier: '$$'   },
  { value: 'gpt-4o',            label: 'GPT-4o',            provider: 'OpenAI',    tier: '$$$'  },
  { value: 'gemini-1.5-pro',    label: 'Gemini 1.5 Pro',    provider: 'Google',    tier: '$$'   },
  { value: 'mistral-local',     label: 'Mistral (Local)',   provider: 'Ollama',    tier: 'Free' },
];

const ROLE_OPTIONS = [
  { value: 'viewer',  label: 'Viewer'  },
  { value: 'pm',      label: 'PM'      },
  { value: 'pm_lead', label: 'PM Lead' },
  { value: 'admin',   label: 'Admin'   },
];

const ALL_CONNECTORS = ['notion', 'gdrive', 'jira', 'confluence', 'slack', 'github', 'linear', 'figma', 'amplitude'];

// ── Small primitives ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold text-brand-ink-3 uppercase tracking-widest mb-3">{children}</div>
  );
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <label className="block mb-1.5">
      <span className="text-[12px] font-medium text-brand-ink">{children}</span>
      {hint && <span className="text-[11px] text-brand-ink-3 ml-2">{hint}</span>}
    </label>
  );
}

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <div className="flex items-center gap-2 cursor-pointer" onClick={() => onChange(!on)}>
      <button className={cn(
        'relative inline-flex h-4 w-7 items-center rounded-full transition-colors',
        on ? 'bg-brand-accent' : 'bg-brand-line',
      )}>
        <span className={cn('inline-block h-3 w-3 rounded-full bg-white shadow transition-transform', on ? 'translate-x-3.5' : 'translate-x-0.5')} />
      </button>
      {label && <span className="text-[12px] text-brand-ink">{label}</span>}
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview',     label: 'Overview',     icon: Info              },
  { id: 'instructions', label: 'Instructions', icon: FileCode          },
  { id: 'personality',  label: 'Personality',  icon: SlidersHorizontal },
  { id: 'access',       label: 'Access',       icon: UserCheck         },
  { id: 'sandbox',      label: 'Sandbox',      icon: FlaskConical      },
];

// ── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({ agent }: { agent: typeof AGENTS[number] }) {
  const Icon = AGENT_ICONS[agent.id] ?? Zap;
  const goals = AGENT_GOALS[agent.id] ?? [];

  return (
    <div className="grid grid-cols-3 gap-5">
      {/* Left: identity + goals */}
      <div className="col-span-2 space-y-5">

        <div className="bg-brand-surface border border-brand-line rounded-lg p-5">
          <SectionLabel>Identity</SectionLabel>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-brand-accent-bg border border-brand-line flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-brand-accent" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-brand-ink">{agent.name}</h2>
              <p className="text-[13px] text-brand-ink-2 mt-1 leading-relaxed">{agent.description}</p>
            </div>
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-line rounded-lg p-5">
          <SectionLabel>Goals</SectionLabel>
          <ul className="space-y-2.5">
            {goals.map((g, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-green flex-shrink-0 mt-0.5" />
                <span className="text-[13px] text-brand-ink-2 leading-snug">{g}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-brand-surface border border-brand-line rounded-lg p-5">
          <SectionLabel>Capabilities</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {agent.capabilities.map((c: string) => (
              <span key={c} className="text-[12px] font-medium px-2.5 py-1 rounded-md bg-brand-elevated border border-brand-line text-brand-ink-2">
                {c}
              </span>
            ))}
          </div>
        </div>

        {agent.templates.length > 0 && (
          <div className="bg-brand-surface border border-brand-line rounded-lg p-5">
            <SectionLabel>Templates — {agent.templates.length} available</SectionLabel>
            <div className="space-y-2">
              {agent.templates.map((t: typeof AGENTS[number]['templates'][number]) => (
                <div key={t.id} className="flex items-start justify-between gap-3 p-3 rounded-md border border-brand-line hover:border-brand-ink-4 transition-colors">
                  <div>
                    <div className="text-[13px] font-semibold text-brand-ink">{t.name}</div>
                    <div className="text-[11px] text-brand-ink-3 mt-0.5">{t.description}</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {t.fields.map((f: typeof AGENTS[number]['templates'][number]['fields'][number]) => (
                        <span key={f.key} className={cn('text-[10px] px-1.5 py-[2px] rounded border',
                          f.required ? 'border-brand-accent text-brand-accent-text bg-brand-accent-bg' : 'border-brand-line text-brand-ink-3'
                        )}>
                          {f.label}{f.required ? ' *' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-brand-line text-[12px] text-brand-ink-2 hover:bg-brand-elevated transition-colors flex-shrink-0">
                    <Play className="w-3 h-3" /> Use
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: stats */}
      <div className="space-y-4">
        <div className="bg-brand-surface border border-brand-line rounded-lg p-5">
          <SectionLabel>Performance</SectionLabel>
          <div className="space-y-3">
            {[
              { label: 'Total queries',    val: agent.stats.queries.toLocaleString()              },
              { label: 'Avg latency',      val: `${(agent.stats.avgLatencyMs / 1000).toFixed(1)}s`},
              { label: 'Satisfaction',     val: `${agent.stats.satisfactionPct}%`                },
              { label: 'Tokens used',      val: `${(agent.stats.tokensUsed / 1000000).toFixed(1)}M` },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-2 border-b border-brand-line-2 last:border-0 last:pb-0">
                <span className="text-[12px] text-brand-ink-3">{s.label}</span>
                <span className="text-[12px] font-mono font-semibold text-brand-ink">{s.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-line rounded-lg p-5">
          <SectionLabel>Configuration</SectionLabel>
          <div className="space-y-2">
            {[
              { label: 'Model',       val: agent.llm         },
              { label: 'Temperature', val: String(agent.temperature) },
              { label: 'Max tokens',  val: agent.maxTokens.toLocaleString() },
              { label: 'Memory',      val: agent.memory ? 'Enabled' : 'Disabled' },
              { label: 'Min role',    val: agent.minRole     },
              { label: 'Status',      val: agent.status      },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-1.5 border-b border-brand-line-2 last:border-0">
                <span className="text-[12px] text-brand-ink-3">{s.label}</span>
                <span className="text-[11px] font-mono font-medium text-brand-ink bg-brand-elevated px-1.5 py-0.5 rounded">{s.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Instructions tab ──────────────────────────────────────────────────────────

function InstructionsTab({ config, onChange }: {
  config: InstructionConfig;
  onChange: (c: InstructionConfig) => void;
}) {
  const [rewriting, setRewriting] = useState(false);

  const behaviors = [
    { key: 'challenge_assumptions', label: 'Challenge assumptions before answering'    },
    { key: 'cite_sources',          label: 'Always cite sources and evidence'           },
    { key: 'mece_structure',        label: 'Use MECE framework for structured analysis' },
    { key: 'ask_clarification',     label: 'Ask clarifying questions when brief is vague'},
    { key: 'flag_risks',            label: 'Flag risks and caveats proactively'          },
    { key: 'action_items',          label: 'End every response with clear next actions'  },
  ];

  return (
    <div className="grid grid-cols-3 gap-5">
      <div className="col-span-2 space-y-5">

        <div className="bg-brand-surface border border-brand-line rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>System Prompt</SectionLabel>
            <button
              onClick={() => { setRewriting(true); setTimeout(() => setRewriting(false), 1800); }}
              disabled={rewriting}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-brand-line text-[11px] font-medium text-brand-ink-2 hover:bg-brand-elevated transition-colors disabled:opacity-50"
            >
              {rewriting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 text-brand-accent" />}
              {rewriting ? 'Rewriting…' : 'AI Rewrite'}
            </button>
          </div>
          <textarea
            value={config.systemPrompt}
            onChange={e => onChange({ ...config, systemPrompt: e.target.value })}
            rows={10}
            className="w-full text-[12px] font-mono border border-brand-line rounded-md px-3 py-2.5 focus:outline-none focus:border-brand-accent bg-brand-canvas text-brand-ink resize-none leading-relaxed"
          />
          <p className="text-[11px] text-brand-ink-3 mt-1.5">
            This is the core behavioural instruction injected at the start of every conversation with this agent.
          </p>
        </div>

      </div>

      <div className="space-y-4">
        <div className="bg-brand-surface border border-brand-line rounded-lg p-5">
          <SectionLabel>Behaviour Toggles</SectionLabel>
          <div className="space-y-3">
            {behaviors.map(b => (
              <div key={b.key} className="flex items-start justify-between gap-3">
                <span className="text-[12px] text-brand-ink-2 leading-snug">{b.label}</span>
                <Switch
                  on={config.behaviors[b.key] ?? false}
                  onChange={v => onChange({ ...config, behaviors: { ...config.behaviors, [b.key]: v } })}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-line rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-3.5 h-3.5 text-brand-accent" />
            <span className="text-[12px] font-medium text-brand-ink">Tip</span>
          </div>
          <p className="text-[12px] text-brand-ink-3 leading-relaxed">
            Behaviour toggles append structured instructions to the system prompt at runtime. They take precedence over the raw prompt above.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Personality tab ───────────────────────────────────────────────────────────

function PersonalityTab({ config, onChange }: {
  config: PersonalityConfig;
  onChange: (c: PersonalityConfig) => void;
}) {
  const tonalityLabels = ['Formal', 'Professional', 'Balanced', 'Conversational', 'Casual'];

  const includes = [
    { key: 'numbered_steps',  label: 'Numbered steps for processes' },
    { key: 'action_items',    label: 'Action items at end of response' },
    { key: 'citations',       label: 'Source citations and evidence' },
    { key: 'risk_caveats',    label: 'Risk caveats and edge cases' },
    { key: 'examples',        label: 'Concrete examples' },
    { key: 'tldr',            label: 'TL;DR summary at the top' },
  ];

  const excludes = [
    { key: 'filler_phrases',  label: 'Filler phrases ("Certainly!", "Great question!")' },
    { key: 'lengthy_intros',  label: 'Lengthy preamble before the answer' },
    { key: 'redundant_caveats', label: 'Repeated / redundant caveats' },
    { key: 'external_links',  label: 'External URLs and references' },
    { key: 'first_person',    label: 'First-person references ("I think…")' },
  ];

  return (
    <div className="grid grid-cols-2 gap-5">

      {/* Left */}
      <div className="space-y-5">
        <div className="bg-brand-surface border border-brand-line rounded-lg p-5">
          <SectionLabel>Tonality</SectionLabel>
          <div className="mb-2">
            <div className="flex justify-between text-[11px] text-brand-ink-3 mb-1">
              {tonalityLabels.map(l => <span key={l}>{l}</span>)}
            </div>
            <input
              type="range" min={0} max={4} step={1} value={config.tonality}
              onChange={e => onChange({ ...config, tonality: Number(e.target.value) })}
              className="w-full accent-brand-accent"
            />
            <div className="text-center text-[12px] font-medium text-brand-ink mt-2">
              {tonalityLabels[config.tonality]}
            </div>
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-line rounded-lg p-5">
          <SectionLabel>Communication Style</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            {([
              { val: 'direct',     label: 'Direct',     desc: 'Cut to the point'    },
              { val: 'analytical', label: 'Analytical', desc: 'Data and frameworks' },
              { val: 'narrative',  label: 'Narrative',  desc: 'Story-driven'        },
              { val: 'concise',    label: 'Concise',    desc: 'Minimal words'       },
            ] as const).map(s => (
              <button
                key={s.val}
                onClick={() => onChange({ ...config, style: s.val })}
                className={cn('p-3 rounded-md border text-left transition-all', config.style === s.val
                  ? 'border-brand-accent bg-brand-accent-bg'
                  : 'border-brand-line hover:border-brand-ink-4'
                )}
              >
                <div className={cn('text-[12px] font-semibold', config.style === s.val ? 'text-brand-accent-text' : 'text-brand-ink')}>{s.label}</div>
                <div className="text-[11px] text-brand-ink-3 mt-0.5">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-line rounded-lg p-5">
          <SectionLabel>Response Length</SectionLabel>
          <div className="space-y-1.5">
            {([
              { val: 'brief',    label: 'Brief',    desc: '1–3 sentences where possible' },
              { val: 'balanced', label: 'Balanced', desc: 'As long as needed, no longer'  },
              { val: 'thorough', label: 'Thorough', desc: 'Comprehensive with full context'},
            ] as const).map(l => (
              <label key={l.val} className="flex items-start gap-2.5 cursor-pointer p-2 rounded-md hover:bg-brand-elevated">
                <input
                  type="radio" name="length" value={l.val} checked={config.length === l.val}
                  onChange={() => onChange({ ...config, length: l.val })}
                  className="mt-0.5 accent-brand-accent"
                />
                <div>
                  <div className="text-[12px] font-medium text-brand-ink">{l.label}</div>
                  <div className="text-[11px] text-brand-ink-3">{l.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="space-y-5">
        <div className="bg-brand-surface border border-brand-line rounded-lg p-5">
          <SectionLabel>Always Include</SectionLabel>
          <div className="space-y-2.5">
            {includes.map(item => (
              <div key={item.key} className="flex items-center justify-between gap-3">
                <span className="text-[12px] text-brand-ink-2">{item.label}</span>
                <Switch
                  on={config.includes[item.key] ?? false}
                  onChange={v => onChange({ ...config, includes: { ...config.includes, [item.key]: v } })}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-line rounded-lg p-5">
          <SectionLabel>Never Include</SectionLabel>
          <div className="space-y-2.5">
            {excludes.map(item => (
              <div key={item.key} className="flex items-center justify-between gap-3">
                <span className="text-[12px] text-brand-ink-2">{item.label}</span>
                <Switch
                  on={config.excludes[item.key] ?? false}
                  onChange={v => onChange({ ...config, excludes: { ...config.excludes, [item.key]: v } })}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Access tab ────────────────────────────────────────────────────────────────

function AccessTab({ agent, llm, setLlm, temp, setTemp, maxTokens, setMaxTokens, minRole, setMinRole, memory, setMemory, connectors, setConnectors }: {
  agent: typeof AGENTS[0];
  llm: string; setLlm: (v: string) => void;
  temp: number; setTemp: (v: number) => void;
  maxTokens: number; setMaxTokens: (v: number) => void;
  minRole: string; setMinRole: (v: string) => void;
  memory: boolean; setMemory: (v: boolean) => void;
  connectors: string[]; setConnectors: (v: string[]) => void;
}) {
  const toggleConnector = (c: string) =>
    setConnectors(connectors.includes(c) ? connectors.filter(x => x !== c) : [...connectors, c]);

  return (
    <div className="grid grid-cols-2 gap-5">
      {/* Left */}
      <div className="space-y-5">
        <div className="bg-brand-surface border border-brand-line rounded-lg p-5">
          <SectionLabel>Model & Parameters</SectionLabel>
          <div className="space-y-4">
            <div>
              <FieldLabel>Language Model</FieldLabel>
              <select
                value={llm}
                onChange={e => setLlm(e.target.value)}
                className="w-full text-[13px] border border-brand-line rounded-md px-3 py-2 focus:outline-none focus:border-brand-accent bg-brand-surface text-brand-ink"
              >
                {LLM_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label} — {o.provider} ({o.tier})</option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel hint={String(temp)}>Temperature</FieldLabel>
              <input type="range" min={0} max={1} step={0.05} value={temp}
                onChange={e => setTemp(parseFloat(e.target.value))}
                className="w-full accent-brand-accent"
              />
              <div className="flex justify-between text-[10px] text-brand-ink-3 mt-0.5">
                <span>Deterministic</span><span>Creative</span>
              </div>
            </div>

            <div>
              <FieldLabel hint={maxTokens.toLocaleString()}>Max Output Tokens</FieldLabel>
              <input type="range" min={512} max={16384} step={512} value={maxTokens}
                onChange={e => setMaxTokens(parseInt(e.target.value))}
                className="w-full accent-brand-accent"
              />
              <div className="flex justify-between text-[10px] text-brand-ink-3 mt-0.5">
                <span>512</span><span>16,384</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-line rounded-lg p-5">
          <SectionLabel>Memory</SectionLabel>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[13px] font-medium text-brand-ink">Persistent memory</div>
              <p className="text-[12px] text-brand-ink-3 mt-0.5 leading-snug">
                Extract and retain key context across conversations. Pinned memories are injected into future queries.
              </p>
            </div>
            <Switch on={memory} onChange={setMemory} />
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="space-y-5">
        <div className="bg-brand-surface border border-brand-line rounded-lg p-5">
          <SectionLabel>Minimum Role Required</SectionLabel>
          <p className="text-[12px] text-brand-ink-3 mb-3 leading-snug">
            Users below this role cannot access or invoke this agent.
          </p>
          <div className="space-y-1.5">
            {ROLE_OPTIONS.map(r => (
              <label key={r.value} className="flex items-center gap-2.5 cursor-pointer p-2 rounded-md hover:bg-brand-elevated">
                <input type="radio" name="minRole" value={r.value} checked={minRole === r.value}
                  onChange={() => setMinRole(r.value)} className="accent-brand-accent" />
                <span className="text-[13px] text-brand-ink">{r.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-line rounded-lg p-5">
          <SectionLabel>Data Connectors</SectionLabel>
          <p className="text-[12px] text-brand-ink-3 mb-3 leading-snug">
            Sources this agent can retrieve context from via RAG.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {ALL_CONNECTORS.map(c => {
              const on = connectors.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleConnector(c)}
                  className={cn('px-2.5 py-1.5 rounded-md border text-[11px] font-medium capitalize transition-all',
                    on ? 'border-brand-accent bg-brand-accent-bg text-brand-accent-text'
                       : 'border-brand-line text-brand-ink-3 hover:border-brand-ink-4',
                  )}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sandbox tab ───────────────────────────────────────────────────────────────

function SandboxTab({ agentId, agentName }: { agentId: string; agentName: string }) {
  const [messages, setMessages] = useState<SandboxMessage[]>([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const send = useCallback(async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');

    const userMsg: SandboxMessage = { id: `u${Date.now()}`, role: 'user', content: q, ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const data = await api.chat({ query: q, agent: agentId === 'general' ? undefined : agentId });
      setMessages(prev => [...prev, { id: `a${Date.now()}`, role: 'assistant', content: data.response, ts: new Date() }]);
    } catch {
      setMessages(prev => [...prev, {
        id: `e${Date.now()}`, role: 'assistant',
        content: `Backend not reachable. Make sure the pmGPT server is running at \`http://localhost:8000\` and try again.`,
        ts: new Date(),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, agentId]);

  return (
    <div className="flex gap-5 h-[calc(100vh-220px)]">
      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-brand-surface border border-brand-line rounded-lg overflow-hidden">
        {/* Banner */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-brand-elevated border-b border-brand-line flex-shrink-0">
          <FlaskConical className="w-3.5 h-3.5 text-brand-accent" />
          <span className="text-[12px] font-medium text-brand-ink-2">
            Testing <span className="text-brand-ink font-semibold">{agentName}</span> — uses live configuration
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-brand-ink-3">
              <FlaskConical className="w-8 h-8 opacity-30" />
              <p className="text-[13px]">Send a message to test this agent with the current configuration.</p>
            </div>
          )}
          {messages.map(m => {
            const isUser = m.role === 'user';
            return (
              <div key={m.id} className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
                <div className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                  isUser ? 'bg-brand-accent' : 'bg-brand-sidebar')}>
                  {isUser ? <User className="w-3 h-3 text-white" /> : <Bot className="w-3 h-3 text-white" />}
                </div>
                <div className={cn('max-w-2xl rounded-lg px-3.5 py-2.5 text-[13px] leading-relaxed',
                  isUser ? 'bg-brand-accent text-white rounded-tr-none' : 'bg-brand-elevated text-brand-ink border border-brand-line rounded-tl-none'
                )}>
                  {m.content}
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-sidebar flex items-center justify-center flex-shrink-0">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <div className="bg-brand-elevated border border-brand-line rounded-lg rounded-tl-none px-3.5 py-2.5 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-brand-accent animate-spin" />
                <span className="text-[12px] text-brand-ink-3">{agentName} is thinking…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-brand-line flex-shrink-0">
          <div className="flex items-end gap-2 border border-brand-line rounded-lg px-3 py-2 focus-within:border-brand-accent transition-colors bg-brand-canvas">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={`Test ${agentName}…`}
              className="flex-1 text-[13px] text-brand-ink placeholder-brand-ink-4 resize-none outline-none bg-transparent leading-relaxed"
              style={{ fieldSizing: 'content', maxHeight: '120px' } as React.CSSProperties}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className={cn('w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-all',
                input.trim() && !loading ? 'bg-brand-accent hover:bg-brand-accent-dim text-white' : 'bg-brand-elevated text-brand-ink-4 cursor-not-allowed'
              )}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-brand-ink-3 mt-1.5">
            <kbd className="font-mono bg-brand-elevated border border-brand-line px-1 rounded text-[9px]">Enter</kbd> send ·{' '}
            <kbd className="font-mono bg-brand-elevated border border-brand-line px-1 rounded text-[9px]">Shift+Enter</kbd> new line
          </p>
        </div>
      </div>

      {/* Context panel */}
      <div className="w-64 flex-shrink-0 space-y-4">
        <div className="bg-brand-surface border border-brand-line rounded-lg p-4">
          <div className="text-[11px] font-semibold text-brand-ink-3 uppercase tracking-widest mb-3">Quick prompts</div>
          <div className="space-y-1.5">
            {[
              'Give me a 30-second summary of what you do',
              'What frameworks do you use?',
              'Show me an example output',
            ].map(p => (
              <button
                key={p}
                onClick={() => { setInput(p); inputRef.current?.focus(); }}
                className="w-full text-left text-[12px] text-brand-ink-2 px-2.5 py-2 rounded-md border border-brand-line hover:border-brand-accent hover:bg-brand-accent-bg hover:text-brand-accent-text transition-all leading-snug"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-line rounded-lg p-4">
          <div className="text-[11px] font-semibold text-brand-ink-3 uppercase tracking-widest mb-2">Session</div>
          <div className="text-[12px] text-brand-ink-3 space-y-1">
            <div className="flex justify-between">
              <span>Messages</span>
              <span className="font-mono text-brand-ink">{messages.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Model</span>
              <span className="font-mono text-brand-ink text-[10px]">live config</span>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="mt-3 w-full text-[11px] text-brand-red border border-brand-line rounded-md py-1 hover:bg-brand-red-bg transition-colors"
            >
              Clear session
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AgentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const agent  = AGENTS.find(a => a.id === params.id);

  const [tab,        setTab]       = useState<Tab>('overview');
  const [saved,      setSaved]     = useState(false);
  const [saving,     setSaving]    = useState(false);
  const [saveError,  setSaveError] = useState<string | null>(null);
  const [active,     setActive]    = useState(true);

  const [llm,        setLlm]       = useState<string>(agent?.llm ?? 'claude-sonnet-4-6');
  const [temp,       setTemp]      = useState(agent?.temperature ?? 0.7);
  const [maxTokens,  setMaxTokens] = useState(agent?.maxTokens ?? 4096);
  const [minRole,    setMinRole]   = useState<string>(agent?.minRole ?? 'pm');
  const [memory,     setMemory]    = useState(agent?.memory ?? false);
  const [connectors, setConnectors]= useState<string[]>(agent?.connectors ?? []);

  const [instructions, setInstructions] = useState<InstructionConfig>({
    systemPrompt: agent?.systemPrompt ?? '',
    behaviors: { challenge_assumptions: false, cite_sources: true, mece_structure: false, ask_clarification: false, flag_risks: true, action_items: true },
  });

  const [personality, setPersonality] = useState<PersonalityConfig>({
    tonality: 1,
    style: 'direct',
    length: 'balanced',
    format: 'structured',
    includes: { numbered_steps: false, action_items: true, citations: true, risk_caveats: true, examples: false, tldr: false },
    excludes: { filler_phrases: true, lengthy_intros: true, redundant_caveats: false, external_links: false, first_person: false },
  });

  // Load saved config from backend on mount
  useEffect(() => {
    if (!agent) return;
    api.agents.getConfig(agent.id)
      .then(cfg => {
        if (cfg.enabled !== undefined) setActive(cfg.enabled);
        if (cfg.llm)         setLlm(cfg.llm);
        if (cfg.temperature !== undefined) setTemp(cfg.temperature);
        if (cfg.max_tokens  !== undefined) setMaxTokens(cfg.max_tokens);
        if (cfg.min_role)    setMinRole(cfg.min_role);
        if (cfg.memory_enabled !== undefined) setMemory(cfg.memory_enabled);
        if (cfg.connectors) {
          try { setConnectors(JSON.parse(cfg.connectors)); } catch { /* not JSON */ }
        }
        if (cfg.system_prompt) {
          setInstructions(prev => ({ ...prev, systemPrompt: cfg.system_prompt! }));
        }
        if (cfg.behaviors) {
          try { setInstructions(prev => ({ ...prev, behaviors: JSON.parse(cfg.behaviors!) })); } catch { /* ignore */ }
        }
        if (cfg.personality) {
          try {
            const p = JSON.parse(cfg.personality!);
            setPersonality(prev => ({ ...prev, ...p }));
          } catch { /* ignore */ }
        }
      })
      .catch(() => { /* no saved config yet — defaults are fine */ });
  }, [agent?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-brand-ink-3">
        <AlertTriangle className="w-8 h-8 opacity-40" />
        <p className="text-[13px]">Agent not found.</p>
        <button onClick={() => router.push('/dashboard/agents')} className="text-[12px] text-brand-accent hover:underline">
          Back to agents
        </button>
      </div>
    );
  }

  const Icon = AGENT_ICONS[agent.id] ?? Zap;

  async function save() {
    setSaving(true);
    setSaveError(null);
    try {
      await api.agents.saveConfig(agent!.id, {
        enabled:        active,
        llm,
        temperature:    temp,
        max_tokens:     maxTokens,
        min_role:       minRole,
        memory_enabled: memory,
        connectors:     JSON.stringify(connectors),
        system_prompt:  instructions.systemPrompt,
        behaviors:      JSON.stringify(instructions.behaviors),
        personality:    JSON.stringify({ tonality: personality.tonality, style: personality.style, length: personality.length, format: personality.format, includes: personality.includes, excludes: personality.excludes }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center gap-4 px-6 py-3 bg-brand-surface border-b border-brand-line flex-shrink-0">
        <button
          onClick={() => router.push('/dashboard/agents')}
          className="flex items-center gap-1.5 text-[12px] text-brand-ink-3 hover:text-brand-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Agents
        </button>
        <span className="text-brand-line-2">/</span>

        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-brand-accent-bg border border-brand-line flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-brand-accent" />
          </div>
          <span className="text-[13px] font-semibold text-brand-ink">{agent.name}</span>
          <span className={cn('text-[10px] font-semibold px-1.5 py-[3px] rounded uppercase tracking-wide', {
            'bg-brand-green-bg text-brand-green':  active && agent.status === 'active',
            'bg-brand-amber-bg text-brand-amber':  active && agent.status === 'beta',
            'bg-brand-elevated text-brand-ink-3':  !active,
          })}>
            {active ? agent.status : 'inactive'}
          </span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[11px] text-brand-ink-3 mr-1">Agent active</span>
          <button
            onClick={() => setActive(v => !v)}
            className={cn('relative inline-flex h-4 w-7 items-center rounded-full transition-colors', active ? 'bg-brand-accent' : 'bg-brand-line')}
          >
            <span className={cn('inline-block h-3 w-3 rounded-full bg-white shadow transition-transform', active ? 'translate-x-3.5' : 'translate-x-0.5')} />
          </button>

          <div className="w-px h-4 bg-brand-line mx-1" />

          <button
            onClick={() => { setInstructions(prev => ({ ...prev, systemPrompt: agent.systemPrompt })); }}
            className="p-1.5 rounded-md border border-brand-line hover:bg-brand-elevated text-brand-ink-3 transition-colors"
            title="Reset to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          {saveError && (
            <span className="text-[11px] text-brand-red">{saveError}</span>
          )}
          <button
            onClick={save}
            disabled={saving}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors disabled:opacity-60',
              saved ? 'bg-brand-green-bg text-brand-green border border-brand-green'
                    : saveError ? 'bg-brand-red-bg text-brand-red border border-brand-red'
                    : 'bg-brand-accent hover:bg-brand-accent-dim text-white'
            )}
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-brand-line px-6 bg-brand-surface flex-shrink-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-all',
              tab === t.id
                ? 'border-brand-accent text-brand-ink'
                : 'border-transparent text-brand-ink-3 hover:text-brand-ink',
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {tab === 'overview'     && <OverviewTab agent={agent} />}
        {tab === 'instructions' && <InstructionsTab config={instructions} onChange={setInstructions} />}
        {tab === 'personality'  && <PersonalityTab  config={personality}  onChange={setPersonality}  />}
        {tab === 'access'       && (
          <AccessTab
            agent={agent}
            llm={llm} setLlm={setLlm}
            temp={temp} setTemp={setTemp}
            maxTokens={maxTokens} setMaxTokens={setMaxTokens}
            minRole={minRole} setMinRole={setMinRole}
            memory={memory} setMemory={setMemory}
            connectors={connectors} setConnectors={setConnectors}
          />
        )}
        {tab === 'sandbox'      && <SandboxTab agentId={agent.id} agentName={agent.name} />}
      </div>

    </div>
  );
}
