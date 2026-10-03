from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.email_header import (
    EmailHeaderScanListResponse,
    EmailHeaderScanRequest,
    EmailHeaderScanResponse,
    EmailHeaderScanSummary,
)
from app.services.email_header_service import (
    create_email_header_scan,
    delete_user_email_header_scan,
    get_user_email_header_scan,
    list_user_email_header_scans,
)

router = APIRouter(
    prefix="/api/v1/email-headers",
    tags=["Email Header Analysis"],
)


def _response(scan) -> EmailHeaderScanResponse:
    return EmailHeaderScanResponse(
        scan_id=scan.id,
        status=scan.status,
        risk_score=scan.risk_score,
        risk_level=scan.risk_level,
        confidence=scan.confidence,
        threat_category=scan.threat_category,
        headers=scan.evidence.get("headers", {}) if scan.evidence else {},
        authentication=(
            scan.evidence.get("authentication", {})
            if scan.evidence
            else {}
        ),
        findings=scan.findings or [],
        evidence=scan.evidence or {},
        recommendations=scan.recommendations or [],
        created_at=scan.created_at,
        completed_at=scan.completed_at,
    )


@router.post(
    "",
    response_model=EmailHeaderScanResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Analyze raw email headers",
)
def analyze_headers(
    data: EmailHeaderScanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        scan = create_email_header_scan(db, current_user, data.raw_headers)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    return _response(scan)


@router.get(
    "",
    response_model=EmailHeaderScanListResponse,
)
def list_header_scans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scans = list_user_email_header_scans(db, current_user)
    return EmailHeaderScanListResponse(
        total=len(scans),
        scans=[
            EmailHeaderScanSummary(
                scan_id=s.id,
                status=s.status,
                risk_score=s.risk_score,
                risk_level=s.risk_level,
                threat_category=s.threat_category,
                confidence=s.confidence,
                created_at=s.created_at,
                completed_at=s.completed_at,
            )
            for s in scans
        ],
    )


@router.get(
    "/{scan_id}",
    response_model=EmailHeaderScanResponse,
)
def get_header_scan(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scan = get_user_email_header_scan(db, current_user, scan_id)
    if scan is None:
        raise HTTPException(status_code=404, detail="Header scan not found")
    return _response(scan)


@router.delete(
    "/{scan_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_header_scan(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not delete_user_email_header_scan(db, current_user, scan_id):
        raise HTTPException(status_code=404, detail="Header scan not found")
