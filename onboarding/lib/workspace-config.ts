import type { AgentId, UserRole } from './platform-data';

// ── Prioritization Frameworks ─────────────────────────────────────────────────

export type PrioritizationFramework = 'RICE' | 'ICE' | 'MoSCoW' | 'Kano' | 'SPADE' | 'Weighted' | 'Custom';

export interface PrioritizationFactor {
  key: string;
  label: string;
  description: string;
  weight: number; // 0-100, sum of all weights = 100
  inverted: boolean; // true = lower is better (effort, risk)
}

export const FRAMEWORK_PRESETS: Record<PrioritizationFramework, PrioritizationFactor[]> = {
  RICE: [
    { key: 'reach',      label: 'Reach',       description: 'How many users does this impact per quarter?',            weight: 25, inverted: false },
    { key: 'impact',     label: 'Impact',       description: 'How much does it move the needle? (0.25-3x)',            weight: 35, inverted: false },
    { key: 'confidence', label: 'Confidence',   description: 'How confident are you in your estimates? (50-100%)',     weight: 20, inverted: false },
    { key: 'effort',     label: 'Effort',       description: 'Person-months required',                                 weight: 20, inverted: true  },
  ],
  ICE: [
    { key: 'impact',      label: 'Impact',      description: 'Expected outcome if it works',                           weight: 40, inverted: false },
    { key: 'confidence',  label: 'Confidence',  description: 'How sure are you this will work?',                       weight: 30, inverted: false },
    { key: 'ease',        label: 'Ease',        description: 'How easy is it to implement?',                           weight: 30, inverted: false },
  ],
  MoSCoW: [
    { key: 'must',    label: 'Must Have',    description: 'Non-negotiable for this release',                           weight: 40, inverted: false },
    { key: 'should',  label: 'Should Have',  description: 'High value, not critical',                                  weight: 30, inverted: false },
    { key: 'could',   label: 'Could Have',   description: 'Nice to have if time permits',                              weight: 20, inverted: false },
    { key: 'wont',    label: "Won't Have",   description: 'Out of scope for now',                                      weight: 10, inverted: false },
  ],
  Kano: [
    { key: 'basic',        label: 'Basic',        description: 'Expected features — absence causes dissatisfaction',   weight: 30, inverted: false },
    { key: 'performance',  label: 'Performance',  description: 'More = more satisfied (linear)',                       weight: 30, inverted: false },
    { key: 'delighter',    label: 'Delighter',     description: 'Unexpected — creates delight when present',           weight: 25, inverted: false },
    { key: 'effort',       label: 'Effort',        description: 'Implementation effort',                               weight: 15, inverted: true  },
  ],
  SPADE: [
    { key: 'setting',    label: 'Setting',    description: 'What is the context and urgency?',                         weight: 20, inverted: false },
    { key: 'people',     label: 'People',     description: 'Who is accountable and needs to be consulted?',           weight: 20, inverted: false },
    { key: 'alternatives',label: 'Alternatives', description: 'What are the viable options?',                          weight: 20, inverted: false },
    { key: 'decide',     label: 'Decide',     description: 'What is the recommended decision?',                       weight: 20, inverted: false },
    { key: 'explain',    label: 'Explain',    description: 'How will you explain the decision?',                       weight: 20, inverted: false },
  ],
  Weighted: [
    { key: 'strategic_alignment', label: 'Strategic Alignment', description: 'How well does this align to current OKRs?', weight: 35, inverted: false },
    { key: 'user_impact',         label: 'User Impact',         description: 'Direct impact on user experience',          weight: 25, inverted: false },
    { key: 'business_value',      label: 'Business Value',      description: 'Revenue, retention, or growth impact',       weight: 20, inverted: false },
    { key: 'effort',              label: 'Effort',              description: 'Engineering and design effort required',     weight: 12, inverted: true  },
    { key: 'risk',                label: 'Risk',                description: 'Technical and market risk',                  weight: 8,  inverted: true  },
  ],
  Custom: [],
};

// ── Jira / Ticketing Config ───────────────────────────────────────────────────

