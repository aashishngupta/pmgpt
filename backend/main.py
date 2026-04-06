"""pmGPT — FastAPI application entry point."""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import Any, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, Request
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
    return FileResponse("frontend/index.html")


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
async def chat(req: ChatRequest, request: Request):
    role = _rbac.get_role(request)

    if req.agent:
        _rbac.require_agent(role, req.agent)

    result: dict[str, Any] = await _orchestrator.handle(
        query=req.query,
        user_role=role,
        agent_override=req.agent,
        llm_mode=req.llm_mode,
        history=req.history or [],
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
