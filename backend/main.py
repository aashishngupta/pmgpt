"""pmGPT — FastAPI application entry point."""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import Any, Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger("pmgpt")

# DB + auth imports
from backend.db.database import get_db, init_db
from backend.db.models import AgentConfig, AgentThread, Alert, ArtifactMemory, Message, Workspace, WorkspaceMemory
from backend.auth.router import get_current_user, router as auth_router
from sqlalchemy.orm import Session

CONFIG_PATH = os.environ.get("PMGPT_CONFIG", "pmgpt.config.yaml")


async def _rag_scheduler(ingester, interval_secs: int) -> None:
    """
    Background task: runs a full ingest on startup, then incremental syncs
    every `interval_secs` seconds forever.
    """
    logger.info("RAG scheduler started (interval=%ds)", interval_secs)
    # First run: full index (clears stale data)
    await ingester.ingest_all(force=True)
    # Subsequent runs: incremental (hash + timestamp filtered)
    while True:
        await asyncio.sleep(interval_secs)
        logger.info("RAG scheduled incremental sync…")
        await ingester.ingest_all(force=False)

# ---------------------------------------------------------------------------
# Lazy-initialised singletons (set up in lifespan)
# ---------------------------------------------------------------------------

import asyncio

from backend.connectors.registry import ConnectorRegistry
from backend.core.classifier import DataClassifier
from backend.core.governance import AuditLogger
from backend.core.orchestrator import Orchestrator
from backend.llm.router import LLMRouter
from backend.rag.ingester import Ingester
from backend.rag.retriever import Retriever
from backend.rag.store import VectorStore
from backend.rbac.middleware import RBACMiddleware
from backend.rbac.roles import RBACManager

_registry: ConnectorRegistry | None = None
_orchestrator: Orchestrator | None = None
_rbac: RBACMiddleware | None = None
_store: VectorStore | None = None
_ingester: Ingester | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _registry, _orchestrator, _rbac, _store, _ingester

    logger.info("Starting pmGPT...")
    init_db()
    logger.info("Database initialised.")
    classifier = DataClassifier(CONFIG_PATH)
    audit = AuditLogger("logs/audit.log")
    router = LLMRouter(CONFIG_PATH)

    _registry = ConnectorRegistry(CONFIG_PATH)

    # ── RAG pipeline ──────────────────────────────────────────────────────────
    rag_dir = os.environ.get("PMGPT_RAG_DIR", "data/rag")
    _store = VectorStore(persist_dir=rag_dir)
    _ingester = Ingester(_store, _registry)
    retriever = Retriever(_store)

    _orchestrator = Orchestrator(router, _registry, classifier, audit, retriever=retriever)
    _rbac = RBACMiddleware(RBACManager(CONFIG_PATH))

    # Kick off initial ingestion + periodic scheduler in background
    if _store.available and _registry.all():
        sync_interval = int(os.environ.get("PMGPT_RAG_SYNC_INTERVAL", "3600"))  # seconds
        asyncio.create_task(_rag_scheduler(_ingester, sync_interval))

    logger.info("pmGPT ready.")
    yield
    logger.info("pmGPT shutting down.")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="pmGPT",
    description="AI Chief of Staff for Product Managers",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/assets", StaticFiles(directory="frontend/assets"), name="assets")
app.include_router(auth_router)


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    query: str
    agent: Optional[str] = None  # optional override; auto-detected if omitted
    llm_mode: Optional[str] = None  # "external", "local", or None (auto/governed)
    history: list[dict] = []  # [{role: "user"|"assistant", content: str}, ...]

class ChatResponse(BaseModel):
    agent: str
    intent_detected: str
    response: str
    sources: list = []


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/", include_in_schema=False)
async def root():
    return FileResponse("frontend/landing.html")

@app.get("/app", include_in_schema=False)
async def app_ui():
    return FileResponse("frontend/app.html")


