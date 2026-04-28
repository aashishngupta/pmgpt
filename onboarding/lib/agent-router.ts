import type { AgentId } from './platform-data';

// ── Intent Classification ─────────────────────────────────────────────────────

export type IntentType =
  // Research & Discovery
  | 'research_discovery'       // "What are users saying about X?"
  | 'research_anomaly'         // "Why did metric X drop?"
  | 'research_validation'      // "Is there demand for feature X?"
  | 'research_synthesis'       // "Summarize all signals around churn"
  // Strategy
  | 'strategy_okr'             // "Help me draft OKRs for Q3"
  | 'strategy_roadmap'         // "What should be on our H2 roadmap?"
  | 'strategy_bet'             // "Build the case for this strategic bet"
  | 'strategy_comms'           // "Communicate roadmap to exec / sales / eng"
  // Prioritization
  | 'prioritization_ranking'   // "Rank these 5 features"
  | 'prioritization_request'   // "Sales wants X urgently — should we build it?"
  | 'prioritization_tradeoff'  // "Feature A vs Feature B"
  | 'prioritization_decline'   // "How do I say no to this request?"
  // Execution
  | 'execution_prd'            // "Write a PRD for..."
  | 'execution_stories'        // "Generate user stories for..."
  | 'execution_tickets'        // "Create Jira tickets from..."
  | 'execution_rfc'            // "Write an RFC for..."
  | 'execution_ac'             // "Write acceptance criteria for..."
  // Sprint & Ops
  | 'sprint_planning'          // "Help me plan sprint 24"
  | 'sprint_standup'           // "Generate today's standup"
  | 'sprint_retro'             // "Write sprint retro"
  | 'sprint_summary'           // "Sprint 24 summary for stakeholders"
  | 'ops_meeting'              // "Summarize these meeting notes"
  // Competitive & Market
  | 'competitive_intel'        // "What has Competitor X shipped?"
  | 'competitive_battlecard'   // "Build a battlecard vs Competitor X"
  | 'market_sizing'            // "What's the TAM for..."
  | 'market_trends'            // "What trends are affecting our space?"
  // GTM & Launch
  | 'gtm_planning'             // "Plan the GTM for this feature"
  | 'gtm_messaging'            // "Write launch messaging for..."
  | 'gtm_checklist'            // "Build the launch readiness checklist"
  | 'gtm_enablement'           // "Prep Sales and Support for the launch"
  | 'release_gonogo'           // "Is this ready to ship?"
  // Post-Launch
  | 'postlaunch_review'        // "How is feature X performing vs targets?"
  // PM Growth
  | 'coaching'                 // "Help me with my promotion doc"
  | 'survey_design'            // "Design a survey about onboarding friction"
  // Fallback
  | 'generic';

// ── Route Definition ──────────────────────────────────────────────────────────

export type ExecutionMode = 'single' | 'parallel' | 'sequential';

export interface AgentRoute {
  primary: AgentId;
  supporting: AgentId[];
  execution: ExecutionMode;
  label: string;
  description: string;
  estimatedLatencyMs: number;
}

// ── Intent → Agent Route Map ──────────────────────────────────────────────────

