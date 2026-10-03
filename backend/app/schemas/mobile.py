from datetime import datetime

from pydantic import BaseModel, Field


class MobilePermissionFinding(BaseModel):
    permission: str
    category: str
    severity: str
    title: str
    description: str
    score: int
    rationale: str


class MobileScanResponse(BaseModel):
    scan_id: int
    filename: str
    package_name: str | None
    status: str
    risk_score: int | None
    risk_level: str | None
    confidence: int | None
    permissions: list[str] = Field(default_factory=list)
    findings: list[MobilePermissionFinding] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    evidence: dict = Field(default_factory=dict)
    created_at: datetime
    completed_at: datetime | None = None


class MobileScanSummary(BaseModel):
    scan_id: int
    filename: str
    package_name: str | None
    status: str
    risk_score: int | None
    risk_level: str | None
    confidence: int | None
    created_at: datetime
    completed_at: datetime | None = None


class MobileScanListResponse(BaseModel):
    total: int
    scans: list[MobileScanSummary]
