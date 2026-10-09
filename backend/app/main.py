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

app = FastAPI(
    title=settings.APP_NAME,
    description="CyberShield — Intelligent Phishing & Scam Risk Assessment Platform",
    version="0.5.0",
    debug=settings.DEBUG,
)

cors_origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["System"])
def root():
    return {"name": "CyberShield", "message": "CyberShield API is running", "version": "0.5.0"}

@app.get("/health", tags=["System"])
def health_check():
    return {"status": "healthy", "service": "cybershield-api"}

app.include_router(auth_router)
app.include_router(analysis_router)
app.include_router(email_headers_router)
app.include_router(mobile_router)
app.include_router(vulnerability_router)
app.include_router(security_campaigns_router)
app.include_router(threat_pulse_router)
