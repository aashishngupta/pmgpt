'use client';
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  X, Sparkles, FileText, Puzzle, MessageSquare, ArrowLeft,
  Loader2, ChevronRight, CheckCircle2, AlertCircle, Zap, Clock,
  Search, Tag,
} from 'lucide-react';
import type {
  WorkflowPlanReview, WorkflowTemplate, DependencyCheck, ClarifyingQuestion,
} from '@/lib/workflow-home-types';
import type { WFGraph } from '@/lib/workflow-types';
import { parseNLWorkflow, derivePlanReview } from '@/lib/workflow-parser';
import { WORKFLOW_TEMPLATES } from '@/lib/workflow-mock-data';

// ── Workspace context used for prompt enhancement ──────────────────────────────
// In production this comes from the user's workspace settings.

const WORKSPACE_CONTEXT = {
  connectors: ['Jira', 'GitHub', 'Amplitude', 'Notion', 'Slack'],
  agents: ['Engineering Agent', 'Analytics Agent', 'Docs Writer', 'Sprint Planner', 'Prioritization Agent', 'Release Manager', 'Competitive Intel'],
  slackChannels: ['#product-incidents', '#product-team', '#eng-alerts', '#pm-updates'],
  notionSpaces: ['Engineering Incidents', 'Product Specs', 'Sprint Boards'],
};

function enhancePrompt(raw: string): string {
  let enhanced = raw.trim();

  // Infer connector from context
  if (/slack|notify|send message/i.test(enhanced) && !/channel/i.test(enhanced)) {
    enhanced += ` via the Slack connector to ${WORKSPACE_CONTEXT.slackChannels[0]}`;
  }
  if (/notion|document|doc|page/i.test(enhanced) && !/space|workspace/i.test(enhanced)) {
    enhanced += ` in the ${WORKSPACE_CONTEXT.notionSpaces[0]} Notion space`;
  }
  if (/jira/i.test(enhanced) && !/connector|webhook/i.test(enhanced)) {
    enhanced = enhanced.replace(/jira/gi, 'Jira (via Jira connector)');
  }
  if (/analyze|analysis|rca|root.?cause/i.test(enhanced) && !/agent/i.test(enhanced)) {
    enhanced += `, using the Engineering Agent for analysis`;
  }
  if (/metric|drop|amplitude/i.test(enhanced) && !/agent/i.test(enhanced)) {
    enhanced += `, using the Analytics Agent to interpret the data`;
  }
  if (/prioriti/i.test(enhanced) && !/agent/i.test(enhanced)) {
    enhanced += `, using the Prioritization Agent to rank items by impact and effort`;
  }
  if (/sprint|retro/i.test(enhanced) && !/agent/i.test(enhanced)) {
    enhanced += `, using the Sprint Planner agent to generate the summary`;
  }
  if (/approval|review|pm.*check|sign.?off/i.test(enhanced) && !/approval gate/i.test(enhanced)) {
    enhanced += ` — require PM Lead approval before any write actions`;
  }

  return enhanced.charAt(0).toUpperCase() + enhanced.slice(1);
}

// ── Dependency check item ─────────────────────────────────────────────────────

function DepItem({ dep }: { dep: DependencyCheck }) {
  const icon = dep.status === 'available'
    ? <CheckCircle2 className="w-3.5 h-3.5 text-brand-green flex-shrink-0" />
    : dep.status === 'unconfigured'
      ? <AlertCircle className="w-3.5 h-3.5 text-brand-amber flex-shrink-0" />
      : <AlertCircle className="w-3.5 h-3.5 text-brand-red flex-shrink-0" />;

  return (
    <div className="flex items-center gap-2 py-1.5">
      {icon}
      <span className="text-[12px] text-brand-ink flex-1">{dep.name}</span>
      {dep.status !== 'available' && dep.actionLabel && (
        <button className="text-[10px] text-brand-accent font-medium hover:underline">{dep.actionLabel}</button>
      )}
    </div>
  );
}

// ── Plan section card ─────────────────────────────────────────────────────────

