from app.intelligence.email_header_analyzer import analyze_email_headers


def test_clean_authenticated_headers():
    result = analyze_email_headers(
        """From: Security Team <security@example.com>
To: user@example.net
Message-ID: <abc@example.com>
Date: Thu, 1 Oct 2026 10:00:00 +0000
Return-Path: <bounce@example.com>
Received: from mail.example.com by mx.example.net
Authentication-Results: mx.example.net; spf=pass dkim=pass dmarc=pass
"""
    )
    assert result["risk_score"] == 0
    assert result["risk_level"] == "LOW"
    assert result["authentication"]["dmarc"] == "pass"


def test_reply_to_mismatch_is_flagged():
    result = analyze_email_headers(
        """From: Bank <alerts@bank.example>
Reply-To: attacker.example@gmail.com
Message-ID: <x@bank.example>
Authentication-Results: mx; spf=pass dkim=pass dmarc=pass
"""
    )
    assert any(f["code"] == "REPLY_TO_MISMATCH" for f in result["findings"])
    assert result["risk_score"] > 0


def test_authentication_failures_raise_risk():
    result = analyze_email_headers(
        """From: Account <alerts@example.com>
Received: from suspicious.example by mx.example
Authentication-Results: mx; spf=fail dkim=fail dmarc=fail
"""
    )
    assert result["risk_score"] >= 60
    assert result["risk_level"] in {"HIGH", "CRITICAL"}
