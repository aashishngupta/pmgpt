"""Docs agent — PRD generation, spec writing, user stories, documentation."""

from __future__ import annotations
import logging
from typing import Any
from backend.agents.base import BaseAgent

logger = logging.getLogger("pmgpt.agents.docs")

SYSTEM_WITH_INTERNAL = """You are an expert Product Manager specialising in product documentation.

Existing internal documents are included as numbered references [1], [2], etc.

Rules:
- Use internal documents as context — cite inline, e.g. "Building on our existing PRD [1]..."
- Generate clean, structured markdown with headings, bullets, tables, acceptance criteria
- For PRDs: always include Problem, Goals, Non-goals, User stories, Success metrics, Open questions
- Never fabricate content not in the provided context — if something is unclear, add it as an open question
- User stories must follow: As a [persona], I want [action] so that [outcome]. With acceptance criteria as numbered checklist items.
- Always include a "Success metrics" section — every requirement needs a measurable outcome"""

SYSTEM_NO_INTERNAL = """You are an expert Product Manager specialising in product documentation.

No existing internal documents found for this query.

> **No existing docs found** — generating from scratch based on best practices.

Rules:
- Produce the requested document in clean, structured markdown
- For PRDs: include Problem, Goals, Non-goals, User stories, Success metrics, Open questions
- User stories: As a [persona], I want [action] so that [outcome]
- Acceptance criteria: numbered checklist items
- Always include a "Success metrics" section
- Never skip the "Open questions" section — there are always open questions"""


class DocsAgent(BaseAgent):
    name = "docs"
    description = "PRD generation, user stories, spec writing, documentation"

    async def run(self, query: str, user_role: str, **kwargs: Any) -> tuple[str, list[dict]]:
        governance = self._governance()
        workspace_context = kwargs.get("workspace_context", "")

        connector_context, sources = await self._retrieve(
            query, n_results=8, connectors=["confluence", "notion", "gdrive"]
        )

        has_internal = bool(connector_context)
        context: dict[str, Any] = {"query": query, **connector_context}
        system_prompt_base = SYSTEM_WITH_INTERNAL if has_internal else SYSTEM_NO_INTERNAL
        system_prompt = self._inject_workspace(system_prompt_base, workspace_context)

        response = await self.router.call(
            system_prompt=system_prompt,
            user_prompt=query,
            context=context,
            governance=governance,
            agent=self.name,
            user_role=user_role,
            llm_mode=kwargs.get("llm_mode"),
            history=kwargs.get("history"),
        )
        return response, sources
