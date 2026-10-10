from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.intelligence.threat_graph import (
    generate_threat_graph_for_target,
    get_graph_from_scan_id,
)
from app.models.scan import Scan

router = APIRouter(prefix="/api/v1/threat-graph", tags=["ThreatGraph Infrastructure Intelligence"])


class ThreatGraphRequest(BaseModel):
    target: str


@router.post("/analyze")
def analyze_target_graph(req: ThreatGraphRequest):
    """
    Generate an interactive connected threat infrastructure graph for any URL or domain.
    """
    target = req.target.strip()
    if not target:
        raise HTTPException(status_code=422, detail="Target URL or domain cannot be empty.")
    return generate_threat_graph_for_target(target)


@router.get("/scan/{scan_id}")
def get_scan_graph(scan_id: int, db: Session = Depends(get_db)):
    """
    Generate an infrastructure graph from a stored historical scan record.
    """
    try:
        return get_graph_from_scan_id(db, scan_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/recent-targets")
def get_recent_graph_targets(db: Session = Depends(get_db)):
    """
    Returns recent scans suitable for visualization in ThreatGraph.
    """
    scans = db.scalars(
        select(Scan)
        .where(Scan.input_type == "URL")
        .order_by(Scan.created_at.desc())
        .limit(10)
    ).all()

    return [
        {
            "scan_id": s.id,
            "target": s.input_content,
            "risk_level": s.risk_level,
            "risk_score": s.risk_score,
            "threat_category": s.threat_category,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in scans
    ]
