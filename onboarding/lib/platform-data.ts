// ── Agent definitions ────────────────────────────────────────────────────────

export type AgentId = 'strategy' | 'docs' | 'analytics' | 'research' | 'ops' | 'review' | 'engineering' | 'competitive' | 'sales' | 'coach' | 'prioritization' | 'release' | 'market';
export type LLMModel = 'claude-opus-4-6' | 'claude-sonnet-4-6' | 'gpt-4o' | 'gemini-1.5-pro' | 'mistral-local';
export type AgentStatus = 'active' | 'inactive' | 'beta';
export type UserRole = 'viewer' | 'pm' | 'pm_lead' | 'admin';

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  fields: { key: string; label: string; placeholder: string; required: boolean }[];
  systemHint: string;
}

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  connector?: string;
  category: 'read' | 'write' | 'notify' | 'compute';
  requiresApproval: boolean;
  enabled: boolean;
}

export interface AgentTrigger {
  id: string;
  type: 'schedule' | 'event' | 'manual';
  label: string;
  description: string;
  schedule?: string;
  event?: string;
  outputDest: 'home_screen' | 'slack' | 'notion' | 'email' | 'confluence';
  enabled: boolean;
}

export interface Agent {
  id: AgentId;
  name: string;
  icon: string;
  description: string;
  color: string;
  bg: string;
  llm: LLMModel;
  temperature: number;
  maxTokens: number;
  minRole: UserRole;
  connectors: string[];
  capabilities: string[];
  status: AgentStatus;
  systemPrompt: string;
  memory: boolean;
  goals: string[];
  guardrails: string[];
  tools: AgentTool[];
  triggers: AgentTrigger[];
  templates: AgentTemplate[];
  recommendedMcps: string[];
  stats: { queries: number; avgLatencyMs: number; satisfactionPct: number; tokensUsed: number };
}

