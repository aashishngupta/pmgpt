<div align="center">
  <img src="frontend/assets/logo-icon.svg" width="72" height="72" alt="pmGPT logo" />
  <h1>pmGPT</h1>
  <p><strong>AI Chief of Staff for Product Managers</strong></p>
  <p>Connect your Jira, Confluence, Notion, Google Drive, Slack and more — then ask anything. pmGPT retrieves context from your actual work, answers with citations, and never leaks confidential data to external AI.</p>

  <p>
    <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi" />
    <img src="https://img.shields.io/badge/Claude-Opus%204.6-blueviolet?style=flat-square&logo=anthropic" />
    <img src="https://img.shields.io/badge/ChromaDB-vector%20store-orange?style=flat-square" />
    <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" />
  </p>
</div>

---

## What is pmGPT?

pmGPT is an open-source AI assistant purpose-built for product managers. Unlike generic AI chatbots, pmGPT:

- **Knows your actual work** — it indexes your Jira tickets, Confluence pages, Notion docs, Google Drive files, Slack messages, and Calendar events into a local vector database
- **Cites its sources** — every answer links back to the exact document, ticket, or message it pulled from
- **Keeps sensitive data local** — a built-in governance engine classifies every field and routes confidential data to a local LLM (Ollama/Mistral) instead of sending it to the cloud
- **Remembers the conversation** — multi-turn context with rolling compression means follow-up questions always work

---

## Features

| Feature | Description |
|---|---|
| **7 Specialist Agents** | Sprint planning, docs writing, strategy, analytics, standups, career review, general Q&A |
| **RAG Pipeline** | ChromaDB vector store, incremental sync, content-hash deduplication |
| **6 Connectors** | Jira, Confluence, Notion, Google Drive, Slack, Google Calendar |
| **Data Governance** | Per-field sensitivity classification, automatic LLM routing, PII tokenisation |
| **RBAC** | Role-based access — admin, pm_lead, pm, viewer |
| **Multi-turn Context** | Rolling conversation summary, never loses key facts |
| **Audit Logging** | Full audit trail of every LLM call with role, path, and sensitivity |
| **Dual LLM** | Claude (external, public data) + Ollama/Mistral (local, confidential data) |
| **Docker Ready** | Single `docker compose up` to run everything |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (HTML/JS)                │
│         Chat UI · Source citations · RBAC role       │
└────────────────────┬────────────────────────────────┘
                     │ REST /chat
┌────────────────────▼────────────────────────────────┐
│               FastAPI Backend                        │
│                                                      │
│  ┌─────────────┐   ┌──────────────────────────────┐ │
│  │ Orchestrator│──▶│  Agents (7)                  │ │
│  │ intent      │   │  sprint · docs · strategy    │ │
│  │ detection   │   │  analytics · ops · review    │ │
│  └─────────────┘   │  general                     │ │
│                    └──────────────┬───────────────┘ │
│                                   │                  │
│  ┌────────────────────────────────▼───────────────┐ │
│  │              RAG Pipeline                       │ │
│  │  ChromaDB ◀── Ingester ◀── Connectors (6)      │ │
│  │  Retriever → semantic search → citations        │ │
│  └────────────────────────────────┬───────────────┘ │
│                                   │                  │
│  ┌────────────────────────────────▼───────────────┐ │
│  │              Governance Engine                  │ │
│  │  classify fields → mask PII → route LLM         │ │
│  └───────────────────┬─────────────────────────────┘│
└──────────────────────┼──────────────────────────────┘
                       │
          ┌────────────┴───────────┐
          │                        │
   ┌──────▼──────┐        ┌────────▼──────┐
   │ Claude API  │        │  Ollama/Mistral│
   │ (public)    │        │  (confidential)│
   └─────────────┘        └───────────────┘
```

---

## Quick Start

### Prerequisites

- Python 3.10+
- An [Anthropic API key](https://console.anthropic.com/)
- At least one connector credential (see [Connectors](#connectors))

### 1. Clone and install

```bash
git clone https://github.com/aashishngupta/pmgpt.git
cd pmgpt
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
pip install pypdf  # for PDF extraction from Google Drive
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials (only add the connectors you use):

