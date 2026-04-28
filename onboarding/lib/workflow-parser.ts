/**
 * Workflow NL Parser
 *
 * Converts plain-English workflow descriptions into a WFGraph.
 * On the frontend this uses pattern matching (fast, no API call).
 * The backend /workflow/parse endpoint uses Claude with a structured prompt
 * for full generality — this parser handles common PM patterns without latency.
 *
 * Architecture note:
 *   Returns WFGraph (domain type) — NOT @xyflow/react types.
 *   The page component adapts WFGraph → ReactFlow Node/Edge via toRFNodes/toRFEdges.
 */

import type {
  WFGraph, WFNode, WFEdge, EdgeStyle,
  TriggerConfig, FetchConfig, ConditionConfig,
  AgentConfig, ApprovalConfig, ToolConfig, OutputConfig,
} from './workflow-types';
import type {
  WorkflowPlanReview, WorkflowPlanSection, DependencyCheck, ClarifyingQuestion,
} from './workflow-home-types';

// ── Layout constants ──────────────────────────────────────────────────────────

const CX    = 260;  // x origin for main path nodes
const NH    = 100;  // node height — normal
const NC    = 140;  // node height — complex (condition / approval)
const V_GAP = 56;   // vertical gap between nodes

// ── Builder helpers ───────────────────────────────────────────────────────────

function node(id: string, type: WFNode['type'], label: string, config: WFNode['config'], y: number, x = CX): WFNode {
  return { id, type, label, position: { x, y }, config };
}

function edge(id: string, source: string, target: string, opts?: {
  sourceHandle?: string;
  label?: string;
  edgeStyle?: EdgeStyle;
  animated?: boolean;
}): WFEdge {
  return { id, source, target, ...opts };
}

// ── Demo workflow ─────────────────────────────────────────────────────────────
// Pre-built for: "When a Jira ticket gets more than 20 comments,
//                analyze with RCA agent and notify the PM via Slack"

export function buildDemoWorkflow(): WFGraph {
  let y = 40;
  const next = (isComplex = false) => { y += (isComplex ? NC : NH) + V_GAP; return y; };

  const triggerY = y;
  const fetchY   = next();
  const condY    = next();
  const agentY   = next(true);   // condition is complex
  const approvY  = next();
  const toolY    = next(true);   // approval is complex
  const outputY  = next();

  const endFalseY    = condY   + NC / 2 - 20;
  const endRejectedY = approvY + NC / 2 - 20;
  const END_X        = CX + 320;

  const nodes: WFNode[] = [
    node('trigger-1', 'trigger', 'Jira Comment Added', {
      type: 'event', connector: 'jira', event: 'jira:comment_added',
      description: 'Fires whenever any Jira ticket receives a new comment',
    } satisfies TriggerConfig, triggerY),

    node('fetch-1', 'fetch', 'Get Jira Ticket', {
      connector: 'jira', operation: 'get_issue',
      outputFields: ['ticket_id', 'title', 'status', 'assignee', 'comment_count', 'labels'],
    } satisfies FetchConfig, fetchY),

    node('condition-1', 'condition', 'Comment Threshold', {
      expressions: [{ field: 'ticket.comment_count', operator: '>', value: 20 }],
      logic: 'AND',
    } satisfies ConditionConfig, condY),

    node('agent-1', 'agent', 'RCA Analysis', {
      agentId: 'engineering', agentName: 'Engineering Agent',
      task: 'Perform a root cause analysis on this Jira ticket. Identify what broke, why it broke, business impact, and concrete remediation steps.',
      contextFields: ['ticket.title', 'ticket.comment_count', 'ticket.labels', 'ticket.assignee'],
      outputKey: 'rca_output', requiresApproval: false,
    } satisfies AgentConfig, agentY),

    node('approval-1', 'approval', 'PM Review Required', {
      title: 'Review RCA before publishing',
      description: 'Engineering Agent completed the RCA. Review before sending to Slack and creating the Notion page.',
      approverRoles: ['pm', 'pm_lead'],
      timeoutHours: 24, onTimeout: 'reject',
    } satisfies ApprovalConfig, approvY),

    node('tool-1', 'tool', 'Create Notion Page', {
      connector: 'notion', operation: 'create_page',
      description: 'Creates a structured RCA doc in the Engineering Incidents space',
      requiresApproval: false,
    } satisfies ToolConfig, toolY),

    node('output-1', 'output', 'Notify PM via Slack', {
      destination: 'slack',
      template: '*RCA Alert — {{ticket.title}}*\n\n{{rca_output.summary}}\n\nImpact: {{rca_output.impact}}\nNotion: {{notion_url}}',
      channel: '#product-incidents',
    } satisfies OutputConfig, outputY),

    // Branch terminals
    node('end-false',    'end', 'Threshold not met — skip', {}, endFalseY,    END_X),
    node('end-rejected', 'end', 'Rejected — workflow stopped', {}, endRejectedY, END_X),
  ];

  const edges: WFEdge[] = [
    edge('e1', 'trigger-1', 'fetch-1',    { animated: true }),
    edge('e2', 'fetch-1',   'condition-1'),

    edge('e3-true',  'condition-1', 'agent-1',   { sourceHandle: 'true',     label: 'TRUE',     edgeStyle: 'success', animated: true }),
    edge('e3-false', 'condition-1', 'end-false',  { sourceHandle: 'false',    label: 'FALSE',    edgeStyle: 'failure' }),

    edge('e4', 'agent-1', 'approval-1'),

    edge('e5-ok',  'approval-1', 'tool-1',        { sourceHandle: 'approved', label: 'APPROVED', edgeStyle: 'success', animated: true }),
    edge('e5-no',  'approval-1', 'end-rejected',  { sourceHandle: 'rejected', label: 'REJECTED', edgeStyle: 'failure' }),

    edge('e6', 'tool-1',   'output-1', { animated: true }),
  ];

  return { nodes, edges };
}

