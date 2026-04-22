'use client';

import { useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
  MarkerType,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { cn } from '@/lib/utils';
import {
  Plus, Play, Pause, Settings2, Zap, Calendar, Webhook,
  ChevronRight, X, Check, Clock, RefreshCw, CheckCircle2,
  AlertTriangle, Trash2, Copy, Target, FileText, BarChart2,
  Search, Layers, GitPullRequest, Terminal, Trophy, TrendingUp,
  GraduationCap, Mail, Database, Globe, MessageSquare,
  ArrowLeft, Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ── Brand colours (inline — no violet) ───────────────────────────────────────
const B = {
  accent: '#3B82F6',
  accentBg: '#EFF6FF',
  surface: '#FFFFFF',
  canvas: '#F7F8FA',
  line: '#E2E8F0',
  ink: '#0F172A',
  ink2: '#475569',
  ink3: '#94A3B8',
  ink4: '#CBD5E1',
  green: '#10B981',
  greenBg: '#ECFDF5',
  amber: '#D97706',
  amberBg: '#FFFBEB',
  red: '#EF4444',
  redBg: '#FEF2F2',
};

// ── Static data ───────────────────────────────────────────────────────────────

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

const AGENT_COLORS: Record<string, string> = {
  strategy:    '#3B82F6',
  docs:        '#8B5CF6',
  analytics:   '#10B981',
  research:    '#F59E0B',
  ops:         '#6366F1',
  review:      '#EC4899',
  engineering: '#64748B',
  competitive: '#EF4444',
  sales:       '#14B8A6',
  coach:       '#F97316',
};

const AGENT_NAMES: Record<string, string> = {
  strategy:    'Strategy Copilot',
  docs:        'Docs Writer',
  analytics:   'Analytics Intel',
  research:    'Research Agent',
  ops:         'Ops Automation',
  review:      'Review Agent',
  engineering: 'Engineering AI',
  competitive: 'Competitive Intel',
  sales:       'Sales Enablement',
  coach:       'PM Coach',
};

const OUTPUT_ICONS: Record<string, React.ElementType> = {
  slack:  Hash,
  notion: Database,
  email:  Mail,
  jira:   GitPullRequest,
  chat:   MessageSquare,
  web:    Globe,
};

type TriggerType = 'schedule' | 'webhook' | 'manual' | 'event';

interface WorkflowStep {
  id: string;
  agentId: string;
  action: string;
  output: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: TriggerType;
  triggerLabel: string;
  status: 'active' | 'paused' | 'draft' | 'error';
  steps: WorkflowStep[];
  lastRun?: string;
  runsTotal: number;
  successRate: number;
}

const WORKFLOWS: Workflow[] = [
  {
    id: 'wf-1',
    name: 'Weekly Sprint Summary',
    description: 'Every Friday 5pm — pull Jira sprint data → generate stakeholder summary → post to Slack',
    trigger: 'schedule', triggerLabel: 'Every Friday 17:00',
    status: 'active',
    steps: [
      { id: 's1', agentId: 'ops',      action: 'Pull sprint data from Jira',          output: 'chat'   },
      { id: 's2', agentId: 'ops',      action: 'Generate sprint summary narrative',    output: 'slack'  },
      { id: 's3', agentId: 'docs',     action: 'Save summary to Notion sprint page',   output: 'notion' },
    ],
    lastRun: 'Apr 18, 5:00 PM', runsTotal: 12, successRate: 100,
  },
  {
    id: 'wf-2',
    name: 'Daily Metrics Digest',
    description: 'Every morning — pull key metrics → detect anomalies → brief the PM team',
    trigger: 'schedule', triggerLabel: 'Daily 8:30 AM',
    status: 'active',
    steps: [
      { id: 's1', agentId: 'analytics', action: 'Fetch DAU, NPS, activation from analytics', output: 'chat'  },
      { id: 's2', agentId: 'analytics', action: 'Detect anomalies vs 7-day baseline',         output: 'chat'  },
      { id: 's3', agentId: 'ops',       action: 'Format and post digest to Slack',             output: 'slack' },
    ],
    lastRun: 'Today 8:30 AM', runsTotal: 31, successRate: 97,
  },
  {
    id: 'wf-3',
    name: 'New Feature RCA',
    description: 'Triggered on metric drop >5% — auto-generate RCA from releases, feedback, analytics',
    trigger: 'event', triggerLabel: 'Metric anomaly detected',
    status: 'active',
    steps: [
      { id: 's1', agentId: 'analytics', action: 'Identify affected segments and timeline',    output: 'chat'   },
      { id: 's2', agentId: 'research',  action: 'Pull customer feedback since trigger date',   output: 'chat'   },
      { id: 's3', agentId: 'analytics', action: 'Cross-reference with recent Jira releases',   output: 'chat'   },
      { id: 's4', agentId: 'docs',      action: 'Generate postmortem doc',                     output: 'notion' },
    ],
    lastRun: 'Apr 14, 9:20 AM', runsTotal: 4, successRate: 75,
  },
  {
    id: 'wf-4',
    name: 'Weekly Competitive Sweep',
    description: 'Every Monday — research competitor updates, generate battlecard diffs, post summary',
    trigger: 'schedule', triggerLabel: 'Every Monday 9:00 AM',
    status: 'paused',
    steps: [
      { id: 's1', agentId: 'competitive', action: 'Scrape competitor changelog & G2 reviews', output: 'chat'   },
      { id: 's2', agentId: 'competitive', action: 'Generate weekly competitive diff',          output: 'notion' },
      { id: 's3', agentId: 'sales',       action: 'Update battlecards if major changes',       output: 'notion' },
    ],
    lastRun: 'Apr 13, 9:01 AM', runsTotal: 6, successRate: 83,
  },
  {
    id: 'wf-5',
    name: 'Jira Epic → PRD',
    description: 'Webhook: when a Jira epic is created with label "needs-prd" → auto-draft PRD in Notion',
    trigger: 'webhook', triggerLabel: 'Jira: epic.created',
    status: 'draft',
    steps: [
      { id: 's1', agentId: 'docs', action: 'Read epic title, description, linked stories', output: 'chat'   },
      { id: 's2', agentId: 'docs', action: 'Generate PRD using epic data as context',       output: 'notion' },
      { id: 's3', agentId: 'ops',  action: 'Notify PM in Slack with Notion link',           output: 'slack'  },
    ],
    lastRun: undefined, runsTotal: 0, successRate: 100,
  },
];

// ── Node → React Flow conversion ──────────────────────────────────────────────

function workflowToFlow(wf: Workflow): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const STEP_X = 260;
  const Y = 0;

  // Trigger node
  nodes.push({
    id: 'trigger',
    type: 'triggerNode',
    position: { x: 0, y: Y },
    data: { trigger: wf.trigger, label: wf.triggerLabel },
  });

  // Agent step nodes
  wf.steps.forEach((step, i) => {
    const id = `step-${step.id}`;
    nodes.push({
      id,
      type: 'agentNode',
      position: { x: STEP_X * (i + 1), y: Y },
      data: { agentId: step.agentId, action: step.action, output: step.output },
    });

    const sourceId = i === 0 ? 'trigger' : `step-${wf.steps[i - 1].id}`;
    edges.push({
      id: `e-${sourceId}-${id}`,
      source: sourceId,
      target: id,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed, color: B.ink4, width: 14, height: 14 },
      style: { stroke: B.ink4, strokeWidth: 1.5 },
    });
  });

  // Output node (last step output destination)
  const lastStep = wf.steps[wf.steps.length - 1];
  const outId = 'output';
  nodes.push({
    id: outId,
    type: 'outputNode',
    position: { x: STEP_X * (wf.steps.length + 1), y: Y },
    data: { output: lastStep.output },
  });
  edges.push({
    id: `e-step-${lastStep.id}-output`,
    source: `step-${lastStep.id}`,
    target: outId,
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed, color: B.ink4, width: 14, height: 14 },
    style: { stroke: B.ink4, strokeWidth: 1.5 },
  });

  return { nodes, edges };
}

