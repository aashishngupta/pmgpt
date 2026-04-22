# pmGPT — Product Specification
**Version:** 1.0  
**Author:** Aashish Gupta (discovery) + Claude Code (synthesis)  
**Date:** April 2026  
**Status:** Living document — update before every major sprint

---

## 1. Product Vision

**pmGPT is the AI operating system for the product function.**

It turns one smart person — a founder, a Head of Product, a solo PM — into a full product team. Every task a PM org does today (PRDs, Jira tickets, sprint planning, competitive research, metrics analysis, release notes, roadmap, customer feedback synthesis) is either automated, accelerated, or intelligently assisted.

**Design philosophy: Canva, not Photoshop.**

Canva didn't beat Photoshop by being more powerful. It won by making 90% of what people actually need effortless, while hiding — but not removing — the depth. pmGPT follows the same principle:

- Everything works out of the box with sensible defaults
- Pre-built agents, workflows, and templates handle every common PM task
- Zero configuration required to get value on day one
- But every agent, workflow, template, and connector is fully customizable at every level
- Power users can go as deep as they want — the complexity is always one click away, never in the way

---

## 2. The Problem

### Who feels this pain

**Primary ICP:**
- Founders acting as de facto PM (pre-Series B, no dedicated PM)
- Head of Product / Director of Product at lean companies (1–3 PMs covering full product function)
- Solo PMs at early-stage companies wearing multiple hats

**Secondary ICP:**
- Small PM teams (2–5 PMs) at Series A–C companies who need to move at startup speed
- Technical founders who understand product but lose 40% of their week to PM busywork

### The actual pain

A founder or Head of Product doing their job today touches 8–10 tools constantly. Their week looks like this:

- Write a PRD in Notion (2–3 sessions, 3–4 hours)
- Break it into Jira epics and tickets (1–2 hours)
- Run grooming with engineering — answer the same questions already in the PRD (1 hour)
- Sprint planning (1 hour)
- Daily standups across 2–3 teams
- Design reviews — give feedback, track iterations
- Pull metrics from Amplitude/Mixpanel, build a Slack summary (1 hour)
- Monitor Jira comments for blockers — manual scan
- Competitive research — Google, G2, Twitter, newsletters (2 hours/week)
- Gather customer feedback — Intercom, support tickets, sales calls
- Write release notes
- Update the roadmap
- Stakeholder updates to investors/leadership

**The result:** 60–70% of their time goes to coordination, documentation, and information synthesis. 30–40% goes to actual product thinking — strategy, prioritization, customer insight.

pmGPT inverts this ratio.

---

## 3. Product Philosophy

### The three modes of pmGPT

**1. Automate** — Background agents run on schedules you define and surface results on your home screen. No intervention required. (e.g., daily metrics digest, sprint blocker scan, weekly competitive sweep)

**2. Accelerate** — You start a task, the copilot does the heavy work. You review, edit, approve, and push. 10x faster than doing it manually. (e.g., PRD writing, Jira ticket generation, release notes)

**3. Assist** — The AI is present in every context, answering questions, surfacing context, guiding decisions. Engineers can chat with a PRD. The PM can ask why a metric dropped. (e.g., contextual Q&A on artifacts, data analysis, decision support)

### Customizable to the core

Every layer is configurable:
- **Agents**: Prompt, tonality, personality, LLM model, temperature, access level, enabled/disabled
- **Workflows**: Trigger, steps, output channels, schedule — fully editable on a visual canvas
- **Home screen**: Add/remove/rearrange widgets via natural language or drag-and-drop
- **Templates**: All PRD, ticket, release note templates are editable
- **Connectors**: Any tool via MCP or direct integration — you pick your stack during onboarding

But none of this is required. A user who never opens settings gets a fully functional product from day one.

---

## 4. User Journey

### 4.1 Onboarding (First-time setup, ~5 minutes)

