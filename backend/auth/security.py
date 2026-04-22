"""JWT creation/verification and password hashing."""
from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

SECRET_KEY = os.environ.get("JWT_SECRET", "pmgpt-dev-secret-change-in-prod-32chars!!")
ALGORITHM  = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES  = 60 * 24        # 1 day
REFRESH_TOKEN_EXPIRE_MINUTES = 60 * 24 * 30   # 30 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_token(data: dict[str, Any], expires_minutes: int) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_access_token(user_id: str, workspace_id: str, role: str) -> str:
    return create_token(
        {"sub": user_id, "workspace_id": workspace_id, "role": role, "type": "access"},
        ACCESS_TOKEN_EXPIRE_MINUTES,
    )


def create_refresh_token(user_id: str) -> str:
    return create_token({"sub": user_id, "type": "refresh"}, REFRESH_TOKEN_EXPIRE_MINUTES)


def decode_token(token: str) -> dict[str, Any]:
    """Raises JWTError if invalid or expired."""
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
