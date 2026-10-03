from datetime import datetime, timedelta, timezone
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy import (
    case,
    func,
    select,
)
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.dependencies.auth import get_current_user

from app.models.scan import Scan
from app.models.user import User

from app.schemas.analysis import (
    AnalysisRequest,
    AnalysisResponse,
    InputType,
    ScanListResponse,
    ScanSummaryResponse,
    ThreatIndicatorResponse,
)

from app.services.analysis_service import (
    create_scan,
    get_user_scan,
    get_user_scans,
    delete_user_scan,
)

from app.utils.url_validation import validate_url


router = APIRouter(
    prefix="/api/v1/analysis",
    tags=["Threat Analysis"],
)


# ==========================================================
# RESPONSE HELPERS
# ==========================================================

def build_analysis_response(
    scan: Scan,
) -> AnalysisResponse:

    return AnalysisResponse(
        scan_id=scan.id,
        input_type=scan.input_type,
        status=scan.status,

        risk_score=scan.risk_score,
        risk_level=scan.risk_level,
        threat_category=scan.threat_category,
        confidence=scan.confidence,
        verdict=scan.verdict,
        analysis_details=scan.analysis_details,

        error_message=scan.error_message,

        created_at=scan.created_at,
        completed_at=scan.completed_at,

        indicators=[
            ThreatIndicatorResponse(
                id=indicator.id,
                indicator_type=indicator.indicator_type,
                name=indicator.name,
                description=indicator.description,
                severity=indicator.severity,
                score=indicator.score,
                source=indicator.source,
            )
            for indicator in scan.indicators
        ],
    )


def build_scan_summary(
    scan: Scan,
) -> ScanSummaryResponse:

    return ScanSummaryResponse(
        scan_id=scan.id,
        input_type=scan.input_type,
        status=scan.status,

        risk_score=scan.risk_score,
        risk_level=scan.risk_level,
        threat_category=scan.threat_category,
        confidence=scan.confidence,

        created_at=scan.created_at,
        completed_at=scan.completed_at,
    )


# ==========================================================
# GENERIC ANALYSIS
# ==========================================================

@router.post(
    "",
    response_model=AnalysisResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Create Analysis",
)
def create_analysis(
    data: AnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    scan = create_scan(
        db=db,
        user=current_user,
        request=data,
    )

    return build_analysis_response(scan)


# ==========================================================
# URL ANALYSIS
# ==========================================================

@router.post(
    "/url",
    response_model=AnalysisResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Analyze URL",
)
def analyze_url(
    data: AnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # ------------------------------------------------------
    # Dedicated endpoint must receive URL input
    # ------------------------------------------------------

    if data.input_type != InputType.URL:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="input_type must be URL",
        )

    # ------------------------------------------------------
    # Validate URL before sending it to intelligence engine
    # ------------------------------------------------------

    is_valid, error_message = validate_url(
        data.content
    )

    if not is_valid:

        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=error_message,
        )

    # ------------------------------------------------------
    # Create scan
    # ------------------------------------------------------

    scan = create_scan(
        db=db,
        user=current_user,
        request=data,
    )

    return build_analysis_response(scan)


# ==========================================================
# MESSAGE ANALYSIS
# ==========================================================

@router.post(
    "/message",
    response_model=AnalysisResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Analyze Message",
)
def analyze_message(
    data: AnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # ------------------------------------------------------
    # Dedicated endpoint must receive MESSAGE input
    # ------------------------------------------------------

    if data.input_type != InputType.MESSAGE:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="input_type must be MESSAGE",
        )

    # ------------------------------------------------------
    # Create scan
    # ------------------------------------------------------

    scan = create_scan(
        db=db,
        user=current_user,
        request=data,
    )

    return build_analysis_response(scan)


# ==========================================================
# EMAIL ANALYSIS
# ==========================================================

@router.post(
    "/email",
    response_model=AnalysisResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Analyze Email",
)
def analyze_email(
    data: AnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # ------------------------------------------------------
    # Dedicated endpoint must receive EMAIL input
    # ------------------------------------------------------

    if data.input_type != InputType.EMAIL:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="input_type must be EMAIL",
        )

    # ------------------------------------------------------
    # Create scan
    # ------------------------------------------------------

    scan = create_scan(
        db=db,
        user=current_user,
        request=data,
    )

    return build_analysis_response(scan)


