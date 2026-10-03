"""add live analysis evidence fields

Revision ID: 3a4c9d2e7b11
Revises: f19df689ebd6
"""
from alembic import op
import sqlalchemy as sa

revision = "3a4c9d2e7b11"
down_revision = "f19df689ebd6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("scans", sa.Column("analysis_details", sa.JSON(), nullable=True))
    op.add_column("scans", sa.Column("verdict", sa.String(length=120), nullable=True))


def downgrade() -> None:
    op.drop_column("scans", "verdict")
    op.drop_column("scans", "analysis_details")
