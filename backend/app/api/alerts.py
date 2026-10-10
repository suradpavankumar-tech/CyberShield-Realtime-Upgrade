from datetime import datetime, timezone
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.scan import Scan
from app.schemas.alert import (
    TestAlertRequest,
    TestAlertResponse,
    DispatchScanAlertRequest,
    AlertAuditLogResponse,
)
from app.intelligence.alert_dispatcher import (
    format_generic_webhook_payload,
    format_slack_payload,
    format_discord_payload,
    format_telegram_payload,
    send_http_webhook,
    send_telegram_alert,
    record_dispatched_alert,
    get_recent_dispatched_alerts,
)

router = APIRouter(prefix="/api/v1/alerts", tags=["Real-time Alert Dispatcher"])


@router.post("/test", response_model=TestAlertResponse)
def test_alert_channel(payload: TestAlertRequest):
    """
    Sends an immediate test SOC alert to Slack, Discord, Telegram, or Generic Webhook.
    """
    sample_scan_data = {
        "scan_id": 9999,
        "risk_level": payload.severity.upper(),
        "risk_score": 92 if payload.severity.upper() == "CRITICAL" else 75,
        "threat_category": "CREDENTIAL_HARVESTING_PHISH",
        "input_type": "URL",
        "target": payload.sample_target or "https://secure-sbi-portal.fraudulent-host.top/verify-kyc",
        "verdict": "Real-time SOC test verification triggered from CyberShield Command Center.",
        "confidence": 98,
        "indicators": [
            "Deceptive SSL certificate fingerprint",
            "Target brand impersonation: State Bank of India",
            "Urgency trigger: Account Suspension Warning",
        ],
    }

    channel = payload.channel_type.lower()
    destination = ""

    if channel == "telegram":
        token = payload.telegram_bot_token or ""
        chat_id = payload.telegram_chat_id or ""
        if not token or not chat_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Both telegram_bot_token and telegram_chat_id are required for Telegram alerts.",
            )
        destination = f"Telegram Chat: {chat_id}"
        res = send_telegram_alert(token, chat_id, sample_scan_data)
    else:
        url = (payload.webhook_url or "").strip()
        if not url:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A valid webhook_url is required for Slack, Discord, and Generic alerts.",
            )
        destination = url

        if channel == "slack":
            formatted_payload = format_slack_payload(sample_scan_data)
        elif channel == "discord":
            formatted_payload = format_discord_payload(sample_scan_data)
        else:
            channel = "generic"
            formatted_payload = format_generic_webhook_payload(sample_scan_data)

        res = send_http_webhook(url, formatted_payload)

    # Record to audit log
    record_dispatched_alert({
        "id": res["id"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "channel_type": channel.upper(),
        "destination": destination[:60],
        "severity": payload.severity.upper(),
        "status": "DELIVERED" if res["delivered"] else "FAILED",
        "status_code": res.get("status_code"),
        "latency_ms": res.get("latency_ms", 0.0),
        "message": res.get("message", ""),
    })

    return TestAlertResponse(
        id=res["id"],
        delivered=res["delivered"],
        channel_type=channel.upper(),
        destination=destination,
        status_code=res.get("status_code"),
        latency_ms=res.get("latency_ms", 0.0),
        mode=res.get("mode", "LIVE"),
        message=res.get("message", ""),
        payload=res.get("payload", {}),
    )


@router.post("/dispatch-scan")
def dispatch_scan_alert(payload: DispatchScanAlertRequest, db: Session = Depends(get_db)):
    """
    Broadcasts a real incident alert for an existing scan to the requested channel.
    """
    scan = db.get(Scan, payload.scan_id)
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan #{payload.scan_id} not found.",
        )

    scan_data = {
        "scan_id": scan.id,
        "risk_level": scan.risk_level or "HIGH",
        "risk_score": scan.risk_score or 70,
        "threat_category": scan.threat_category or "MALICIOUS_THREAT",
        "input_type": scan.input_type or "URL",
        "target": scan.input_content or "N/A",
        "verdict": scan.verdict or "Threat flagged by CyberShield SOC.",
        "confidence": scan.confidence or 90,
        "indicators": [ind.name for ind in scan.indicators] if hasattr(scan, "indicators") and scan.indicators else [],
    }

    channel = payload.channel_type.lower()
    destination = ""

    if channel == "telegram":
        token = payload.telegram_bot_token or ""
        chat_id = payload.telegram_chat_id or ""
        if not token or not chat_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Both telegram_bot_token and telegram_chat_id are required for Telegram alerts.",
            )
        destination = f"Telegram Chat: {chat_id}"
        res = send_telegram_alert(token, chat_id, scan_data)
    else:
        url = (payload.webhook_url or "").strip()
        if not url:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A valid webhook_url is required for Slack, Discord, and Generic alerts.",
            )
        destination = url

        if channel == "slack":
            formatted_payload = format_slack_payload(scan_data)
        elif channel == "discord":
            formatted_payload = format_discord_payload(scan_data)
        else:
            channel = "generic"
            formatted_payload = format_generic_webhook_payload(scan_data)

        res = send_http_webhook(url, formatted_payload)

    record_dispatched_alert({
        "id": res["id"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "channel_type": channel.upper(),
        "destination": destination[:60],
        "severity": (scan.risk_level or "HIGH").upper(),
        "status": "DELIVERED" if res["delivered"] else "FAILED",
        "status_code": res.get("status_code"),
        "latency_ms": res.get("latency_ms", 0.0),
        "message": res.get("message", ""),
    })

    return {
        "success": res["delivered"],
        "scan_id": scan.id,
        "channel_type": channel.upper(),
        "destination": destination,
        "status_code": res.get("status_code"),
        "latency_ms": res.get("latency_ms", 0.0),
        "message": res.get("message", ""),
    }


@router.get("/recent", response_model=AlertAuditLogResponse)
def get_recent_alerts():
    """
    Returns the last 50 dispatched alert audit log entries.
    """
    logs = get_recent_dispatched_alerts()
    return AlertAuditLogResponse(total=len(logs), logs=logs)


@router.get("/templates")
def get_channel_templates():
    """
    Returns sample JSON / message structures for Slack, Discord, Telegram, and Generic Webhooks.
    """
    sample = {
        "scan_id": 1042,
        "risk_level": "CRITICAL",
        "risk_score": 96,
        "threat_category": "DIGITAL_ARREST_EXTORTION",
        "input_type": "MESSAGE",
        "target": "URGENT NOTICE: CBI Delhi Cyber Cell has registered FIR #402/2026...",
        "verdict": "Coercive Impersonation & Digital Arrest Scam detected.",
        "confidence": 99,
        "indicators": ["Fake police authority claim", "Immediate fund escrow demand", "Video call isolation"],
    }

    return {
        "generic": format_generic_webhook_payload(sample),
        "slack": format_slack_payload(sample),
        "discord": format_discord_payload(sample),
        "telegram": format_telegram_payload(sample, "@SOC_Alerts_Channel"),
    }
