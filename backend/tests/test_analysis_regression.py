import pytest

from ml.nlp.analyzer import analyze_message
from ml.email.analyzer import analyze_email


def assert_valid_email_result(result):
    """Validate the EMAIL analyzer contract."""

    assert isinstance(result, dict)

    assert result["risk_level"] in {"LOW", "MEDIUM", "HIGH"}

    assert 0 <= result["confidence"] <= 100

    assert isinstance(result["indicators"], list)


def test_benign_message_remains_low_risk():
    message = (
        "Your order has been delivered successfully. "
        "Thank you for shopping with us."
    )

    result = analyze_message(message)

    assert 0 <= result["risk_score"] <= 100
    assert result["risk_level"] == "LOW"


def test_banking_scam_message_is_high_risk():
    message = (
        "URGENT! Your bank account will be permanently "
        "blocked today. Verify your KYC immediately "
        "and confirm your OTP."
    )

    result = analyze_message(message)

    assert 0 <= result["risk_score"] <= 100
    assert result["risk_level"] == "HIGH"
    assert result["scam_category"] == "BANKING_SCAM"
    assert result["category_confidence"] >= 0


def test_benign_email_remains_low_risk():
    email = """\
From: shop@example.com
To: user@example.com
Subject: Order delivered

Your order has been delivered successfully.
Thank you for shopping with us.
"""

    result = analyze_email(email)

    assert_valid_email_result(result)

    assert result["risk_level"] == "LOW"


def test_credential_phishing_email_is_high_risk():
    email = """\
From: security@example.com
To: user@example.com
Subject: Urgent Account Verification Required

Your bank account will be suspended today unless
you verify your account immediately.

Click the link below and enter your username,
password and OTP to prevent the suspension.

This is an urgent security notice.
"""

    result = analyze_email(email)

    assert_valid_email_result(result)

    assert result["risk_level"] == "HIGH"
    assert result["threat_category"] == "CREDENTIAL_PHISHING"


def test_empty_message_is_rejected():
    with pytest.raises(ValueError):
        analyze_message("")


def test_empty_email_is_rejected():
    with pytest.raises(ValueError):
        analyze_email("")


def test_digital_arrest_scam_is_high_risk_and_explainable():
    message = (
        "CBI Cyber Crime Cell notice: An arrest warrant has been issued in your name. "
        "You are placed under digital arrest. Connect to Skype video call immediately "
        "or police will reach your house."
    )
    result = analyze_message(message)
    assert result["risk_level"] == "HIGH"
    assert result["scam_category"] == "DIGITAL_ARREST_SCAM"
    assert "explainable_phrases" in result
    assert len(result["explainable_phrases"]) > 0
    # verify at least one explainable phrase triggered
    phrases = [ep["phrase"] for ep in result["explainable_phrases"]]
    assert any("digital arrest" in p.lower() or "arrest warrant" in p.lower() for p in phrases)


def test_electricity_bill_scam_is_high_risk_and_explainable():
    message = (
        "Dear consumer, your electricity power will be disconnected tonight at 9:30 PM "
        "because previous month bill was not updated. Immediately call electricity officer at 9876543210."
    )
    result = analyze_message(message)
    assert result["risk_level"] == "HIGH"
    assert result["scam_category"] == "ELECTRICITY_BILL_SCAM"
    assert len(result["explainable_phrases"]) > 0
    assert any("electricity" in ep["explanation"].lower() or "power" in ep["phrase"].lower() for ep in result["explainable_phrases"])


def test_upi_collect_request_scam():
    message = (
        "You have won cash prize of Rs 50,000! Enter your UPI PIN in Google Pay to receive money in your account."
    )
    result = analyze_message(message)
    assert result["risk_level"] == "HIGH"
    assert result["scam_category"] in {"UPI_SCAM", "LOTTERY_SCAM"}
    assert len(result["explainable_phrases"]) > 0