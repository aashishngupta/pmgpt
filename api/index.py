"""pmGPT — Vercel serverless handler (stateless, no ChromaDB)."""

from __future__ import annotations

import os
import re
from typing import Optional

import anthropic
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://pmgpt.vercel.app", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Intent detection (mirrored from orchestrator) ──────────────────────────────

INTENT_RULES: list[tuple[str, list[str]]] = [
    ("sprint", ["sprint", "spillover", "velocity", "jira", "backlog", "story point",
                "ticket", "issue", "blocked", "scrum", "iteration", "burndown", "board", "epic"]),
    ("docs",   ["prd", "spec", "requirement", "confluence", "notion", "write a", "draft a",
                "create a doc", "user story", "acceptance criteria", "documentation", "rfc"]),
    ("strategy", ["roadmap", "okr", "product vision", "product strategy", "north star",
                  "key result", "quarterly plan", "rice framework", "ice framework",
                  "now next later", "strategic bet", "initiative", "positioning", "gtm"]),
    ("analytics", ["metric", "kpi", "retention", "conversion", "churn", "dau", "mau",
                   "funnel", "a/b test", "experiment", "dashboard", "analytics",
                   "measure", "trend", "engagement", "cohort", "activation"]),
    ("ops",    ["standup", "triage", "release note", "changelog", "update email",
                "meeting note", "action item", "follow-up", "daily update", "weekly update"]),
    ("review", ["resume", "job description", "interview", "career", "cover letter",
                "portfolio", "linkedin", "hire", "hiring", "pm role"]),
]

AGENT_SYSTEM_PROMPTS: dict[str, str] = {
    "sprint": (
        "You are a senior product manager specializing in agile sprint management. "
        "Help with sprint planning, backlog grooming, velocity tracking, and issue triage. "
        "Be concise, actionable, and use PM terminology accurately."
    ),
    "docs": (
        "You are a technical product manager expert at writing PRDs, specs, and documentation. "
        "Help draft user stories, acceptance criteria, RFCs, and product requirements. "
        "Structure your output clearly with headers, bullet points, and examples."
    ),
    "strategy": (
        "You are a product strategy expert. Help with roadmaps, OKRs, prioritization frameworks "
        "(RICE, ICE, Now-Next-Later), GTM strategies, and product vision. "
        "Be strategic, data-driven, and think long-term."
    ),
    "analytics": (
        "You are a product analytics expert. Help interpret metrics, design experiments, "
        "analyze funnels, and define KPIs. Be precise, quantitative, and hypothesis-driven."
    ),
    "ops": (
        "You are a product operations expert. Help with standups, release notes, changelogs, "
        "meeting notes, and team communication. Be clear, concise, and well-structured."
    ),
    "review": (
        "You are a PM career coach. Help with PM resumes, job descriptions, interview prep, "
        "and career strategy. Be encouraging, specific, and actionable."
    ),
    "general": (
        "You are a knowledgeable, direct assistant for a product team. "
        "Answer questions clearly and concisely. Use markdown only when it genuinely helps. "
        "Lead with the answer, not a preamble."
    ),
}


def detect_intent(query: str) -> str:
    q = query.lower()
    scores: dict[str, int] = {}
    for agent_name, keywords in INTENT_RULES:
        hits = sum(1 for kw in keywords if re.search(re.escape(kw), q))
        if hits:
            scores[agent_name] = hits
    return max(scores, key=lambda k: scores[k]) if scores else "general"


# ── Models ────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    query: str
    agent: Optional[str] = None
    llm_mode: Optional[str] = None
    history: list[dict] = []


class ChatResponse(BaseModel):
    agent: str
    intent_detected: str
    response: str
    sources: list = []


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    return {
        "status": "ok" if api_key else "missing_api_key",
        "connectors": {},
    }


@app.get("/agents")
async def list_agents():
    return {
        "role": "pm",
        "accessible_agents": list(AGENT_SYSTEM_PROMPTS.keys()),
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    intent = req.agent or detect_intent(req.query)
    if intent not in AGENT_SYSTEM_PROMPTS:
        intent = "general"

    system_prompt = AGENT_SYSTEM_PROMPTS[intent]

    # Build message history for Anthropic
    messages: list[dict] = []
    for turn in req.history:
        role = turn.get("role", "user")
        if role in ("user", "assistant"):
            messages.append({"role": role, "content": turn.get("content", "")})
    messages.append({"role": "user", "content": req.query})

    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))

    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2048,
            system=system_prompt,
            messages=messages,
        )
        response_text = message.content[0].text
    except Exception as exc:
        response_text = f"**Error:** {exc}"

    return ChatResponse(
        agent=intent,
        intent_detected=intent,
        response=response_text,
        sources=[],
    )