export type StoryFormat = 'user-story' | 'bdd' | 'job-story' | 'custom';
export type StoryPointScale = 'fibonacci' | '1-5' | 'tshirt' | 'days';
export type TicketType = 'epic' | 'story' | 'task' | 'bug' | 'sub-task';

export interface JiraConfig {
  projectKey: string;
  storyFormat: StoryFormat;
  customStoryTemplate?: string;
  storyPointScale: StoryPointScale;
  requiredFields: string[];
  definitionOfDone: string[];
  labelTaxonomy: string[];
  customFields: { key: string; label: string; type: 'text' | 'select' | 'number' }[];
  epicStructure: string;
  bugFormat: string;
}

export const STORY_FORMAT_TEMPLATES: Record<StoryFormat, string> = {
  'user-story':  'As a [persona], I want [action] so that [outcome].',
  'bdd':         'Given [context], When [action], Then [outcome].',
  'job-story':   'When [situation], I want to [motivation], so I can [outcome].',
  'custom':      '',
};

// ── Documentation Config ──────────────────────────────────────────────────────

export type PRDFormat = 'two-pager' | 'full-spec' | 'lean' | 'custom';
export type PublishDestination = 'notion' | 'confluence' | 'gdrive';

export interface PRDSection {
  key: string;
  label: string;
  required: boolean;
  defaultContent?: string;
}

export const PRD_SECTION_LIBRARY: PRDSection[] = [
  { key: 'executive_summary', label: 'Executive Summary',   required: true  },
  { key: 'problem',           label: 'Problem Statement',   required: true  },
  { key: 'goals',             label: 'Goals & Non-goals',   required: true  },
  { key: 'user_stories',      label: 'User Stories',        required: true  },
  { key: 'success_metrics',   label: 'Success Metrics',     required: true  },
  { key: 'open_questions',    label: 'Open Questions',       required: true  },
  { key: 'user_research',     label: 'User Research',        required: false },
  { key: 'competitive',       label: 'Competitive Context',  required: false },
  { key: 'technical_notes',   label: 'Technical Notes',      required: false },
  { key: 'analytics_plan',    label: 'Analytics Plan',       required: false },
  { key: 'legal_compliance',  label: 'Legal / Compliance',   required: false },
  { key: 'design_links',      label: 'Design Links',         required: false },
  { key: 'rollout_plan',      label: 'Rollout Plan',         required: false },
];

export const PRD_FORMAT_PRESETS: Record<PRDFormat, string[]> = {
  'two-pager':  ['problem', 'goals', 'user_stories', 'success_metrics', 'open_questions'],
  'full-spec':  ['executive_summary', 'problem', 'goals', 'user_stories', 'success_metrics', 'user_research', 'competitive', 'technical_notes', 'analytics_plan', 'open_questions'],
  'lean':       ['problem', 'goals', 'success_metrics'],
  'custom':     [],
};

export interface DocumentationConfig {
  prdFormat: PRDFormat;
  prdSections: string[]; // ordered list of PRDSection keys
  successMetricFormat: string;
  signOffChain: string[];
  publishDestination: PublishDestination;
  rfcRequired: boolean;
}

// ── Planning Config ───────────────────────────────────────────────────────────

export type OKRFormat = 'google-0-1' | 'rag' | 'percentage' | 'binary';
export type SprintCadence = 1 | 2 | 3;

export interface Persona {
  id: string;
  name: string;
  role: string;
  company_type: string;
  goals: string[];
  pain_points: string[];
  tech_savviness: 'low' | 'medium' | 'high';
}

export interface OKRLevel {
  id: string;
  label: string; // 'Company' | 'Team' | 'Individual'
  parentId?: string;
}

export interface PlanningConfig {
  sprintCadence: SprintCadence;
  sprintNamingFormat: string;
  velocityWindow: number;
  okrFormat: OKRFormat;
  okrLevels: OKRLevel[];
  okrCheckInCadence: 'weekly' | 'biweekly' | 'monthly';
  personas: Persona[];
  productAreas: string[];
}

// ── Stakeholder Map ───────────────────────────────────────────────────────────

export interface StakeholderEntry {
  name: string;
  role: string;
  influence: 'high' | 'medium' | 'low';
  domains: string[];
}

