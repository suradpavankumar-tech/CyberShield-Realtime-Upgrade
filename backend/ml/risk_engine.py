from typing import Any


# ============================================================
# CyberShield Master Risk Engine
# ============================================================
#
# This module does NOT invent threat intelligence.
#
# It only combines evidence already produced by CyberShield's
# URL and NLP analysis layers.
#
# Every component is capped so that one signal cannot
# automatically dominate the entire decision.
# ============================================================


def clamp_score(value: float) -> int:

    return max(
        0,
        min(
            100,
            round(value)
        )
    )


def get_risk_level(
    score: int
) -> str:

    if score >= 70:
        return "HIGH"

    if score >= 40:
        return "MEDIUM"

    return "LOW"


def normalize_ml_score(
    value: Any
) -> float:

    if value is None:
        return 0.0

    try:
        value = float(value)
    except (
        TypeError,
        ValueError
    ):
        return 0.0

    return max(
        0.0,
        min(
            100.0,
            value
        )
    )


def analyze_url_evidence(
    url_result: dict
) -> dict:

    ml_probability = normalize_ml_score(
        url_result.get(
            "ml_probability",
            url_result.get(
                "phishing_probability",
                0
            )
        )
    )

    rule_score = normalize_ml_score(
        url_result.get(
            "rule_score",
            0
        )
    )

    trusted_domain = bool(
        url_result.get(
            "trusted_domain",
            False
        )
    )

    brand_match = bool(
        url_result.get(
            "brand_match",
            False
        )
    )

    # --------------------------------------------------------
    # URL evidence
    #
    # ML contributes up to 55 points.
    # Rule engine contributes up to 35 points.
    # Trust evidence can reduce the score.
    # --------------------------------------------------------

    ml_component = (
        ml_probability * 0.55
    )

    rule_component = (
        rule_score * 0.35
    )

    score = (
        ml_component
        + rule_component
    )

    # A trusted registered domain is strong contextual
    # evidence, but it must not blindly override other
    # security evidence.
    if trusted_domain:

        score -= 30

    # Brand match by itself is NOT evidence that the URL
    # is legitimate. It is only contextual information.
    #
    # Therefore we intentionally do not subtract points
    # merely because a brand name was detected.

    score = clamp_score(
        score
    )

    return {

        "score": score,

        "ml_probability":
            round(
                ml_probability,
                2
            ),

        "rule_score":
            round(
                rule_score
            ),

        "trusted_domain":
            trusted_domain,

        "brand_match":
            brand_match,
    }


def analyze_nlp_evidence(
    nlp_result: dict
) -> dict:

    ml_probability = normalize_ml_score(
        nlp_result.get(
            "ml_probability",
            nlp_result.get(
                "phishing_probability",
                0
            )
        )
    )

    behavioral_score = normalize_ml_score(
        nlp_result.get(
            "behavioral_score",
            0
        )
    )

    category_confidence = normalize_ml_score(
        nlp_result.get(
            "category_confidence",
            0
        )
    )

    category = nlp_result.get(
        "scam_category",
        "OTHER"
    )

    # --------------------------------------------------------
    # NLP evidence
    #
    # ML = 50%
    # Behavioral evidence = 25%
    # Category evidence = 25%
    # --------------------------------------------------------

    ml_component = (
        ml_probability * 0.50
    )

    behavioral_component = (
        behavioral_score * 0.25
    )

    category_component = 0

    if category != "OTHER":

        category_component = (
            category_confidence * 0.25
        )

    score = (
        ml_component
        + behavioral_component
        + category_component
    )

    score = clamp_score(
        score
    )

    return {

        "score": score,

        "ml_probability":
            round(
                ml_probability,
                2
            ),

        "behavioral_score":
            round(
                behavioral_score
            ),

        "category":
            category,

        "category_confidence":
            round(
                category_confidence
            ),
    }


def collect_indicators(
    url_result: dict | None,
    nlp_result: dict | None
) -> list[dict]:

    indicators = []

    # --------------------------------------------------------
    # URL indicators
    # --------------------------------------------------------

    if url_result:

        for indicator in url_result.get(
            "indicators",
            []
        ):

            if isinstance(
                indicator,
                dict
            ):

                indicators.append(
                    indicator
                )

            else:

                indicators.append({

                    "type":
                        "URL_SIGNAL",

                    "severity":
                        "INFO",

                    "name":
                        str(indicator),

                    "description":
                        "URL security signal detected.",

                    "score":
                        0,

                    "source":
                        "URL_RULE_ENGINE",
                })

    # --------------------------------------------------------
    # NLP indicators
    # --------------------------------------------------------

    if nlp_result:

        for indicator in nlp_result.get(
            "indicators",
            []
        ):

            if isinstance(
                indicator,
                dict
            ):

                indicators.append(
                    indicator
                )

    return indicators


def determine_threat_category(
    url_result: dict | None,
    nlp_result: dict | None
) -> str:

    # Message category has priority when explicitly detected.

    if nlp_result:

        category = nlp_result.get(
            "scam_category"
        )

        if (
            category
            and category != "OTHER"
        ):

            return category

    # URL engine may already provide a category.

    if url_result:

        category = url_result.get(
            "threat_category"
        )

        if category:

            return category

    return "UNKNOWN"


def calculate_final_score(
    url_result: dict | None = None,
    nlp_result: dict | None = None
) -> dict:

    url_evidence = None
    nlp_evidence = None

    if url_result:

        url_evidence = (
            analyze_url_evidence(
                url_result
            )
        )

    if nlp_result:

        nlp_evidence = (
            analyze_nlp_evidence(
                nlp_result
            )
        )

    # --------------------------------------------------------
    # Determine which evidence sources actually exist.
    #
    # We DO NOT average missing sources as zero.
    # That would artificially reduce the risk score.
    # --------------------------------------------------------

    evidence_scores = []

    if url_evidence is not None:

        evidence_scores.append(
            (
                "URL",
                url_evidence["score"]
            )
        )

    if nlp_evidence is not None:

        evidence_scores.append(
            (
                "NLP",
                nlp_evidence["score"]
            )
        )

    if not evidence_scores:

        raise ValueError(
            "At least one analysis result "
            "is required."
        )

    # --------------------------------------------------------
    # Multi-source fusion
    #
    # If both URL and NLP evidence exist, the stronger source
    # contributes more, while the weaker source still matters.
    # --------------------------------------------------------

    if (
        url_evidence is not None
        and nlp_evidence is not None
    ):

        final_score = (
            url_evidence["score"] * 0.55
            + nlp_evidence["score"] * 0.45
        )

    else:

        final_score = evidence_scores[0][1]

    final_score = clamp_score(
        final_score
    )

    risk_level = get_risk_level(
        final_score
    )

    indicators = collect_indicators(
        url_result,
        nlp_result
    )

    category = determine_threat_category(
        url_result,
        nlp_result
    )

    # --------------------------------------------------------
    # Evidence summary
    # --------------------------------------------------------

    evidence = {}

    if url_evidence:

        evidence["url"] = (
            url_evidence
        )

    if nlp_evidence:

        evidence["nlp"] = (
            nlp_evidence
        )

    return {

        "risk_score":
            final_score,

        "risk_level":
            risk_level,

        "threat_category":
            category,

        "indicators":
            indicators,

        "evidence":
            evidence,
    }