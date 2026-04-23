# pmGPT — Session Handoff

**Update this file at the end of every session.**

---

## Current Status (as of April 2026)

~40 of 259 tasks done. ~219 remaining.

**Last significant build:** Agent builder UI (6-tab config, connector/MCP library, Config Copilot), agent system, memory layer, multi-thread chat, and alert feed — all visually complete but without DB persistence.

---

## What Was Last Worked On

- Agent detail page (`onboarding/app/dashboard/agents/[id]/page.tsx`) — modified, uncommitted
- Chat page (`onboarding/app/dashboard/chat/page.tsx`) — modified, uncommitted
- Settings sidebar (`onboarding/components/settings/SettingsSidebar.tsx`) — modified, uncommitted

---

## What To Build Next

**Phase 1 — Foundation (this is the blocker for everything)**

Start here: `MASTER_PLAN.md` Section 1.

Priority order:
1. **Section 1.1 — Real Auth** — email/password signup, Google OAuth, JWT with refresh, workspace binding on login
2. **Section 1.2 — Database** — PostgreSQL schema + Alembic migrations (all tables: users, workspaces, sessions, agent_threads, messages, artifacts, artifact_memory, workspace_memory, widgets, workflow_runs, alerts, connector_configs)
3. **Section 1.3 — API endpoints** — /auth/*, /workspace/*, /threads/*, /artifacts/*, /alerts/*, /widgets/*
4. **Section 9 — Onboarding v2** — wire existing 7-step onboarding to real auth + DB, add connector setup + agent activation steps
5. **Section 8 — Multi-thread chat** — thread persistence, thread list sidebar, thread resume, title auto-generation

---

## Uncommitted Changes

Three files modified but not committed (check `git status` in `/Users/aashish/pmgpt`):
- `onboarding/app/dashboard/agents/[id]/page.tsx`
- `onboarding/app/dashboard/chat/page.tsx`
- `onboarding/components/settings/SettingsSidebar.tsx`

---

## Context Files to Read Before Building

1. `MASTER_PLAN.md` — full 259-task plan with ✅/🔧/❌ status per task
2. `CLAUDE.md` — full codebase context, brand system, API map, design rules
3. `.cursorrules` — Cursor-specific rules (same core content, optimised for Cursor)
4. `PRODUCT_SPEC.md` — full product specification (21-page reference)
5. `backend/main.py` — FastAPI routes (understand what exists before adding)
6. `onboarding/lib/api.ts` — all frontend API calls

---

## Key Constraints

- Every agent write action needs human preview + approve/reject before executing
- Always use brand tokens (bg-brand-*, text-brand-*, border-brand-*) — never raw Tailwind colors
- PRD creation is a mode inside Docs Writer agent — NOT a separate page
- No new standalone tool pages — only agents, workflows, connectors, home screen widgets
