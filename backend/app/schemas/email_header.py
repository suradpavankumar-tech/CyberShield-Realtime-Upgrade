from datetime import datetime

from pydantic import BaseModel, Field


class EmailHeaderScanRequest(BaseModel):
    raw_headers: str = Field(min_length=1, max_length=50000)


class EmailHeaderFinding(BaseModel):
    code: str
    severity: str
    title: str
    description: str
    evidence: str | None = None
    score: int = 0


class EmailHeaderScanResponse(BaseModel):
    scan_id: int
    status: str
    risk_score: int | None
    risk_level: str | None
    confidence: int | None
    threat_category: str | None
    headers: dict[str, str | list[str]]
    authentication: dict[str, str | None]
    findings: list[EmailHeaderFinding] = Field(default_factory=list)
    evidence: dict
    recommendations: list[str] = Field(default_factory=list)
    created_at: datetime
    completed_at: datetime | None = None


class EmailHeaderScanSummary(BaseModel):
    scan_id: int
    status: str
    risk_score: int | None
    risk_level: str | None
    threat_category: str | None
    confidence: int | None
    created_at: datetime
    completed_at: datetime | None = None


class EmailHeaderScanListResponse(BaseModel):
    total: int
    scans: list[EmailHeaderScanSummary]