**Step 1 — Identity**
- Name, work email
- Role: Founder / Head of Product / PM / Other
- Company name, industry, stage (pre-seed → Series C+ → enterprise)

**Step 2 — Team size**
- Solo (just me)
- Small team (2–5 PMs)
- Mid (5–15)
- Enterprise (15+)

**Step 3 — Primary goals** (multi-select)
- Build faster with less overhead
- Keep engineering team unblocked
- Stay on top of metrics and data
- Competitive intelligence
- Customer feedback synthesis
- Roadmap and strategy
- Release management

**Step 4 — Connect your stack**
- Full list of connectors shown (Jira, Linear, Notion, Confluence, Slack, Teams, Figma, GitHub, Amplitude, Mixpanel, Intercom, Salesforce, HubSpot, Google Drive, Calendar, and more via MCP)
- User enables what they use — one click per connector, OAuth or API key
- Each connector shows exactly what it will access (read-only by default)

**Step 5 — Enable agents**
- Recommended agents shown based on role + goals selected
- All 10 agents listed with clear descriptions
- One toggle per agent — enable what you want
- Recommended set is pre-selected based on answers

**Step 6 — Home screen preview**
- "Your workspace is ready" screen
- Shows a preview of what their home screen will look like
- Quick tour of the 3 core areas: Home, Agents, Workflows

### 4.2 Home Screen (Daily driver)

The home screen is a **living command center** — not a static dashboard.

**What appears on it:**
- Output cards from autonomous agents that ran since last visit (morning digest, sprint alerts, competitive updates)
- Widgets the user has added via conversation or drag-and-drop
- Quick-action shortcuts for the most common tasks based on usage patterns
- In-progress work items (PRDs in draft, tickets being reviewed, releases in UAT)

**The home screen chatbot:**
- Embedded in the home screen
- Can answer questions ("what's my sprint health?")
- Can take actions ("create a daily metrics widget for DAU and churn")
- When you say "add a section showing all Jira tickets where team is waiting for answers, delayed 2+ days in current sprint" → it creates that as a live widget, powered by the Jira connector running that query on a schedule

**Widgets = saved agent queries rendered as UI components.**
Every widget is a parameterised agent query running on a schedule and displaying the result. Fully addable and removable. No code.

### 4.3 Core Interaction Flow (Alert → Investigate → Preview → Approve → Execute)

This is the fundamental interaction model for any agent-driven action:

```
1. ALERT      → Agent surfaces finding on home screen (blocker found, metric dropped, etc.)
2. INVESTIGATE → User clicks "Chat about this" → opens chat, invokes the right agent,
                  fetches all memory and context for this artifact/domain
3. GUIDE      → Agent guides, recommends, searches — answers questions, proposes actions
4. PREVIEW    → Before any write action: agent shows EXACTLY what it will do
                  ("Here is the Jira comment I will post. Here is the ticket I will update.")
5. APPROVE    → User reviews and approves
6. EXECUTE    → Action runs. Confirmation shown.
```

The agent **never acts unilaterally.** Every write action requires human approval with a preview.

### 4.4 Artifact Lifecycle (Draft → Published)

**Draft state (not pushed to external platform):**
- Full chat history preserved across multiple sessions
- Like a GPT/Claude Project — you work on a PRD across 5 sessions over 3 days, all history intact
- Agent remembers all decisions, tradeoffs, context from every session
- Shown in "In Progress" on the home screen

**Published state (pushed to Jira, Notion, etc.):**
- Artifact memory (structured decisions, reasoning, open questions) stored and linked to external ID
- Full chat history archived (retention period configurable in admin settings)
- Agent can still answer questions about the artifact using the structured memory — without re-reading the full document
- Memory linked by external ID (e.g., Jira ticket key PMGPT-123, Notion page UUID)

### 4.5 Engineering Team Usage

