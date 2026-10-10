import json
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

# In-memory bounded audit log of recent dispatched alerts (last 50 items)
DISPATCHED_ALERTS_LOG: List[Dict[str, Any]] = []
MAX_AUDIT_LOG_SIZE = 50


def record_dispatched_alert(record: Dict[str, Any]) -> None:
    global DISPATCHED_ALERTS_LOG
    DISPATCHED_ALERTS_LOG.insert(0, record)
    if len(DISPATCHED_ALERTS_LOG) > MAX_AUDIT_LOG_SIZE:
        DISPATCHED_ALERTS_LOG = DISPATCHED_ALERTS_LOG[:MAX_AUDIT_LOG_SIZE]


def get_recent_dispatched_alerts() -> List[Dict[str, Any]]:
    return list(DISPATCHED_ALERTS_LOG)


def format_generic_webhook_payload(scan_data: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "event": "CYBERSHIELD_THREAT_DETECTED",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "scan_id": scan_data.get("scan_id"),
        "severity": scan_data.get("risk_level", "UNKNOWN").upper(),
        "risk_score": scan_data.get("risk_score", 0),
        "threat_category": scan_data.get("threat_category", "UNCLASSIFIED"),
        "input_type": scan_data.get("input_type", "URL"),
        "target": scan_data.get("target") or scan_data.get("input_content", "N/A"),
        "verdict": scan_data.get("verdict", "Threat activity detected by CyberShield SOC."),
        "confidence": scan_data.get("confidence", 85),
        "indicators": scan_data.get("indicators", []),
        "dashboard_url": f"https://cybershield.security/scans/{scan_data.get('scan_id', 1)}",
    }


def format_slack_payload(scan_data: Dict[str, Any]) -> Dict[str, Any]:
    severity = str(scan_data.get("risk_level", "UNKNOWN")).upper()
    color_map = {
        "CRITICAL": "#ef4444",
        "HIGH": "#f97316",
        "MEDIUM": "#eab308",
        "LOW": "#22c55e",
    }
    color = color_map.get(severity, "#6b7280")
    risk_score = scan_data.get("risk_score", 0)
    category = scan_data.get("threat_category", "SUSPICIOUS_ACTIVITY")
    target = scan_data.get("target") or scan_data.get("input_content", "N/A")
    verdict = scan_data.get("verdict", "Automated anomaly flagged by CyberShield AI Engine.")

    return {
        "text": f"🚨 [CyberShield Alert] {severity} Threat Detected (Score: {risk_score}/100)",
        "attachments": [
            {
                "color": color,
                "blocks": [
                    {
                        "type": "header",
                        "text": {
                            "type": "plain_text",
                            "text": f"🚨 CyberShield Threat Alert: {severity}",
                            "emoji": True,
                        },
                    },
                    {
                        "type": "section",
                        "fields": [
                            {
                                "type": "mrkdwn",
                                "text": f"*Severity:*\n`{severity}`",
                            },
                            {
                                "type": "mrkdwn",
                                "text": f"*Risk Score:*\n`{risk_score} / 100`",
                            },
                            {
                                "type": "mrkdwn",
                                "text": f"*Category:*\n`{category}`",
                            },
                            {
                                "type": "mrkdwn",
                                "text": f"*Input Type:*\n`{scan_data.get('input_type', 'URL')}`",
                            },
                        ],
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*Target / Artifact:*\n```{target[:160]}```\n*Analysis Verdict:*\n{verdict}",
                        },
                    },
                    {
                        "type": "context",
                        "elements": [
                            {
                                "type": "mrkdwn",
                                "text": f"🛡️ *CyberShield Enterprise SOC* | Triggered: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}",
                            }
                        ],
                    },
                ],
            }
        ],
    }


