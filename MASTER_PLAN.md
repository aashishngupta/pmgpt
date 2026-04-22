# pmGPT — Master Build Plan
**Last updated:** April 2026  
**Status:** Active planning document — update as things get built  
**Legend:** ✅ Exists & working | 🔧 Exists but incomplete/broken | ❌ Not built yet

---

## THE NORTH STAR
One person + pmGPT = a full product team. Context-aware. Proactive. Never acts without human approval. Never gives ambiguous answers — asks questions, validates thesis, then leads to results.

---

## SECTION 1 — FOUNDATION (Everything depends on this)

### 1.1 Authentication & Sessions
- ❌ Real user signup (email + password, hashed)
- ❌ Google OAuth (currently a TODO stub)
- ❌ JWT session tokens with refresh
- ❌ Workspace binding on login (user → workspace → role)
- ❌ Persistent sessions (cookies + server-side validation)
- ❌ Invite-based team signup (token link → auto-join workspace)
- ❌ Password reset flow
- 🔧 Frontend signup/login forms exist but write to localStorage only

### 1.2 Database
- ❌ PostgreSQL (or Supabase) schema design
- ❌ Tables: users, workspaces, workspace_members, sessions
- ❌ Tables: agents_config, agent_threads, messages
- ❌ Tables: artifacts, artifact_memory
- ❌ Tables: workspace_memory, widgets, workflow_runs, alerts
- ❌ Tables: connector_configs (OAuth tokens, per workspace)
- ❌ Migration system (Alembic)