export const INTENT_ROUTES: Record<IntentType, AgentRoute> = {

  // ── Research & Discovery ────────────────────────────────────────────────────

  research_discovery: {
    primary: 'research_orchestrator',
    supporting: ['signal_aggregator', 'research', 'analytics'],
    execution: 'parallel',
    label: 'Research Brief',
    description: 'Multi-source discovery across VOC, metrics, and signal memory',
    estimatedLatencyMs: 8000,
  },
  research_anomaly: {
    primary: 'research_orchestrator',
    supporting: ['analytics', 'research', 'signal_aggregator'],
    execution: 'sequential', // analytics first, then cross-reference with research
    label: 'Anomaly Investigation',
    description: 'Root cause investigation pulling metrics + user signals in parallel',
    estimatedLatencyMs: 10000,
  },
  research_validation: {
    primary: 'research_orchestrator',
    supporting: ['research', 'analytics', 'competitive', 'social_signal'],
    execution: 'parallel',
    label: 'Decision Validation',
    description: 'Validates a hypothesis with evidence from all signal sources',
    estimatedLatencyMs: 12000,
  },
  research_synthesis: {
    primary: 'signal_aggregator',
    supporting: ['research', 'analytics', 'competitive'],
    execution: 'parallel',
    label: 'Signal Synthesis',
    description: 'Aggregates and themes signals across all internal and external sources',
    estimatedLatencyMs: 9000,
  },

  // ── Strategy ────────────────────────────────────────────────────────────────

  strategy_okr: {
    primary: 'strategy',
    supporting: ['research_orchestrator', 'analytics'],
    execution: 'sequential', // pull context first, then generate OKRs
    label: 'OKR Draft',
    description: 'Generates OKRs with user signal and metric baseline pre-populated',
    estimatedLatencyMs: 7000,
  },
  strategy_roadmap: {
    primary: 'strategy',
    supporting: ['research_orchestrator', 'market', 'signal_aggregator', 'prioritization'],
    execution: 'parallel',
    label: 'Roadmap Planning',
    description: 'Builds roadmap with external signals, market context, and prioritization scoring',
    estimatedLatencyMs: 15000,
  },
  strategy_bet: {
    primary: 'strategy',
    supporting: ['research_orchestrator', 'market', 'competitive'],
    execution: 'parallel',
    label: 'Strategic Bet',
    description: 'Builds a 1-pager for a strategic bet with market and user evidence',
    estimatedLatencyMs: 12000,
  },
  strategy_comms: {
    primary: 'strategy',
    supporting: [],
    execution: 'single',
    label: 'Roadmap Comms',
    description: 'Writes audience-specific roadmap communication',
    estimatedLatencyMs: 3000,
  },

  // ── Prioritization ──────────────────────────────────────────────────────────

  prioritization_ranking: {
    primary: 'prioritization',
    supporting: ['research_orchestrator', 'engineering'],
    execution: 'parallel',
    label: 'Feature Ranking',
    description: 'Scores and ranks features using workspace framework with demand + effort validation',
    estimatedLatencyMs: 10000,
  },
  prioritization_request: {
    primary: 'prioritization',
    supporting: ['research_orchestrator', 'engineering', 'analytics'],
    execution: 'parallel',
    label: 'Stakeholder Request',
    description: 'Evaluates an external request with evidence, scoring, and a recommended response',
    estimatedLatencyMs: 12000,
  },
  prioritization_tradeoff: {
    primary: 'prioritization',
    supporting: ['research_orchestrator', 'engineering'],
    execution: 'parallel',
    label: 'Trade-off Analysis',
    description: 'Side-by-side comparison of two options with scoring and recommendation',
    estimatedLatencyMs: 8000,
  },
  prioritization_decline: {
    primary: 'prioritization',
    supporting: [],
    execution: 'single',
    label: 'Structured Decline',
    description: 'Writes a data-backed, respectful decline with alternative framing',
    estimatedLatencyMs: 3000,
  },

  // ── Execution ───────────────────────────────────────────────────────────────

  execution_prd: {
    primary: 'docs',
    supporting: ['research_orchestrator', 'analytics', 'competitive'],
    execution: 'sequential', // pull context first (parallel), then write PRD
    label: 'PRD',
    description: 'Writes PRD with user research, metrics baseline, and competitive context pre-filled',
    estimatedLatencyMs: 14000,
  },
  execution_stories: {
    primary: 'docs',
    supporting: [],
    execution: 'single',
    label: 'User Stories',
    description: 'Generates user stories in workspace format with AC',
    estimatedLatencyMs: 4000,
  },
  execution_tickets: {
    primary: 'docs',
    supporting: [],
    execution: 'single',
    label: 'Jira Tickets',
    description: 'Creates Jira-ready tickets in workspace format',
    estimatedLatencyMs: 3000,
  },
  execution_rfc: {
    primary: 'docs',
    supporting: ['engineering'],
    execution: 'sequential',
    label: 'RFC',
    description: 'Writes RFC with engineering feasibility context',
    estimatedLatencyMs: 6000,
  },
  execution_ac: {
    primary: 'docs',
    supporting: [],
    execution: 'single',
    label: 'Acceptance Criteria',
    description: 'Writes precise Given/When/Then AC for a story or feature',
    estimatedLatencyMs: 2500,
  },

  // ── Sprint & Ops ────────────────────────────────────────────────────────────

  sprint_planning: {
    primary: 'ops',
    supporting: ['prioritization', 'analytics'],
    execution: 'parallel',
    label: 'Sprint Planning',
    description: 'Plans sprint with backlog priority scores and velocity context',
    estimatedLatencyMs: 7000,
  },
  sprint_standup: {
    primary: 'ops',
    supporting: [],
    execution: 'single',
    label: 'Daily Standup',
    description: 'Generates standup from Jira current state',
    estimatedLatencyMs: 2000,
  },
  sprint_retro: {
    primary: 'ops',
    supporting: ['analytics'],
    execution: 'sequential',
    label: 'Sprint Retrospective',
    description: 'Writes structured retro with sprint metrics context',
    estimatedLatencyMs: 5000,
  },
  sprint_summary: {
    primary: 'ops',
    supporting: [],
    execution: 'single',
    label: 'Sprint Summary',
    description: 'End-of-sprint stakeholder summary',
    estimatedLatencyMs: 3000,
  },
  ops_meeting: {
    primary: 'ops',
    supporting: [],
    execution: 'single',
    label: 'Meeting Notes',
    description: 'Structured meeting notes with decisions and action items',
    estimatedLatencyMs: 2500,
  },

  // ── Competitive & Market ────────────────────────────────────────────────────

  competitive_intel: {
    primary: 'competitive',
    supporting: ['social_signal'],
    execution: 'parallel',
    label: 'Competitive Intel',
    description: 'Competitor analysis with community sentiment layered in',
    estimatedLatencyMs: 9000,
  },
  competitive_battlecard: {
    primary: 'competitive',
    supporting: [],
    execution: 'single',
    label: 'Battlecard',
    description: 'Sales battlecard for a specific competitor',
    estimatedLatencyMs: 5000,
  },
  market_sizing: {
    primary: 'market',
    supporting: [],
    execution: 'single',
    label: 'Market Sizing',
    description: 'TAM/SAM/SOM with methodology and source citations',
    estimatedLatencyMs: 8000,
  },
  market_trends: {
    primary: 'market',
    supporting: ['social_signal', 'competitive'],
    execution: 'parallel',
    label: 'Market Trends',
    description: 'Industry trends with public signal and competitive data',
    estimatedLatencyMs: 10000,
  },

  // ── GTM & Launch ────────────────────────────────────────────────────────────

  gtm_planning: {
    primary: 'gtm',
    supporting: ['sales', 'research_orchestrator'],
    execution: 'parallel',
    label: 'GTM Plan',
    description: 'Full GTM plan with messaging, channels, and cross-functional readiness',
    estimatedLatencyMs: 10000,
  },
  gtm_messaging: {
    primary: 'gtm',
    supporting: ['research_orchestrator'],
    execution: 'sequential',
    label: 'Launch Messaging',
    description: 'Persona-targeted messaging with user signal context',
    estimatedLatencyMs: 7000,
  },
  gtm_checklist: {
    primary: 'gtm',
    supporting: ['release'],
    execution: 'sequential',
    label: 'Launch Checklist',
    description: 'Cross-functional launch checklist with T-minus timeline',
    estimatedLatencyMs: 5000,
  },
  gtm_enablement: {
    primary: 'gtm',
    supporting: ['sales'],
    execution: 'sequential',
    label: 'Enablement Brief',
    description: 'Sales and Support enablement brief for a launch',
    estimatedLatencyMs: 6000,
  },
  release_gonogo: {
    primary: 'release',
    supporting: ['review', 'analytics'],
    execution: 'parallel',
    label: 'Go / No-Go',
    description: 'Release readiness assessment with quality review and metric checks',
    estimatedLatencyMs: 8000,
  },

  // ── Post-Launch ─────────────────────────────────────────────────────────────

  postlaunch_review: {
    primary: 'analytics',
    supporting: ['research_orchestrator', 'signal_aggregator'],
    execution: 'parallel',
    label: 'Post-Launch Review',
    description: 'Performance review vs launch success metrics with user signal',
    estimatedLatencyMs: 10000,
  },

  // ── PM Growth ───────────────────────────────────────────────────────────────

  coaching: {
    primary: 'coach',
    supporting: [],
    execution: 'single',
    label: 'PM Coaching',
    description: 'Career coaching, interview prep, promotion docs',
    estimatedLatencyMs: 3500,
  },
  survey_design: {
    primary: 'research',
    supporting: [],
    execution: 'single',
    label: 'Survey Design',
    description: 'Unbiased survey design for a specific research objective',
    estimatedLatencyMs: 3000,
  },

  // ── Fallback ────────────────────────────────────────────────────────────────

  generic: {
    primary: 'strategy',
    supporting: [],
    execution: 'single',
    label: 'General Query',
    description: 'General PM query — routed to Strategy Copilot',
    estimatedLatencyMs: 3000,
  },
};

