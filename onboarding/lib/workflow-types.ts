// ── Node taxonomy ─────────────────────────────────────────────────────────────

export type WFNodeType =
  | 'trigger'
  | 'fetch'
  | 'condition'
  | 'agent'
  | 'approval'
  | 'tool'
  | 'output'
  | 'end';

export type NodeStatus = 'idle' | 'running' | 'success' | 'error' | 'skipped' | 'waiting';

export type EdgeStyle = 'default' | 'success' | 'failure';

export type CompareOp = '>' | '<' | '>=' | '<=' | '==' | '!=' | 'contains' | 'not_contains';

export type TriggerType = 'event' | 'schedule' | 'webhook' | 'manual';

// ── Node configs ──────────────────────────────────────────────────────────────

export interface TriggerConfig {
  type: TriggerType;
  connector?: string;
  event?: string;          // e.g. 'jira:comment_added'
  schedule?: string;       // cron expression
  webhookPath?: string;
  description?: string;
}

export interface FetchConfig {
  connector: string;
  operation: string;       // e.g. 'get_issue'
  params?: Record<string, string>;
  outputFields: string[];  // fields exposed to downstream nodes
}

export interface Expression {
  field: string;           // dot-path into run context: 'ticket.comment_count'
  operator: CompareOp;
  value: string | number | boolean;
}

export interface ConditionConfig {
  expressions: Expression[];
  logic: 'AND' | 'OR';
}

export interface AgentConfig {
  agentId: string;
  agentName: string;
  task: string;            // what to ask the agent
  contextFields: string[]; // which context keys to pass
  outputKey: string;       // key written to run context
  requiresApproval: boolean;
}

export interface ApprovalConfig {
  title: string;
  description: string;
  approverRoles: string[];
  timeoutHours: number;
  onTimeout: 'reject' | 'approve';
}

export interface ToolConfig {
  connector: string;
  operation: string;
  description: string;
  params?: Record<string, string>;
  requiresApproval: boolean;
}

export interface OutputConfig {
  destination: 'slack' | 'email' | 'notion' | 'home_screen' | 'jira' | 'confluence';
  template: string;
  channel?: string;
}

export type NodeConfig =
  | TriggerConfig
  | FetchConfig
  | ConditionConfig
  | AgentConfig
  | ApprovalConfig
  | ToolConfig
  | OutputConfig
  | Record<string, never>;

// ── Graph primitives ──────────────────────────────────────────────────────────

export interface WFNode {
  id: string;
  type: WFNodeType;
  label: string;
  position: { x: number; y: number };
  config: NodeConfig;
}

export interface WFEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string; // 'true'|'false' for conditions, 'approved'|'rejected' for approvals
  label?: string;
  edgeStyle?: EdgeStyle;
  animated?: boolean;
}

export interface WFGraph {
  nodes: WFNode[];
  edges: WFEdge[];
}

// ── Execution primitives ──────────────────────────────────────────────────────

export interface LogEntry {
  id: string;
  nodeId: string;
  nodeLabel: string;
  status: NodeStatus;
  message: string;
  output?: unknown;
  ts: number;
  duration?: number;
}

export interface WorkflowRun {
  id: string;
  status: 'running' | 'completed' | 'failed' | 'waiting_approval';
  triggeredAt: number;
  completedAt?: number;
  logs: LogEntry[];
  // Accumulated key→value output of each node, keyed by node id + outputKey
  context: Record<string, unknown>;
}
