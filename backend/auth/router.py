"""Auth routes — signup, login, me, refresh, logout."""
from __future__ import annotations

import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from backend.auth.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from backend.db.database import get_db
from backend.db.models import User, Workspace, WorkspaceMember, WorkspaceMemory

router = APIRouter(prefix="/auth", tags=["auth"])

_bearer = HTTPBearer(auto_error=False)


# ── Request / Response models ─────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    company_name: str
    role: str = "admin"
    industry: Optional[str] = None
    company_size: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict
    workspace: dict


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    workspace_id: str
    workspace_name: str


# ── Helpers ───────────────────────────────────────────────────────────────────

def _slug(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s or "workspace"


def _make_slug_unique(base: str, db: Session) -> str:
    slug, n = base, 1
    while db.query(Workspace).filter(Workspace.slug == slug).first():
        slug = f"{base}-{n}"; n += 1
    return slug


def _token_response(user: User, member: WorkspaceMember, workspace: Workspace) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(user.id, workspace.id, member.role),
        refresh_token=create_refresh_token(user.id),
        user={"id": user.id, "name": user.name, "email": user.email},
        workspace={"id": workspace.id, "name": workspace.name, "slug": workspace.slug},
    )


def _extract_token(credentials: HTTPAuthorizationCredentials = Depends(_bearer)) -> str:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return credentials.credentials


def get_current_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> dict:
    """Dependency — returns {user_id, workspace_id, role} or raises 401."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_token(credentials.credentials)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return {
        "user_id": payload["sub"],
        "workspace_id": payload["workspace_id"],
        "role": payload["role"],
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(name=req.name, email=req.email, hashed_password=hash_password(req.password))
    db.add(user)
    db.flush()

    slug = _make_slug_unique(_slug(req.company_name), db)
    workspace = Workspace(
        name=req.company_name,
        slug=slug,
        industry=req.industry,
        company_size=req.company_size,
    )
    db.add(workspace)
    db.flush()

    member = WorkspaceMember(workspace_id=workspace.id, user_id=user.id, role="admin")
    db.add(member)

    memory = WorkspaceMemory(
        workspace_id=workspace.id,
        company=f"{req.company_name}" + (f" — {req.industry}" if req.industry else ""),
    )
    db.add(memory)
    db.commit()
    db.refresh(user); db.refresh(workspace); db.refresh(member)

    return _token_response(user, member, workspace)


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not user.hashed_password or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    member = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == user.id).first()
    if not member:
        raise HTTPException(status_code=403, detail="No workspace found for this user")

    workspace = db.query(Workspace).filter(Workspace.id == member.workspace_id).first()
    return _token_response(user, member, workspace)


@router.post("/refresh", response_model=TokenResponse)
def refresh(req: RefreshRequest, db: Session = Depends(get_db)):
    try:
        payload = decode_token(req.refresh_token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Not a refresh token")

    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    member = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == user.id).first()
    workspace = db.query(Workspace).filter(Workspace.id == member.workspace_id).first()
    return _token_response(user, member, workspace)


@router.get("/me", response_model=UserResponse)
def me(db: Session = Depends(get_db), token: str = Depends(_extract_token)):
    try:
        payload = decode_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    member = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == user.id).first()
    workspace = db.query(Workspace).filter(Workspace.id == member.workspace_id).first()
    return UserResponse(
        id=user.id, name=user.name, email=user.email,
        role=member.role, workspace_id=workspace.id, workspace_name=workspace.name,
    )