// ── Intent Detection Patterns ─────────────────────────────────────────────────

interface IntentPattern {
  type: IntentType;
  patterns: RegExp[];
  keywords: string[];
}

const INTENT_PATTERNS: IntentPattern[] = [
  // Research
  { type: 'research_anomaly',     patterns: [/why did .*(drop|fall|decline|decrease)/i, /what (caused|happened to) .*(metric|rate|score)/i],            keywords: ['dropped', 'fell', 'root cause', 'investigate', 'anomaly', 'why did'] },
  { type: 'research_validation',  patterns: [/is there demand for/i, /do users want/i, /validate (this|the) (hypothesis|decision|bet)/i],                keywords: ['validate', 'hypothesis', 'evidence', 'demand for', 'do users want'] },
  { type: 'research_discovery',   patterns: [/what are users (saying|thinking|feeling)/i, /top (pain points|complaints|requests)/i, /user (signal|feedback|insight)/i], keywords: ['users saying', 'pain points', 'user sentiment', 'feedback', 'NPS', 'churn signals'] },
  { type: 'research_synthesis',   patterns: [/summarize (all )?signals?/i, /aggregate.*(signal|feedback|insight)/i],                                    keywords: ['summarize signals', 'aggregate', 'all feedback', 'theme clusters'] },

  // Strategy
  { type: 'strategy_okr',         patterns: [/draft (okrs?|objectives)/i, /help.*(okrs?|key results)/i, /okr.*(q[1-4]|quarter|this quarter)/i],         keywords: ['OKR', 'objectives', 'key results', 'quarterly goals'] },
  { type: 'strategy_roadmap',     patterns: [/roadmap/i, /what should (we|be) (build|on|in).*(h[12]|q[1-4]|roadmap)/i],                                 keywords: ['roadmap', 'what to build', 'h1', 'h2', 'planning'] },
  { type: 'strategy_bet',         patterns: [/strategic bet/i, /build (a )?case for/i, /1.?pager (for|on)/i],                                           keywords: ['strategic bet', '1-pager', 'build the case', 'exec alignment'] },
  { type: 'strategy_comms',       patterns: [/communicate.*(roadmap|strategy)/i, /roadmap (for|to) (exec|sales|eng|board)/i],                           keywords: ['communicate roadmap', 'roadmap to sales', 'stakeholder comms'] },

  // Prioritization
  { type: 'prioritization_request',patterns: [/(sales|customer|exec|ceo|cto|vp).*(want|asking|requesting|needs?)/i, /\$\d+k?.*(deal|contract|account)/i], keywords: ['sales wants', 'customer asking', 'deal unblocking', 'urgent request'] },
  { type: 'prioritization_ranking',patterns: [/rank (these|the|my|our)/i, /score.*(features?|items?|backlog)/i, /which.*(first|next|prioritize)/i],      keywords: ['rank', 'score', 'prioritize', 'backlog', 'RICE', 'ICE'] },
  { type: 'prioritization_tradeoff',patterns: [/vs\.?|versus|option a.*(option b)/i, /compare.*(feature|initiative|approach)/i],                        keywords: ['vs', 'versus', 'trade-off', 'option A', 'option B', 'compare'] },
  { type: 'prioritization_decline',patterns: [/say no to/i, /how (do i|to) decline/i, /push back on/i],                                                keywords: ['say no', 'decline', 'push back', 'not doing this'] },

  // Execution
  { type: 'execution_prd',        patterns: [/write.*(prd|product requirements)/i, /(prd|spec) for/i],                                                  keywords: ['PRD', 'product requirements', 'write spec', 'feature spec'] },
  { type: 'execution_stories',    patterns: [/user stor(y|ies)/i, /generate.*(stories|tickets)/i, /jira.*(stories|tickets)/i],                          keywords: ['user stories', 'user story', 'acceptance criteria batch', 'jira stories'] },
  { type: 'execution_tickets',    patterns: [/create.*(jira|tickets?|issues?)/i, /break.*(epic|prd).*(tasks?|tickets?)/i],                              keywords: ['create tickets', 'jira tickets', 'break into tasks', 'sub-tasks'] },
  { type: 'execution_rfc',        patterns: [/rfc|request for comment/i, /write.*(rfc|architecture decision)/i],                                        keywords: ['RFC', 'architecture decision', 'request for comments'] },
  { type: 'execution_ac',         patterns: [/acceptance criteria/i, /given.?when.?then/i],                                                             keywords: ['acceptance criteria', 'AC', 'given when then'] },

  // Sprint & Ops
  { type: 'sprint_planning',      patterns: [/plan (sprint|the sprint|sprint \d+)/i, /sprint planning/i],                                               keywords: ['plan sprint', 'sprint planning', 'sprint capacity', 'sprint goal'] },
  { type: 'sprint_standup',       patterns: [/standup|stand-up|daily update/i],                                                                         keywords: ['standup', 'daily update', 'what I did', 'blockers'] },
  { type: 'sprint_retro',         patterns: [/retro(spective)?/i, /what (worked|didn.t work)/i],                                                       keywords: ['retro', 'retrospective', 'what worked', 'went well'] },
  { type: 'sprint_summary',       patterns: [/sprint summary/i, /sprint \d+ (summary|recap|report)/i],                                                 keywords: ['sprint summary', 'sprint recap', 'sprint report'] },
  { type: 'ops_meeting',          patterns: [/meeting notes/i, /summarize (this|the) meeting/i],                                                        keywords: ['meeting notes', 'action items', 'decisions', 'summarize meeting'] },

  // Competitive & Market
  { type: 'competitive_battlecard',patterns: [/battlecard/i, /vs\.? (competitor|productboard|aha|linear|jira)/i],                                       keywords: ['battlecard', 'vs competitor', 'win loss'] },
  { type: 'competitive_intel',    patterns: [/what (has|did|is) (competitor|productboard|aha|linear) (shipped?|launched?|done|doing)/i, /competitor (update|news|move)/i], keywords: ['competitor launch', 'what shipped', 'competitive move', 'competitor news'] },
  { type: 'market_sizing',        patterns: [/tam|sam|som|market size|total addressable/i],                                                              keywords: ['TAM', 'SAM', 'SOM', 'market size', 'addressable market'] },
  { type: 'market_trends',        patterns: [/market trend/i, /what.*(happening|changing|shifting) in (the )?(market|industry|space)/i],                keywords: ['market trends', 'industry trends', 'market shifts', 'macro'] },

  // GTM & Launch
  { type: 'gtm_planning',         patterns: [/gtm|go.to.market|launch plan/i],                                                                          keywords: ['GTM', 'go to market', 'launch plan', 'launch strategy'] },
  { type: 'gtm_messaging',        patterns: [/launch message|launch copy|announcement (copy|text|message)/i],                                           keywords: ['launch messaging', 'announcement', 'launch copy', 'feature messaging'] },
  { type: 'gtm_checklist',        patterns: [/launch (checklist|readiness)/i, /ready (to|for) launch/i],                                               keywords: ['launch checklist', 'launch readiness', 'pre-launch'] },
  { type: 'gtm_enablement',       patterns: [/enable (sales|support)|sales (brief|training|prep)/i],                                                   keywords: ['enable sales', 'sales brief', 'support brief', 'enablement'] },
  { type: 'release_gonogo',       patterns: [/go.?no.?go|ship (this|it|now)?|ready to (ship|release)/i],                                               keywords: ['go no go', 'ready to ship', 'release decision', 'UAT'] },

  // Post-Launch
  { type: 'postlaunch_review',    patterns: [/how is.*(feature|launch).*(performing|doing)/i, /post.?launch (review|check)/i],                          keywords: ['post launch', 'launch performance', 'feature adoption', 'vs targets'] },

  // PM Growth
  { type: 'coaching',             patterns: [/promotion|career|interview prep|feedback on me|pm coach/i],                                               keywords: ['promotion doc', 'career advice', 'interview prep', 'PM coach', 'growth plan'] },
  { type: 'survey_design',        patterns: [/design.*(survey|questionnaire)|write.*(survey questions?)/i],                                              keywords: ['survey', 'questionnaire', 'NPS survey', 'survey design'] },
];

