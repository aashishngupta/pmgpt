'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow, Background, Controls, useNodesState, useEdgesState,
  type Node, type Edge, type NodeProps, type NodeTypes,
  Handle, Position, MarkerType, BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { cn } from '@/lib/utils';
import { palette } from '@/lib/brand';
import {
  Zap, Database, GitBranch, Bot, Shield, Wrench, Send,
  X, Play, Save, RotateCcw, CheckCircle2, AlertCircle, Loader2,
  ChevronRight, Circle, ChevronDown, ArrowLeft, Globe, PauseCircle,
  Pencil, Check,
} from 'lucide-react';
import type {
  WFNode as DomainWFNode, WFGraph, NodeStatus, LogEntry,
  TriggerConfig, FetchConfig, ConditionConfig, AgentConfig,
  ApprovalConfig, ToolConfig, OutputConfig, NodeConfig,
} from '@/lib/workflow-types';
import type { WorkflowStatus } from '@/lib/workflow-home-types';
import { WorkflowEngine } from '@/lib/workflow-engine';

// ── ReactFlow node data ───────────────────────────────────────────────────────

interface WFNodeData extends Record<string, unknown> {
  label: string;
  nodeType: DomainWFNode['type'];
  status: NodeStatus;
  config: NodeConfig;
  runOutput?: unknown;
}

type RFNode = Node<WFNodeData>;

// ── Adapters ──────────────────────────────────────────────────────────────────

export function toRFNodes(wfNodes: DomainWFNode[]): RFNode[] {
  return wfNodes.map(n => ({
    id: n.id, type: n.type, position: n.position,
    data: { label: n.label, nodeType: n.type, status: 'idle' as NodeStatus, config: n.config },
  }));
}

export function toRFEdges(wfEdges: import('@/lib/workflow-types').WFEdge[]): Edge[] {
  return wfEdges.map(e => {
    const col = e.edgeStyle === 'success' ? palette.green : e.edgeStyle === 'failure' ? palette.ink3 : palette.line;
    return {
      id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle,
      label: e.label, animated: e.animated ?? false,
      style: { stroke: col, strokeWidth: 2, strokeDasharray: e.edgeStyle === 'failure' ? '6,4' : undefined },
      labelStyle: { fill: col, fontSize: 10, fontWeight: 700 },
      labelBgStyle: { fill: palette.surface, fillOpacity: 0.88 },
      markerEnd: { type: MarkerType.ArrowClosed, color: col, width: 16, height: 16 },
    };
  });
}

// ── Status dot ────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: NodeStatus }) {
  const cls: Record<NodeStatus, string> = {
    idle: 'bg-brand-line', running: 'bg-brand-accent animate-pulse',
    success: 'bg-brand-green', error: 'bg-brand-red', skipped: 'bg-brand-ink-4', waiting: 'bg-brand-amber animate-pulse',
  };
  return <span className={cn('w-2 h-2 rounded-full flex-shrink-0', cls[status])} />;
}

// ── Custom nodes ──────────────────────────────────────────────────────────────

function TriggerNode({ data, selected }: NodeProps<RFNode>) {
  const c = data.config as TriggerConfig;
  return (
    <div className={cn('w-[280px] bg-brand-surface rounded-xl shadow-sm border-2 transition-all select-none', selected ? 'border-brand-accent shadow-lg' : 'border-brand-accent/40')}>
      <Handle type="source" position={Position.Bottom} style={{ background: palette.accent }} />
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-brand-accent" /><span className="text-[9px] font-bold uppercase tracking-widest text-brand-accent">Trigger</span></div>
          <StatusDot status={data.status} />
        </div>
        <p className="text-[13px] font-semibold text-brand-ink leading-snug">{data.label}</p>
        {c.event && <p className="text-[10px] text-brand-ink font-mono mt-0.5">{c.event}</p>}
        {c.connector && <span className="text-[9px] bg-brand-elevated text-brand-ink px-1.5 py-[2px] rounded border border-brand-line uppercase font-semibold tracking-wide inline-block mt-1.5">{c.connector}</span>}
        {c.type === 'schedule' && c.schedule && <code className="text-[9px] font-mono bg-brand-canvas text-brand-ink px-1.5 py-[2px] rounded border border-brand-line inline-block mt-1.5">{c.schedule}</code>}
      </div>
    </div>
  );
}