```env
# Required
ANTHROPIC_API_KEY=sk-ant-...

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

Open **http://localhost:8000/app** in your browser.

### Docker (recommended for production)

```bash
cp .env.example .env  # fill in credentials
docker compose up -d
```

For local LLM support (confidential data routing):
```bash
docker exec -it pmgpt-ollama-1 ollama pull mistral
```

---

## Connectors

Each connector syncs automatically on startup and refreshes every hour. You can also trigger a manual sync:

```bash
# Sync all connectors
curl -X POST "http://localhost:8000/rag/sync"

# Sync a specific connector (force full re-index)
curl -X POST "http://localhost:8000/rag/sync?connector=gdrive&force=true"
```

### Supported connectors

| Connector | What it indexes | Auth method |
|---|---|---|
| **Jira** | Issues, epics, stories, bugs, comments | API token |
| **Confluence** | Pages, spaces, documentation | API token |
| **Notion** | Pages, databases, blocks | Integration API key |
| **Google Drive** | Docs, Sheets, Slides, PDFs, plain text | Service account |
| **Slack** | Messages, threads | Bot token |
| **Google Calendar** | Events, meetings, descriptions | Service account |

### Setting up Google Drive / Calendar (service account)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → Enable **Google Drive API** and **Google Calendar API**
3. Create a **Service Account** → Download the JSON key
4. Share your Drive folder / Calendar with the service account email
5. Set `GOOGLE_SERVICE_ACCOUNT_JSON=/path/to/key.json` in `.env`

### Setting up Notion

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Create a new integration → copy the **Internal Integration Token**
3. Share each Notion page/database with your integration (Share → invite)
4. Set `NOTION_API_KEY=secret_...` in `.env`

### Setting up Slack

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps) → Create New App
2. Add OAuth scopes: `search:read`, `channels:history`, `channels:read`
3. Install to workspace → copy **Bot User OAuth Token**
4. Set `SLACK_BOT_TOKEN=xoxb-...` in `.env`

---

## Agents

pmGPT automatically routes your query to the right specialist agent. You can also select one manually.

| Agent | Triggered by | Does |
|---|---|---|
| **Sprint** | "sprint", "standup", "velocity", "backlog" | Sprint health, spillovers, Jira ticket analysis |
| **Docs** | "PRD", "spec", "write a doc", "requirements" | Drafts PRDs, specs, release notes from your existing docs |
| **Strategy** | "roadmap", "OKR", "product vision", "GTM" | Roadmap analysis, OKR alignment, strategy from Drive/Notion |
| **Analytics** | "metrics", "DAU", "conversion", "retention" | Data interpretation, trend analysis |
| **Ops** | "standup", "triage", "priorities", "blockers" | Daily standup prep, task triage from Jira + Slack |
| **Review** | "resume", "performance", "career", "interview" | PM career coaching, job application tools |
| **General** | Everything else | Searches all connectors first, answers from knowledge if nothing found |

---

## Data Security & Governance

This is the most important section if you're considering using pmGPT with real company data.

### How data classification works

Every field from every connector has a sensitivity level defined in `pmgpt.config.yaml`:

```
public       → safe to send to Claude (external API)
internal     → sent to local Ollama only
confidential → PII tokenised before local LLM, real values re-injected after
restricted   → never sent to any LLM, template-rendered only
```

**Example — a Jira issue:**
| Field | Classification | Goes to |
|---|---|---|
| status, priority | `public` | Claude API |
| summary, description | `internal` | Ollama (local) |
| assignee, reporter | `confidential` | Ollama after PII masking |
| comments | `confidential` | Ollama after PII masking |

### What never leaves your machine

- Anything classified `confidential` or `restricted`
- The ChromaDB vector store (stored in `data/rag/`)
- All audit logs (`logs/audit.log`)
- Your `.env` credentials

### RBAC roles

| Role | Agents | Max data level |
|---|---|---|
| `admin` | All | Restricted |
| `pm_lead` | All except review | Confidential |
| `pm` | Sprint, docs, analytics, ops | Internal |
| `viewer` | Analytics only | Public |

Set your role in the chat UI or pass it via the `Authorization: Bearer {role}:secret` header.

### Audit trail

Every LLM call is logged to `logs/audit.log` with:
- Timestamp, user role, agent name
- LLM path used (external / local / template)
- Maximum data sensitivity level in the request
- No prompts or responses are logged by default (set `include_prompts: true` in config for dev)

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/chat` | POST | Send a message, get an AI response with sources |
| `/health` | GET | Connector health status |
| `/agents` | GET | List agents accessible to your role |
| `/connectors` | GET | List connectors and their health |
| `/rag/status` | GET | Sync status and chunk counts per connector |
| `/rag/sync` | POST | Trigger re-ingestion (`?connector=X&force=true`) |
| `/rag/docs` | GET | Browse indexed documents (`?connector=gdrive`) |

