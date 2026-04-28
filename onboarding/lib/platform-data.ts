// ── Agent definitions ────────────────────────────────────────────────────────

export type AgentId =
  // Intelligence — Signal Collection
  | 'research' | 'analytics' | 'competitive' | 'market' | 'social_signal'
  // Research Synthesis
  | 'signal_aggregator' | 'research_orchestrator'
  // Strategy
  | 'strategy' | 'prioritization'
  // Execution
  | 'docs' | 'engineering' | 'ops'
  // Launch
  | 'release' | 'gtm' | 'sales'
  // PM Growth & Quality
  | 'review' | 'coach';
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
  agentId?: AgentId; // populated when category === 'agent_call'
  category: 'read' | 'write' | 'notify' | 'compute' | 'agent_call';
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

export type AgentCategory = 'strategy' | 'execution' | 'research' | 'intelligence' | 'ops' | 'launch' | 'quality';
export type TrustLevel = 'sandboxed' | 'assisted' | 'autonomous';
export type InvocationSurface = 'chat' | 'workflow' | 'home' | 'background';
export type ReasoningMode = 'fast' | 'balanced' | 'deep';

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
  category: AgentCategory;
  trustLevel: TrustLevel;
  invocationSurfaces: InvocationSurface[];
  primaryOutputTypes: string[];
  reasoningMode: ReasoningMode;
  healthScore: number;
  linkedAgents?: AgentId[]; // agents this agent can call internally
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
      { id: 'gdrive_export',    name: 'Export to Google Doc',     description: 'Save strategy doc as a Google Doc',                          connector: 'gdrive',    category: 'write',      requiresApproval: true,  enabled: false },
      { id: 'call_research',    name: 'Pull market + user signal', description: 'Call Research Orchestrator to gather signals for strategy',  agentId: 'research_orchestrator', category: 'agent_call', requiresApproval: false, enabled: true  },
      { id: 'call_market',      name: 'Pull market intelligence',  description: 'Call Market Intelligence for TAM, trends, macro signals',    agentId: 'market',      category: 'agent_call', requiresApproval: false, enabled: true  },
    ],
    triggers: [
      { id: 'qtr_plan',       type: 'schedule', label: 'Quarterly planning digest',  description: 'Generate OKR review and strategic priorities for the quarter', schedule: '0 9 1 */3 *', outputDest: 'notion',      enabled: false },
      { id: 'roadmap_review', type: 'event',    label: 'Roadmap change detected',    description: 'When Jira epics are added or removed, run a strategic impact review', event: 'jira_epic_changed', outputDest: 'home_screen', enabled: false },
    ],
    templates: [
      {
        id: 'okr-draft',
        name: 'Draft OKRs',
        description: 'Generate a full OKR set for a quarter aligned to company goals',
        fields: [
          { key: 'product_area',     label: 'Product area',               placeholder: 'e.g. Activation & Onboarding',          required: true  },
          { key: 'company_goal',     label: 'Company goal this quarter',   placeholder: 'e.g. Reach $150k MRR',                  required: true  },
          { key: 'current_metrics',  label: 'Current baseline metrics',    placeholder: 'e.g. Activation 38%, MRR $142k',        required: false },
          { key: 'last_quarter',     label: 'Last quarter OKR score',      placeholder: 'How did last quarter\'s OKRs score?',   required: false },
        ],
        systemHint: 'Use workspace okrFormat and okrLevels. Generate 3 objectives with 2-3 key results each. KRs must be measurable with baseline + target. Each KR maps to a workspace success metric format. Flag any KR that lacks a measurable baseline. End with: biggest risk to hitting these OKRs.',
      },
      {
        id: 'okr-review',
        name: 'OKR Mid-Quarter Review',
        description: 'Review progress on current OKRs — identify what\'s on track and what\'s at risk',
        fields: [
          { key: 'okrs',         label: 'Current OKRs + scores',   placeholder: 'Paste OKRs with current scores (0.0–1.0)',     required: true  },
          { key: 'context',      label: 'What\'s changed',          placeholder: 'Major events since OKRs were set',             required: false },
        ],
        systemHint: 'For each KR: current score, on track/at risk/off track assessment, root cause if at risk, action needed. Recommend: which OKRs to drop/deprioritize if team is overloaded. End with: 3 decisions the PM needs to make in the next 2 weeks.',
      },
      {
        id: 'roadmap-planning',
        name: 'Roadmap Planning',
        description: 'Build or review a half-year roadmap with strategic rationale',
        fields: [
          { key: 'initiatives',   label: 'Candidate initiatives',   placeholder: 'List the things you\'re considering for H2',   required: true  },
          { key: 'okrs',          label: 'Target OKRs',             placeholder: 'What OKRs does this roadmap need to serve?',   required: true  },
          { key: 'capacity',      label: 'Team capacity',            placeholder: 'e.g. 3 engineers, 1 designer, 6 months',      required: false },
        ],
        systemHint: 'First call research_orchestrator and market for external signals. Then: group initiatives into Now/Next/Later. For each: strategic rationale, OKR it serves, dependencies, rough effort. Identify missing bets and explicit cut decisions. Flag top 3 risks to the plan.',
      },
      {
        id: 'strategic-bet',
        name: 'Strategic Bet 1-Pager',
        description: '1-page case for a bold product bet — for exec alignment',
        fields: [
          { key: 'bet',          label: 'The bet',              placeholder: 'What are we proposing to do?',                required: true  },
          { key: 'why_now',      label: 'Why now?',             placeholder: 'What\'s changed that makes this the right time?', required: true },
          { key: 'what_we_win',  label: 'What we win',          placeholder: 'Best case outcome if this works',              required: true  },
          { key: 'what_we_risk', label: 'What we risk',         placeholder: 'Downside if it doesn\'t work',                 required: false },
        ],
        systemHint: 'Call research_orchestrator for supporting user signals. Call market for competitive and market context. Structure: The Bet (1 sentence), Why Now (market + internal signal), What We Win (specific metric impact), What We Risk (honest), What Needs to Be True for This to Work (3 assumptions), Ask (what you need approved).',
      },
      {
        id: 'roadmap-comms',
        name: 'Roadmap Communication',
        description: 'Communicate the roadmap to different audiences (exec, eng, sales)',
        fields: [
          { key: 'roadmap',    label: 'Roadmap (paste or describe)', placeholder: 'Your current roadmap initiatives',          required: true  },
          { key: 'audience',   label: 'Target audience',             placeholder: 'e.g. Board, Engineering, Sales team',      required: true  },
          { key: 'quarter',    label: 'Quarter this covers',         placeholder: 'e.g. Q3 2026',                             required: false },
        ],
        systemHint: 'Tailor language and depth for the audience. Board: outcomes + strategic rationale + risks. Engineering: sequencing + dependencies + scope clarity. Sales: what\'s shipping + timeline + what they can promise customers. Never share internal scoring or trade-off analysis externally.',
      },
    ],
    stats: { queries: 1847, avgLatencyMs: 2100, satisfactionPct: 91, tokensUsed: 3840000 },
    category: 'strategy', trustLevel: 'assisted', invocationSurfaces: ['chat', 'workflow', 'home'],
    primaryOutputTypes: ['Roadmaps', 'OKR Sets', '1-Pagers', 'Strategic Bets'], reasoningMode: 'deep', healthScore: 94,
    linkedAgents: ['research_orchestrator', 'market', 'prioritization', 'signal_aggregator'],
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
      { id: 'confluence_write',name: 'Create Confluence page',    description: 'Publish the spec to a Confluence space',                     connector: 'confluence', category: 'write',      requiresApproval: true,  enabled: false },
      { id: 'call_research',  name: 'Pull user research',        description: 'Call Research Orchestrator to pre-populate user insights',     agentId: 'research_orchestrator', category: 'agent_call', requiresApproval: false, enabled: true  },
      { id: 'call_analytics', name: 'Pull usage data',           description: 'Call Analytics agent to pull relevant usage metrics',          agentId: 'analytics',    category: 'agent_call', requiresApproval: false, enabled: true  },
    ],
    triggers: [
      { id: 'prd_from_epic', type: 'event', label: 'Jira epic created', description: 'When a new Jira epic is created, auto-draft a PRD outline', event: 'jira_epic_created', outputDest: 'notion', enabled: false },
    ],
    templates: [
      {
        id: 'prd',
        name: 'Full PRD',
        description: 'Production-ready PRD with research + metrics auto-populated',
        fields: [
          { key: 'feature_name',    label: 'Feature name',              placeholder: 'e.g. Email Verification Gate',             required: true  },
          { key: 'problem',         label: 'Problem statement',          placeholder: 'What pain are we solving, for whom?',      required: true  },
          { key: 'success_metrics', label: 'Success metrics',            placeholder: 'e.g. Activation +5%, churn -1%',           required: true  },
          { key: 'constraints',     label: 'Constraints & dependencies', placeholder: 'Timeline, tech limitations, dependencies', required: false },
        ],
        systemHint: 'First call research_orchestrator to pull user signals for this feature area. Then call analytics for baseline metrics. Write PRD: Executive Summary, Problem (cite research), Goals, Non-goals, User Stories (use workspace personas + story format), AC, Edge Cases, Analytics Plan, Open Questions. Success metrics must match workspace successMetricFormat.',
      },
      {
        id: 'user-stories',
        name: 'User Story Batch',
        description: 'Generate Jira-ready user stories in your org\'s exact format',
        fields: [
          { key: 'epic',     label: 'Epic / feature area',  placeholder: 'e.g. Onboarding redesign',              required: true  },
          { key: 'personas', label: 'User personas',         placeholder: 'Leave blank to use workspace personas', required: false },
          { key: 'scope',    label: 'Scope description',     placeholder: 'What should this epic cover?',          required: true  },
          { key: 'count',    label: 'Number of stories',     placeholder: 'e.g. 8 (default)',                      required: false },
        ],
        systemHint: 'Use workspace storyFormat template and persona library. Generate stories with full AC. Each story must include workspace requiredFields (story points, persona, OKR key result). Format story point estimates using workspace storyPointScale.',
      },
      {
        id: 'lean-prd',
        name: 'Lean PRD (2-pager)',
        description: 'Fast 2-page spec for speed-of-light shipping',
        fields: [
          { key: 'feature_name', label: 'Feature name',    placeholder: 'e.g. Onboarding checklist',        required: true },
          { key: 'problem',      label: 'Problem (1 line)', placeholder: 'The exact problem this solves',    required: true },
          { key: 'okr',         label: 'OKR it serves',    placeholder: 'Which key result does this move?', required: true },
        ],
        systemHint: 'Write a tight 2-page spec: Problem (2 sentences), Solution (3 bullet points), Success metric (1 number), User stories (3 max), Edge cases (3 max), Open questions (2 max). No fluff.',
      },
      {
        id: 'rfc',
        name: 'RFC (Request for Comments)',
        description: 'Technical RFC for significant architecture or product decisions',
        fields: [
          { key: 'title',     label: 'RFC title',          placeholder: 'e.g. Migrate auth to JWT + refresh tokens', required: true  },
          { key: 'context',   label: 'Context',             placeholder: 'Why is this decision needed now?',          required: true  },
          { key: 'options',   label: 'Options considered',  placeholder: 'List 2-4 approaches considered',            required: true  },
          { key: 'preferred', label: 'Preferred option',    placeholder: 'Which option and why?',                     required: false },
        ],
        systemHint: 'Structure: Summary, Context & Motivation, Considered Options (each with pros/cons), Recommended Option with rationale, Trade-offs & Risks, Open Questions, Decision owners and deadline.',
      },
      {
        id: 'acceptance-criteria',
        name: 'Acceptance Criteria',
        description: 'Write precise AC for a feature or story — QA-ready',
        fields: [
          { key: 'story',   label: 'User story or feature', placeholder: 'Paste the story or describe the feature', required: true  },
          { key: 'context', label: 'Edge cases to cover',   placeholder: 'Any known edge cases or exceptions',       required: false },
        ],
        systemHint: 'Write Given/When/Then AC for every happy path and the top 3 edge cases. Flag any ambiguity as an open question. Be specific enough for QA to write tests directly from AC without additional clarification.',
      },
    ],
    stats: { queries: 3204, avgLatencyMs: 1800, satisfactionPct: 94, tokensUsed: 8200000 },
    category: 'execution', trustLevel: 'assisted', invocationSurfaces: ['chat', 'workflow'],
    primaryOutputTypes: ['PRDs', 'User Stories', 'Specs', 'RFCs'], reasoningMode: 'balanced', healthScore: 97,
    linkedAgents: ['research_orchestrator', 'analytics', 'review'],
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
    category: 'intelligence', trustLevel: 'sandboxed', invocationSurfaces: ['chat', 'home', 'background'],
    primaryOutputTypes: ['KPI Digests', 'RCA Reports', 'A/B Readouts'], reasoningMode: 'deep', healthScore: 88,
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
    category: 'research', trustLevel: 'assisted', invocationSurfaces: ['chat', 'workflow'],
    primaryOutputTypes: ['VOC Reports', 'Survey Designs', 'Insight Reports'], reasoningMode: 'balanced', healthScore: 92,
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
        id: 'sprint-planning',
        name: 'Sprint Planning',
        description: 'Plan the upcoming sprint — goal, stories, capacity',
        fields: [
          { key: 'sprint_number',  label: 'Sprint number',            placeholder: 'e.g. 24',                                        required: true  },
          { key: 'theme',          label: 'Sprint theme / focus',      placeholder: 'e.g. Activation & Onboarding',                   required: true  },
          { key: 'capacity',       label: 'Team capacity (story pts)', placeholder: 'e.g. 34 points across 3 engineers',              required: true  },
          { key: 'candidates',     label: 'Candidate backlog items',   placeholder: 'Paste or list items from backlog to consider',    required: false },
          { key: 'carryover',      label: 'Carryover from last sprint',placeholder: 'Any stories that didn\'t make it last sprint',   required: false },
        ],
        systemHint: 'Use workspace sprintNamingFormat. Output: Sprint goal (1 sentence tied to OKR), committed stories (bulleted, with points), stretch goals, risks, and definition of done reminder. Stay within capacity. Flag if carryover is excessive.',
      },
      {
        id: 'sprint-summary',
        name: 'Sprint Summary',
        description: 'End-of-sprint summary — stakeholder-ready',
        fields: [
          { key: 'sprint_name',  label: 'Sprint name',          placeholder: 'e.g. Sprint 24 — Activation',          required: true  },
          { key: 'shipped',      label: 'What shipped',          placeholder: 'List completed stories/features',       required: true  },
          { key: 'spillover',    label: 'Spillover (if any)',    placeholder: 'What didn\'t make it and why',          required: false },
          { key: 'next_sprint',  label: 'Next sprint preview',   placeholder: 'Top priorities for next sprint',        required: false },
        ],
        systemHint: 'Format: 3-sentence executive summary, shipped items (bulleted with impact), spillover with reason, metrics impact if any, next sprint preview. Tailor language for stakeholders — no internal jargon.',
      },
      {
        id: 'sprint-retro',
        name: 'Sprint Retrospective',
        description: 'Structured retro: what worked, what didn\'t, what changes',
        fields: [
          { key: 'sprint_name', label: 'Sprint name',       placeholder: 'e.g. Sprint 24',                          required: true  },
          { key: 'went_well',   label: 'What went well',    placeholder: 'List 3-5 things that worked well',        required: true  },
          { key: 'went_wrong',  label: 'What went wrong',   placeholder: 'List blockers, delays, or friction points',required: true  },
          { key: 'team_mood',   label: 'Team mood / vibe',  placeholder: 'e.g. energized, drained, uncertain',      required: false },
        ],
        systemHint: 'Structure: What worked (celebrate), What didn\'t (root cause, not blame), Patterns noticed, 3 specific action items with owners for next sprint. End with one sentence on team health.',
      },
      {
        id: 'standup',
        name: 'Daily Standup',
        description: 'Generate daily standup update',
        fields: [
          { key: 'yesterday', label: 'What I did yesterday',   placeholder: 'Key tasks completed',          required: true  },
          { key: 'today',     label: 'What I\'m doing today',  placeholder: 'Key tasks planned',            required: true  },
          { key: 'blockers',  label: 'Blockers (if any)',      placeholder: 'What\'s blocking progress',    required: false },
        ],
        systemHint: 'Write a crisp standup in under 100 words. Lead with impact, not tasks. If there are blockers, name the owner who can unblock.',
      },
      {
        id: 'meeting-notes',
        name: 'Meeting Notes',
        description: 'Structured meeting notes with decisions and action items',
        fields: [
          { key: 'meeting_type', label: 'Meeting type',    placeholder: 'e.g. Product review, Strategy sync, Design crit', required: true  },
          { key: 'attendees',    label: 'Attendees',        placeholder: 'List names/roles',                                required: false },
          { key: 'raw_notes',    label: 'Raw notes',        placeholder: 'Paste your rough notes or transcript',            required: true  },
        ],
        systemHint: 'Structure: Context (1 line), Key Discussion Points, Decisions Made (numbered, each with rationale), Action Items (owner + deadline for each), Open Questions, Next Meeting focus. Be concise — if it can be a bullet, make it one.',
      },
    ],
    stats: { queries: 4102, avgLatencyMs: 1200, satisfactionPct: 96, tokensUsed: 4800000 },
    category: 'ops', trustLevel: 'assisted', invocationSurfaces: ['chat', 'workflow', 'background'],
    primaryOutputTypes: ['Sprint Plans', 'Standups', 'Sprint Summaries', 'Retros'], reasoningMode: 'fast', healthScore: 96,
    linkedAgents: ['analytics', 'prioritization'],
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
    category: 'execution', trustLevel: 'sandboxed', invocationSurfaces: ['chat', 'workflow'],
    primaryOutputTypes: ['Tech Briefs', 'Gap Analyses', 'Incident Reports'], reasoningMode: 'deep', healthScore: 87,
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
    category: 'intelligence', trustLevel: 'assisted', invocationSurfaces: ['chat', 'background'],
    primaryOutputTypes: ['Battlecards', 'Market Sweeps', 'Win/Loss Reports'], reasoningMode: 'deep', healthScore: 85,
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
    category: 'execution', trustLevel: 'assisted', invocationSurfaces: ['chat', 'workflow'],
    primaryOutputTypes: ['One-Pagers', 'ROI Narratives', 'Demo Scripts'], reasoningMode: 'balanced', healthScore: 89,
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
    category: 'execution', trustLevel: 'sandboxed', invocationSurfaces: ['chat', 'workflow'],
    primaryOutputTypes: ['Review Reports', 'Release Notes', 'Changelogs'], reasoningMode: 'balanced', healthScore: 90,
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
    category: 'ops', trustLevel: 'sandboxed', invocationSurfaces: ['chat'],
    primaryOutputTypes: ['Career Plans', 'Feedback Docs', 'STAR Stories'], reasoningMode: 'deep', healthScore: 95,
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
      { id: 'jira_read',        name: 'Read Jira backlog',      description: 'Pull the full backlog and estimates from Jira',                 connector: 'jira',    category: 'read',      requiresApproval: false, enabled: true  },
      { id: 'notion_read',      name: 'Read roadmap context',   description: 'Read strategic context and OKRs from Notion',                  connector: 'notion',  category: 'read',      requiresApproval: false, enabled: true  },
      { id: 'jira_update',      name: 'Update Jira priority',   description: 'Set priority field and add rationale comment in Jira',         connector: 'jira',    category: 'write',     requiresApproval: true,  enabled: true  },
      { id: 'call_research',    name: 'Pull demand signals',    description: 'Call Research Orchestrator to validate demand for a feature',  agentId: 'research_orchestrator', category: 'agent_call', requiresApproval: false, enabled: true  },
      { id: 'call_engineering', name: 'Pull effort estimate',   description: 'Call Engineering agent for feasibility and effort estimate',   agentId: 'engineering', category: 'agent_call', requiresApproval: false, enabled: true  },
    ],
    triggers: [
      { id: 'sales_request', type: 'event', label: 'Sales feature request', description: 'When a sales feature request ticket is created, auto-score it against the backlog', event: 'jira_issue_created', outputDest: 'home_screen', enabled: false },
    ],
    templates: [
      {
        id: 'rank-features',
        name: 'Rank Features',
        description: 'Score and rank backlog items using your workspace framework',
        fields: [
          { key: 'features',    label: 'Features to rank',   placeholder: 'Paste 3-10 feature names or descriptions',    required: true  },
          { key: 'okrs',        label: 'Current OKRs',        placeholder: 'What are you optimising for this quarter?',   required: true  },
          { key: 'constraints', label: 'Constraints',          placeholder: 'e.g. 2 engineers, 6 weeks, no infra changes', required: false },
        ],
        systemHint: 'Use workspace prioritization framework and factor weights. Score each feature per factor (0-10). Show ranking table with scores per factor, weighted total, and rank. Highlight key trade-offs and the most controversial ranking. Call research_orchestrator to validate demand signal for top 3 items.',
      },
      {
        id: 'stakeholder-request',
        name: 'Stakeholder Request Evaluation',
        description: 'Evaluate a feature request from sales, exec, or customer with evidence',
        fields: [
          { key: 'request',       label: 'The request',          placeholder: 'What is being asked for and by whom?',             required: true  },
          { key: 'context',       label: 'Context',               placeholder: 'e.g. $200k deal, enterprise customer churning',   required: true  },
          { key: 'requestor',     label: 'Requestor & influence', placeholder: 'e.g. Head of Sales, high influence on roadmap',   required: false },
        ],
        systemHint: 'Use workspace dealValueThresholds and stakeholder influence map. Score against workspace prioritization factors. Pull demand signal from research_orchestrator. Output: Recommendation (build/partial/defer/no), Score breakdown, Evidence for demand, Opportunity cost of doing it now vs later, Suggested response to the requestor.',
      },
      {
        id: 'say-no-document',
        name: 'Structured Decline',
        description: 'Say no to a request with data — not opinion',
        fields: [
          { key: 'request',     label: 'Request being declined',  placeholder: 'What was asked?',                                  required: true  },
          { key: 'requestor',   label: 'Requestor',               placeholder: 'Who asked and their role',                         required: true  },
          { key: 'reason',      label: 'Core reason for no',      placeholder: 'Why are we not doing this now?',                   required: true  },
        ],
        systemHint: 'Write a respectful, data-backed decline. Structure: Acknowledge the request + underlying need, Why it doesn\'t fit now (with scoring evidence), What we\'re doing instead that serves a similar goal, When it might be reconsidered (specific conditions), Next steps. Never say "no" without showing the trade-off clearly.',
      },
      {
        id: 'trade-off-analysis',
        name: 'Trade-off Analysis',
        description: 'Deep comparison of two competing initiatives or approaches',
        fields: [
          { key: 'option_a',    label: 'Option A',   placeholder: 'Describe the first option',          required: true  },
          { key: 'option_b',    label: 'Option B',   placeholder: 'Describe the second option',         required: true  },
          { key: 'okr',         label: 'OKR context', placeholder: 'Which OKR are both options serving?', required: false },
        ],
        systemHint: 'Score both options using workspace framework. Show side-by-side comparison table. Identify the key decision variables (what you\'re betting on with each choice). State which you recommend and the single biggest risk of that recommendation. End with: what would make you switch to the other option.',
      },
    ],
    stats: { queries: 289, avgLatencyMs: 2600, satisfactionPct: 86, tokensUsed: 640000 },
    category: 'strategy', trustLevel: 'sandboxed', invocationSurfaces: ['chat', 'workflow'],
    primaryOutputTypes: ['Ranked Backlogs', 'Score Tables', 'Trade-off Docs', 'Decline Docs'], reasoningMode: 'deep', healthScore: 86,
    linkedAgents: ['research_orchestrator', 'engineering', 'analytics'],
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
    category: 'ops', trustLevel: 'assisted', invocationSurfaces: ['chat', 'workflow', 'background'],
    primaryOutputTypes: ['Go/No-Go Decisions', 'UAT Checklists', 'Release Notes'], reasoningMode: 'balanced', healthScore: 88,
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
    category: 'intelligence', trustLevel: 'sandboxed', invocationSurfaces: ['chat', 'background'],
    primaryOutputTypes: ['Market Briefs', 'TAM/SAM/SOM', 'Trend Reports'], reasoningMode: 'deep', healthScore: 84,
  },

  // ── New agents: Research Synthesis layer ─────────────────────────────────────

  {
    id: 'social_signal',
    name: 'Social Signal',
    icon: '📡',
    description: 'Monitors Reddit, ProductHunt, HN, LinkedIn, and G2 for brand mentions, competitor signals, and community sentiment.',
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    llm: 'claude-sonnet-4-6',
    temperature: 0.4,
    maxTokens: 4096,
    minRole: 'pm',
    connectors: [],
    capabilities: ['Reddit monitoring', 'ProductHunt tracking', 'HN mentions', 'G2 review analysis', 'LinkedIn signal', 'Community sentiment'],
    status: 'beta',
    systemPrompt: 'You are a community intelligence agent. Monitor public forums for signals about your product and competitors. Always distinguish between: isolated complaints vs patterns, trolling vs genuine feedback, sentiment vs facts.',
    memory: true,
    goals: [
      'Surface public sentiment before it becomes a support or churn issue',
      'Track competitor community traction as a leading indicator',
      'Identify early adopters and advocates in public communities',
      'Detect emerging criticism before it amplifies',
    ],
    recommendedMcps: ['mcp-browser', 'mcp-puppeteer', 'mcp-memory'],
    guardrails: [
      'Never cite a single post as a trend — require 3+ independent signals before calling it a pattern',
      'Distinguish verified facts from community speculation',
      'Do not surface individual user complaints without anonymizing context',
      'Always note recency: flag if the signal is older than 30 days',
    ],
    tools: [
      { id: 'web_search',    name: 'Web search',          description: 'Search for brand and competitor mentions across public sites', category: 'read',    requiresApproval: false, enabled: true  },
      { id: 'web_scrape',    name: 'Scrape public pages', description: 'Read Reddit threads, HN posts, G2 reviews, ProductHunt pages', category: 'compute', requiresApproval: false, enabled: true  },
      { id: 'alert_create',  name: 'Create signal alert', description: 'Post a community signal alert card to the home screen',         category: 'notify',  requiresApproval: false, enabled: true  },
    ],
    triggers: [
      { id: 'daily_social',  type: 'schedule', label: 'Daily community scan',    description: 'Scan for brand and competitor mentions every morning',    schedule: '0 8 * * 1-5', outputDest: 'home_screen', enabled: false },
      { id: 'weekly_social', type: 'schedule', label: 'Weekly community digest', description: 'Full community sentiment report every Monday',           schedule: '0 9 * * 1',   outputDest: 'notion',      enabled: false },
    ],
    templates: [
      {
        id: 'community-sentiment',
        name: 'Community Sentiment Report',
        description: 'Aggregate brand and competitor sentiment from public forums',
        fields: [
          { key: 'brand',       label: 'Brand / product to track', placeholder: 'e.g. pmGPT',                                 required: true  },
          { key: 'competitors', label: 'Competitors to include',   placeholder: 'e.g. Productboard, Aha, Linear',              required: false },
          { key: 'timeframe',   label: 'Timeframe',                placeholder: 'e.g. Last 30 days',                           required: false },
        ],
        systemHint: 'Search Reddit (r/ProductManagement, r/SaaS), HN, ProductHunt, G2, and LinkedIn. Cluster mentions by theme (praise, complaints, feature requests, comparisons). For each cluster: volume, representative quotes, trend (growing/stable/declining). Competitive section: what are users praising about competitors that we don\'t do?',
      },
      {
        id: 'competitor-community',
        name: 'Competitor Community Analysis',
        description: 'What is the community saying about a specific competitor?',
        fields: [
          { key: 'competitor', label: 'Competitor name', placeholder: 'e.g. Productboard', required: true },
        ],
        systemHint: 'Scrape G2 recent reviews, Reddit mentions, HN threads, ProductHunt comments for the competitor. Output: top 5 praise themes, top 5 complaint themes, recent momentum signals (up/down), things users wish competitor did differently — these are your opportunities.',
      },
    ],
    stats: { queries: 0, avgLatencyMs: 4100, satisfactionPct: 0, tokensUsed: 0 },
    category: 'intelligence', trustLevel: 'autonomous', invocationSurfaces: ['background', 'chat'],
    primaryOutputTypes: ['Sentiment Reports', 'Mention Digests', 'Community Briefs'], reasoningMode: 'balanced', healthScore: 0,
  },

  {
    id: 'signal_aggregator',
    name: 'Signal Aggregator',
    icon: '🧲',
    description: 'Receives outputs from all collector agents, deduplicates, clusters by theme, and maintains a rolling signal memory across internal and external sources.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    llm: 'claude-opus-4-6',
    temperature: 0.2,
    maxTokens: 8192,
    minRole: 'pm',
    connectors: [],
    capabilities: ['Cross-signal clustering', 'Theme deduplication', 'Signal strength tracking', 'Trend detection', 'Memory management', 'Source attribution'],
    status: 'beta',
    systemPrompt: 'You are a signal aggregation engine. You receive structured signal artifacts from research, analytics, competitive, market, and social_signal agents. Deduplicate, cluster by theme, score signal strength, and emit unified SignalBriefs. NEVER invent signals — only aggregate what you receive.',
    memory: true,
    goals: [
      'Maintain a unified, deduplicated view of all product signals',
      'Track signal strength over time to identify trends vs noise',
      'Surface cross-source correlations (e.g. NPS drop + Slack complaints + support spike = same root cause)',
      'Emit proactive alerts when signal strength crosses a threshold',
    ],
    recommendedMcps: ['mcp-memory', 'mcp-sequential'],
    guardrails: [
      'NEVER create a theme from a single source — require 2+ independent signals',
      'Always attribute every signal to its source agent and timestamp',
      'Flag when signals from different sources contradict each other — do not resolve, surface the conflict',
      'Signal strength must decay over time — signals older than 60 days are archived, not deleted',
    ],
    tools: [
      { id: 'call_research',    name: 'Pull VOC signals',         description: 'Fetch latest NPS, feedback, and interview signals from Research', agentId: 'research',    category: 'agent_call', requiresApproval: false, enabled: true  },
      { id: 'call_analytics',   name: 'Pull metric signals',      description: 'Fetch anomaly and cohort signals from Analytics',                 agentId: 'analytics',   category: 'agent_call', requiresApproval: false, enabled: true  },
      { id: 'call_competitive', name: 'Pull competitor signals',  description: 'Fetch competitive move signals from Competitive Intel',           agentId: 'competitive', category: 'agent_call', requiresApproval: false, enabled: true  },
      { id: 'call_market',      name: 'Pull market signals',      description: 'Fetch market trend signals from Market Intelligence',             agentId: 'market',      category: 'agent_call', requiresApproval: false, enabled: true  },
      { id: 'call_social',      name: 'Pull community signals',   description: 'Fetch community sentiment signals from Social Signal agent',      agentId: 'social_signal', category: 'agent_call', requiresApproval: false, enabled: true },
      { id: 'memory_write',     name: 'Write to signal memory',   description: 'Persist aggregated theme clusters to memory store',               category: 'compute',    requiresApproval: false, enabled: true  },
      { id: 'alert_create',     name: 'Emit signal alert',        description: 'Post a high-strength signal alert to home screen',                category: 'notify',     requiresApproval: false, enabled: true  },
    ],
    triggers: [
      { id: 'weekly_aggregate', type: 'schedule', label: 'Weekly signal aggregation', description: 'Collect from all sources, cluster, emit weekly digest', schedule: '0 8 * * 1', outputDest: 'home_screen', enabled: false },
      { id: 'daily_aggregate',  type: 'schedule', label: 'Daily signal check',        description: 'Quick daily check for high-strength new signals',       schedule: '0 9 * * 1-5', outputDest: 'home_screen', enabled: false },
    ],
    templates: [
      {
        id: 'weekly-signal-digest',
        name: 'Weekly Signal Digest',
        description: 'Unified view of all signals from the past 7 days',
        fields: [
          { key: 'focus_area', label: 'Focus area (optional)', placeholder: 'e.g. Churn, Activation, Competitor X — or leave blank for all', required: false },
        ],
        systemHint: 'Call all 5 collector agents. Deduplicate signals. Cluster into themes (max 7). For each theme: signal strength (1-5), sources, trend (new/growing/stable/declining), representative evidence, recommended action. Highlight top theme that needs PM attention this week.',
      },
      {
        id: 'signal-deep-dive',
        name: 'Signal Deep Dive',
        description: 'Full cross-source analysis on a specific problem area',
        fields: [
          { key: 'problem_area', label: 'Problem area', placeholder: 'e.g. User churn, Feature X adoption, Competitor Y', required: true },
        ],
        systemHint: 'Pull all signals related to this area from memory + call relevant collector agents for fresh data. Synthesize: what do internal signals say (NPS, metrics), what do external signals say (competitive, community), are they aligned or contradicting? Produce: signal brief with evidence map, confidence level, and recommended action.',
      },
    ],
    stats: { queries: 0, avgLatencyMs: 5200, satisfactionPct: 0, tokensUsed: 0 },
    category: 'research', trustLevel: 'autonomous', invocationSurfaces: ['background', 'workflow'],
    primaryOutputTypes: ['Signal Briefs', 'Weekly Digests', 'Theme Clusters'], reasoningMode: 'deep', healthScore: 0,
    linkedAgents: ['research', 'analytics', 'competitive', 'market', 'social_signal'],
  },

  {
    id: 'research_orchestrator',
    name: 'Research Orchestrator',
    icon: '🔭',
    description: 'PM-facing research interface. Routes research questions to the right collectors, synthesizes multi-source briefs, and maintains research memory across sessions.',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    llm: 'claude-opus-4-6',
    temperature: 0.5,
    maxTokens: 8192,
    minRole: 'pm',
    connectors: ['notion', 'gdrive', 'slack'],
    capabilities: ['Research routing', 'Multi-source synthesis', 'Anomaly investigation', 'Discovery briefing', 'Decision validation', 'Signal memory'],
    status: 'beta',
    systemPrompt: 'You are the PM\'s research interface. When asked a research question, determine which sources to query, gather signals in parallel, and synthesize into a structured Research Brief. Always separate: what do we know, what do we not know, and what action is implied.',
    memory: true,
    goals: [
      'Answer any PM research question with multi-source evidence in under 60 seconds',
      'Proactively surface research that should inform an in-progress decision',
      'Build a research memory so the PM never needs to re-ask the same question',
      'Route complex research tasks to the right specialist agents automatically',
    ],
    recommendedMcps: ['mcp-memory', 'mcp-sequential', 'mcp-browser'],
    guardrails: [
      'Every claim in a Research Brief must cite its source agent and data point',
      'When evidence is contradictory, surface the contradiction — do not resolve it',
      'Flag when research memory is stale (> 30 days) for a given topic',
      'Do not synthesize fewer than 2 sources for any claim — flag single-source findings explicitly',
    ],
    tools: [
      { id: 'call_research',    name: 'Query VOC research',     description: 'Call Research agent for NPS, interviews, and feedback signals',  agentId: 'research',      category: 'agent_call', requiresApproval: false, enabled: true  },
      { id: 'call_analytics',   name: 'Query metrics',          description: 'Call Analytics agent for usage data and metric signals',          agentId: 'analytics',     category: 'agent_call', requiresApproval: false, enabled: true  },
      { id: 'call_aggregator',  name: 'Query signal memory',    description: 'Call Signal Aggregator for cross-source theme clusters',          agentId: 'signal_aggregator', category: 'agent_call', requiresApproval: false, enabled: true },
      { id: 'call_competitive', name: 'Query competitive',      description: 'Call Competitive Intel for competitor context',                   agentId: 'competitive',   category: 'agent_call', requiresApproval: false, enabled: true  },
      { id: 'notion_write',     name: 'Save research brief',    description: 'Persist a research brief to Notion for future reference',          connector: 'notion',       category: 'write',      requiresApproval: true,  enabled: true  },
    ],
    triggers: [
      { id: 'pre_prd',       type: 'event',    label: 'PRD creation started',   description: 'When Docs agent starts a PRD, auto-pull relevant research context', event: 'prd_started', outputDest: 'home_screen', enabled: false },
      { id: 'pre_planning',  type: 'schedule', label: 'Pre-planning research',  description: 'Weekly research digest before Monday planning ceremonies',           schedule: '0 7 * * 1', outputDest: 'notion',      enabled: false },
    ],
    templates: [
      {
        id: 'research-brief',
        name: 'Research Brief',
        description: 'Multi-source research brief for any PM question',
        fields: [
          { key: 'question',  label: 'Research question',  placeholder: 'e.g. Why are users churning in month 2?',             required: true  },
          { key: 'urgency',   label: 'Urgency',             placeholder: 'e.g. Needed for sprint planning on Friday',           required: false },
          { key: 'scope',     label: 'Scope',               placeholder: 'e.g. Enterprise users only, last 90 days',            required: false },
        ],
        systemHint: 'Route question to relevant agents (research, analytics, signal_aggregator, competitive as needed). Synthesize into: What We Know (with sources), What We Don\'t Know, Signal Strength (1-5), Recommended Action, Open Questions. Cite source agent for every claim.',
      },
      {
        id: 'anomaly-investigation',
        name: 'Anomaly Investigation',
        description: 'Investigate a metric drop or unexpected change',
        fields: [
          { key: 'metric',    label: 'Metric that changed',  placeholder: 'e.g. Activation rate',                              required: true  },
          { key: 'change',    label: 'Change + date',         placeholder: 'e.g. -8% starting April 14',                       required: true  },
          { key: 'context',   label: 'Recent changes',        placeholder: 'Releases, experiments, external events',            required: false },
        ],
        systemHint: 'Call analytics for metric breakdown by segment/cohort/time. Call research for concurrent user feedback signals. Call signal_aggregator for cross-source correlation. Output: RCA structure — what changed, correlated signals (with sources), root cause hypotheses (ranked by evidence strength), immediate action, monitoring plan.',
      },
      {
        id: 'decision-validation',
        name: 'Decision Validation',
        description: 'Validate a product hypothesis or decision with research evidence',
        fields: [
          { key: 'hypothesis', label: 'Hypothesis / decision', placeholder: 'e.g. Users want a mobile app over web improvements', required: true },
          { key: 'context',    label: 'Context',                placeholder: 'What led to this hypothesis?',                      required: false },
        ],
        systemHint: 'Pull evidence FOR and AGAINST the hypothesis from all relevant sources. Score confidence: evidence strength × source diversity. Output: Evidence For, Evidence Against, Gaps in Evidence, Confidence Level (1-5), Recommended Next Step (ship / validate more / kill hypothesis).',
      },
    ],
    stats: { queries: 0, avgLatencyMs: 6100, satisfactionPct: 0, tokensUsed: 0 },
    category: 'research', trustLevel: 'assisted', invocationSurfaces: ['chat', 'home', 'workflow'],
    primaryOutputTypes: ['Research Briefs', 'Anomaly Reports', 'Decision Evidence'], reasoningMode: 'deep', healthScore: 0,
    linkedAgents: ['research', 'analytics', 'signal_aggregator', 'competitive', 'market'],
  },

  // ── New agent: GTM ────────────────────────────────────────────────────────────

  {
    id: 'gtm',
    name: 'GTM Planner',
    icon: '📣',
    description: 'Go-to-market planning, launch messaging, persona-targeted collateral, launch checklists, and cross-functional launch coordination.',
    color: 'text-fuchsia-600',
    bg: 'bg-fuchsia-50',
    llm: 'claude-sonnet-4-6',
    temperature: 0.6,
    maxTokens: 4096,
    minRole: 'pm',
    connectors: ['notion', 'gdrive', 'slack'],
    capabilities: ['GTM planning', 'Launch messaging', 'Persona targeting', 'Launch checklists', 'Enablement briefs', 'Announcement copy'],
    status: 'beta',
    systemPrompt: 'You are a product marketing and GTM expert. Plan launches end-to-end: who we\'re targeting, what we\'re saying, what each team needs, and how we\'ll know if the launch worked. Always lead with customer outcome, never feature names.',
    memory: false,
    goals: [
      'Make every launch coordinated and documented across all functions',
      'Ensure Sales, Support, and Marketing are enabled before launch day',
      'Produce messaging that converts — outcome-led, persona-specific',
      'Create post-launch success criteria before launch, not after',
    ],
    recommendedMcps: ['mcp-notion', 'mcp-slack'],
    guardrails: [
      'NEVER launch without a success metric defined upfront',
      'Always produce function-specific briefs — what engineering, sales, support, and marketing each need to do',
      'Lead with customer outcome in all external messaging — never lead with the feature name',
      'Do not write announcement copy without knowing the target persona from the workspace persona library',
    ],
    tools: [
      { id: 'notion_read',   name: 'Read PRD / specs',          description: 'Pull the feature PRD and specs from Notion for launch context',  connector: 'notion',  category: 'read',      requiresApproval: false, enabled: true  },
      { id: 'gdrive_read',   name: 'Read market assets',        description: 'Access existing positioning docs and messaging frameworks',        connector: 'gdrive',  category: 'read',      requiresApproval: false, enabled: true  },
      { id: 'notion_write',  name: 'Create GTM plan',           description: 'Publish the GTM plan to Notion',                                  connector: 'notion',  category: 'write',     requiresApproval: true,  enabled: true  },
      { id: 'slack_post',    name: 'Post launch briefing',      description: 'Send launch brief to workspace releases Slack channel',           connector: 'slack',   category: 'notify',    requiresApproval: true,  enabled: true  },
      { id: 'call_sales',    name: 'Generate sales enablement', description: 'Call Sales agent to produce sales one-pager for the launch',      agentId: 'sales',     category: 'agent_call', requiresApproval: false, enabled: true  },
      { id: 'call_research', name: 'Pull user context',         description: 'Call Research Orchestrator to pull relevant user signals',         agentId: 'research_orchestrator', category: 'agent_call', requiresApproval: false, enabled: true },
    ],
    triggers: [
      { id: 'prd_published', type: 'event', label: 'PRD marked ready for launch', description: 'When a PRD artifact is published, auto-draft a GTM plan outline', event: 'artifact_published', outputDest: 'notion', enabled: false },
    ],
    templates: [
      {
        id: 'gtm-plan',
        name: 'Full GTM Plan',
        description: 'End-to-end launch plan covering messaging, audience, and cross-functional readiness',
        fields: [
          { key: 'feature',       label: 'Feature / release name',  placeholder: 'e.g. AI Sprint Planner',                           required: true  },
          { key: 'launch_date',   label: 'Target launch date',       placeholder: 'e.g. May 15, 2026',                                required: true  },
          { key: 'target_segment',label: 'Target segment',           placeholder: 'e.g. PM Leads at Series B SaaS, >10 engineers',   required: true  },
          { key: 'key_benefit',   label: 'Core value proposition',  placeholder: 'What does this change for the customer?',          required: true  },
        ],
        systemHint: 'Call research_orchestrator for user signals about this feature area. Use workspace persona library for target segment. Structure: Launch Summary (1 para), Target Audience + Messaging (per persona), Channels (in-app, email, Slack, social), Function Readiness Table (Sales / Support / Marketing / Eng — what each team needs to do before launch), Success Metrics (how we know it worked), Post-Launch Monitoring Plan.',
      },
      {
        id: 'launch-messaging',
        name: 'Launch Messaging Brief',
        description: 'Persona-targeted messaging for a feature launch',
        fields: [
          { key: 'feature',   label: 'Feature name',        placeholder: 'e.g. Workflow Automation',                             required: true  },
          { key: 'personas',  label: 'Target personas',      placeholder: 'Leave blank to use workspace personas',                required: false },
          { key: 'channel',   label: 'Channel',              placeholder: 'e.g. In-app tooltip, Email, ProductHunt post',         required: false },
        ],
        systemHint: 'For each persona in workspace: write a unique headline (pain-led), 2 supporting bullets (outcome-led), and a CTA. Channel-specific: in-app = 12-word headline + 1 sentence. Email = subject line + 3 bullets + CTA. Blog = title + intro paragraph. NEVER use the feature\'s internal name as the headline.',
      },
      {
        id: 'launch-checklist',
        name: 'Launch Readiness Checklist',
        description: 'Cross-functional checklist — who does what before launch day',
        fields: [
          { key: 'feature',     label: 'Feature / release',  placeholder: 'e.g. v2.4 — Notification Redesign',                  required: true  },
          { key: 'launch_date', label: 'Launch date',         placeholder: 'e.g. May 15, 2026',                                  required: true  },
          { key: 'teams',       label: 'Teams involved',      placeholder: 'e.g. Eng, Design, Sales, Support, Marketing',        required: false },
        ],
        systemHint: 'Generate a checklist with T-minus timeline (T-14d, T-7d, T-3d, T-1d, Launch day, T+3d). For each checkpoint: list what each team must complete. Include: feature flag state, pricing/billing alignment, support documentation, sales training, analytics instrumentation, rollback plan, comms approval. Mark each item with owner role.',
      },
      {
        id: 'enablement-brief',
        name: 'Internal Enablement Brief',
        description: 'What Sales and Support need to know before the launch',
        fields: [
          { key: 'feature',         label: 'Feature',             placeholder: 'e.g. AI Sprint Planner',                          required: true  },
          { key: 'audience',        label: 'Internal audience',   placeholder: 'e.g. Sales team / Support team / All hands',      required: true  },
          { key: 'launch_date',     label: 'Launch date',          placeholder: 'e.g. May 15, 2026',                               required: false },
        ],
        systemHint: 'Call sales agent to generate the sales one-pager. Structure enablement brief: What launched and why (1 para), What customers will experience (user-facing changes), What Sales needs to say (talking points + top 3 objections + responses), What Support needs to know (common questions + answers + escalation path), What to track (success metrics + alert thresholds). Keep it scannable — bullet points over paragraphs.',
      },
    ],
    stats: { queries: 0, avgLatencyMs: 2800, satisfactionPct: 0, tokensUsed: 0 },
    category: 'launch', trustLevel: 'assisted', invocationSurfaces: ['chat', 'workflow'],
    primaryOutputTypes: ['GTM Plans', 'Launch Checklists', 'Messaging Briefs', 'Enablement Docs'], reasoningMode: 'balanced', healthScore: 0,
    linkedAgents: ['sales', 'research_orchestrator', 'release', 'docs'],
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