function FetchNode({ data, selected }: NodeProps<RFNode>) {
  const c = data.config as FetchConfig;
  return (
    <div className={cn('w-[280px] bg-brand-surface rounded-xl shadow-sm border-2 transition-all select-none', selected ? 'border-brand-ink shadow-lg' : 'border-brand-line')}>
      <Handle type="target" position={Position.Top} /><Handle type="source" position={Position.Bottom} />
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-brand-ink-3" /><span className="text-[9px] font-bold uppercase tracking-widest text-brand-ink-3">Data Fetch</span></div>
          <StatusDot status={data.status} />
        </div>
        <p className="text-[13px] font-semibold text-brand-ink leading-snug">{data.label}</p>
        <p className="text-[10px] text-brand-ink font-mono mt-0.5">{c.connector}.{c.operation}</p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {c.outputFields.slice(0, 4).map(f => <span key={f} className="text-[8px] font-mono bg-brand-elevated text-brand-ink px-1 py-[1px] rounded">{f}</span>)}
          {c.outputFields.length > 4 && <span className="text-[8px] text-brand-ink opacity-60">+{c.outputFields.length - 4}</span>}
        </div>
      </div>
    </div>
  );
}

function ConditionNode({ data, selected }: NodeProps<RFNode>) {
  const c = data.config as ConditionConfig;
  return (
    <div className={cn('w-[280px] bg-brand-surface rounded-xl shadow-sm border-2 transition-all select-none', selected ? 'border-brand-amber shadow-lg' : 'border-brand-amber/50')}>
      <Handle type="target" position={Position.Top} />
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5"><GitBranch className="w-3.5 h-3.5 text-brand-amber" /><span className="text-[9px] font-bold uppercase tracking-widest text-brand-amber">Condition</span></div>
          <StatusDot status={data.status} />
        </div>
        <p className="text-[13px] font-semibold text-brand-ink leading-snug mb-2">{data.label}</p>
        {c.expressions.map((expr, i) => (
          <div key={i} className="bg-brand-canvas rounded-lg px-2.5 py-1.5 mb-1.5">
            <span className="text-[11px] font-mono text-brand-ink">{expr.field} </span>
            <span className="text-[11px] font-mono font-bold text-brand-amber">{expr.operator} </span>
            <span className="text-[11px] font-mono text-brand-ink">{String(expr.value)}</span>
          </div>
        ))}
        <div className="flex justify-between text-[9px] font-bold mt-2 px-1">
          <span className="text-brand-green">▼ TRUE</span><span className="text-brand-ink-3">▼ FALSE</span>
        </div>
      </div>
      <Handle type="source" id="true"  position={Position.Bottom} style={{ left: '28%', background: palette.green }} />
      <Handle type="source" id="false" position={Position.Bottom} style={{ left: '72%', background: palette.ink3  }} />
    </div>
  );
}

function AgentNode({ data, selected }: NodeProps<RFNode>) {
  const c = data.config as AgentConfig;
  return (
    <div className={cn('w-[280px] bg-brand-accent-bg rounded-xl shadow-sm border-2 transition-all select-none', selected ? 'border-brand-accent shadow-lg' : 'border-brand-accent/50')}>
      <Handle type="target" position={Position.Top} style={{ background: palette.accent }} />
      <Handle type="source" position={Position.Bottom} style={{ background: palette.accent }} />
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5"><Bot className="w-3.5 h-3.5 text-brand-accent" /><span className="text-[9px] font-bold uppercase tracking-widest text-brand-accent">Agent</span></div>
          <StatusDot status={data.status} />
        </div>
        <p className="text-[13px] font-semibold text-brand-ink leading-snug">{data.label}</p>
        <p className="text-[10px] text-brand-ink mt-0.5">{c.agentName}</p>
        <p className="text-[10px] text-brand-ink mt-1 leading-relaxed line-clamp-2 opacity-60">{c.task}</p>
      </div>
    </div>
  );
}

