"""add jour mesure and daily unique constraint

Revision ID: 50d4e9f4078c
Revises: 0811b953c602
Create Date: 2026-11-12 20:57:27.647554

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '50d4e9f4078c'
down_revision: Union[str, Sequence[str], None] = '0811b953c602'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None



def upgrade() -> None:
    """Upgrade schema."""

    # Ajouter le jour local de la mesure
    op.add_column(
        "mesures",
        sa.Column("jour_mesure", sa.Date(), nullable=False),
    )

    # Empêcher deux mesures du même type pour un patient le même jour
    op.create_unique_constraint(
        "uq_mesure_patient_type_jour",
        "mesures",
        ["patient_id", "type_mesure_id", "jour_mesure"],
    )


def downgrade() -> None:
    """Downgrade schema."""

    # Supprimer d'abord la contrainte d'unicité
    op.drop_constraint(
        "uq_mesure_patient_type_jour",
        "mesures",
        type_="unique",
    )

    # Supprimer ensuite la colonne
    op.drop_column("mesures", "jour_mesure")
