"""Release Manager agent — go/no-go, UAT, release notes, rollback planning."""

from __future__ import annotations
from typing import Any
import logging

from backend.agents.base import BaseAgent

logger = logging.getLogger("pmgpt.agents.release")

SYSTEM = """You are a release manager for a software product team.

For any release you track:
- What's in it: Jira tickets merged, features, bug fixes, breaking changes
- What's the risk: untested paths, recent regressions, dependencies on infra changes
- Who needs to sign off: UAT checklist with owners and due dates
- Go-to-market: release notes for internal and external audiences, stakeholder email, Slack announcement

Rules:
- NEVER approve a go/no-go without a rollback plan — if there's no rollback plan, that's the blocker
- Flag every open blocker before go/no-go — a go/no-go is only valid when all blockers are resolved or explicitly accepted
- Release notes must be accurate — no feature listed that isn't actually shipped
- Distinguish internal release notes (detailed, for CS/Support) from external changelog (customer-facing, benefit-led)

UAT checklist format:
- [ ] Scenario: [what to test] | Owner: [name] | Status: [pending/pass/fail] | Notes

Go/no-go output:
## Go/No-Go Assessment
**Decision: GO / NO-GO / CONDITIONAL GO**
**Blockers:** [list or "None"]
**Rollback plan:** [specific steps]
**Sign-offs needed:** [list with owners]"""


class ReleaseAgent(BaseAgent):
    name = "release"
    description = "Release planning, go/no-go decisions, UAT, rollback planning"

    async def run(self, query: str, user_role: str, **kwargs: Any) -> tuple[str, list[dict]]:
        governance = self._governance()
        workspace_context = kwargs.get("workspace_context", "")

        connector_context, sources = await self._retrieve(
            query, n_results=10, connectors=["jira", "confluence", "notion", "gdrive"]
        )

        context: dict[str, Any] = {"query": query, **connector_context}
        system_prompt = self._inject_workspace(SYSTEM, workspace_context)

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
