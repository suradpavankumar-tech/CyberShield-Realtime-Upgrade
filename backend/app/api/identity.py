from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.intelligence.identity_shield import (
    check_email_exposure,
    query_pwned_password_k_anonymity,
)

router = APIRouter(prefix="/api/v1/identity", tags=["IdentityShield"])


class EmailCheckRequest(BaseModel):
    email: str


@router.post("/check-email")
def analyze_email_breach(req: EmailCheckRequest):
    """
    Check an email address against cataloged breach events and dark web dumps.
    """
    try:
        return check_email_exposure(req.email)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


@router.get("/pwned-password-range/{prefix}")
def check_pwned_password_k_anonymity(prefix: str):
    """
    Query compromised password hash suffixes using k-Anonymity.
    Clients supply the first 5 characters of SHA-1 hash.
    The real password NEVER leaves the client.
    """
    try:
        suffixes = query_pwned_password_k_anonymity(prefix)
        return {
            "prefix": prefix.upper(),
            "count": len(suffixes),
            "suffixes": suffixes,
        }
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
