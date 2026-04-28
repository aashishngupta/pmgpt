'use client';
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  Sparkles, X, Loader2, ArrowLeft, Send, ChevronRight,
} from 'lucide-react';
import type { WorkflowPlanReview } from '@/lib/workflow-home-types';
import type { WFGraph } from '@/lib/workflow-types';
import { parseNLWorkflow, derivePlanReview } from '@/lib/workflow-parser';

// ── Prompt enhancement ────────────────────────────────────────────────────────
// Uses workspace context to rewrite vague PM language into precise operations.

const WORKSPACE_CONTEXT = {
  connectors: ['Jira', 'GitHub', 'Amplitude', 'Notion', 'Slack'],
  slackChannels: ['#product-incidents', '#product-team', '#eng-alerts'],
};

function enhancePrompt(raw: string, graphContext?: WFGraph | null): string {
  let enhanced = raw.trim();

  if (/slack|notify|send message/i.test(enhanced) && !/channel/i.test(enhanced)) {
    enhanced += ` via the Slack connector to ${WORKSPACE_CONTEXT.slackChannels[0]}`;
  }
  if (/notion|document|doc|page/i.test(enhanced) && !/space|workspace/i.test(enhanced)) {
    enhanced += ' in the Engineering Incidents Notion space';
  }
  if (/analyze|analysis|rca|root.?cause/i.test(enhanced) && !/agent/i.test(enhanced)) {
    enhanced += ', using the Engineering Agent for analysis';
  }
  if (/metric|drop|amplitude/i.test(enhanced) && !/agent/i.test(enhanced)) {
    enhanced += ', using the Analytics Agent to interpret the data';
  }
  if (/prioriti/i.test(enhanced) && !/agent/i.test(enhanced)) {
    enhanced += ', using the Prioritization Agent to rank items by impact and effort';
  }
  if (/approval|review|pm.*check|sign.?off/i.test(enhanced) && !/approval gate/i.test(enhanced)) {
    enhanced += ' — require PM Lead approval before any write actions';
  }

  // If editing an existing graph, prefix with context
  if (graphContext && graphContext.nodes.length > 0) {
    const triggerNode = graphContext.nodes.find(n => n.type === 'trigger');
    if (triggerNode) {
      enhanced = `For the existing workflow triggered by "${triggerNode.label}": ${enhanced}`;
    }
  }

  return enhanced.charAt(0).toUpperCase() + enhanced.slice(1);
}

// ── Quick action chips ────────────────────────────────────────────────────────

const HOME_CHIPS = [
  'Create a Jira comment alert workflow',
  'Build a weekly sprint summary',
  'Set up a metric drop alert',
  'Automate PRD creation from epics',
];

const EDITOR_CHIPS = [
  'Add a Slack notification at the end',
  'Add a PM approval gate before actions',
  'Add an analytics agent step',
  'Change the trigger to a schedule',
];

// ── Co-pilot panel ────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: 'home' | 'editor';
  graphContext?: WFGraph | null;
  workflowName?: string;
  onCreateWorkflow: (graph: WFGraph, plan: WorkflowPlanReview, name: string) => void;
  onUpdateWorkflow: (graph: WFGraph, plan: WorkflowPlanReview) => void;
}

type PanelStep = 'prompt' | 'review';