Engineers log in with their role-based access. They can:
- Browse PRDs, view their Jira tickets
- Open any PRD → click "Chat about this" → invoke the artifact's agent
- Ask questions in plain language ("why was X excluded from scope?", "what does this requirement mean?")
- Agent answers from artifact memory — structured decisions, not just re-reading the doc
- Saves grooming sessions. Engineers get answers async, on their schedule.

---

## 5. Feature Epics

### Epic 1 — Authentication & Workspace
- Proper signup/signin (email + OAuth: Google, GitHub)
- Workspace creation and configuration
- Admin panel: manage team members, roles, permissions
- Role-based access control: Admin > PM Lead > PM > Engineer > Viewer
- Invite flow with role assignment

### Epic 2 — Onboarding Flow
- Multi-step onboarding wizard (role, company, industry, goals, team size)
- Connector setup step with OAuth/API key flows for all integrations
- Agent activation step with smart recommendations
- First-run experience: home screen orientation tour
- Onboarding progress saved — resumable if abandoned

### Epic 3 — Home Screen
- Dynamic widget grid (configurable layout)
- Natural language widget creation via home screen chatbot
- Autonomous agent output cards (run results surfaced as alerts)
- In-progress work tracker (drafts, reviews, UAT items)
- Quick-action shortcuts (contextual, based on usage)
- Running window configuration per workflow (daily, per sprint, custom)

### Epic 4 — Agents
- 10 core agents (Strategy, Docs, Analytics, Research, Ops, Review, Engineering, Competitive, Sales, Coach)
- Per-agent configuration: name, system prompt, tonality, personality, LLM model, temperature, access
- AI Rewrite for system prompts
- Enable/disable toggle per agent
- Multi-session chat history (GPT Projects model) — multiple threads per agent
- Sandbox tab for testing agent behaviour before deployment
- Role-based agent access (admin configures who can use which agents)

### Epic 5 — Workflows
- Visual n8n-style canvas (React Flow) for building and editing workflows
- Trigger types: schedule, webhook, event (metric anomaly, Jira event), manual
- Workflow library: pre-built workflows for all common PM automation tasks
- Duplicate, pause, activate, delete workflows
- Run history with success/failure logs
- Workflow-level running window configuration
- Sub-agent invocation within workflows

### Epic 6 — PRD & Documentation
- PRD creation via Docs Writer agent with multi-session context
- PRD stages: Problem → Research → Goals → Competitive → Scope → Requirements → Risks → Draft
- All stages are structured and preserved in artifact memory
- Push PRD to Notion (as a page) or export as Markdown
- Jira epic + ticket generation from PRD (one click, human in loop for review)
- Release notes generation from Jira sprint or GitHub diff
- Design brief generation

### Epic 7 — Jira / Linear Integration (Deep)
- Read: fetch issues, sprints, epics, comments, blockers
- Write: create issues, update status, post comments, link tickets (all with human-in-loop preview)
- Smart: detect deal-breaker comments, unanswered questions in comments, sprint risk signals
- Sprint planning assistant: story point estimation, capacity planning, dependency mapping
- Grooming support: engineers chat with PRD agent to resolve questions async

### Epic 8 — Memory System
- **Workspace memory** (~300 tokens): company, product, team, current sprint, OKRs — injected into every conversation
- **Artifact memory** (~800 tokens per artifact): decisions made, reasoning, open questions, triggers — generated at publish time
- **Session memory**: full chat history for draft artifacts, across multiple sessions
- Memory retention configurable per workspace (admin settings)
- Memory viewer: see what the agent knows about any artifact
- Memory decay/archive model for old published artifacts

### Epic 9 — Analytics & Metrics
- Connect to Amplitude, Mixpanel, GA, Segment, or custom data sources
- Daily/weekly digest: key metrics surfaced as home screen cards
- Anomaly detection: alert when a metric moves more than X% from baseline
- Funnel analysis on demand
- Churn, retention, engagement, adoption tracking
- Natural language queries ("what's our D7 retention this week vs last month?")

