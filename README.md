<div align="center">
  <img src="frontend/assets/logo-icon.svg" width="72" height="72" alt="pmGPT logo" />
  <h1>pmGPT</h1>
  <p><strong>The Product OS — AI-native intelligence layer for product teams</strong></p>
  <p>Connect your Jira, Confluence, Notion, Google Drive, Slack and more. Ask anything. pmGPT retrieves context from your actual work, answers with citations, and never leaks confidential data to external AI.</p>

  <p>
    <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi" />
    <img src="https://img.shields.io/badge/LLMs-Claude%20·%20GPT%20·%20Gemini%20·%20Mistral-blueviolet?style=flat-square" />
    <img src="https://img.shields.io/badge/ChromaDB-vector%20store-orange?style=flat-square" />
    <img src="https://img.shields.io/badge/access-invite%20only-red?style=flat-square" />
  </p>

  <p><strong>Currently available on invite basis only.</strong><br/>
  To request access: <a href="mailto:92.aashish@gmail.com">92.aashish@gmail.com</a></p>
</div>

---

## What is pmGPT?

pmGPT is a **Product OS** — an AI-native intelligence layer that sits across your entire product workflow. Unlike generic AI chatbots, pmGPT:

- **Knows your actual work** — indexes your Jira tickets, Confluence pages, Notion docs, Google Drive files, Slack messages, and Calendar events into a local vector database
- **Cites its sources** — every answer links back to the exact document, ticket, or message it pulled from
- **Keeps sensitive data local** — built-in governance classifies every field and routes confidential data to a local LLM (Ollama/Mistral) instead of sending it to the cloud
- **Remembers the conversation** — multi-turn context with rolling compression; follow-up questions always work
- **Works with any LLM** — Claude, GPT-4, Gemini, Mistral, Llama, or any Ollama-compatible model

---

## Features

| Feature | Description |
|---|---|
| **7 Specialist Agents** | Sprint planning, docs writing, strategy, analytics, standups, career review, general Q&A |
| **RAG Pipeline** | ChromaDB vector store, incremental sync, content-hash deduplication |
| **6 Connectors** | Jira, Confluence, Notion, Google Drive, Slack, Google Calendar |
| **Multi-LLM** | Claude Opus/Sonnet, GPT-4o, Gemini Pro, Mistral, Llama 3 — switchable per request |
| **Data Governance** | Per-field sensitivity classification, automatic LLM routing, PII tokenisation |
| **RBAC** | Role-based access — admin, pm_lead, pm, viewer |
| **Multi-turn Context** | Rolling conversation summary; key facts survive indefinitely |
| **Audit Logging** | Full audit trail of every LLM call — role, path, sensitivity level |
| **Local LLM Support** | Run entirely air-gapped via Ollama for confidential workspaces |
| **Docker Ready** | Single `docker compose up` to run everything |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (HTML/JS)                      │
│       Chat UI · Source citations · LLM picker · RBAC         │
└───────────────────────┬─────────────────────────────────────┘
                        │ REST /chat
┌───────────────────────▼─────────────────────────────────────┐
│                   FastAPI Backend                             │
│                                                              │
│  ┌─────────────┐    ┌──────────────────────────────────────┐ │
│  │ Orchestrator│───▶│  Agents (7)                          │ │
│  │ intent      │    │  sprint · docs · strategy · analytics │ │
│  │ detection   │    │  ops · review · general               │ │
│  └─────────────┘    └────────────────┬─────────────────────┘ │
│                                      │                        │
│  ┌───────────────────────────────────▼─────────────────────┐ │
│  │                   RAG Pipeline                           │ │
│  │   ChromaDB ◀── Ingester ◀── Connectors (6)              │ │
│  │   Retriever → semantic search → ranked citations         │ │
│  └───────────────────────────────────┬─────────────────────┘ │
│                                      │                        │
│  ┌───────────────────────────────────▼─────────────────────┐ │
│  │               Governance Engine                          │ │
│  │   classify fields → mask PII → route to right LLM       │ │
│  └──────────────┬───────────────────────────────────────────┘│
└─────────────────┼────────────────────────────────────────────┘
                  │
     ┌────────────┴──────────────────────┐
     │                                   │
┌────▼──────────────────────┐   ┌────────▼──────┐
│  External LLMs             │   │  Local LLMs   │
│  Claude · GPT-4o · Gemini  │   │  Mistral      │
│  (public data only)        │   │  Llama 3      │
└───────────────────────────┘   │  (confidential)│
                                 └───────────────┘