// ── Custom nodes ──────────────────────────────────────────────────────────────

const TRIGGER_ICONS: Record<TriggerType, React.ElementType> = {
  schedule: Calendar,
  webhook:  Webhook,
  manual:   Play,
  event:    Zap,
};

function TriggerNode({ data, selected }: NodeProps) {
  const trigger = (data as { trigger: TriggerType; label: string });
  const Icon = TRIGGER_ICONS[trigger.trigger] ?? Zap;
  return (
    <div className={cn(
      'rounded-xl border-2 px-4 py-3 w-[200px] bg-white transition-shadow',
      selected ? 'border-brand-accent shadow-lg shadow-blue-100' : 'border-brand-line',
    )}>
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-7 h-7 rounded-lg bg-brand-accent-bg flex items-center justify-center flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-brand-accent" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-ink-3">Trigger</span>
      </div>
      <div className="text-[12px] font-semibold text-brand-ink leading-tight">{trigger.label}</div>
      <Handle type="source" position={Position.Right} style={{ background: B.ink4, width: 8, height: 8, border: 'none' }} />
    </div>
  );
}

function AgentNode({ data, selected }: NodeProps) {
  const d = data as { agentId: string; action: string; output: string };
  const Icon = AGENT_ICONS[d.agentId] ?? Target;
  const color = AGENT_COLORS[d.agentId] ?? B.accent;
  const name = AGENT_NAMES[d.agentId] ?? d.agentId;
  return (
    <div className={cn(
      'rounded-xl border-2 px-4 py-3 w-[220px] bg-white transition-shadow',
      selected ? 'border-brand-accent shadow-lg shadow-blue-100' : 'border-brand-line',
    )}>
      <Handle type="target" position={Position.Left}  style={{ background: B.ink4, width: 8, height: 8, border: 'none' }} />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '18' }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{name}</div>
        </div>
      </div>
      <div className="text-[11px] text-brand-ink-2 leading-snug line-clamp-2">{d.action}</div>
      <Handle type="source" position={Position.Right} style={{ background: B.ink4, width: 8, height: 8, border: 'none' }} />
    </div>
  );
}

