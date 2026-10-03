from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.mobile import MobileScanListResponse, MobileScanResponse, MobileScanSummary
from app.services.mobile_scan_service import create_mobile_scan, delete_user_mobile_scan, get_user_mobile_scan, list_user_mobile_scans

router = APIRouter(prefix="/api/v1/mobile", tags=["Mobile Privacy Scanner"])
MAX_APK_SIZE = 100 * 1024 * 1024

def _response(scan) -> MobileScanResponse:
    return MobileScanResponse(
        scan_id=scan.id, filename=scan.filename, package_name=scan.package_name,
        status=scan.status, risk_score=scan.risk_score, risk_level=scan.risk_level,
        confidence=scan.confidence, permissions=scan.permissions or [],
        findings=scan.findings or [], recommendations=scan.recommendations or [],
        evidence=scan.evidence or {}, created_at=scan.created_at, completed_at=scan.completed_at,
    )

@router.post("", response_model=MobileScanResponse, status_code=status.HTTP_201_CREATED)
async def analyze_mobile_apk(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    filename = Path(file.filename or "upload.apk").name
    if not filename.lower().endswith(".apk"):
        raise HTTPException(status_code=422, detail="Only .apk files are supported.")
    with NamedTemporaryFile(suffix=".apk", delete=True) as temp:
        size = 0
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            if size > MAX_APK_SIZE:
                raise HTTPException(status_code=413, detail="APK exceeds the 100 MB upload limit.")
            temp.write(chunk)
        temp.flush()
        try:
            scan = create_mobile_scan(db, current_user, filename, temp.name)
        except (ValueError, RuntimeError) as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
    return _response(scan)

@router.get("", response_model=MobileScanListResponse)
def list_mobile_scans(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    scans = list_user_mobile_scans(db, current_user)
    return MobileScanListResponse(total=len(scans), scans=[
        MobileScanSummary(scan_id=s.id, filename=s.filename, package_name=s.package_name,
            status=s.status, risk_score=s.risk_score, risk_level=s.risk_level,
            confidence=s.confidence, created_at=s.created_at, completed_at=s.completed_at)
        for s in scans
    ])

@router.get("/{scan_id}", response_model=MobileScanResponse)
def get_mobile_scan(scan_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    scan = get_user_mobile_scan(db, current_user, scan_id)
    if scan is None:
        raise HTTPException(status_code=404, detail="Mobile scan not found.")
    return _response(scan)

@router.delete("/{scan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_mobile_scan(scan_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not delete_user_mobile_scan(db, current_user, scan_id):
        raise HTTPException(status_code=404, detail="Mobile scan not found.")
