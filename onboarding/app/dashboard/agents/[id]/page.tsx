'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AGENTS, CONNECTORS, MCP_SERVERS, AgentTrigger } from '@/lib/platform-data';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Target, FileText, BarChart2, Search, Layers, GitPullRequest,
  Terminal, Trophy, TrendingUp, GraduationCap, Scale, Rocket, Globe,
  ArrowLeft, Save, CheckCircle2, AlertTriangle, RotateCcw, Send,
  Bot, User, Loader2, Shield, Zap, X, Plus, Trash2, Bell,
  SlidersHorizontal, Info, Play, FlaskConical, Wrench, Clock,
  Database, ChevronDown, ChevronRight, Sparkles, Settings2,
  ExternalLink, Plug, Cpu, Eye, Package, Star, Lock,
} from 'lucide-react';

// ── Icon map ──────────────────────────────────────────────────────────────────

const AGENT_ICONS: Record<string, React.ElementType> = {
  strategy: Target, docs: FileText, analytics: BarChart2, research: Search,
  ops: Layers, review: GitPullRequest, engineering: Terminal, competitive: Trophy,
  sales: TrendingUp, coach: GraduationCap, prioritization: Scale, release: Rocket, market: Globe,
};

// ── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'instructions' | 'connectors' | 'mcps' | 'access' | 'sandbox';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview',      label: 'Overview',     icon: Info       },
  { id: 'instructions',  label: 'Instructions', icon: FileText   },
  { id: 'connectors',    label: 'Connectors',   icon: Plug       },
  { id: 'mcps',          label: 'MCPs & Tools', icon: Cpu        },
  { id: 'access',        label: 'Access',       icon: Lock       },
  { id: 'sandbox',       label: 'Sandbox',      icon: FlaskConical},
];

// ── Constants ─────────────────────────────────────────────────────────────────

const LLM_OPTIONS = [
  { value: 'claude-opus-4-6',   label: 'Claude Opus 4.6',    provider: 'Anthropic', tier: '$$$$', note: 'Best reasoning & nuance'    },
  { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6',  provider: 'Anthropic', tier: '$$',   note: 'Balanced quality & speed'   },
  { value: 'gpt-4o',            label: 'GPT-4o',             provider: 'OpenAI',    tier: '$$$',  note: 'Strong writing & coding'    },
  { value: 'gemini-1.5-pro',    label: 'Gemini 1.5 Pro',     provider: 'Google',    tier: '$$',   note: 'Fast, large context window' },
  { value: 'mistral-local',     label: 'Mistral (Local)',    provider: 'Ollama',    tier: 'Free', note: 'Self-hosted, private'       },
];

const ROLE_OPTIONS = [
  { value: 'viewer',  label: 'Viewer',  desc: 'Read-only access'          },
  { value: 'pm',      label: 'PM',      desc: 'Standard product team'      },
  { value: 'pm_lead', label: 'PM Lead', desc: 'Senior / team leads'       },
  { value: 'admin',   label: 'Admin',   desc: 'Full workspace access'     },
];

const SCHEDULE_PRESETS = [
  { label: 'Daily (9am weekdays)', val: '0 9 * * 1-5'   },
  { label: 'Daily (8am)',          val: '0 8 * * *'      },
  { label: 'Weekly (Mon 9am)',     val: '0 9 * * 1'      },
  { label: 'Every 4 hours',        val: '0 */4 * * *'    },
  { label: 'Quarterly (1st)',       val: '0 9 1 */3 *'    },
];

const TRIGGER_EVENTS = [
  'jira_epic_created', 'jira_sprint_closed', 'artifact_published',
  'artifact_in_review', 'deployment_started', 'metric_threshold', 'jira_issue_created',
];

const OUTPUT_DESTS = [
  { value: 'home_screen', label: 'Home screen card' },
  { value: 'slack',       label: 'Slack channel'    },
  { value: 'notion',      label: 'Notion page'      },
  { value: 'confluence',  label: 'Confluence page'  },
  { value: 'email',       label: 'Email digest'     },
];

// connector setup fields
const CONNECTOR_FIELDS: Record<string, { key: string; label: string; placeholder: string; secret?: boolean }[]> = {
  jira:       [{ key: 'url', label: 'Jira URL', placeholder: 'https://yourorg.atlassian.net' }, { key: 'email', label: 'Email', placeholder: 'you@company.com' }, { key: 'token', label: 'API token', placeholder: 'ATATT…', secret: true }],
  notion:     [{ key: 'token', label: 'Integration token', placeholder: 'secret_…', secret: true }],
  confluence: [{ key: 'url', label: 'Confluence URL', placeholder: 'https://yourorg.atlassian.net/wiki' }, { key: 'token', label: 'API token', placeholder: 'ATATT…', secret: true }],
  slack:      [{ key: 'token', label: 'Bot token', placeholder: 'xoxb-…', secret: true }],
  gdrive:     [{ key: 'credentials', label: 'Service account JSON', placeholder: 'Paste service account key JSON', secret: true }],
  github:     [{ key: 'token', label: 'Personal access token', placeholder: 'ghp_…', secret: true }],
  linear:     [{ key: 'token', label: 'API key', placeholder: 'lin_api_…', secret: true }],
  amplitude:  [{ key: 'api_key', label: 'API key', placeholder: 'Your Amplitude API key', secret: true }, { key: 'secret_key', label: 'Secret key', placeholder: 'Your secret key', secret: true }],
  figma:      [{ key: 'token', label: 'Personal access token', placeholder: 'figd_…', secret: true }],
};

// ── Primitives ────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] font-semibold text-brand-ink-3 uppercase tracking-widest mb-3">{children}</div>;
}

function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)}
      className={cn('relative inline-flex h-4 w-7 items-center rounded-full transition-colors flex-shrink-0', on ? 'bg-brand-accent' : 'bg-brand-line')}>
      <span className={cn('inline-block h-3 w-3 rounded-full bg-white shadow transition-transform', on ? 'translate-x-3.5' : 'translate-x-0.5')} />
    </button>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('bg-brand-surface border border-brand-line rounded-xl', className)}>{children}</div>;
}

function StatusDot({ status }: { status: string }) {
  return (
    <span className={cn('inline-block w-1.5 h-1.5 rounded-full flex-shrink-0', {
      'bg-brand-green':  status === 'connected',
      'bg-brand-red':    status === 'error',
      'bg-brand-amber':  status === 'partial',
      'bg-brand-ink-4':  status === 'disconnected',
    })} />
  );
}

// ── Connector Library Modal ────────────────────────────────────────────────────

