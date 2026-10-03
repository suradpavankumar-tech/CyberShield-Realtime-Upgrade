"""add mobile privacy scans
Revision ID: 8e1f3a5c7b20
Revises: 7c9d2e4f1a10
"""
from alembic import op
import sqlalchemy as sa
revision="8e1f3a5c7b20"
down_revision="7c9d2e4f1a10"
branch_labels=None
depends_on=None

def upgrade():
    op.create_table(
        "mobile_scans",
        sa.Column("id",sa.Integer(),primary_key=True),
        sa.Column("user_id",sa.Integer(),sa.ForeignKey("users.id",ondelete="CASCADE"),nullable=False),
        sa.Column("filename",sa.String(255),nullable=False),
        sa.Column("package_name",sa.String(255),nullable=True),
        sa.Column("status",sa.String(30),nullable=False,server_default="COMPLETED"),
        sa.Column("risk_score",sa.Integer(),nullable=True),
        sa.Column("risk_level",sa.String(20),nullable=True),
        sa.Column("confidence",sa.Integer(),nullable=True),
        sa.Column("permissions",sa.JSON(),nullable=True),
        sa.Column("findings",sa.JSON(),nullable=True),
        sa.Column("recommendations",sa.JSON(),nullable=True),
        sa.Column("evidence",sa.JSON(),nullable=True),
        sa.Column("created_at",sa.DateTime(timezone=True),nullable=False),
        sa.Column("completed_at",sa.DateTime(timezone=True),nullable=True),
    )
    op.create_index("ix_mobile_scans_id","mobile_scans",["id"])
    op.create_index("ix_mobile_scans_user_id","mobile_scans",["user_id"])
    op.create_index("ix_mobile_scans_status","mobile_scans",["status"])
    op.create_index("ix_mobile_scans_created_at","mobile_scans",["created_at"])

def downgrade():
    op.drop_index("ix_mobile_scans_created_at",table_name="mobile_scans")
    op.drop_index("ix_mobile_scans_status",table_name="mobile_scans")
    op.drop_index("ix_mobile_scans_user_id",table_name="mobile_scans")
    op.drop_index("ix_mobile_scans_id",table_name="mobile_scans")
    op.drop_table("mobile_scans")
