'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, Loader2, Bot, User, Target, FileText, BarChart2, Search,
  Layers, Trophy, CheckCircle2, Circle, AlertTriangle, Clock,
  Copy, Check, X, ChevronRight, Download, ClipboardList,
  GitPullRequest, Terminal, GraduationCap, TrendingUp,
  Sparkles, FileCheck, MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

// ── System prompt ─────────────────────────────────────────────────────────────

const PRD_SYSTEM_PROMPT = `You are PRD Copilot — an expert Product Manager assistant embedded in pmGPT, an AI platform for enterprise product teams. Your sole purpose is to help PMs create comprehensive, well-structured Product Requirements Documents.

ROLE:
You are a senior PM co-pilot who has shipped hundreds of products across fintech, B2B SaaS, consumer, healthcare, and marketplace sectors. You think in frameworks, ask sharp questions, and build PRDs collaboratively — one stage at a time.

YOUR PRD STAGES (follow this order, do not skip):
1. PROBLEM DEFINITION — Clarify the exact problem, affected user segments, business impact, urgency. Probe: "Why now? What happens if we don't build this?"
2. USER & MARKET RESEARCH — Surface existing research, user feedback themes, jobs-to-be-done. Invoke Research Agent when needed.
3. GOALS & METRICS — Define primary success metric, guardrail metrics, OKR alignment, measurement plan.
4. COMPETITIVE ANALYSIS — Map competitor approaches, gaps, differentiation opportunity. Invoke Competitive Intel agent.
5. SCOPE DEFINITION — Explicit v1 inclusions and exclusions. Assumptions, dependencies, phasing.
6. REQUIREMENTS — Functional requirements as user stories (As a [user] I want [action] so that [outcome]). Non-functional requirements. Edge cases.
7. RISKS & DEPENDENCIES — Technical, business, regulatory risks with likelihood/impact and mitigation strategies.
8. PRD DRAFT — Compile all captured information into a clean, executive-ready PRD document.

BEHAVIORAL RULES:
- Ask maximum 2–3 focused questions per response — never more
- After each stage, summarize what you captured in 2–3 bullets, then ask "Ready to move to [next stage]?"
- When invoking a sub-agent, write exactly: "**[Invoking Competitive Intel]** Searching competitor landscape for [topic]..." or "**[Invoking Research Agent]** Synthesizing user feedback on [topic]..." or "**[Invoking Analytics Intel]** Pulling metrics for [topic]..."
- Adapt your questions to sector signals: if fintech, ask about compliance/fraud/data residency; if consumer, ask about activation funnel/retention/A/B plans; if B2B, ask about admin controls/SSO/integrations
- Keep responses tight — you are a PM tool, not an essay generator
- Use **bold** for emphasis, ## for stage headers, - for bullets, numbered lists for user stories
- When you have enough for a stage, write "## Stage complete: [Stage Name]" followed by a 3-bullet summary

STARTING BEHAVIOR:
Begin by asking the PM what product or feature they want to create a PRD for. Ask one follow-up: who are the primary users?`;

// ── PRD Stages ────────────────────────────────────────────────────────────────

type StageId = 'problem' | 'research' | 'goals' | 'competitive' | 'scope' | 'requirements' | 'risks' | 'draft';
type StageStatus = 'pending' | 'active' | 'done';

interface Stage {
  id: StageId;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  hint: string;
  keywords: string[];
}

