"""FastAPI RBAC middleware — enforces role-based access on every request."""

from __future__ import annotations

import logging

from fastapi import HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.rbac.roles import RBACManager

logger = logging.getLogger("pmgpt.rbac")

security = HTTPBearer(auto_error=False)


def _decode_role_from_token(token: str) -> str:
    """
    Minimal token → role mapping for local/dev use.

    In production, replace this with real JWT validation.
    Tokens are in the format:  <role>:<secret>
    e.g. "pm:mysecret", "admin:mysecret"
    """
    if ":" in token:
        role = token.split(":")[0].strip().lower()
        return role
    # Unknown format — default to most restrictive role
    return "viewer"


class RBACMiddleware:
    def __init__(self, rbac: RBACManager) -> None:
        self.rbac = rbac

    def get_role(self, request: Request) -> str:
        """Extract role from Authorization header. Falls back to 'viewer'."""
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[len("Bearer "):].strip()
            role = _decode_role_from_token(token)
            if self.rbac.role_exists(role):
                return role
            logger.warning("Unknown role '%s' in token, defaulting to viewer", role)
        return "viewer"

    def require_agent(self, role: str, agent: str) -> None:
        if not self.rbac.has_agent_access(role, agent):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{role}' does not have access to agent '{agent}'",
            )

    def require_connector(self, role: str, connector: str) -> None:
        if not self.rbac.has_connector_access(role, connector):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{role}' does not have access to connector '{connector}'",
            )
