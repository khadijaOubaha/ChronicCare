
import os
from datetime import datetime, timedelta, timezone
from uuid import UUID

import jwt
from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()

JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")

if not JWT_SECRET_KEY:
    raise RuntimeError("La variable JWT_SECRET_KEY est obligatoire.")

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


def hash_password(password: str) -> str:
    """Hache un mot de passe avant son stockage."""
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    """Vérifie le mot de passe fourni."""
    return password_hash.verify(password, hashed_password)


def create_access_token(user_id: UUID, role: str) -> str:
    """Crée un JWT signé avec une expiration de 30 minutes."""
    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(user_id),
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> dict:
    """Vérifie la signature et l'expiration du JWT."""
    return jwt.decode(
        token,
        JWT_SECRET_KEY,
        algorithms=[JWT_ALGORITHM],
        options={"require": ["sub", "exp", "iat"]},
    )