export const AGENTS: Agent[] = [
  {
    id: 'strategy',
    name: 'Strategy Copilot',
    icon: '🎯',
    description: 'Roadmaps, OKRs, 1-pagers, vision docs, and strategic bets. Pressure-tests decisions with frameworks.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    llm: 'claude-opus-4-6',
    temperature: 0.7,
    maxTokens: 4096,
    minRole: 'pm_lead',
    connectors: ['notion', 'gdrive', 'jira', 'confluence'],
    capabilities: ['Roadmap planning', 'OKR definition', 'RICE scoring', 'Stakeholder alignment', 'Vision docs', 'Now/Next/Later'],
    status: 'active',
    systemPrompt: 'You are a product strategy expert. Help PMs define clear product vision, prioritize ruthlessly using frameworks, and communicate strategy to stakeholders. Be direct, data-backed, and challenge assumptions.',
    memory: true,
    goals: [
      'Clarify product vision and north star',
      'Prioritise roadmap items using evidence-based frameworks',
      'Align cross-functional stakeholders on direction',
      'Identify strategic risks before they materialise',
    ],
    recommendedMcps: ['mcp-memory', 'mcp-sequential'],
    guardrails: [
      'NEVER give a recommendation without validating the underlying thesis first',
      'Always challenge assumptions before concluding',
      'End every response with: what needs to be true + biggest risk',
      'Do not recommend a strategy without citing at least one data point or precedent',
    ],
    tools: [
      { id: 'notion_read',    name: 'Read Notion pages',       description: 'Search and read pages from connected Notion workspaces', connector: 'notion',    category: 'read',    requiresApproval: false, enabled: true  },
      { id: 'gdrive_read',    name: 'Read Google Drive files', description: 'Read docs, sheets, and slides from Google Drive',          connector: 'gdrive',    category: 'read',    requiresApproval: false, enabled: true  },
      { id: 'jira_read',      name: 'Read Jira epics',         description: 'Fetch roadmap epics and current sprint data from Jira',    connector: 'jira',      category: 'read',    requiresApproval: false, enabled: true  },
      { id: 'notion_write',   name: 'Push to Notion',          description: 'Create or update a Notion page with strategy output',      connector: 'notion',    category: 'write',   requiresApproval: true,  enabled: true  },
      { id: 'jira_epic',      name: 'Create Jira Epic',        description: 'Create a new Jira epic from a roadmap initiative',         connector: 'jira',      category: 'write',   requiresApproval: true,  enabled: true  },
      { id: 'gdrive_export',  name: 'Export to Google Doc',    description: 'Save strategy doc as a Google Doc',                        connector: 'gdrive',    category: 'write',   requiresApproval: true,  enabled: false },
    ],
    triggers: [
      { id: 'qtr_plan', type: 'schedule', label: 'Quarterly planning digest', description: 'Generate OKR review and strategic priorities for the quarter', schedule: '0 9 1 */3 *', outputDest: 'notion', enabled: false },
      { id: 'roadmap_review', type: 'event', label: 'Roadmap change detected', description: 'When Jira epics are added or removed from the roadmap, run a strategic impact review', event: 'jira_epic_changed', outputDest: 'home_screen', enabled: false },
    ],
    templates: [
      {
        id: 'okr-draft',
        name: 'Draft OKRs',
        description: 'Generate a full OKR set for a quarter',
        fields: [
          { key: 'product_area', label: 'Product area', placeholder: 'e.g. Activation & Onboarding', required: true },
          { key: 'company_goal', label: 'Company goal this quarter', placeholder: 'e.g. Reach $150k MRR', required: true },
          { key: 'current_metrics', label: 'Current baseline metrics', placeholder: 'e.g. Activation 38%, MRR $142k', required: false },
        ],
        systemHint: 'Generate 3-4 objectives with 2-3 measurable key results each. Use SMART criteria.',
      },
      {
        id: 'roadmap-review',
        name: 'Roadmap Review',
        description: 'Critique and improve a product roadmap',
        fields: [
          { key: 'roadmap_items', label: 'Roadmap items (paste or describe)', placeholder: 'List features/initiatives planned', required: true },
          { key: 'company_stage', label: 'Company stage', placeholder: 'e.g. Series B, 50k MAU', required: false },
        ],
        systemHint: 'Review for strategic alignment, resource feasibility, dependencies, and missing bets. Be direct.',
      },
    ],
    stats: { queries: 1847, avgLatencyMs: 2100, satisfactionPct: 91, tokensUsed: 3840000 },
  },
  {
    id: 'docs',
    name: 'Docs Copilot',
    icon: '📄',
    description: 'PRDs, user stories, specs, acceptance criteria, and RFCs. Produces production-ready documents in minutes.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    llm: 'claude-sonnet-4-6',
    temperature: 0.5,
    maxTokens: 8192,
    minRole: 'pm',
    connectors: ['notion', 'confluence', 'gdrive'],
    capabilities: ['PRD generation', 'User stories', 'Acceptance criteria', 'RFC writing', 'Release notes', 'Technical specs'],
    status: 'active',
    systemPrompt: 'You are a senior technical product manager. Write clear, comprehensive product documents. Always include: problem statement, success metrics, user stories with acceptance criteria, edge cases, and open questions.',
    memory: true,
    goals: [
      'Reduce time to first draft by 80%',
      'Enforce consistent document structure across the team',
      'Generate Jira-ready stories from high-level briefs',
      'Maintain living specs that evolve with the product',
    ],
    recommendedMcps: ['mcp-notion', 'mcp-jira', 'mcp-memory'],
    guardrails: [
      'Every PRD must include: Problem, Goals, Non-goals, User stories, Success metrics, Open questions',
      'User stories must follow format: As a [persona], I want [action] so that [benefit]',
      'Never produce a document without a clear success metric',
      'Flag when scope is ambiguous — ask before writing',
    ],
    tools: [
      { id: 'notion_read',    name: 'Read Notion pages',          description: 'Pull existing specs and docs from Notion',                   connector: 'notion',     category: 'read',  requiresApproval: false, enabled: true  },
      { id: 'confluence_read',name: 'Read Confluence pages',      description: 'Pull existing specs from Confluence',                        connector: 'confluence', category: 'read',  requiresApproval: false, enabled: true  },
      { id: 'jira_read',      name: 'Read Jira tickets',          description: 'Read epic context and linked stories from Jira',             connector: 'jira',       category: 'read',  requiresApproval: false, enabled: true  },
      { id: 'notion_write',   name: 'Push PRD to Notion',         description: 'Create a new Notion page with the generated PRD',            connector: 'notion',     category: 'write', requiresApproval: true,  enabled: true  },
      { id: 'jira_stories',   name: 'Generate Jira stories',      description: 'Create Jira user stories and sub-tasks from PRD scope',       connector: 'jira',       category: 'write', requiresApproval: true,  enabled: true  },
      { id: 'confluence_write',name: 'Create Confluence page',    description: 'Publish the spec to a Confluence space',                     connector: 'confluence', category: 'write', requiresApproval: true,  enabled: false },
    ],
    triggers: [
      { id: 'prd_from_epic', type: 'event', label: 'Jira epic created', description: 'When a new Jira epic is created, auto-draft a PRD outline', event: 'jira_epic_created', outputDest: 'notion', enabled: false },
    ],
    templates: [
      {
        id: 'prd',
        name: 'Full PRD',
        description: 'Production-ready PRD with all sections',
        fields: [
          { key: 'feature_name', label: 'Feature name', placeholder: 'e.g. Email Verification Gate', required: true },
          { key: 'problem', label: 'Problem statement', placeholder: 'What pain are we solving, for whom?', required: true },
          { key: 'success_metrics', label: 'Success metrics', placeholder: 'e.g. Activation +5%, churn -1%', required: true },
          { key: 'constraints', label: 'Constraints & dependencies', placeholder: 'Timeline, tech limitations, dependencies', required: false },
        ],
        systemHint: 'Write a complete PRD with: Executive Summary, Problem, Goals, Non-goals, User Stories, AC, Edge Cases, Analytics, Open Questions.',
      },
      {
        id: 'user-stories',
        name: 'User Story Batch',
        description: 'Generate Jira-ready user stories',
        fields: [
          { key: 'epic', label: 'Epic / feature area', placeholder: 'e.g. Onboarding redesign', required: true },
          { key: 'personas', label: 'User personas', placeholder: 'e.g. New PM, Enterprise admin', required: true },
          { key: 'scope', label: 'Scope description', placeholder: 'What should this epic cover?', required: true },
        ],
        systemHint: 'Generate 8-12 user stories in format: As a [persona], I want [action] so that [benefit]. Include acceptance criteria for each.',
      },
    ],
    stats: { queries: 3204, avgLatencyMs: 1800, satisfactionPct: 94, tokensUsed: 8200000 },
  },
  {
    id: 'analytics',
    name: 'Analytics Copilot',
    icon: '📊',
    description: 'Metrics analysis, RCA, A/B test interpretation, KPI dashboards, and anomaly investigation.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    llm: 'claude-opus-4-6',
    temperature: 0.3,
    maxTokens: 4096,
    minRole: 'viewer',
    connectors: ['gdrive', 'notion'],
    capabilities: ['Metric interpretation', 'A/B test analysis', 'Anomaly detection', 'RCA', 'KPI dashboards', 'Cohort analysis'],
    status: 'active',
    systemPrompt: 'You are a data-driven product analyst. Interpret metrics rigorously. Always: state what the data shows, what it means for the product, what\'s missing, and what action to take. Flag when data is insufficient.',
    memory: false,
    goals: [
      'Surface anomalies before they become incidents',
      'Turn raw metrics into actionable decisions',
      'Interpret A/B results with statistical rigour',
      'Build shared understanding of product health',
    ],
    recommendedMcps: ['mcp-postgres', 'mcp-sequential'],
    guardrails: [
      'NEVER interpret a metric without comparing to baseline or previous period',
      'Always flag when sample size is too small to draw conclusions',
      'Do not recommend shipping based on analytics alone — say what additional validation is needed',
      'State confidence level explicitly when making predictions',
    ],
    tools: [
      { id: 'gdrive_read',  name: 'Read GDrive reports',    description: 'Pull historical metric reports from Google Drive',         connector: 'gdrive',  category: 'read',    requiresApproval: false, enabled: true  },
      { id: 'notion_read',  name: 'Read Notion dashboards', description: 'Access metric notes and KPI docs in Notion',               connector: 'notion',  category: 'read',    requiresApproval: false, enabled: true  },
      { id: 'alert_create', name: 'Create metric alert',    description: 'Post an anomaly alert card to the home screen',            connector: undefined, category: 'notify',  requiresApproval: false, enabled: true  },
      { id: 'notion_write', name: 'Save analysis to Notion',description: 'Write the metric analysis as a Notion page',              connector: 'notion',  category: 'write',   requiresApproval: true,  enabled: false },
    ],
    triggers: [
      { id: 'daily_digest', type: 'schedule', label: 'Daily metrics digest', description: 'Summarise key KPIs every morning and post to home screen', schedule: '0 8 * * 1-5', outputDest: 'home_screen', enabled: true },
      { id: 'anomaly_scan', type: 'schedule', label: 'Anomaly detection scan', description: 'Check for metric anomalies and alert if threshold crossed', schedule: '0 */4 * * *', outputDest: 'slack', enabled: false },
    ],
    templates: [
      {
        id: 'rca',
        name: 'Root Cause Analysis',
        description: 'Structured RCA from metrics drop',
        fields: [
          { key: 'metric', label: 'Metric that dropped', placeholder: 'e.g. Activation rate', required: true },
          { key: 'change', label: 'Change magnitude & date', placeholder: 'e.g. -8% starting April 14', required: true },
          { key: 'recent_changes', label: 'Recent product changes', placeholder: 'Releases, experiments, config changes', required: false },
          { key: 'segments', label: 'Affected segments (if known)', placeholder: 'e.g. Enterprise users, iOS', required: false },
        ],
        systemHint: 'Structure: What changed → Expected vs actual → Signal correlation → Root cause hypotheses (ranked) → Immediate actions → Long-term fixes.',
      },
      {
        id: 'ab-read',
        name: 'A/B Test Readout',
        description: 'Interpret experiment results and recommend action',
        fields: [
          { key: 'hypothesis', label: 'Test hypothesis', placeholder: 'e.g. Showing social proof increases activation', required: true },
          { key: 'results', label: 'Results (paste metrics)', placeholder: 'Control vs variant numbers', required: true },
          { key: 'sample_size', label: 'Sample size & duration', placeholder: 'e.g. 5k users, 14 days', required: true },
        ],
        systemHint: 'Assess statistical significance, effect size, segment breakdowns, and give a clear ship/iterate/kill recommendation with reasoning.',
      },
    ],
    stats: { queries: 2891, avgLatencyMs: 2400, satisfactionPct: 88, tokensUsed: 6100000 },
  },
  {
    id: 'research',
    name: 'Research Copilot',
    icon: '🔍',
    description: 'Customer feedback synthesis, NPS analysis, churn signals, interview prep, and competitive research.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    llm: 'claude-sonnet-4-6',
    temperature: 0.6,
    maxTokens: 4096,
    minRole: 'pm',
    connectors: ['notion', 'gdrive', 'slack'],
    capabilities: ['Feedback synthesis', 'NPS analysis', 'Churn signals', 'Interview scripts', 'Survey design', 'Theme clustering'],
    status: 'active',
    systemPrompt: 'You are a user research expert. Synthesize qualitative and quantitative feedback into actionable product insights. Always separate signal from noise and provide evidence for every claim.',
    memory: true,
    goals: [
      'Synthesise qualitative signal at scale',
      'Identify top customer pain points from unstructured feedback',
      'Design surveys that yield high-quality, unbiased data',
      'Track evolving user needs across cohorts',
    ],
    recommendedMcps: ['mcp-memory', 'mcp-browser'],
    guardrails: [
      'Always cite source count ("17 of 43 responses mention X") — never extrapolate beyond data',
      'Distinguish signal from noise explicitly in every synthesis',
      'Do not design survey questions that lead the respondent',
      'Flag when qualitative themes are not statistically significant',
    ],
    tools: [
      { id: 'notion_read',  name: 'Read Notion research',   description: 'Pull past research docs and interview notes from Notion', connector: 'notion', category: 'read',  requiresApproval: false, enabled: true  },
      { id: 'gdrive_read',  name: 'Read Drive files',       description: 'Access survey exports and feedback CSVs in Google Drive', connector: 'gdrive', category: 'read',  requiresApproval: false, enabled: true  },
      { id: 'slack_read',   name: 'Read Slack feedback',    description: 'Search customer-facing Slack channels for signals',      connector: 'slack',  category: 'read',  requiresApproval: false, enabled: true  },
      { id: 'notion_write', name: 'Save insight to Notion', description: 'Write a structured insight report to Notion',            connector: 'notion', category: 'write', requiresApproval: true,  enabled: true  },
    ],
    triggers: [
      { id: 'weekly_nps', type: 'schedule', label: 'Weekly NPS digest', description: 'Synthesise NPS responses from the past 7 days every Monday', schedule: '0 9 * * 1', outputDest: 'notion', enabled: false },
    ],
    templates: [
      {
        id: 'nps-analysis',
        name: 'NPS Analysis',
        description: 'Analyze NPS responses and extract themes',
        fields: [
          { key: 'responses', label: 'NPS responses (paste verbatims)', placeholder: 'Paste detractor/passive/promoter responses', required: true },
          { key: 'score', label: 'Overall NPS score', placeholder: 'e.g. 61', required: false },
          { key: 'segment', label: 'Segment filter (optional)', placeholder: 'e.g. Enterprise, churned users', required: false },
        ],
        systemHint: 'Cluster into themes, quantify each, extract top 3 detractor reasons and top 3 promoter drivers. End with prioritized action list.',
      },
      {
        id: 'survey-builder',
        name: 'Survey Builder',
        description: 'Design NPS/CSAT survey questions',
        fields: [
          { key: 'objective', label: 'Survey objective', placeholder: 'e.g. Understand activation friction', required: true },
          { key: 'audience', label: 'Target audience', placeholder: 'e.g. Users who completed onboarding < 7 days ago', required: true },
          { key: 'max_questions', label: 'Max questions', placeholder: 'e.g. 5', required: false },
        ],
        systemHint: 'Design unbiased questions. Include: NPS question, 2-3 driver questions, 1 open-ended. Keep total time under 2 minutes.',
      },
    ],
    stats: { queries: 1523, avgLatencyMs: 1900, satisfactionPct: 92, tokensUsed: 3200000 },
  },
  {
    id: 'ops',
    name: 'Ops Copilot',
    icon: '⚡',
    description: 'Daily standups, sprint summaries, meeting notes, release comms, and routine PM automation.',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    llm: 'claude-sonnet-4-6',
    temperature: 0.6,
    maxTokens: 2048,
    minRole: 'pm',
    connectors: ['jira', 'slack', 'gcalendar'],
    capabilities: ['Standup generation', 'Sprint summaries', 'Meeting notes', 'Release comms', 'Task triage', 'Status updates'],
    status: 'active',
    systemPrompt: 'You are a PM operations assistant. Be concise, bullet-point-first, and action-oriented. Every output should save time, not add process.',
    memory: false,
    goals: [
      'Keep sprint ceremonies efficient and documented',
      'Produce standup updates that save time',
      'Surface blockers before they stall delivery',
      'Close every sprint with a structured retro',
    ],
    recommendedMcps: ['mcp-jira', 'mcp-slack'],
    guardrails: [
      'Never produce output longer than needed — if it can be a bullet list, make it one',
      'Always pull live Jira data before generating sprint summaries',
      'Format for the specific audience (stakeholder ≠ engineering ≠ leadership)',
      'Do not invent status updates — ask for information you don\'t have',
    ],
    tools: [
      { id: 'jira_read',    name: 'Read Jira sprint',      description: 'Fetch current sprint tickets, status, and blockers',       connector: 'jira',      category: 'read',   requiresApproval: false, enabled: true  },
      { id: 'slack_post',   name: 'Post to Slack',         description: 'Send standup or sprint update to a configured Slack channel', connector: 'slack',    category: 'notify', requiresApproval: true,  enabled: true  },
      { id: 'notion_write', name: 'Write to Notion',       description: 'Save sprint summaries and meeting notes to Notion',         connector: 'notion',    category: 'write',  requiresApproval: true,  enabled: false },
      { id: 'confluence_write', name: 'Write to Confluence', description: 'Publish retro or sprint notes to Confluence',            connector: 'confluence', category: 'write',  requiresApproval: true,  enabled: false },
      { id: 'jira_update',  name: 'Update Jira sprint',    description: 'Move tickets or update sprint state in Jira',              connector: 'jira',       category: 'write',  requiresApproval: true,  enabled: false },
    ],
    triggers: [
      { id: 'daily_standup', type: 'schedule', label: 'Daily standup', description: 'Generate and post standup update every weekday morning', schedule: '0 9 * * 1-5', outputDest: 'slack', enabled: false },
      { id: 'sprint_end',    type: 'event',    label: 'Sprint end summary', description: 'Auto-generate sprint summary when Jira sprint is closed', event: 'jira_sprint_closed', outputDest: 'notion', enabled: false },
    ],
    templates: [
      {
        id: 'sprint-summary',
        name: 'Sprint Summary',
        description: 'End-of-sprint summary for stakeholders',
        fields: [
          { key: 'sprint_name', label: 'Sprint name', placeholder: 'e.g. Sprint 24 — Activation', required: true },
          { key: 'shipped', label: 'What shipped', placeholder: 'List completed stories/features', required: true },
          { key: 'spillover', label: 'Spillover (if any)', placeholder: 'What didn\'t make it and why', required: false },
          { key: 'next_sprint', label: 'Next sprint preview', placeholder: 'Top priorities for next sprint', required: false },
        ],
        systemHint: 'Format: 3-sentence executive summary, shipped items (bulleted), spillover with reason, metrics impact if any, next sprint preview.',
      },
      {
        id: 'standup',
        name: 'Daily Standup',
        description: 'Generate daily standup update',
        fields: [
          { key: 'yesterday', label: 'What I did yesterday', placeholder: 'Key tasks completed', required: true },
          { key: 'today', label: 'What I\'m doing today', placeholder: 'Key tasks planned', required: true },
          { key: 'blockers', label: 'Blockers (if any)', placeholder: 'What\'s blocking progress', required: false },
        ],
        systemHint: 'Write a crisp standup in under 100 words. Lead with impact, not tasks.',
      },
    ],
    stats: { queries: 4102, avgLatencyMs: 1200, satisfactionPct: 96, tokensUsed: 4800000 },
  },
  {
    id: 'engineering',
    name: 'Engineering Copilot',
    icon: '🔧',
    description: 'Tech gap analysis, feasibility assessment, architecture reviews, and hiring briefs for engineering roles.',
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    llm: 'claude-opus-4-6',
    temperature: 0.4,
    maxTokens: 4096,
    minRole: 'pm_lead',
    connectors: ['jira', 'confluence', 'notion'],
    capabilities: ['Tech gap analysis', 'Feasibility review', 'Hiring briefs', 'Architecture review', 'Debt assessment', 'Skills matrix'],
    status: 'beta',
    systemPrompt: 'You are a staff-level PM who deeply understands engineering. Help PMs assess technical feasibility, identify team skill gaps, and communicate with engineering leadership effectively.',
    memory: true,
    goals: [
      'Translate product requirements into engineering-ready briefs',
      'Reduce back-and-forth between PM and engineering',
      'Generate technical scoping estimates',
      'Document incidents with clear root-cause structure',
    ],
    recommendedMcps: ['mcp-github', 'mcp-jira', 'mcp-sequential'],
    guardrails: [
      'NEVER approve a technical approach without flagging at least one risk or open question',
      'Always give complexity estimates as a range (S/M/L/XL), never a single number',
      'Ask clarifying questions before estimating scope — never give a number without knowing the full scope',
      'Flag hidden dependencies and integration risks explicitly',
    ],
    tools: [
      { id: 'jira_read',       name: 'Read Jira tickets',     description: 'Read engineering tickets, estimates, and blockers',      connector: 'jira',       category: 'read',  requiresApproval: false, enabled: true  },
      { id: 'confluence_read', name: 'Read Confluence docs',  description: 'Access architecture docs and tech specs in Confluence',  connector: 'confluence', category: 'read',  requiresApproval: false, enabled: true  },
      { id: 'notion_read',     name: 'Read Notion specs',     description: 'Access product specs linked to engineering work',        connector: 'notion',     category: 'read',  requiresApproval: false, enabled: true  },
      { id: 'jira_comment',    name: 'Add Jira comment',      description: 'Add technical notes or flag blockers on Jira tickets',   connector: 'jira',       category: 'write', requiresApproval: true,  enabled: true  },
      { id: 'confluence_write',name: 'Create architecture doc',description: 'Generate and save an architecture doc to Confluence',   connector: 'confluence', category: 'write', requiresApproval: true,  enabled: false },
    ],
    triggers: [
      { id: 'prd_to_eng', type: 'event', label: 'PRD moved to engineering review', description: 'When a PRD artifact status changes to "In Review", run a technical gap analysis', event: 'artifact_in_review', outputDest: 'home_screen', enabled: false },
    ],
    templates: [
      {
        id: 'tech-gap',
        name: 'Tech Gap Analysis',
        description: 'Assess team skills vs roadmap requirements',
        fields: [
          { key: 'roadmap', label: 'Q3/Q4 roadmap initiatives', placeholder: 'List planned technical initiatives', required: true },
          { key: 'team', label: 'Current team skills', placeholder: 'e.g. React, Python, Postgres — strong; ML — none', required: true },
          { key: 'timeline', label: 'Timeline', placeholder: 'e.g. Need to ship by Q3', required: false },
        ],
        systemHint: 'Map roadmap requirements to skills, identify gaps, recommend: hire vs upskill vs partner/buy. Include rough timelines.',
      },
    ],
    stats: { queries: 412, avgLatencyMs: 2800, satisfactionPct: 87, tokensUsed: 980000 },
  },
  {
    id: 'competitive',
    name: 'Competitive Intel',
    icon: '🏆',
    description: 'Battlecards, competitor analysis, market positioning, win/loss analysis, and weekly market sweeps.',
    color: 'text-red-600',
    bg: 'bg-red-50',
    llm: 'claude-opus-4-6',
    temperature: 0.5,
    maxTokens: 4096,
    minRole: 'pm_lead',
    connectors: ['gdrive', 'notion'],
    capabilities: ['Battlecards', 'Competitor profiles', 'Win/loss analysis', 'Market positioning', 'Feature comparison', 'Weekly sweeps'],
    status: 'beta',
    systemPrompt: 'You are a competitive intelligence analyst for a SaaS PM tool. Research competitors rigorously, identify strategic opportunities, and help PMs win deals and out-innovate the market.',
    memory: true,
    goals: [
      'Maintain up-to-date competitive intelligence',
      'Equip sales with accurate, current battlecards',
      'Identify whitespace opportunities vs competitors',
      'Track competitive moves and respond proactively',
    ],
    recommendedMcps: ['mcp-browser', 'mcp-puppeteer', 'mcp-memory'],
    guardrails: [
      'NEVER make claims about a competitor without a verifiable source or date',
      'Structure all competitive output as: What changed → Why it matters → What we should do',
      'Always distinguish between confirmed facts and public signals/speculation',
      'Do not recommend a positioning change without showing the competitive evidence',
    ],
    tools: [
      { id: 'notion_read',   name: 'Read Notion battlecards', description: 'Pull existing battlecards and competitive notes from Notion', connector: 'notion',  category: 'read',  requiresApproval: false, enabled: true  },
      { id: 'gdrive_read',   name: 'Read GDrive market docs', description: 'Access market research and competitive analysis files',       connector: 'gdrive',  category: 'read',  requiresApproval: false, enabled: true  },
      { id: 'notion_write',  name: 'Update battlecard',       description: 'Create or update a competitor battlecard page in Notion',     connector: 'notion',  category: 'write', requiresApproval: true,  enabled: true  },
      { id: 'alert_create',  name: 'Create competitive alert',description: 'Post a competitive change alert to the home screen',          connector: undefined, category: 'notify',requiresApproval: false, enabled: true  },
    ],
    triggers: [
      { id: 'weekly_sweep', type: 'schedule', label: 'Weekly competitive sweep', description: 'Scan for competitor launches, pricing changes, and job postings every Monday', schedule: '0 9 * * 1', outputDest: 'notion', enabled: false },
    ],
    templates: [
      {
        id: 'battlecard',
        name: 'Battlecard',
        description: 'Generate a sales battlecard vs a competitor',
        fields: [
          { key: 'competitor', label: 'Competitor name', placeholder: 'e.g. Productboard, Notion, Aha!', required: true },
          { key: 'our_strengths', label: 'Our key strengths', placeholder: 'What we do better', required: false },
          { key: 'deal_context', label: 'Deal context (optional)', placeholder: 'e.g. Enterprise prospect, 200 seats', required: false },
        ],
        systemHint: 'Format: 30-second pitch, where we win, where we lose, how to handle top 5 objections, proof points.',
      },
    ],
    stats: { queries: 334, avgLatencyMs: 3100, satisfactionPct: 85, tokensUsed: 720000 },
  },
  {
    id: 'sales',
    name: 'Sales Enablement',
    icon: '💼',
    description: 'Sales collateral, one-pagers, ROI narratives, objection handling, and auto-generated enablement from PRDs.',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    llm: 'claude-sonnet-4-6',
    temperature: 0.6,
    maxTokens: 4096,
    minRole: 'pm',
    connectors: ['gdrive', 'notion'],
    capabilities: ['One-pagers', 'ROI narratives', 'Objection handling', 'Demo scripts', 'Feature announcements', 'Case studies'],
    status: 'beta',
    systemPrompt: 'You are a product marketing expert writing for B2B SaaS sales. Create compelling, accurate collateral that converts. Always lead with value, not features.',
    memory: false,
    goals: [
      'Enable sales to articulate product value clearly',
      'Generate personalised collateral for enterprise prospects',
      'Translate PRDs into buyer-facing language',
      'Produce ROI narratives grounded in real metrics',
    ],
    recommendedMcps: ['mcp-notion', 'mcp-gdrive'],
    guardrails: [
      'NEVER overpromise — only describe capabilities the product actually has today',
      'Always lead with customer outcome, not product feature',
      'Do not produce collateral without knowing the target buyer persona',
      'Flag when a claim needs a proof point or customer quote to be credible',
    ],
    tools: [
      { id: 'notion_read',  name: 'Read Notion content',    description: 'Pull product docs, battlecards, and case studies from Notion', connector: 'notion', category: 'read',  requiresApproval: false, enabled: true  },
      { id: 'gdrive_read',  name: 'Read GDrive assets',     description: 'Access existing sales decks and one-pagers in Google Drive',   connector: 'gdrive', category: 'read',  requiresApproval: false, enabled: true  },
      { id: 'gdrive_write', name: 'Export to Google Doc',   description: 'Save generated collateral as a Google Doc',                    connector: 'gdrive', category: 'write', requiresApproval: true,  enabled: true  },
      { id: 'notion_write', name: 'Save to Notion',         description: 'Publish the collateral to a Notion page',                      connector: 'notion', category: 'write', requiresApproval: true,  enabled: false },
    ],
    triggers: [
      { id: 'new_prd_collateral', type: 'event', label: 'PRD published', description: 'Auto-generate a feature one-pager when a new PRD is published', event: 'artifact_published', outputDest: 'notion', enabled: false },
    ],
    templates: [
      {
        id: 'one-pager',
        name: 'Feature One-Pager',
        description: 'Sales one-pager for a new feature',
        fields: [
          { key: 'feature', label: 'Feature name', placeholder: 'e.g. AI Sprint Planner', required: true },
          { key: 'persona', label: 'Target buyer persona', placeholder: 'e.g. VP Product at Series B startup', required: true },
          { key: 'key_value', label: 'Key value proposition', placeholder: 'What pain does it solve?', required: true },
          { key: 'proof', label: 'Proof points (if any)', placeholder: 'Metrics, customer quotes, case studies', required: false },
        ],
        systemHint: 'Format: Headline (pain-led), 3 bullet benefits, how it works (2 sentences), proof point, CTA.',
      },
    ],
    stats: { queries: 621, avgLatencyMs: 1700, satisfactionPct: 89, tokensUsed: 1340000 },
  },
  {
    id: 'review',
    name: 'Review Agent',
    icon: '🔍',
    description: 'PRD review, spec review, design brief review, and structured quality checks. Flags ambiguities and blockers.',
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    llm: 'claude-sonnet-4-6',
    temperature: 0.4,
    maxTokens: 4096,
    minRole: 'pm',
    connectors: ['notion', 'jira', 'confluence'],
    capabilities: ['PRD review', 'Spec review', 'Quality checks', 'Ambiguity flagging', 'Release notes', 'Changelog'],
    status: 'active',
    systemPrompt: 'You are a senior PM reviewer. Evaluate documents with a structured framework: strengths, gaps, blockers, recommendations. Always flag ambiguities and missing success metrics.',
    memory: false,
    goals: [
      'Ensure high-quality delivery documentation',
      'Flag ambiguities before they reach engineering',
      'Generate release notes from tickets and commits',
      'Close the loop on every sprint with structured feedback',
    ],
    recommendedMcps: ['mcp-github', 'mcp-notion'],
    guardrails: [
      'Always use the structured review format: Strengths / Gaps / Blockers / Recommendations',
      'Flag every ambiguity — do not assume intent',
      'Never approve a spec without confirmed success metrics',
      'Be direct: if a document is not ready to ship, say so explicitly',
    ],
    tools: [
      { id: 'notion_read',     name: 'Read Notion docs',      description: 'Pull docs for review from Notion',                          connector: 'notion',     category: 'read',  requiresApproval: false, enabled: true  },
      { id: 'confluence_read', name: 'Read Confluence specs',  description: 'Access specs from Confluence for review',                   connector: 'confluence', category: 'read',  requiresApproval: false, enabled: true  },
      { id: 'jira_comment',    name: 'Post review to Jira',    description: 'Add review comments directly to the Jira ticket',           connector: 'jira',       category: 'write', requiresApproval: true,  enabled: true  },
      { id: 'notion_write',    name: 'Add review to Notion',   description: 'Append structured review feedback to a Notion page',        connector: 'notion',     category: 'write', requiresApproval: true,  enabled: false },
    ],
    triggers: [
      { id: 'artifact_review', type: 'event', label: 'Document moved to review', description: 'When a PRD or spec is marked "In Review", run an auto quality check', event: 'artifact_in_review', outputDest: 'home_screen', enabled: false },
    ],
    templates: [
      {
        id: 'prd-review',
        name: 'PRD Review',
        description: 'Structured quality check for a PRD',
        fields: [
          { key: 'prd_content', label: 'PRD content (paste or link)', placeholder: 'Paste the PRD text or Notion URL', required: true },
          { key: 'reviewer_context', label: 'Your review focus', placeholder: 'e.g. Engineering feasibility, scope clarity', required: false },
        ],
        systemHint: 'Review format: 3 strengths, 3 gaps, any blockers, prioritised recommendations. Be specific and cite the document.',
      },
    ],
    stats: { queries: 892, avgLatencyMs: 1900, satisfactionPct: 90, tokensUsed: 1780000 },
  },
  {
    id: 'coach',
    name: 'PM Coach',
    icon: '🎓',
    description: 'Career development, framework guidance, interview prep, and performance reviews. Coaches through questions.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    llm: 'claude-opus-4-6',
    temperature: 0.7,
    maxTokens: 4096,
    minRole: 'pm',
    connectors: [],
    capabilities: ['Career planning', 'Interview prep', 'STAR stories', 'Promotion support', 'Skill gaps', 'Framework coaching'],
    status: 'active',
    systemPrompt: 'You are a senior PM coach with 15 years of experience. You coach through questions — never just give an answer. Ask: What\'s the goal? What have you tried? What does data say? Teach frameworks by applying them to real situations.',
    memory: true,
    goals: [
      'Accelerate PM professional development',
      'Create structured growth plans with measurable milestones',
      'Deliver calibration-grade performance feedback',
      'Help PMs prepare for promotion conversations',
    ],
    recommendedMcps: ['mcp-memory'],
    guardrails: [
      'Coach through questions — never just give the answer',
      'Apply frameworks to the user\'s specific situation, never explain them abstractly',
      'Give direct, honest feedback even when uncomfortable',
      'Do not validate poor reasoning — challenge it constructively',
    ],
    tools: [],
    triggers: [],
    templates: [
      {
        id: 'promo-doc',
        name: 'Promotion Document',
        description: 'Draft a PM promotion case',
        fields: [
          { key: 'current_level', label: 'Current level', placeholder: 'e.g. PM2, Senior PM', required: true },
          { key: 'target_level', label: 'Target level', placeholder: 'e.g. Staff PM, PM Lead', required: true },
          { key: 'key_wins', label: 'Key wins and impact', placeholder: 'List your biggest contributions this cycle', required: true },
        ],
        systemHint: 'Structure as: Executive summary, Impact evidence (with metrics), Leadership examples, Growth areas, Ask.',
      },
    ],
    stats: { queries: 731, avgLatencyMs: 2200, satisfactionPct: 95, tokensUsed: 1620000 },
  },
  {
    id: 'prioritization',
    name: 'Prioritization Agent',
    icon: '⚖️',
    description: 'Cross-context prioritization using strategic alignment, user impact, business value, effort, and risk scoring.',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    llm: 'claude-opus-4-6',
    temperature: 0.3,
    maxTokens: 4096,
    minRole: 'pm_lead',
    connectors: ['jira', 'notion', 'gdrive'],
    capabilities: ['RICE scoring', 'Multi-factor ranking', 'Trade-off analysis', 'OKR alignment', 'Effort estimation', 'Risk assessment'],
    status: 'beta',
    systemPrompt: 'You are a prioritization engine. Rank requests using: strategic alignment, user impact, business value, engineering effort, risk. NEVER give a ranking without showing your full scoring breakdown.',
    memory: false,
    goals: [
      'Rank competing requests with evidence-based scoring',
      'Surface hidden trade-offs before committing to scope',
      'Challenge assumptions behind the team\'s favourite features',
      'Keep roadmap aligned to OKRs every sprint',
    ],
    recommendedMcps: ['mcp-jira', 'mcp-sequential'],
    guardrails: [
      'NEVER give a ranking without showing the full scoring breakdown',
      'If data is missing to score confidently, ask for it before ranking',
      'Always challenge the stakeholder\'s favourite — explain why if it ranks low',
      'Show your work: score, weight, rationale for each factor',
    ],
    tools: [
      { id: 'jira_read',    name: 'Read Jira backlog',      description: 'Pull the full backlog and estimates from Jira',              connector: 'jira',   category: 'read',  requiresApproval: false, enabled: true  },
      { id: 'notion_read',  name: 'Read roadmap context',   description: 'Read strategic context and OKRs from Notion',               connector: 'notion', category: 'read',  requiresApproval: false, enabled: true  },
      { id: 'jira_update',  name: 'Update Jira priority',   description: 'Set priority field and add rationale comment in Jira',      connector: 'jira',   category: 'write', requiresApproval: true,  enabled: true  },
    ],
    triggers: [
      { id: 'sales_request', type: 'event', label: 'Sales feature request', description: 'When a sales feature request ticket is created, auto-score it against the backlog', event: 'jira_issue_created', outputDest: 'home_screen', enabled: false },
    ],
    templates: [
      {
        id: 'rank-features',
        name: 'Rank Features',
        description: 'Score and rank a list of backlog items',
        fields: [
          { key: 'features', label: 'Features to rank (list)', placeholder: 'Paste 3-10 feature names or descriptions', required: true },
          { key: 'okrs', label: 'Current OKRs', placeholder: 'What are you optimising for this quarter?', required: true },
          { key: 'constraints', label: 'Constraints', placeholder: 'e.g. 2 engineers, 6 weeks, no infra changes', required: false },
        ],
        systemHint: 'Score each on 0-10: strategic alignment, user impact, biz value, effort (inverted), risk (inverted). Show ranking table + key trade-offs.',
      },
    ],
    stats: { queries: 289, avgLatencyMs: 2600, satisfactionPct: 86, tokensUsed: 640000 },
  },
  {
    id: 'release',
    name: 'Release Manager',
    icon: '🚀',
    description: 'Go/no-go decisions, UAT checklists, release notes, rollback planning, and stakeholder comms for every release.',
    color: 'text-green-600',
    bg: 'bg-green-50',
    llm: 'claude-sonnet-4-6',
    temperature: 0.3,
    maxTokens: 4096,
    minRole: 'pm_lead',
    connectors: ['jira', 'slack', 'notion', 'confluence'],
    capabilities: ['Go/no-go decisions', 'UAT checklists', 'Release notes', 'Rollback planning', 'Stakeholder comms', 'Version tracking'],
    status: 'beta',
    systemPrompt: 'You are a release manager. Track what\'s in the release, the risk level, who needs to sign off, and what the go-to-market plan is. NEVER approve a release without a rollback plan.',
    memory: false,
    goals: [
      'Make every go/no-go decision traceable and documented',
      'Ensure rollback plans exist before any release ships',
      'Generate release notes that serve both internal and external audiences',
      'Coordinate UAT sign-off across all stakeholders',
    ],
    recommendedMcps: ['mcp-github', 'mcp-jira', 'mcp-slack'],
    guardrails: [
      'NEVER approve go/no-go without a confirmed rollback plan',
      'Flag every open blocker before go/no-go — do not minimise risk',
      'Always generate release notes with: what changed, who is affected, how to roll back',
      'Require explicit sign-off from all stakeholders before marking as approved',
    ],
    tools: [
      { id: 'jira_read',       name: 'Read Jira release',       description: 'Fetch all tickets merged in the release version',             connector: 'jira',       category: 'read',   requiresApproval: false, enabled: true  },
      { id: 'notion_write',    name: 'Create release notes',    description: 'Publish generated release notes to Notion',                    connector: 'notion',     category: 'write',  requiresApproval: true,  enabled: true  },
      { id: 'slack_post',      name: 'Post Slack announcement', description: 'Send release announcement to configured Slack channel',        connector: 'slack',      category: 'notify', requiresApproval: true,  enabled: true  },
      { id: 'confluence_write',name: 'Create UAT checklist',    description: 'Generate and publish a UAT checklist to Confluence',           connector: 'confluence', category: 'write',  requiresApproval: true,  enabled: false },
    ],
    triggers: [
      { id: 'pre_release', type: 'event', label: 'Release branch created', description: 'When a GitHub release branch is cut, auto-generate UAT checklist and go/no-go template', event: 'deployment_started', outputDest: 'notion', enabled: false },
    ],
    templates: [
      {
        id: 'go-nogo',
        name: 'Go / No-Go Decision',
        description: 'Structured release readiness assessment',
        fields: [
          { key: 'release_name', label: 'Release name / version', placeholder: 'e.g. v2.4.1 — Mobile onboarding', required: true },
          { key: 'whats_in_it', label: "What's included", placeholder: 'List features, bug fixes, or Jira tickets', required: true },
          { key: 'open_issues', label: 'Open issues or risks', placeholder: 'Any known bugs, incomplete tests, dependency risks', required: false },
          { key: 'rollback_plan', label: 'Rollback plan', placeholder: 'How to revert if something breaks', required: true },
        ],
        systemHint: 'Output: Go / No-Go decision with rationale, open blockers (if any), UAT checklist (3-7 items), rollback steps, stakeholder sign-off table.',
      },
    ],
    stats: { queries: 201, avgLatencyMs: 2100, satisfactionPct: 88, tokensUsed: 420000 },
  },
  {
    id: 'market',
    name: 'Market Intelligence',
    icon: '🌐',
    description: 'TAM/SAM/SOM analysis, industry trends, analyst report synthesis, and macro signals affecting product strategy.',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    llm: 'claude-opus-4-6',
    temperature: 0.5,
    maxTokens: 6144,
    minRole: 'pm_lead',
    connectors: ['gdrive', 'notion'],
    capabilities: ['TAM/SAM/SOM', 'Market sizing', 'Industry trends', 'Analyst synthesis', 'Macro signals', 'Growth modelling'],
    status: 'beta',
    systemPrompt: 'You are a market analyst. Research market size, growth trends, and industry signals. Always cite sources with dates. Structure output as: Market overview → Key trends → Implications → Open questions.',
    memory: false,
    goals: [
      'Quantify TAM/SAM/SOM with methodology shown',
      'Identify macro signals affecting product strategy',
      'Synthesise analyst reports into executive-ready briefs',
      'Track market shifts before they affect the roadmap',
    ],
    recommendedMcps: ['mcp-browser', 'mcp-puppeteer', 'mcp-sequential'],
    guardrails: [
      'Always cite the source and date for every market size or growth figure',
      'Show TAM/SAM/SOM calculation — never give a number without the methodology',
      'Distinguish between confirmed market data and analyst projections',
      'Do not make macro market claims without referencing at least 2 sources',
    ],
    tools: [
      { id: 'gdrive_read',  name: 'Read market research docs', description: 'Access analyst reports and market research files in Google Drive', connector: 'gdrive',  category: 'read',  requiresApproval: false, enabled: true  },
      { id: 'notion_read',  name: 'Read Notion market notes',  description: 'Pull existing market intelligence notes from Notion',              connector: 'notion',  category: 'read',  requiresApproval: false, enabled: true  },
      { id: 'notion_write', name: 'Save market analysis',      description: 'Write a market analysis report to a Notion page',                  connector: 'notion',  category: 'write', requiresApproval: true,  enabled: false },
    ],
    triggers: [
      { id: 'qtr_market', type: 'schedule', label: 'Quarterly market brief', description: 'Generate a market intelligence brief at the start of each quarter', schedule: '0 9 1 */3 *', outputDest: 'notion', enabled: false },
    ],
    templates: [
      {
        id: 'market-sizing',
        name: 'Market Sizing',
        description: 'TAM/SAM/SOM analysis for a market or segment',
        fields: [
          { key: 'market',    label: 'Market or segment to size', placeholder: 'e.g. AI tools for product managers, US market',  required: true  },
          { key: 'geography', label: 'Geography',                 placeholder: 'e.g. Global, North America, EMEA',              required: false },
          { key: 'timeframe', label: 'Timeframe',                 placeholder: 'e.g. 2024-2028 5-year projection',              required: false },
        ],
        systemHint: 'Show TAM → SAM → SOM with calculation methodology. Include 2-3 growth drivers and 2-3 risks. Cite all sources with year.',
      },
    ],
    stats: { queries: 178, avgLatencyMs: 3200, satisfactionPct: 84, tokensUsed: 510000 },
  },
];

