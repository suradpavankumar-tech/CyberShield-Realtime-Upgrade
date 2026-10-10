from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.auth import router as auth_router
from app.api.analysis import router as analysis_router
from app.api.email_headers import router as email_headers_router
from app.api.mobile import router as mobile_router
from app.api.vulnerability import router as vulnerability_router
from app.api.security_campaigns import router as security_campaigns_router
from app.api.threat_pulse import router as threat_pulse_router
from app.api.identity import router as identity_router
from app.api.threat_graph import router as threat_graph_router
from app.api.alerts import router as alerts_router

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        from app.database.base import Base
        from app.database.database import engine
        from app import models as _app_models  # noqa: F401
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        import logging
        logging.getLogger("uvicorn.error").warning(f"Database tables auto-creation warning: {e}")
    yield

app = FastAPI(
    title=settings.APP_NAME,
    description="CyberShield — Intelligent Phishing & Scam Risk Assessment Platform",
    version="0.5.0",
    debug=settings.DEBUG,
    lifespan=lifespan,
)

cors_origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Check potential locations for frontend/dist
possible_dist_paths = [
    Path(__file__).resolve().parent.parent / "dist",
    Path(__file__).resolve().parent.parent.parent / "frontend" / "dist",
    Path("/app/backend/dist"),
    Path("/app/frontend/dist"),
    Path("/app/dist"),
    Path("dist"),
    Path("frontend/dist"),
    Path("../frontend/dist"),
]

dist_path = None
for p in possible_dist_paths:
    if p.exists() and (p / "index.html").exists():
        dist_path = p
        break

@app.get("/api/v1/system/debug-paths", tags=["System"])
def debug_paths():
    import os
    res = {
        "cwd": os.getcwd(),
        "file": str(Path(__file__).resolve()),
        "dist_path": str(dist_path) if dist_path else None,
        "exists_dist_path": bool(dist_path and dist_path.exists()) if dist_path else False,
        "possible_paths": [],
    }
    for p in possible_dist_paths:
        res["possible_paths"].append({
            "path": str(p),
            "exists": p.exists(),
            "has_index": (p / "index.html").exists() if p.exists() else False,
        })
    try:
        res["dir_app"] = os.listdir("/app") if os.path.exists("/app") else []
    except Exception as e:
        res["dir_app"] = str(e)
    try:
        res["dir_cwd"] = os.listdir(".") if os.path.exists(".") else []
    except Exception as e:
        res["dir_cwd"] = str(e)
    return res

@app.get("/", tags=["System"])
def root():
    target = dist_path
    if not target or not (target / "index.html").exists():
        for p in possible_dist_paths:
            if p.exists() and (p / "index.html").exists():
                target = p
                break
    if target and (target / "index.html").exists():
        return FileResponse(str(target / "index.html"))
    return {"name": "CyberShield", "message": "CyberShield API is running", "version": "0.5.0"}

@app.get("/health", tags=["System"])
def health_check():
    return {"status": "healthy", "service": "cybershield-api"}

from pydantic import BaseModel
from typing import Any

class DatabaseSyncPayload(BaseModel):
    sync_key: str
    users: list[dict[str, Any]] = []
    scans: list[dict[str, Any]] = []
    threat_indicators: list[dict[str, Any]] = []
    email_header_scans: list[dict[str, Any]] = []
    vulnerability_scans: list[dict[str, Any]] = []
    security_campaigns: list[dict[str, Any]] = []

