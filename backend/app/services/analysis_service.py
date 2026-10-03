from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.scan import Scan
from app.models.user import User
from app.models.threat_indicator import ThreatIndicator
from app.schemas.analysis import AnalysisRequest, InputType

from app.intelligence.url_risk_engine import analyze_url_hybrid
from ml.risk_engine import calculate_final_score
from ml.nlp.analyzer import analyze_message
from ml.email.analyzer import analyze_email


# ==========================================================
# CREATE SCAN
# ==========================================================


def create_scan(
    db: Session,
    user: User,
    request: AnalysisRequest,
) -> Scan:

    content = request.content.strip()

    if not content:
        raise ValueError(
            "Analysis content cannot be empty."
        )

    # ------------------------------------------------------
    # CREATE INITIAL SCAN
    # ------------------------------------------------------

    scan = Scan(
        user_id=user.id,
        input_type=request.input_type.value,
        input_content=content,
        status="PENDING",
    )

    db.add(scan)
    db.commit()
    db.refresh(scan)

    # ======================================================
    # URL ANALYSIS
    # ======================================================

    if request.input_type == InputType.URL:

        try:

            # The URL engine performs bounded live checks and
            # treats ML as one signal rather than the final verdict.
            result = analyze_url_hybrid(content)

            # --------------------------------------------------
            # NORMALIZE INDICATORS
            # --------------------------------------------------

            url_indicators = []

            for indicator in getattr(
                result,
                "indicators",
                [],
            ):

                if isinstance(indicator, dict):

                    url_indicators.append(
                        indicator
                    )

                else:

                    url_indicators.append(
                        {
                            "indicator_type": getattr(
                                indicator,
                                "indicator_type",
                                "UNKNOWN",
                            ),
                            "type": getattr(
                                indicator,
                                "indicator_type",
                                "UNKNOWN",
                            ),
                            "name": getattr(
                                indicator,
                                "name",
                                "Security Indicator",
                            ),
                            "description": getattr(
                                indicator,
                                "description",
                                "",
                            ),
                            "severity": getattr(
                                indicator,
                                "severity",
                                "INFO",
                            ),
                            "score": int(
                                getattr(
                                    indicator,
                                    "score",
                                    0,
                                )
                            ),
                            "source": getattr(
                                indicator,
                                "source",
                                "URL_RULE_ENGINE",
                            ),
                        }
                    )

            # --------------------------------------------------
            # RISK RESULT
            # --------------------------------------------------

            risk_score = int(
                result.final_score
            )

            risk_level = result.risk_level

            threat_category = (
                determine_url_threat_category(
                    url=content,
                    result=result,
                    final_score=risk_score,
                )
            )

            # --------------------------------------------------
            # UPDATE SCAN
            # --------------------------------------------------

            scan.status = "COMPLETED"

            scan.risk_score = risk_score

            scan.risk_level = risk_level

            scan.threat_category = (
                threat_category
            )

            scan.confidence = int(
                result.confidence
            )

            scan.verdict = result.verdict

            scan.analysis_details = (
                result.evidence
            )

            scan.error_message = None

            scan.completed_at = (
                datetime.now(timezone.utc)
            )

            # --------------------------------------------------
            # SAVE INDICATORS
            # --------------------------------------------------

            save_indicators(
                db=db,
                scan_id=scan.id,
                indicators=url_indicators,
                default_source="LIVE_URL_ANALYZER",
            )

            db.commit()
            db.refresh(scan)

        except Exception as error:

            db.rollback()

            mark_scan_failed(
                db=db,
                scan=scan,
                error=error,
            )

            print(
                "URL analysis failed:",
                error,
            )

    # ======================================================
    # MESSAGE ANALYSIS
    # ======================================================

    elif request.input_type == InputType.MESSAGE:

        try:

            # --------------------------------------------------
            # REAL NLP ANALYZER
            # --------------------------------------------------

            result = analyze_message(
                content
            )

            # --------------------------------------------------
            # NORMALIZE NLP RESULT
            # --------------------------------------------------

            nlp_result = {
                "ml_probability": result[
                    "ml_probability"
                ],
                "behavioral_score": result[
                    "behavioral_score"
                ],
                "scam_category": result[
                    "scam_category"
                ],
                "category_confidence": result[
                    "category_confidence"
                ],
                "indicators": result.get(
                    "indicators",
                    [],
                ),
            }

            # --------------------------------------------------
            # MASTER RISK ENGINE
            # --------------------------------------------------

            risk_result = calculate_final_score(
                nlp_result=nlp_result
            )

            # --------------------------------------------------
            # UPDATE SCAN
            # --------------------------------------------------

            scan.status = "COMPLETED"

            scan.risk_score = int(
                risk_result["risk_score"]
            )

            scan.risk_level = (
                risk_result["risk_level"]
            )

            scan.threat_category = (
                result["scam_category"]
            )

            # --------------------------------------------------
            # CONFIDENCE
            # --------------------------------------------------

            scan.confidence = (
                calculate_combined_confidence(
                    ml_probability=result[
                        "ml_probability"
                    ],
                    category_confidence=result[
                        "category_confidence"
                    ],
                )
            )

            scan.error_message = None

            scan.completed_at = (
                datetime.now(timezone.utc)
            )

            # --------------------------------------------------
            # SAVE NLP INDICATORS
            # --------------------------------------------------

            save_indicators(
                db=db,
                scan_id=scan.id,
                indicators=risk_result.get(
                    "indicators",
                    [],
                ),
                default_source="NLP_ANALYZER",
            )

            db.commit()
            db.refresh(scan)

        except Exception as error:

            db.rollback()

            mark_scan_failed(
                db=db,
                scan=scan,
                error=error,
            )

            print(
                "NLP message analysis failed:",
                error,
            )

    # ======================================================
    # EMAIL ANALYSIS
    # ======================================================

    elif request.input_type == InputType.EMAIL:

        try:

            # --------------------------------------------------
            # REAL EMAIL INTELLIGENCE
            #
            # Email analyzer combines:
            #   - email parsing
            #   - NLP analysis
            #   - URL analysis
            #   - cross-signal assessment
            # --------------------------------------------------

            result = analyze_email(
                content
            )

            # --------------------------------------------------
            # UPDATE SCAN
            # --------------------------------------------------

            scan.status = "COMPLETED"

            scan.risk_score = int(
                result["risk_score"]
            )

            scan.risk_level = (
                result["risk_level"]
            )

            scan.threat_category = (
                result["threat_category"]
            )

            scan.confidence = int(
                result["confidence"]
            )

            scan.error_message = None

            scan.completed_at = (
                datetime.now(timezone.utc)
            )

            # --------------------------------------------------
            # SAVE EMAIL INDICATORS
            # --------------------------------------------------

            save_indicators(
                db=db,
                scan_id=scan.id,
                indicators=result.get(
                    "indicators",
                    [],
                ),
                default_source="EMAIL_ANALYZER",
            )

            db.commit()
            db.refresh(scan)

        except Exception as error:

            db.rollback()

            mark_scan_failed(
                db=db,
                scan=scan,
                error=error,
            )

            print(
                "Email analysis failed:",
                error,
            )

    # ======================================================
    # UNKNOWN INPUT TYPE
    # ======================================================

    else:

        mark_scan_failed(
            db=db,
            scan=scan,
            error=ValueError(
                "Unsupported analysis input type."
            ),
        )

    return scan


