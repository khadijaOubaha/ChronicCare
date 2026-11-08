from getpass import getpass
from sqlalchemy import select
from app.database import SessionLocal
from app.models import User, UserRole
from app.security import hash_password

full_name = input("Nom complet du médecin : ").strip()
email = input("Email du médecin : ").strip().lower()
password = getpass("Mot de passe (saisie masquée) : ")
confirmation = getpass("Confirmer le mot de passe : ")

if not full_name or not email or len(password) < 12:
    raise SystemExit("Nom et email obligatoires ; mot de passe de 12 caractères minimum.")
if password != confirmation:
    raise SystemExit("Les mots de passe ne correspondent pas.")

with SessionLocal() as db:
    existing = db.scalar(select(User).where(User.email == email))
    if existing:
        raise SystemExit("Cet email existe déjà. Aucun compte modifié.")

    user = User(
        full_name=full_name,
        email=email,
        hashed_password=hash_password(password),
        role=UserRole.ADMIN,
        is_active=True,
    )
    db.add(user)
    db.commit()
    print(f"Compte ADMIN créé : {user.email} (ID : {user.id})")