// ── Pattern tables ────────────────────────────────────────────────────────────

interface TriggerMatch {
  config: TriggerConfig;
  fetchConfig?: FetchConfig;
  label: string;
}

const TRIGGER_PATTERNS: Array<{ re: RegExp } & TriggerMatch> = [
  {
    re: /jira.*(comment|ticket.*comment|comment.*ticket)/i,
    config: { type: 'event', connector: 'jira', event: 'jira:comment_added' },
    label: 'Jira Comment Added',
    fetchConfig: { connector: 'jira', operation: 'get_issue', outputFields: ['ticket_id', 'title', 'comment_count', 'assignee', 'labels'] },
  },
  {
    re: /sprint.*(clos|end)|clos.*sprint/i,
    config: { type: 'event', connector: 'jira', event: 'jira:sprint_closed' },
    label: 'Sprint Closed',
    fetchConfig: { connector: 'jira', operation: 'get_sprint_summary', outputFields: ['sprint_name', 'velocity', 'completed', 'carry_over', 'team'] },
  },
  {
    re: /deploy(ment|ed)?|pipeline.*fail|release.*fail/i,
    config: { type: 'event', connector: 'github', event: 'github:deployment_completed' },
    label: 'Deployment Event',
    fetchConfig: { connector: 'github', operation: 'get_deployment', outputFields: ['sha', 'author', 'status', 'environment', 'changed_files'] },
  },
  {
    re: /metric.*(threshold|alert|drop|breach)|amplitude.*alert|kpi.*drop/i,
    config: { type: 'event', connector: 'amplitude', event: 'amplitude:metric_threshold' },
    label: 'Metric Threshold Breached',
    fetchConfig: { connector: 'amplitude', operation: 'get_metric_snapshot', outputFields: ['metric_name', 'current_value', 'threshold', 'change_pct', 'segment'] },
  },
  {
    re: /epic.*(creat|open|start)|creat.*epic/i,
    config: { type: 'event', connector: 'jira', event: 'jira:epic_created' },
    label: 'Epic Created',
    fetchConfig: { connector: 'jira', operation: 'get_epic', outputFields: ['epic_id', 'title', 'owner', 'target_date', 'linked_issues'] },
  },
  {
    re: /every (day|daily|morning|week|monday|8am|9am|hour|4 hour)/i,
    config: { type: 'schedule', schedule: '0 9 * * 1-5', description: 'Weekdays at 9am' },
    label: 'Scheduled Trigger',
  },
  {
    re: /manual|on.?demand|when.*click|webhook/i,
    config: { type: 'manual' },
    label: 'Manual Trigger',
  },
];