function ApprovalNode({ data, selected }: NodeProps<RFNode>) {
  const c = data.config as ApprovalConfig;
  return (
    <div className={cn('w-[280px] bg-brand-amber-bg/60 rounded-xl shadow-sm border-2 transition-all select-none', selected ? 'border-brand-amber shadow-lg' : 'border-brand-amber/60')}>
      <Handle type="target" position={Position.Top} />
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-brand-amber" /><span className="text-[9px] font-bold uppercase tracking-widest text-brand-amber">Approval Gate</span><span className="w-1.5 h-1.5 rounded-full bg-brand-amber animate-pulse" /></div>
          <StatusDot status={data.status} />
        </div>
        <p className="text-[13px] font-semibold text-brand-ink leading-snug">{data.label}</p>
        <p className="text-[10px] text-brand-ink mt-0.5 leading-snug line-clamp-2">{c.description}</p>
        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
          {c.approverRoles.map(r => <span key={r} className="text-[8px] bg-brand-amber-bg text-brand-amber px-1.5 py-[2px] rounded border border-brand-amber/20 uppercase font-semibold tracking-wide">{r}</span>)}
          <span className="text-[8px] text-brand-ink opacity-40 ml-auto">{c.timeoutHours}h timeout</span>
        </div>
        <div className="flex justify-between text-[9px] font-bold mt-2 px-1">
          <span className="text-brand-green">▼ APPROVED</span><span className="text-brand-red">▼ REJECTED</span>
        </div>
      </div>
      <Handle type="source" id="approved" position={Position.Bottom} style={{ left: '28%', background: palette.green }} />
      <Handle type="source" id="rejected" position={Position.Bottom} style={{ left: '72%', background: palette.red   }} />
    </div>
  );
}

function ToolNode({ data, selected }: NodeProps<RFNode>) {
  const c = data.config as ToolConfig;
  return (
    <div className={cn('w-[280px] bg-brand-surface rounded-xl shadow-sm border-2 transition-all select-none', selected ? 'border-brand-amber shadow-lg' : 'border-brand-amber/30')}>
      <Handle type="target" position={Position.Top} /><Handle type="source" position={Position.Bottom} />
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5 text-brand-amber" /><span className="text-[9px] font-bold uppercase tracking-widest text-brand-amber">Action</span></div>
          <StatusDot status={data.status} />
        </div>
        <p className="text-[13px] font-semibold text-brand-ink leading-snug">{data.label}</p>
        <p className="text-[10px] text-brand-ink font-mono mt-0.5">{c.connector}.{c.operation}</p>
        <p className="text-[10px] text-brand-ink mt-0.5 opacity-70">{c.description}</p>
      </div>
    </div>
  );
}

function OutputNode({ data, selected }: NodeProps<RFNode>) {
  const c = data.config as OutputConfig;
  return (
    <div className={cn('w-[280px] bg-brand-surface rounded-xl shadow-sm border-2 transition-all select-none', selected ? 'border-brand-green shadow-lg' : 'border-brand-green/40')}>
      <Handle type="target" position={Position.Top} style={{ background: palette.green }} />
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5"><Send className="w-3.5 h-3.5 text-brand-green" /><span className="text-[9px] font-bold uppercase tracking-widest text-brand-green">Output</span></div>
          <StatusDot status={data.status} />
        </div>
        <p className="text-[13px] font-semibold text-brand-ink leading-snug">{data.label}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-[9px] bg-brand-green-bg text-brand-green px-1.5 py-[2px] rounded border border-brand-green/20 uppercase font-semibold tracking-wide">{c.destination}</span>
          {c.channel && <span className="text-[10px] text-brand-ink font-mono">{c.channel}</span>}
        </div>
      </div>
    </div>
  );
}

function EndNode({ data }: NodeProps<RFNode>) {
  return (
    <div className={cn('w-[210px] rounded-lg border border-dashed px-3 py-2 select-none', data.status === 'skipped' ? 'border-brand-ink-3 bg-brand-elevated' : 'border-brand-line bg-brand-canvas')}>
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-1.5">
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', data.status === 'skipped' ? 'bg-brand-ink-3' : 'bg-brand-line')} />
        <p className="text-[10px] text-brand-ink leading-snug">{data.label}</p>
      </div>
    </div>
  );
}

