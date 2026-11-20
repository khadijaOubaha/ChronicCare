
"""add patient foreign key to mesures

Revision ID: 0811b953c602
Revises: cb9d5ee3e6ef
"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '0811b953c602'
down_revision: Union[str, Sequence[str], None] = 'cb9d5ee3e6ef'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add foreign key from mesures to patients."""
    op.create_foreign_key(
        'fk_mesures_patient_id_patients',
        'mesures',
        'patients',
        ['patient_id'],
        ['id'],
        ondelete='RESTRICT'
    )


def downgrade() -> None:
    """Remove foreign key from mesures to patients."""
    op.drop_constraint(
        'fk_mesures_patient_id_patients',
        'mesures',
        type_='foreignkey'
    )
