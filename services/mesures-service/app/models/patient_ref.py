from sqlalchemy import Column, Table, Uuid

from app.database import Base


patients_ref = Table(
    "patients",
    Base.metadata,
    Column("id", Uuid(as_uuid=True), primary_key=True),
    info={"skip_autogenerate": True},
)