# ==========================================================
# MARK SCAN FAILED
# ==========================================================


def mark_scan_failed(
    db: Session,
    scan: Scan,
    error: Exception,
) -> None:

    scan.status = "FAILED"

    scan.risk_score = None

    scan.risk_level = None

    scan.threat_category = None

    scan.confidence = None

    scan.verdict = None

    scan.analysis_details = None

    scan.error_message = str(error)[:1000]

    scan.completed_at = (
        datetime.now(timezone.utc)
    )

    db.add(scan)

    db.commit()

    db.refresh(scan)


# ==========================================================
# INDICATOR PERSISTENCE
# ==========================================================


def save_indicators(
    db: Session,
    scan_id: int,
    indicators: list,
    default_source: str,
) -> None:

    for indicator in indicators:

        if isinstance(
            indicator,
            dict,
        ):

            indicator_type = indicator.get(
                "indicator_type",
                indicator.get(
                    "type",
                    "UNKNOWN",
                ),
            )

            name = indicator.get(
                "name",
                "Security Indicator",
            )

            description = indicator.get(
                "description",
                "",
            )

            severity = indicator.get(
                "severity",
                "INFO",
            )

            try:

                score = int(
                    indicator.get(
                        "score",
                        0,
                    )
                )

            except (
                TypeError,
                ValueError,
            ):

                score = 0

            source = indicator.get(
                "source",
                default_source,
            )

        else:

            indicator_type = getattr(
                indicator,
                "indicator_type",
                "UNKNOWN",
            )

            name = getattr(
                indicator,
                "name",
                "Security Indicator",
            )

            description = getattr(
                indicator,
                "description",
                "",
            )

            severity = getattr(
                indicator,
                "severity",
                "INFO",
            )

            try:

                score = int(
                    getattr(
                        indicator,
                        "score",
                        0,
                    )
                )

            except (
                TypeError,
                ValueError,
            ):

                score = 0

            source = getattr(
                indicator,
                "source",
                default_source,
            )

        threat_indicator = ThreatIndicator(
            scan_id=scan_id,
            indicator_type=str(
                indicator_type
            ),
            name=str(
                name
            ),
            description=(
                str(description)
                if description is not None
                else ""
            ),
            severity=str(
                severity
            ),
            score=score,
            source=str(
                source
            ),
        )

        db.add(
            threat_indicator
        )


