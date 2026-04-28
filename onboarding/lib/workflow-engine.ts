/**
 * WorkflowEngine — frontend execution engine.
 *
 * Mirrors the backend execution design exactly:
 * - Topological traversal following edges
 * - Condition evaluation via dot-path context resolution
 * - Approval branching on 'approved' / 'rejected' handles
 * - Callbacks on every state transition (used to drive ReactFlow re-renders)
 *
 * Simulation layer:
 *   Real connectors and LLM calls live in the FastAPI backend.
 *   The frontend engine runs the same graph logic against mock data so PMs
 *   can validate workflow logic before connecting real credentials.
 */

import type {
  WFNode, WFEdge, NodeStatus, LogEntry, WorkflowRun,
  ConditionConfig, AgentConfig, ToolConfig, OutputConfig, FetchConfig, ApprovalConfig,
} from './workflow-types';

// ── Simulated connector payloads ──────────────────────────────────────────────

const MOCK_JIRA_TICKET = {
  ticket_id: 'AUTH-234',
  title: 'Authentication flow breaking on mobile Safari',
  status: 'In Progress',
  priority: 'High',
  assignee: 'Sarah Chen',
  reporter: 'Alex M.',
  comment_count: 23,
  labels: ['bug', 'mobile', 'auth', 'critical'],
  created: '2026-04-01',
};

const MOCK_RCA = {
  summary: 'JWT refresh fails silently on Safari 16.5+ due to localStorage restrictions in private/strict mode',
  rootCause: 'Safari 16.5+ blocks localStorage writes in Intelligent Tracking Prevention mode, causing the token refresh cycle to fail without surfacing an error to the user.',
  impact: 'Affects ~12% of mobile sessions (iOS Safari users). Estimated revenue impact: ~$8,400/month based on conversion drop-off analysis.',
  severity: 'Critical',
  recommendations: [
    'Migrate auth token storage from localStorage to sessionStorage with in-memory fallback',
    'Add explicit try/catch around all storage writes with graceful degradation',
    'Implement a health-check ping on session init to detect storage failures early',
    'Add Amplitude alert: auth_failure_rate > 2% → trigger this workflow automatically',
  ],
  estimatedFix: '3 story points — 1–2 engineering days',
  assignedTo: 'Sarah Chen',
};

const MOCK_SPRINT_SUMMARY = {
  sprint_name: 'Sprint 24 — Auth & Payments',
  velocity: 34,
  completed: 28,
  carry_over: 6,
  team: ['Sarah Chen', 'Alex M.', 'Priya K.', 'Tom B.'],
};

// ── Engine ────────────────────────────────────────────────────────────────────

export type EngineCallbacks = {
  onNodeUpdate: (nodeId: string, status: NodeStatus, output?: unknown) => void;
  onLog: (entry: LogEntry) => void;
};

export class WorkflowEngine {
  private cb: EngineCallbacks;

  constructor(callbacks: EngineCallbacks) {
    this.cb = callbacks;
  }

  async execute(nodes: WFNode[], edges: WFEdge[], triggerPayload?: unknown): Promise<WorkflowRun> {
    const run: WorkflowRun = {
      id: Math.random().toString(36).slice(2, 10),
      status: 'running',
      triggeredAt: Date.now(),
      logs: [],
      context: {
        trigger: triggerPayload ?? { source: 'manual', ts: Date.now() },
        // Pre-seed mock ticket so condition evaluation works immediately
        ticket: MOCK_JIRA_TICKET,
      },
    };

    const trigger = nodes.find(n => n.type === 'trigger');
    if (!trigger) {
      run.status = 'failed';
      return run;
    }

    await this.execNode(trigger.id, nodes, edges, run);

    if (run.status === 'running') run.status = 'completed';
    run.completedAt = Date.now();
    return run;
  }

