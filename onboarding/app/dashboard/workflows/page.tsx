'use client';
import { useState, useCallback } from 'react';
import type { WorkflowSummary, WorkflowPlanReview, WorkflowTemplate } from '@/lib/workflow-home-types';
import type { WFGraph } from '@/lib/workflow-types';
import { buildDemoWorkflow } from '@/lib/workflow-parser';
import { MOCK_WORKFLOW_SUMMARIES } from '@/lib/workflow-mock-data';
import { WorkflowsHome } from './components/WorkflowsHome';
import { NewWorkflowModal } from './components/NewWorkflowModal';
import { WorkflowEditorShell } from './components/WorkflowEditorShell';
import { AICopilot, AICopilotTrigger } from './components/AICopilot';

// ── View types ────────────────────────────────────────────────────────────────

type View = 'home' | 'editor';

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WorkflowsPage() {
  const [view, setView]                         = useState<View>('home');
  const [summaries, setSummaries]               = useState<WorkflowSummary[]>(MOCK_WORKFLOW_SUMMARIES);
  const [activeId, setActiveId]                 = useState<string | null>(null);
  const [activeGraph, setActiveGraph]           = useState<WFGraph>(buildDemoWorkflow());
  const [activeName, setActiveName]             = useState('');
  const [showNewModal, setShowNewModal]         = useState(false);
  const [copilotOpen, setCopilotOpen]           = useState(false);

  // ── Derived active summary ────────────────────────────────────────────────

  const activeSummary = summaries.find(s => s.id === activeId);

  // ── Navigation ────────────────────────────────────────────────────────────

  const openEditor = useCallback((id: string) => {
    const s = summaries.find(s => s.id === id);
    if (!s) return;
    // In production this would fetch the saved WFGraph from the backend.
    // For now we build a plausible graph from the workflow name.
    setActiveId(id);
    setActiveName(s.name);
    setActiveGraph(buildDemoWorkflow());
    setView('editor');
    setCopilotOpen(false);
  }, [summaries]);

  const openEditorWithGraph = useCallback((graph: WFGraph, name: string, id?: string) => {
    setActiveGraph(graph);
    setActiveName(name);
    setActiveId(id ?? null);
    setView('editor');
    setCopilotOpen(false);
  }, []);

  const handleBack = useCallback(() => {
    setView('home');
    setActiveId(null);
    setCopilotOpen(false);
  }, []);

  // ── New workflow creation paths ───────────────────────────────────────────

  const handleStartBlank = useCallback(() => {
    const blankGraph: WFGraph = {
      nodes: [{ id: 'trigger-1', type: 'trigger', label: 'Manual Trigger', position: { x: 260, y: 40 }, config: { type: 'manual' } }],
      edges: [],
    };
    setShowNewModal(false);
    openEditorWithGraph(blankGraph, 'Untitled Workflow');
  }, [openEditorWithGraph]);

  const handleStartTemplate = useCallback((tpl: WorkflowTemplate, graph: WFGraph) => {
    setShowNewModal(false);
    openEditorWithGraph(graph, tpl.name);
  }, [openEditorWithGraph]);

  const handleBuildWithAI = useCallback((graph: WFGraph, _plan: WorkflowPlanReview, name: string) => {
    setShowNewModal(false);
    openEditorWithGraph(graph, name);
  }, [openEditorWithGraph]);

  // ── Co-pilot workflow update (editor mode) ────────────────────────────────

  const handleCopilotUpdate = useCallback((graph: WFGraph, _plan: WorkflowPlanReview) => {
    setActiveGraph(graph);
  }, []);

  // ── Co-pilot create (home mode) ───────────────────────────────────────────

  const handleCopilotCreate = useCallback((graph: WFGraph, _plan: WorkflowPlanReview, name: string) => {
    openEditorWithGraph(graph, name);
  }, [openEditorWithGraph]);

  // ── Quick actions ─────────────────────────────────────────────────────────

  const handleRun = useCallback((id: string) => {
    openEditor(id);
    // Editor will auto-expand logs on mount (future: pass openLogs flag)
  }, [openEditor]);

  const handleDuplicate = useCallback((id: string) => {
    const src = summaries.find(s => s.id === id);
    if (!src) return;
    const clone: WorkflowSummary = {
      ...src,
      id: `wf-${Math.random().toString(36).slice(2, 8)}`,
      name: `${src.name} (copy)`,
      status: 'draft',
      totalRuns: 0,
      successRate: 0,
      lastRun: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSummaries(prev => [clone, ...prev]);
  }, [summaries]);

  const handlePause = useCallback((id: string) => {
    setSummaries(prev => prev.map(s => {
      if (s.id !== id) return s;
      return { ...s, status: s.status === 'paused' ? 'active' : 'paused', updatedAt: Date.now() };
    }));
  }, []);

  const handleViewLogs = useCallback((id: string) => {
    openEditor(id);
  }, [openEditor]);

  const handleSave = useCallback((graph: WFGraph, name: string) => {
    setActiveGraph(graph);
    setActiveName(name);
    if (activeId) {
      setSummaries(prev => prev.map(s =>
        s.id === activeId ? { ...s, name, updatedAt: Date.now() } : s
      ));
    }
  }, [activeId]);

  const handlePublish = useCallback(() => {
    if (!activeId) return;
    setSummaries(prev => prev.map(s =>
      s.id === activeId ? { ...s, status: 'active', updatedAt: Date.now() } : s
    ));
  }, [activeId]);

  const handlePauseFromEditor = useCallback(() => {
    if (!activeId) return;
    setSummaries(prev => prev.map(s =>
      s.id === activeId ? { ...s, status: 'paused', updatedAt: Date.now() } : s
    ));
  }, [activeId]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full relative">
      {view === 'home' && (
        <WorkflowsHome
          summaries={summaries}
          onNewWorkflow={() => setShowNewModal(true)}
          onEdit={openEditor}
          onRun={handleRun}
          onDuplicate={handleDuplicate}
          onPause={handlePause}
          onViewLogs={handleViewLogs}
        />
      )}

      {view === 'editor' && (
        <WorkflowEditorShell
          key={activeId ?? 'new'}
          initialGraph={activeGraph}
          workflowName={activeName}
          workflowStatus={activeSummary?.status ?? 'draft'}
          onBack={handleBack}
          onSave={handleSave}
          onPublish={handlePublish}
          onPause={handlePauseFromEditor}
        />
      )}

      {/* New workflow modal */}
      {showNewModal && (
        <NewWorkflowModal
          onClose={() => setShowNewModal(false)}
          onStartBlank={handleStartBlank}
          onStartTemplate={handleStartTemplate}
          onBuildWithAI={handleBuildWithAI}
          graphContext={view === 'editor' ? activeGraph : null}
          contextLabel={view === 'editor' ? activeName : undefined}
        />
      )}

      {/* Persistent AI co-pilot */}
      <AICopilotTrigger
        onClick={() => setCopilotOpen(v => !v)}
        isOpen={copilotOpen}
      />
      <AICopilot
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        mode={view === 'editor' ? 'editor' : 'home'}
        graphContext={view === 'editor' ? activeGraph : null}
        workflowName={view === 'editor' ? activeName : undefined}
        onCreateWorkflow={handleCopilotCreate}
        onUpdateWorkflow={handleCopilotUpdate}
      />
    </div>
  );
}