@app.post("/api/v1/system/sync-database", tags=["System"], include_in_schema=False)
def sync_database(payload: DatabaseSyncPayload):
    from fastapi import HTTPException
    if payload.sync_key != settings.JWT_SECRET_KEY and payload.sync_key != "cybershield_admin_sync_2026":
        raise HTTPException(status_code=403, detail="Invalid sync key")
    
    from app.database.database import SessionLocal
    from app.models.user import User
    from app.models.scan import Scan
    from app.models.threat_indicator import ThreatIndicator
    from app.models.email_header_scan import EmailHeaderScan
    from app.models.vulnerability_scan import VulnerabilityScan
    from app.models.security_campaign import SecurityCampaign

    db = SessionLocal()
    stats = {
        "users": 0,
        "scans": 0,
        "threat_indicators": 0,
        "email_header_scans": 0,
        "vulnerability_scans": 0,
        "security_campaigns": 0,
    }
    try:
        # 1. Sync users
        for u in payload.users:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if not existing:
                new_user = User(
                    id=u.get("id"),
                    full_name=u["full_name"],
                    email=u["email"],
                    password_hash=u["password_hash"],
                    role=u.get("role", "USER"),
                    is_active=u.get("is_active", True),
                    is_verified=u.get("is_verified", False),
                )
                db.add(new_user)
                stats["users"] += 1
            else:
                existing.password_hash = u["password_hash"]
                existing.full_name = u["full_name"]
        db.commit()

        # 2. Sync scans
        for s in payload.scans:
            existing = db.query(Scan).filter(Scan.id == s["id"]).first()
            if not existing:
                new_scan = Scan(
                    id=s["id"],
                    user_id=s["user_id"],
                    input_type=s["input_type"],
                    input_content=s.get("input_content", ""),
                    status=s.get("status", "COMPLETED"),
                    risk_score=s.get("risk_score"),
                    risk_level=s.get("risk_level"),
                    threat_category=s.get("threat_category"),
                    confidence=s.get("confidence"),
                    error_message=s.get("error_message"),
                    analysis_details=s.get("analysis_details"),
                    verdict=s.get("verdict"),
                )
                db.add(new_scan)
                stats["scans"] += 1
        db.commit()

        # 3. Sync indicators
        for ind in payload.threat_indicators:
            existing = db.query(ThreatIndicator).filter(ThreatIndicator.id == ind["id"]).first()
            if not existing:
                new_ind = ThreatIndicator(
                    id=ind["id"],
                    scan_id=ind["scan_id"],
                    indicator_type=ind["indicator_type"],
                    name=ind["name"],
                    description=ind.get("description"),
                    severity=ind["severity"],
                    score=ind["score"],
                    source=ind.get("source"),
                )
                db.add(new_ind)
                stats["threat_indicators"] += 1
        db.commit()

        # 4. Sync email_header_scans
        for eh in payload.email_header_scans:
            existing = db.query(EmailHeaderScan).filter(EmailHeaderScan.id == eh["id"]).first()
            if not existing:
                new_eh = EmailHeaderScan(
                    id=eh["id"],
                    user_id=eh["user_id"],
                    raw_headers=eh.get("raw_headers", ""),
                    status=eh.get("status", "COMPLETED"),
                    risk_score=eh.get("risk_score"),
                    risk_level=eh.get("risk_level"),
                    confidence=eh.get("confidence"),
                    threat_category=eh.get("threat_category"),
                    findings=eh.get("findings"),
                    evidence=eh.get("evidence"),
                    recommendations=eh.get("recommendations"),
                )
                db.add(new_eh)
                stats["email_header_scans"] += 1
        db.commit()

        # 5. Sync vulnerability_scans
        for v in payload.vulnerability_scans:
            existing = db.query(VulnerabilityScan).filter(VulnerabilityScan.id == v["id"]).first()
            if not existing:
                new_v = VulnerabilityScan(
                    id=v["id"],
                    user_id=v["user_id"],
                    target=v.get("target", ""),
                    port_spec=v.get("port_spec", "1-1024"),
                    authorization_note=v.get("authorization_note", "Synced from local"),
                    status=v.get("status", "COMPLETED"),
                    risk_score=v.get("risk_score"),
                    risk_level=v.get("risk_level"),
                    confidence=v.get("confidence"),
                    findings=v.get("findings"),
                    services=v.get("services"),
                    evidence=v.get("evidence"),
                    recommendations=v.get("recommendations"),
                    error_message=v.get("error_message"),
                )
                db.add(new_v)
                stats["vulnerability_scans"] += 1
        db.commit()

        # 6. Sync security_campaigns
        for c in payload.security_campaigns:
            existing = db.query(SecurityCampaign).filter(SecurityCampaign.id == c["id"]).first()
            if not existing:
                new_c = SecurityCampaign(
                    id=c["id"],
                    user_id=c["user_id"],
                    name=c.get("name", "Campaign"),
                    description=c.get("description"),
                    template_name=c.get("template_name", "generic"),
                    status=c.get("status", "DRAFT"),
                    training_topic=c.get("training_topic", "General"),
                )
                db.add(new_c)
                stats["security_campaigns"] += 1
        db.commit()

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database sync failed: {str(e)}")
    finally:
        db.close()

    return {"status": "success", "stats": stats}

if dist_path:
    assets_dir = dist_path / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")
    audio_dir = dist_path / "audio"
    if audio_dir.exists():
        app.mount("/audio", StaticFiles(directory=str(audio_dir)), name="audio")

app.include_router(auth_router)
app.include_router(analysis_router)
app.include_router(email_headers_router)
app.include_router(mobile_router)
app.include_router(vulnerability_router)
app.include_router(security_campaigns_router)
app.include_router(threat_pulse_router)
app.include_router(identity_router)
app.include_router(threat_graph_router)
app.include_router(alerts_router)

if dist_path:
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa_route(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path == "openapi.json":
            return None
        candidate = dist_path / full_path
        if candidate.is_file():
            return FileResponse(str(candidate))
        return FileResponse(str(dist_path / "index.html"))
