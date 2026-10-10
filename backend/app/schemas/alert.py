from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TestAlertRequest(BaseModel):
    channel_type: str = Field("generic", description="generic, slack, discord, or telegram")
    webhook_url: Optional[str] = Field(None, description="Target Webhook URL for generic/slack/discord")
    telegram_bot_token: Optional[str] = Field(None, description="Telegram Bot Token")
    telegram_chat_id: Optional[str] = Field(None, description="Telegram Chat ID or Channel Handle")
    severity: str = Field("CRITICAL", description="Test threat severity level")
    sample_target: Optional[str] = Field(
        "https://secure-sbi-portal.fraudulent-host.top/verify-kyc",
        description="Sample URL or message snippet for simulation",
    )


class TestAlertResponse(BaseModel):
    id: str
    delivered: bool
    channel_type: str
    destination: str
    status_code: Optional[int] = None
    latency_ms: float
    mode: str
    message: str
    payload: Dict[str, Any]


class DispatchScanAlertRequest(BaseModel):
    scan_id: int
    channel_type: str = Field("generic", description="generic, slack, discord, or telegram")
    webhook_url: Optional[str] = None
    telegram_bot_token: Optional[str] = None
    telegram_chat_id: Optional[str] = None


class AlertAuditLogItem(BaseModel):
    id: str
    timestamp: str
    channel_type: str
    destination: str
    severity: str
    status: str
    status_code: Optional[int] = None
    latency_ms: float
    message: str


class AlertAuditLogResponse(BaseModel):
    total: int
    logs: List[Dict[str, Any]]