**Chat request format:**
```json
{
  "query": "What's the status of our Q2 roadmap?",
  "agent": null,
  "llm_mode": "external",
  "history": [
    {"role": "user", "content": "...previous turn..."},
    {"role": "assistant", "content": "...previous response..."}
  ]
}
```

---

## Configuration Reference

All configuration lives in `pmgpt.config.yaml`. Key sections:

```yaml
llm:
  external:
    model: claude-opus-4-6     # Change to claude-haiku-4-5-20251001 for faster/cheaper
    max_tokens: 4096
  local:
    model: mistral             # Any Ollama model

data_classification:
  default_level: confidential  # Fail-safe: unknown fields default to confidential

rbac:
  roles:
    pm:
      agents: [sprint, docs, analytics, ops]
      max_classification: internal
```

---

## FAQ

**Q: Does pmGPT store my data in the cloud?**
No. The vector database (ChromaDB) runs locally on your machine. Confidential and restricted data is never sent to external APIs.

**Q: What happens when I disconnect a connector?**
The data already indexed in ChromaDB remains until you force a full re-sync (`?force=true`). Disconnected connectors are skipped during incremental syncs.

**Q: How often does pmGPT re-sync my connectors?**
On startup (full sync) and then every hour (incremental — only changed documents). Override with `PMGPT_RAG_SYNC_INTERVAL=1800` (seconds).

**Q: Can I use it without an Anthropic API key?**
Yes, if you run Ollama locally. Set `llm_mode: local` in requests. However the default routing still prefers Claude for public data.

**Q: How does the rolling conversation summary work?**
The last 8 messages are always sent verbatim. When the conversation exceeds 8 messages, older turns are compressed into a ~120-word summary and injected into the system prompt. Key facts, names, and decisions are preserved indefinitely.

**Q: Can multiple team members use the same instance?**
Yes. Each user passes their role via the `Authorization` header. RBAC enforces which agents and connectors they can access.

**Q: Is Confluence/Jira Cloud or Server supported?**
Atlassian Cloud (REST API v3). Server/DC requires changing the base URL and potentially the API endpoints in the connector files.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, FastAPI, Uvicorn |
| Frontend | Vanilla JS, HTML/CSS (no framework) |
| Vector Store | ChromaDB (local, persistent) |
| Embeddings | `sentence-transformers/all-MiniLM-L6-v2` (via ChromaDB default) |
| External LLM | Anthropic Claude Opus 4.6 |
| Local LLM | Ollama + Mistral (configurable) |
| PDF Extraction | pypdf |
| Connectors | httpx (async), Google API Python client |
| Auth | HTTP Basic (Jira/Confluence), Bearer token (Slack/Notion), Service account (Google) |

---

## Roadmap

- [ ] Slack App integration (respond directly in Slack)
- [ ] Linear connector
- [ ] GitHub connector (PRs, issues)
- [ ] Persistent cross-session conversation memory
- [ ] Streaming responses
- [ ] Multi-workspace support

---

## Contributing

Pull requests are welcome. For major changes, open an issue first.

```bash
git clone https://github.com/aashishngupta/pmgpt.git
cd pmgpt
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <sub>Built for product managers who are tired of context-switching between 6 tools to answer one question.</sub>
</div>