```

---

## LLM Support

pmGPT is **LLM-agnostic**. You pick the model per session — or let the governance engine auto-route based on data sensitivity.

| Provider | Models | Use case |
|---|---|---|
| **Anthropic** | Claude Opus 4.6, Sonnet 4.6, Haiku 4.5 | Default external path — best quality |
| **OpenAI** | GPT-4o, GPT-4o mini, GPT-4 Turbo | Alternative external path |
| **Google** | Gemini 1.5 Pro, Gemini Flash | Alternative external path |
| **Ollama (local)** | Mistral 7B, Llama 3, Phi-3, any GGUF | Confidential data — never leaves your machine |

The governance engine automatically routes:
- `public` data → your chosen external LLM
- `internal / confidential` data → local Ollama (regardless of chosen model)

---

## Availability

**pmGPT is currently available on an invite-only basis.**

We are onboarding product teams in early access to refine the product before a wider release.

To request access or learn more, email: **[92.aashish@gmail.com](mailto:92.aashish@gmail.com)**

---

## Quick Start (for invited teams)

### Prerequisites

- Python 3.10+
- An API key for your chosen LLM (Anthropic, OpenAI, or Google)
- At least one connector credential (see [Connectors](#connectors))
- [Ollama](https://ollama.ai/) if you want local LLM support for confidential data

### 1. Install

```bash
git clone https://github.com/aashishngupta/pmgpt.git  # requires invite
cd pmgpt
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
pip install pypdf  # for PDF extraction from Google Drive
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` — add only the LLM and connectors you use:

```env
# LLM — add at least one
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=AIza...

# Jira (Atlassian Cloud)
JIRA_BASE_URL=https://yourorg.atlassian.net
JIRA_USERNAME=you@company.com
JIRA_API_TOKEN=your-jira-token

# Confluence
CONFLUENCE_BASE_URL=https://yourorg.atlassian.net
CONFLUENCE_USERNAME=you@company.com
CONFLUENCE_API_TOKEN=your-confluence-token

# Slack
SLACK_BOT_TOKEN=xoxb-...

# Notion
NOTION_API_KEY=secret_...

# Google Drive & Calendar (service account JSON)
GOOGLE_SERVICE_ACCOUNT_JSON=/path/to/service-account.json
GOOGLE_CALENDAR_ID=primary
```

### 3. Run

```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Open **http://localhost:8000/app**

### Docker (recommended)

```bash
cp .env.example .env  # fill credentials
docker compose up -d

# Optional: pull a local model for confidential data routing
docker exec -it pmgpt-ollama-1 ollama pull mistral
```

---

## Connectors

Connectors sync automatically on startup (full) and every hour (incremental — only changed docs). Manual sync:

```bash
# Sync all
curl -X POST "http://localhost:8000/rag/sync"

# Sync one connector (force full re-index)
curl -X POST "http://localhost:8000/rag/sync?connector=gdrive&force=true"

# Browse indexed docs
curl "http://localhost:8000/rag/docs?connector=gdrive"
```

| Connector | What it indexes | Auth |
|---|---|---|
| **Jira** | Issues, epics, stories, bugs, comments | API token |
| **Confluence** | Pages, spaces, documentation | API token |
| **Notion** | Pages, databases, blocks | Integration API key |
| **Google Drive** | Docs, Sheets, Slides, PDFs, plain text | Service account |
| **Slack** | Messages, threads | Bot token |
| **Google Calendar** | Events, meetings, descriptions | Service account |

### Google Drive / Calendar setup

