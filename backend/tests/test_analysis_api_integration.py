import os

import pytest
from fastapi.testclient import TestClient

from app.main import app


BASE_URL = "/api/v1"

TEST_EMAIL = os.getenv(
    "CYBERSHIELD_TEST_EMAIL",
    "control@example.com",
)

TEST_PASSWORD = os.getenv(
    "CYBERSHIELD_TEST_PASSWORD",
)


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="module")
def auth_headers(client):
    if not TEST_PASSWORD:
        pytest.skip(
            "Set CYBERSHIELD_TEST_PASSWORD before running API integration tests."
        )

    response = client.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
        },
    )

    assert response.status_code == 200, (
        "Login failed: "
        f"{response.status_code} {response.text}"
    )

    data = response.json()

    assert data["token_type"].lower() == "bearer"
    assert data["access_token"]

    return {
        "Authorization": (
            f"Bearer {data['access_token']}"
        )
    }


def assert_analysis_contract(result, expected_input_type):
    """Validate the common public analysis response."""

    assert result["scan_id"] > 0
    assert result["input_type"] == expected_input_type
    assert result["status"] == "COMPLETED"

    assert 0 <= result["risk_score"] <= 100

    assert result["risk_level"] in {
        "LOW",
        "MEDIUM",
        "HIGH",
    }

    assert result["threat_category"]

    assert 0 <= result["confidence"] <= 100

    assert isinstance(
        result["indicators"],
        list,
    )


def assert_persisted_result(
    client,
    auth_headers,
    result,
):
    """Verify GET returns exactly what POST persisted."""

    scan_id = result["scan_id"]

    response = client.get(
        f"{BASE_URL}/analysis/{scan_id}",
        headers=auth_headers,
    )

    assert response.status_code == 200, (
        f"GET failed: "
        f"{response.status_code} "
        f"{response.text}"
    )

    stored = response.json()

    assert stored["scan_id"] == scan_id
    assert stored["input_type"] == result["input_type"]
    assert stored["status"] == result["status"]

    assert stored["risk_score"] == result["risk_score"]
    assert stored["risk_level"] == result["risk_level"]

    assert (
        stored["threat_category"]
        == result["threat_category"]
    )

    assert stored["confidence"] == result["confidence"]

    assert isinstance(
        stored["indicators"],
        list,
    )


def test_authenticated_message_analysis_persists_result(
    client,
    auth_headers,
):
    payload = {
        "input_type": "MESSAGE",
        "content": (
            "URGENT! Your bank account will be permanently "
            "blocked today. Verify your KYC immediately "
            "and confirm your OTP."
        ),
    }

    response = client.post(
        f"{BASE_URL}/analysis/message",
        json=payload,
        headers=auth_headers,
    )

    assert response.status_code == 202, (
        f"Unexpected response: "
        f"{response.status_code} {response.text}"
    )

    result = response.json()

    assert_analysis_contract(
        result,
        "MESSAGE",
    )

    assert_persisted_result(
        client,
        auth_headers,
        result,
    )


def test_authenticated_url_analysis_persists_result(
    client,
    auth_headers,
):
    payload = {
        "input_type": "URL",
        "content": "https://www.google.com",
    }

    response = client.post(
        f"{BASE_URL}/analysis/url",
        json=payload,
        headers=auth_headers,
    )

    assert response.status_code == 202, (
        f"Unexpected response: "
        f"{response.status_code} {response.text}"
    )

    result = response.json()

    assert_analysis_contract(
        result,
        "URL",
    )

    # Legitimate Google URL should remain low risk
    # under the current URL intelligence rules.
    assert result["risk_level"] == "LOW"
    assert result["threat_category"] == "LOW_RISK_URL"

    assert_persisted_result(
        client,
        auth_headers,
        result,
    )


def test_authenticated_credential_phishing_email_persists_result(
    client,
    auth_headers,
):
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

    payload = {
        "input_type": "EMAIL",
        "content": email,
    }

    response = client.post(
        f"{BASE_URL}/analysis/email",
        json=payload,
        headers=auth_headers,
    )

    assert response.status_code == 202, (
        f"Unexpected response: "
        f"{response.status_code} {response.text}"
    )

    result = response.json()

    assert_analysis_contract(
        result,
        "EMAIL",
    )

    # Current CyberShield expected classification.
    assert result["risk_level"] == "HIGH"
    assert result["threat_category"] == "CREDENTIAL_PHISHING"

    assert_persisted_result(
        client,
        auth_headers,
        result,
    )


def test_wrong_input_type_is_rejected(
    client,
    auth_headers,
):
    payload = {
        "input_type": "URL",
        "content": "https://www.google.com",
    }

    response = client.post(
        f"{BASE_URL}/analysis/message",
        json=payload,
        headers=auth_headers,
    )

    assert response.status_code == 400


def test_unauthenticated_analysis_is_rejected(
    client,
):
    payload = {
        "input_type": "MESSAGE",
        "content": "Hello, this is a normal message.",
    }

    response = client.post(
        f"{BASE_URL}/analysis/message",
        json=payload,
    )

    assert response.status_code == 401