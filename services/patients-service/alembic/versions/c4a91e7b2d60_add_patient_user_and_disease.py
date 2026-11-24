"""Add patient account association and disease."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "c4a91e7b2d60"
down_revision = "11b225ab693c"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    columns = {
        column["name"]
        for column in inspector.get_columns("patients")
    }

    if "user_id" not in columns:
        op.add_column(
            "patients",
            sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        )

    if "disease" not in columns:
        op.add_column(
            "patients",
            sa.Column("disease", sa.String(length=30), nullable=True),
        )

    inspector = sa.inspect(conn)
    foreign_keys = inspector.get_foreign_keys("patients")

    if not any(
        fk.get("constrained_columns") == ["user_id"]
        and fk.get("referred_table") == "users"
        for fk in foreign_keys
    ):
        op.create_foreign_key(
            "fk_patients_user_id_users",
            "patients",
            "users",
            ["user_id"],
            ["id"],
            ondelete="SET NULL",
        )

    inspector = sa.inspect(conn)
    unique_constraints = inspector.get_unique_constraints("patients")

    if not any(
        constraint.get("column_names") == ["user_id"]
        for constraint in unique_constraints
    ):
        op.create_unique_constraint(
            "uq_patients_user_id",
            "patients",
            ["user_id"],
        )


def downgrade():
    op.drop_constraint(
        "uq_patients_user_id",
        "patients",
        type_="unique",
    )
    op.drop_constraint(
        "fk_patients_user_id_users",
        "patients",
        type_="foreignkey",
    )
    op.drop_column("patients", "disease")
    op.drop_column("patients", "user_id")