// ── Connectors ───────────────────────────────────────────────────────────────

export type ConnectorStatus = 'connected' | 'disconnected' | 'error' | 'partial';

export interface Connector {
  id: string;
  name: string;
  category: 'project_management' | 'docs' | 'communication' | 'analytics' | 'calendar' | 'storage' | 'engineering' | 'crm';
  icon: string;
  description: string;
  status: ConnectorStatus;
  authType: 'oauth' | 'api_key' | 'service_account';
  docsIndexed?: number;
  lastSync?: string;
  popular: boolean;
}

export const CONNECTORS: Connector[] = [
  { id: 'jira',        name: 'Jira',            category: 'project_management', icon: '🔵', description: 'Tickets, sprints, backlogs, epics',         status: 'error',        authType: 'api_key',        docsIndexed: 0,    lastSync: '—',         popular: true  },
  { id: 'notion',      name: 'Notion',          category: 'docs',               icon: '⬜', description: 'Pages, databases, wikis',                  status: 'connected',    authType: 'api_key',        docsIndexed: 47,   lastSync: '2h ago',    popular: true  },
  { id: 'confluence',  name: 'Confluence',      category: 'docs',               icon: '🔷', description: 'Spaces, pages, templates',                 status: 'error',        authType: 'api_key',        docsIndexed: 0,    lastSync: '—',         popular: true  },
  { id: 'slack',       name: 'Slack',           category: 'communication',      icon: '💬', description: 'Channels, threads, DMs',                   status: 'partial',      authType: 'oauth',          docsIndexed: 12,   lastSync: '4h ago',    popular: true  },
  { id: 'gdrive',      name: 'Google Drive',    category: 'storage',            icon: '🟡', description: 'Docs, sheets, PDFs, slides',               status: 'connected',    authType: 'service_account',docsIndexed: 89,   lastSync: '1h ago',    popular: true  },
  { id: 'gcalendar',   name: 'Google Calendar', category: 'calendar',           icon: '📅', description: 'Events, meetings, schedules',              status: 'error',        authType: 'service_account',docsIndexed: 0,    lastSync: '—',         popular: false },
  { id: 'github',      name: 'GitHub',          category: 'engineering',        icon: '🐙', description: 'PRs, issues, commits, releases',           status: 'disconnected', authType: 'oauth',          docsIndexed: undefined,lastSync: undefined, popular: true  },
  { id: 'linear',      name: 'Linear',          category: 'project_management', icon: '🔺', description: 'Issues, cycles, projects',                 status: 'disconnected', authType: 'oauth',          docsIndexed: undefined,lastSync: undefined, popular: true  },
  { id: 'figma',       name: 'Figma',           category: 'docs',               icon: '🎨', description: 'Designs, prototypes, components',          status: 'disconnected', authType: 'oauth',          docsIndexed: undefined,lastSync: undefined, popular: true  },
  { id: 'zendesk',     name: 'Zendesk',         category: 'crm',                icon: '🎫', description: 'Support tickets, customers, CSAT',         status: 'disconnected', authType: 'api_key',        docsIndexed: undefined,lastSync: undefined, popular: true  },
  { id: 'intercom',    name: 'Intercom',        category: 'communication',      icon: '💙', description: 'Customer messages, NPS, segments',         status: 'disconnected', authType: 'oauth',          docsIndexed: undefined,lastSync: undefined, popular: false },
  { id: 'salesforce',  name: 'Salesforce',      category: 'crm',                icon: '☁️', description: 'Deals, accounts, opportunities',           status: 'disconnected', authType: 'oauth',          docsIndexed: undefined,lastSync: undefined, popular: false },
  { id: 'hubspot',     name: 'HubSpot',         category: 'crm',                icon: '🟠', description: 'CRM, contacts, pipeline',                  status: 'disconnected', authType: 'oauth',          docsIndexed: undefined,lastSync: undefined, popular: false },
  { id: 'amplitude',   name: 'Amplitude',       category: 'analytics',          icon: '📈', description: 'Product analytics, funnels, cohorts',      status: 'disconnected', authType: 'api_key',        docsIndexed: undefined,lastSync: undefined, popular: true  },
  { id: 'mixpanel',    name: 'Mixpanel',        category: 'analytics',          icon: '📉', description: 'Event analytics, retention, funnels',      status: 'disconnected', authType: 'api_key',        docsIndexed: undefined,lastSync: undefined, popular: false },
  { id: 'pagerduty',   name: 'PagerDuty',       category: 'engineering',        icon: '🚨', description: 'Incidents, alerts, on-call schedules',     status: 'disconnected', authType: 'api_key',        docsIndexed: undefined,lastSync: undefined, popular: false },
  { id: 'ms-teams',    name: 'Microsoft Teams', category: 'communication',      icon: '🟣', description: 'Channels, chats, meetings',                status: 'disconnected', authType: 'oauth',          docsIndexed: undefined,lastSync: undefined, popular: false },
  { id: 'asana',       name: 'Asana',           category: 'project_management', icon: '🌸', description: 'Projects, tasks, portfolios',              status: 'disconnected', authType: 'oauth',          docsIndexed: undefined,lastSync: undefined, popular: false },
];