// ── Main Router Function ──────────────────────────────────────────────────────

export function routeIntent(query: string): { intent: IntentType; route: AgentRoute; confidence: number } {
  const lower = query.toLowerCase();
  let bestMatch: IntentType = 'generic';
  let bestScore = 0;

  for (const pattern of INTENT_PATTERNS) {
    let score = 0;

    // Pattern match = high confidence
    for (const rx of pattern.patterns) {
      if (rx.test(query)) { score += 10; break; }
    }

    // Keyword match = moderate confidence
    for (const kw of pattern.keywords) {
      if (lower.includes(kw.toLowerCase())) score += 2;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = pattern.type;
    }
  }

  const confidence = Math.min(100, bestScore * 8);

  return {
    intent: bestMatch,
    route: INTENT_ROUTES[bestMatch],
    confidence,
  };
}

// ── Category Labels ───────────────────────────────────────────────────────────

export const INTENT_CATEGORY_LABELS: Record<string, string> = {
  research:        'Research & Discovery',
  strategy:        'Strategy & OKRs',
  prioritization:  'Prioritization',
  execution:       'Execution',
  sprint:          'Sprint & Ops',
  ops:             'Sprint & Ops',
  competitive:     'Competitive & Market',
  market:          'Competitive & Market',
  gtm:             'GTM & Launch',
  release:         'GTM & Launch',
  postlaunch:      'Post-Launch',
  coaching:        'PM Growth',
  survey:          'PM Growth',
  generic:         'General',
};