# ==========================================================
# CONFIDENCE
# ==========================================================


def calculate_confidence(
    ml_probability: float,
    final_score: int,
) -> int:

    probability = float(
        ml_probability
    )

    # Support both:
    # 0.0 - 1.0
    # and
    # 0 - 100

    if probability > 1:

        probability /= 100

    probability = max(
        0.0,
        min(
            1.0,
            probability,
        ),
    )

    probability_confidence = (
        abs(
            probability - 0.5
        )
        * 2
        * 100
    )

    score_confidence = (
        abs(
            final_score - 50
        )
        * 2
    )

    confidence = (
        probability_confidence * 0.7
        +
        score_confidence * 0.3
    )

    return max(
        0,
        min(
            100,
            round(confidence),
        ),
    )


# ==========================================================
# MESSAGE CONFIDENCE
# ==========================================================


def calculate_combined_confidence(
    ml_probability: float,
    category_confidence: float,
) -> int:

    probability = float(
        ml_probability
    )

    category = float(
        category_confidence
    )

    # Support probability in either
    # 0-1 or 0-100 format.

    if probability <= 1:

        probability *= 100

    probability = max(
        0,
        min(
            100,
            probability,
        ),
    )

    category = max(
        0,
        min(
            100,
            category,
        ),
    )

    confidence = (
        probability * 0.7
        +
        category * 0.3
    )

    return max(
        0,
        min(
            100,
            round(confidence),
        ),
    )


# ==========================================================
# URL THREAT CATEGORY
# ==========================================================