### 1.3 API Layer
- ✅ FastAPI server running
- ✅ /chat endpoint working
- ✅ /health, /agents, /connectors, /rag/* endpoints
- ❌ /auth/* endpoints (signup, login, logout, refresh, invite)
- ❌ /workspace/* endpoints (create, update, get settings)
- ❌ /threads/* endpoints (create thread, get history, list threads)
- ❌ /artifacts/* endpoints (create, update, publish, get memory)
- ❌ /alerts/* endpoints (list, dismiss, mark as read)
- ❌ /widgets/* endpoints (create, update, delete, get data)
- ❌ /workflows/run endpoint (execute a workflow)
- ❌ /jira/comment, /jira/update endpoints
- 🔧 /jira/create endpoint (added create_issue to connector, not wired to API yet)

---

## SECTION 2 — AGENT SYSTEM (The core product)

### 2.1 Agent Definitions — Complete Roster

#### EXISTING IN BACKEND (need prompt upgrades):

**A1. Strategy Copilot**
- Purpose: Product strategy, roadmap planning, OKR setting, prioritization frameworks, GTM planning
- LLM: claude-opus-4-6 (highest reasoning needed)
- Connectors: Notion, Confluence, GDrive, Jira (for roadmap epics)
- System prompt upgrade needed: add guardrail rule (validate thesis, ask before concluding), add cross-context reasoning (pull analytics + roadmap + sales data together)
- Agentic actions: draft roadmap doc, create Jira epic, export to Notion
- Invocation: intent keywords + explicit @strategy

**A2. Docs Copilot**
- Purpose: PRDs, user stories, design briefs, release notes, RFCs, onboarding docs
- LLM: claude-sonnet-4-6 (strong writer)
- Connectors: Notion, Confluence, Jira (read epics/stories), GDrive
- Templates: Full PRD (8-stage), User Story Batch, Release Notes, Design Brief, RFC
- System prompt upgrade: multi-stage PRD flow, artifact memory generation on publish
- Agentic actions: push PRD to Notion, generate Jira tickets from PRD, export markdown
- Invocation: intent keywords, PRD template, @docs

**A3. Analytics Intel**
- Purpose: Metrics analysis, anomaly detection, funnel analysis, A/B test readouts, cohort analysis
- LLM: claude-sonnet-4-6
- Connectors: Amplitude/Mixpanel (future), Jira (for correlation), GDrive (for historical reports)
- System prompt upgrade: always show numbers with context (vs baseline, vs last period), never just report a metric — explain what it means, anomaly detection logic
- Agentic actions: generate metrics digest card for home screen, create alert if anomaly detected
- Invocation: intent keywords, scheduled workflow trigger, @analytics

**A4. Research Copilot**
- Purpose: User feedback synthesis, NPS analysis, interview synthesis, survey creation, customer insight
- LLM: claude-sonnet-4-6
- Connectors: Intercom (future), Notion, GDrive, Slack (customer channels)
- System prompt upgrade: cluster themes from raw feedback, always cite source count ("17 of 43 responses mention X"), don't extrapolate beyond data
- Agentic actions: create survey (Typeform/Google Forms), post synthesis to Notion, create insight card
- Invocation: @research, feedback/survey intent keywords

**A5. Ops Automation**
- Purpose: Sprint summaries, standups, release management, grooming prep, meeting notes, follow-ups, UAT coordination, changelog
- LLM: claude-haiku-4-5 (speed, cost — these are templated outputs)
- Connectors: Jira (primary), Slack, Notion, Confluence
- System prompt upgrade: always pull live Jira data, format for specific audience (stakeholder vs engineering vs leadership)
- Agentic actions: post to Slack, update Jira sprint, create Confluence page
- Invocation: schedule trigger (daily standup = 9am), manual, @ops

**A6. Review Agent**
- Purpose: PRD review, spec review, design brief review, code review summary (from GitHub PRs)
- LLM: claude-sonnet-4-6
- Connectors: GitHub (future), Notion, Jira, Figma (future)
- System prompt upgrade: structured review format (strengths / gaps / blockers / recommendations), always flag ambiguities
- Agentic actions: post review comments to Notion/Jira, approve/request changes
- Invocation: @review, triggered when artifact moves to "In Review" status

**A7. Sprint Agent** (merge into Ops or keep separate)
- Purpose: Sprint planning, velocity analysis, capacity planning, dependency mapping, burndown
- LLM: claude-haiku-4-5
- Connectors: Jira (primary)
- Agentic actions: create sprint in Jira, move tickets, update estimates
- Invocation: @sprint, sprint planning workflow trigger

#### NEED BACKEND PYTHON FILES (frontend exists, no backend agent):

**A8. Engineering Copilot**
- Purpose: Tech gap analysis, architecture review, estimation support, technical feasibility, tech debt mapping
- LLM: claude-opus-4-6 (technical depth needed)
- Connectors: GitHub (PRs, commits, issues), Jira, Confluence
- System prompt: "You are a principal engineer reviewing product specs and technical architecture. You identify gaps between what the PRD says and what engineering will need to build. You flag technical risks, estimate complexity (S/M/L/XL), and surface hidden dependencies. You ask clarifying questions before estimating — never give a number without knowing the scope."
- Agentic actions: add tech notes to Jira tickets, flag blockers, create architecture doc
- Override rule: never approve a technical approach without flagging at least one risk or open question
- Invocation: @engineering, when PRD moves to engineering review

**A9. Competitive Intel**
- Purpose: Competitor monitoring, battlecard creation/maintenance, market sweeps, G2/review analysis, pricing intelligence, job posting analysis
- LLM: claude-sonnet-4-6
- Connectors: Web search (via MCP/Tavily), Notion (store battlecards), GDrive
- System prompt: "You are a competitive intelligence analyst. You research competitors systematically — product features, pricing, G2 reviews, recent launches, job postings (signal of roadmap), funding events. You never make claims without a source. You structure all output as: What changed → Why it matters → What we should do. You invoke web search when asked about current events."
- MCPs: Tavily search, Firecrawl (competitor site scraping)
- Agentic actions: update battlecard in Notion, create competitive alert on home screen, schedule weekly sweep
- Invocation: @competitive, scheduled weekly workflow, triggered by keyword monitoring

**A10. Sales Enablement**
- Purpose: Deal context synthesis, objection handling, competitive positioning for sales, feature request triage from sales pipeline
- LLM: claude-sonnet-4-6
- Connectors: Salesforce/HubSpot (future), Notion (battlecards), Jira (feature requests)
- System prompt: "You are a product-aware sales enablement specialist. You help sales teams understand what the product does and doesn't do, how to handle objections, and how to position against competitors. For feature requests from deals, you give prioritization context — deal value, strategic fit, engineering effort. You never overpromise what the product can do."
- Agentic actions: create feature request ticket in Jira, update deal notes in CRM, send product brief
- Invocation: @sales, sales request submitted to portal

**A11. PM Coach**
- Purpose: PM career development, framework guidance, decision coaching, interview prep, skill gap identification
- LLM: claude-opus-4-6 (nuanced coaching)
- Connectors: None (knowledge-only)
- System prompt: "You are a senior PM coach with 15 years of experience across B2B SaaS, consumer, and enterprise products. You coach through questions — you never just give an answer. When a PM asks 'should I do X?', you ask: What's the goal? What have you tried? What does the data say? You teach frameworks by applying them to real situations, not explaining them abstractly. You give direct, honest feedback."
- Invocation: @coach, career/coaching intent keywords

#### NEW AGENTS TO BUILD:

**A12. Prioritization Agent** ← CRITICAL (from product discovery)
- Purpose: Cross-context prioritization — takes input from sales (deal value), engineering (effort), analytics (impact), roadmap (strategic fit), OKRs (alignment) and gives a reasoned recommendation
- LLM: claude-opus-4-6
- Connectors: Jira, Salesforce/HubSpot, Notion (roadmap), GDrive
- System prompt: "You are a prioritization engine for product teams. You take competing requests and rank them using a multi-factor model: strategic alignment (OKR fit), user impact (data-backed), business value (revenue/retention), engineering effort (from Jira estimates), risk (technical + market). You NEVER give a ranking without showing your reasoning. If you don't have enough data to rank confidently, you ask for the missing input. You show your work: here is the score, here is why. You challenge assumptions — if someone's favourite feature ranks low, you explain exactly why."
- Override rule: always show scoring breakdown, never just say "X is higher priority than Y"
- Sub-agents invoked: Analytics Intel (for impact data), Sprint Agent (for effort estimates)
- Agentic actions: update Jira priority field, add priority rationale as Jira comment
- Invocation: @prioritize, sales request submitted, explicit "prioritize" intent

**A13. Release Manager**
- Purpose: Release planning, go/no-go decisions, UAT coordination, release notes, rollback planning, stakeholder comms
- LLM: claude-sonnet-4-6
- Connectors: Jira (release versions), GitHub (PRs merged to main), Slack, Notion
- System prompt: "You are a release manager. For any release, you track: what's in it (Jira tickets merged), what's the risk (untested paths, recent regressions), who needs to sign off (UAT checklist), and what the go-to-market plan is (release notes, stakeholder email, Slack announcement). You never approve a release without a rollback plan. You flag every open blocker before go/no-go."
- Agentic actions: generate release notes, post Slack announcement, update Jira release version, create UAT checklist
- Invocation: @release, release workflow trigger

**A14. Market Intelligence Agent**
- Purpose: Market sizing, industry trends, TAM/SAM/SOM analysis, analyst reports synthesis, macro signals that affect product strategy
- LLM: claude-opus-4-6
- Connectors: Web search (MCP), GDrive (market research docs)
- System prompt: "You are a market analyst. You research market size, growth trends, competitive landscape at the macro level, and industry signals. You distinguish between signal and noise. You always cite sources and date your information. You structure output as: Market overview → Key trends → Implications for our product → Open questions."
- MCPs: Tavily search
- Invocation: @market, explicit market research requests, quarterly strategy workflow

### 2.2 Agent System Infrastructure
- ✅ BaseAgent class with RAG retrieval
- ✅ LLM router (multi-model support)
- ✅ Intent detection + routing in orchestrator
- ❌ Workspace memory injection (every agent call gets ~300 token workspace context)
- ❌ Artifact memory injection (when chatting about a specific artifact)
- ❌ Guardrail rule enforcement (validate thesis, ask questions, don't be ambiguous)
- ❌ Sub-agent invocation (agent calls another agent mid-conversation)
- ❌ Agentic actions registry (what each agent can do, with human-in-loop)
- ❌ Agent config persistence (admin changes prompts → stored in DB → applied to agent)
- ❌ Backend files for A8-A14 (7 new/missing agent Python files)

### 2.3 Agent Invocation Model
- ✅ Explicit override: `?agent=docs` in API call
- ✅ Intent detection: keyword-based routing
- ❌ @mention routing in chat: "@strategy what's our Q3 roadmap?" routes to strategy agent
- ❌ Workflow step invocation: workflow runner calls agent with defined input
- ❌ Scheduled invocation: cron/schedule triggers agent run
- ❌ Alert-triggered invocation: anomaly detected → Analytics agent auto-runs RCA
- ❌ Sub-agent invocation: agent A calls agent B and injects results

---

## SECTION 3 — MEMORY SYSTEM

### 3.1 Workspace Memory (~300 tokens, injected into every call)
- ❌ DB table: workspace_memory (company, product, team, sprint, OKRs)
- ❌ Admin UI to edit workspace memory
- ❌ Auto-injection middleware in agent base class
- ❌ Memory update flow (sprint changes → workspace memory updates)

### 3.2 Artifact Memory (~800 tokens, injected when chatting about artifact)
- ❌ DB table: artifact_memory (artifact_id, external_id, type, summary, decisions, open_questions, key_context)
- ❌ Memory extraction job (runs at publish time — cheap summarisation call)
- ❌ Memory injection when artifact_id is in context
- ❌ Memory viewer UI (see what agent knows about any artifact)
- ❌ Memory update flow (new decisions added → memory updated)

### 3.3 Session Memory (multi-session chat threads)
- ❌ DB table: agent_threads (thread_id, agent_id, workspace_id, user_id, title, status: draft/published)
- ❌ DB table: messages (message_id, thread_id, role, content, metadata, ts)
- ❌ Thread list UI per agent (like GPT Projects sidebar)
- ❌ New thread creation ("Start a new PRD" → creates thread)
- ❌ Thread title auto-generation (from first message)
- ❌ Thread resumption (re-inject last N messages as history)
- ❌ Thread publish action (marks as published, triggers artifact memory extraction)
- ❌ Thread archive/delete

### 3.4 Memory Settings
- ❌ Admin setting: session history retention (default 90 days for published, forever for draft)
- ❌ Admin setting: which agents have memory enabled
- ❌ Memory usage dashboard (how much context is being used)

---

## SECTION 4 — CONNECTOR & INTEGRATION LAYER

### 4.1 Existing Connectors (need OAuth UI + write capability)
- 🔧 **Jira**: read ✅, create issue ✅, comment ❌, update status ❌, OAuth UI ❌
- 🔧 **Notion**: read ✅, write page ❌, OAuth UI ❌
- 🔧 **Confluence**: read ✅, write page ❌, OAuth UI ❌
- 🔧 **Slack**: read ✅, post message ❌, OAuth UI ❌
- 🔧 **Google Drive**: read ✅, write doc ❌, OAuth UI ❌
- 🔧 **Google Calendar**: read ✅, create event ❌, OAuth UI ❌

### 4.2 New Connectors to Build
- ❌ **GitHub**: read PRs, commits, issues, diffs (for Engineering + Release agents)
- ❌ **Linear**: read/write issues and cycles (alternative to Jira)
- ❌ **Figma**: read file comments, project structure (for Design Review)
- ❌ **Amplitude**: read events, funnels, cohorts, dashboards
- ❌ **Mixpanel**: read events, funnels, retention
- ❌ **Intercom**: read conversations, tags, NPS, CSAT
- ❌ **Salesforce**: read deals, contacts, feature requests, ARR
- ❌ **HubSpot**: read deals, contacts, pipeline
- ❌ **Typeform**: read survey responses
- ❌ **Zoom**: read meeting transcripts (for research synthesis)

### 4.3 MCP Support
- ❌ MCP server registry (list available MCP servers)
- ❌ MCP connection UI (install, configure, test)
- ❌ **Tavily MCP**: web search for Competitive Intel + Market Intelligence agents
- ❌ **Firecrawl MCP**: competitor site scraping
- ❌ **Browser MCP**: for research tasks
- ❌ Per-agent MCP assignment (which MCPs each agent can use)

### 4.4 Connector Infrastructure
- ❌ OAuth flow backend (PKCE, token storage, refresh)
- ❌ OAuth flow frontend (redirect, callback, success state)
- ❌ Connector health monitoring (dashboard, alerts when connector fails)
- ❌ Per-workspace connector config (each workspace has its own credentials)
- ❌ Per-role connector access (admin controls which roles use which connectors)
- ❌ Write action audit log (every write action recorded: who, what, when, to which system)

---

## SECTION 5 — HOME SCREEN

### 5.1 Dynamic Widget System
- 🔧 Home page UI exists with static hardcoded metric cards
- ❌ Widget data model (widget_id, type, query, connector, refresh_schedule, position)
- ❌ Widget renderer (component that fetches live data from connector via agent query)
- ❌ Natural language widget creation ("add a section showing X" → creates widget)
- ❌ Widget types: metric card, list (Jira tickets), chart (trend line), alert card, agent output card
- ❌ Widget grid (draggable, resizable layout — react-grid-layout)
- ❌ Widget persistence (saved to DB, loads on every visit)
- ❌ Widget refresh (each widget has its own schedule)
- ❌ Widget edit/delete

### 5.2 Autonomous Agent Output Cards
- ❌ Agent run output stored as home screen cards
- ❌ Card types: alert (blocker found), digest (daily summary), insight (anomaly detected), update (competitive change)
- ❌ Card actions: "Chat about this" (opens chat with that agent + context), "Dismiss", "Go to Jira"
- ❌ Cards feed (chronological, most recent first, grouped by agent)
- ❌ Running window display (shows when each workflow last ran + next run)

### 5.3 In-Progress Work Tracker
- ❌ Widget showing all draft artifacts (PRDs, specs, analyses in progress)
- ❌ Progress indicator per artifact (which stage it's in)
- ❌ Quick resume (click → opens the chat thread for that artifact)

### 5.4 Home Screen Chatbot
- 🔧 Basic chat exists in /dashboard/chat — not embedded in home screen
- ❌ Embedded chatbot in home screen (bottom right or inline)
- ❌ Widget creation via chat ("add a section for X")
- ❌ Quick question mode ("what's our sprint health?" → one-shot answer, no thread created)
- ❌ Routing to specialist agents from home chat

---

## SECTION 6 — WORKFLOW ENGINE

### 6.1 Workflow Canvas (already built, needs execution)
- ✅ React Flow canvas with custom nodes (Trigger, Agent, Output)
- ✅ Node palette (drag agents/triggers/outputs)
- ✅ Node config panel (edit action/instruction per node)
- ✅ Visual workflow creation
- ❌ Workflow persistence (save to DB, not just local state)
- ❌ Workflow execution engine (backend runner that executes steps sequentially)
- ❌ Workflow run history (per-workflow run log with status, duration, output)
- ❌ Error handling in workflows (retry, fallback, alert on failure)

### 6.2 Trigger System
- ❌ Schedule trigger (cron — every day, every week, per sprint, custom interval)
- ❌ Manual trigger (run now button)
- ❌ Webhook trigger (external system calls pmGPT endpoint)
- ❌ Event trigger: Jira event (ticket created, status changed, comment added)
- ❌ Event trigger: metric anomaly (analytics threshold crossed)
- ❌ Event trigger: artifact state change (PRD published → trigger engineering review workflow)

### 6.3 Pre-built Workflow Library
- ❌ Daily metrics digest (Analytics agent → Slack output, 8:30am)
- ❌ Weekly sprint summary (Ops agent → Slack + Notion, every Friday 5pm)
- ❌ Weekly competitive sweep (Competitive agent → Notion battlecard update, Monday 9am)
- ❌ Sprint blocker scan (Sprint agent → alert cards on home screen, daily)
- ❌ New feature RCA (Analytics + Research → Notion postmortem, on metric anomaly trigger)
- ❌ Jira epic → PRD draft (Docs agent → Notion page, on Jira webhook)
- ❌ Sales request triage (Prioritization agent → Jira ticket + priority score, on new CRM deal)
- ❌ Release notes generation (Ops agent → Notion + Slack, on release workflow)
- ❌ NPS digest (Research agent → Notion + Slack, weekly)

---

## SECTION 7 — ARTIFACT SYSTEM

### 7.1 PRD Creation Flow
- 🔧 PRD Copilot exists as /dashboard/prd (wrong — needs to be removed, SCRUM-110)
- ❌ PRD as a template/thread within Docs Copilot agent
- ❌ Multi-stage PRD flow (Problem → Research → Goals → Competitive → Scope → Requirements → Risks → Draft)
- ❌ Stage tracker panel (right panel in Docs agent chat showing PRD stages as checklist)
- ❌ PRD persistence (draft saved across sessions)
- ❌ Sub-agent invocation mid-PRD (Docs → Competitive Intel for research section)
- ❌ PRD publish flow (human reviews → approves → pushed to Notion)
- ❌ Artifact memory generation at publish

### 7.2 Jira Ticket Generation
- ✅ Jira create_issue method (added today)
- ❌ /jira/create API endpoint wired to frontend
- ❌ Preview UI (show what will be created before executing)
- ❌ Batch ticket generation from PRD (create epic + stories in one flow)
- ❌ /jira/comment endpoint
- ❌ /jira/update endpoint (status, assignee, priority)
- ❌ Human-in-loop approve/reject UI for all Jira write actions

### 7.3 Other Artifact Types
- ❌ Release notes (Ops agent → draft → human review → push to Notion + post to Slack)
- ❌ Design brief (Docs agent → draft → push to Notion)
- ❌ Sprint retrospective (Ops agent → Confluence page)
- ❌ Competitive battlecard (Competitive agent → Notion page, versioned)
- ❌ RFC / Technical spec (Docs + Engineering agents → Confluence)

### 7.4 Artifact Viewer
- ❌ /dashboard/artifacts page (list all artifacts: PRDs, specs, briefs, etc.)
- ❌ Artifact detail view (see the document, memory, linked tickets, chat history)
- ❌ "Chat about this" from artifact view
- ❌ Artifact status (draft → in review → published → archived)
- ❌ Artifact search

---

## SECTION 8 — CHAT SYSTEM

### 8.1 Multi-thread Chat
- 🔧 Single-session chat exists at /dashboard/chat (works, calls real backend)
- ❌ Thread creation per agent (each PRD, analysis, research = a thread)
- ❌ Thread list sidebar in chat (like Claude/GPT projects)
- ❌ Thread title auto-generation
- ❌ Thread history persistence (messages saved to DB)
- ❌ Thread resume (history injected as context on re-open)
- ❌ Thread publish action (marks draft artifact as published)

### 8.2 Context Injection
- ❌ Workspace memory auto-injected into every agent call
- ❌ Artifact memory injected when thread is linked to an artifact
- ❌ @mention routing ("@competitive research Notion competitor")
- ❌ Sub-agent tool call display in chat UI (card showing agent being invoked, loading → done)

### 8.3 Alert → Chat Invocation
- ❌ "Chat about this" from home screen alert card
- ❌ Opens chat with correct agent pre-loaded
- ❌ Alert context injected into first message automatically
- ❌ Artifact context pulled in if alert is about an artifact

### 8.4 Human-in-Loop Flow
- ❌ Action preview card in chat (shows what agent will do before doing it)
- ❌ Approve / Edit / Reject buttons on preview card
- ❌ Action execution on approval (calls correct API endpoint)
- ❌ Action confirmation in chat (shows what was done, links to external system)

---

## SECTION 9 — ONBOARDING

### 9.1 Fix Existing Flow
- 🔧 7 onboarding steps exist (signup, workspace, use-cases, tools, business-model, plan, verify)
- ❌ Wire to real auth (currently saves to localStorage only)
- ❌ Workspace created in DB on completion
- ❌ Connector setup step (enable connectors, OAuth for each selected)
- ❌ Agent activation step (enable/disable agents, pre-selected based on role/goals)
- ❌ Home screen personalization (first load shows relevant widgets based on onboarding answers)
- ❌ Onboarding resumable (if user drops off at step 3, picks up there on next visit)

### 9.2 First-Run Experience
- ❌ "Welcome to pmGPT" home screen for new users (different from returning user view)
- ❌ 3-step quick-start card (Connect a tool → Enable an agent → Ask your first question)
- ❌ First magic moment: agent proactively surfaces something useful within first session
- ❌ Tour/tooltip walkthrough for key features

---

## SECTION 10 — ADMIN & SETTINGS

### 10.1 Agent Configuration
- 🔧 Agent config UI exists in /settings/agents and /dashboard/agents/[id]
- ❌ Changes persist to DB (currently UI only, doesn't save)
- ❌ System prompt editor with AI rewrite
- ❌ Personality, tonality, LLM model selection — all persisted
- ❌ Enable/disable agents per workspace
- ❌ Role-based agent access (configure which roles can use which agent)

### 10.2 Team & Permissions
- 🔧 Team settings UI exists
- ❌ Invite by email (sends invite link, joins workspace with assigned role)
- ❌ Role assignment UI
- ❌ Remove team member
- ❌ Engineering team access — can read artifacts and chat with agents for their area

### 10.3 Workspace Settings
- 🔧 Workspace settings UI exists
- ❌ Workspace memory editor (company, product, team, sprint, OKRs)
- ❌ Memory retention settings
- ❌ Workflow running window defaults
- ❌ Notification preferences (Slack channel for alerts, email digest)

### 10.4 Connector Management
- 🔧 Connectors page exists with health check UI
- ❌ OAuth connect/disconnect flows per connector
- ❌ Per-connector permission scope configuration
- ❌ Connector sync status and manual re-sync button
- ❌ Connector error alerts

---

## SECTION 11 — NOTIFICATION & ALERT SYSTEM

- ❌ Alert data model (alert_id, type, source_agent, content, action_url, dismissed, workspace_id)
- ❌ Alert generator (workflow run → extract alerts → store in DB)
- ❌ Alert display on home screen (card feed)
- ❌ Alert types: blocker, anomaly, competitive change, deal request, review needed
- ❌ Alert → chat bridge ("Chat about this" button on every alert)
- ❌ Alert dismiss / snooze
- ❌ Notification preferences (in-app, Slack, email)
- ❌ Real-time updates (WebSocket or polling for new alerts)

---

## SECTION 12 — INFRASTRUCTURE & DEVOPS

- ❌ Proper .env management (dev / staging / prod)
- ❌ Database setup + migrations (Alembic)
- ❌ Docker compose for local dev (frontend + backend + DB + vector store)
- ❌ Vercel deployment for frontend (config exists partially)
- ❌ Railway / Render / Fly.io for backend
- ❌ Error monitoring (Sentry)
- ❌ Usage analytics (PostHog or Mixpanel)
- ❌ Rate limiting on API
- ❌ Secrets management (not in .env files in repo)

---

## BUILD PRIORITY ORDER

### Phase 1 — Make it real (Weeks 1-2)
Auth → Database → API wiring → Onboarding v2 → Multi-thread chat

### Phase 2 — Make agents complete (Weeks 3-4)
All 14 agent backend files → System prompt upgrades with guardrail rules → Workspace memory injection → Sub-agent invocation

### Phase 3 — Make home screen live (Weeks 5-6)
Widget system → Live connector data → Alert system → Alert → chat bridge

### Phase 4 — Artifact system (Weeks 7-8)
Multi-session PRDs → Artifact memory → Jira write (full) → Publish flow with human-in-loop

### Phase 5 — Workflow execution (Weeks 9-10)
Workflow runner → Trigger system → Pre-built workflow library → Scheduler

### Phase 6 — Full connector coverage (Weeks 11-12)
GitHub → Amplitude/Mixpanel → Intercom → Salesforce/HubSpot → MCP layer

---

## TASK COUNT SUMMARY

| Section | Total tasks | Done | Needs building |
|---|---|---|---|
| Foundation (auth, DB, API) | 28 | 5 | 23 |
| Agent system | 42 | 10 | 32 |
| Memory system | 18 | 0 | 18 |
| Connectors | 35 | 6 | 29 |
| Home screen | 20 | 2 | 18 |
| Workflow engine | 22 | 4 | 18 |
| Artifact system | 24 | 1 | 23 |
| Chat system | 18 | 3 | 15 |
| Onboarding | 12 | 4 | 8 |
| Admin & settings | 20 | 4 | 16 |
| Notifications | 10 | 0 | 10 |
| Infrastructure | 10 | 1 | 9 |
| **TOTAL** | **259** | **40** | **219** |

~40 tasks done. ~219 to build. This is a real product — not a prototype anymore.
