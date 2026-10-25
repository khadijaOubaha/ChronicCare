
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt import InvalidTokenError
from sqlalchemy.orm import Session
import uuid
from sqlalchemy import text

from app.database import get_db
from app.models import User, UserRole
from app.schemas import UserLogin, UserRead, UserRegister, TokenResponse
from app.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    email = user_data.email.lower()

    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cette adresse e-mail est deja utilisee.",
        )

    # 1. Créer le compte utilisateur
    user = User(
        full_name=user_data.full_name,
        email=email,
        hashed_password=hash_password(user_data.password),
        role=UserRole.PATIENT,
    )

    try:
        db.add(user)
        db.flush()  # Générer l'identifiant sans valider la transaction

        # 2. Séparer le nom complet
        parts = user_data.full_name.strip().split(maxsplit=1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else parts[0]

        # 3. Créer la fiche patient liée au compte
        db.execute(
            text("""
                INSERT INTO patients (
                    id, user_id, first_name, last_name, email,
                    is_active, created_at, updated_at
                )
                VALUES (
                    :id, :user_id, :first_name, :last_name, :email,
                    TRUE, NOW(), NOW()
                )
            """),
            {
                "id": str(uuid.uuid4()),
                "user_id": str(user.id),
                "first_name": first_name,
                "last_name": last_name,
                "email": email,
            },
        )

        # 4. Valider les deux créations ensemble
        db.commit()
        db.refresh(user)

    except Exception:
        db.rollback()
        raise

    return user


@router.post("/login", response_model=TokenResponse)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    email = user_data.email.lower()
    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(
        user_data.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou mot de passe incorrect.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ce compte est desactive.",
        )

    token = create_access_token(user.id, user.role.value)
    return TokenResponse(access_token=token)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise InvalidTokenError("Identifiant utilisateur absent.")
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Jeton invalide ou expire.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.get(User, user_id)

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur introuvable ou desactive.",
        )

    return user


@router.get("/me", response_model=UserRead)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user
