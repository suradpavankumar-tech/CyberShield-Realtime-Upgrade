from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.intelligence.email_header_analyzer import analyze_email_headers
from app.models.email_header_scan import EmailHeaderScan
from app.models.user import User


def create_email_header_scan(
    db: Session,
    user: User,
    raw_headers: str,
) -> EmailHeaderScan:
    result = analyze_email_headers(raw_headers)

    scan = EmailHeaderScan(
        user_id=user.id,
        raw_headers=raw_headers,
        status="COMPLETED",
        risk_score=result["risk_score"],
        risk_level=result["risk_level"],
        confidence=result["confidence"],
        threat_category=result["threat_category"],
        findings=result["findings"],
        evidence={
            **result["evidence"],
            "received": result["received"],
        },
        recommendations=result["recommendations"],
        completed_at=datetime.now(timezone.utc),
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    return scan


def get_user_email_header_scan(
    db: Session,
    user: User,
    scan_id: int,
) -> EmailHeaderScan | None:
    return db.scalar(
        select(EmailHeaderScan).where(
            EmailHeaderScan.id == scan_id,
            EmailHeaderScan.user_id == user.id,
        )
    )


def list_user_email_header_scans(
    db: Session,
    user: User,
) -> list[EmailHeaderScan]:
    return list(
        db.scalars(
            select(EmailHeaderScan)
            .where(EmailHeaderScan.user_id == user.id)
            .order_by(EmailHeaderScan.created_at.desc())
        ).all()
    )


def delete_user_email_header_scan(
    db: Session,
    user: User,
    scan_id: int,
) -> bool:
    scan = get_user_email_header_scan(db, user, scan_id)
    if scan is None:
        return False
    db.delete(scan)
    db.commit()
    return True
