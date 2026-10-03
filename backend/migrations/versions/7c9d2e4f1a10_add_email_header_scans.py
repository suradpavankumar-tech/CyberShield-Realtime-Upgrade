"""add email header analysis scans

Revision ID: 7c9d2e4f1a10
Revises: 3a4c9d2e7b11
"""

from alembic import op
import sqlalchemy as sa


revision = "7c9d2e4f1a10"
down_revision = "3a4c9d2e7b11"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "email_header_scans",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("raw_headers", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="COMPLETED"),
        sa.Column("risk_score", sa.Integer(), nullable=True),
        sa.Column("risk_level", sa.String(length=20), nullable=True),
        sa.Column("confidence", sa.Integer(), nullable=True),
        sa.Column("threat_category", sa.String(length=100), nullable=True),
        sa.Column("findings", sa.JSON(), nullable=True),
        sa.Column("evidence", sa.JSON(), nullable=True),
        sa.Column("recommendations", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_email_header_scans_id", "email_header_scans", ["id"])
    op.create_index("ix_email_header_scans_user_id", "email_header_scans", ["user_id"])
    op.create_index("ix_email_header_scans_status", "email_header_scans", ["status"])
    op.create_index("ix_email_header_scans_created_at", "email_header_scans", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_email_header_scans_created_at", table_name="email_header_scans")
    op.drop_index("ix_email_header_scans_status", table_name="email_header_scans")
    op.drop_index("ix_email_header_scans_user_id", table_name="email_header_scans")
    op.drop_index("ix_email_header_scans_id", table_name="email_header_scans")
    op.drop_table("email_header_scans")
