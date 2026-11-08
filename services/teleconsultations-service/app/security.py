"""Authentification JWT et contrôle des rôles.

Le jeton est émis par le service d'authentification. Le Teleconsultations
Service ne fait que le vérifier avec le secret partagé (variable JWT_SECRET).

Format attendu du jeton (à ajuster si le service d'authentification diffère) :
  - sub  : UUID de l'utilisateur
  - role : "ADMIN" (médecin) ou "PATIENT"
"""
import os
from dataclasses import dataclass
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

ROLE_ADMIN = "ADMIN"
ROLE_PATIENT = "PATIENT"
VALID_ROLES = {ROLE_ADMIN, ROLE_PATIENT}

bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    id: UUID
    role: str


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> CurrentUser:
    """Vérifie le jeton JWT et retourne l'utilisateur connecté."""
    if credentials is None:
        raise _unauthorized("Authentification requise")

    secret = os.getenv("JWT_SECRET")
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT_SECRET n'est pas configuré",
        )
    algorithm = os.getenv("JWT_ALGORITHM", "HS256")

    try:
        payload = jwt.decode(credentials.credentials, secret, algorithms=[algorithm])
    except jwt.PyJWTError:
        raise _unauthorized("Jeton invalide ou expiré")

    try:
        user_id = UUID(str(payload.get("sub")))
    except ValueError:
        raise _unauthorized("Jeton invalide : identifiant utilisateur manquant")

    role = str(payload.get("role", "")).upper()
    if role not in VALID_ROLES:
        raise _unauthorized("Jeton invalide : rôle inconnu")

    return CurrentUser(id=user_id, role=role)


def require_admin(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    """Réserve la route au médecin (rôle ADMIN)."""
    if user.role != ROLE_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Action réservée au médecin (rôle ADMIN)",
        )
    return user