// ── Quick-access intent shortcuts (for UI chips) ──────────────────────────────

export interface IntentShortcut {
  label: string;
  query: string;
  intent: IntentType;
  icon: string;
}

export const INTENT_SHORTCUTS: IntentShortcut[] = [
  { label: 'Draft OKRs',         query: 'Help me draft OKRs for this quarter',                          intent: 'strategy_okr',           icon: '🎯' },
  { label: 'Write PRD',          query: 'Write a PRD for',                                              intent: 'execution_prd',          icon: '📄' },
  { label: 'Plan sprint',        query: 'Help me plan the upcoming sprint',                              intent: 'sprint_planning',        icon: '⚡' },
  { label: 'Rank features',      query: 'Rank these features against our OKRs',                         intent: 'prioritization_ranking', icon: '⚖️' },
  { label: 'Investigate metric', query: 'Why did this metric drop?',                                    intent: 'research_anomaly',       icon: '🔍' },
  { label: 'Stakeholder ask',    query: 'Sales is asking for a feature — should we build it?',          intent: 'prioritization_request', icon: '💼' },
  { label: 'Launch plan',        query: 'Help me plan the GTM for this feature',                        intent: 'gtm_planning',           icon: '📣' },
  { label: 'Roadmap review',     query: 'Review and challenge our current roadmap',                     intent: 'strategy_roadmap',       icon: '🗺️' },
  { label: 'Weekly digest',      query: 'What signals should I know about this week?',                  intent: 'research_discovery',     icon: '📡' },
  { label: 'Say no',             query: 'Help me write a structured decline for this request',          intent: 'prioritization_decline', icon: '🚫' },
];