### Epic 10 — Connectors & MCP Library
- Full connector list: Jira, Linear, Notion, Confluence, Slack, Teams, Figma, GitHub, Amplitude, Mixpanel, GA, Intercom, Salesforce, HubSpot, Google Drive, Calendar, Zoom
- MCP server library: any tool that exposes an MCP server can be connected
- Per-connector permission scoping (read-only vs read-write)
- Connector health dashboard
- Admin controls: which connectors each role can use

### Epic 11 — Competitive & Market Intelligence
- Competitive Intel agent: monitors competitor websites, G2 reviews, product changelogs, job postings
- Generates weekly competitive sweep reports
- Battlecard creation and maintenance
- Market signal detection (pricing changes, new features, funding announcements)

### Epic 12 — Customer & Feedback
- Connect to Intercom, Zendesk, Typeform, Gong, Salesforce
- Feedback synthesis: cluster themes from support tickets, NVR calls, reviews
- Survey creation and distribution
- Churn signal detection from support conversation patterns
- Sales follow-up automation

---

## 6. System Design

### 6.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Next.js)                          │
│                                                                       │
│   Home Screen    Agents     Workflows    PRD/Docs    Analytics       │
│   (widgets)     (chat +     (RF canvas)  (multi-     (dashboards)   │
│                  config)                  session)                    │
└───────────────────────────┬─────────────────────────────────────────┘
                             │ REST + WebSocket
┌───────────────────────────▼─────────────────────────────────────────┐
│                          BACKEND (FastAPI)                            │
│                                                                       │
│   Auth/RBAC   Agent Router   Memory API   Workflow Engine   Webhook  │
│   Middleware  (orchestrator)  (read/write) (scheduler)      Handler  │
└────────┬──────────┬──────────────┬────────────┬────────────────────┘
         │          │              │            │
    ┌────▼───┐  ┌───▼────┐   ┌────▼───┐   ┌───▼─────────────┐
    │  LLM   │  │Connector│   │Memory  │   │ Workflow Runner  │
    │ Router │  │Registry │   │ Store  │   │ (scheduled jobs) │
    │        │  │         │   │        │   │                  │
    │Claude  │  │Jira     │   │Workspace│  │Daily digest      │
    │GPT-4o  │  │Notion   │   │Artifact │  │Sprint scan       │
    │Gemini  │  │Slack    │   │Session  │  │Competitive sweep │
    │Mistral │  │Figma    │   │(draft)  │  │Metric anomaly    │
    └────────┘  │GitHub   │   └────────┘  └─────────────────┘
                │Amplitude│
                │MCP ...  │
                └─────────┘
