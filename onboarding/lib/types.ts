export interface OnboardingState {
  step: number;
  auth: {
    name: string;
    email: string;
    authMethod: 'google' | 'email';
    verified: boolean;
  };
  workspace: {
    companyName: string;
    userRole: string;
    teamSize: string;
    plan: 'free' | 'pro' | 'enterprise';
  };
  context: {
    businessModels: string[];
    useCases: string[];
    existingTools: string[];
  };
  team: {
    invites: Array<{ email: string; role: string; status: string }>;
  };
}

export const DEFAULT_STATE: OnboardingState = {
  step: 1,
  auth: { name: '', email: '', authMethod: 'email', verified: false },
  workspace: { companyName: '', userRole: '', teamSize: '', plan: 'free' },
  context: { businessModels: [], useCases: [], existingTools: [] },
  team: { invites: [] },
};

export type UserRole = 'Admin' | 'Editor' | 'Viewer' | 'Observer';

export type AgentId = 'strategy' | 'docs' | 'analytics' | 'research' | 'review' | 'ops';

export interface Agent {
  id: AgentId;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const AGENTS: Agent[] = [
  { id: 'strategy',  name: 'Strategy Agent',   description: 'Roadmap, vision, OKRs, prioritization',         icon: '🎯', color: 'from-violet-500 to-purple-600' },
  { id: 'docs',      name: 'Docs Agent',        description: 'PRD generation, user stories, specs',            icon: '📄', color: 'from-blue-500 to-cyan-600' },
  { id: 'analytics', name: 'Analytics Agent',   description: 'Metrics interpretation, anomaly detection',      icon: '📊', color: 'from-emerald-500 to-teal-600' },
  { id: 'research',  name: 'Research Agent',    description: 'Competitive intel, market research',             icon: '🔍', color: 'from-orange-500 to-amber-600' },
  { id: 'review',    name: 'Review Agent',      description: 'PM job reviews, portfolio critique',             icon: '✨', color: 'from-pink-500 to-rose-600' },
  { id: 'ops',       name: 'Daily Ops Agent',   description: 'Standups, meeting notes, task triage',           icon: '⚡', color: 'from-slate-500 to-zinc-600' },
];

export const USE_CASE_AGENT_MAP: Record<string, AgentId> = {
  'Writing PRDs and specs':            'docs',
  'Roadmap planning':                  'strategy',
  'Customer feedback synthesis':       'research',
  'Sprint planning and user stories':  'docs',
  'Product strategy and OKRs':         'strategy',
  'Competitive research':              'research',
  'Stakeholder communication':         'docs',
  'Analytics interpretation':          'analytics',
  'PM interview prep / upskilling':    'ops',
  'Team collaboration and alignment':  'strategy',
};

export const BUSINESS_MODEL_CASES: Record<string, string[]> = {
  'B2B SaaS': [
    "How Loom cut PRD writing time by 60% using pmGPT",
    "How Notion aligned their Q3 roadmap in one sprint",
  ],
  'B2C / Consumer': [
    "How a B2C team synthesized 500 feedback items in 20 minutes",
    "How consumer PMs run weekly strategy reviews in 15 minutes",
  ],
  'D2C Brand': [
    "How a D2C brand aligned their product roadmap in one sprint",
    "How D2C teams use pmGPT for launch planning",
  ],
  'Marketplace': [
    "How a marketplace PM synthesized both-side feedback at scale",
    "How marketplace teams run quarterly planning with pmGPT",
  ],
  'Enterprise Software': [
    "How enterprise PMs cut stakeholder doc time by 70%",
    "How a 50-person product org standardized their PRD process",
  ],
  default: [
    "How product teams cut PRD writing time by 60% using pmGPT",
    "How PMs synthesized 500 feedback items in 20 minutes",
  ],
};
