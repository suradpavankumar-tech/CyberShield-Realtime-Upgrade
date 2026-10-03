from app.intelligence.domain_intelligence import analyze_domain
from app.intelligence.live_url_intelligence import resolve_host
from app.intelligence.url_risk_engine import analyze_url_hybrid


def test_registered_domain_boundaries():
    assert analyze_domain("https://maps.google.com/path").domain == "google.com"
    assert analyze_domain("https://google.com.evil-example.com").domain == "evil-example.com"
    assert analyze_domain("https://g00gle.com").domain == "g00gle.com"


def test_ssrf_private_targets_are_blocked():
    result = resolve_host("localhost")
    assert result["status"] in {"BLOCKED", "FAILED"}


def test_legitimate_google_maps_does_not_become_high_from_ml_alone(monkeypatch):
    monkeypatch.setattr(
        "app.intelligence.url_risk_engine.analyze_live_url",
        lambda url, domain: {
            "registered_domain": "google.com",
            "dns": {"status": "RESOLVED", "addresses": ["142.250.72.196"]},
            "tls": {"status": "VALID"},
            "http": {"status": "COMPLETED", "chain": [{"status_code": 200, "reason": "OK"}]},
            "redirects": {"chain": [], "final_url": url, "final_registered_domain": "google.com", "cross_domain": False},
            "reputation": {"status": "UNAVAILABLE", "provider": "VirusTotal"},
            "impersonation": {"detected": False, "matches": []},
        },
    )
    result = analyze_url_hybrid("https://www.google.com/maps")
    assert result.ml_probability > 0.90
    assert result.risk_level == "LOW"
    assert result.final_score < 45
    assert result.verdict.startswith("Low Risk")