// ── MCP Servers ──────────────────────────────────────────────────────────────

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  category: string;
  tools: string[];
  installed: boolean;
  official: boolean;
  stars?: number;
}

export const MCP_SERVERS: MCPServer[] = [
  { id: 'mcp-filesystem', name: 'Filesystem',      category: 'storage',      description: 'Read/write local files and directories',                  tools: ['read_file','write_file','list_dir','search_files'],        installed: true,  official: true,  stars: 2400 },
  { id: 'mcp-github',     name: 'GitHub',          category: 'engineering',  description: 'Search repos, read files, manage issues and PRs',          tools: ['search_code','get_file','create_issue','list_prs'],        installed: false, official: true,  stars: 1800 },
  { id: 'mcp-slack',      name: 'Slack',           category: 'comms',        description: 'Send messages, search channels, read threads',             tools: ['send_message','search_messages','list_channels'],         installed: true,  official: true,  stars: 1200 },
  { id: 'mcp-notion',     name: 'Notion',          category: 'docs',         description: 'Read/write Notion pages, databases, and blocks',           tools: ['search','get_page','create_page','update_block'],         installed: true,  official: false, stars: 980  },
  { id: 'mcp-postgres',   name: 'PostgreSQL',      category: 'database',     description: 'Query PostgreSQL databases with schema inspection',         tools: ['query','describe_table','list_tables'],                   installed: false, official: true,  stars: 1600 },
  { id: 'mcp-browser',    name: 'Browser',         category: 'web',          description: 'Navigate web pages, click, fill forms, screenshot',        tools: ['navigate','click','type','screenshot','get_text'],        installed: false, official: true,  stars: 2100 },
  { id: 'mcp-jira',       name: 'Jira',            category: 'pm',           description: 'Search issues, create tickets, manage sprints',            tools: ['search_issues','create_issue','update_issue','get_sprint'],installed: false, official: false, stars: 740  },
  { id: 'mcp-gdrive',     name: 'Google Drive',    category: 'storage',      description: 'Read Google Docs, Sheets, and Drive files',               tools: ['list_files','read_doc','read_sheet','search'],            installed: true,  official: false, stars: 860  },
  { id: 'mcp-memory',     name: 'Memory',          category: 'ai',           description: 'Persistent knowledge graph memory across sessions',         tools: ['store_memory','recall','search_memory','forget'],         installed: true,  official: true,  stars: 3100 },
  { id: 'mcp-sequential', name: 'Sequential Think',category: 'ai',           description: 'Dynamic chain-of-thought problem solving server',          tools: ['think','plan','reason'],                                  installed: false, official: true,  stars: 2700 },
  { id: 'mcp-puppeteer',  name: 'Puppeteer',       category: 'web',          description: 'Browser automation and web scraping',                     tools: ['navigate','screenshot','click','evaluate'],               installed: false, official: true,  stars: 1400 },
  { id: 'mcp-linear',     name: 'Linear',          category: 'pm',           description: 'Manage Linear issues, cycles, and projects',              tools: ['list_issues','create_issue','get_cycle','add_label'],     installed: false, official: false, stars: 540  },
];

