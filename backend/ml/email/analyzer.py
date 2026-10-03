from ml.email.parser import parse_email
from ml.nlp.analyzer import analyze_message
from app.intelligence.url_risk_engine import analyze_url_hybrid


def analyze_email(raw_email: str) -> dict:
    """
    Analyze a raw RFC-style email using the existing
    CyberShield NLP and URL intelligence pipelines.

    Pipeline:
        raw email
            ↓
        email parser
            ↓
        subject + body NLP
            ↓
        extracted URL intelligence
            ↓
        cross-signal risk assessment
    """

    if not raw_email or not raw_email.strip():
        raise ValueError("Email content cannot be empty.")

    # --------------------------------------------------
    # EMAIL PARSING
    # --------------------------------------------------

    parsed = parse_email(raw_email)

    subject = (
        parsed.get("subject") or ""
    ).strip()

    body = (
        parsed.get("body") or ""
    ).strip()

    # --------------------------------------------------
    # NLP INPUT
    #
    # Subject and body are both meaningful evidence.
    # Do not call the NLP model with an empty string.
    # --------------------------------------------------

    nlp_parts = []

    if subject:
        nlp_parts.append(subject)

    if body:
        nlp_parts.append(body)

    nlp_text = "\n".join(
        nlp_parts
    ).strip()

    if not nlp_text:
        raise ValueError(
            "Email contains no analyzable subject or body."
        )

    nlp_result = analyze_message(
        nlp_text
    )

    # --------------------------------------------------
    # URL ANALYSIS
    # --------------------------------------------------

    url_results = []

    for url in parsed.get("urls", []):

        if not url:
            continue

        result = analyze_url_hybrid(
            url
        )

        url_results.append({
            "url": url,
            "result": result,
        })

    # --------------------------------------------------
    # CROSS-SIGNAL RISK
    # --------------------------------------------------

    scores = [
        int(
            nlp_result["risk_score"]
        )
    ]

    for item in url_results:

        scores.append(
            int(
                item["result"].final_score
            )
        )

    highest_score = max(scores)

    # Both independent intelligence layers
    # identify meaningful risk.
    cross_signal_bonus = 0

    if (
        nlp_result["risk_score"] >= 40
        and any(
            item["result"].final_score >= 40
            for item in url_results
        )
    ):
        cross_signal_bonus = 10

    final_score = min(
        100,
        highest_score + cross_signal_bonus
    )

    if final_score >= 70:
        risk_level = "HIGH"

    elif final_score >= 40:
        risk_level = "MEDIUM"

    else:
        risk_level = "LOW"

    # --------------------------------------------------
    # COMBINED INDICATORS
    # --------------------------------------------------

    indicators = []

    # NLP indicators
    for indicator in nlp_result.get(
        "indicators",
        []
    ):

        indicators.append({

            "indicator_type":
                indicator.get(
                    "type",
                    "NLP"
                ),

            "name":
                indicator.get(
                    "name",
                    "NLP Indicator"
                ),

            "description":
                indicator.get(
                    "description",
                    ""
                ),

            "severity":
                indicator.get(
                    "severity",
                    "INFO"
                ),

            "score":
                int(
                    indicator.get(
                        "score",
                        0
                    )
                ),

            "source":
                indicator.get(
                    "source",
                    "NLP_ANALYZER"
                ),
        })

    # URL indicators
    for item in url_results:

        url = item["url"]
        result = item["result"]

        for indicator in result.indicators:

            if isinstance(
                indicator,
                dict
            ):

                indicator_type = (
                    indicator.get(
                        "indicator_type",
                        indicator.get(
                            "type",
                            "URL"
                        )
                    )
                )

                name = (
                    indicator.get(
                        "name",
                        "URL Security Indicator"
                    )
                )

                description = (
                    indicator.get(
                        "description",
                        ""
                    )
                )

                severity = (
                    indicator.get(
                        "severity",
                        "INFO"
                    )
                )

                score = int(
                    indicator.get(
                        "score",
                        0
                    )
                )

                source = (
                    indicator.get(
                        "source",
                        "URL_RISK_ENGINE"
                    )
                )

            else:

                indicator_type = getattr(
                    indicator,
                    "indicator_type",
                    "URL"
                )

                name = getattr(
                    indicator,
                    "name",
                    "URL Security Indicator"
                )

                description = getattr(
                    indicator,
                    "description",
                    ""
                )

                severity = getattr(
                    indicator,
                    "severity",
                    "INFO"
                )

                score = int(
                    getattr(
                        indicator,
                        "score",
                        0
                    )
                )

                source = getattr(
                    indicator,
                    "source",
                    "URL_RISK_ENGINE"
                )

            indicators.append({

                "indicator_type":
                    indicator_type,

                "name":
                    name,

                "description":
                    f"{description} "
                    f"(URL: {url})".strip(),

                "severity":
                    severity,

                "score":
                    score,

                "source":
                    source,
            })

    # --------------------------------------------------
    # EMAIL-LEVEL THREAT CATEGORY
    # --------------------------------------------------

    threat_category = (
        nlp_result.get(
            "scam_category",
            "OTHER"
        )
    )

    if threat_category == "OTHER":

        high_risk_urls = [
            item
            for item in url_results
            if item["result"].final_score >= 70
        ]

        if high_risk_urls:

            threat_category = (
                "MALICIOUS_URL_EMAIL"
            )

    # --------------------------------------------------
    # CONFIDENCE
    # --------------------------------------------------

    nlp_confidence = int(
        nlp_result.get(
            "category_confidence",
            0
        )
    )

    url_confidences = []

    for item in url_results:

        url_result = item["result"]

        probability = float(
            url_result.ml_probability
        )

        # Support both:
        # 0.0 - 1.0
        # and
        # 0 - 100
        if probability <= 1:
            probability *= 100

        probability = max(
            0,
            min(
                100,
                probability
            )
        )

        url_confidences.append(
            round(
                abs(
                    probability - 50
                ) * 2
            )
        )

    evidence_confidences = [
        nlp_confidence
    ] + url_confidences

    confidence = round(
        sum(
            evidence_confidences
        ) / len(
            evidence_confidences
        )
    )

    return {

        "sender":
            parsed.get(
                "sender_address",
                ""
            ),

        "recipient":
            parsed.get(
                "recipient_address",
                ""
            ),

        "subject":
            subject,

        "body":
            body,

        "urls":
            parsed.get(
                "urls",
                []
            ),

        "nlp":
            nlp_result,

        "url_results":
            url_results,

        "risk_score":
            final_score,

       

        "risk_level":
            risk_level,

        "threat_category":
            threat_category,

        "confidence":
            confidence,

        "indicators":
            indicators,
    }