def determine_url_threat_category(
    url: str,
    result,
    final_score: int,
) -> str:

    url_lower = url.lower()

    indicators = getattr(
        result,
        "indicators",
        [],
    )

    risk_level = str(
        getattr(
            result,
            "risk_level",
            "",
        )
        or ""
    ).upper()

    # ------------------------------------------------------
    # ANALYSIS INCOMPLETE / UNKNOWN
    # ------------------------------------------------------

    # This MUST happen before score-only classification.
    #
    # A low numerical score does not mean LOW_RISK_URL
    # when important live evidence could not be collected.

    if risk_level == "UNKNOWN":

        return "ANALYSIS_INCOMPLETE"


    # ------------------------------------------------------
    # CONFIRMED MALICIOUS
    # ------------------------------------------------------

    if risk_level == "CRITICAL":

        return "CONFIRMED_MALICIOUS_URL"


    # ------------------------------------------------------
    # IP-BASED THREAT
    # ------------------------------------------------------

    for indicator in indicators:

        if isinstance(
            indicator,
            dict,
        ):

            name = indicator.get(
                "name",
                "",
            )

        else:

            name = getattr(
                indicator,
                "name",
                "",
            )

        if name == "IP-Based URL":

            return "IP_BASED_THREAT"


    # ------------------------------------------------------
    # BANKING PHISHING
    # ------------------------------------------------------

    banking_keywords = [
        "bank",
        "banking",
        "account",
        "payment",
        "credit",
        "debit",
    ]

    if any(
        keyword in url_lower
        for keyword in banking_keywords
    ):

        return "BANKING_PHISHING"


    # ------------------------------------------------------
    # CREDENTIAL PHISHING
    # ------------------------------------------------------

    credential_keywords = [
        "login",
        "signin",
        "sign-in",
        "verify",
        "verification",
        "password",
        "credential",
        "authenticate",
    ]

    if any(
        keyword in url_lower
        for keyword in credential_keywords
    ):

        return "CREDENTIAL_PHISHING"


    # ------------------------------------------------------
    # PRIZE / REWARD SCAM
    # ------------------------------------------------------

    prize_keywords = [
        "prize",
        "reward",
        "winner",
        "claim",
        "bonus",
        "gift",
    ]

    if any(
        keyword in url_lower
        for keyword in prize_keywords
    ):

        return "PRIZE_SCAM"


    # ------------------------------------------------------
    # KYC
    # ------------------------------------------------------

    if "kyc" in url_lower:

        return "KYC_SCAM"


    # ------------------------------------------------------
    # URL SHORTENER
    # ------------------------------------------------------

    for indicator in indicators:

        if isinstance(
            indicator,
            dict,
        ):

            name = indicator.get(
                "name",
                "",
            )

        else:

            name = getattr(
                indicator,
                "name",
                "",
            )

        if name == "URL Shortener Detected":

            return "SHORTENED_URL"


    # ------------------------------------------------------
    # GENERIC HIGH RISK URL
    # ------------------------------------------------------

    if risk_level == "HIGH":

        return "SUSPICIOUS_URL"


    # ------------------------------------------------------
    # GENERIC MEDIUM RISK URL
    # ------------------------------------------------------

    if risk_level == "MEDIUM":

        return "POTENTIALLY_RISKY_URL"


    # ------------------------------------------------------
    # GENERIC LOW RISK URL
    # ------------------------------------------------------

    if risk_level == "LOW":

        return "LOW_RISK_URL"


    # ------------------------------------------------------
    # SAFE FALLBACK
    # ------------------------------------------------------

    # Do not silently classify an unknown future risk
    # level as LOW_RISK_URL.

    return "ANALYSIS_INCOMPLETE"


# ==========================================================
# USER SCAN RETRIEVAL
# ==========================================================


def get_user_scan(
    db: Session,
    user: User,
    scan_id: int,
) -> Scan | None:

    statement = (
        select(Scan)
        .where(
            Scan.id == scan_id,
            Scan.user_id == user.id,
        )
    )

    return db.scalar(
        statement
    )


def get_user_scans(
    db: Session,
    user: User,
    risk_level: str | None = None,
) -> list[Scan]:

    statement = (
        select(Scan)
        .where(
            Scan.user_id == user.id
        )
    )

    if risk_level:

        statement = statement.where(
            Scan.risk_level
            ==
            risk_level.upper()
        )

    statement = statement.order_by(
        Scan.created_at.desc()
    )

    return list(
        db.scalars(
            statement
        ).all()
    )


# ==========================================================
# DELETE USER SCAN
# ==========================================================


def delete_user_scan(
    db: Session,
    user: User,
    scan_id: int,
) -> bool:

    scan = get_user_scan(
        db=db,
        user=user,
        scan_id=scan_id,
    )

    if scan is None:

        return False

    db.delete(scan)

    db.commit()

    return True