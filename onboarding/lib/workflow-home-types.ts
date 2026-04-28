// ── Workflow list / home screen types ─────────────────────────────────────────

export type WorkflowStatus = 'active' | 'draft' | 'paused' | 'error';

export type WorkflowTriggerType = 'event' | 'schedule' | 'webhook' | 'manual';

export interface WorkflowTrigger {
  type: WorkflowTriggerType;
  connector?: string;
  event?: string;
  schedule?: string;
  label: string;
}

export interface WorkflowAgentUsage {
  agentId: string;
  agentName: string;
}

export interface WorkflowConnectorUsage {
  connectorId: string;
  label: string;
}

export interface WorkflowRunSummary {
  runId: string;
  startedAt: number;
  completedAt?: number;
  status: 'running' | 'completed' | 'failed';
  triggeredBy: 'event' | 'manual' | 'schedule';
  stepsCompleted: number;
  stepsTotal: number;
}

export interface WorkflowSummary {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  trigger: WorkflowTrigger;
  agents: WorkflowAgentUsage[];
  connectors: WorkflowConnectorUsage[];
  lastRun?: WorkflowRunSummary;
  successRate: number;
  totalRuns: number;
  owner: string;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}

// ── Plan review ───────────────────────────────────────────────────────────────

export type PlanConfidence = 'high' | 'medium' | 'low';

export interface WorkflowPlanSection {
  label: string;
  value: string;
  confidence: PlanConfidence;
}

export interface ClarifyingQuestion {
  id: string;
  question: string;
  fieldPath: string;
  inputType: 'text' | 'select' | 'yesno';
  options?: string[];
  answer?: string;
  required: boolean;
}

export interface DependencyCheck {
  type: 'connector' | 'agent' | 'permission';
  id: string;
  name: string;
  status: 'available' | 'missing' | 'unconfigured';
  actionLabel?: string;
}

export interface WorkflowPlanReview {
  trigger: WorkflowPlanSection;
  dataSources: WorkflowPlanSection[];
  conditions: WorkflowPlanSection[];
  agentSteps: WorkflowPlanSection[];
  actions: WorkflowPlanSection[];
  outputs: WorkflowPlanSection[];
  assumptions: string[];
  missingDetails: string[];
  dependencies: DependencyCheck[];
  clarifyingQuestions: ClarifyingQuestion[];
}

// ── Templates ─────────────────────────────────────────────────────────────────

export type TemplateCategory =
  | 'Incident Response'
  | 'Sprint & Planning'
  | 'Analytics'
  | 'Product'
  | 'Competitive'
  | 'Customer'
  | 'Release';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  trigger: WorkflowTrigger;
  estimatedNodes: number;
  agents: WorkflowAgentUsage[];
  connectors: WorkflowConnectorUsage[];
  tags: string[];
  nlPrompt: string;
}

// ── Creation modes ────────────────────────────────────────────────────────────

export type NewWorkflowCreationMode = 'ai' | 'template' | 'blank' | 'import_chat';