def format_discord_payload(scan_data: Dict[str, Any]) -> Dict[str, Any]:
    severity = str(scan_data.get("risk_level", "UNKNOWN")).upper()
    color_map = {
        "CRITICAL": 15671844,  # Red
        "HIGH": 16348182,      # Orange
        "MEDIUM": 15381256,    # Yellow
        "LOW": 2278750,        # Green
    }
    color = color_map.get(severity, 7040112)
    risk_score = scan_data.get("risk_score", 0)
    category = scan_data.get("threat_category", "SUSPICIOUS_ACTIVITY")
    target = scan_data.get("target") or scan_data.get("input_content", "N/A")

    return {
        "content": f"🚨 **CyberShield Threat Alert: [{severity}]**",
        "embeds": [
            {
                "title": f"🛡️ High-Risk Indicator Detected: {category}",
                "description": scan_data.get("verdict", "Threat vector intercepted by CyberShield Engine."),
                "color": color,
                "fields": [
                    {"name": "Risk Score", "value": f"**{risk_score} / 100**", "inline": True},
                    {"name": "Severity", "value": f"`{severity}`", "inline": True},
                    {"name": "Type", "value": f"{scan_data.get('input_type', 'URL')}", "inline": True},
                    {"name": "Target Artifact", "value": f"```{target[:200]}```", "inline": False},
                ],
                "footer": {"text": "CyberShield SOC Real-time Defense Gateway"},
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        ],
    }


def format_telegram_payload(scan_data: Dict[str, Any], chat_id: str) -> Dict[str, Any]:
    severity = str(scan_data.get("risk_level", "UNKNOWN")).upper()
    risk_score = scan_data.get("risk_score", 0)
    category = scan_data.get("threat_category", "SUSPICIOUS_ACTIVITY")
    target = scan_data.get("target") or scan_data.get("input_content", "N/A")
    verdict = scan_data.get("verdict", "Flagged by CyberShield Real-time Analysis.")

    message_text = (
        f"🚨 *CYBERSHIELD SOC THREAT ALERT*\n\n"
        f"• *Severity:* `{severity}`\n"
        f"• *Risk Score:* *{risk_score}/100*\n"
        f"• *Category:* `{category}`\n"
        f"• *Input Vector:* `{scan_data.get('input_type', 'URL')}`\n\n"
        f"🎯 *Target Artifact:*\n`{target[:160]}`\n\n"
        f"🔍 *Verdict:*\n{verdict}\n\n"
        f"⏱️ _Timestamp: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}_"
    )

    return {
        "chat_id": chat_id,
        "text": message_text,
        "parse_mode": "Markdown",
    }


def send_http_webhook(
    url: str,
    payload: Dict[str, Any],
    timeout: float = 4.0,
) -> Dict[str, Any]:
    """
    Sends an HTTP POST webhook request using Python's standard library urllib.
    Supports dry-run simulation for loopback/test URLs to prevent network stalls.
    """
    start_time = time.time()
    alert_id = f"alert-{uuid.uuid4().hex[:8]}"

    # Check for test / dry-run domains
    parsed_url = url.strip()
    if (
        "example.com" in parsed_url
        or "mock" in parsed_url
        or "test-webhook" in parsed_url
        or "localhost.localdomain" in parsed_url
    ):
        elapsed_ms = round((time.time() - start_time) * 1000 + 45.0, 2)
        result = {
            "id": alert_id,
            "delivered": True,
            "status_code": 200,
            "latency_ms": elapsed_ms,
            "mode": "SIMULATED_TEST",
            "message": "Webhook delivery simulated successfully (Test/Sandbox Endpoint).",
            "payload": payload,
        }
        return result

    try:
        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            parsed_url,
            data=data_bytes,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "CyberShield-SOC-Webhook/2.0",
            },
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=timeout) as response:
            status_code = response.getcode()
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            result = {
                "id": alert_id,
                "delivered": True,
                "status_code": status_code,
                "latency_ms": elapsed_ms,
                "mode": "LIVE_HTTP",
                "message": f"Webhook dispatched successfully (HTTP {status_code}).",
                "payload": payload,
            }
            return result

    except urllib.error.HTTPError as e:
        elapsed_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "id": alert_id,
            "delivered": False,
            "status_code": e.code,
            "latency_ms": elapsed_ms,
            "mode": "LIVE_HTTP",
            "message": f"Webhook returned HTTP {e.code}: {e.reason}",
            "payload": payload,
        }
    except Exception as e:
        elapsed_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "id": alert_id,
            "delivered": False,
            "status_code": 0,
            "latency_ms": elapsed_ms,
            "mode": "LIVE_HTTP",
            "message": f"Delivery failure: {str(e)}",
            "payload": payload,
        }


def send_telegram_alert(
    bot_token: str,
    chat_id: str,
    scan_data: Dict[str, Any],
    timeout: float = 4.0,
) -> Dict[str, Any]:
    """
    Sends an alert directly to Telegram Bot API (or simulates if bot_token is a mock).
    """
    clean_token = bot_token.strip()
    clean_chat = chat_id.strip()

    if not clean_token or not clean_chat:
        return {
            "id": f"alert-{uuid.uuid4().hex[:8]}",
            "delivered": False,
            "status_code": 400,
            "latency_ms": 0.0,
            "mode": "VALIDATION_ERROR",
            "message": "Both Telegram Bot Token and Chat ID are required.",
            "payload": {},
        }

    payload = format_telegram_payload(scan_data, clean_chat)

    # If mock token
    if "test" in clean_token.lower() or "mock" in clean_token.lower() or clean_token.startswith("bot000"):
        return {
            "id": f"alert-{uuid.uuid4().hex[:8]}",
            "delivered": True,
            "status_code": 200,
            "latency_ms": 62.5,
            "mode": "SIMULATED_TEST",
            "message": f"Telegram Bot dispatch simulated successfully for chat `{clean_chat}`.",
            "payload": payload,
        }

    tg_url = f"https://api.telegram.org/bot{clean_token}/sendMessage"
    return send_http_webhook(tg_url, payload, timeout=timeout)
