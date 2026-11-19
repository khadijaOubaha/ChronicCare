import os
from typing import Annotated
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt import InvalidTokenError
from pydantic import BaseModel

JWT_ALGORITHM = "HS256"


def _get_jwt_secret() -> str:
    """Lecture différée de la clé JWT (supporte les tests sans variable d'env fixe)."""
    return os.environ.get("JWT_SECRET_KEY", "test-secret-key-chroniccare-only")


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="http://localhost:8000/api/v1/auth/login",
    auto_error=False,
)


class CurrentUser(BaseModel):
    id: UUID
    role: str
    token: str | None = None


def get_current_user(
    token: Annotated[str | None, Depends(oauth2_scheme)],
) -> CurrentUser:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Jeton d'authentification manquant.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(
            token,
            _get_jwt_secret(),
            algorithms=[JWT_ALGORITHM],
            options={"require": ["sub", "exp", "iat"]},
        )

        user_id = UUID(payload["sub"])
        role = payload.get("role")

        if role not in {"ADMIN", "PATIENT"}:
            raise InvalidTokenError("Rôle absent ou invalide.")

        return CurrentUser(id=user_id, role=role, token=token)

    except (InvalidTokenError, ValueError, KeyError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Jeton invalide ou expiré.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_admin(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> CurrentUser:
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux médecins (ADMIN).",
        )
    return current_user
