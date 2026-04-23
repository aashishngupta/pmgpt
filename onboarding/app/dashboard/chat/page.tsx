'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Send, Bot, User, Loader2, X, ChevronRight,
  Brain, FileText, Lightbulb, Tag, Link2, Clock, Pin,
  BookOpen, Zap, Play, MessageSquare, Plus,
  ExternalLink, Copy, Check, Pencil, Trash2, CheckCircle2,
  Target, BarChart2, Search, Layers, GitPullRequest,
  Terminal, Trophy, TrendingUp, GraduationCap, Scale, Rocket, Globe,
} from 'lucide-react';

const AGENT_ICONS_CHAT: Record<string, React.ElementType> = {
  strategy: Target, docs: FileText, analytics: BarChart2, research: Search,
  ops: Layers, review: GitPullRequest, engineering: Terminal, competitive: Trophy,
  sales: TrendingUp, coach: GraduationCap, prioritization: Scale, release: Rocket, market: Globe,
};
import { cn } from '@/lib/utils';
import { AGENTS, Agent, AgentTemplate } from '@/lib/platform-data';
import { api, Thread } from '@/lib/api';
import { Button } from '@/components/ui/button';

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = 'user' | 'assistant';

interface Source { title: string; url: string; connector: string }

interface Message {
  id: string;
  role: Role;
  content: string;
  agent?: string;
  sources?: Source[];
  ts: Date;
}

interface MemoryItem {
  id: string;
  type: 'decision' | 'insight' | 'context' | 'action';
  content: string;
  ts: Date;
  pinned: boolean;
}

const TYPE_CONFIG = {
  decision: { label: 'Decision',  color: 'bg-violet-100 text-violet-700', icon: Lightbulb },
  insight:  { label: 'Insight',   color: 'bg-amber-100 text-amber-700',   icon: Brain      },
  context:  { label: 'Context',   color: 'bg-blue-100 text-blue-700',     icon: BookOpen   },
  action:   { label: 'Action',    color: 'bg-emerald-100 text-emerald-700', icon: Zap       },
};

// ── Agent icon map (emoji-free) ───────────────────────────────────────────────

const AGENT_COLOR: Record<string, string> = {
  strategy: 'bg-violet-100 text-violet-700',
  docs:     'bg-blue-100 text-blue-700',
  analytics:'bg-emerald-100 text-emerald-700',
  research: 'bg-amber-100 text-amber-700',
  ops:      'bg-orange-100 text-orange-700',
  engineering:'bg-slate-100 text-slate-700',
  competitive:'bg-red-100 text-red-700',
  sales:    'bg-teal-100 text-teal-700',
  coach:    'bg-pink-100 text-pink-700',
  prioritization:'bg-indigo-100 text-indigo-700',
  release:  'bg-cyan-100 text-cyan-700',
  market:   'bg-lime-100 text-lime-700',
  sprint:   'bg-brand-accent/10 text-brand-accent',
  review:   'bg-purple-100 text-purple-700',
  general:  'bg-slate-100 text-slate-600',
};

// ── Thread sidebar ────────────────────────────────────────────────────────────