1. [Google Cloud Console](https://console.cloud.google.com/) → Create project
2. Enable **Google Drive API** and **Google Calendar API**
3. IAM → Service Accounts → Create → Download JSON key
4. Share your Drive folder/Calendar with the service account email
5. Set `GOOGLE_SERVICE_ACCOUNT_JSON=/path/to/key.json`

### Notion setup

1. [notion.so/my-integrations](https://www.notion.so/my-integrations) → New integration
2. Copy the **Internal Integration Token**
3. Share each page/database with your integration (Share → Invite)
4. Set `NOTION_API_KEY=secret_...`

### Slack setup

1. [api.slack.com/apps](https://api.slack.com/apps) → Create App
2. OAuth scopes: `search:read`, `channels:history`, `channels:read`
3. Install to workspace → copy **Bot User OAuth Token**
4. Set `SLACK_BOT_TOKEN=xoxb-...`

---

## Agents

pmGPT auto-routes your query to the right specialist. You can also pick one manually in the UI.

| Agent | Triggered by | Does |
|---|---|---|
| **Sprint** | "sprint", "standup", "velocity", "backlog" | Sprint health, spillovers, Jira analysis |
| **Docs** | "PRD", "spec", "write a doc", "requirements" | Drafts PRDs and specs from your existing docs |
| **Strategy** | "roadmap", "OKR", "product vision", "GTM" | Roadmap and strategy from Drive/Notion |
| **Analytics** | "metrics", "DAU", "conversion", "retention" | Data interpretation, trend analysis |
| **Ops** | "standup", "triage", "priorities", "blockers" | Daily standup prep, task triage from Jira + Slack |
| **Review** | "resume", "performance", "career", "interview" | PM career coaching and job tools |
| **General** | Everything else | Searches all connectors first, answers from knowledge if nothing found |

---

## Data Security & Governance

### Field-level data classification

Every field from every connector has a sensitivity level defined in `pmgpt.config.yaml`:

```
public       → safe to send to any external LLM
internal     → local Ollama only
confidential → PII tokenised before local LLM, real values re-injected after
restricted   → never sent to any LLM — template-rendered only
```

**Example — Jira issue:**

| Field | Level | Goes to |
|---|---|---|
| status, priority | `public` | Your chosen external LLM |
| summary, description | `internal` | Ollama (local only) |
| assignee, reporter | `confidential` | Ollama after PII masking |
| comments | `confidential` | Ollama after PII masking |

### What never leaves your machine

- Anything classified `confidential` or `restricted`
- ChromaDB vector database (`data/rag/`)
- All audit logs (`logs/audit.log`)
- Your `.env` credentials

### Running fully air-gapped

Set `llm_mode: local` and install Ollama. All queries route to local Mistral/Llama — zero external API calls.

### RBAC roles

| Role | Agents | Max data level |
|---|---|---|
| `admin` | All | Restricted |
| `pm_lead` | All except review | Confidential |
| `pm` | Sprint, docs, analytics, ops | Internal |
| `viewer` | Analytics only | Public |

### Audit trail

Every LLM call logged to `logs/audit.log`:
- Timestamp, user role, agent, LLM path used
- Maximum sensitivity level in the request
- Prompts/responses not logged by default (enable in config for dev)

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/chat` | POST | Send a message, get AI response with sources |
| `/health` | GET | Connector health status |
| `/agents` | GET | Agents accessible to your role |
| `/connectors` | GET | Connectors and health |
| `/rag/status` | GET | Sync status and chunk counts |
| `/rag/sync` | POST | Trigger re-ingestion |
| `/rag/docs` | GET | Browse indexed documents |

**Chat request:**
```json
{
  "query": "What's the status of our Q2 roadmap?",
  "agent": null,
  "llm_mode": "external",
  "history": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ]
}
```

---

## Configuration

```yaml
# pmgpt.config.yaml

llm:
  external:
    model: claude-opus-4-6       # or gpt-4o, gemini-1.5-pro
    max_tokens: 4096
  local:
    model: mistral               # any Ollama model

data_classification:
  default_level: confidential    # fail-safe default

rbac:
  roles:
    pm:
      agents: [sprint, docs, analytics, ops]
      max_classification: internal
```

---

## FAQ

**Q: Does pmGPT store my data in the cloud?**
No. ChromaDB runs locally. Confidential and restricted data never touches external APIs.

**Q: Can I use GPT-4 or Gemini instead of Claude?**
Yes — the LLM picker in the UI lets you switch per session. Add your `OPENAI_API_KEY` or `GOOGLE_AI_API_KEY` to `.env` and the corresponding models appear in the dropdown.

**Q: Can I run it with no external LLM at all?**
Yes. Install Ollama, pull a model (`ollama pull mistral`), and set `llm_mode: local`. Everything runs on your machine.

**Q: What happens when I disconnect a connector?**
Already-indexed data remains in ChromaDB. Disconnected connectors are skipped during syncs until re-configured.

**Q: How often does pmGPT re-sync?**
On startup (full) and every hour (incremental — only changed documents). Override with `PMGPT_RAG_SYNC_INTERVAL=1800` (seconds).

**Q: How does conversation memory work after many turns?**
The last 8 messages are sent verbatim. Older turns get compressed into a ~120-word rolling summary injected into the system prompt. Key facts, names, and decisions are preserved indefinitely.

**Q: Can multiple team members use one instance?**
Yes. Each user passes their role via the `Authorization` header. RBAC enforces which agents and data they can access.

**Q: Is Atlassian Cloud or Server supported?**
Cloud (REST API v3). Server/DC requires adjusting base URL and API paths in the connector files.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, FastAPI, Uvicorn |
| Frontend | Vanilla JS / HTML / CSS (no framework) |
| Vector Store | ChromaDB (local, persistent) |
| Embeddings | `sentence-transformers/all-MiniLM-L6-v2` (via ChromaDB) |
| External LLMs | Anthropic Claude, OpenAI GPT-4o, Google Gemini |
| Local LLMs | Ollama — Mistral, Llama 3, Phi-3, any GGUF model |
| PDF Extraction | pypdf |
| Connectors | httpx (async), Google API Python client |

---

## Roadmap

- [ ] OpenAI GPT-4o and Gemini Pro full integration (UI wired, backend in progress)
- [ ] Slack App — respond directly inside Slack channels
- [ ] Linear connector
- [ ] GitHub connector (PRs, issues, code reviews)
- [ ] Persistent cross-session conversation memory
- [ ] Streaming responses
- [ ] Multi-workspace / team support

---

## Access

pmGPT is **not open source at this time**.

The repository is public for visibility, but the code is proprietary. Cloning or redistributing for production use requires explicit permission.

To request early access for your team: **[92.aashish@gmail.com](mailto:92.aashish@gmail.com)**

---

<div align="center">
  <sub>Built for product managers who are tired of context-switching between 6 tools to answer one question.</sub>
</div>
