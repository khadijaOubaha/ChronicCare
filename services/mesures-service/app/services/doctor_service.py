
from sqlalchemy import select, cast, String
from sqlalchemy.orm import Session

from app.models.user_ref import users_ref


def get_active_doctor_id(db: Session):
    statement = select(users_ref.c.id).where(
        cast(users_ref.c.role, String) == "ADMIN",
        users_ref.c.is_active.is_(True),
    )

    doctor_ids = db.execute(statement).scalars().all()

    if len(doctor_ids) == 0:
        raise RuntimeError("Aucun compte ADMIN actif trouvé.")

    if len(doctor_ids) > 1:
        raise RuntimeError("Plusieurs comptes ADMIN actifs trouvés.")

    return doctor_ids[0]
