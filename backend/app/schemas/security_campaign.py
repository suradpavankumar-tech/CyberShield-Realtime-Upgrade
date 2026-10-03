from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field, field_validator


class CampaignStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"


class CampaignEventType(str, Enum):
    DELIVERED = "DELIVERED"
    OPENED = "OPENED"
    CLICKED = "CLICKED"
    REPORTED = "REPORTED"
    TRAINING_STARTED = "TRAINING_STARTED"
    TRAINING_COMPLETED = "TRAINING_COMPLETED"


class CampaignRecipientCreate(BaseModel):
    email: EmailStr
    display_name: str | None = Field(default=None, max_length=120)


class CampaignCreate(BaseModel):
    name: str = Field(min_length=3, max_length=120)
    description: str | None = Field(default=None, max_length=1000)
    template_name: str = Field(min_length=2, max_length=80)
    training_topic: str = Field(min_length=2, max_length=100)
    recipients: list[CampaignRecipientCreate] = Field(min_length=1, max_length=500)

    @field_validator("name", "template_name", "training_topic")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()


class CampaignEventRequest(BaseModel):
    event_type: CampaignEventType
    metadata: dict = Field(default_factory=dict)


class CampaignRecipientResponse(BaseModel):
    recipient_id: int
    email: EmailStr
    display_name: str | None
    status: str
    event_count: int
    training_completed: bool
    created_at: datetime


class CampaignMetrics(BaseModel):
    recipients: int
    delivered: int
    opened: int
    clicked: int
    reported: int
    training_started: int
    training_completed: int
    click_rate: float
    report_rate: float
    training_completion_rate: float


class CampaignResponse(BaseModel):
    campaign_id: int
    name: str
    description: str | None
    template_name: str
    training_topic: str
    status: str
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None
    metrics: CampaignMetrics


class CampaignListResponse(BaseModel):
    total: int
    campaigns: list[CampaignResponse]


class CampaignEventResponse(BaseModel):
    event_id: int
    event_type: str
    occurred_at: datetime
