from datetime import datetime

from app.schemas.analysis import AnalysisResponse


def test_analysis_response_contract():
    response = AnalysisResponse(
        scan_id=1,
        input_type="MESSAGE",
        status="COMPLETED",
        risk_score=81,
        risk_level="HIGH",
        threat_category="BANKING_SCAM",
        confidence=86,
        error_message=None,
        created_at=datetime.now(),
        completed_at=datetime.now(),
        indicators=[],
    )

    assert response.scan_id == 1
    assert response.input_type == "MESSAGE"
    assert response.status == "COMPLETED"

    assert 0 <= response.risk_score <= 100
    assert response.risk_level in {"LOW", "MEDIUM", "HIGH"}
    assert response.threat_category
    assert 0 <= response.confidence <= 100