const NODE_TYPES: NodeTypes = {
  trigger: TriggerNode as NodeTypes[string], fetch: FetchNode as NodeTypes[string],
  condition: ConditionNode as NodeTypes[string], agent: AgentNode as NodeTypes[string],
  approval: ApprovalNode as NodeTypes[string], tool: ToolNode as NodeTypes[string],
  output: OutputNode as NodeTypes[string], end: EndNode as NodeTypes[string],
};

// ── Node config renderer ──────────────────────────────────────────────────────

function CfgField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-[9px] font-bold uppercase tracking-widest text-brand-ink-3 mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function renderNodeConfig(nodeType: string, config: NodeConfig): React.ReactNode {
  switch (nodeType) {
    case 'trigger': { const c = config as TriggerConfig; return <><CfgField label="Type"><p className="text-[12px] text-brand-ink font-medium capitalize">{c.type}</p></CfgField>{c.event && <CfgField label="Event"><code className="text-[11px] font-mono text-brand-ink">{c.event}</code></CfgField>}{c.connector && <CfgField label="Connector"><p className="text-[12px] text-brand-ink font-medium capitalize">{c.connector}</p></CfgField>}</>; }
    case 'fetch':   { const c = config as FetchConfig;   return <><CfgField label="Connector"><p className="text-[12px] text-brand-ink font-medium">{c.connector}</p></CfgField><CfgField label="Operation"><code className="text-[11px] font-mono text-brand-ink">{c.operation}</code></CfgField><CfgField label="Output Fields"><div className="flex flex-wrap gap-1">{c.outputFields.map(f => <span key={f} className="text-[10px] font-mono bg-brand-canvas text-brand-ink px-1.5 py-0.5 rounded border border-brand-line">{f}</span>)}</div></CfgField></>; }
    case 'condition': { const c = config as ConditionConfig; return <><CfgField label={`Expressions (${c.logic})`}>{c.expressions.map((e, i) => <div key={i} className="font-mono text-[11px] bg-brand-canvas p-2.5 rounded-lg border border-brand-line mb-1.5"><span className="text-brand-ink">{e.field} </span><span className="text-brand-amber font-bold">{e.operator} </span><span className="text-brand-ink">{String(e.value)}</span></div>)}</CfgField></>; }
    case 'agent':   { const c = config as AgentConfig;   return <><CfgField label="Agent"><p className="text-[12px] text-brand-ink font-semibold">{c.agentName}</p></CfgField><CfgField label="Task"><p className="text-[11px] text-brand-ink leading-relaxed bg-brand-canvas p-3 rounded-lg border border-brand-line">{c.task}</p></CfgField><CfgField label="Output key"><code className="text-[11px] font-mono text-brand-ink">{c.outputKey}</code></CfgField></>; }
    case 'approval':{ const c = config as ApprovalConfig;return <><CfgField label="Title"><p className="text-[12px] text-brand-ink font-semibold">{c.title}</p></CfgField><CfgField label="Approver Roles"><div className="flex gap-1.5">{c.approverRoles.map(r => <span key={r} className="text-[10px] bg-brand-elevated text-brand-ink px-2 py-0.5 rounded border border-brand-line capitalize">{r}</span>)}</div></CfgField><CfgField label="Timeout"><p className="text-[12px] text-brand-ink">{c.timeoutHours}h → on timeout: {c.onTimeout}</p></CfgField></>; }
    case 'tool':    { const c = config as ToolConfig;    return <><CfgField label="Connector"><p className="text-[12px] text-brand-ink font-medium">{c.connector}</p></CfgField><CfgField label="Operation"><code className="text-[11px] font-mono text-brand-ink">{c.operation}</code></CfgField><CfgField label="Description"><p className="text-[11px] text-brand-ink leading-relaxed">{c.description}</p></CfgField></>; }
    case 'output':  { const c = config as OutputConfig;  return <><CfgField label="Destination"><p className="text-[12px] text-brand-ink font-semibold capitalize">{c.destination}</p></CfgField>{c.channel && <CfgField label="Channel"><code className="text-[11px] font-mono text-brand-ink">{c.channel}</code></CfgField>}<CfgField label="Template"><pre className="text-[10px] font-mono text-brand-ink bg-brand-canvas p-3 rounded-lg border border-brand-line whitespace-pre-wrap leading-relaxed">{c.template}</pre></CfgField></>; }
    default: return null;
  }
}