const CONDITION_PATTERNS: Array<{
  re: RegExp;
  build: (m: RegExpMatchArray) => ConditionConfig['expressions'][0] | null;
}> = [
  { re: /more than (\d+) comment/i,  build: m => ({ field: 'ticket.comment_count',  operator: '>', value: Number(m[1]) }) },
  { re: /greater than (\d+)/i,        build: m => ({ field: 'value',                 operator: '>', value: Number(m[1]) }) },
  { re: /less than (\d+)/i,           build: m => ({ field: 'value',                 operator: '<', value: Number(m[1]) }) },
  { re: /over (\d+)\s*(comment|issue|error|ticket)/i, build: m => ({ field: `metric.${m[2]}_count`, operator: '>', value: Number(m[1]) }) },
  { re: /if.*(fail|error|broke|broken|down)/i, build: () => ({ field: 'status', operator: '==', value: 'failed' }) },
  { re: /if.*(complet|done|clos)/i,   build: () => ({ field: 'status', operator: '==', value: 'completed' }) },
  { re: /drop(ped)? (by|more than|over) (\d+)\s*%/i, build: m => ({ field: 'change_pct', operator: '<', value: -Number(m[3]) }) },
];

const AGENT_PATTERNS: Array<{ re: RegExp; agentId: string; agentName: string; task: string }> = [
  { re: /\brca\b|root.?cause/i, agentId: 'engineering', agentName: 'Engineering Agent', task: 'Perform root cause analysis. Identify failure, root cause, business impact, and remediation steps.' },
  { re: /retro|retrospective/i, agentId: 'ops',          agentName: 'Sprint Planner',    task: 'Generate a sprint retrospective: what went well, what to improve, blockers, and action items.' },
  { re: /prioriti/i,            agentId: 'prioritization', agentName: 'Prioritization Agent', task: 'Rank backlog items by impact, effort, and strategic alignment. Return ordered list with rationale.' },
  { re: /prd|product.?requirement|spec.*doc/i, agentId: 'docs', agentName: 'Docs Writer', task: 'Draft a comprehensive PRD with problem statement, user stories, acceptance criteria, and success metrics.' },
  { re: /competitive|competitor|battlecard|market.?intel/i, agentId: 'competitive', agentName: 'Competitive Intel', task: 'Analyze the competitive landscape and generate a battlecard with positioning, differentiators, and objection handling.' },
  { re: /analyz|analysis|insight|data.*report|report.*data/i, agentId: 'analytics', agentName: 'Analytics Agent', task: 'Analyze the data and generate a structured report with key metrics, trends, and actionable insights.' },
  { re: /summar|review.*output|coach/i, agentId: 'review', agentName: 'Review Agent', task: 'Review and summarize the output with structured feedback and recommendations.' },
  { re: /release|launch|go.?no.?go/i, agentId: 'release', agentName: 'Release Manager', task: 'Generate a go/no-go assessment with release checklist, risk flags, and stakeholder sign-off status.' },
];

const OUTPUT_PATTERNS: Array<{ re: RegExp; destination: OutputConfig['destination']; channel?: string }> = [
  { re: /slack|notify|message.*team|send.*message/i, destination: 'slack',       channel: '#product' },
  { re: /notion/i,                                   destination: 'notion' },
  { re: /email/i,                                    destination: 'email' },
  { re: /jira.*ticket|creat.*ticket|new.*ticket/i,   destination: 'jira' },
  { re: /confluence/i,                               destination: 'confluence' },
  { re: /home.?screen|dashboard|alert.*pm/i,         destination: 'home_screen' },
];

// ── Main parse function ───────────────────────────────────────────────────────

