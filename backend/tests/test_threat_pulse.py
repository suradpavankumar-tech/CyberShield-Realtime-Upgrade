from app.intelligence.threat_pulse import CURATED_CAMPAIGNS, get_threat_pulse_summary


def test_threat_pulse_curated_campaigns_validity():
    assert len(CURATED_CAMPAIGNS) >= 5
    for camp in CURATED_CAMPAIGNS:
        assert "id" in camp
        assert "title" in camp
        assert "severity" in camp
        assert camp["severity"] in {"CRITICAL", "HIGH", "MEDIUM", "LOW"}
        assert len(camp["red_flags"]) > 0
        assert "containment_action" in camp


def test_threat_pulse_summary_contract():
    class DummyDB:
        def scalar(self, statement):
            return 50

    summary = get_threat_pulse_summary(DummyDB())
    assert summary["status"] == "OPERATIONAL"
    assert "telemetry" in summary
    assert "campaigns" in summary
    assert "threat_categories" in summary
    assert len(summary["threat_categories"]) > 0
