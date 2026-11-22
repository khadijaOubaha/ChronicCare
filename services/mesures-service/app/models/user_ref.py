
from sqlalchemy import Boolean, Column, String, Table, Uuid

from app.database import Base


users_ref = Table(
    "users",
    Base.metadata,
    Column("id", Uuid(as_uuid=True), primary_key=True),
    Column("role", String(20), nullable=False),
    Column("is_active", Boolean, nullable=False),
    info={"skip_autogenerate": True},
)