function ConnectorLibraryModal({
  agentConnectors, onAdd, onClose,
}: { agentConnectors: string[]; onAdd: (id: string) => void; onClose: () => void }) {
  const [search, setSearch]       = useState('');
  const [setup,  setSetup]        = useState<string | null>(null);
  const [fields, setFields]       = useState<Record<string, string>>({});
  const [saving, setSaving]       = useState(false);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  const filtered = CONNECTORS.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.category.includes(search.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, typeof CONNECTORS>>((acc, c) => {
    const cat = c.category.replace('_', ' ');
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(c);
    return acc;
  }, {});

  async function handleSetup(id: string) {
    setSaving(true);
    await new Promise(r => setTimeout(r, 900)); // simulate save
    setSaving(false);
    setSetup(null);
    setFields({});
    onAdd(id);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-brand-surface rounded-2xl border border-brand-line shadow-2xl w-[760px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-line flex-shrink-0">
          <div>
            <h2 className="text-[15px] font-bold text-brand-ink">Connector Library</h2>
            <p className="text-[12px] text-brand-ink-3 mt-0.5">Connect data sources this agent can search and act on</p>
          </div>
          <button onClick={onClose} className="text-brand-ink-4 hover:text-brand-ink transition-colors"><X className="w-4 h-4" /></button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-brand-line-2 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-ink-3" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search connectors…"
              className="w-full pl-8 pr-3 py-1.5 text-[13px] border border-brand-line rounded-lg bg-brand-canvas text-brand-ink placeholder-brand-ink-4 focus:outline-none focus:border-brand-accent" />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <div className="text-[10px] font-semibold text-brand-ink-3 uppercase tracking-widest mb-2.5 capitalize">{cat}</div>
              <div className="space-y-2">
                {items.map(c => {
                  const added     = agentConnectors.includes(c.id);
                  const connected = c.status === 'connected' || c.status === 'partial';
                  const isSetup   = setup === c.id;
                  const setupFields = CONNECTOR_FIELDS[c.id] ?? [];
                  return (
                    <div key={c.id}>
                      <div className={cn('flex items-center gap-3 p-3.5 rounded-xl border transition-all',
                        isSetup ? 'border-brand-accent bg-brand-accent-bg' : 'border-brand-line hover:border-brand-ink-4')}>
                        <div className="w-9 h-9 rounded-lg bg-brand-elevated border border-brand-line-2 flex items-center justify-center flex-shrink-0 text-[18px]">
                          {c.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-brand-ink">{c.name}</span>
                            <StatusDot status={c.status} />
                            <span className={cn('text-[10px] font-medium', {
                              'text-brand-green':  c.status === 'connected',
                              'text-brand-red':    c.status === 'error',
                              'text-brand-amber':  c.status === 'partial',
                              'text-brand-ink-3':  c.status === 'disconnected',
                            })}>{c.status}</span>
                          </div>
                          <p className="text-[12px] text-brand-ink-3 leading-snug">{c.description}</p>
                          {c.docsIndexed !== undefined && c.docsIndexed > 0 && (
                            <span className="text-[11px] text-brand-green">{c.docsIndexed} docs indexed</span>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {added ? (
                            <span className="flex items-center gap-1 text-[12px] text-brand-green font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Added
                            </span>
                          ) : connected ? (
                            <button onClick={() => onAdd(c.id)}
                              className="px-3 py-1.5 rounded-lg bg-brand-accent text-white text-[12px] font-medium hover:bg-brand-accent-dim transition-colors">
                              Add to agent
                            </button>
                          ) : (
                            <button onClick={() => { setSetup(isSetup ? null : c.id); setFields({}); }}
                              className={cn('px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-colors',
                                isSetup ? 'border-brand-accent text-brand-accent bg-brand-surface' : 'border-brand-line text-brand-ink-2 hover:bg-brand-elevated')}>
                              {isSetup ? 'Cancel' : 'Set up'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Inline setup form */}
                      {isSetup && setupFields.length > 0 && (
                        <div className="mt-2 mx-3.5 p-4 rounded-xl border border-brand-accent bg-brand-accent-bg space-y-3">
                          <div className="text-[12px] font-semibold text-brand-ink">Connect {c.name}</div>
                          <div className="space-y-2.5">
                            {setupFields.map(f => (
                              <div key={f.key}>
                                <label className="block text-[11px] font-medium text-brand-ink mb-1">{f.label}</label>
                                <div className="relative">
                                  <input
                                    type={f.secret && !showSecret[f.key] ? 'password' : 'text'}
                                    value={fields[f.key] ?? ''}
                                    onChange={e => setFields(p => ({ ...p, [f.key]: e.target.value }))}
                                    placeholder={f.placeholder}
                                    className="w-full text-[12px] border border-brand-line rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-brand-accent bg-brand-canvas text-brand-ink placeholder-brand-ink-4"
                                  />
                                  {f.secret && (
                                    <button onClick={() => setShowSecret(p => ({ ...p, [f.key]: !p[f.key] }))}
                                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-ink-4 hover:text-brand-ink transition-colors">
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          <button onClick={() => handleSetup(c.id)} disabled={saving}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-accent text-white text-[12px] font-medium hover:bg-brand-accent-dim disabled:opacity-60 transition-colors">
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                            {saving ? 'Connecting…' : 'Connect & add'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── MCP Library Modal ─────────────────────────────────────────────────────────

function McpLibraryModal({
  enabledMcps, enabledTools, onToggleMcp, onToggleTool, onClose,
}: {
  enabledMcps: string[]; enabledTools: Record<string, string[]>;
  onToggleMcp: (id: string) => void; onToggleTool: (mcpId: string, tool: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = MCP_SERVERS.filter(m =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-brand-surface rounded-2xl border border-brand-line shadow-2xl w-[720px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-line flex-shrink-0">
          <div>
            <h2 className="text-[15px] font-bold text-brand-ink">MCP Server Library</h2>
            <p className="text-[12px] text-brand-ink-3 mt-0.5">Enable MCP servers and choose which tools this agent can use</p>
          </div>
          <button onClick={onClose} className="text-brand-ink-4 hover:text-brand-ink transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-5 py-3 border-b border-brand-line-2 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-ink-3" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search MCP servers…"
              className="w-full pl-8 pr-3 py-1.5 text-[13px] border border-brand-line rounded-lg bg-brand-canvas text-brand-ink placeholder-brand-ink-4 focus:outline-none focus:border-brand-accent" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
          {filtered.map(mcp => {
            const isEnabled  = enabledMcps.includes(mcp.id);
            const isExpanded = expanded === mcp.id;
            const active     = enabledTools[mcp.id] ?? [];
            return (
              <div key={mcp.id} className={cn('rounded-xl border transition-all',
                isEnabled ? 'border-brand-accent' : 'border-brand-line')}>
                <div className="flex items-center gap-3 p-3.5">
                  <div className={cn('w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0',
                    isEnabled ? 'bg-brand-accent border-brand-accent' : 'bg-brand-elevated border-brand-line-2')}>
                    <Cpu className={cn('w-4 h-4', isEnabled ? 'text-white' : 'text-brand-ink-3')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-brand-ink">{mcp.name}</span>
                      {mcp.official && <span className="text-[9px] font-bold px-1.5 py-[2px] rounded bg-brand-accent-bg text-brand-accent border border-brand-accent uppercase tracking-wide">Official</span>}
                      {mcp.installed && <span className="text-[9px] font-medium px-1.5 py-[2px] rounded bg-brand-green-bg text-brand-green border border-brand-green uppercase tracking-wide">Installed</span>}
                      {mcp.stars && <span className="flex items-center gap-0.5 text-[10px] text-brand-ink-3"><Star className="w-2.5 h-2.5" />{mcp.stars.toLocaleString()}</span>}
                    </div>
                    <p className="text-[12px] text-brand-ink-3 leading-snug">{mcp.description}</p>
                    {isEnabled && active.length > 0 && (
                      <span className="text-[11px] text-brand-accent">{active.length} of {mcp.tools.length} tools enabled</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isEnabled && (
                      <button onClick={() => setExpanded(isExpanded ? null : mcp.id)}
                        className="flex items-center gap-1 text-[11px] text-brand-ink-2 hover:text-brand-ink transition-colors">
                        Tools {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </button>
                    )}
                    <Switch on={isEnabled} onChange={() => onToggleMcp(mcp.id)} />
                  </div>
                </div>

                {/* Tool toggles */}
                {isEnabled && isExpanded && (
                  <div className="px-3.5 pb-3.5 pt-0 space-y-1.5 border-t border-brand-line-2">
                    <div className="text-[10px] font-semibold text-brand-ink-3 uppercase tracking-widest pt-2.5 mb-2">Available tools</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {mcp.tools.map(tool => {
                        const toolOn = active.includes(tool);
                        const isWrite = tool.includes('write') || tool.includes('create') || tool.includes('update') || tool.includes('delete');
                        return (
                          <button key={tool} onClick={() => onToggleTool(mcp.id, tool)}
                            className={cn('flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-left transition-all',
                              toolOn ? 'border-brand-accent bg-brand-accent-bg' : 'border-brand-line hover:border-brand-ink-4')}>
                            <div>
                              <span className={cn('text-[11px] font-mono font-medium', toolOn ? 'text-brand-accent-text' : 'text-brand-ink')}>{tool}</span>
                              {isWrite && <span className="ml-1.5 text-[9px] text-brand-amber">write</span>}
                            </div>
                            {toolOn && <CheckCircle2 className="w-3 h-3 text-brand-accent flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────────────────────

interface OverviewState {
  name: string;
  description: string;
  llm: string;
  temperature: number;
  maxTokens: number;
  tonality: number;
  style: 'direct' | 'analytical' | 'narrative' | 'concise';
  responseLength: 'brief' | 'balanced' | 'thorough';
  includes: Record<string, boolean>;
  excludes: Record<string, boolean>;
}

function OverviewTab({ state, onChange }: { state: OverviewState; onChange: (s: OverviewState) => void }) {
  const tonalityLabels = ['Formal', 'Professional', 'Balanced', 'Conversational', 'Casual'];

  const INCLUDE_OPTIONS = [
    { key: 'numbered_steps', label: 'Numbered steps for processes'    },
    { key: 'action_items',   label: 'Action items at end of response' },
    { key: 'citations',      label: 'Source citations & evidence'     },
    { key: 'risk_caveats',   label: 'Risk caveats & edge cases'       },
    { key: 'tldr',           label: 'TL;DR summary at the top'        },
  ];
  const EXCLUDE_OPTIONS = [
    { key: 'filler_phrases',    label: 'Filler phrases ("Certainly!", etc.)' },
    { key: 'lengthy_intros',    label: 'Lengthy preamble before the answer'  },
    { key: 'redundant_caveats', label: 'Repeated caveats'                    },
    { key: 'first_person',      label: 'First-person ("I think…")'           },
  ];

  return (
    <div className="grid grid-cols-3 gap-5">
      {/* Left: identity + personality */}
      <div className="col-span-2 space-y-5">

        {/* Identity */}
        <Card className="p-5">
          <SectionLabel>Identity</SectionLabel>
          <div className="space-y-3">
            <div>
              <label className="block text-[12px] font-medium text-brand-ink mb-1.5">Agent Name</label>
              <input value={state.name} onChange={e => onChange({ ...state, name: e.target.value })}
                className="w-full text-[14px] font-semibold border border-brand-line rounded-lg px-3 py-2 focus:outline-none focus:border-brand-accent bg-brand-canvas text-brand-ink" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-brand-ink mb-1.5">Description</label>
              <textarea value={state.description} onChange={e => onChange({ ...state, description: e.target.value })}
                rows={3}
                className="w-full text-[13px] border border-brand-line rounded-lg px-3 py-2 focus:outline-none focus:border-brand-accent bg-brand-canvas text-brand-ink resize-none leading-relaxed" />
            </div>
          </div>
        </Card>

        {/* LLM */}
        <Card className="p-5">
          <SectionLabel>Language Model</SectionLabel>
          <div className="space-y-2">
            {LLM_OPTIONS.map(o => (
              <label key={o.value} className={cn('flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                state.llm === o.value ? 'border-brand-accent bg-brand-accent-bg' : 'border-brand-line hover:border-brand-ink-4')}>
                <input type="radio" name="llm" value={o.value} checked={state.llm === o.value}
                  onChange={() => onChange({ ...state, llm: o.value })} className="accent-brand-accent" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[13px] font-semibold', state.llm === o.value ? 'text-brand-accent-text' : 'text-brand-ink')}>{o.label}</span>
                    <span className="text-[10px] font-mono text-brand-ink-3 bg-brand-elevated px-1.5 py-[1px] rounded">{o.tier}</span>
                    <span className="text-[11px] text-brand-ink-3">{o.provider}</span>
                  </div>
                  <span className="text-[11px] text-brand-ink-3">{o.note}</span>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-4 space-y-4 pt-4 border-t border-brand-line-2">
            <div>
              <div className="flex justify-between text-[12px] text-brand-ink mb-1.5">
                <span>Temperature</span>
                <span className="font-mono font-semibold">{state.temperature.toFixed(2)}</span>
              </div>
              <input type="range" min={0} max={1} step={0.05} value={state.temperature}
                onChange={e => onChange({ ...state, temperature: +e.target.value })}
                className="w-full accent-brand-accent" />
              <div className="flex justify-between text-[10px] text-brand-ink-3 mt-0.5">
                <span>Deterministic</span><span>Creative</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[12px] text-brand-ink mb-1.5">
                <span>Max output tokens</span>
                <span className="font-mono font-semibold">{state.maxTokens.toLocaleString()}</span>
              </div>
              <input type="range" min={512} max={16384} step={512} value={state.maxTokens}
                onChange={e => onChange({ ...state, maxTokens: +e.target.value })}
                className="w-full accent-brand-accent" />
              <div className="flex justify-between text-[10px] text-brand-ink-3 mt-0.5">
                <span>512</span><span>16,384</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Personality */}
        <Card className="p-5">
          <SectionLabel>Personality & Tone</SectionLabel>
          <div className="space-y-5">
            {/* Tonality slider */}
            <div>
              <div className="flex justify-between text-[11px] text-brand-ink-3 mb-1.5">
                {tonalityLabels.map(l => <span key={l}>{l}</span>)}
              </div>
              <input type="range" min={0} max={4} step={1} value={state.tonality}
                onChange={e => onChange({ ...state, tonality: +e.target.value })}
                className="w-full accent-brand-accent" />
              <div className="text-center text-[12px] font-medium text-brand-ink mt-1.5">{tonalityLabels[state.tonality]}</div>
            </div>

            {/* Style cards */}
            <div>
              <div className="text-[12px] font-medium text-brand-ink mb-2">Communication style</div>
              <div className="grid grid-cols-4 gap-2">
                {(['direct', 'analytical', 'narrative', 'concise'] as const).map(s => (
                  <button key={s} onClick={() => onChange({ ...state, style: s })}
                    className={cn('p-2.5 rounded-lg border text-left transition-all capitalize text-[12px] font-medium',
                      state.style === s ? 'border-brand-accent bg-brand-accent-bg text-brand-accent-text' : 'border-brand-line text-brand-ink hover:border-brand-ink-4')}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Response length */}
            <div>
              <div className="text-[12px] font-medium text-brand-ink mb-2">Response length</div>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { val: 'brief' as const, desc: '1–3 sentences' },
                  { val: 'balanced' as const, desc: 'As needed' },
                  { val: 'thorough' as const, desc: 'Comprehensive' },
                ]).map(l => (
                  <label key={l.val} className={cn('flex flex-col gap-0.5 p-2.5 rounded-lg border cursor-pointer transition-all',
                    state.responseLength === l.val ? 'border-brand-accent bg-brand-accent-bg' : 'border-brand-line hover:border-brand-ink-4')}>
                    <div className="flex items-center gap-2">
                      <input type="radio" name="length" value={l.val} checked={state.responseLength === l.val}
                        onChange={() => onChange({ ...state, responseLength: l.val })} className="accent-brand-accent" />
                      <span className={cn('text-[12px] font-semibold capitalize', state.responseLength === l.val ? 'text-brand-accent-text' : 'text-brand-ink')}>{l.val}</span>
                    </div>
                    <span className="text-[11px] text-brand-ink-3 pl-5">{l.desc}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Right: includes / excludes */}
      <div className="space-y-4">
        <Card className="p-5">
          <SectionLabel>Always include</SectionLabel>
          <div className="space-y-2.5">
            {INCLUDE_OPTIONS.map(o => (
              <div key={o.key} className="flex items-center justify-between gap-3">
                <span className="text-[12px] text-brand-ink-2 leading-snug">{o.label}</span>
                <Switch on={state.includes[o.key] ?? false}
                  onChange={v => onChange({ ...state, includes: { ...state.includes, [o.key]: v } })} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <SectionLabel>Never include</SectionLabel>
          <div className="space-y-2.5">
            {EXCLUDE_OPTIONS.map(o => (
              <div key={o.key} className="flex items-center justify-between gap-3">
                <span className="text-[12px] text-brand-ink-2 leading-snug">{o.label}</span>
                <Switch on={state.excludes[o.key] ?? false}
                  onChange={v => onChange({ ...state, excludes: { ...state.excludes, [o.key]: v } })} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-3.5 h-3.5 text-brand-accent" />
            <span className="text-[12px] font-medium text-brand-ink">How it works</span>
          </div>
          <p className="text-[12px] text-brand-ink-3 leading-relaxed">
            Personality settings inject structured instructions after the system prompt. They affect all responses from this agent.
          </p>
        </Card>
      </div>
    </div>
  );
}

// ── Instructions tab ──────────────────────────────────────────────────────────

interface InstructionsState {
  systemPrompt: string;
  outputFormat: string;
  goals: string[];
  guardrails: string[];
  behaviors: Record<string, boolean>;
  triggers: AgentTrigger[];
}

const BEHAVIORS = [
  { key: 'challenge_assumptions', label: 'Challenge assumptions before answering'      },
  { key: 'cite_sources',          label: 'Always cite sources and evidence'             },
  { key: 'mece_structure',        label: 'Use MECE framework for structured analysis'  },
  { key: 'ask_clarification',     label: 'Ask clarifying questions when brief is vague' },
  { key: 'flag_risks',            label: 'Flag risks and caveats proactively'            },
  { key: 'action_items',          label: 'End every response with clear next actions'   },
  { key: 'show_work',             label: 'Show reasoning — don\'t just conclude'        },
  { key: 'no_preamble',           label: 'Skip preamble — lead with the answer'         },
];

function InstructionsTab({ state, onChange }: { state: InstructionsState; onChange: (s: InstructionsState) => void }) {
  const [rewriting, setRewriting] = useState(false);
  const [newGoal, setNewGoal]     = useState('');
  const [newGuard, setNewGuard]   = useState('');
  const [showAddTrigger, setShowAddTrigger] = useState<'schedule' | 'event' | null>(null);
  const [newTrigger, setNewTrigger] = useState<Partial<AgentTrigger>>({ type: 'schedule', outputDest: 'home_screen' });

  const addGoal = () => { if (!newGoal.trim()) return; onChange({ ...state, goals: [...state.goals, newGoal.trim()] }); setNewGoal(''); };
  const addGuard = () => { if (!newGuard.trim()) return; onChange({ ...state, guardrails: [...state.guardrails, newGuard.trim()] }); setNewGuard(''); };
  const removeGoal  = (i: number) => onChange({ ...state, goals:      state.goals.filter((_, idx) => idx !== i) });
  const removeGuard = (i: number) => onChange({ ...state, guardrails: state.guardrails.filter((_, idx) => idx !== i) });

  const addTrigger = () => {
    if (!newTrigger.label?.trim()) return;
    onChange({ ...state, triggers: [...state.triggers, {
      id: `trig_${Date.now()}`, type: newTrigger.type ?? 'schedule', label: newTrigger.label,
      description: newTrigger.description ?? '', schedule: newTrigger.schedule, event: newTrigger.event,
      outputDest: newTrigger.outputDest ?? 'home_screen', enabled: true,
    }]});
    setShowAddTrigger(null);
    setNewTrigger({ type: 'schedule', outputDest: 'home_screen' });
  };

  const updateTrigger = (id: string, patch: Partial<AgentTrigger>) =>
    onChange({ ...state, triggers: state.triggers.map(t => t.id === id ? { ...t, ...patch } : t) });
  const deleteTrigger = (id: string) =>
    onChange({ ...state, triggers: state.triggers.filter(t => t.id !== id) });

  return (
    <div className="grid grid-cols-3 gap-5">
      <div className="col-span-2 space-y-5">

        {/* Goals */}
        <Card className="p-5">
          <SectionLabel>Goals</SectionLabel>
          <p className="text-[12px] text-brand-ink-3 mb-3">What this agent is designed to achieve. Shown to users and used to guide response quality.</p>
          <div className="space-y-2 mb-3">
            {state.goals.map((g, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-brand-elevated border border-brand-line-2 group">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-green flex-shrink-0 mt-0.5" />
                <input value={g} onChange={e => onChange({ ...state, goals: state.goals.map((gg, idx) => idx === i ? e.target.value : gg) })}
                  className="flex-1 text-[12px] text-brand-ink bg-transparent outline-none" />
                <button onClick={() => removeGoal(i)} className="opacity-0 group-hover:opacity-100 text-brand-ink-4 hover:text-brand-red transition-all flex-shrink-0">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newGoal} onChange={e => setNewGoal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addGoal(); }}
              placeholder="Add a goal…"
              className="flex-1 text-[12px] border border-brand-line rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-accent bg-brand-canvas text-brand-ink placeholder-brand-ink-4" />
            <button onClick={addGoal} className="px-2.5 py-1.5 rounded-lg bg-brand-elevated border border-brand-line hover:border-brand-accent text-brand-ink-2 transition-colors">
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </Card>

        {/* System Prompt */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>System Prompt</SectionLabel>
            <button onClick={() => { setRewriting(true); setTimeout(() => setRewriting(false), 1800); }} disabled={rewriting}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-brand-line text-[11px] font-medium text-brand-ink-2 hover:bg-brand-elevated transition-colors disabled:opacity-50">
              {rewriting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-brand-accent" />}
              {rewriting ? 'Rewriting…' : 'AI Rewrite'}
            </button>
          </div>
          <textarea value={state.systemPrompt} onChange={e => onChange({ ...state, systemPrompt: e.target.value })}
            rows={10}
            className="w-full text-[12px] font-mono border border-brand-line rounded-lg px-3 py-2.5 focus:outline-none focus:border-brand-accent bg-brand-canvas text-brand-ink resize-none leading-relaxed" />
          <p className="text-[11px] text-brand-ink-3 mt-1.5">Core behavioural instruction injected at the start of every conversation.</p>
        </Card>

        {/* Output format */}
        <Card className="p-5">
          <SectionLabel>Output Format Template</SectionLabel>
          <p className="text-[12px] text-brand-ink-3 mb-3">Define the expected structure. Appended after the system prompt.</p>
          <textarea value={state.outputFormat} onChange={e => onChange({ ...state, outputFormat: e.target.value })}
            rows={4} placeholder={`e.g.\nStructure every response as:\n1. Summary (1-2 sentences)\n2. Key findings (bullets)\n3. Recommended actions (numbered)`}
            className="w-full text-[12px] font-mono border border-brand-line rounded-lg px-3 py-2.5 focus:outline-none focus:border-brand-accent bg-brand-canvas text-brand-ink resize-none leading-relaxed placeholder-brand-ink-4" />
        </Card>

        {/* Triggers */}
        <Card className="p-5">
          <SectionLabel>Triggers</SectionLabel>
          <p className="text-[12px] text-brand-ink-3 mb-4">When this agent should run automatically and where to send the output.</p>

          {state.triggers.length > 0 && (
            <div className="space-y-2.5 mb-4">
              {state.triggers.map(t => (
                <div key={t.id} className={cn('flex items-start gap-3 p-3.5 rounded-xl border transition-all', t.enabled ? 'border-brand-line' : 'border-brand-line-2 opacity-60')}>
                  {t.type === 'schedule' ? <Clock className="w-4 h-4 text-brand-accent mt-0.5 flex-shrink-0" /> : <Bell className="w-4 h-4 text-brand-amber mt-0.5 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-brand-ink">{t.label}</div>
                    <div className="text-[12px] text-brand-ink-3 mt-0.5">{t.description}</div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[11px] font-mono text-brand-ink-2 px-2 py-0.5 rounded bg-brand-elevated border border-brand-line">
                        {t.type === 'schedule' ? t.schedule : t.event}
                      </span>
                      <span className="text-[11px] text-brand-ink-3">→ {OUTPUT_DESTS.find(d => d.value === t.outputDest)?.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch on={t.enabled} onChange={v => updateTrigger(t.id, { enabled: v })} />
                    <button onClick={() => deleteTrigger(t.id)} className="text-brand-ink-4 hover:text-brand-red transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => setShowAddTrigger(showAddTrigger === 'schedule' ? null : 'schedule')}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-colors',
                showAddTrigger === 'schedule' ? 'border-brand-accent bg-brand-accent-bg text-brand-accent-text' : 'border-brand-line text-brand-ink-2 hover:bg-brand-elevated')}>
              <Clock className="w-3 h-3" /> Schedule
            </button>
            <button onClick={() => setShowAddTrigger(showAddTrigger === 'event' ? null : 'event')}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-colors',
                showAddTrigger === 'event' ? 'border-brand-amber bg-brand-amber-bg text-brand-amber' : 'border-brand-line text-brand-ink-2 hover:bg-brand-elevated')}>
              <Bell className="w-3 h-3" /> Event
            </button>
          </div>

          {showAddTrigger && (
            <div className={cn('mt-3 p-4 rounded-xl border space-y-3', showAddTrigger === 'schedule' ? 'border-brand-accent bg-brand-accent-bg' : 'border-brand-amber bg-brand-amber-bg')}>
              <input value={newTrigger.label ?? ''} onChange={e => setNewTrigger(p => ({ ...p, label: e.target.value }))}
                placeholder="Trigger name"
                className="w-full text-[12px] border border-brand-line rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-accent bg-brand-canvas text-brand-ink" />
              <input value={newTrigger.description ?? ''} onChange={e => setNewTrigger(p => ({ ...p, description: e.target.value }))}
                placeholder="What should the agent do?"
                className="w-full text-[12px] border border-brand-line rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-accent bg-brand-canvas text-brand-ink" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  {showAddTrigger === 'schedule' ? (
                    <select value={newTrigger.schedule ?? ''} onChange={e => setNewTrigger(p => ({ ...p, schedule: e.target.value }))}
                      className="w-full text-[12px] border border-brand-line rounded-lg px-2.5 py-1.5 focus:outline-none bg-brand-canvas text-brand-ink">
                      <option value="">Select schedule…</option>
                      {SCHEDULE_PRESETS.map(p => <option key={p.val} value={p.val}>{p.label}</option>)}
                    </select>
                  ) : (
                    <select value={newTrigger.event ?? ''} onChange={e => setNewTrigger(p => ({ ...p, event: e.target.value }))}
                      className="w-full text-[12px] border border-brand-line rounded-lg px-2.5 py-1.5 focus:outline-none bg-brand-canvas text-brand-ink">
                      <option value="">Select event…</option>
                      {TRIGGER_EVENTS.map(ev => <option key={ev} value={ev}>{ev.replace(/_/g, ' ')}</option>)}
                    </select>
                  )}
                </div>
                <select value={newTrigger.outputDest ?? 'home_screen'} onChange={e => setNewTrigger(p => ({ ...p, outputDest: e.target.value as AgentTrigger['outputDest'] }))}
                  className="w-full text-[12px] border border-brand-line rounded-lg px-2.5 py-1.5 focus:outline-none bg-brand-canvas text-brand-ink">
                  {OUTPUT_DESTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowAddTrigger(null)} className="px-3 py-1.5 text-[12px] border border-brand-line rounded-lg hover:bg-brand-elevated text-brand-ink-2">Cancel</button>
                <button onClick={addTrigger} className="px-3 py-1.5 text-[12px] font-medium bg-brand-accent text-white rounded-lg hover:bg-brand-accent-dim">Add</button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Right: behaviors + guardrails */}
      <div className="space-y-4">
        <Card className="p-5">
          <SectionLabel>Behaviour Toggles</SectionLabel>
          <div className="space-y-3">
            {BEHAVIORS.map(b => (
              <div key={b.key} className="flex items-start justify-between gap-3">
                <span className="text-[12px] text-brand-ink-2 leading-snug">{b.label}</span>
                <Switch on={state.behaviors[b.key] ?? false}
                  onChange={v => onChange({ ...state, behaviors: { ...state.behaviors, [b.key]: v } })} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <SectionLabel>Guardrails</SectionLabel>
          <p className="text-[11px] text-brand-ink-3 mb-3 leading-snug">Hard rules the agent must never violate.</p>
          <div className="space-y-2 mb-3">
            {state.guardrails.map((g, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-brand-elevated border border-brand-line-2 group">
                <Shield className="w-3 h-3 text-brand-amber flex-shrink-0 mt-0.5" />
                <input value={g} onChange={e => onChange({ ...state, guardrails: state.guardrails.map((gg, idx) => idx === i ? e.target.value : gg) })}
                  className="flex-1 text-[11px] text-brand-ink-2 bg-transparent outline-none leading-snug" />
                <button onClick={() => removeGuard(i)} className="opacity-0 group-hover:opacity-100 text-brand-ink-4 hover:text-brand-red transition-all flex-shrink-0">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newGuard} onChange={e => setNewGuard(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addGuard(); }}
              placeholder="Add a guardrail…"
              className="flex-1 text-[11px] border border-brand-line rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-accent bg-brand-canvas text-brand-ink placeholder-brand-ink-4" />
            <button onClick={addGuard} className="px-2.5 py-1.5 rounded-lg bg-brand-elevated border border-brand-line hover:border-brand-accent text-brand-ink-2 transition-colors">
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Connectors tab ────────────────────────────────────────────────────────────

function ConnectorsTab({ agentId, connectors, setConnectors, recommended }: {
  agentId: string; connectors: string[]; setConnectors: (v: string[]) => void; recommended: string[];
}) {
  const [showLibrary, setShowLibrary] = useState(false);

  const toggle = (id: string) =>
    setConnectors(connectors.includes(id) ? connectors.filter(c => c !== id) : [...connectors, id]);

  const recommendedConnectors = CONNECTORS.filter(c => recommended.length === 0
    ? ['notion', 'gdrive', 'jira', 'confluence'].includes(c.id)
    : recommended.includes(c.id)
  );
  const activeConnectors = CONNECTORS.filter(c => connectors.includes(c.id) && !recommendedConnectors.find(r => r.id === c.id));

  return (
    <div className="grid grid-cols-3 gap-5">
      <div className="col-span-2 space-y-5">

        {/* Recommended */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-1">
            <SectionLabel>Recommended for {AGENTS.find(a => a.id === agentId)?.name ?? 'this agent'}</SectionLabel>
          </div>
          <p className="text-[12px] text-brand-ink-3 mb-4">These connectors are most relevant based on what this agent does.</p>
          <div className="space-y-2.5">
            {recommendedConnectors.map(c => {
              const on        = connectors.includes(c.id);
              const connected = c.status === 'connected' || c.status === 'partial';
              return (
                <div key={c.id} className={cn('flex items-center gap-3 p-3.5 rounded-xl border transition-all',
                  on ? 'border-brand-accent bg-brand-accent-bg' : 'border-brand-line hover:border-brand-ink-4')}>
                  <div className="text-[22px] flex-shrink-0">{c.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-brand-ink">{c.name}</span>
                      <StatusDot status={c.status} />
                      <span className={cn('text-[10px] font-medium', {
                        'text-brand-green': c.status === 'connected',
                        'text-brand-amber': c.status === 'partial',
                        'text-brand-red':   c.status === 'error',
                        'text-brand-ink-3': c.status === 'disconnected',
                      })}>{c.status}</span>
                    </div>
                    <p className="text-[12px] text-brand-ink-3 leading-snug">{c.description}</p>
                    {c.docsIndexed != null && c.docsIndexed > 0 && (
                      <span className="text-[11px] text-brand-green">{c.docsIndexed} docs indexed · {c.lastSync}</span>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {!connected ? (
                      <button onClick={() => setShowLibrary(true)}
                        className="px-3 py-1.5 rounded-lg border border-brand-line text-[12px] font-medium text-brand-ink-2 hover:bg-brand-elevated transition-colors">
                        Set up
                      </button>
                    ) : (
                      <Switch on={on} onChange={() => toggle(c.id)} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Added from library */}
        {activeConnectors.length > 0 && (
          <Card className="p-5">
            <SectionLabel>Other sources added</SectionLabel>
            <div className="space-y-2">
              {activeConnectors.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-brand-line">
                  <div className="text-[18px]">{c.icon}</div>
                  <span className="text-[13px] font-medium text-brand-ink flex-1">{c.name}</span>
                  <Switch on={true} onChange={() => toggle(c.id)} />
                </div>
              ))}
            </div>
          </Card>
        )}

        <button onClick={() => setShowLibrary(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-brand-line hover:border-brand-accent hover:bg-brand-accent-bg text-brand-ink-3 hover:text-brand-accent text-[13px] font-medium transition-all">
          <ExternalLink className="w-4 h-4" /> Explore all connectors
        </button>
      </div>

      <div className="space-y-4">
        <Card className="p-5">
          <SectionLabel>Active sources ({connectors.length})</SectionLabel>
          {connectors.length === 0 ? (
            <p className="text-[12px] text-brand-ink-3">No connectors — agent uses general knowledge only.</p>
          ) : (
            <div className="space-y-2">
              {connectors.map(id => {
                const c = CONNECTORS.find(cc => cc.id === id);
                if (!c) return null;
                return (
                  <div key={id} className="flex items-center gap-2 py-1.5 border-b border-brand-line-2 last:border-0">
                    <StatusDot status={c.status} />
                    <span className="text-[12px] text-brand-ink flex-1">{c.name}</span>
                    {c.docsIndexed != null && <span className="text-[11px] font-mono text-brand-ink-3">{c.docsIndexed} docs</span>}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-3.5 h-3.5 text-brand-accent" />
            <span className="text-[12px] font-medium text-brand-ink">How RAG works</span>
          </div>
          <p className="text-[12px] text-brand-ink-3 leading-relaxed">
            Enabled connectors are searched via vector similarity before each response. The most relevant documents are injected as context.
          </p>
        </Card>
      </div>

      {showLibrary && (
        <ConnectorLibraryModal
          agentConnectors={connectors}
          onAdd={id => setConnectors([...connectors.filter(c => c !== id), id])}
          onClose={() => setShowLibrary(false)}
        />
      )}
    </div>
  );
}

// ── MCPs tab ──────────────────────────────────────────────────────────────────

function McpsTab({ agentId, recommendedMcpIds }: { agentId: string; recommendedMcpIds: string[] }) {
  const [enabledMcps,  setEnabledMcps]  = useState<string[]>([]);
  const [enabledTools, setEnabledTools] = useState<Record<string, string[]>>({});
  const [showLibrary, setShowLibrary]   = useState(false);
  const [expanded, setExpanded]         = useState<string | null>(null);

  const toggleMcp = (id: string) => {
    setEnabledMcps(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    if (!enabledMcps.includes(id)) {
      const mcp = MCP_SERVERS.find(m => m.id === id);
      if (mcp) setEnabledTools(prev => ({ ...prev, [id]: mcp.tools })); // enable all by default
    }
  };
  const toggleTool = (mcpId: string, tool: string) => {
    setEnabledTools(prev => {
      const cur = prev[mcpId] ?? [];
      return { ...prev, [mcpId]: cur.includes(tool) ? cur.filter(t => t !== tool) : [...cur, tool] };
    });
  };

  const recommended = MCP_SERVERS.filter(m => recommendedMcpIds.includes(m.id));
  const others      = MCP_SERVERS.filter(m => !recommendedMcpIds.includes(m.id) && enabledMcps.includes(m.id));

  return (
    <div className="grid grid-cols-3 gap-5">
      <div className="col-span-2 space-y-5">

        {/* Recommended MCPs */}
        <Card className="p-5">
          <SectionLabel>Recommended MCPs</SectionLabel>
          <p className="text-[12px] text-brand-ink-3 mb-4">MCP servers that extend what this agent can do. Enable to unlock the tools inside.</p>
          <div className="space-y-3">
            {recommended.map(mcp => {
              const isOn      = enabledMcps.includes(mcp.id);
              const isExpanded = expanded === mcp.id;
              const active    = enabledTools[mcp.id] ?? [];
              return (
                <div key={mcp.id} className={cn('rounded-xl border transition-all', isOn ? 'border-brand-accent' : 'border-brand-line')}>
                  <div className="flex items-center gap-3 p-3.5">
                    <div className={cn('w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0',
                      isOn ? 'bg-brand-accent border-brand-accent' : 'bg-brand-elevated border-brand-line-2')}>
                      <Cpu className={cn('w-4 h-4', isOn ? 'text-white' : 'text-brand-ink-3')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold text-brand-ink">{mcp.name}</span>
                        {mcp.official && <span className="text-[9px] font-bold px-1.5 py-[2px] rounded bg-brand-accent-bg text-brand-accent border border-brand-accent uppercase tracking-wide">Official</span>}
                        {mcp.installed && <span className="text-[9px] font-medium px-1.5 py-[2px] rounded bg-brand-green-bg text-brand-green border border-brand-green uppercase">Installed</span>}
                      </div>
                      <p className="text-[12px] text-brand-ink-3 leading-snug">{mcp.description}</p>
                      {isOn && <span className="text-[11px] text-brand-accent">{active.length}/{mcp.tools.length} tools enabled</span>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isOn && (
                        <button onClick={() => setExpanded(isExpanded ? null : mcp.id)}
                          className="text-[11px] text-brand-ink-2 hover:text-brand-ink flex items-center gap-0.5 transition-colors">
                          Tools {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </button>
                      )}
                      <Switch on={isOn} onChange={() => toggleMcp(mcp.id)} />
                    </div>
                  </div>

                  {/* Tool list */}
                  {isOn && isExpanded && (
                    <div className="px-3.5 pb-3.5 border-t border-brand-line-2">
                      <div className="text-[10px] font-semibold text-brand-ink-3 uppercase tracking-widest pt-3 mb-2.5">Tools in this MCP</div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {mcp.tools.map(tool => {
                          const toolOn = active.includes(tool);
                          const isWrite = /write|create|update|delete|post|send/.test(tool);
                          return (
                            <button key={tool} onClick={() => toggleTool(mcp.id, tool)}
                              className={cn('flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-left transition-all',
                                toolOn ? 'border-brand-accent bg-brand-accent-bg' : 'border-brand-line hover:border-brand-ink-4')}>
                              <div className="min-w-0">
                                <span className={cn('text-[11px] font-mono font-medium truncate block', toolOn ? 'text-brand-accent-text' : 'text-brand-ink')}>{tool}</span>
                                {isWrite && <span className="text-[9px] text-brand-amber font-medium">write</span>}
                              </div>
                              {toolOn && <CheckCircle2 className="w-3 h-3 text-brand-accent flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {others.length > 0 && (
          <Card className="p-5">
            <SectionLabel>Other enabled MCPs</SectionLabel>
            <div className="space-y-2">
              {others.map(mcp => (
                <div key={mcp.id} className="flex items-center gap-3 p-3 rounded-xl border border-brand-accent">
                  <Cpu className="w-4 h-4 text-brand-accent flex-shrink-0" />
                  <span className="text-[13px] font-medium text-brand-ink flex-1">{mcp.name}</span>
                  <span className="text-[11px] text-brand-accent">{(enabledTools[mcp.id] ?? []).length} tools</span>
                  <Switch on={true} onChange={() => toggleMcp(mcp.id)} />
                </div>
              ))}
            </div>
          </Card>
        )}

        <button onClick={() => setShowLibrary(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-brand-line hover:border-brand-accent hover:bg-brand-accent-bg text-brand-ink-3 hover:text-brand-accent text-[13px] font-medium transition-all">
          <Package className="w-4 h-4" /> Explore MCP library
        </button>
      </div>

      <div className="space-y-4">
        <Card className="p-5">
          <SectionLabel>Active MCPs ({enabledMcps.length})</SectionLabel>
          {enabledMcps.length === 0 ? (
            <p className="text-[12px] text-brand-ink-3">No MCPs enabled — agent uses connector RAG only.</p>
          ) : (
            <div className="space-y-2">
              {enabledMcps.map(id => {
                const m = MCP_SERVERS.find(x => x.id === id);
                if (!m) return null;
                return (
                  <div key={id} className="flex items-center gap-2 py-1.5 border-b border-brand-line-2 last:border-0">
                    <Cpu className="w-3 h-3 text-brand-accent flex-shrink-0" />
                    <span className="text-[12px] text-brand-ink flex-1">{m.name}</span>
                    <span className="text-[11px] font-mono text-brand-ink-3">{(enabledTools[id] ?? []).length} tools</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-3.5 h-3.5 text-brand-accent" />
            <span className="text-[12px] font-medium text-brand-ink">What are MCPs?</span>
          </div>
          <p className="text-[12px] text-brand-ink-3 leading-relaxed">
            Model Context Protocol servers give agents real-time capabilities — web browsing, code execution, database queries, and more. Each MCP exposes a set of tools the agent can call mid-conversation.
          </p>
        </Card>
      </div>

      {showLibrary && (
        <McpLibraryModal
          enabledMcps={enabledMcps}
          enabledTools={enabledTools}
          onToggleMcp={toggleMcp}
          onToggleTool={toggleTool}
          onClose={() => setShowLibrary(false)}
        />
      )}
    </div>
  );
}

// ── Access tab ────────────────────────────────────────────────────────────────

function AccessTab({ minRole, setMinRole, active, setActive }: {
  minRole: string; setMinRole: (v: string) => void;
  active: boolean; setActive: (v: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-5 max-w-2xl">
      <div className="space-y-5">
        <Card className="p-5">
          <SectionLabel>Agent Status</SectionLabel>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[13px] font-medium text-brand-ink">Active</div>
              <p className="text-[12px] text-brand-ink-3 mt-0.5">When off, no user can invoke this agent.</p>
            </div>
            <Switch on={active} onChange={setActive} />
          </div>
        </Card>

        <Card className="p-5">
          <SectionLabel>Minimum Role Required</SectionLabel>
          <p className="text-[12px] text-brand-ink-3 mb-3">Users below this role cannot access or invoke this agent.</p>
          <div className="space-y-2">
            {ROLE_OPTIONS.map(r => (
              <label key={r.value} className={cn('flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                minRole === r.value ? 'border-brand-accent bg-brand-accent-bg' : 'border-brand-line hover:border-brand-ink-4')}>
                <input type="radio" name="minRole" value={r.value} checked={minRole === r.value}
                  onChange={() => setMinRole(r.value)} className="mt-0.5 accent-brand-accent" />
                <div>
                  <div className={cn('text-[13px] font-semibold', minRole === r.value ? 'text-brand-accent-text' : 'text-brand-ink')}>{r.label}</div>
                  <div className="text-[11px] text-brand-ink-3">{r.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </Card>
      </div>

      <div className="space-y-5">
        <Card className="p-5">
          <SectionLabel>Availability</SectionLabel>
          <div className="space-y-3">
            {[
              { label: 'Chat UI',         desc: 'Available in the main chat interface', on: true  },
              { label: 'Workflows',       desc: 'Can be used as a step in workflows',    on: true  },
              { label: 'API access',      desc: 'Callable via the /chat API endpoint',  on: true  },
              { label: 'Scheduled runs',  desc: 'Can be triggered on a schedule',       on: false },
            ].map(item => (
              <div key={item.label} className="flex items-start justify-between gap-3 py-2 border-b border-brand-line-2 last:border-0">
                <div>
                  <div className="text-[12px] font-medium text-brand-ink">{item.label}</div>
                  <div className="text-[11px] text-brand-ink-3">{item.desc}</div>
                </div>
                <Switch on={item.on} onChange={() => {}} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-3.5 h-3.5 text-brand-amber" />
            <span className="text-[12px] font-medium text-brand-ink">Write action governance</span>
          </div>
          <p className="text-[12px] text-brand-ink-3 leading-relaxed">
            Write actions (Jira, Notion, Slack) always require human approval before executing, regardless of role settings.
          </p>
        </Card>
      </div>
    </div>
  );
}

// ── Sandbox tab ───────────────────────────────────────────────────────────────

interface SandboxMsg { id: string; role: 'user' | 'assistant'; content: string }

function SandboxTab({ agentId, agentName }: { agentId: string; agentName: string }) {
  const [msgs, setMsgs]   = useState<SandboxMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef         = useRef<HTMLDivElement>(null);
  const inputRef          = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, loading]);

  const send = useCallback(async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    setMsgs(prev => [...prev, { id: `u${Date.now()}`, role: 'user', content: q }]);
    setLoading(true);
    try {
      const data = await api.chat({ query: q, agent: agentId });
      setMsgs(prev => [...prev, { id: `a${Date.now()}`, role: 'assistant', content: data.response }]);
    } catch {
      setMsgs(prev => [...prev, { id: `e${Date.now()}`, role: 'assistant', content: 'Backend not reachable. Start the pmGPT server at `http://localhost:8000`.' }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, agentId]);

  const QUICK = [
    'Give me a 30-second summary of what you do',
    'What frameworks do you use?',
    'Show me an example output',
    'What data do you need from me to get started?',
  ];

  return (
    <div className="flex gap-5 h-[calc(100vh-240px)]">
      <div className="flex-1 flex flex-col bg-brand-surface border border-brand-line rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-brand-elevated border-b border-brand-line flex-shrink-0">
          <FlaskConical className="w-3.5 h-3.5 text-brand-accent" />
          <span className="text-[12px] font-medium text-brand-ink-2">
            Testing <span className="text-brand-ink font-semibold">{agentName}</span> with live configuration
          </span>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {msgs.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-brand-ink-3">
              <FlaskConical className="w-8 h-8 opacity-30" />
              <p className="text-[13px]">Send a message to test this agent.</p>
            </div>
          )}
          {msgs.map(m => (
            <div key={m.id} className={cn('flex gap-3', m.role === 'user' && 'flex-row-reverse')}>
              <div className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5', m.role === 'user' ? 'bg-brand-accent' : 'bg-brand-sidebar')}>
                {m.role === 'user' ? <User className="w-3 h-3 text-white" /> : <Bot className="w-3 h-3 text-white" />}
              </div>
              <div className={cn('max-w-2xl rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap',
                m.role === 'user' ? 'bg-brand-accent text-white rounded-tr-none' : 'bg-brand-elevated text-brand-ink border border-brand-line rounded-tl-none')}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-sidebar flex items-center justify-center flex-shrink-0"><Bot className="w-3 h-3 text-white" /></div>
              <div className="bg-brand-elevated border border-brand-line rounded-xl rounded-tl-none px-3.5 py-2.5 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-brand-accent animate-spin" />
                <span className="text-[12px] text-brand-ink-3">{agentName} is thinking…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="px-4 py-3 border-t border-brand-line flex-shrink-0">
          <div className="flex items-end gap-2 border border-brand-line rounded-xl px-3 py-2 focus-within:border-brand-accent bg-brand-canvas transition-colors">
            <textarea ref={inputRef} rows={1} value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={`Test ${agentName}…`}
              className="flex-1 text-[13px] text-brand-ink placeholder-brand-ink-4 resize-none outline-none bg-transparent leading-relaxed"
              style={{ fieldSizing: 'content', maxHeight: '120px' } as React.CSSProperties} />
            <button onClick={send} disabled={!input.trim() || loading}
              className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
                input.trim() && !loading ? 'bg-brand-accent hover:bg-brand-accent-dim text-white' : 'bg-brand-elevated text-brand-ink-4 cursor-not-allowed')}>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
      <div className="w-56 flex-shrink-0 space-y-4">
        <Card className="p-4">
          <div className="text-[11px] font-semibold text-brand-ink-3 uppercase tracking-widest mb-3">Quick prompts</div>
          <div className="space-y-1.5">
            {QUICK.map(p => (
              <button key={p} onClick={() => { setInput(p); inputRef.current?.focus(); }}
                className="w-full text-left text-[12px] text-brand-ink-2 px-2.5 py-2 rounded-lg border border-brand-line hover:border-brand-accent hover:bg-brand-accent-bg hover:text-brand-accent-text transition-all leading-snug">
                {p}
              </button>
            ))}
          </div>
        </Card>
        {msgs.length > 0 && (
          <Card className="p-4">
            <div className="text-[11px] font-semibold text-brand-ink-3 uppercase tracking-widest mb-2">Session</div>
            <div className="flex justify-between text-[12px] text-brand-ink-3 mb-3">
              <span>Messages</span><span className="font-mono text-brand-ink">{msgs.length}</span>
            </div>
            <button onClick={() => setMsgs([])}
              className="w-full text-[11px] text-brand-red border border-brand-line rounded-lg py-1 hover:bg-brand-elevated transition-colors">
              Clear session
            </button>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Config Copilot ────────────────────────────────────────────────────────────

interface CopilotMsg { id: string; role: 'user' | 'assistant'; content: string }

function ConfigCopilot({ agent, llm, temp, minRole, connectors, systemPrompt, open, onClose }: {
  agent: typeof AGENTS[number]; llm: string; temp: number; minRole: string;
  connectors: string[]; systemPrompt: string; open: boolean; onClose: () => void;
}) {
  const [msgs, setMsgs]   = useState<CopilotMsg[]>([{
    id: 'init', role: 'assistant',
    content: `I'm your Config Assistant for **${agent.name}**. Ask me anything — model choice, system prompt, guardrails, connectors, or triggers. I'll give specific, actionable advice.`,
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef         = useRef<HTMLDivElement>(null);
  const inputRef          = useRef<HTMLInputElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, loading]);

  const send = useCallback(async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    setMsgs(prev => [...prev, { id: `u${Date.now()}`, role: 'user', content: q }]);
    setLoading(true);
    try {
      const ctx = `Config assistant for "${agent.name}" agent. Current: LLM=${llm}, temp=${temp}, minRole=${minRole}, connectors=[${connectors.join(', ')}]. System prompt: "${systemPrompt.substring(0, 200)}". Answer in 2-4 sentences, be specific.`;
      const data = await api.chat({ query: `${ctx}\n\nUser: ${q}`, agent: 'general' });
      setMsgs(prev => [...prev, { id: `a${Date.now()}`, role: 'assistant', content: data.response }]);
    } catch {
      setMsgs(prev => [...prev, { id: `e${Date.now()}`, role: 'assistant', content: 'Backend not reachable — start the pmGPT server to use the copilot.' }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, agent, llm, temp, minRole, connectors, systemPrompt]);

  if (!open) return null;

  return (
    <div className="w-72 flex-shrink-0 flex flex-col bg-brand-surface border-l border-brand-line h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-brand-line bg-brand-elevated flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-brand-accent flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span className="text-[13px] font-semibold text-brand-ink">Config Assistant</span>
        </div>
        <button onClick={onClose} className="text-brand-ink-4 hover:text-brand-ink transition-colors"><X className="w-3.5 h-3.5" /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {msgs.map(m => (
          <div key={m.id} className={cn('flex gap-2', m.role === 'user' && 'flex-row-reverse')}>
            <div className={cn('w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
              m.role === 'user' ? 'bg-brand-accent' : 'bg-brand-sidebar')}>
              {m.role === 'user' ? <User className="w-2.5 h-2.5 text-white" /> : <Sparkles className="w-2.5 h-2.5 text-white" />}
            </div>
            <div className={cn('rounded-xl px-3 py-2 text-[12px] leading-relaxed max-w-[200px]',
              m.role === 'user' ? 'bg-brand-accent text-white rounded-tr-none' : 'bg-brand-elevated text-brand-ink border border-brand-line-2 rounded-tl-none')}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-5 h-5 rounded-full bg-brand-sidebar flex items-center justify-center"><Sparkles className="w-2.5 h-2.5 text-white" /></div>
            <div className="bg-brand-elevated border border-brand-line-2 rounded-xl rounded-tl-none px-3 py-2 flex items-center gap-2">
              <Loader2 className="w-3 h-3 text-brand-accent animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {msgs.length <= 1 && (
        <div className="px-4 pb-3 space-y-1.5 flex-shrink-0">
          <div className="text-[10px] font-semibold text-brand-ink-3 uppercase tracking-widest mb-2">Try asking</div>
          {['What model should I use?', 'How to make responses more concise?', 'What guardrails should I add?', 'Which connectors matter most?'].map(q => (
            <button key={q} onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 0); }}
              className="w-full text-left text-[11px] text-brand-ink-2 px-2.5 py-2 rounded-lg border border-brand-line hover:border-brand-accent hover:bg-brand-accent-bg hover:text-brand-accent-text transition-all leading-snug">
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="px-4 py-3 border-t border-brand-line flex-shrink-0">
        <div className="flex items-center gap-2 border border-brand-line rounded-xl px-3 py-2 focus-within:border-brand-accent bg-brand-canvas transition-colors">
          <input ref={inputRef} type="text" value={input}
            onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(); }}
            placeholder="Ask about config…"
            className="flex-1 text-[12px] text-brand-ink placeholder-brand-ink-4 outline-none bg-transparent" />
          <button onClick={send} disabled={!input.trim() || loading}
            className={cn('w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
              input.trim() && !loading ? 'bg-brand-accent text-white' : 'text-brand-ink-4 cursor-not-allowed')}>
            <Send className="w-3 h-3" />
          </button>
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

  const [tab,          setTab]         = useState<Tab>('overview');
  const [saved,        setSaved]       = useState(false);
  const [saving,       setSaving]      = useState(false);
  const [saveError,    setSaveError]   = useState<string | null>(null);
  const [copilotOpen,  setCopilotOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Overview state
  const [overview, setOverview] = useState<OverviewState>({
    name:           agent?.name ?? '',
    description:    agent?.description ?? '',
    llm:            agent?.llm ?? 'claude-sonnet-4-6',
    temperature:    agent?.temperature ?? 0.7,
    maxTokens:      agent?.maxTokens ?? 4096,
    tonality:       1,
    style:          'direct',
    responseLength: 'balanced',
    includes:       { numbered_steps: false, action_items: true, citations: true, risk_caveats: true, tldr: false },
    excludes:       { filler_phrases: true, lengthy_intros: true, redundant_caveats: false, first_person: false },
  });

  // Instructions state
  const [instructions, setInstructions] = useState<InstructionsState>({
    systemPrompt: agent?.systemPrompt ?? '',
    outputFormat: '',
    goals:        agent?.goals ?? [],
    guardrails:   agent?.guardrails ?? [],
    behaviors:    { challenge_assumptions: false, cite_sources: true, mece_structure: false, ask_clarification: false, flag_risks: true, action_items: true, show_work: false, no_preamble: true },
    triggers:     agent?.triggers ?? [],
  });

  // Access state
  const [minRole,    setMinRole]    = useState<string>(agent?.minRole ?? 'pm');
  const [active,     setActive]     = useState(true);
  const [connectors, setConnectors] = useState<string[]>(agent?.connectors ?? []);

  // Load from backend
  useEffect(() => {
    if (!agent) return;
    api.agents.getConfig(agent.id).then(cfg => {
      if (cfg.enabled !== undefined) setActive(cfg.enabled);
      if (cfg.llm)            setOverview(p => ({ ...p, llm: cfg.llm! }));
      if (cfg.temperature !== undefined) setOverview(p => ({ ...p, temperature: cfg.temperature! }));
      if (cfg.max_tokens  !== undefined) setOverview(p => ({ ...p, maxTokens: cfg.max_tokens! }));
      if (cfg.min_role)       setMinRole(cfg.min_role);
      if (cfg.connectors)     { try { setConnectors(JSON.parse(cfg.connectors)); } catch { /* ok */ } }
      if (cfg.system_prompt)  setInstructions(p => ({ ...p, systemPrompt: cfg.system_prompt! }));
      if (cfg.behaviors)      { try { setInstructions(p => ({ ...p, behaviors: JSON.parse(cfg.behaviors!) })); } catch { /* ok */ } }
      if (cfg.personality)    { try { const pp = JSON.parse(cfg.personality!); setOverview(p => ({ ...p, ...pp })); } catch { /* ok */ } }
    }).catch(() => {});
  }, [agent?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-brand-ink-3">
        <AlertTriangle className="w-8 h-8 opacity-40" />
        <p className="text-[13px]">Agent not found.</p>
        <button onClick={() => router.push('/dashboard/agents')} className="text-[12px] text-brand-accent hover:underline">Back to agents</button>
      </div>
    );
  }

  const Icon = AGENT_ICONS[agent.id] ?? Zap;

  async function save() {
    setSaving(true); setSaveError(null);
    try {
      await api.agents.saveConfig(agent!.id, {
        enabled: active, llm: overview.llm, temperature: overview.temperature,
        max_tokens: overview.maxTokens, min_role: minRole,
        connectors: JSON.stringify(connectors),
        system_prompt: instructions.systemPrompt,
        behaviors: JSON.stringify(instructions.behaviors),
        personality: JSON.stringify({ tonality: overview.tonality, style: overview.style, length: overview.responseLength, includes: overview.includes, excludes: overview.excludes }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const activeTriggers = instructions.triggers.filter(t => t.enabled).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center gap-4 px-6 py-3 bg-brand-surface border-b border-brand-line flex-shrink-0">
        <button onClick={() => router.push('/dashboard/agents')}
          className="flex items-center gap-1.5 text-[12px] text-brand-ink-3 hover:text-brand-ink transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Agents
        </button>
        <span className="text-brand-line-2">/</span>

        {/* Agent switcher dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(v => !v)}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-brand-elevated border border-transparent hover:border-brand-line transition-all group"
          >
            <div className={cn('w-7 h-7 rounded-lg border border-brand-line flex items-center justify-center flex-shrink-0', agent.bg)}>
              <Icon className={cn('w-3.5 h-3.5', agent.color)} />
            </div>
            <span className="text-[14px] font-semibold text-brand-ink">{overview.name || agent.name}</span>
            <ChevronDown className={cn('w-3.5 h-3.5 text-brand-ink-3 transition-transform', dropdownOpen && 'rotate-180')} />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-brand-surface border border-brand-line rounded-xl shadow-xl z-50 py-1 overflow-hidden">
              <div className="px-3 py-2 border-b border-brand-line-2">
                <span className="text-[10px] font-semibold text-brand-ink-3 uppercase tracking-widest">Switch agent</span>
              </div>
              <div className="max-h-72 overflow-y-auto py-1">
                {AGENTS.map(a => {
                  const AIcon = AGENT_ICONS[a.id] ?? Zap;
                  const isCurrent = a.id === agent.id;
                  return (
                    <button
                      key={a.id}
                      onClick={() => { setDropdownOpen(false); if (!isCurrent) router.push(`/dashboard/agents/${a.id}`); }}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors',
                        isCurrent ? 'bg-brand-accent-bg' : 'hover:bg-brand-elevated',
                      )}
                    >
                      <div className={cn('w-6 h-6 rounded-md border border-brand-line flex items-center justify-center flex-shrink-0', a.bg)}>
                        <AIcon className={cn('w-3 h-3', a.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={cn('text-[12px] font-medium truncate', isCurrent ? 'text-brand-accent-text' : 'text-brand-ink')}>{a.name}</div>
                        <div className="text-[10px] text-brand-ink-3 truncate">{a.description.slice(0, 42)}…</div>
                      </div>
                      {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-brand-accent flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Status badge + trigger count */}
        <div className="flex items-center gap-2">
          <span className={cn('text-[10px] font-semibold px-1.5 py-[3px] rounded uppercase tracking-wide', {
            'bg-brand-green-bg text-brand-green': active && agent.status === 'active',
            'bg-brand-amber-bg text-brand-amber': active && agent.status === 'beta',
            'bg-brand-elevated text-brand-ink-3': !active,
          })}>{active ? agent.status : 'inactive'}</span>
          {activeTriggers > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-brand-accent font-medium">
              <Clock className="w-3 h-3" />{activeTriggers} trigger{activeTriggers > 1 ? 's' : ''} active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => setCopilotOpen(v => !v)}
            className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[12px] font-medium transition-colors',
              copilotOpen ? 'border-brand-accent bg-brand-accent-bg text-brand-accent-text' : 'border-brand-line text-brand-ink-2 hover:bg-brand-elevated')}>
            <Sparkles className="w-3 h-3" /> Assistant
          </button>
          <div className="w-px h-4 bg-brand-line mx-0.5" />
          <span className="text-[11px] text-brand-ink-3">Active</span>
          <Switch on={active} onChange={setActive} />
          <div className="w-px h-4 bg-brand-line mx-0.5" />
          <button onClick={() => setInstructions(p => ({ ...p, systemPrompt: agent.systemPrompt, guardrails: agent.guardrails, goals: agent.goals }))}
            className="p-1.5 rounded-lg border border-brand-line hover:bg-brand-elevated text-brand-ink-3 transition-colors" title="Reset to defaults">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          {saveError && <span className="text-[11px] text-brand-red">{saveError}</span>}
          <button onClick={save} disabled={saving}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-60',
              saved ? 'bg-brand-green-bg text-brand-green border border-brand-green'
                    : saveError ? 'bg-brand-red-bg text-brand-red border border-brand-red'
                    : 'bg-brand-accent hover:bg-brand-accent-dim text-white')}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center border-b border-brand-line px-6 bg-brand-surface flex-shrink-0">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-all',
              tab === t.id ? 'border-brand-accent text-brand-ink' : 'border-transparent text-brand-ink-3 hover:text-brand-ink')}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.id === 'connectors' && connectors.length > 0 && (
              <span className="ml-1 text-[10px] font-mono text-brand-ink-3">{connectors.length}</span>
            )}
            {t.id === 'instructions' && activeTriggers > 0 && (
              <span className="ml-1 w-1.5 h-1.5 rounded-full bg-brand-accent flex-shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Content + Copilot */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === 'overview'     && <OverviewTab      state={overview}      onChange={setOverview} />}
          {tab === 'instructions' && <InstructionsTab  state={instructions}  onChange={setInstructions} />}
          {tab === 'connectors'   && <ConnectorsTab    agentId={agent.id} connectors={connectors} setConnectors={setConnectors} recommended={agent.connectors} />}
          {tab === 'mcps'         && <McpsTab          agentId={agent.id} recommendedMcpIds={agent.recommendedMcps} />}
          {tab === 'access'       && <AccessTab        minRole={minRole} setMinRole={setMinRole} active={active} setActive={setActive} />}
          {tab === 'sandbox'      && <SandboxTab       agentId={agent.id} agentName={overview.name || agent.name} />}
        </div>

        <ConfigCopilot
          agent={agent} llm={overview.llm} temp={overview.temperature}
          minRole={minRole} connectors={connectors}
          systemPrompt={instructions.systemPrompt}
          open={copilotOpen} onClose={() => setCopilotOpen(false)}
        />
      </div>
    </div>
  );
}