# ==========================================================
# LIST USER SCANS
# ==========================================================

@router.get(
    "",
    response_model=ScanListResponse,
    summary="List Scans",
)
def list_scans(
    risk_level: str | None = None,
    input_type: str | None = None,
    status_filter: str | None = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)

    scans = get_user_scans(
        db=db,
        user=current_user,
        risk_level=risk_level,
    )

    # Additional filters
    if input_type:
        scans = [
            scan
            for scan in scans
            if scan.input_type == input_type.upper()
        ]

    if status_filter:
        scans = [
            scan
            for scan in scans
            if scan.status == status_filter.upper()
        ]

    total = len(scans)

    start = (page - 1) * page_size
    end = start + page_size

    paginated_scans = scans[start:end]

    return ScanListResponse(
        total=total,
        scans=[
            build_scan_summary(scan)
            for scan in paginated_scans
        ],
    )


# ==========================================================
# DASHBOARD
# ==========================================================

@router.get(
    "/dashboard",
    summary="Get Dashboard",
)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ======================================================
    # BASIC COUNTS
    # ======================================================

    total_scans = db.scalar(
        select(func.count(Scan.id)).where(
            Scan.user_id == current_user.id
        )
    ) or 0

    completed_scans = db.scalar(
        select(func.count(Scan.id)).where(
            Scan.user_id == current_user.id,
            Scan.status == "COMPLETED",
        )
    ) or 0

    failed_scans = db.scalar(
        select(func.count(Scan.id)).where(
            Scan.user_id == current_user.id,
            Scan.status == "FAILED",
        )
    ) or 0

    pending_scans = db.scalar(
        select(func.count(Scan.id)).where(
            Scan.user_id == current_user.id,
            Scan.status == "PENDING",
        )
    ) or 0

    # ======================================================
    # RISK DISTRIBUTION
    # ======================================================

    high_risk = db.scalar(
        select(func.count(Scan.id)).where(
            Scan.user_id == current_user.id,
            Scan.risk_level == "HIGH",
        )
    ) or 0

    medium_risk = db.scalar(
        select(func.count(Scan.id)).where(
            Scan.user_id == current_user.id,
            Scan.risk_level == "MEDIUM",
        )
    ) or 0

    low_risk = db.scalar(
        select(func.count(Scan.id)).where(
            Scan.user_id == current_user.id,
            Scan.risk_level == "LOW",
        )
    ) or 0

    # ======================================================
    # INPUT TYPE DISTRIBUTION
    # ======================================================

    url_scans = db.scalar(
        select(func.count(Scan.id)).where(
            Scan.user_id == current_user.id,
            Scan.input_type == "URL",
        )
    ) or 0

    message_scans = db.scalar(
        select(func.count(Scan.id)).where(
            Scan.user_id == current_user.id,
            Scan.input_type == "MESSAGE",
        )
    ) or 0

    email_scans = db.scalar(
        select(func.count(Scan.id)).where(
            Scan.user_id == current_user.id,
            Scan.input_type == "EMAIL",
        )
    ) or 0

    # ======================================================
    # AVERAGE RISK SCORE
    #
    # Only completed scans with a real score are included.
    # ======================================================

    average_risk_score = db.scalar(
        select(func.avg(Scan.risk_score)).where(
            Scan.user_id == current_user.id,
            Scan.status == "COMPLETED",
            Scan.risk_score.is_not(None),
        )
    )

    if average_risk_score is not None:
        average_risk_score = round(
            float(average_risk_score),
            2,
        )

    # ======================================================
    # THREAT CATEGORY DISTRIBUTION
    #
    # Uses actual database values.
    # No hardcoded categories.
    # ======================================================

    category_rows = db.execute(
        select(
            Scan.threat_category,
            func.count(Scan.id),
        )
        .where(
            Scan.user_id == current_user.id,
            Scan.threat_category.is_not(None),
        )
        .group_by(
            Scan.threat_category,
        )
        .order_by(
            func.count(Scan.id).desc(),
        )
    ).all()

    threat_categories = {
        category: count
        for category, count in category_rows
    }

    # ======================================================
    # TOP THREAT CATEGORY
    # ======================================================

    top_threat_category = None
    top_threat_count = 0

    if category_rows:
        top_threat_category = category_rows[0][0]
        top_threat_count = category_rows[0][1]

    # ======================================================
    # HIGHEST RISK SCAN
    # ======================================================

    highest_risk_scan = db.scalar(
        select(Scan)
        .where(
            Scan.user_id == current_user.id,
            Scan.risk_score.is_not(None),
        )
        .order_by(
            Scan.risk_score.desc(),
            Scan.created_at.desc(),
        )
        .limit(1)
    )

    # ======================================================
    # RECENT SCANS
    # ======================================================

    recent_scans = get_user_scans(
        db=db,
        user=current_user,
    )[:10]

    # ======================================================
    # RESPONSE
    # ======================================================

    return {
        "total_scans": total_scans,

        "average_risk_score": average_risk_score,

        "risk_distribution": {
            "high": high_risk,
            "medium": medium_risk,
            "low": low_risk,
        },

        "status_distribution": {
            "completed": completed_scans,
            "failed": failed_scans,
            "pending": pending_scans,
        },

        "input_distribution": {
            "url": url_scans,
            "message": message_scans,
            "email": email_scans,
        },

        "threat_categories": threat_categories,

        "threat_intelligence": {
            "top_category": top_threat_category,
            "top_category_count": top_threat_count,
        },

        "highest_risk_scan": (
            build_scan_summary(highest_risk_scan)
            if highest_risk_scan
            else None
        ),

        "recent_scans": [
            build_scan_summary(scan)
            for scan in recent_scans
        ],
    }


