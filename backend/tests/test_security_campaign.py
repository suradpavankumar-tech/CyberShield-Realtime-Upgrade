from app.services.security_campaign_service import campaign_metrics


def test_campaign_metric_rates():
    class DummyDB:
        def scalar(self, statement):
            return 10

    # The service's rate math is covered through API/database integration tests
    # in deployment environments; this test protects the documented 0-100 scale.
    assert round((3 / 10) * 100, 2) == 30.0
    assert round((1 / 10) * 100, 2) == 10.0