const STAGES: Stage[] = [
  { id: 'problem',      label: 'Problem Definition',      shortLabel: 'Problem',       icon: Target,        hint: 'What problem? For whom? Why now?',           keywords: ['problem', 'pain point', 'challenge', 'why now', 'user need'] },
  { id: 'research',     label: 'User & Market Research',  shortLabel: 'Research',      icon: Search,        hint: 'User feedback, jobs-to-be-done',              keywords: ['research', 'feedback', 'user interview', 'jobs-to-be-done', 'qualitative'] },
  { id: 'goals',        label: 'Goals & Metrics',         shortLabel: 'Goals',         icon: BarChart2,     hint: 'Success metrics, OKR alignment',              keywords: ['metric', 'okr', 'kpi', 'success criteria', 'north star', 'measure'] },
  { id: 'competitive',  label: 'Competitive Analysis',    shortLabel: 'Competitive',   icon: Trophy,        hint: 'Market landscape, differentiators',           keywords: ['competitor', 'competitive', 'market landscape', 'battlecard', 'differentiat'] },
  { id: 'scope',        label: 'Scope Definition',        shortLabel: 'Scope',         icon: Layers,        hint: 'v1 inclusions & explicit exclusions',         keywords: ['in scope', 'out of scope', 'v1', 'phase 1', 'inclusion', 'exclusion'] },
  { id: 'requirements', label: 'Requirements',            shortLabel: 'Requirements',  icon: FileText,      hint: 'User stories, functional & non-functional',   keywords: ['requirement', 'user story', 'as a ', 'functional', 'non-functional', 'acceptance'] },
  { id: 'risks',        label: 'Risks & Dependencies',    shortLabel: 'Risks',         icon: AlertTriangle, hint: 'Blockers, mitigation strategies',             keywords: ['risk', 'dependency', 'mitigation', 'blocker', 'assumption', 'constraint'] },
  { id: 'draft',        label: 'PRD Draft',               shortLabel: 'Draft',         icon: FileCheck,     hint: 'Full document compiled & ready',             keywords: ['prd', 'product requirements', 'full document', 'compile', 'draft'] },
];

// ── Sub-agent detection ───────────────────────────────────────────────────────

interface ToolCall {
  id: string;
  agent: string;
  icon: React.ElementType;
  color: string;
  description: string;
  done: boolean;
}

function detectToolCalls(text: string): Omit<ToolCall, 'id' | 'done'>[] {
  const calls: Omit<ToolCall, 'id' | 'done'>[] = [];
  if (/invoking competitive|competitive intel/i.test(text))
    calls.push({ agent: 'Competitive Intel', icon: Trophy,    color: '#EF4444', description: 'Analyzing competitor landscape and market positioning...' });
  if (/invoking research|research agent/i.test(text))
    calls.push({ agent: 'Research Agent',    icon: Search,    color: '#F59E0B', description: 'Synthesizing user feedback, interviews, and behavioral signals...' });
  if (/invoking analytics|analytics intel/i.test(text))
    calls.push({ agent: 'Analytics Intel',  icon: BarChart2, color: '#10B981', description: 'Pulling product metrics, funnel data, and usage analytics...' });
  return calls;
}

function detectStage(text: string): StageId | null {
  const lower = text.toLowerCase();
  for (const stage of [...STAGES].reverse()) {
    if (stage.keywords.some(k => lower.includes(k))) return stage.id;
  }
  return null;
}

// ── Message types ─────────────────────────────────────────────────────────────

interface ThinkingStep { text: string; done: boolean }

type MsgType = 'user' | 'assistant' | 'thinking' | 'tool_call';

interface Msg {
  id: string;
  type: MsgType;
  content?: string;
  thinkingSteps?: ThinkingStep[];
  toolCall?: ToolCall;
  ts: Date;
}

// ── PRD document state ────────────────────────────────────────────────────────

interface PRDState {
  title: string;
  stageStatuses: Record<StageId, StageStatus>;
  sections: Partial<Record<StageId, string>>;
  activeStage: StageId;
}

function initPRDState(): PRDState {
  const statuses = {} as Record<StageId, StageStatus>;
  STAGES.forEach((s, i) => { statuses[s.id] = i === 0 ? 'active' : 'pending'; });
  return { title: 'Untitled PRD', stageStatuses: statuses, sections: {}, activeStage: 'problem' };
}

// ── Thinking card ─────────────────────────────────────────────────────────────