export interface EscalationPath {
  label: string;
  steps: string[];
}

export interface StakeholderMap {
  stakeholders: StakeholderEntry[];
  salesEscalation: EscalationPath;
  customerEscalation: EscalationPath;
  roadmapDeciders: string[];
  slackChannels: {
    productRequests: string;
    customerFeedback: string;
    alerts: string;
    releases: string;
  };
  dealValueThresholds: {
    autoScore: number;
    escalate: number;
    executive: number;
  };
}

// ── Agent Defaults ────────────────────────────────────────────────────────────

export type ApprovalGate = 'always' | 'high-risk-only' | 'never';

export interface AgentDefaults {
  enabled: boolean;
  trustOverride?: 'sandboxed' | 'assisted' | 'autonomous';
  approvalGate: ApprovalGate;
  maxTokensOverride?: number;
  outputDestination?: PublishDestination;
}

// ── Root Config ───────────────────────────────────────────────────────────────

export interface WorkspaceConfig {
  id: string;
  companyName: string;
  stage: 'pre-seed' | 'seed' | 'series-a' | 'series-b' | 'series-c' | 'growth';
  icp: string;
  teamSize: number;
  pmCount: number;
  prioritization: {
    framework: PrioritizationFramework;
    factors: PrioritizationFactor[];
    tiebreaker: string;
    overrideRoles: UserRole[];
  };
  jira: JiraConfig;
  documentation: DocumentationConfig;
  planning: PlanningConfig;
  stakeholders: StakeholderMap;
  agentDefaults: Partial<Record<AgentId, AgentDefaults>>;
}

// ── Default Config (pmGPT's own workspace as example) ────────────────────────

