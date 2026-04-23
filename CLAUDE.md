# pmGPT — Codebase Context

## What This Product Is

pmGPT is a **Product Management OS** — an AI-native workspace for product teams. It is NOT a generic AI chat tool or agent framework. It is purpose-built for PMs, PM Leads, and founders at B2B SaaS companies.

**Core value prop:** Replace the PM's daily workflow of switching between Jira, Notion, Confluence, Slack, Amplitude, and Google Docs with one intelligent layer that reads all of them, thinks with you, and writes back to them.

**ICP:** PM teams at Series A–C B2B SaaS companies (5–50 engineers, 2–8 PMs).

**Key interaction model:** Alert → Investigate → Preview → Approve → Execute. Agents NEVER act unilaterally. Every write action (Jira ticket, Notion page, Slack message) requires human preview and approval first.

---

## Monorepo Structure

```
pmgpt/
├── onboarding/          # Next.js 14 frontend (App Router)
├── backend/             # FastAPI Python backend
├── CLAUDE.md            # ← you are here
├── MASTER_PLAN.md       # 259-task product roadmap
└── docs/
    ├── DESIGN_SYSTEM.md
    ├── ARCHITECTURE.md
    └── ROADMAP.md
```

---

## Tech Stack

### Frontend (`onboarding/`)
- **Framework:** Next.js 14 App Router, TypeScript strict
- **Styling:** Tailwind CSS with custom brand token system
- **Components:** Custom — no shadcn/ui except `Button` primitive
- **State:** React `useState` / `useEffect` — no Redux, no Zustand
- **Auth:** localStorage JWT (temporary — real auth is pending)
- **API calls:** `onboarding/lib/api.ts` — single `req()` wrapper

### Backend (`backend/`)
- **Framework:** FastAPI + Uvicorn
- **DB:** SQLite + SQLAlchemy 2.0 (PostgreSQL + Alembic migrations planned)
- **LLM routing:** Multi-model router (Claude, GPT-4o, Gemini, Mistral local)
- **RAG:** Vector store per connector, retrieval before every agent call
- **Auth:** JWT middleware, RBAC roles: viewer / pm / pm_lead / admin

---

## Brand Token System (CRITICAL — always use these, never raw colors)

```
bg-brand-bg           # page background (near-white)
bg-brand-bg-2         # slightly elevated background
bg-brand-surface      # card/panel surface
bg-brand-elevated     # hover states
bg-brand-canvas       # input backgrounds
bg-brand-sidebar      # left nav
bg-brand-accent       # primary action color (purple-ish)
bg-brand-accent-bg    # accent tint background
bg-brand-accent-dim   # accent hover

text-brand-ink        # primary text
text-brand-ink-2      # secondary text
text-brand-ink-3      # tertiary/placeholder
text-brand-ink-4      # disabled
text-brand-ink-inv    # text on dark backgrounds
text-brand-ink-inv-2  # secondary text on dark backgrounds
text-brand-accent-text # text on accent bg

border-brand-line     # primary border
border-brand-line-2   # subtle border

bg-brand-green        # success
bg-brand-amber        # warning
bg-brand-red          # error
text-brand-green / text-brand-amber / text-brand-red
bg-brand-green-bg / bg-brand-amber-bg / bg-brand-red-bg
```

---

## Design Philosophy

**Inspiration (taken conceptually, NOT copied literally):**
- **Perplexity** — trust through transparency: inline source citations, structured output cards, follow-up chips
- **Clay** — clean vertical card flows for workflows, floating config panels, natural language conditions
- **Dust.tt** — task-oriented outputs (structured cards, not markdown walls)

**pmGPT is different from all of them.** It is a PM-specific OS, not a data enrichment tool (Clay), not a search engine (Perplexity), not a generic enterprise AI (Dust). Every design decision should serve the PM workflow context.

**Design rules:**
- White cards with rounded-xl corners, subtle border-brand-line
- Typography: system font stack via Tailwind (Inter-style)
- No emojis in UI
- Consistent 12px–14px text in cards, 11px for labels/metadata
- Uppercase tracking-widest for section labels
- Brand accent for primary actions only — not decorative

---

## Agents (13 total)

All agents live in `onboarding/lib/platform-data.ts`.

| ID | Name | Purpose |
|---|---|---|
| strategy | Strategy Advisor | Roadmaps, OKRs, positioning |
| docs | Docs Writer | PRDs, user stories, specs |
| analytics | Analytics Agent | Metrics, KPIs, A/B tests |
| research | Research Agent | VOC, surveys, NPS |
| ops | Sprint Planner | Sprint planning, standups, retros |
| review | Review Agent | Code/design review, release notes |
| engineering | Engineering Agent | Tech specs, incident reports |
| competitive | Competitive Intel | Battlecards, win/loss, market sweeps |
| sales | Sales Intel | One-pagers, ROI narratives |
| coach | PM Coach | Career growth, feedback, coaching |
| prioritization | Prioritization | Backlog ranking, trade-off analysis |
| release | Release Manager | Go/no-go, UAT, release notes |
| market | Market Intelligence | TAM/SAM/SOM, trend reports |

