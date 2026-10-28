
import os
from typing import Annotated
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt import InvalidTokenError
from pydantic import BaseModel

JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
JWT_ALGORITHM = "HS256"

if not JWT_SECRET_KEY:
    raise RuntimeError("La variable JWT_SECRET_KEY est obligatoire.")

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="http://localhost:8000/api/v1/auth/login"
)


class CurrentUser(BaseModel):
    id: UUID
    role: str


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
) -> CurrentUser:
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
            options={"require": ["sub", "exp", "iat"]},
        )

        user_id = UUID(payload["sub"])
        role = payload.get("role")

        if role not in {"ADMIN", "PATIENT"}:
            raise InvalidTokenError("Rôle absent ou invalide.")

        return CurrentUser(id=user_id, role=role)

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
            detail="Accès réservé aux médecins.",
        )
    return current_user
