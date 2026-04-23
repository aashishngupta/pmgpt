# pmGPT Architecture

## System Overview

```
Browser
  └── Next.js 14 (onboarding/)
        ├── App Router — all pages in app/
        ├── API calls → FastAPI backend (localhost:8000 / Vercel functions)
        └── Auth: JWT stored in localStorage (temporary)

FastAPI (backend/)
  ├── /chat → intent detection → agent routing → LLM call → response
  ├── /threads → persistent chat sessions per agent
  ├── /agents/config → per-agent config stored in DB
  ├── /alerts → alert feed for home screen
  ├── /rag/* → vector store ingest and sync
  └── /workspace/memory → workspace context (injected into all agent calls)

LLM Router (backend/llm_router.py)
  ├── Claude Sonnet 4.6 (default)
  ├── GPT-4o
  ├── Gemini 1.5 Pro
  └── Mistral (local, Ollama)

RAG Pipeline
  ├── Connectors: Jira, Notion, Confluence, Slack, GDrive
  ├── Ingest: fetch → chunk → embed → store
  ├── Retrieval: vector similarity per query
  └── Per-agent connector scoping (agent only sees its assigned connectors)
```

## Frontend Architecture

### State Management Pattern
Every page manages its own state with `useState`. No global store. Complex pages (agent detail, chat) split state into logical groups.

### API Layer (`lib/api.ts`)
Single `req<T>()` wrapper — all API calls go through here. Adds auth header automatically. Throws on non-2xx. Returns typed response.

```typescript
const api = {
  chat: (body) => req('/chat', { method: 'POST', ... }),
  threads: { list, create, messages, chat, delete },
  agents: { configs, getConfig, saveConfig },
  alerts: { list, create, dismiss },
  memory: { get, update },
  artifacts: { getMemory, createMemory },
  jira: { create },
}
```

### Platform Data (`lib/platform-data.ts`)
Single source of truth for all agent definitions. Every agent has:
- `id`, `name`, `description`, `status`, `llm`, `temperature`, `maxTokens`
- `capabilities[]`, `connectors[]`, `recommendedMcps[]`
- `goals[]`, `guardrails[]`
- `tools: AgentTool[]` — with `requiresApproval`, `category` (read/write/notify/compute)
- `triggers: AgentTrigger[]` — schedule or event, with `outputDest`
- `templates: AgentTemplate[]` — structured prompts with field definitions
- `systemPrompt`, `minRole`, `bg`, `color`

### Sidebar (`components/settings/SettingsSidebar.tsx`)
Collapsible icon rail. Expands on hover (48px → 216px). Nav sections: Home/Inbox, Intelligence (Agents/Workflows/PRD/Knowledge/Skills), Connectors, Observability (Analytics/Monitoring/Audit), Settings.

## Backend Architecture

### Agent Pattern
Every agent extends `BaseAgent`:
```python
class MyAgent(BaseAgent):
    name = "my_agent"
    
    async def run(self, query, user_role, **kwargs):
        connector_context, sources = await self._retrieve(query, connectors=[...])
        system_prompt = self._inject_workspace(SYSTEM_PROMPT, workspace_context)
        response = await self.router.call(system_prompt, query, context, ...)
        return response, sources
```

### Intent Detection
`/chat` endpoint detects which agent to route to based on query content. Explicit `@agent` mentions override auto-detection.

### Workspace Memory
Key-value store at `/workspace/memory`. Injected into every agent system prompt via `_inject_workspace()`. Contains: company name, product description, team size, current sprint, OKRs, etc.

### RBAC
Roles: `viewer < pm < pm_lead < admin`. Each agent has a `min_role` — users below that role cannot invoke it. Enforced in middleware.
