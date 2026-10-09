from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.intelligence.threat_pulse import CURATED_CAMPAIGNS, get_threat_pulse_summary

router = APIRouter(prefix="/api/v1/threat-pulse", tags=["ThreatPulse Live Radar"])


@router.get("/trends")
def get_threat_trends(db: Session = Depends(get_db)):
    """
    Public and authenticated endpoint providing live threat trends,
    emerging campaign intelligence, and national advisories.
    """
    return get_threat_pulse_summary(db)


@router.get("/campaigns/{campaign_id}")
def get_campaign_detail(campaign_id: str):
    """
    Retrieve deep forensic breakdown and red flags for a specific scam campaign.
    """
    for camp in CURATED_CAMPAIGNS:
        if camp["id"].lower() == campaign_id.lower():
            return camp
    raise HTTPException(status_code=404, detail="Threat campaign not found.")
