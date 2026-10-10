from fastapi.testclient import TestClient

from app.main import app
from app.intelligence.alert_dispatcher import (
    format_generic_webhook_payload,
    format_slack_payload,
    format_discord_payload,
    format_telegram_payload,
    send_http_webhook,
    send_telegram_alert,
    get_recent_dispatched_alerts,
)

client = TestClient(app)


def test_format_payloads_contract():
    scan = {
        "scan_id": 101,
        "risk_level": "CRITICAL",
        "risk_score": 94,
        "threat_category": "CREDENTIAL_HARVESTING",
        "input_type": "URL",
        "target": "https://malicious-login-portal.example.com",
        "verdict": "Confirmed phishing threat.",
    }

    # Generic JSON Webhook
    generic = format_generic_webhook_payload(scan)
    assert generic["event"] == "CYBERSHIELD_THREAT_DETECTED"
    assert generic["severity"] == "CRITICAL"
    assert generic["risk_score"] == 94
    assert generic["target"] == scan["target"]

    # Slack Webhook
    slack = format_slack_payload(scan)
    assert "attachments" in slack
    assert slack["attachments"][0]["color"] == "#ef4444"
    assert len(slack["attachments"][0]["blocks"]) >= 3

    # Discord Webhook
    discord = format_discord_payload(scan)
    assert "embeds" in discord
    assert discord["embeds"][0]["color"] == 15671844
    assert len(discord["embeds"][0]["fields"]) >= 4

    # Telegram Bot
    telegram = format_telegram_payload(scan, "@soc_channel")
    assert telegram["chat_id"] == "@soc_channel"
    assert "CRITICAL" in telegram["text"]
    assert "94/100" in telegram["text"]


def test_simulated_webhook_dispatch():
    payload = {"test": True}
    res = send_http_webhook("https://test-webhook.example.com/alerts", payload)
    assert res["delivered"] is True
    assert res["status_code"] == 200
    assert res["mode"] == "SIMULATED_TEST"
    assert res["latency_ms"] >= 0


def test_simulated_telegram_dispatch():
    scan = {
        "risk_level": "HIGH",
        "risk_score": 75,
        "target": "Suspicious SMS text",
    }
    res = send_telegram_alert("bot000_mock_token", "12345678", scan)
    assert res["delivered"] is True
    assert res["status_code"] == 200
    assert res["mode"] == "SIMULATED_TEST"


def test_api_test_webhook_endpoint_generic():
    req = {
        "channel_type": "generic",
        "webhook_url": "https://test-webhook.example.com/api",
        "severity": "CRITICAL",
        "sample_target": "https://fake-sbi-portal.xyz/login",
    }
    response = client.post("/api/v1/alerts/test", json=req)
    assert response.status_code == 200
    data = response.json()
    assert data["delivered"] is True
    assert data["channel_type"] == "GENERIC"
    assert data["status_code"] == 200


def test_api_test_webhook_endpoint_slack():
    req = {
        "channel_type": "slack",
        "webhook_url": "https://test-webhook.example.com/slack",
        "severity": "HIGH",
    }
    response = client.post("/api/v1/alerts/test", json=req)
    assert response.status_code == 200
    data = response.json()
    assert data["channel_type"] == "SLACK"
    assert data["delivered"] is True


def test_api_test_webhook_endpoint_telegram():
    req = {
        "channel_type": "telegram",
        "telegram_bot_token": "bot000_mock_token_123",
        "telegram_chat_id": "@SOC_Test_Channel",
        "severity": "CRITICAL",
    }
    response = client.post("/api/v1/alerts/test", json=req)
    assert response.status_code == 200
    data = response.json()
    assert data["channel_type"] == "TELEGRAM"
    assert data["delivered"] is True


def test_api_test_webhook_missing_url():
    req = {
        "channel_type": "generic",
        "webhook_url": "",
    }
    response = client.post("/api/v1/alerts/test", json=req)
    assert response.status_code == 400


def test_api_recent_alerts_and_templates():
    # Audit log
    res_recent = client.get("/api/v1/alerts/recent")
    assert res_recent.status_code == 200
    data_recent = res_recent.json()
    assert "total" in data_recent
    assert "logs" in data_recent
    assert data_recent["total"] >= 1

    # Templates
    res_templates = client.get("/api/v1/alerts/templates")
    assert res_templates.status_code == 200
    data_templates = res_templates.json()
    assert "generic" in data_templates
    assert "slack" in data_templates
    assert "discord" in data_templates
    assert "telegram" in data_templates
