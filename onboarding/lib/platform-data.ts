// ── Agent definitions ────────────────────────────────────────────────────────

export type AgentId = 'strategy' | 'docs' | 'analytics' | 'research' | 'ops' | 'review' | 'engineering' | 'competitive' | 'sales' | 'coach';
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
  templates: AgentTemplate[];
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
    connectors: ['notion', 'gdrive'],
    capabilities: ['Roadmap planning', 'OKR definition', 'RICE scoring', 'Stakeholder alignment', 'Vision docs', 'Now/Next/Later'],
    status: 'active',
    systemPrompt: 'You are a product strategy expert. Help PMs define clear product vision, prioritize ruthlessly using frameworks, and communicate strategy to stakeholders. Be direct, data-backed, and challenge assumptions.',
    memory: true,
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