export function parseNLWorkflow(input: string): WFGraph {
  // Shortcut: demo workflow for the canonical example
  if (/more than 20 comments?.*jira|jira.*more than 20 comment/i.test(input)) {
    return buildDemoWorkflow();
  }

  let y = 40;
  const nodes: WFNode[] = [];
  const edges: WFEdge[] = [];
  let prevId: string | null = null;
  let edgeIdx = 0;

  function addNode(n: WFNode) {
    nodes.push(n);
    if (prevId) {
      edges.push(edge(`e${++edgeIdx}`, prevId, n.id, { animated: true }));
    }
    prevId = n.id;
    y += (n.type === 'condition' || n.type === 'approval' ? NC : NH) + V_GAP;
  }

  // 1 — Trigger
  const tMatch = TRIGGER_PATTERNS.find(p => p.re.test(input));
  addNode(node('trigger-1', 'trigger', tMatch?.label ?? 'Manual Trigger',
    tMatch?.config ?? ({ type: 'manual' } satisfies TriggerConfig), y));

  if (tMatch?.fetchConfig) {
    addNode(node('fetch-1', 'fetch', `Fetch ${tMatch.config.connector ?? 'data'}`, tMatch.fetchConfig, y));
  }

  // 2 — Condition
  const cMatch = CONDITION_PATTERNS.find(p => p.re.test(input));
  if (cMatch) {
    const m = input.match(cMatch.re)!;
    const expr = cMatch.build(m);
    if (expr) {
      addNode(node('condition-1', 'condition', 'Check Condition', {
        expressions: [expr], logic: 'AND',
      } satisfies ConditionConfig, y));
    }
  }

  // 3 — Agent
  const aMatch = AGENT_PATTERNS.find(p => p.re.test(input));
  if (aMatch) {
    addNode(node('agent-1', 'agent', aMatch.agentName, {
      agentId: aMatch.agentId, agentName: aMatch.agentName, task: aMatch.task,
      contextFields: ['trigger.payload'], outputKey: 'agent_output', requiresApproval: false,
    } satisfies AgentConfig, y));
  }

  // 4 — Approval gate (if mentioned)
  if (/\b(review|approval|approve|pm.*check|sign.?off)\b/i.test(input)) {
    addNode(node('approval-1', 'approval', 'Human Approval', {
      title: 'Review before proceeding',
      description: 'Please review the agent output before continuing the workflow.',
      approverRoles: ['pm', 'pm_lead'], timeoutHours: 24, onTimeout: 'reject',
    } satisfies ApprovalConfig, y));
  }

  // 5 — Output
  const oMatch = OUTPUT_PATTERNS.find(p => p.re.test(input));
  if (oMatch) {
    addNode(node('output-1', 'output', `Send to ${oMatch.destination}`, {
      destination: oMatch.destination,
      template: '{{agent_output.summary}}',
      channel: oMatch.channel,
    } satisfies OutputConfig, y));
  }

  // Nothing matched? Fall back to demo
  if (nodes.length <= 1) return buildDemoWorkflow();

  return { nodes, edges };
}

// ── Plan review derivation ────────────────────────────────────────────────────
// Converts a WFGraph into a structured WorkflowPlanReview for the co-pilot
// Plan Review step. Inspects node types and configs to produce human-readable
// sections and dependency checks.

const CONNECTOR_LABELS: Record<string, string> = {
  jira: 'Jira', github: 'GitHub', amplitude: 'Amplitude',
  notion: 'Notion', slack: 'Slack', confluence: 'Confluence',
  gdrive: 'Google Drive', linear: 'Linear', figma: 'Figma',
};

