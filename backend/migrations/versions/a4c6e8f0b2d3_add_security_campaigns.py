"""add security awareness campaigns
Revision ID: a4c6e8f0b2d3
Revises: 9b2c4d6e8f31
"""
from alembic import op
import sqlalchemy as sa

revision = "a4c6e8f0b2d3"
down_revision = "9b2c4d6e8f31"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        "security_campaigns",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("template_name", sa.String(80), nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="DRAFT"),
        sa.Column("training_topic", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_security_campaigns_id", "security_campaigns", ["id"])
    op.create_index("ix_security_campaigns_user_id", "security_campaigns", ["user_id"])
    op.create_index("ix_security_campaigns_status", "security_campaigns", ["status"])
    op.create_index("ix_security_campaigns_created_at", "security_campaigns", ["created_at"])

    op.create_table(
        "campaign_recipients",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("campaign_id", sa.Integer(), sa.ForeignKey("security_campaigns.id", ondelete="CASCADE"), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("display_name", sa.String(120), nullable=True),
        sa.Column("tracking_token", sa.String(64), unique=True, nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="PENDING"),
        sa.Column("event_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("training_completed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_campaign_recipients_id", "campaign_recipients", ["id"])
    op.create_index("ix_campaign_recipients_campaign_id", "campaign_recipients", ["campaign_id"])
    op.create_index("ix_campaign_recipients_tracking_token", "campaign_recipients", ["tracking_token"])
    op.create_index("ix_campaign_recipients_status", "campaign_recipients", ["status"])

    op.create_table(
        "campaign_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("recipient_id", sa.Integer(), sa.ForeignKey("campaign_recipients.id", ondelete="CASCADE"), nullable=False),
        sa.Column("event_type", sa.String(30), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_campaign_events_id", "campaign_events", ["id"])
    op.create_index("ix_campaign_events_recipient_id", "campaign_events", ["recipient_id"])
    op.create_index("ix_campaign_events_event_type", "campaign_events", ["event_type"])
    op.create_index("ix_campaign_events_occurred_at", "campaign_events", ["occurred_at"])

def downgrade():
    op.drop_index("ix_campaign_events_occurred_at", table_name="campaign_events")
    op.drop_index("ix_campaign_events_event_type", table_name="campaign_events")
    op.drop_index("ix_campaign_events_recipient_id", table_name="campaign_events")
    op.drop_index("ix_campaign_events_id", table_name="campaign_events")
    op.drop_table("campaign_events")
    op.drop_index("ix_campaign_recipients_status", table_name="campaign_recipients")
    op.drop_index("ix_campaign_recipients_tracking_token", table_name="campaign_recipients")
    op.drop_index("ix_campaign_recipients_campaign_id", table_name="campaign_recipients")
    op.drop_index("ix_campaign_recipients_id", table_name="campaign_recipients")
    op.drop_table("campaign_recipients")
    op.drop_index("ix_security_campaigns_created_at", table_name="security_campaigns")
    op.drop_index("ix_security_campaigns_status", table_name="security_campaigns")
    op.drop_index("ix_security_campaigns_user_id", table_name="security_campaigns")
    op.drop_index("ix_security_campaigns_id", table_name="security_campaigns")
    op.drop_table("security_campaigns")