function ThreadSidebar({
  threads, activeId, agentId, onSelect, onCreate, onDelete,
}: {
  threads: Thread[];
  activeId: string | null;
  agentId: string;
  onSelect: (t: Thread) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}) {
  const grouped = AGENTS.reduce<Record<string, Thread[]>>((acc, a) => {
    const ts = threads.filter(t => t.agent_id === a.id);
    if (ts.length) acc[a.id] = ts;
    return acc;
  }, {});

  return (
    <div className="w-52 flex-shrink-0 border-r border-brand-line bg-brand-surface flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-brand-line">
        <span className="text-[11px] font-semibold text-brand-ink-3 uppercase tracking-widest">Conversations</span>
        <button
          onClick={onCreate}
          className="p-1 rounded-md text-brand-ink-3 hover:text-brand-ink hover:bg-brand-elevated transition-colors"
          title="New conversation"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {threads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <MessageSquare className="w-6 h-6 text-brand-ink-4 mb-2" />
            <p className="text-[11px] text-brand-ink-3">No conversations yet. Start one below.</p>
          </div>
        )}

        {Object.entries(grouped).map(([aid, ts]) => {
          const a = AGENTS.find(ag => ag.id === aid);
          return (
            <div key={aid} className="mb-1">
              <div className="px-3 py-1.5 text-[9px] font-bold text-brand-ink-4 uppercase tracking-widest">
                {a?.name.replace(' Copilot','').replace(' Intel','') ?? aid}
              </div>
              {ts.map(t => (
                <div
                  key={t.id}
                  className={cn(
                    'group flex items-center gap-2 px-3 py-1.5 mx-1 rounded-md cursor-pointer transition-colors',
                    t.id === activeId ? 'bg-brand-accent-bg text-brand-accent-text' : 'hover:bg-brand-elevated text-brand-ink-2',
                  )}
                  onClick={() => onSelect(t)}
                >
                  <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', {
                    'bg-brand-green': t.status === 'published',
                    'bg-brand-amber': t.status === 'draft',
                    'bg-brand-ink-4': t.status === 'archived',
                  })} />
                  <span className="flex-1 text-[11px] truncate">{t.title}</span>
                  <button
                    onClick={e => { e.stopPropagation(); onDelete(t.id); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-brand-ink-4 hover:text-brand-red transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Template modal ────────────────────────────────────────────────────────────

function TemplateModal({
  template, agent, onSubmit, onClose,
}: { template: AgentTemplate; agent: Agent; onSubmit: (p: string) => void; onClose: () => void }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const buildPrompt = () => template.fields.map(f => `**${f.label}:** ${values[f.key] || '(not provided)'}`).join('\n');
  const allRequired = template.fields.filter(f => f.required).every(f => values[f.key]?.trim());

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold', AGENT_COLOR[agent.id] ?? 'bg-slate-100 text-slate-600')}>
              {agent.name[0]}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">{template.name}</div>
              <div className="text-xs text-slate-400">{agent.name}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {template.fields.map(f => (
            <div key={f.key}>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1 block">
                {f.label} {f.required && <span className="text-red-500">*</span>}
              </label>
              <textarea
                rows={3}
                placeholder={f.placeholder}
                value={values[f.key] || ''}
                onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-400 resize-none placeholder-slate-300"
              />
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex gap-2">
          <Button onClick={() => { onSubmit(buildPrompt()); onClose(); }} disabled={!allRequired}
            className="flex-1 bg-violet-600 hover:bg-violet-700 gap-2 h-9">
            <Play className="w-4 h-4" /> Run template
          </Button>
          <Button variant="outline" onClick={onClose} className="h-9 px-4">Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// ── Markdown renderer ─────────────────────────────────────────────────────────

function fmt(text: string, isUser: boolean): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="font-semibold">{p.slice(2,-2)}</strong>;
    if (p.startsWith('`') && p.endsWith('`'))   return <code key={i} className={cn('px-1.5 py-0.5 rounded text-[11px] font-mono', isUser ? 'bg-white/20' : 'bg-slate-100 text-slate-700')}>{p.slice(1,-1)}</code>;
    return <span key={i}>{p}</span>;
  });
}

function MD({ content, isUser }: { content: string; isUser: boolean }) {
  return (
    <div className="space-y-1">
      {content.split('\n').map((line, i) => {
        if (line.startsWith('# '))  return <h2 key={i} className="text-base font-bold mt-2 mb-1">{line.slice(2)}</h2>;
        if (line.startsWith('## ')) return <h3 key={i} className="text-sm font-bold mt-1.5 mb-0.5">{line.slice(3)}</h3>;
        if (line.startsWith('> '))  return <blockquote key={i} className={cn('border-l-2 pl-3 italic text-[13px]', isUser ? 'border-white/40 text-white/80' : 'border-slate-300 text-slate-500')}>{fmt(line.slice(2), isUser)}</blockquote>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-[13px] leading-relaxed">{fmt(line.slice(2), isUser)}</li>;
        if (line.match(/^\d+\. /)) return <li key={i} className="ml-4 list-decimal text-[13px] leading-relaxed">{fmt(line.replace(/^\d+\. /, ''), isUser)}</li>;
        if (line === '') return <div key={i} className="h-2" />;
        return <p key={i} className="text-[13px] leading-relaxed">{fmt(line, isUser)}</p>;
      })}
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function Bubble({ msg, onExtract }: { msg: Message; onExtract: (content: string, type: MemoryItem['type']) => void }) {
  const isUser = msg.role === 'user';
  const [copied, setCopied] = useState(false);
  const [showExtract, setShowExtract] = useState(false);

  return (
    <div className={cn('flex gap-3 group', isUser ? 'flex-row-reverse' : '')}>
      <div className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5', isUser ? 'bg-brand-accent' : 'bg-slate-800')}>
        {isUser ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-white" />}
      </div>
      <div className={cn('max-w-2xl flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
        <div className={cn('rounded-2xl px-4 py-3', isUser ? 'bg-brand-accent text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm')}>
          <MD content={msg.content} isUser={isUser} />
          {msg.sources && msg.sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Sources</p>
              {msg.sources.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-[11px] text-brand-accent hover:underline">
                  <Link2 className="w-3 h-3" />[{i+1}] {s.title}
                  <span className="text-slate-300">· {s.connector}</span>
                </a>
              ))}
            </div>
          )}
          {msg.agent && !isUser && <p className="text-[10px] text-slate-400 mt-2">via {msg.agent} agent</p>}
        </div>

        {!isUser && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity px-1">
            <button
              onClick={() => { navigator.clipboard.writeText(msg.content); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            </button>
            <div className="relative">
              <button
                onClick={() => setShowExtract(!showExtract)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center gap-1"
              >
                <Brain className="w-3 h-3" />
                <span className="text-[10px]">Save to memory</span>
              </button>
              {showExtract && (
                <div className="absolute bottom-full left-0 mb-1 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex flex-col gap-1 min-w-[160px] z-10">
                  {(Object.keys(TYPE_CONFIG) as MemoryItem['type'][]).map(t => {
                    const { label, icon: Icon } = TYPE_CONFIG[t];
                    return (
                      <button key={t} onClick={() => { onExtract(msg.content, t); setShowExtract(false); }}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-slate-50 text-left">
                        <Icon className="w-3.5 h-3.5 text-slate-500" /> {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-400 ml-1">{msg.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Right drawer ──────────────────────────────────────────────────────────────

function RightDrawer({
  memory, onPin, onDelete,
}: {
  memory: MemoryItem[];
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="w-60 flex-shrink-0 border-l border-brand-line bg-brand-surface flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-brand-line flex-shrink-0">
        <Brain className="w-3.5 h-3.5 text-brand-ink-3" />
        <span className="text-[11px] font-semibold text-brand-ink-3 uppercase tracking-widest">Memory</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <p className="text-[11px] text-brand-ink-3 leading-relaxed">
          Key context saved from conversations. Auto-injected into future queries.
        </p>
        {memory.length === 0 ? (
          <div className="text-center py-8 text-brand-ink-3">
            <Brain className="w-7 h-7 mx-auto mb-2 opacity-30" />
            <p className="text-[11px]">Hover a message and click "Save to memory".</p>
          </div>
        ) : (
          memory.sort((a, b) => Number(b.pinned) - Number(a.pinned)).map(item => {
            const { label, color } = TYPE_CONFIG[item.type];
            return (
              <div key={item.id} className={cn('rounded-lg p-3 border', item.pinned ? 'border-brand-accent/30 bg-brand-accent-bg' : 'border-brand-line bg-brand-canvas')}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', color)}>{label}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => onPin(item.id)} className={cn('p-0.5 rounded', item.pinned ? 'text-brand-accent' : 'text-brand-ink-4 hover:text-brand-ink-2')}>
                      <Pin className="w-3 h-3" />
                    </button>
                    <button onClick={() => onDelete(item.id)} className="p-0.5 rounded text-brand-ink-4 hover:text-brand-red">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-brand-ink-2 leading-relaxed">{item.content}</p>
                <p className="text-[10px] text-brand-ink-4 mt-1.5 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> {item.ts.toLocaleDateString()}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Starters ──────────────────────────────────────────────────────────────────

const STARTERS = [
  { label: 'Write sprint summary',     prompt: 'Write a sprint 24 summary for stakeholders',            agent: 'ops'           },
  { label: 'Draft a PRD',              prompt: 'Help me write a PRD for mobile onboarding redesign',    agent: 'docs'          },
  { label: 'Diagnose activation drop', prompt: 'Activation rate dropped 1.1% this week — investigate',  agent: 'analytics'     },
  { label: 'Build Q3 OKRs',            prompt: 'Help me define Q3 OKRs for a B2B SaaS PM tool',        agent: 'strategy'      },
  { label: 'NPS survey design',        prompt: 'Design an NPS survey for our analytics dashboard',      agent: 'research'      },
  { label: 'Competitive battlecard',   prompt: 'Generate a battlecard for Productboard',                agent: 'competitive'   },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const params = useSearchParams();

  // Thread state
  const [threads, setThreads]       = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [loadingThreads, setLoadingThreads] = useState(true);

  // Message state
  const [messages, setMessages]     = useState<Message[]>([]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [agentId, setAgentId]       = useState(params.get('agent') || 'general');

  // UI state
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [drawerOpen, setDrawerOpen]         = useState(false);
  const [memory, setMemory]                 = useState<MemoryItem[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<AgentTemplate | null>(null);
  const [agentDropOpen, setAgentDropOpen]   = useState(false);
  const agentDropRef = useRef<HTMLDivElement>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (agentDropRef.current && !agentDropRef.current.contains(e.target as Node)) setAgentDropOpen(false);
    }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);

  const agent = AGENTS.find(a => a.id === agentId) ?? AGENTS[0];

  // Load threads on mount
  useEffect(() => {
    api.threads.list().then(ts => {
      setThreads(ts);
      setLoadingThreads(false);
    }).catch(() => setLoadingThreads(false));
  }, []);

  // Handle URL params
  useEffect(() => {
    const q = params.get('q');
    const a = params.get('agent');
    if (a) setAgentId(a);
    if (q) setTimeout(() => handleSend(q, a ?? agentId), 200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  // Select a thread and load its messages
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

  // Start a brand-new conversation
  function newConversation() {
    setActiveThread(null);
    setMessages([]);
    inputRef.current?.focus();
  }

  // Delete a thread
  async function deleteThread(id: string) {
    try {
      await api.threads.delete(id);
      setThreads(prev => prev.filter(t => t.id !== id));
      if (activeThread?.id === id) newConversation();
    } catch { /* ignore */ }
  }

  const addMemory = useCallback((content: string, type: MemoryItem['type']) => {
    const snippet = content.length > 120 ? content.slice(0, 120) + '…' : content;
    setMemory(prev => [{ id: `m${Date.now()}`, type, content: snippet, ts: new Date(), pinned: false }, ...prev]);
  }, []);

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

      // Create thread on first message if needed
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

      setMessages(prev => [...prev, {
        id: `a${Date.now()}`, role: 'assistant',
        content: data.response, agent: data.agent, sources: data.sources, ts: new Date(),
      }]);

      // Update thread title after first message (backend auto-titles)
      setThreads(prev => prev.map(t =>
        t.id === thread!.id
          ? { ...t, title: query.slice(0, 60) + (query.length > 60 ? '…' : '') }
          : t
      ));

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setMessages(prev => [...prev, {
        id: `e${Date.now()}`, role: 'assistant',
        content: `**Connection error:** ${msg}\n\nMake sure the pmGPT backend is running at \`http://localhost:8000\`.`,
        ts: new Date(),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex h-full overflow-hidden">

      {/* Thread sidebar — collapsed by default */}
      {sidebarOpen && (
        <ThreadSidebar
          threads={threads}
          activeId={activeThread?.id ?? null}
          agentId={agentId}
          onSelect={selectThread}
          onCreate={newConversation}
          onDelete={deleteThread}
        />
      )}

      {/* Main chat */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar — agent dropdown */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-brand-surface border-b border-brand-line flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            title="Toggle conversation history"
            className={cn('p-1.5 rounded-md transition-all flex-shrink-0', sidebarOpen ? 'bg-brand-accent-bg text-brand-accent' : 'text-brand-ink-3 hover:bg-brand-elevated')}
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <div className="relative flex-1" ref={agentDropRef}>
            <button
              onClick={() => setAgentDropOpen(v => !v)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-brand-line hover:border-brand-accent bg-brand-canvas transition-all group w-full max-w-xs"
            >
              <div className={cn('w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-[11px] font-bold', AGENT_COLOR[agentId] ?? 'bg-slate-100 text-slate-600')}>
                {(() => { const I = AGENT_ICONS_CHAT[agentId]; return I ? <I className="w-3.5 h-3.5" /> : agent.name[0]; })()}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-[13px] font-semibold text-brand-ink truncate">{agent.name}</div>
                <div className="text-[10px] text-brand-ink-3 truncate">{agent.description.slice(0, 48)}…</div>
              </div>
              <ChevronRight className={cn('w-3.5 h-3.5 text-brand-ink-3 transition-transform flex-shrink-0', agentDropOpen ? 'rotate-90' : '')} />
            </button>

            {agentDropOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-72 bg-brand-surface border border-brand-line rounded-xl shadow-2xl z-50 py-1 overflow-hidden">
                <div className="px-3 py-2 border-b border-brand-line-2">
                  <span className="text-[10px] font-semibold text-brand-ink-3 uppercase tracking-widest">Choose agent</span>
                </div>
                <div className="max-h-80 overflow-y-auto py-1">
                  {AGENTS.map(a => {
                    const AIcon = AGENT_ICONS_CHAT[a.id];
                    const isCurrent = a.id === agentId;
                    return (
                      <button
                        key={a.id}
                        onClick={() => {
                          setAgentDropOpen(false);
                          setAgentId(a.id);
                          if (activeThread && activeThread.agent_id !== a.id) newConversation();
                        }}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors',
                          isCurrent ? 'bg-brand-accent-bg' : 'hover:bg-brand-elevated',
                        )}
                      >
                        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-bold', AGENT_COLOR[a.id] ?? 'bg-slate-100 text-slate-600')}>
                          {AIcon ? <AIcon className="w-3.5 h-3.5" /> : a.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={cn('text-[12px] font-semibold truncate', isCurrent ? 'text-brand-accent-text' : 'text-brand-ink')}>
                            {a.name}
                            {a.status === 'beta' && <span className="ml-1.5 text-[8px] font-bold text-brand-amber bg-brand-amber-bg px-1 py-0.5 rounded">β</span>}
                          </div>
                          <div className="text-[10px] text-brand-ink-3 truncate">{a.description.slice(0, 50)}…</div>
                        </div>
                        {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-brand-accent flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {activeThread && (
            <div className="flex items-center gap-1.5 text-[11px] text-brand-ink-3">
              <MessageSquare className="w-3 h-3" />
              <span className="truncate max-w-[160px]">{activeThread.title}</span>
            </div>
          )}

          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className={cn('p-1.5 rounded-md transition-all flex-shrink-0 ml-auto', drawerOpen ? 'bg-brand-accent-bg text-brand-accent' : 'text-brand-ink-3 hover:bg-brand-elevated')}
            title="Toggle templates & memory"
          >
            <Brain className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-brand-canvas">
          {messages.length === 0 && (
            <div className="max-w-xl mx-auto pt-12">
              <div className="mb-1">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold mb-3', AGENT_COLOR[agent.id] ?? 'bg-slate-100 text-slate-600')}>
                  {agent.name[0]}
                </div>
                <h2 className="text-[17px] font-bold text-brand-ink">{agent.name}</h2>
                <p className="text-[13px] text-brand-ink-3 mt-1 leading-relaxed">{agent.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-6">
                {STARTERS.map(s => (
                  <button
                    key={s.label}
                    onClick={() => { setAgentId(s.agent); handleSend(s.prompt, s.agent); }}
                    className="text-left bg-brand-surface border border-brand-line rounded-lg px-3.5 py-3 text-[12px] text-brand-ink-2 hover:border-brand-accent hover:bg-brand-accent-bg transition-all font-medium leading-snug"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <Bubble key={msg.id} msg={msg} onExtract={addMemory} />
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-brand-surface border border-brand-line rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-brand-accent animate-spin" />
                <span className="text-[13px] text-brand-ink-3">{agent.name} is thinking…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-5 pb-4 pt-2 flex-shrink-0 bg-brand-surface border-t border-brand-line">
          {agent.templates.length > 0 && (
            <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1">
              <span className="text-[10px] text-brand-ink-4 font-semibold flex-shrink-0">Templates:</span>
              {agent.templates.map(t => (
                <button key={t.id} onClick={() => setActiveTemplate(t)}
                  className="flex items-center gap-1 px-2 py-1 bg-brand-elevated border border-brand-line rounded-full text-[10px] font-medium text-brand-ink-2 hover:bg-brand-accent-bg hover:text-brand-accent hover:border-brand-accent/20 flex-shrink-0 transition-all">
                  <Zap className="w-2.5 h-2.5" /> {t.name}
                </button>
              ))}
            </div>
          )}
          <div className="bg-brand-canvas border border-brand-line rounded-xl flex items-end gap-2 px-4 py-3 focus-within:border-brand-accent transition-colors">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={`Ask ${agent.name}… (type @${agentId} to address a specific agent)`}
              className="flex-1 text-[13px] text-brand-ink placeholder-brand-ink-4 resize-none outline-none bg-transparent leading-relaxed"
              style={{ fieldSizing: 'content', maxHeight: '160px' } as React.CSSProperties}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
                input.trim() && !loading ? 'bg-brand-accent hover:bg-brand-accent-dim text-white' : 'bg-brand-elevated text-brand-ink-4 cursor-not-allowed'
              )}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-center text-[10px] text-brand-ink-4 mt-1.5">
            <kbd className="font-mono bg-brand-elevated border border-brand-line px-1 rounded text-[9px]">Enter</kbd> send ·{' '}
            <kbd className="font-mono bg-brand-elevated border border-brand-line px-1 rounded text-[9px]">Shift+Enter</kbd> new line ·{' '}
            <span>Use <code className="font-mono bg-brand-elevated px-1 rounded text-[9px]">@agent</code> to route to a specific agent</span>
          </p>
        </div>
      </div>

      {/* Right drawer */}
      {drawerOpen && (
        <RightDrawer
          memory={memory}
          onPin={id => setMemory(prev => prev.map(m => m.id === id ? { ...m, pinned: !m.pinned } : m))}
          onDelete={id => setMemory(prev => prev.filter(m => m.id !== id))}
        />
      )}

      {activeTemplate && (
        <TemplateModal
          template={activeTemplate}
          agent={agent}
          onSubmit={p => handleSend(p)}
          onClose={() => setActiveTemplate(null)}
        />
      )}
    </div>
  );
}
