from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.intelligence.mobile_permission_analyzer import analyze_apk
from app.models.mobile_scan import MobileScan
from app.models.user import User


def create_mobile_scan(db: Session, user: User, filename: str, apk_path: str) -> MobileScan:
    result = analyze_apk(apk_path)
    scan = MobileScan(
        user_id=user.id,
        filename=filename,
        package_name=result["package_name"],
        status="COMPLETED",
        risk_score=result["risk_score"],
        risk_level=result["risk_level"],
        confidence=result["confidence"],
        permissions=result["permissions"],
        findings=result["findings"],
        recommendations=result["recommendations"],
        evidence=result["evidence"],
        completed_at=datetime.now(timezone.utc),
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    return scan


def get_user_mobile_scan(db: Session, user: User, scan_id: int) -> MobileScan | None:
    return db.scalar(select(MobileScan).where(MobileScan.id == scan_id, MobileScan.user_id == user.id))


def list_user_mobile_scans(db: Session, user: User) -> list[MobileScan]:
    return list(db.scalars(select(MobileScan).where(MobileScan.user_id == user.id).order_by(MobileScan.created_at.desc())).all())


def delete_user_mobile_scan(db: Session, user: User, scan_id: int) -> bool:
    scan = get_user_mobile_scan(db, user, scan_id)
    if scan is None:
        return False
    db.delete(scan)
    db.commit()
    return True