@router.get(
    "/dashboard/trends",
    summary="Get Dashboard Trends",
)
def get_dashboard_trends(
    days: int = Query(
        default=7,
        ge=1,
        le=30,
        description="Number of previous days to include",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return real scan trends from PostgreSQL.

    Data is grouped by calendar date and filtered
    to the authenticated user's scans.
    """

    start_date = (
        datetime.now(timezone.utc).date()
        - timedelta(days=days - 1)
    )

    scan_date = func.date(Scan.created_at)

    rows = db.execute(
        select(
            scan_date.label("scan_date"),
            func.count(Scan.id).label("total_scans"),

            func.sum(
                case(
                    (Scan.risk_level == "HIGH", 1),
                    else_=0,
                )
            ).label("high_risk"),

            func.sum(
                case(
                    (Scan.risk_level == "MEDIUM", 1),
                    else_=0,
                )
            ).label("medium_risk"),

            func.sum(
                case(
                    (Scan.risk_level == "LOW", 1),
                    else_=0,
                )
            ).label("low_risk"),
        )
        .where(
            Scan.user_id == current_user.id,
            Scan.created_at >= start_date,
        )
        .group_by(scan_date)
        .order_by(scan_date)
    ).all()

    trend_map = {
        str(row.scan_date): {
            "date": str(row.scan_date),
            "total_scans": int(row.total_scans or 0),
            "high_risk": int(row.high_risk or 0),
            "medium_risk": int(row.medium_risk or 0),
            "low_risk": int(row.low_risk or 0),
        }
        for row in rows
    }

    trends = []

    for offset in range(days):
        current_date = (
            start_date + timedelta(days=offset)
        )

        date_key = str(current_date)

        trends.append(
            trend_map.get(
                date_key,
                {
                    "date": date_key,
                    "total_scans": 0,
                    "high_risk": 0,
                    "medium_risk": 0,
                    "low_risk": 0,
                },
            )
        )

    return {
        "period_days": days,
        "trends": trends,
    }

# ==========================================================
# GET SINGLE SCAN
# ==========================================================

@router.get(
    "/{scan_id}",
    response_model=AnalysisResponse,
    summary="Get Scan",
)
def get_scan(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    scan = get_user_scan(
        db=db,
        user=current_user,
        scan_id=scan_id,
    )

    if scan is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found",
        )

    return build_analysis_response(scan)


# ==========================================================
# DELETE SINGLE SCAN
# ==========================================================

@router.delete(
    "/{scan_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Scan",
)
def delete_scan(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    deleted = delete_user_scan(
        db=db,
        user=current_user,
        scan_id=scan_id,
    )

    if not deleted:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found",
        )

    return None