  private async execNode(
    nodeId: string,
    nodes: WFNode[],
    edges: WFEdge[],
    run: WorkflowRun,
  ): Promise<void> {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    if (node.type === 'end') {
      this.cb.onNodeUpdate(nodeId, 'skipped');
      this.addLog(run, nodeId, node.label, 'skipped', node.label);
      return;
    }

    const t0 = Date.now();
    this.cb.onNodeUpdate(nodeId, 'running');

    try {
      switch (node.type) {
        case 'trigger': {
          await this.delay(350);
          const out = run.context.trigger;
          run.context[nodeId] = out;
          this.markSuccess(run, nodeId, node.label, 'Trigger fired — passing payload to next node', out, t0);
          break;
        }

        case 'fetch': {
          const cfg = node.config as FetchConfig;
          await this.delay(700);
          // Select mock data by connector
          const out = cfg.connector === 'jira' ? MOCK_JIRA_TICKET
            : cfg.connector === 'github' ? { sha: 'abc123', status: 'success', environment: 'production' }
            : cfg.connector === 'amplitude' ? { metric_name: 'activation_rate', current_value: 0.41, threshold: 0.45, change_pct: -8.9 }
            : { result: 'fetched' };
          run.context[nodeId] = out;
          // Also expose under connector name for downstream condition fields
          run.context[cfg.connector] = out;
          if (cfg.connector === 'jira') run.context.ticket = out;
          this.markSuccess(run, nodeId, node.label, `${cfg.connector}.${cfg.operation} returned ${cfg.outputFields.length} fields`, out, t0);
          break;
        }

        case 'condition': {
          await this.delay(180);
          const cfg = node.config as ConditionConfig;
          const result = this.evalCondition(cfg, run.context);
          const branch = result ? 'true' : 'false';
          const out = { result, branch, expressions: cfg.expressions };
          run.context[nodeId] = out;

          const exprStr = cfg.expressions.map(e => `${e.field} ${e.operator} ${e.value}`).join(` ${cfg.logic} `);
          this.markSuccess(run, nodeId, node.label,
            result
              ? `TRUE — ${exprStr} → following true branch`
              : `FALSE — ${exprStr} → following false branch`,
            out, t0);

          // Follow the matching branch
          const next = edges.find(e => e.source === nodeId && e.sourceHandle === branch);
          if (next) await this.execNode(next.target, nodes, edges, run);
          return; // Don't fall through to regular edge traversal
        }

        case 'agent': {
          const cfg = node.config as AgentConfig;
          // Agents take longer — realistic simulation
          await this.delay(2600);
          const out = cfg.agentId === 'engineering' ? MOCK_RCA
            : cfg.agentId === 'ops' ? MOCK_SPRINT_SUMMARY
            : { summary: `${cfg.agentName} completed the task`, outputKey: cfg.outputKey };
          run.context[nodeId] = out;
          run.context[cfg.outputKey] = out;
          this.markSuccess(run, nodeId, node.label, `${cfg.agentName} completed — output stored as "${cfg.outputKey}"`, out, t0);
          break;
        }

        case 'approval': {
          const cfg = node.config as ApprovalConfig;
          await this.delay(1100);
          const out = { approved: true, approvedBy: 'PM Lead', role: 'pm_lead', ts: Date.now() };
          run.context[nodeId] = out;
          run.context.approval = out;
          this.markSuccess(run, nodeId, node.label, `Approved by PM Lead — proceeding`, out, t0);

          // Follow approved branch
          const next = edges.find(e => e.source === nodeId && e.sourceHandle === 'approved');
          if (next) await this.execNode(next.target, nodes, edges, run);
          return;
        }

        case 'tool': {
          const cfg = node.config as ToolConfig;
          await this.delay(850);
          const out = {
            success: true,
            connector: cfg.connector,
            operation: cfg.operation,
            url: cfg.connector === 'notion'
              ? 'https://notion.so/rca-auth-234-abc'
              : `https://${cfg.connector}.example.com/result`,
          };
          run.context[nodeId] = out;
          if (cfg.connector === 'notion') run.context.notion_url = (out as { url: string }).url;
          this.markSuccess(run, nodeId, node.label, `${cfg.connector}.${cfg.operation} executed`, out, t0);
          break;
        }

        case 'output': {
          const cfg = node.config as OutputConfig;
          await this.delay(450);
          const out = {
            success: true,
            destination: cfg.destination,
            channel: cfg.channel ?? null,
            delivered: true,
            previewUrl: cfg.destination === 'slack' ? 'https://slack.com/archives/C01234' : null,
          };
          run.context[nodeId] = out;
          this.markSuccess(run, nodeId, node.label, `Delivered to ${cfg.destination}${cfg.channel ? ` ${cfg.channel}` : ''}`, out, t0);
          break;
        }
      }

      // Regular (non-branching) edge traversal
      const nexts = edges.filter(e => e.source === nodeId && !e.sourceHandle);
      for (const e of nexts) {
        await this.execNode(e.target, nodes, edges, run);
      }

    } catch (err) {
      this.cb.onNodeUpdate(nodeId, 'error');
      this.addLog(run, nodeId, node.label, 'error', `Error: ${(err as Error).message}`, undefined, Date.now() - t0);
      run.status = 'failed';
    }
  }

  // ── Condition evaluator ─────────────────────────────────────────────────────

  private evalCondition(cfg: ConditionConfig, ctx: Record<string, unknown>): boolean {
    const results = cfg.expressions.map(expr => {
      const actual = this.resolvePath(ctx, expr.field);
      switch (expr.operator) {
        case '>':  return Number(actual) > Number(expr.value);
        case '<':  return Number(actual) < Number(expr.value);
        case '>=': return Number(actual) >= Number(expr.value);
        case '<=': return Number(actual) <= Number(expr.value);
        case '==': return actual == expr.value;   // intentional loose equality
        case '!=': return actual != expr.value;
        case 'contains':     return String(actual).toLowerCase().includes(String(expr.value).toLowerCase());
        case 'not_contains': return !String(actual).toLowerCase().includes(String(expr.value).toLowerCase());
        default: return false;
      }
    });
    return cfg.logic === 'AND' ? results.every(Boolean) : results.some(Boolean);
  }

  // Resolves 'ticket.comment_count' against the run context
  private resolvePath(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce<unknown>((cur, key) => {
      if (cur !== null && typeof cur === 'object') return (cur as Record<string, unknown>)[key];
      return undefined;
    }, obj);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private markSuccess(run: WorkflowRun, nodeId: string, label: string, message: string, output: unknown, t0: number) {
    this.cb.onNodeUpdate(nodeId, 'success', output);
    this.addLog(run, nodeId, label, 'success', message, output, Date.now() - t0);
  }

  private addLog(run: WorkflowRun, nodeId: string, nodeLabel: string, status: NodeStatus, message: string, output?: unknown, duration?: number) {
    const entry: LogEntry = {
      id: Math.random().toString(36).slice(2, 10),
      nodeId, nodeLabel, status, message, output,
      ts: Date.now(), duration,
    };
    run.logs.push(entry);
    this.cb.onLog(entry);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}