function ThinkingCard({ steps }: { steps: ThinkingStep[] }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-brand-sidebar flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="bg-brand-canvas border border-brand-line rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs">
        <div className="text-[10px] font-bold text-brand-ink-3 uppercase tracking-wider mb-2">Processing</div>
        <div className="space-y-1.5">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              {step.done
                ? <CheckCircle2 className="w-3 h-3 text-brand-accent flex-shrink-0" />
                : <Loader2 className="w-3 h-3 text-brand-ink-3 animate-spin flex-shrink-0" />
              }
              <span className={cn('text-[11px]', step.done ? 'text-brand-ink-2' : 'text-brand-ink-3')}>{step.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tool call card ────────────────────────────────────────────────────────────

function ToolCallCard({ call }: { call: ToolCall }) {
  const Icon = call.icon;
  return (
    <div className="flex gap-3">
      <div className="w-7 flex-shrink-0" />
      <div className="border border-dashed rounded-xl px-4 py-3 flex items-center gap-3 max-w-sm" style={{ borderColor: call.color + '60', background: call.color + '08' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: call.color + '18' }}>
          <Icon className="w-3.5 h-3.5" style={{ color: call.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: call.color }}>{call.agent}</div>
          <div className="text-[11px] text-brand-ink-2 leading-snug">{call.description}</div>
        </div>
        {call.done
          ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: call.color }} />
          : <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" style={{ color: call.color }} />
        }
      </div>
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function fmt(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="font-semibold text-brand-ink">{p.slice(2, -2)}</strong>;
    if (p.startsWith('`') && p.endsWith('`'))   return <code key={i} className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-brand-line text-brand-ink-2">{p.slice(1, -1)}</code>;
    return <span key={i}>{p}</span>;
  });
}

function MD({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <h3 key={i} className="text-[13px] font-bold text-brand-ink mt-2 mb-1">{line.slice(3)}</h3>;
        if (line.startsWith('# '))  return <h2 key={i} className="text-sm font-bold text-brand-ink mt-2 mb-1">{line.slice(2)}</h2>;
        if (line.startsWith('> '))  return <blockquote key={i} className="border-l-2 border-brand-accent pl-3 italic text-[12px] text-brand-ink-2">{fmt(line.slice(2))}</blockquote>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-[12px] leading-relaxed text-brand-ink-2">{fmt(line.slice(2))}</li>;
        if (line.match(/^\d+\. /)) return <li key={i} className="ml-4 list-decimal text-[12px] leading-relaxed text-brand-ink-2">{fmt(line.replace(/^\d+\. /, ''))}</li>;
        if (line === '') return <div key={i} className="h-1.5" />;
        return <p key={i} className="text-[13px] leading-relaxed text-brand-ink-2">{fmt(line)}</p>;
      })}
    </div>
  );
}