export const DEFAULT_WORKSPACE_CONFIG: WorkspaceConfig = {
  id: 'default',
  companyName: 'pmGPT',
  stage: 'seed',
  icp: 'PM teams at Series A–C B2B SaaS (5–50 engineers, 2–8 PMs)',
  teamSize: 12,
  pmCount: 3,

  prioritization: {
    framework: 'Weighted',
    factors: FRAMEWORK_PRESETS['Weighted'],
    tiebreaker: 'Strategic alignment always wins in a tie',
    overrideRoles: ['pm_lead', 'admin'],
  },

  jira: {
    projectKey: 'PMGPT',
    storyFormat: 'user-story',
    storyPointScale: 'fibonacci',
    requiredFields: ['acceptance_criteria', 'story_points', 'persona', 'okr_key_result'],
    definitionOfDone: [
      'Code reviewed and approved',
      'Unit tests written and passing',
      'Acceptance criteria met',
      'Analytics events verified',
      'Design QA signed off',
    ],
    labelTaxonomy: ['growth', 'retention', 'activation', 'tech-debt', 'ux', 'bug', 'infra'],
    customFields: [
      { key: 'target_persona', label: 'Target Persona', type: 'select' },
      { key: 'okr_key_result', label: 'OKR Key Result', type: 'text' },
      { key: 'business_value', label: 'Business Value Score', type: 'number' },
    ],
    epicStructure: 'Feature Area → Epic → Story → Sub-task',
    bugFormat: '[BUG] {summary} — Severity: {severity} — Affects: {segment}',
  },

  documentation: {
    prdFormat: 'full-spec',
    prdSections: PRD_FORMAT_PRESETS['full-spec'],
    successMetricFormat: '{metric} improves from {baseline} to {target} by {date}',
    signOffChain: ['PM', 'PM Lead', 'Eng Lead'],
    publishDestination: 'notion',
    rfcRequired: false,
  },

  planning: {
    sprintCadence: 2,
    sprintNamingFormat: 'Sprint {number} — {theme}',
    velocityWindow: 4,
    okrFormat: 'google-0-1',
    okrLevels: [
      { id: 'company', label: 'Company' },
      { id: 'team',    label: 'Team',     parentId: 'company' },
      { id: 'pm',      label: 'Individual', parentId: 'team' },
    ],
    okrCheckInCadence: 'monthly',
    personas: [
      {
        id: 'solo-pm',
        name: 'Solo PM',
        role: 'Product Manager',
        company_type: 'Early-stage startup (seed-Series A)',
        goals: ['Ship fast', 'Prove product-market fit', 'Cover all PM functions solo'],
        pain_points: ['No time for research', 'Juggling strategy + execution', 'No PM to delegate to'],
        tech_savviness: 'high',
      },
      {
        id: 'pm-lead',
        name: 'PM Lead',
        role: 'Head of Product',
        company_type: 'Series B–C SaaS',
        goals: ['Build high-performing PM team', 'Drive OKR alignment', 'Own product strategy'],
        pain_points: ['Context switching across PMs', 'Stakeholder management overhead', 'Roadmap communication'],
        tech_savviness: 'high',
      },
      {
        id: 'senior-pm',
        name: 'Senior PM',
        role: 'Senior Product Manager',
        company_type: 'Series B SaaS with 5–20 PMs',
        goals: ['Own a product area end-to-end', 'Influence roadmap', 'Mentor junior PMs'],
        pain_points: ['Cross-team dependencies', 'Aligning engineering and design', 'Data access friction'],
        tech_savviness: 'medium',
      },
    ],
    productAreas: ['Onboarding & Activation', 'Core Product', 'Integrations', 'Analytics', 'Admin & Billing'],
  },

  stakeholders: {
    stakeholders: [
      { name: 'CEO / Founder',    role: 'Executive',       influence: 'high',   domains: ['strategy', 'roadmap', 'hiring'] },
      { name: 'Head of Sales',    role: 'Sales Leadership', influence: 'high',   domains: ['feature requests', 'deal unblocking', 'enterprise'] },
      { name: 'Head of Eng',      role: 'Engineering',      influence: 'high',   domains: ['feasibility', 'tech debt', 'sprint capacity'] },
      { name: 'Customer Success', role: 'CS / Support',     influence: 'medium', domains: ['churn signals', 'NPS', 'customer requests'] },
      { name: 'Marketing',        role: 'Growth',            influence: 'medium', domains: ['GTM', 'messaging', 'launches'] },
    ],
    salesEscalation: {
      label: 'Sales Feature Request Escalation',
      steps: ['AE submits Jira ticket with deal context', 'PM scores within 48h', 'PM Lead reviews if deal > $50k', 'CEO loop-in if deal > $200k'],
    },
    customerEscalation: {
      label: 'Customer Churn Risk Escalation',
      steps: ['CSM flags in #customer-feedback Slack', 'PM triages within 24h', 'PM Lead + CS Head decide response', 'CEO for strategic accounts'],
    },
    roadmapDeciders: ['CEO', 'PM Lead', 'Head of Eng'],
    slackChannels: {
      productRequests: '#product-requests',
      customerFeedback: '#customer-feedback',
      alerts: '#product-alerts',
      releases: '#releases',
    },
    dealValueThresholds: {
      autoScore: 10000,
      escalate: 50000,
      executive: 200000,
    },
  },

  agentDefaults: {
    strategy:      { enabled: true,  approvalGate: 'always',         outputDestination: 'notion'     },
    docs:          { enabled: true,  approvalGate: 'always',         outputDestination: 'notion'     },
    analytics:     { enabled: true,  approvalGate: 'high-risk-only', outputDestination: 'notion'     },
    research:      { enabled: true,  approvalGate: 'always',         outputDestination: 'notion'     },
    ops:           { enabled: true,  approvalGate: 'always'                                          },
    competitive:   { enabled: true,  approvalGate: 'high-risk-only'                                  },
    market:        { enabled: true,  approvalGate: 'high-risk-only'                                  },
    prioritization:{ enabled: true,  approvalGate: 'always'                                          },
    engineering:   { enabled: true,  approvalGate: 'always'                                          },
    release:       { enabled: true,  approvalGate: 'always'                                          },
    review:        { enabled: true,  approvalGate: 'high-risk-only'                                  },
    sales:         { enabled: true,  approvalGate: 'always',         outputDestination: 'notion'     },
    coach:         { enabled: true,  approvalGate: 'never'                                           },
  },
};
