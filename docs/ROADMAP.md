# pmGPT Build Roadmap

Last updated: 2026-04-22

## Phase 1 — Quick Fixes ✅ DONE
- [x] Remove templates tab from agent detail page (never existed — was in chat drawer)
- [x] Remove templates tab from chat right drawer
- [x] Default collapse thread sidebar in chat (sidebarOpen = false)
- [x] Default collapse memory panel in chat (drawerOpen = false)
- [x] Agent switcher dropdown on agent detail page
- [x] Agent dropdown in chat replacing horizontal pill tabs
- [x] Analytics page: 6 tabs (Executive Summary, Business Impact, Automation Performance, AI Observability, Integration Activity, Workspace Intelligence)
- [x] Analytics copilot (floating chat panel, analytics agent)
- [x] Analytics nav item in sidebar

## Phase 2 — Chat Redesign (Perplexity × Clay)
- [ ] Source citation chips below each agent response
- [ ] Structured output cards (Decision / Action list / Data table / Plain text)
- [ ] Follow-up question chips after every response (2-3 contextual suggestions)
- [ ] Human-in-loop preview card before write actions (Jira create, Notion publish, Slack send)
- [ ] @ mention in input to switch agent mid-conversation
- [ ] Agent description card shown below dropdown on empty state
- [ ] Cleaner message bubble design (less chat-app, more document-style)

## Phase 3 — Workflow Builder Redesign (Clay-inspired, PM-specific)
- [ ] Full rewrite of onboarding/app/dashboard/workflows/page.tsx
- [ ] Left panel: natural language command input
  - "When sprint closes, generate retro doc and post to Confluence"
  - AI parses → renders flow automatically
- [ ] Center: vertical step card flow (NOT free-form node graph)
  - Each step: colored icon + step name + step type label + connector metadata
  - Steps connected by arrows with dot connectors (like Clay)
  - Background: slightly colored canvas
- [ ] Click step → floating config panel slides in from right
  - Trigger config / Agent selection / Output destination
- [ ] Condition step: natural language IF/THEN with removable field chips
- [ ] Human approval gate card (amber border, distinct visual)
- [ ] Toolbar: Run / Pause / Edit / Duplicate / Delete
- [ ] "+" button between steps to insert new step
- [ ] Step library modal: search by category (Triggers / Agents / Actions / Conditions)
- [ ] Pre-built PM workflow templates:
  - Sprint close → retro → Confluence
  - Jira epic created → PRD draft → review
  - Metric threshold → investigation → Slack alert
  - Weekly competitive sweep → battlecard update

## Phase 4 — Foundation (Blockers for everything)
- [ ] Real auth: signup, login, JWT refresh, sessions, DB users
- [ ] PostgreSQL migration + Alembic
- [ ] Workspace memory injection into every agent call
- [ ] Connector OAuth flows (Jira, Notion, Confluence, Slack, GDrive)
- [ ] Home screen live widgets (currently static)

## Phase 5 — PRD Artifact Flow
- [ ] Multi-stage PRD creation (brief → outline → draft → review → publish)
- [ ] Publish to Confluence/Notion
- [ ] Auto-generate Jira tickets from PRD sections
- [ ] Artifact memory extraction on publish

## Phase 6 — Workflow Execution Engine
- [ ] Backend runner for workflow steps
- [ ] Schedule trigger (cron)
- [ ] Event trigger (Jira webhook, etc.)
- [ ] Step-level error handling + retry
- [ ] Execution log + audit trail

## Known Issues / Tech Debt
- SQLite → PostgreSQL migration needed before any real users
- localStorage auth needs replacement with proper sessions
- Workflow builder currently uses React Flow (visual only, needs full rewrite)
- Home screen shows hardcoded data (alerts are real, everything else is static)
- Agent configs save to DB but don't affect actual agent behavior yet