```

### 6.2 Memory Architecture (Two-Layer)

**Layer 1 — Workspace Memory** (always injected, ~300 tokens)
```json
{
  "company": "Acme Corp — B2B SaaS, Series A",
  "product": "AI analytics platform for mid-market",
  "team": "PM: Aashish. Eng lead: Dev. Designer: Alex.",
  "sprint": "Sprint 24, ends Apr 24, activation focus",
  "okrs": "Q2: Activation 45%, MRR $150k, Churn <3%"
}
```

**Layer 2 — Artifact Memory** (injected when chatting about an artifact, ~800 tokens)
```json
{
  "artifact_id": "PMGPT-123",
  "artifact_type": "prd",
  "title": "Mobile Onboarding Redesign",
  "summary": "Redesign the 6-step onboarding to reduce drop-off at step 3",
  "decisions": [
    "Excluded Android — iOS-first user base, bandwidth constraints",
    "Chose modal flow — retention data showed 12% drop-off on separate screen"
  ],
  "open_questions": ["Payment method handling TBD", "Figma handoff pending"],
  "key_context": ["Triggered by 8% activation drop in Apr", "Sprint 24 priority"],
  "stage": "requirements",
  "linked_tickets": ["PMGPT-124", "PMGPT-125"]
}
```

**Token cost comparison:**
| Approach | Tokens per query | Relative cost |
|---|---|---|
| Re-read full PRD | 3,000–8,000 | 8x |
| Full conversation replay | 10,000–50,000 | 40x |
| **Structured artifact memory** | **800–1,200** | **1x** |

**Lifecycle:**
- Draft → full session history preserved across multiple sessions (GPT Projects model)
- Published → artifact memory extracted via a cheap summarisation call at publish time; linked to external ID
- Retention of chat history after publish: configurable in admin settings (default: 90 days)

### 6.3 Agent Model

Each agent is a domain specialist with:
- System prompt (editable by admin)
- Personality and tonality settings
- LLM model and parameters
- Access scope (which connectors it can use)
- Multiple chat threads (one per work item)

**Orchestration:**
- `PRD Copilot` is NOT a separate product area — it is the Docs Writer agent with a PRD template/flow
- The home screen chatbot is a meta-agent that routes to specialist agents based on intent
- Workflows invoke agents as steps — each step is an agent call with defined input/output
- Sub-agent invocations happen within a conversation (e.g., Docs Writer invokes Competitive Intel mid-PRD session)

### 6.4 Permissions Model

| Role | Can do |
|---|---|
| Admin | Everything — configure agents, workflows, connectors, team, billing |
| PM Lead | Create/edit workflows, configure agents, use all agents and connectors |
| PM | Use all enabled agents, create drafts, push artifacts (with approval flow) |
| Engineer | Read artifacts, chat with PRD/ticket agents for their team's area |
| Viewer | Read-only access to published artifacts and dashboards |

---

## 7. What NOT to Build (Non-Goals)

- **Not a project management tool** — we don't replace Jira or Linear; we enhance them
- **Not a documentation platform** — we don't replace Notion or Confluence; we write to them
- **Not a BI tool** — we don't replace Amplitude or Mixpanel; we read and synthesise from them
- **Not a design tool** — we don't touch Figma; we review and brief
- **Not a code editor** — we don't write code; we create the specs engineers build from
- **PRD Copilot is not a separate page** — it is a mode within the Docs Writer agent
- **No autopilot mode** — agents never take write actions without human review and approval

---

## 8. Success Metrics

### Activation
- % of users who complete onboarding (target: >80%)
- % of users who connect at least one connector in first session (target: >70%)
- % of users who send their first agent message within 10 minutes of onboarding (target: >60%)

### Engagement
- Daily active usage rate (target: 4+ days/week for primary ICP)
- Avg sessions per user per week (target: >5)
- Artifacts created per user per month (PRDs, tickets, release notes)

### Value delivery
- Time saved per user per week (survey-based, target: >5 hours)
- % of PRDs pushed to Jira/Notion without manual editing (target: >40%)
- Autonomous workflow runs per workspace per week

### Retention
- Week 4 retention (target: >60%)
- MRR churn (target: <3% monthly)

---

## 9. Open Questions

1. **Pricing model** — Per seat? Per workspace? Usage-based (token consumption)?
2. **Mobile** — Web-first initially, mobile app in v2?
3. **Self-hosted option** — For enterprises with data residency requirements?
4. **White-labelling** — Can companies brand pmGPT as their internal product tool?
5. **Marketplace** — Can users share/sell custom agent templates and workflows?
6. **Auth fixes** — Sign in/signup flows not properly linked to workspace context — must fix before any public launch

---

## 10. Immediate Next Steps (Sprint 25)

1. Fix authentication — proper session management, sign in/signup linked to workspace
2. Onboarding flow cleanup — connector setup step, agent activation step
3. Remove PRD Copilot as separate page — fold into Docs Writer agent as a template/mode
4. Home screen widget system — natural language widget creation
5. Jira write capability — create issues, post comments (human-in-loop)
6. Artifact memory generation on publish
7. Multi-session chat history (GPT Projects model) per agent thread