// ── Node inspector ────────────────────────────────────────────────────────────

function NodeInspector({ node, onClose }: { node: RFNode; onClose: () => void }) {
  const { label, nodeType, status, config, runOutput } = node.data;
  const statusBanner: Record<NodeStatus, string> = {
    idle: '', running: 'bg-brand-accent-bg text-brand-accent',
    success: 'bg-brand-green-bg text-brand-green', error: 'bg-brand-red-bg text-brand-red',
    skipped: 'bg-brand-elevated text-brand-ink', waiting: 'bg-brand-amber-bg text-brand-amber',
  };
  return (
    <div className="w-[320px] flex-shrink-0 border-l border-brand-line bg-brand-surface flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-brand-line flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <StatusDot status={status} />
          <span className="text-[13px] font-semibold text-brand-ink truncate">{label}</span>
        </div>
        <button onClick={onClose} className="p-1 text-brand-ink hover:bg-brand-elevated rounded-lg transition-colors flex-shrink-0"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[9px] font-bold uppercase tracking-widest text-brand-ink-3">Node type</span>
          <span className="text-[10px] bg-brand-elevated text-brand-ink px-2 py-0.5 rounded border border-brand-line capitalize">{nodeType}</span>
        </div>
        {status !== 'idle' && statusBanner[status] && (
          <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium mb-4', statusBanner[status])}>
            {status === 'running' && <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />}
            {status === 'success' && <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />}
            {status === 'error'   && <AlertCircle   className="w-3.5 h-3.5 flex-shrink-0" />}
            <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
          </div>
        )}
        {renderNodeConfig(nodeType, config)}
        {runOutput != null && (
          <div className="mt-2 pt-4 border-t border-brand-line-2">
            <div className="text-[9px] font-bold uppercase tracking-widest text-brand-ink-3 mb-2">Run Output</div>
            <pre className="text-[10px] font-mono text-brand-ink bg-brand-canvas rounded-lg p-3 overflow-auto max-h-60 border border-brand-line whitespace-pre-wrap leading-relaxed">
              {JSON.stringify(runOutput, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Execution log panel ───────────────────────────────────────────────────────

function ExecutionLogPanel({ logs, isRunning, onClear }: { logs: LogEntry[]; isRunning: boolean; onClear: () => void }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs.length]);
  const icon = (s: NodeStatus) => {
    if (s === 'running') return <Loader2    className="w-3 h-3 text-brand-accent animate-spin flex-shrink-0" />;
    if (s === 'success') return <CheckCircle2 className="w-3 h-3 text-brand-green flex-shrink-0" />;
    if (s === 'error')   return <AlertCircle  className="w-3 h-3 text-brand-red flex-shrink-0" />;
    if (s === 'skipped') return <ChevronRight className="w-3 h-3 text-brand-ink-3 flex-shrink-0" />;
    return <Circle className="w-3 h-3 text-brand-ink-3 flex-shrink-0" />;
  };
  return (
    <div className="h-[188px] flex-shrink-0 border-t border-brand-line bg-brand-canvas flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-brand-line flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-ink">Execution Log</span>
          {isRunning && <div className="flex items-center gap-1 text-[10px] text-brand-accent"><Loader2 className="w-3 h-3 animate-spin" /><span>Running</span></div>}
          {!isRunning && logs.length > 0 && <span className="text-[10px] text-brand-green font-medium">{logs.filter(l => l.status === 'success').length} nodes completed</span>}
        </div>
        {logs.length > 0 && <button onClick={onClear} className="text-[10px] text-brand-ink hover:text-brand-red transition-colors">Clear</button>}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-0.5">
        {logs.length === 0 && <p className="text-[11px] text-brand-ink-3 text-center py-6">No runs yet. Click Run to execute the workflow.</p>}
        {logs.map(entry => (
          <div key={entry.id} className="flex items-start gap-2 py-0.5">
            <span className="text-[9px] text-brand-ink-3 flex-shrink-0 mt-0.5 font-mono w-[60px] text-right">{new Date(entry.ts).toTimeString().slice(0, 8)}</span>
            {icon(entry.status)}
            <span className="text-[11px] font-semibold text-brand-ink flex-shrink-0 w-[128px] truncate">{entry.nodeLabel}</span>
            <span className="text-[11px] text-brand-ink flex-1 truncate">{entry.message}</span>
            {entry.duration !== undefined && <span className="text-[9px] text-brand-ink-3 flex-shrink-0 font-mono">{entry.duration}ms</span>}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

// ── Status badge for toolbar ──────────────────────────────────────────────────

const WF_STATUS_STYLE: Record<WorkflowStatus, { label: string; cls: string }> = {
  active: { label: 'Active',  cls: 'bg-brand-green-bg text-brand-green border-brand-green/20'   },
  draft:  { label: 'Draft',   cls: 'bg-brand-elevated text-brand-ink-3 border-brand-line'        },
  paused: { label: 'Paused',  cls: 'bg-brand-amber-bg text-brand-amber border-brand-amber/20'   },
  error:  { label: 'Error',   cls: 'bg-brand-red-bg text-brand-red border-brand-red/20'         },
};

// ── Editor shell ──────────────────────────────────────────────────────────────

interface Props {
  initialGraph: WFGraph;
  workflowName: string;
  workflowStatus: WorkflowStatus;
  onBack: () => void;
  onSave: (graph: WFGraph, name: string) => void;
  onPublish: () => void;
  onPause: () => void;
  onGraphUpdate?: (graph: WFGraph) => void;
}

export function WorkflowEditorShell({
  initialGraph, workflowName: initName, workflowStatus, onBack, onSave, onPublish, onPause, onGraphUpdate,
}: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<RFNode>(toRFNodes(initialGraph.nodes));
  const [edges, setEdges, onEdgesChange] = useEdgesState(toRFEdges(initialGraph.edges));
  const [selectedNode, setSelectedNode]  = useState<RFNode | null>(null);
  const [showLogs, setShowLogs]          = useState(false);
  const [isRunning, setIsRunning]        = useState(false);
  const [logs, setLogs]                  = useState<LogEntry[]>([]);
  const [name, setName]                  = useState(initName);
  const [isEditingName, setIsEditingName] = useState(false);

  const graphRef = useRef<WFGraph>(initialGraph);

  // Update canvas when a co-pilot update arrives
  useEffect(() => {
    const updatedNodes = toRFNodes(initialGraph.nodes);
    const updatedEdges = toRFEdges(initialGraph.edges);
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    graphRef.current = initialGraph;
    setSelectedNode(null);
    setLogs([]);
  // Only run on initial mount — co-pilot updates via onGraphUpdate prop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetStatuses = useCallback(() => {
    setNodes(ns => ns.map(n => ({ ...n, data: { ...n.data, status: 'idle' as NodeStatus, runOutput: undefined } })));
  }, [setNodes]);

  const handleRun = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setShowLogs(true);
    setLogs([]);
    resetStatuses();
    const engine = new WorkflowEngine({
      onNodeUpdate: (nodeId, status, output) => {
        setNodes(ns => ns.map(n => n.id === nodeId ? { ...n, data: { ...n.data, status, runOutput: output } } : n));
        setSelectedNode(prev => prev?.id === nodeId ? { ...prev, data: { ...prev.data, status, runOutput: output } } : prev);
      },
      onLog: entry => setLogs(prev => [...prev, entry]),
    });
    await engine.execute(graphRef.current.nodes, graphRef.current.edges, { source: 'manual', ts: Date.now() });
    setIsRunning(false);
  }, [isRunning, resetStatuses, setNodes]);

  const handleReset = useCallback(() => { resetStatuses(); setLogs([]); setSelectedNode(null); }, [resetStatuses]);

  const handleNodeClick = useCallback((_: React.MouseEvent, n: RFNode) => {
    if (n.data.nodeType === 'end') return;
    setSelectedNode(n);
  }, []);

  const st = WF_STATUS_STYLE[workflowStatus];

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex-shrink-0 bg-brand-surface border-b border-brand-line px-4 py-2.5 flex items-center gap-3">
        {/* Breadcrumb */}
        <button onClick={onBack} className="flex items-center gap-1 text-brand-ink-3 hover:text-brand-ink transition-colors flex-shrink-0">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="text-[12px]">Workflows</span>
        </button>
        <span className="text-brand-ink-3 text-[12px]">/</span>

        {/* Editable name */}
        {isEditingName ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={e => { if (e.key === 'Enter') setIsEditingName(false); }}
              className="text-[13px] font-semibold text-brand-ink bg-brand-canvas border border-brand-accent rounded-lg px-2 py-0.5 outline-none w-48"
            />
            <button onClick={() => setIsEditingName(false)} className="p-1 text-brand-green hover:bg-brand-elevated rounded transition-colors"><Check className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <button onClick={() => setIsEditingName(true)} className="flex items-center gap-1.5 group">
            <span className="text-[13px] font-semibold text-brand-ink">{name}</span>
            <Pencil className="w-3 h-3 text-brand-ink-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}

        {/* Status badge */}
        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', st.cls)}>{st.label}</span>

        <div className="flex-1" />

        {/* Actions */}
        <button onClick={handleRun} disabled={isRunning} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-green bg-brand-green-bg text-brand-green text-[12px] font-medium hover:bg-brand-green/10 transition-colors disabled:opacity-50">
          {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          {isRunning ? 'Running…' : 'Run'}
        </button>
        <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-line text-brand-ink text-[12px] font-medium hover:bg-brand-elevated transition-colors">
          <RotateCcw className="w-3.5 h-3.5" />Reset
        </button>
        <button onClick={() => onSave(graphRef.current, name)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-line text-brand-ink text-[12px] font-medium hover:bg-brand-elevated transition-colors">
          <Save className="w-3.5 h-3.5" />Save
        </button>
        {workflowStatus !== 'active' ? (
          <button onClick={onPublish} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-accent text-white text-[12px] font-medium hover:bg-brand-accent-dim transition-colors">
            <Globe className="w-3.5 h-3.5" />Publish
          </button>
        ) : (
          <button onClick={onPause} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-amber/30 bg-brand-amber-bg text-brand-amber text-[12px] font-medium hover:bg-brand-amber/10 transition-colors">
            <PauseCircle className="w-3.5 h-3.5" />Pause
          </button>
        )}
        <button onClick={() => setShowLogs(v => !v)} className={cn('flex items-center gap-1 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-colors', showLogs ? 'border-brand-accent/30 bg-brand-accent-bg text-brand-accent' : 'border-brand-line text-brand-ink hover:bg-brand-elevated')}>
          <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showLogs && 'rotate-180')} />Logs
        </button>
      </div>

      {/* Canvas + inspector */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes} edges={edges} nodeTypes={NODE_TYPES}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick} onPaneClick={() => setSelectedNode(null)}
            fitView fitViewOptions={{ padding: 0.18, maxZoom: 1 }} minZoom={0.3} maxZoom={1.5}
            defaultEdgeOptions={{ style: { strokeWidth: 2, stroke: palette.line }, markerEnd: { type: MarkerType.ArrowClosed, color: palette.line } }}
          >
            <Background color={palette.line2} gap={20} variant={BackgroundVariant.Dots} />
            <Controls style={{ boxShadow: 'none', border: `1px solid ${palette.line}`, borderRadius: 10, background: palette.surface }} />
          </ReactFlow>
        </div>
        {selectedNode && <NodeInspector node={selectedNode} onClose={() => setSelectedNode(null)} />}
      </div>

      {/* Execution log */}
      {showLogs && <ExecutionLogPanel logs={logs} isRunning={isRunning} onClear={() => setLogs([])} />}
    </div>
  );
}