function OutputNode({ data, selected }: NodeProps) {
  const d = data as { output: string };
  const Icon = OUTPUT_ICONS[d.output] ?? MessageSquare;
  return (
    <div className={cn(
      'rounded-xl border-2 px-4 py-3 w-[160px] bg-white transition-shadow',
      selected ? 'border-brand-accent shadow-lg shadow-blue-100' : 'border-brand-line',
    )}>
      <Handle type="target" position={Position.Left} style={{ background: B.ink4, width: 8, height: 8, border: 'none' }} />
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-brand-ink-2" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-ink-3">Output</span>
      </div>
      <div className="text-[12px] font-semibold text-brand-ink capitalize">{d.output}</div>
    </div>
  );
}

const NODE_TYPES = { triggerNode: TriggerNode, agentNode: AgentNode, outputNode: OutputNode };

// ── Sidebar node palette ──────────────────────────────────────────────────────

const PALETTE_AGENTS = Object.entries(AGENT_NAMES).map(([id, name]) => ({ id, name }));
const PALETTE_OUTPUTS = Object.keys(OUTPUT_ICONS);

function NodePalette({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute right-0 top-0 h-full w-[240px] bg-white border-l border-brand-line z-20 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-brand-line">
        <span className="text-[12px] font-bold text-brand-ink">Add node</span>
        <button onClick={onClose} className="text-brand-ink-3 hover:text-brand-ink"><X className="w-3.5 h-3.5" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Triggers */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-ink-3 mb-2">Triggers</div>
          <div className="space-y-1.5">
            {(['schedule', 'webhook', 'event', 'manual'] as TriggerType[]).map(t => {
              const Icon = TRIGGER_ICONS[t];
              return (
                <div key={t} draggable className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-brand-line bg-brand-canvas hover:border-brand-accent hover:bg-brand-accent-bg cursor-grab text-[11px] font-medium text-brand-ink-2 transition-colors">
                  <Icon className="w-3.5 h-3.5 text-brand-accent" />
                  <span className="capitalize">{t}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Agents */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-ink-3 mb-2">Agents</div>
          <div className="space-y-1.5">
            {PALETTE_AGENTS.map(({ id, name }) => {
              const Icon = AGENT_ICONS[id] ?? Target;
              const color = AGENT_COLORS[id] ?? B.accent;
              return (
                <div key={id} draggable className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-brand-line bg-brand-canvas hover:border-brand-accent hover:bg-brand-accent-bg cursor-grab text-[11px] font-medium text-brand-ink-2 transition-colors">
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                  <span>{name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Outputs */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-ink-3 mb-2">Outputs</div>
          <div className="space-y-1.5">
            {PALETTE_OUTPUTS.map(out => {
              const Icon = OUTPUT_ICONS[out];
              return (
                <div key={out} draggable className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-brand-line bg-brand-canvas hover:border-brand-accent hover:bg-brand-accent-bg cursor-grab text-[11px] font-medium text-brand-ink-2 transition-colors">
                  <Icon className="w-3.5 h-3.5 text-brand-ink-3" />
                  <span className="capitalize">{out}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Node config panel ─────────────────────────────────────────────────────────

function NodeConfigPanel({ node, onClose, onDelete }: { node: Node; onClose: () => void; onDelete: () => void }) {
  const type = node.type ?? '';
  const d = node.data as Record<string, string>;

  return (
    <div className="absolute left-0 top-0 h-full w-[280px] bg-white border-r border-brand-line z-20 flex flex-col overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-brand-line">
        <span className="text-[12px] font-bold text-brand-ink capitalize">{type.replace('Node', '')} config</span>
        <div className="flex items-center gap-1">
          <button onClick={onDelete} className="text-red-400 hover:text-red-600 p-1 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
          <button onClick={onClose} className="text-brand-ink-3 hover:text-brand-ink p-1 rounded"><X className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {type === 'triggerNode' && (
          <>
            <Field label="Trigger type" value={d.trigger} />
            <Field label="Schedule / config" value={d.label} editable />
          </>
        )}
        {type === 'agentNode' && (
          <>
            <Field label="Agent" value={AGENT_NAMES[d.agentId] ?? d.agentId} />
            <Field label="Action / instruction" value={d.action} editable multiline />
            <Field label="Output destination" value={d.output} editable />
          </>
        )}
        {type === 'outputNode' && (
          <>
            <Field label="Output channel" value={d.output} editable />
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, editable, multiline }: { label: string; value: string; editable?: boolean; multiline?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-brand-ink-3 mb-1">{label}</div>
      {editable ? (
        multiline
          ? <textarea defaultValue={value} className="w-full text-[12px] text-brand-ink border border-brand-line rounded-lg px-3 py-2 resize-none bg-brand-canvas focus:outline-none focus:border-brand-accent" rows={3} />
          : <input  defaultValue={value} className="w-full text-[12px] text-brand-ink border border-brand-line rounded-lg px-3 py-2 bg-brand-canvas focus:outline-none focus:border-brand-accent" />
      ) : (
        <div className="text-[12px] text-brand-ink bg-brand-canvas border border-brand-line rounded-lg px-3 py-2 capitalize">{value}</div>
      )}
    </div>
  );
}

// ── Canvas ────────────────────────────────────────────────────────────────────

function WorkflowCanvas({ workflow, onBack }: { workflow: Workflow; onBack: () => void }) {
  const { nodes: initNodes, edges: initEdges } = workflowToFlow(workflow);
  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showPalette, setShowPalette] = useState(false);
  const [saved, setSaved] = useState(false);

  const onConnect = useCallback((connection: Connection) => {
    setEdges(eds => addEdge({
      ...connection,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed, color: B.ink4, width: 14, height: 14 },
      style: { stroke: B.ink4, strokeWidth: 1.5 },
    }, eds));
  }, [setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setShowPalette(false);
  }, []);

  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const deleteSelected = () => {
    if (!selectedNode) return;
    setNodes(ns => ns.filter(n => n.id !== selectedNode.id));
    setEdges(es => es.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  };

  const statusColor = {
    active: B.green, paused: B.amber, draft: B.ink3, error: B.red,
  }[workflow.status];

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Canvas top bar */}
      <div className="h-[48px] bg-white border-b border-brand-line flex items-center px-4 gap-3 flex-shrink-0 z-10">
        <button onClick={onBack} className="flex items-center gap-1.5 text-brand-ink-3 hover:text-brand-ink text-[12px] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Workflows</span>
        </button>
        <div className="w-px h-4 bg-brand-line" />
        <span className="text-[13px] font-semibold text-brand-ink">{workflow.name}</span>
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: statusColor }} />
        <span className="text-[11px] font-medium capitalize" style={{ color: statusColor }}>{workflow.status}</span>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => { setShowPalette(p => !p); setSelectedNode(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-line text-[12px] font-medium text-brand-ink-2 hover:border-brand-accent hover:text-brand-accent transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add node
          </button>
          <Button
            size="sm"
            className={cn('h-7 px-3 text-[12px] gap-1.5 transition-colors', saved ? 'bg-green-600 hover:bg-green-600' : 'bg-brand-accent hover:bg-brand-accent-dim')}
            onClick={handleSave}
          >
            {saved ? <><Check className="w-3 h-3" /> Saved</> : 'Save workflow'}
          </Button>
        </div>
      </div>

      {/* React Flow canvas */}
      <div className="flex-1 relative" style={{ background: '#F7F8FA' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={NODE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.3}
          maxZoom={2}
          deleteKeyCode="Delete"
          style={{ background: '#F7F8FA' }}
        >
          <Background color={B.line} gap={20} size={1} />
          <Controls style={{ bottom: 24, left: 24, top: 'auto', boxShadow: 'none', border: `1px solid ${B.line}`, borderRadius: 8, background: B.surface }} />
          <MiniMap
            style={{ bottom: 24, right: showPalette ? 256 : 24, top: 'auto', border: `1px solid ${B.line}`, borderRadius: 8, background: B.surface }}
            nodeColor={(n) => {
              if (n.type === 'triggerNode') return B.accent;
              if (n.type === 'agentNode') return AGENT_COLORS[(n.data as { agentId: string }).agentId] ?? B.accent;
              return B.ink4;
            }}
          />
          <Panel position="top-center">
            <div className="text-[11px] text-brand-ink-3 bg-white border border-brand-line rounded-lg px-3 py-1.5 shadow-sm">
              Drag to move nodes · Connect handles · Delete key to remove selected
            </div>
          </Panel>
        </ReactFlow>

        {/* Node config panel (left) */}
        {selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            onDelete={deleteSelected}
          />
        )}

        {/* Node palette (right) */}
        {showPalette && <NodePalette onClose={() => setShowPalette(false)} />}
      </div>
    </div>
  );
}

// ── Workflow list sidebar ─────────────────────────────────────────────────────

const TRIGGER_ICONS_MAP: Record<TriggerType, React.ElementType> = {
  schedule: Calendar, webhook: Webhook, manual: Play, event: Zap,
};

function WorkflowList({
  workflows, selected, onSelect, onNew,
}: {
  workflows: Workflow[];
  selected: string;
  onSelect: (wf: Workflow) => void;
  onNew: () => void;
}) {
  return (
    <div className="w-[280px] flex-shrink-0 border-r border-brand-line bg-white flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-brand-line flex items-center justify-between">
        <div>
          <h1 className="text-[13px] font-bold text-brand-ink">Workflows</h1>
          <p className="text-[11px] text-brand-ink-3 mt-0.5">Multi-agent pipelines</p>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-accent text-white text-[11px] font-semibold hover:bg-brand-accent-dim transition-colors"
        >
          <Plus className="w-3 h-3" /> New
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-px bg-brand-line border-b border-brand-line">
        {[
          { label: 'Active', value: workflows.filter(w => w.status === 'active').length, color: B.green },
          { label: 'Total runs', value: workflows.reduce((s, w) => s + w.runsTotal, 0), color: B.accent },
        ].map(s => (
          <div key={s.label} className="bg-white px-4 py-2.5">
            <div className="text-[16px] font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] text-brand-ink-3">{s.label}</div>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {workflows.map(wf => {
          const TIcon = TRIGGER_ICONS_MAP[wf.trigger];
          const isSelected = selected === wf.id;
          const statusColor = { active: B.green, paused: B.amber, draft: B.ink3, error: B.red }[wf.status];
          return (
            <button
              key={wf.id}
              onClick={() => onSelect(wf)}
              className={cn(
                'w-full text-left px-4 py-3.5 border-b border-brand-line transition-colors',
                isSelected ? 'bg-brand-accent-bg border-l-2 border-l-brand-accent' : 'hover:bg-brand-canvas',
              )}
            >
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: statusColor }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-brand-ink truncate">{wf.name}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <TIcon className="w-3 h-3 text-brand-ink-3" />
                    <span className="text-[10px] text-brand-ink-3 truncate">{wf.triggerLabel}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-brand-ink-4">
                    <span className="font-mono">{wf.runsTotal} runs</span>
                    {wf.runsTotal > 0 && <span className="font-mono">{wf.successRate}% ok</span>}
                    {wf.lastRun && <span>{wf.lastRun}</span>}
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-brand-ink-4 flex-shrink-0 mt-0.5" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Recent runs */}
      <div className="border-t border-brand-line p-4">
        <div className="text-[10px] font-bold uppercase tracking-wider text-brand-ink-3 mb-2.5">Recent runs</div>
        <div className="space-y-2">
          {[
            { wf: 'Daily Metrics Digest',  ts: 'Today 8:30',  ok: true  },
            { wf: 'Weekly Sprint Summary', ts: 'Apr 18 5pm',  ok: true  },
            { wf: 'New Feature RCA',       ts: 'Apr 14 9am',  ok: false },
          ].map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px]">
              {r.ok
                ? <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: B.green }} />
                : <AlertTriangle className="w-3 h-3 flex-shrink-0" style={{ color: B.amber }} />
              }
              <span className="text-brand-ink-2 truncate flex-1">{r.wf}</span>
              <span className="text-brand-ink-4 flex-shrink-0">{r.ts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── New workflow wizard ───────────────────────────────────────────────────────

function NewWorkflowPlaceholder({ onSelect }: { onSelect: (wf: Workflow) => void }) {
  const blank: Workflow = {
    id: `wf-${Date.now()}`,
    name: 'Untitled Workflow',
    description: '',
    trigger: 'manual',
    triggerLabel: 'Manual trigger',
    status: 'draft',
    steps: [],
    runsTotal: 0,
    successRate: 100,
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-brand-canvas">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 rounded-xl bg-white border border-brand-line flex items-center justify-center mx-auto mb-4">
          <Plus className="w-5 h-5 text-brand-accent" />
        </div>
        <h2 className="text-[15px] font-bold text-brand-ink mb-1.5">Create a new workflow</h2>
        <p className="text-[12px] text-brand-ink-3 mb-6 leading-relaxed">
          Connect agents, triggers, and outputs into a visual pipeline. Drag nodes from the palette to build your automation.
        </p>
        <button
          onClick={() => onSelect(blank)}
          className="px-5 py-2.5 rounded-lg bg-brand-accent text-white text-[13px] font-semibold hover:bg-brand-accent-dim transition-colors"
        >
          Open canvas
        </button>
      </div>
    </div>
  );
}

// ── Root page ─────────────────────────────────────────────────────────────────

export default function WorkflowsPage() {
  const [selectedId, setSelectedId] = useState<string>(WORKFLOWS[0].id);
  const [canvasWorkflow, setCanvasWorkflow] = useState<Workflow | null>(WORKFLOWS[0]);
  const [showNew, setShowNew] = useState(false);

  const handleSelect = (wf: Workflow) => {
    setSelectedId(wf.id);
    setCanvasWorkflow(wf);
    setShowNew(false);
  };

  const handleNew = () => {
    setShowNew(true);
    setCanvasWorkflow(null);
  };

  const handleBack = () => {
    setCanvasWorkflow(WORKFLOWS.find(w => w.id === selectedId) ?? WORKFLOWS[0]);
    setShowNew(false);
  };

  return (
    <div className="flex h-full overflow-hidden">
      <WorkflowList
        workflows={WORKFLOWS}
        selected={selectedId}
        onSelect={handleSelect}
        onNew={handleNew}
      />

      {showNew && !canvasWorkflow ? (
        <NewWorkflowPlaceholder onSelect={(wf) => { setCanvasWorkflow(wf); setShowNew(false); }} />
      ) : canvasWorkflow ? (
        <WorkflowCanvas workflow={canvasWorkflow} onBack={handleBack} />
      ) : null}
    </div>
  );
}
