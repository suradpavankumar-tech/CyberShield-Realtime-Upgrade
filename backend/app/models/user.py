from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(30), default="USER", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    scans = relationship("Scan", back_populates="user", cascade="all, delete-orphan")
    email_header_scans = relationship("EmailHeaderScan", back_populates="user", cascade="all, delete-orphan")
    mobile_scans = relationship("MobileScan", back_populates="user", cascade="all, delete-orphan")
    vulnerability_scans = relationship("VulnerabilityScan", back_populates="user", cascade="all, delete-orphan")
    security_campaigns = relationship("SecurityCampaign", back_populates="user", cascade="all, delete-orphan")