// ── Observability mock data ───────────────────────────────────────────────────

export const USAGE_TIMELINE = [
  { date: 'Apr 14', queries: 142, tokens: 284000, cost: 8.4  },
  { date: 'Apr 15', queries: 198, tokens: 412000, cost: 12.1 },
  { date: 'Apr 16', queries: 167, tokens: 334000, cost: 9.8  },
  { date: 'Apr 17', queries: 89,  tokens: 178000, cost: 5.2  },
  { date: 'Apr 18', queries: 74,  tokens: 148000, cost: 4.3  },
  { date: 'Apr 19', queries: 213, tokens: 471000, cost: 13.9 },
  { date: 'Apr 20', queries: 184, tokens: 388000, cost: 11.4 },
];

export const AGENT_USAGE = [
  { agent: 'Ops',         queries: 4102, pct: 28 },
  { agent: 'Docs',        queries: 3204, pct: 22 },
  { agent: 'Analytics',   queries: 2891, pct: 20 },
  { agent: 'Strategy',    queries: 1847, pct: 13 },
  { agent: 'Research',    queries: 1523, pct: 10 },
  { agent: 'Sales',       queries: 621,  pct: 4  },
  { agent: 'Engineering', queries: 412,  pct: 3  },
];

export const LLM_EVAL = [
  { agent: 'Ops',         faithfulness: 96, relevance: 94, completeness: 91, hallucinations: 0 },
  { agent: 'Docs',        faithfulness: 94, relevance: 93, completeness: 96, hallucinations: 1 },
  { agent: 'Analytics',   faithfulness: 81, relevance: 88, completeness: 79, hallucinations: 3 },
  { agent: 'Strategy',    faithfulness: 89, relevance: 91, completeness: 88, hallucinations: 1 },
  { agent: 'Research',    faithfulness: 92, relevance: 90, completeness: 86, hallucinations: 0 },
  { agent: 'Engineering', faithfulness: 87, relevance: 89, completeness: 84, hallucinations: 1 },
];

