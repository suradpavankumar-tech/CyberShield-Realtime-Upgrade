from sqlalchemy import (
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class ThreatIndicator(Base):
    __tablename__ = "threat_indicators"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    scan_id: Mapped[int] = mapped_column(
        ForeignKey("scans.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    indicator_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=True
    )

    severity: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    score: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    source: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    scan = relationship(
        "Scan",
        back_populates="indicators"
    )