function MessageBubble({ msg }: { msg: Msg }) {
  const isUser = msg.type === 'user';
  const [copied, setCopied] = useState(false);

  if (msg.type === 'thinking' && msg.thinkingSteps) return <ThinkingCard steps={msg.thinkingSteps} />;
  if (msg.type === 'tool_call' && msg.toolCall)     return <ToolCallCard call={msg.toolCall} />;

  return (
    <div className={cn('flex gap-3 group', isUser ? 'flex-row-reverse' : '')}>
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
        isUser ? 'bg-brand-accent' : 'bg-brand-sidebar',
      )}>
        {isUser ? <User className="w-3.5 h-3.5 text-white" /> : <ClipboardList className="w-3.5 h-3.5 text-white" />}
      </div>
      <div className={cn('max-w-2xl flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
        <div className={cn(
          'rounded-2xl px-4 py-3',
          isUser ? 'bg-brand-accent text-white rounded-tr-sm' : 'bg-white border border-brand-line rounded-tl-sm',
        )}>
          {isUser
            ? <p className="text-[13px] leading-relaxed text-white">{msg.content}</p>
            : <MD content={msg.content ?? ''} />
          }
        </div>
        {!isUser && (
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity px-1">
            <button
              onClick={() => { navigator.clipboard.writeText(msg.content ?? ''); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              className="p-1 rounded text-brand-ink-3 hover:text-brand-ink hover:bg-brand-canvas"
            >
              {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            </button>
            <span className="text-[10px] text-brand-ink-4">{msg.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Stage Tracker (right panel tab 1) ────────────────────────────────────────

function StageTracker({ prd, loading }: { prd: PRDState; loading: boolean }) {
  const total = STAGES.length;
  const done = STAGES.filter(s => prd.stageStatuses[s.id] === 'done').length;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-brand-ink-2">PRD Completion</span>
          <span className="text-[11px] font-mono font-bold text-brand-accent">{pct}%</span>
        </div>
        <div className="h-1.5 bg-brand-line rounded-full overflow-hidden">
          <div className="h-full bg-brand-accent rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Stage list */}
      <div className="space-y-1">
        {STAGES.map((stage, i) => {
          const status = prd.stageStatuses[stage.id];
          const isActive = status === 'active';
          const isDone   = status === 'done';
          const isPending = status === 'pending';
          const Icon = stage.icon;
          return (
            <div
              key={stage.id}
              className={cn(
                'flex items-start gap-3 px-3 py-2.5 rounded-lg border transition-all',
                isActive  ? 'border-brand-accent bg-brand-accent-bg' : '',
                isDone    ? 'border-transparent bg-brand-canvas' : '',
                isPending ? 'border-transparent' : '',
              )}
            >
              {/* Step icon */}
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border-2',
                isDone    ? 'bg-brand-accent border-brand-accent' : '',
                isActive  ? 'bg-white border-brand-accent' : '',
                isPending ? 'bg-white border-brand-line' : '',
              )}>
                {isDone
                  ? <Check className="w-3 h-3 text-white" />
                  : isActive && loading
                    ? <Loader2 className="w-3 h-3 text-brand-accent animate-spin" />
                    : <Icon className={cn('w-3 h-3', isActive ? 'text-brand-accent' : 'text-brand-ink-4')} />
                }
              </div>

              {/* Label + hint */}
              <div className="flex-1 min-w-0">
                <div className={cn(
                  'text-[12px] font-semibold leading-tight',
                  isDone    ? 'text-brand-ink-2 line-through' : '',
                  isActive  ? 'text-brand-accent' : '',
                  isPending ? 'text-brand-ink-3' : '',
                )}>
                  {i + 1}. {stage.label}
                </div>
                <div className="text-[10px] text-brand-ink-4 mt-0.5 leading-tight">{stage.hint}</div>
              </div>

              {/* Status badge */}
              {isActive && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-accent text-white flex-shrink-0">NOW</span>
              )}
              {isDone && (
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-accent flex-shrink-0 mt-0.5" />
              )}
            </div>
          );
        })}
      </div>

      {/* Tip */}
      <div className="mt-5 p-3 rounded-lg bg-brand-canvas border border-brand-line">
        <div className="text-[10px] font-bold text-brand-ink-3 uppercase tracking-wider mb-1">PRD Copilot</div>
        <p className="text-[11px] text-brand-ink-3 leading-relaxed">
          The agent guides you through each stage. Answer its questions and it builds your PRD section by section.
        </p>
      </div>
    </div>
  );
}

// ── PRD Document panel (right panel tab 2) ────────────────────────────────────

const SECTION_LABELS: Record<StageId, string> = {
  problem:      'Problem Statement',
  research:     'User & Market Research',
  goals:        'Goals & Success Metrics',
  competitive:  'Competitive Analysis',
  scope:        'Scope Definition',
  requirements: 'Functional Requirements',
  risks:        'Risks & Dependencies',
  draft:        'Full PRD',
};

function PRDDocPanel({ prd, onExport }: { prd: PRDState; onExport: () => void }) {
  const filledStages = STAGES.filter(s => prd.sections[s.id]);
  const emptyStages  = STAGES.filter(s => !prd.sections[s.id]);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-brand-line flex items-center gap-2 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-bold text-brand-ink truncate">{prd.title}</div>
          <div className="text-[10px] text-brand-ink-3">{filledStages.length}/{STAGES.length} sections filled</div>
        </div>
        <button
          onClick={onExport}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-brand-line text-[11px] font-medium text-brand-ink-2 hover:border-brand-accent hover:text-brand-accent transition-colors"
        >
          <Download className="w-3 h-3" /> Export
        </button>
      </div>

      <div className="p-4 space-y-4">
        {filledStages.length === 0 && (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 text-brand-ink-4 mx-auto mb-2" />
            <p className="text-[11px] text-brand-ink-3">The PRD document builds here as you work through each stage with the copilot.</p>
          </div>
        )}

        {filledStages.map(stage => (
          <div key={stage.id} className="border border-brand-line rounded-xl overflow-hidden">
            <div className="px-3 py-2 bg-brand-canvas border-b border-brand-line flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-accent flex-shrink-0" />
              <span className="text-[11px] font-bold text-brand-ink">{SECTION_LABELS[stage.id]}</span>
            </div>
            <div className="px-3 py-2.5">
              <p className="text-[11px] text-brand-ink-2 leading-relaxed whitespace-pre-wrap">{prd.sections[stage.id]}</p>
            </div>
          </div>
        ))}

        {emptyStages.map(stage => (
          <div key={stage.id} className="border border-dashed border-brand-line rounded-xl px-3 py-2.5 flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full border-2 border-brand-line flex-shrink-0" />
            <span className="text-[11px] text-brand-ink-4">{SECTION_LABELS[stage.id]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Quick prompts ─────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  'I want to build a mobile onboarding redesign for our B2B SaaS product',
  'We need a PRD for an AI-powered search feature for enterprise users',
  'Help me write a PRD for a usage analytics dashboard for PMs',
  'Create a PRD for integrating Slack notifications into our platform',
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PRDCopilotPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [rightTab, setRightTab] = useState<'progress' | 'doc'>('progress');
  const [prd, setPrd]           = useState<PRDState>(initPRDState);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const thinkingIdRef = useRef<string | null>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  // ── Thinking steps animation ────────────────────────────────────────────────

  const runThinkingSteps = useCallback(async (query: string): Promise<string> => {
    const msgId = `thinking-${Date.now()}`;
    thinkingIdRef.current = msgId;

    const hasTool = detectToolCalls(query).length > 0 || /competitor|research|metric|analytics/i.test(query);
    const baseSteps: ThinkingStep[] = [
      { text: 'Parsing your input...', done: false },
      { text: 'Identifying PRD stage...', done: false },
      ...(hasTool ? [{ text: 'Checking if specialist agent needed...', done: false }] : []),
      { text: 'Composing response...', done: false },
    ];

    setMessages(prev => [...prev, { id: msgId, type: 'thinking', thinkingSteps: baseSteps, ts: new Date() }]);

    for (let i = 0; i < baseSteps.length; i++) {
      await new Promise(r => setTimeout(r, 350 + i * 200));
      setMessages(prev => prev.map(m => {
        if (m.id !== msgId || !m.thinkingSteps) return m;
        const updated = [...m.thinkingSteps];
        updated[i] = { ...updated[i], done: true };
        return { ...m, thinkingSteps: updated };
      }));
    }

    return msgId;
  }, []);

  // ── Tool call cards ─────────────────────────────────────────────────────────

  const showToolCalls = useCallback(async (text: string) => {
    const calls = detectToolCalls(text);
    for (const call of calls) {
      const id = `tool-${Date.now()}-${call.agent}`;
      const toolMsg: Msg = {
        id,
        type: 'tool_call',
        toolCall: { ...call, id, done: false },
        ts: new Date(),
      };
      setMessages(prev => [...prev, toolMsg]);
      await new Promise(r => setTimeout(r, 800));
      setMessages(prev => prev.map(m =>
        m.id === id && m.toolCall ? { ...m, toolCall: { ...m.toolCall, done: true } } : m,
      ));
    }
  }, []);

  // ── Update PRD state from response ─────────────────────────────────────────

  const updatePRD = useCallback((query: string, response: string) => {
    const stage = detectStage(response) ?? detectStage(query);
    if (!stage) return;

    const stageIdx = STAGES.findIndex(s => s.id === stage);

    setPrd(prev => {
      const newStatuses = { ...prev.stageStatuses };

      // Mark previous stages done
      STAGES.forEach((s, i) => {
        if (i < stageIdx) newStatuses[s.id] = 'done';
      });
      newStatuses[stage] = 'active';

      // Extract content (take first 400 chars of response, strip stage-complete lines)
      const sectionText = response
        .replace(/## Stage complete:.*/g, '')
        .replace(/\*\*(Invoking[^*]+)\*\*/g, '')
        .trim()
        .slice(0, 400);

      const title = prev.title === 'Untitled PRD'
        ? extractTitle(query, response)
        : prev.title;

      return {
        ...prev,
        title,
        activeStage: stage,
        stageStatuses: newStatuses,
        sections: { ...prev.sections, [stage]: sectionText },
      };
    });
  }, []);

  function extractTitle(query: string, response: string): string {
    const combined = query + ' ' + response;
    const forMatch = combined.match(/for\s+([a-zA-Z\s]{5,40}?)[\.\?,]/i);
    if (forMatch) return forMatch[1].trim() + ' — PRD';
    const buildMatch = combined.match(/(?:build|create|launch|redesign)\s+(?:a\s+|an\s+)?([a-zA-Z\s]{5,40}?)[\.\?,]/i);
    if (buildMatch) return buildMatch[1].trim() + ' — PRD';
    return 'Feature PRD';
  }

  // ── Send message ────────────────────────────────────────────────────────────

  async function sendMessage(text?: string) {
    const query = (text ?? input).trim();
    if (!query || loading) return;
    setInput('');

    setMessages(prev => [...prev, { id: `u${Date.now()}`, type: 'user', content: query, ts: new Date() }]);
    setLoading(true);

    const thinkingId = await runThinkingSteps(query);

    // Build history from existing assistant/user messages
    const history = messages
      .filter(m => m.type === 'user' || m.type === 'assistant')
      .map(m => ({ role: m.type as 'user' | 'assistant', content: m.content ?? '' }));

    const fullQuery = `${PRD_SYSTEM_PROMPT}\n\n---\n\nCurrent PRD stage: ${prd.activeStage}\n\nUser message: ${query}`;

    try {
      const data = await api.chat({ query: fullQuery, agent: 'docs', history });

      // Remove thinking card
      setMessages(prev => prev.filter(m => m.id !== thinkingId));

      // Show any tool call cards before response
      await showToolCalls(data.response);

      const assistantMsg: Msg = {
        id: `a${Date.now()}`,
        type: 'assistant',
        content: data.response,
        ts: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      updatePRD(query, data.response);

    } catch (e: unknown) {
      setMessages(prev => prev.filter(m => m.id !== thinkingId));
      const errMsg = e instanceof Error ? e.message : 'Connection error';
      setMessages(prev => [...prev, {
        id: `err${Date.now()}`,
        type: 'assistant',
        content: `**Error:** ${errMsg}\n\nMake sure the pmGPT backend is running at \`http://localhost:8000\`.`,
        ts: new Date(),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  // ── Export PRD ──────────────────────────────────────────────────────────────

  function exportPRD() {
    const lines: string[] = [`# ${prd.title}`, '', `Generated by PRD Copilot — pmGPT`, `Date: ${new Date().toLocaleDateString()}`, ''];
    STAGES.forEach(stage => {
      if (prd.sections[stage.id]) {
        lines.push(`## ${SECTION_LABELS[stage.id]}`);
        lines.push(prd.sections[stage.id] ?? '');
        lines.push('');
      }
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${prd.title.replace(/\s+/g, '-').toLowerCase()}.md`;
    a.click(); URL.revokeObjectURL(url);
  }

  const SECTION_LABELS_MAP: Record<StageId, string> = {
    problem: 'Problem Statement', research: 'User & Market Research', goals: 'Goals & Success Metrics',
    competitive: 'Competitive Analysis', scope: 'Scope Definition', requirements: 'Functional Requirements',
    risks: 'Risks & Dependencies', draft: 'Full PRD',
  };

  const activeStageLabel = STAGES.find(s => s.id === prd.activeStage)?.label ?? '';

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Chat area ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="h-[48px] bg-white border-b border-brand-line flex items-center px-5 gap-3 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-brand-accent flex items-center justify-center flex-shrink-0">
            <ClipboardList className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[13px] font-bold text-brand-ink">PRD Copilot</span>
            <span className="text-[11px] text-brand-ink-3 ml-2">— {activeStageLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[11px] text-brand-ink-3">Active</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-brand-canvas">

          {messages.length === 0 && (
            <div className="max-w-xl mx-auto pt-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-accent flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-brand-ink">PRD Copilot</h2>
                  <p className="text-[11px] text-brand-ink-3">Expert PM co-pilot for enterprise PRD creation</p>
                </div>
              </div>
              <p className="text-[13px] text-brand-ink-2 leading-relaxed mb-6">
                I'll guide you through building a comprehensive PRD — problem definition, research, goals, competitive analysis, scope, requirements, and risks — one stage at a time. I can invoke specialist agents for competitive research and user feedback synthesis.
              </p>
              <div className="grid grid-cols-1 gap-2 mb-6">
                {QUICK_PROMPTS.map(p => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="text-left bg-white border border-brand-line rounded-xl px-4 py-3 text-[12px] text-brand-ink-2 hover:border-brand-accent hover:text-brand-accent transition-colors flex items-center gap-2"
                  >
                    <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-brand-ink-4" />
                    {p}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-brand-ink-4">
                <Sparkles className="w-3 h-3" />
                <span>Can invoke Competitive Intel, Research Agent, and Analytics Intel automatically</span>
              </div>
            </div>
          )}

          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}

          {loading && messages.length > 0 && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-brand-sidebar flex items-center justify-center flex-shrink-0">
                <ClipboardList className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-white border border-brand-line rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-brand-accent animate-spin" />
                <span className="text-[12px] text-brand-ink-3">PRD Copilot is thinking…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-5 pb-4 pt-3 bg-white border-t border-brand-line flex-shrink-0">
          <div className="border border-brand-line rounded-xl flex items-end gap-2 px-4 py-3 focus-within:border-brand-accent transition-colors bg-white">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Describe the feature or product you want to build a PRD for…"
              className="flex-1 text-[13px] text-brand-ink placeholder-brand-ink-4 resize-none outline-none bg-transparent leading-relaxed"
              style={{ fieldSizing: 'content', maxHeight: '120px' } as React.CSSProperties}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
                input.trim() && !loading ? 'bg-brand-accent hover:bg-brand-accent-dim text-white' : 'bg-brand-canvas text-brand-ink-4 cursor-not-allowed',
              )}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-center text-[10px] text-brand-ink-4 mt-1.5">
            <kbd className="font-mono bg-brand-canvas px-1 rounded text-[9px] border border-brand-line">Enter</kbd> send ·&nbsp;
            <kbd className="font-mono bg-brand-canvas px-1 rounded text-[9px] border border-brand-line">Shift+Enter</kbd> new line
          </p>
        </div>
      </div>

      {/* ── Right panel ───────────────────────────────────────────────────── */}
      <div className="w-[300px] flex-shrink-0 border-l border-brand-line bg-white flex flex-col overflow-hidden">

        {/* Tabs */}
        <div className="flex border-b border-brand-line flex-shrink-0">
          {([
            { id: 'progress' as const, label: 'Progress', icon: ClipboardList },
            { id: 'doc'      as const, label: 'PRD Doc',  icon: FileText      },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => setRightTab(t.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-semibold transition-all border-b-2',
                rightTab === t.id ? 'border-brand-accent text-brand-accent' : 'border-transparent text-brand-ink-3 hover:text-brand-ink-2',
              )}
            >
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {rightTab === 'progress' && <StageTracker prd={prd} loading={loading} />}
        {rightTab === 'doc'      && <PRDDocPanel  prd={prd} onExport={exportPRD} />}
      </div>
    </div>
  );
}
