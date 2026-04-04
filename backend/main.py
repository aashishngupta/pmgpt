"""pmgPT — FastAPI application entry point."""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import Any, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger("pmgpt")

CONFIG_PATH = os.environ.get("PMGPT_CONFIG", "pmgpt.config.yaml")

# ---------------------------------------------------------------------------
# Lazy-initialised singletons (set up in lifespan)
# ---------------------------------------------------------------------------

from backend.connectors.registry import ConnectorRegistry
from backend.core.classifier import DataClassifier
from backend.core.governance import AuditLogger
from backend.core.orchestrator import Orchestrator
from backend.llm.router import LLMRouter
from backend.rbac.middleware import RBACMiddleware
from backend.rbac.roles import RBACManager

_registry: ConnectorRegistry | None = None
_orchestrator: Orchestrator | None = None
_rbac: RBACMiddleware | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _registry, _orchestrator, _rbac

    logger.info("Starting pmgPT...")
    classifier = DataClassifier(CONFIG_PATH)
    audit = AuditLogger("logs/audit.log")
    router = LLMRouter(CONFIG_PATH)

    _registry = ConnectorRegistry(CONFIG_PATH)
    _orchestrator = Orchestrator(router, _registry, classifier, audit)
    _rbac = RBACMiddleware(RBACManager(CONFIG_PATH))

    logger.info("pmgPT ready.")
    yield
    logger.info("pmgPT shutting down.")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="pmgPT",
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


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    query: str
    agent: Optional[str] = None  # optional override; auto-detected if omitted

class ChatResponse(BaseModel):
    agent: str
    intent_detected: str
    response: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/", include_in_schema=False)
async def root():
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
    )

    return ChatResponse(
        agent=result["agent"],
        intent_detected=result["intent_detected"],
        response=result["response"],
    )


@app.get("/agents")
async def list_agents(request: Request):
    role = _rbac.get_role(request)
    rbac_mgr = RBACManager(CONFIG_PATH)
    agents = ["sprint", "docs", "strategy", "analytics", "ops", "review"]
    return {
        "role": role,
        "accessible_agents": [a for a in agents if rbac_mgr.has_agent_access(role, a)],
    }


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
