import pytest
from app.intelligence.identity_shield import (
    check_email_exposure,
    query_pwned_password_k_anonymity,
)


def test_invalid_email_is_rejected():
    with pytest.raises(ValueError):
        check_email_exposure("invalid-email")
    with pytest.raises(ValueError):
        check_email_exposure("")


def test_email_exposure_detection():
    # Test known exposed email address
    res = check_email_exposure("test@example.com")
    assert res["is_compromised"] is True
    assert res["breach_count"] > 0
    assert 0 <= res["risk_score"] <= 100
    assert res["risk_level"] in {"CRITICAL", "HIGH", "MEDIUM", "LOW"}
    assert len(res["data_classes_exposed"]) > 0
    assert len(res["recommendations"]) > 0


def test_pwned_password_k_anonymity_prefix_query():
    # Prefix for "password" (5BAA6)
    prefix = "5BAA6"
    results = query_pwned_password_k_anonymity(prefix)
    assert isinstance(results, list)
    assert len(results) > 0
    # verify that the suffix for "password" exists in results
    suffixes = [r["hash_suffix"] for r in results]
    assert any("1E4C9B93F3F0682250B6CF8331B7EE68FD8" in s for s in suffixes)


def test_invalid_password_prefix_rejected():
    with pytest.raises(ValueError):
        query_pwned_password_k_anonymity("123")  # too short
    with pytest.raises(ValueError):
        query_pwned_password_k_anonymity("ZZZZZ")  # non-hex