export function derivePlanReview(graph: WFGraph, input: string): WorkflowPlanReview {
  const { nodes } = graph;

  const triggerNode = nodes.find(n => n.type === 'trigger');
  const fetchNodes  = nodes.filter(n => n.type === 'fetch');
  const condNodes   = nodes.filter(n => n.type === 'condition');
  const agentNodes  = nodes.filter(n => n.type === 'agent');
  const toolNodes   = nodes.filter(n => n.type === 'tool');
  const outputNodes = nodes.filter(n => n.type === 'output');
  const approvalNodes = nodes.filter(n => n.type === 'approval');

  // ── Trigger section
  const tc = triggerNode?.config as TriggerConfig | undefined;
  const triggerSection: WorkflowPlanSection = {
    label: triggerNode?.label ?? 'Unknown trigger',
    value: tc?.event
      ? `Event: ${tc.event}${tc.connector ? ` via ${CONNECTOR_LABELS[tc.connector] ?? tc.connector}` : ''}`
      : tc?.schedule
        ? `Schedule: ${tc.schedule}`
        : tc?.type === 'manual' ? 'Manual / on-demand' : 'Unknown',
    confidence: triggerNode ? 'high' : 'low',
  };

  // ── Data sources
  const dataSources: WorkflowPlanSection[] = fetchNodes.map(n => {
    const c = n.config as FetchConfig;
    return {
      label: CONNECTOR_LABELS[c.connector] ?? c.connector,
      value: `${c.connector}.${c.operation} → fields: ${c.outputFields.join(', ')}`,
      confidence: 'high',
    };
  });

  // ── Conditions
  const conditions: WorkflowPlanSection[] = condNodes.map(n => {
    const c = n.config as ConditionConfig;
    const expr = c.expressions.map(e => `${e.field} ${e.operator} ${e.value}`).join(` ${c.logic} `);
    return { label: n.label, value: expr, confidence: 'high' };
  });

  // ── Agent steps
  const agentSteps: WorkflowPlanSection[] = agentNodes.map(n => {
    const c = n.config as AgentConfig;
    return {
      label: c.agentName,
      value: c.task,
      confidence: 'high',
    };
  });

  // ── Actions (tool nodes + approval gates)
  const actions: WorkflowPlanSection[] = [
    ...toolNodes.map(n => {
      const c = n.config as ToolConfig;
      return {
        label: CONNECTOR_LABELS[c.connector] ?? c.connector,
        value: `${c.connector}.${c.operation} — ${c.description}`,
        confidence: 'high' as const,
      };
    }),
    ...approvalNodes.map(n => {
      const c = n.config as ApprovalConfig;
      return {
        label: 'Human Approval Gate',
        value: `${c.title} — approvers: ${c.approverRoles.join(', ')} — timeout: ${c.timeoutHours}h`,
        confidence: 'high' as const,
      };
    }),
  ];

  // ── Outputs
  const outputs: WorkflowPlanSection[] = outputNodes.map(n => {
    const c = n.config as OutputConfig;
    return {
      label: CONNECTOR_LABELS[c.destination] ?? c.destination,
      value: c.channel ? `${c.destination} ${c.channel}` : c.destination,
      confidence: 'high',
    };
  });

  // ── Collect all connectors used
  const connectorIds = new Set<string>();
  nodes.forEach(n => {
    if (n.type === 'trigger') { const c = n.config as TriggerConfig; if (c.connector) connectorIds.add(c.connector); }
    if (n.type === 'fetch')   { connectorIds.add((n.config as FetchConfig).connector); }
    if (n.type === 'tool')    { connectorIds.add((n.config as ToolConfig).connector); }
    if (n.type === 'output')  { connectorIds.add((n.config as OutputConfig).destination); }
  });

  const connectorDeps: DependencyCheck[] = Array.from(connectorIds).map(id => ({
    type: 'connector',
    id,
    name: CONNECTOR_LABELS[id] ?? id,
    status: ['jira', 'github', 'notion', 'slack'].includes(id) ? 'available' : 'unconfigured',
    actionLabel: ['jira', 'github', 'notion', 'slack'].includes(id) ? undefined : 'Connect',
  }));

  const agentDeps: DependencyCheck[] = agentNodes.map(n => {
    const c = n.config as AgentConfig;
    return { type: 'agent', id: c.agentId, name: c.agentName, status: 'available' };
  });

  // ── Clarifying questions — raised when plan has gaps
  const clarifyingQuestions: ClarifyingQuestion[] = [];
  if (!triggerNode || !tc?.event && !tc?.schedule) {
    clarifyingQuestions.push({
      id: 'q-trigger',
      question: 'What should trigger this workflow?',
      fieldPath: 'trigger',
      inputType: 'select',
      options: ['Jira event', 'GitHub event', 'Amplitude metric', 'Scheduled', 'Manual'],
      required: true,
    });
  }
  if (agentNodes.length === 0 && /analyz|summarize|rca|root.?cause|prioriti|draft|review/i.test(input)) {
    clarifyingQuestions.push({
      id: 'q-agent',
      question: 'Which agent should handle the analysis or reasoning step?',
      fieldPath: 'agentSteps',
      inputType: 'select',
      options: ['Engineering Agent', 'Analytics Agent', 'Docs Writer', 'Prioritization Agent', 'Sprint Planner'],
      required: false,
    });
  }
  if (outputNodes.length === 0) {
    clarifyingQuestions.push({
      id: 'q-output',
      question: 'Where should the workflow send its results?',
      fieldPath: 'outputs',
      inputType: 'select',
      options: ['Slack', 'Notion', 'Confluence', 'Email', 'Jira ticket'],
      required: false,
    });
  }

  // ── Assumptions + missing details
  const assumptions: string[] = [];
  const missingDetails: string[] = [];

  if (tc?.connector === 'jira') assumptions.push('Jira webhook is configured and active for your workspace.');
  if (agentNodes.length > 0)    assumptions.push('Agent will operate on the data available in the workflow context at runtime.');
  if (approvalNodes.length > 0) assumptions.push('Approval request will be sent to the PM Lead role in your workspace.');

  if (condNodes.length === 0 && nodes.length > 2) missingDetails.push('No condition detected — workflow will run on every trigger event.');
  if (outputNodes.length === 0) missingDetails.push('No output destination specified — add a Slack, Notion, or Email step to deliver results.');

  return {
    trigger: triggerSection,
    dataSources,
    conditions,
    agentSteps,
    actions,
    outputs,
    assumptions,
    missingDetails,
    dependencies: [...connectorDeps, ...agentDeps],
    clarifyingQuestions,
  };
}
