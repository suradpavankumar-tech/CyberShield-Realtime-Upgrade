from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class InputType(str, Enum):
    URL = "URL"
    MESSAGE = "MESSAGE"
    EMAIL = "EMAIL"


class AnalysisRequest(BaseModel):
    input_type: InputType
    content: str = Field(
        min_length=1,
        max_length=20000
    )


class ThreatIndicatorResponse(BaseModel):
    id: int
    indicator_type: str
    name: str
    description: str | None = None
    severity: str
    score: int
    source: str


class AnalysisResponse(BaseModel):
    scan_id: int
    input_type: str
    status: str

    risk_score: int | None
    risk_level: str | None
    threat_category: str | None
    confidence: int | None

    error_message: str | None = None

    created_at: datetime
    completed_at: datetime | None = None
    verdict: str | None = None
    analysis_details: dict | None = None

    indicators: list[ThreatIndicatorResponse] = Field(
        default_factory=list
    )


class ScanSummaryResponse(BaseModel):
    scan_id: int
    input_type: str
    status: str

    risk_score: int | None
    risk_level: str | None
    threat_category: str | None
    confidence: int | None

    created_at: datetime
    completed_at: datetime | None = None


class ScanListResponse(BaseModel):
    total: int
    scans: list[ScanSummaryResponse]


class InputTypeDistributionResponse(BaseModel):
    URL: int = 0
    MESSAGE: int = 0
    EMAIL: int = 0


class ThreatCategoryCountResponse(BaseModel):
    category: str
    count: int


class DashboardResponse(BaseModel):
    total_scans: int
    completed_scans: int
    failed_scans: int
    pending_scans: int

    high_risk: int
    medium_risk: int
    low_risk: int

    suspicious_scans: int
    legitimate_scans: int

    average_risk_score: float | None

    input_type_distribution: InputTypeDistributionResponse

    threat_categories: list[
        ThreatCategoryCountResponse
    ]

    recent_scans: list[ScanSummaryResponse]