function PlanCard({ label, value, confidence }: { label: string; value: string; confidence: string }) {
  const conf = confidence === 'high' ? 'text-brand-green' : confidence === 'medium' ? 'text-brand-amber' : 'text-brand-red';
  return (
    <div className="bg-brand-canvas rounded-lg border border-brand-line px-3 py-2.5 mb-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-bold uppercase tracking-widest text-brand-ink-3">{label}</span>
        <span className={cn('text-[9px] font-semibold uppercase tracking-widest', conf)}>{confidence}</span>
      </div>
      <p className="text-[12px] text-brand-ink leading-relaxed">{value}</p>
    </div>
  );
}

// ── Plan Review Step ──────────────────────────────────────────────────────────

interface PlanReviewProps {
  plan: WorkflowPlanReview;
  onConfirm: () => void;
  onBack: () => void;
  onAnswerQuestion: (qId: string, answer: string) => void;
}

function PlanReviewStep({ plan, onConfirm, onBack, onAnswerQuestion }: PlanReviewProps) {
  const connDeps  = plan.dependencies.filter(d => d.type === 'connector');
  const agentDeps = plan.dependencies.filter(d => d.type === 'agent');
  const blockers  = plan.clarifyingQuestions.filter(q => q.required && !q.answer);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-brand-line flex-shrink-0">
        <button onClick={onBack} className="p-1.5 rounded-lg text-brand-ink-3 hover:bg-brand-elevated transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="text-[14px] font-bold text-brand-ink">Plan Review</p>
          <p className="text-[11px] text-brand-ink-3">Review what the system parsed before generating the canvas</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-[1fr_280px] gap-0 h-full">
          {/* Left: plan sections */}
          <div className="px-6 py-4 overflow-y-auto border-r border-brand-line">
            <PlanCard label="Trigger" value={plan.trigger.value} confidence={plan.trigger.confidence} />

            {plan.dataSources.length > 0 && (
              <div className="mb-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-brand-ink-3 mb-1.5">Data Sources</p>
                {plan.dataSources.map((s, i) => <PlanCard key={i} label={s.label} value={s.value} confidence={s.confidence} />)}
              </div>
            )}
            {plan.conditions.length > 0 && (
              <div className="mb-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-brand-ink-3 mb-1.5">Conditions</p>
                {plan.conditions.map((s, i) => <PlanCard key={i} label={s.label} value={s.value} confidence={s.confidence} />)}
              </div>
            )}
            {plan.agentSteps.length > 0 && (
              <div className="mb-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-brand-ink-3 mb-1.5">Agent Steps</p>
                {plan.agentSteps.map((s, i) => <PlanCard key={i} label={s.label} value={s.value} confidence={s.confidence} />)}
              </div>
            )}
            {plan.actions.length > 0 && (
              <div className="mb-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-brand-ink-3 mb-1.5">Actions</p>
                {plan.actions.map((s, i) => <PlanCard key={i} label={s.label} value={s.value} confidence={s.confidence} />)}
              </div>
            )}
            {plan.outputs.length > 0 && (
              <div className="mb-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-brand-ink-3 mb-1.5">Outputs</p>
                {plan.outputs.map((s, i) => <PlanCard key={i} label={s.label} value={s.value} confidence={s.confidence} />)}
              </div>
            )}

            {/* Clarifying questions */}
            {plan.clarifyingQuestions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-brand-line">
                <p className="text-[9px] font-bold uppercase tracking-widest text-brand-ink-3 mb-3">
                  Clarifying Questions
                  {blockers.length > 0 && (
                    <span className="ml-2 text-brand-amber normal-case tracking-normal font-medium">({blockers.length} required)</span>
                  )}
                </p>
                {plan.clarifyingQuestions.map(q => (
                  <div key={q.id} className="mb-3">
                    <p className="text-[12px] text-brand-ink font-medium mb-1.5">
                      {q.question}
                      {q.required && <span className="text-brand-red ml-1">*</span>}
                    </p>
                    {q.inputType === 'select' && q.options ? (
                      <select
                        value={q.answer ?? ''}
                        onChange={e => onAnswerQuestion(q.id, e.target.value)}
                        className="w-full text-[12px] text-brand-ink bg-brand-canvas border border-brand-line rounded-lg px-3 py-2 outline-none focus:border-brand-accent transition-colors"
                      >
                        <option value="">Select an option…</option>
                        {q.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : q.inputType === 'yesno' ? (
                      <div className="flex gap-2">
                        {['Yes', 'No'].map(opt => (
                          <button
                            key={opt}
                            onClick={() => onAnswerQuestion(q.id, opt)}
                            className={cn(
                              'px-4 py-1.5 rounded-lg text-[12px] font-medium border transition-colors',
                              q.answer === opt
                                ? 'border-brand-accent bg-brand-accent-bg text-brand-accent'
                                : 'border-brand-line text-brand-ink hover:bg-brand-elevated',
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input
                        value={q.answer ?? ''}
                        onChange={e => onAnswerQuestion(q.id, e.target.value)}
                        placeholder="Your answer…"
                        className="w-full text-[12px] text-brand-ink bg-brand-canvas border border-brand-line rounded-lg px-3 py-2 outline-none focus:border-brand-accent transition-colors placeholder-brand-ink-4"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: deps + assumptions */}
          <div className="px-4 py-4 overflow-y-auto bg-brand-canvas">
            {connDeps.length > 0 && (
              <div className="mb-4">
                <p className="text-[9px] font-bold uppercase tracking-widest text-brand-ink-3 mb-2">Required Connectors</p>
                {connDeps.map(d => <DepItem key={d.id} dep={d} />)}
              </div>
            )}
            {agentDeps.length > 0 && (
              <div className="mb-4">
                <p className="text-[9px] font-bold uppercase tracking-widest text-brand-ink-3 mb-2">Required Agents</p>
                {agentDeps.map(d => <DepItem key={d.id} dep={d} />)}
              </div>
            )}
            {plan.assumptions.length > 0 && (
              <div className="mb-4">
                <p className="text-[9px] font-bold uppercase tracking-widest text-brand-ink-3 mb-2">Assumptions</p>
                {plan.assumptions.map((a, i) => (
                  <p key={i} className="text-[11px] text-brand-ink-3 leading-relaxed mb-1.5 flex gap-1.5">
                    <span className="mt-0.5 flex-shrink-0">·</span>{a}
                  </p>
                ))}
              </div>
            )}
            {plan.missingDetails.length > 0 && (
              <div className="mb-4">
                <p className="text-[9px] font-bold uppercase tracking-widest text-brand-amber mb-2">Missing Details</p>
                {plan.missingDetails.map((m, i) => (
                  <div key={i} className="flex gap-1.5 mb-1.5">
                    <AlertCircle className="w-3 h-3 text-brand-amber flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-brand-amber leading-relaxed">{m}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-brand-line flex-shrink-0 bg-brand-surface">
        <button onClick={onBack} className="text-[13px] text-brand-ink-3 hover:text-brand-ink transition-colors">
          Edit prompt
        </button>
        <button
          onClick={onConfirm}
          disabled={blockers.length > 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-accent text-white text-[13px] font-semibold rounded-xl hover:bg-brand-accent-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-4 h-4" />
          Generate Workflow
        </button>
      </div>
    </div>
  );
}

// ── Build with AI wizard ──────────────────────────────────────────────────────

const SAMPLE_CHIPS = [
  'When a Jira ticket has more than 20 comments, run RCA and notify PM via Slack',
  'Every Monday, summarise sprint progress and post to Confluence',
  'When activation rate drops 10%, analyze and alert the team on Slack',
  'When an epic is created, draft a PRD and route for PM approval',
  'Before each deployment, run a go/no-go check and notify stakeholders',
];

interface AIWizardProps {
  onBack: () => void;
  onConfirm: (graph: WFGraph, plan: WorkflowPlanReview, name: string) => void;
  graphContext?: WFGraph | null;
  contextLabel?: string;
}

function BuildWithAIWizard({ onBack, onConfirm, graphContext, contextLabel }: AIWizardProps) {
  const [step, setStep]         = useState<'prompt' | 'review'>('prompt');
  const [prompt, setPrompt]     = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isParsing, setIsParsing]     = useState(false);
  const [plan, setPlan]         = useState<WorkflowPlanReview | null>(null);
  const [graph, setGraph]       = useState<WFGraph | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const handleEnhance = () => {
    if (!prompt.trim() || isEnhancing) return;
    setIsEnhancing(true);
    setTimeout(() => {
      const enhanced = enhancePrompt(prompt);
      setPrompt(enhanced);
      setIsEnhancing(false);
      taRef.current?.focus();
    }, 700);
  };

  const handleAnalyze = () => {
    if (!prompt.trim() || isParsing) return;
    setIsParsing(true);
    setTimeout(() => {
      const g = parseNLWorkflow(prompt);
      const p = derivePlanReview(g, prompt);
      setGraph(g);
      setPlan(p);
      setIsParsing(false);
      setStep('review');
    }, 500);
  };

  const handleAnswerQuestion = (qId: string, answer: string) => {
    if (!plan) return;
    setPlan({
      ...plan,
      clarifyingQuestions: plan.clarifyingQuestions.map(q =>
        q.id === qId ? { ...q, answer } : q
      ),
    });
  };

  const handleConfirm = () => {
    if (!graph || !plan) return;
    const name = prompt.length > 40 ? prompt.slice(0, 40).trim() + '…' : prompt;
    onConfirm(graph, plan, name);
  };

  if (step === 'review' && plan && graph) {
    return (
      <PlanReviewStep
        plan={plan}
        onConfirm={handleConfirm}
        onBack={() => setStep('prompt')}
        onAnswerQuestion={handleAnswerQuestion}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-brand-line flex-shrink-0">
        <button onClick={onBack} className="p-1.5 rounded-lg text-brand-ink-3 hover:bg-brand-elevated transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="text-[14px] font-bold text-brand-ink">Build with AI</p>
          <p className="text-[11px] text-brand-ink-3">
            {contextLabel ? `Editing: ${contextLabel}` : 'Describe your workflow in plain English'}
          </p>
        </div>
      </div>

      <div className="flex-1 px-6 py-6 overflow-y-auto">
        {contextLabel && (
          <div className="flex items-center gap-2 px-3 py-2 mb-4 bg-brand-accent-bg border border-brand-accent/20 rounded-lg">
            <Sparkles className="w-3.5 h-3.5 text-brand-accent flex-shrink-0" />
            <p className="text-[11px] text-brand-accent">Co-pilot has context of the current workflow canvas</p>
          </div>
        )}

        <p className="text-[12px] text-brand-ink-3 mb-2">Describe what you want this workflow to do</p>
        <textarea
          ref={taRef}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAnalyze(); }}
          placeholder="e.g. When a Jira ticket gets more than 20 comments, analyze it with the RCA agent and notify the PM via Slack…"
          rows={5}
          className="w-full text-[13px] text-brand-ink bg-brand-canvas border border-brand-line rounded-xl px-4 py-3 outline-none focus:border-brand-accent transition-colors placeholder-brand-ink-4 resize-none leading-relaxed"
        />

        <div className="flex items-center justify-between mt-2 mb-5">
          <p className="text-[11px] text-brand-ink-3">⌘ + Enter to analyze</p>
          <button
            onClick={handleEnhance}
            disabled={!prompt.trim() || isEnhancing}
            className="flex items-center gap-1.5 text-[11px] text-brand-accent font-medium hover:underline disabled:opacity-40 transition-opacity"
          >
            {isEnhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {isEnhancing ? 'Enhancing…' : 'Enhance prompt'}
          </button>
        </div>

        <p className="text-[11px] text-brand-ink-3 mb-3">Try these examples</p>
        <div className="flex flex-col gap-2">
          {SAMPLE_CHIPS.map(chip => (
            <button
              key={chip}
              onClick={() => setPrompt(chip)}
              className="flex items-center gap-2 text-left px-3 py-2 rounded-lg border border-brand-line bg-brand-canvas hover:bg-brand-elevated hover:border-brand-accent/30 transition-colors group"
            >
              <ChevronRight className="w-3 h-3 text-brand-ink-3 group-hover:text-brand-accent flex-shrink-0 transition-colors" />
              <span className="text-[12px] text-brand-ink">{chip}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-line flex-shrink-0 bg-brand-surface">
        <button onClick={onBack} className="text-[13px] text-brand-ink-3 hover:text-brand-ink transition-colors">Cancel</button>
        <button
          onClick={handleAnalyze}
          disabled={!prompt.trim() || isParsing}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-accent text-white text-[13px] font-semibold rounded-xl hover:bg-brand-accent-dim transition-colors disabled:opacity-50"
        >
          {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {isParsing ? 'Analyzing…' : 'Analyze'}
        </button>
      </div>
    </div>
  );
}

// ── Template gallery ──────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  'Incident Response': 'bg-brand-red-bg    text-brand-red    border-brand-red/20',
  'Sprint & Planning': 'bg-brand-accent-bg text-brand-accent border-brand-accent/20',
  'Analytics':         'bg-brand-amber-bg  text-brand-amber  border-brand-amber/20',
  'Product':           'bg-brand-green-bg  text-brand-green  border-brand-green/20',
  'Competitive':       'bg-brand-elevated  text-brand-ink-3  border-brand-line',
  'Customer':          'bg-brand-amber-bg  text-brand-amber  border-brand-amber/20',
  'Release':           'bg-brand-green-bg  text-brand-green  border-brand-green/20',
};

interface TemplateGalleryProps {
  onBack: () => void;
  onSelect: (tpl: WorkflowTemplate, graph: WFGraph) => void;
}

function TemplateGallery({ onBack, onSelect }: TemplateGalleryProps) {
  const [search, setSearch] = useState('');

  const filtered = WORKFLOW_TEMPLATES.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase()) ||
    t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-brand-line flex-shrink-0">
        <button onClick={onBack} className="p-1.5 rounded-lg text-brand-ink-3 hover:bg-brand-elevated transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <p className="text-[14px] font-bold text-brand-ink">Start from Template</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-brand-line bg-brand-canvas focus-within:border-brand-accent transition-colors">
          <Search className="w-3.5 h-3.5 text-brand-ink-3" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search templates…"
            className="text-[12px] text-brand-ink bg-transparent outline-none placeholder-brand-ink-4 w-40"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(tpl => {
            const TrigIcon = tpl.trigger.type === 'schedule' ? Clock : Zap;
            const catCls = CAT_COLORS[tpl.category] ?? 'bg-brand-elevated text-brand-ink-3 border-brand-line';
            return (
              <button
                key={tpl.id}
                onClick={() => onSelect(tpl, parseNLWorkflow(tpl.nlPrompt))}
                className="text-left p-4 rounded-xl border border-brand-line bg-brand-surface hover:border-brand-accent/40 hover:bg-brand-elevated transition-colors group"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-[13px] font-semibold text-brand-ink group-hover:text-brand-accent transition-colors">{tpl.name}</p>
                  <span className={cn('text-[9px] font-semibold px-2 py-0.5 rounded-full border ml-2 flex-shrink-0', catCls)}>
                    {tpl.category}
                  </span>
                </div>
                <p className="text-[11px] text-brand-ink-3 leading-relaxed mb-3">{tpl.description}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 text-[10px] text-brand-ink bg-brand-canvas px-2 py-0.5 rounded border border-brand-line">
                    <TrigIcon className="w-3 h-3 text-brand-ink-3" />{tpl.trigger.label}
                  </span>
                  {tpl.connectors.slice(0, 2).map(c => (
                    <span key={c.connectorId} className="text-[10px] text-brand-ink bg-brand-canvas px-2 py-0.5 rounded border border-brand-line">{c.label}</span>
                  ))}
                  {tpl.connectors.length > 2 && (
                    <span className="text-[10px] text-brand-ink-3">+{tpl.connectors.length - 2}</span>
                  )}
                  <span className="ml-auto text-[10px] text-brand-ink-3">{tpl.estimatedNodes} steps</span>
                </div>
              </button>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[13px] text-brand-ink-3">No templates match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

type ModalStep = 'pick' | 'ai' | 'template';

interface CreationOption {
  key: 'ai' | 'template' | 'blank' | 'import';
  icon: React.ElementType;
  label: string;
  description: string;
  primary?: boolean;
}

const OPTIONS: CreationOption[] = [
  { key: 'ai',       icon: Sparkles,       label: 'Build with AI',       description: 'Describe your workflow in plain English — the co-pilot will build it for you.', primary: true },
  { key: 'template', icon: Puzzle,         label: 'Start from Template', description: 'Pick a pre-built workflow pattern and customise it to your needs.'                },
  { key: 'blank',    icon: FileText,       label: 'Start Blank',         description: 'Open an empty canvas and drag nodes onto it manually.'                             },
  { key: 'import',   icon: MessageSquare,  label: 'Import from Chat',    description: 'Pull a workflow that was described in a chat thread.'                              },
];

interface Props {
  onClose: () => void;
  onStartBlank: () => void;
  onStartTemplate: (tpl: WorkflowTemplate, graph: WFGraph) => void;
  onBuildWithAI: (graph: WFGraph, plan: WorkflowPlanReview, name: string) => void;
  graphContext?: WFGraph | null;
  contextLabel?: string;
}

export function NewWorkflowModal({
  onClose, onStartBlank, onStartTemplate, onBuildWithAI, graphContext, contextLabel,
}: Props) {
  const [step, setStep] = useState<ModalStep>('pick');

  const handleOptionClick = (key: CreationOption['key']) => {
    if (key === 'blank')  { onStartBlank(); return; }
    if (key === 'import') { return; } // placeholder
    setStep(key as ModalStep);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-brand-surface rounded-2xl border border-brand-line shadow-2xl w-[760px] max-h-[86vh] flex flex-col overflow-hidden">

        {/* Modal header — only shown on pick step */}
        {step === 'pick' && (
          <div className="flex items-center justify-between px-6 py-5 border-b border-brand-line flex-shrink-0">
            <div>
              <p className="text-[16px] font-bold text-brand-ink">New Workflow</p>
              <p className="text-[12px] text-brand-ink-3 mt-0.5">Choose how you want to create this workflow</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-brand-ink-3 hover:bg-brand-elevated transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Close button for sub-steps */}
        {step !== 'pick' && (
          <div className="absolute top-4 right-4 z-10">
            <button onClick={onClose} className="p-1.5 rounded-lg text-brand-ink-3 hover:bg-brand-elevated transition-colors bg-brand-surface border border-brand-line">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden relative">
          {step === 'pick' && (
            <div className="p-6 grid grid-cols-2 gap-3">
              {OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => handleOptionClick(opt.key)}
                  className={cn(
                    'text-left p-5 rounded-xl border transition-colors group',
                    opt.primary
                      ? 'border-brand-accent/40 bg-brand-accent-bg hover:bg-brand-accent/10 col-span-2'
                      : 'border-brand-line bg-brand-canvas hover:bg-brand-elevated hover:border-brand-accent/30',
                    opt.key === 'import' && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      opt.primary ? 'bg-brand-accent text-white' : 'bg-brand-elevated text-brand-ink-3',
                    )}>
                      <opt.icon className="w-4 h-4" />
                    </div>
                    <p className={cn(
                      'text-[14px] font-semibold',
                      opt.primary ? 'text-brand-accent' : 'text-brand-ink group-hover:text-brand-accent',
                    )}>
                      {opt.label}
                    </p>
                    {opt.key === 'import' && (
                      <span className="ml-auto text-[9px] text-brand-ink-3 border border-brand-line px-2 py-0.5 rounded-full">Coming soon</span>
                    )}
                  </div>
                  <p className="text-[12px] text-brand-ink-3 leading-relaxed">{opt.description}</p>
                </button>
              ))}
            </div>
          )}

          {step === 'ai' && (
            <BuildWithAIWizard
              onBack={() => setStep('pick')}
              onConfirm={onBuildWithAI}
              graphContext={graphContext}
              contextLabel={contextLabel}
            />
          )}

          {step === 'template' && (
            <TemplateGallery
              onBack={() => setStep('pick')}
              onSelect={onStartTemplate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