export function AICopilot({
  isOpen, onClose, mode, graphContext, workflowName, onCreateWorkflow, onUpdateWorkflow,
}: Props) {
  const [step, setStep]             = useState<PanelStep>('prompt');
  const [prompt, setPrompt]         = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isParsing, setIsParsing]   = useState(false);
  const [plan, setPlan]             = useState<WorkflowPlanReview | null>(null);
  const [graph, setGraph]           = useState<WFGraph | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const chips = mode === 'editor' ? EDITOR_CHIPS : HOME_CHIPS;

  const handleEnhance = () => {
    if (!prompt.trim() || isEnhancing) return;
    setIsEnhancing(true);
    setTimeout(() => {
      setPrompt(enhancePrompt(prompt, graphContext));
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

  const handleConfirm = () => {
    if (!graph || !plan) return;
    if (mode === 'editor') {
      onUpdateWorkflow(graph, plan);
    } else {
      const name = prompt.length > 40 ? prompt.slice(0, 40).trim() + '…' : prompt;
      onCreateWorkflow(graph, plan, name);
    }
    setStep('prompt');
    setPrompt('');
    setPlan(null);
    setGraph(null);
    onClose();
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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-[48px] bottom-0 z-50 w-[380px] bg-brand-surface border-l border-brand-line shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-brand-line flex-shrink-0">
          <div className="flex items-center gap-2">
            {step === 'review' && (
              <button onClick={() => setStep('prompt')} className="p-1 rounded-lg text-brand-ink-3 hover:bg-brand-elevated transition-colors mr-1">
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="w-6 h-6 rounded-lg bg-brand-accent flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-brand-ink">
                {step === 'review' ? 'Plan Review' : 'AI Co-pilot'}
              </p>
              {mode === 'editor' && workflowName && step === 'prompt' && (
                <p className="text-[10px] text-brand-ink-3">Editing: {workflowName}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-ink-3 hover:bg-brand-elevated transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Prompt step */}
        {step === 'prompt' && (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {mode === 'editor' && (
                <div className="flex items-center gap-2 px-3 py-2 mb-4 bg-brand-accent-bg border border-brand-accent/20 rounded-lg">
                  <Sparkles className="w-3 h-3 text-brand-accent flex-shrink-0" />
                  <p className="text-[11px] text-brand-accent leading-snug">
                    Co-pilot sees the current canvas and will apply changes to the existing workflow.
                  </p>
                </div>
              )}

              <textarea
                ref={taRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAnalyze(); }}
                placeholder={mode === 'editor'
                  ? 'Describe what you want to add or change…'
                  : 'Describe what you want this workflow to do…'
                }
                rows={4}
                className="w-full text-[13px] text-brand-ink bg-brand-canvas border border-brand-line rounded-xl px-3 py-2.5 outline-none focus:border-brand-accent transition-colors placeholder-brand-ink-4 resize-none leading-relaxed"
              />

              <div className="flex items-center justify-between mt-2 mb-5">
                <p className="text-[10px] text-brand-ink-3">⌘ + Enter to analyze</p>
                <button
                  onClick={handleEnhance}
                  disabled={!prompt.trim() || isEnhancing}
                  className="flex items-center gap-1 text-[11px] text-brand-accent font-medium hover:underline disabled:opacity-40 transition-opacity"
                >
                  {isEnhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {isEnhancing ? 'Enhancing…' : 'Enhance prompt'}
                </button>
              </div>

              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-ink-3 mb-2">Quick actions</p>
              <div className="flex flex-col gap-1.5">
                {chips.map(chip => (
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

            <div className="flex items-center gap-2 px-4 py-3 border-t border-brand-line flex-shrink-0">
              <button
                onClick={handleAnalyze}
                disabled={!prompt.trim() || isParsing}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand-accent text-white text-[13px] font-semibold rounded-xl hover:bg-brand-accent-dim transition-colors disabled:opacity-50"
              >
                {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isParsing ? 'Analyzing…' : mode === 'editor' ? 'Apply Changes' : 'Analyze'}
              </button>
            </div>
          </>
        )}

        {/* Review step */}
        {step === 'review' && plan && (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {/* Trigger */}
              <div className="bg-brand-canvas rounded-lg border border-brand-line px-3 py-2.5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-brand-ink-3 mb-1">Trigger</p>
                <p className="text-[12px] text-brand-ink">{plan.trigger.value}</p>
              </div>

              {plan.dataSources.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-brand-ink-3 mb-1.5">Data Sources</p>
                  {plan.dataSources.map((s, i) => (
                    <div key={i} className="bg-brand-canvas rounded-lg border border-brand-line px-3 py-2 mb-1.5">
                      <p className="text-[11px] font-medium text-brand-ink">{s.label}</p>
                      <p className="text-[10px] text-brand-ink-3">{s.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {plan.agentSteps.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-brand-ink-3 mb-1.5">Agent Steps</p>
                  {plan.agentSteps.map((s, i) => (
                    <div key={i} className="bg-brand-accent-bg border border-brand-accent/20 rounded-lg px-3 py-2 mb-1.5">
                      <p className="text-[11px] font-semibold text-brand-accent">{s.label}</p>
                      <p className="text-[10px] text-brand-ink mt-0.5 line-clamp-2">{s.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {plan.outputs.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-brand-ink-3 mb-1.5">Outputs</p>
                  {plan.outputs.map((s, i) => (
                    <div key={i} className="bg-brand-canvas rounded-lg border border-brand-line px-3 py-2 mb-1.5">
                      <p className="text-[11px] text-brand-ink">{s.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {plan.missingDetails.length > 0 && (
                <div className="bg-brand-amber-bg border border-brand-amber/20 rounded-lg px-3 py-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-brand-amber mb-1.5">Missing Details</p>
                  {plan.missingDetails.map((m, i) => (
                    <p key={i} className="text-[11px] text-brand-amber">{m}</p>
                  ))}
                </div>
              )}

              {plan.clarifyingQuestions.map(q => (
                <div key={q.id} className="bg-brand-canvas rounded-lg border border-brand-line px-3 py-2.5">
                  <p className="text-[11px] text-brand-ink font-medium mb-1.5">{q.question}</p>
                  {q.inputType === 'select' && q.options ? (
                    <select
                      value={q.answer ?? ''}
                      onChange={e => handleAnswerQuestion(q.id, e.target.value)}
                      className="w-full text-[11px] text-brand-ink bg-brand-elevated border border-brand-line rounded-lg px-2.5 py-1.5 outline-none focus:border-brand-accent"
                    >
                      <option value="">Select…</option>
                      {q.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      value={q.answer ?? ''}
                      onChange={e => handleAnswerQuestion(q.id, e.target.value)}
                      className="w-full text-[11px] text-brand-ink bg-brand-elevated border border-brand-line rounded-lg px-2.5 py-1.5 outline-none focus:border-brand-accent"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 px-4 py-3 border-t border-brand-line flex-shrink-0">
              <button
                onClick={handleConfirm}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand-accent text-white text-[13px] font-semibold rounded-xl hover:bg-brand-accent-dim transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                {mode === 'editor' ? 'Apply to Canvas' : 'Generate Workflow'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ── Trigger button ────────────────────────────────────────────────────────────

interface TriggerProps {
  onClick: () => void;
  isOpen: boolean;
}

export function AICopilotTrigger({ onClick, isOpen }: TriggerProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg border transition-all',
        isOpen
          ? 'bg-brand-accent text-white border-brand-accent shadow-brand-accent/20'
          : 'bg-brand-surface text-brand-ink border-brand-line hover:border-brand-accent/40 hover:bg-brand-elevated',
      )}
    >
      <Sparkles className="w-4 h-4" />
      <span className="text-[13px] font-semibold">AI Co-pilot</span>
    </button>
  );
}