@app.get("/health")
async def health():
    if _registry is None:
        return JSONResponse({"status": "starting"}, status_code=503)

    connector_health = await _registry.health_check_all()
    return {
        "status": "ok",
        "connectors": connector_health,
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    role = current_user.get("role", _rbac.get_role(request))

    if req.agent:
        _rbac.require_agent(role, req.agent)

    # Inject workspace memory
    ws_mem = db.query(WorkspaceMemory).filter(
        WorkspaceMemory.workspace_id == current_user["workspace_id"]
    ).first()
    workspace_context = ws_mem.to_context() if ws_mem else ""

    result: dict[str, Any] = await _orchestrator.handle(
        query=req.query,
        user_role=role,
        agent_override=req.agent,
        llm_mode=req.llm_mode,
        history=req.history or [],
        workspace_context=workspace_context,
    )

    return ChatResponse(
        agent=result["agent"],
        intent_detected=result["intent_detected"],
        response=result["response"],
        sources=result.get("sources", []),
    )


@app.get("/agents")
async def list_agents(request: Request):
    role = _rbac.get_role(request)
    rbac_mgr = RBACManager(CONFIG_PATH)
    agents = ["sprint", "docs", "strategy", "analytics", "ops", "review", "general"]
    return {
        "role": role,
        "accessible_agents": [a for a in agents if rbac_mgr.has_agent_access(role, a)],
    }


@app.get("/rag/status")
async def rag_status():
    """
    Returns full sync state:
      - vector store total chunks
      - per-connector: last_sync timestamp, doc_count, chunk_count
    """
    if _ingester is None or _store is None:
        return {"available": False}
    return _ingester.sync_status()


@app.post("/rag/sync")
async def rag_sync(connector: Optional[str] = None, force: bool = False):
    """
    Trigger a re-ingestion.
      ?connector=gdrive  — sync one connector
      ?force=true        — full re-index (ignores content hash / timestamp)
      (no params)        — incremental sync of all connectors
    """
    if _ingester is None or _store is None:
        return JSONResponse({"error": "RAG not initialised"}, status_code=503)
    if not _store.available:
        return JSONResponse(
            {"error": "Vector store unavailable — is chromadb installed?"}, status_code=503
        )

    if connector:
        try:
            n = await _ingester.ingest_one(connector, force=force)
            return {"synced": connector, "chunks_indexed": n, "force": force}
        except ValueError as e:
            return JSONResponse({"error": str(e)}, status_code=404)

    summary = await _ingester.ingest_all(force=force)
    return {
        "synced": "all",
        "force": force,
        "chunks_by_connector": summary,
        "total_chunks": sum(summary.values()),
    }


@app.get("/rag/docs")
async def rag_docs(connector: Optional[str] = None, limit: int = 200, offset: int = 0):
    """
    Browse indexed documents.
      ?connector=gdrive  — filter by connector
      ?limit=50          — page size (default 200)
      ?offset=0          — pagination offset
    """
    if _store is None or not _store.available:
        return JSONResponse({"error": "Vector store unavailable"}, status_code=503)
    return _store.list_docs(connector=connector, limit=limit, offset=offset)


# ---------------------------------------------------------------------------
# Threads (multi-session chat history)
# ---------------------------------------------------------------------------

class ThreadCreate(BaseModel):
    agent_id: str
    title: Optional[str] = None
    artifact_type: Optional[str] = None


@app.post("/threads", status_code=201)
def create_thread(
    body: ThreadCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    thread = AgentThread(
        workspace_id=current_user["workspace_id"],
        user_id=current_user["user_id"],
        agent_id=body.agent_id,
        title=body.title or "New conversation",
        artifact_type=body.artifact_type,
    )
    db.add(thread); db.commit(); db.refresh(thread)
    return {"id": thread.id, "title": thread.title, "agent_id": thread.agent_id, "status": thread.status}


@app.get("/threads")
def list_threads(
    agent_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(AgentThread).filter(AgentThread.workspace_id == current_user["workspace_id"])
    if agent_id:
        q = q.filter(AgentThread.agent_id == agent_id)
    threads = q.order_by(AgentThread.updated_at.desc()).all()
    return [{"id": t.id, "title": t.title, "agent_id": t.agent_id, "status": t.status,
             "artifact_type": t.artifact_type, "updated_at": t.updated_at.isoformat()} for t in threads]


@app.get("/threads/{thread_id}/messages")
def get_messages(
    thread_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    thread = db.query(AgentThread).filter(
        AgentThread.id == thread_id,
        AgentThread.workspace_id == current_user["workspace_id"],
    ).first()
    if not thread:
        return JSONResponse({"error": "Thread not found"}, status_code=404)
    return [{"role": m.role, "content": m.content, "ts": m.created_at.isoformat()} for m in thread.messages]


@app.post("/threads/{thread_id}/messages")
async def post_message(
    thread_id: str,
    req: ChatRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Chat within a persistent thread — saves history and injects workspace memory."""
    thread = db.query(AgentThread).filter(
        AgentThread.id == thread_id,
        AgentThread.workspace_id == current_user["workspace_id"],
    ).first()
    if not thread:
        return JSONResponse({"error": "Thread not found"}, status_code=404)

    # Build history from DB
    history = [{"role": m.role, "content": m.content} for m in thread.messages[-20:]]

    # Inject workspace memory
    ws_memory = db.query(WorkspaceMemory).filter(
        WorkspaceMemory.workspace_id == current_user["workspace_id"]
    ).first()
    memory_ctx = ws_memory.to_context() if ws_memory else ""

    # Inject artifact memory if thread has one
    artifact_ctx = ""
    if thread.artifact_memory:
        artifact_ctx = thread.artifact_memory.to_context()

    enriched_query = req.query
    if memory_ctx or artifact_ctx:
        ctx_parts = []
        if memory_ctx:     ctx_parts.append(f"[Workspace context]\n{memory_ctx}")
        if artifact_ctx:   ctx_parts.append(f"[Artifact context]\n{artifact_ctx}")
        enriched_query = req.query + "\n\n---\n" + "\n\n".join(ctx_parts)

    result = await _orchestrator.handle(
        query=enriched_query,
        user_role=current_user["role"],
        agent_override=thread.agent_id if thread.agent_id != "general" else None,
        llm_mode=req.llm_mode,
        history=history,
        workspace_context=memory_ctx,
    )

    # Auto-title thread from first message
    if len(thread.messages) == 0 and len(req.query) > 10:
        thread.title = req.query[:60] + ("…" if len(req.query) > 60 else "")

    # Persist messages
    db.add(Message(thread_id=thread_id, role="user",      content=req.query))
    db.add(Message(thread_id=thread_id, role="assistant", content=result["response"], agent_used=result["agent"]))
    db.commit()

    return ChatResponse(
        agent=result["agent"],
        intent_detected=result["intent_detected"],
        response=result["response"],
        sources=result.get("sources", []),
    )


# ---------------------------------------------------------------------------
# Workspace memory
# ---------------------------------------------------------------------------

class WorkspaceMemoryUpdate(BaseModel):
    company: Optional[str] = None
    product: Optional[str] = None
    team:    Optional[str] = None
    sprint:  Optional[str] = None
    okrs:    Optional[str] = None


@app.get("/workspace/memory")
def get_workspace_memory(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mem = db.query(WorkspaceMemory).filter(
        WorkspaceMemory.workspace_id == current_user["workspace_id"]
    ).first()
    if not mem:
        return {}
    return {"company": mem.company, "product": mem.product, "team": mem.team,
            "sprint": mem.sprint, "okrs": mem.okrs}


@app.put("/workspace/memory")
def update_workspace_memory(
    body: WorkspaceMemoryUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mem = db.query(WorkspaceMemory).filter(
        WorkspaceMemory.workspace_id == current_user["workspace_id"]
    ).first()
    if not mem:
        mem = WorkspaceMemory(workspace_id=current_user["workspace_id"])
        db.add(mem)
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(mem, field, val)
    db.commit()
    return {"ok": True}


# ---------------------------------------------------------------------------
# Jira write endpoints (human-in-loop)
# ---------------------------------------------------------------------------

class JiraCreateRequest(BaseModel):
    project_key: str
    summary: str
    description: str
    issue_type: str = "Story"
    priority: str = "Medium"
    labels: list[str] = []


@app.post("/jira/create")
async def jira_create(
    body: JiraCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    if _registry is None:
        return JSONResponse({"error": "Registry not ready"}, status_code=503)
    connector = _registry.get("jira")
    if not connector:
        return JSONResponse({"error": "Jira connector not configured"}, status_code=404)
    result = await connector.create_issue(
        project_key=body.project_key,
        summary=body.summary,
        description=body.description,
        issue_type=body.issue_type,
        priority=body.priority,
        labels=body.labels or [],
    )
    return result


@app.get("/connectors")
async def list_connectors(request: Request):
    role = _rbac.get_role(request)
    if _registry is None:
        return {"connectors": []}
    connector_health = await _registry.health_check_all()
    rbac_mgr = RBACManager(CONFIG_PATH)
    return {
        "role": role,
        "connectors": {
            name: {
                "healthy": healthy,
                "accessible": rbac_mgr.has_connector_access(role, name),
            }
            for name, healthy in connector_health.items()
        },
    }


# ---------------------------------------------------------------------------
# Agent config endpoints
# ---------------------------------------------------------------------------

class AgentConfigUpdate(BaseModel):
    enabled: Optional[bool] = None
    llm: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    min_role: Optional[str] = None
    memory_enabled: Optional[bool] = None
    system_prompt: Optional[str] = None
    behaviors: Optional[str] = None    # JSON string
    personality: Optional[str] = None  # JSON string
    connectors: Optional[str] = None   # JSON string


@app.get("/agents/config")
def list_agent_configs(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    configs = db.query(AgentConfig).filter(
        AgentConfig.workspace_id == current_user["workspace_id"]
    ).all()
    return {
        c.agent_id: {
            "enabled": c.enabled, "llm": c.llm, "temperature": c.temperature,
            "max_tokens": c.max_tokens, "min_role": c.min_role,
            "memory_enabled": c.memory_enabled, "system_prompt": c.system_prompt,
            "behaviors": c.behaviors, "personality": c.personality,
            "connectors": c.connectors, "updated_at": c.updated_at.isoformat(),
        }
        for c in configs
    }


@app.put("/agents/config/{agent_id}")
def save_agent_config(
    agent_id: str,
    body: AgentConfigUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cfg = db.query(AgentConfig).filter(
        AgentConfig.workspace_id == current_user["workspace_id"],
        AgentConfig.agent_id == agent_id,
    ).first()
    if not cfg:
        cfg = AgentConfig(workspace_id=current_user["workspace_id"], agent_id=agent_id)
        db.add(cfg)
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(cfg, field, val)
    db.commit()
    return {"ok": True, "agent_id": agent_id}


@app.get("/agents/config/{agent_id}")
def get_agent_config(
    agent_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cfg = db.query(AgentConfig).filter(
        AgentConfig.workspace_id == current_user["workspace_id"],
        AgentConfig.agent_id == agent_id,
    ).first()
    if not cfg:
        return {}
    return {
        "enabled": cfg.enabled, "llm": cfg.llm, "temperature": cfg.temperature,
        "max_tokens": cfg.max_tokens, "min_role": cfg.min_role,
        "memory_enabled": cfg.memory_enabled, "system_prompt": cfg.system_prompt,
        "behaviors": cfg.behaviors, "personality": cfg.personality,
        "connectors": cfg.connectors,
    }


# ---------------------------------------------------------------------------
# Alert endpoints
# ---------------------------------------------------------------------------

class AlertCreate(BaseModel):
    source_agent: str
    alert_type: str
    title: str
    body: str
    action_url: Optional[str] = None
    action_label: Optional[str] = None


@app.get("/alerts")
def list_alerts(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    alerts = db.query(Alert).filter(
        Alert.workspace_id == current_user["workspace_id"],
        Alert.dismissed == False,
    ).order_by(Alert.created_at.desc()).limit(50).all()
    return [
        {
            "id": a.id, "source_agent": a.source_agent, "alert_type": a.alert_type,
            "title": a.title, "body": a.body, "action_url": a.action_url,
            "action_label": a.action_label, "created_at": a.created_at.isoformat(),
        }
        for a in alerts
    ]


@app.post("/alerts", status_code=201)
def create_alert(
    body: AlertCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    alert = Alert(workspace_id=current_user["workspace_id"], **body.model_dump())
    db.add(alert); db.commit(); db.refresh(alert)
    return {"id": alert.id}


@app.patch("/alerts/{alert_id}/dismiss")
def dismiss_alert(
    alert_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    alert = db.query(Alert).filter(
        Alert.id == alert_id,
        Alert.workspace_id == current_user["workspace_id"],
    ).first()
    if not alert:
        return JSONResponse({"error": "Not found"}, status_code=404)
    alert.dismissed = True
    db.commit()
    return {"ok": True}


# ---------------------------------------------------------------------------
# Artifact memory endpoints
# ---------------------------------------------------------------------------

class ArtifactMemoryCreate(BaseModel):
    thread_id: str
    artifact_type: str
    title: str
    summary: str
    decisions: str = "[]"
    open_questions: str = "[]"
    key_context: str = "[]"
    external_id: Optional[str] = None


@app.post("/artifacts/memory", status_code=201)
def create_artifact_memory(
    body: ArtifactMemoryCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    thread = db.query(AgentThread).filter(
        AgentThread.id == body.thread_id,
        AgentThread.workspace_id == current_user["workspace_id"],
    ).first()
    if not thread:
        return JSONResponse({"error": "Thread not found"}, status_code=404)
    mem = ArtifactMemory(**body.model_dump())
    db.add(mem)
    thread.status = "published"
    if body.external_id:
        thread.external_id = body.external_id
    db.commit()
    db.refresh(mem)
    return {"id": mem.id}


@app.get("/artifacts/memory/{thread_id}")
def get_artifact_memory(
    thread_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    thread = db.query(AgentThread).filter(
        AgentThread.id == thread_id,
        AgentThread.workspace_id == current_user["workspace_id"],
    ).first()
    if not thread or not thread.artifact_memory:
        return {}
    m = thread.artifact_memory
    return {
        "id": m.id, "artifact_type": m.artifact_type, "title": m.title,
        "summary": m.summary, "decisions": m.decisions,
        "open_questions": m.open_questions, "key_context": m.key_context,
        "external_id": m.external_id,
    }