export const AUDIT_LOGS = [
  { id: 1, ts: '2026-04-20 09:12', user: 'Aashish G.', agent: 'analytics',   action: 'query',        classification: 'internal',      latencyMs: 2341, tokens: 1840 },
  { id: 2, ts: '2026-04-20 09:08', user: 'Priya M.',   agent: 'docs',        action: 'template:prd', classification: 'confidential',  latencyMs: 1820, tokens: 3200 },
  { id: 3, ts: '2026-04-20 08:54', user: 'Aashish G.', agent: 'strategy',    action: 'query',        classification: 'internal',      latencyMs: 2100, tokens: 2180 },
  { id: 4, ts: '2026-04-20 08:41', user: 'Rahul S.',   agent: 'ops',         action: 'skill:run',    classification: 'public',        latencyMs: 1190, tokens: 890  },
  { id: 5, ts: '2026-04-19 17:32', user: 'Priya M.',   agent: 'analytics',   action: 'query',        classification: 'confidential',  latencyMs: 2680, tokens: 2940 },
  { id: 6, ts: '2026-04-19 16:14', user: 'Aashish G.', agent: 'competitive', action: 'query',        classification: 'internal',      latencyMs: 3100, tokens: 3410 },
  { id: 7, ts: '2026-04-19 15:02', user: 'Rahul S.',   agent: 'docs',        action: 'template:user-stories', classification: 'internal', latencyMs: 1740, tokens: 4100 },
];