---

## Key Files

```
onboarding/
├── app/
│   └── dashboard/
│       ├── page.tsx                    # Home screen (alerts, widgets)
│       ├── agents/
│       │   ├── page.tsx                # Agent grid + flow view
│       │   └── [id]/page.tsx           # Agent detail: 6 tabs + copilot + dropdown switcher
│       ├── chat/page.tsx               # Chat: agent dropdown, thread sidebar (collapsed), memory panel (collapsed)
│       ├── analytics/
│       │   ├── page.tsx                # Analytics: 6 tabs + copilot
│       │   ├── tabs/                   # Tab components (each its own file)
│       │   └── components/             # Shared: StatCard, MetricTable, ChartBar, AnalyticsCopilot
│       ├── workflows/page.tsx          # Workflow builder (React Flow — NEEDS REDESIGN)
│       ├── connectors/page.tsx         # Connector integrations
│       ├── knowledge/page.tsx          # Knowledge base
│       └── observability/page.tsx      # Monitoring
├── components/
│   └── settings/SettingsSidebar.tsx    # Left nav (collapsible icon rail)
└── lib/
    ├── platform-data.ts                # All agent definitions, types, mock data
    ├── api.ts                          # All API calls — req() wrapper
    ├── auth.ts                         # JWT token store, auth API
    └── utils.ts                        # cn() and helpers

backend/
├── main.py                             # FastAPI app, routes
├── agents/
│   ├── base.py                         # BaseAgent: RAG, workspace context, governance
│   ├── strategy.py / docs.py / ...     # One file per agent
│   └── analytics.py                    # Analytics agent
├── models/                             # SQLAlchemy models
├── routes/                             # Route handlers
└── rag/                                # Vector store, ingest, retriever
```

---

## What's Built vs What's Not

### Working
- FastAPI + 13 agents with real LLM routing
- RAG pipeline (ingest, vector store, per-agent connector scoping)
- Jira connector (read + create issue)
- /chat endpoint with intent detection + agent routing
- RBAC middleware + audit logging
- All frontend pages visually built
- Agent detail page (6 tabs: Overview, Instructions, Connectors, MCPs, Access, Sandbox)
- Analytics page (6 tabs with mock data + copilot)
- Chat page (agent dropdown, thread sidebar, memory panel)
- Agent grid + flow view
- Alert system (DB model + API endpoints + home screen feed)

### NOT YET BUILT (critical gaps)
- Real auth (no DB users, no sessions, localStorage only)
- PostgreSQL + Alembic migrations
- Workflow execution engine (visual only, no runner)
- Connector OAuth flows (UI exists, no real auth)
- Home screen widgets (static, not live)
- PRD artifact flow (draft → publish → Jira batch)

---

## Pending Design Work (next sessions)

### Phase 2 — Chat redesign (Perplexity × Clay style)
- Source citation chips inline below responses
- Structured output cards (Decision / Action list / Data table)
- Follow-up question chips after every response
- Human-in-loop preview card before write actions
- Thread sidebar stays collapsed by default ✅ (done)
- Memory panel stays collapsed by default ✅ (done)
- Templates tab removed from drawer ✅ (done)

### Phase 3 — Workflow builder redesign (Clay-inspired)
- Left: natural language command input → AI generates flow
- Center: vertical card flow (Clay style, not free-form node graph)
  - Each step: icon + name + type label + connector metadata
  - Steps connected by arrows with dot connectors
- Click step → floating config panel from right
- Condition cards: natural language IF/THEN builder with field chips
- Human approval gate cards: amber border
- Step library modal (search by category: Triggers / Agents / Actions / Conditions)
- This is PM-specific: sprint close → retro doc → post to Confluence
  NOT generic n8n-style automation

---

## API Endpoints

```
POST /chat                          # Main chat, intent detection
GET  /health
GET  /connectors
GET  /rag/status
POST /rag/sync

GET  /threads                       # List threads (optional ?agent_id=)
POST /threads                       # Create thread
GET  /threads/{id}/messages
POST /threads/{id}/messages         # Chat within thread
DELETE /threads/{id}

GET  /workspace/memory
PUT  /workspace/memory

GET  /agents/config                 # All agent configs
GET  /agents/config/{id}
PUT  /agents/config/{id}

GET  /alerts
POST /alerts
PATCH /alerts/{id}/dismiss

POST /jira/create

GET  /artifacts/memory/{thread_id}
POST /artifacts/memory
```

---

## Do NOT

- Do NOT copy Clay/Perplexity/Dust UI elements literally — pmGPT has its own design language
- Do NOT add generic AI features (code editor, image gen, etc.)
- Do NOT build PRD Copilot as a separate page — it's a mode within Docs Writer agent
- Do NOT use raw Tailwind colors (blue-500, etc.) — always use brand tokens
- Do NOT add features the PM workflow doesn't need
- Do NOT use emojis in UI
- Do NOT make agents act without human approval on write actions
