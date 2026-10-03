from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Scan(Base):
    __tablename__ = "scans"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    input_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True
    )

    input_content: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="PENDING",
        nullable=False,
        index=True
    )

    error_message: Mapped[str | None] = mapped_column(
    Text,
    nullable=True
)

    risk_score: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    risk_level: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
        index=True
    )

    threat_category: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True
    )

    confidence: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    # Detailed evidence from the real-time URL analysis pipeline.
    # Nullable to preserve compatibility with historical scans.
    analysis_details: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    verdict: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    user = relationship(
        "User",
        back_populates="scans"
    )

    indicators = relationship(
        "ThreatIndicator",
        back_populates="scan",
        cascade="all, delete-orphan"
    )