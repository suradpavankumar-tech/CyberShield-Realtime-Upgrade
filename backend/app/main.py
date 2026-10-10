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

@app.get("/", tags=["System"])
def root():
    if dist_path and (dist_path / "index.html").exists():
        return FileResponse(str(dist_path / "index.html"))
    return {"name": "CyberShield", "message": "CyberShield API is running", "version": "0.5.0"}

@app.get("/health", tags=["System"])
def health_check():
    return {"status": "healthy", "service": "cybershield-api"}

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
