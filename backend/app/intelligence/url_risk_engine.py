from dataclasses import dataclass

from app.intelligence.domain_intelligence import analyze_domain
from app.intelligence.live_url_intelligence import (
    TRUSTED_DOMAINS,
    analyze_live_url,
)
from app.intelligence.url_analyzer import analyze_url
from ml.url.predict import get_url_predictor


@dataclass
class HybridRiskResult:
    url: str
    normalized_url: str
    ml_probability: float
    rule_score: int
    domain_trust: bool
    brand_match: bool
    final_score: int
    risk_level: str
    verdict: str
    confidence: int
    indicators: list
    domain_notes: list
    evidence: dict


def determine_risk_level(
    score: int,
    confirmed_malicious: bool = False,
    analysis_incomplete: bool = False,
) -> str:
    """
    Determine the final risk level.

    Priority:
    1. Confirmed malicious evidence -> CRITICAL
    2. Strong aggregate score -> HIGH
    3. Medium aggregate score -> MEDIUM
    4. Insufficient live evidence -> UNKNOWN
    5. Otherwise -> LOW

    Important:
    UNKNOWN means the system could not collect enough reliable
    evidence to make a confident safety assessment.

    UNKNOWN does NOT mean malicious.
    UNKNOWN does NOT mean safe.
    """
    if confirmed_malicious:
        return "CRITICAL"

    if score >= 75:
        return "HIGH"

    if score >= 45:
        return "MEDIUM"

    if analysis_incomplete:
        return "UNKNOWN"

    return "LOW"


def _indicator(
    name,
    description,
    severity,
    score,
    source="LIVE_URL_ANALYZER",
    indicator_type="LIVE",
):
    return {
        "indicator_type": indicator_type,
        "type": indicator_type,
        "name": name,
        "description": description,
        "severity": severity,
        "score": score,
        "source": source,
    }


def _confidence(
    live: dict,
    ml_probability: float,
    final_score: int,
) -> int:
    """
    Confidence represents evidence coverage and agreement.

    It is intentionally separate from the risk score.

    Missing optional reputation data reduces confidence,
    but does not automatically make the analysis UNKNOWN.
    """
    checks = []

    dns = live.get("dns", {})

    checks.append(
        dns.get("status")
        in {"RESOLVED", "BLOCKED", "FAILED"}
    )

    checks.append(live.get("tls") is not None)

    http = live.get("http")
    checks.append(http is not None)

    rep = live.get("reputation", {})
    checks.append(rep.get("status") == "AVAILABLE")

    checks.append(
        bool(live.get("registered_domain"))
    )

    checks.append(
        "impersonation" in live
    )

    coverage = sum(checks) / len(checks)

    # Confidence reflects evidence coverage and agreement,
    # not the ML score itself.
    ml_signal = ml_probability * 100

    disagreement = min(
        8,
        abs(ml_signal - final_score) * 0.08,
    )

    confidence = (
        45
        + coverage * 50
        - disagreement
    )

    if live.get("registered_domain") in TRUSTED_DOMAINS:
        confidence += 6

    if rep.get("status") != "AVAILABLE":
        confidence = min(confidence, 86)

    return max(
        20,
        min(98, round(confidence)),
    )


def analyze_url_hybrid(url: str) -> HybridRiskResult:
    """
    Main CyberShield URL intelligence pipeline.

    Pipeline:

        URL
         ↓
        ML prediction
         ↓
        URL lexical analysis
         ↓
        Domain intelligence
         ↓
        Live DNS/TLS/HTTP analysis
         ↓
        Redirect analysis
         ↓
        Reputation / Threat Intelligence
         ↓
        Signal correlation
         ↓
        Final risk score
         ↓
        Risk level + verdict + confidence
    """

    # ---------------------------------------------------------
    # 1. MACHINE LEARNING SIGNAL
    # ---------------------------------------------------------

    predictor = get_url_predictor()

    ml_result = predictor.predict(url)

    ml_probability = float(
        ml_result.get(
            "phishing_probability",
            0.0,
        )
    )

    if ml_probability > 1:
        ml_probability /= 100


    # ---------------------------------------------------------
    # 2. URL ANALYSIS
    # ---------------------------------------------------------

    rule_result = analyze_url(url)


    # ---------------------------------------------------------
    # 3. DOMAIN INTELLIGENCE
    # ---------------------------------------------------------

    domain_result = analyze_domain(
        rule_result.normalized_url
    )


    # ---------------------------------------------------------
    # 4. LIVE URL INTELLIGENCE
    # ---------------------------------------------------------

    live = analyze_live_url(
        rule_result.normalized_url,
        {
            "domain": domain_result.domain,
        },
    )


    # ---------------------------------------------------------
    # 5. DOMAIN IMPERSONATION
    # ---------------------------------------------------------

    # Make live/domain intelligence authoritative about
    # the actual registered domain.

    impersonation = live.get(
        "impersonation",
        {},
    )

    domain_result.impersonation_suspected = bool(
        impersonation.get("detected")
    )

    domain_result.impersonation_matches = (
        impersonation.get("matches", [])
    )


    # ---------------------------------------------------------
    # 6. INITIAL INDICATORS
    # ---------------------------------------------------------

    indicators = []

    for item in rule_result.indicators:
        indicators.append(item)


    # ---------------------------------------------------------
    # 7. TRUSTED DOMAIN SIGNAL
    # ---------------------------------------------------------

    if domain_result.known_trusted:

        indicators.append(
            _indicator(
                "Exact Trusted Domain Match",
                (
                    f"The registered domain "
                    f"{domain_result.domain} exactly matches "
                    "CyberShield's trusted-domain registry."
                ),
                "INFO",
                0,
                "DOMAIN_INTELLIGENCE",
                "DOMAIN",
            )
        )


    # ---------------------------------------------------------
    # 8. BRAND IMPERSONATION
    # ---------------------------------------------------------

    if (
        domain_result.impersonation_suspected
        and not domain_result.known_trusted
    ):

        brands = ", ".join(
            m["brand"]
            for m in (
                domain_result.impersonation_matches
                or []
            )[:3]
        )

        indicators.append(
            _indicator(
                "Possible Brand Impersonation",
                (
                    "The registered domain resembles or "
                    "contains a protected brand name "
                    f"({brands}). This is a risk signal, "
                    "not proof of maliciousness."
                ),
                "HIGH",
                25,
                "DOMAIN_INTELLIGENCE",
                "IMPERSONATION",
            )
        )


    # ---------------------------------------------------------
    # 9. DNS ANALYSIS
    # ---------------------------------------------------------

    dns = live.get(
        "dns",
        {},
    )

    if dns.get("status") == "RESOLVED":

        addresses = dns.get(
            "addresses",
            [],
        )

        indicators.append(
            _indicator(
                "DNS Resolution Successful",
                (
                    "The hostname resolved to "
                    f"{', '.join(addresses[:3])}."
                ),
                "INFO",
                0,
                "DNS",
                "NETWORK",
            )
        )

    elif dns.get("status") == "BLOCKED":

        indicators.append(
            _indicator(
                "Unsafe Network Target Blocked",
                (
                    "The analyzer refused to connect "
                    "because DNS returned a private or "
                    "otherwise non-public address."
                ),
                "HIGH",
                0,
                "SSRF_GUARD",
                "SECURITY",
            )
        )


    # ---------------------------------------------------------
    # 10. TLS ANALYSIS
    # ---------------------------------------------------------

    tls = live.get("tls") or {}

    if rule_result.scheme == "https":

        if tls.get("status") == "VALID":

            indicators.append(
                _indicator(
                    "TLS Certificate Verified",
                    (
                        "The HTTPS connection completed "
                        "certificate verification successfully."
                    ),
                    "INFO",
                    0,
                    "TLS",
                    "SECURITY",
                )
            )

        elif tls.get("status") == "INVALID":

            indicators.append(
                _indicator(
                    "TLS Verification Failed",
                    (
                        tls.get("error")
                        or
                        "The TLS certificate could not "
                        "be verified."
                    ),
                    "MEDIUM",
                    8,
                    "TLS",
                    "SECURITY",
                )
            )


    # ---------------------------------------------------------
    # 11. HTTP ANALYSIS
    # ---------------------------------------------------------

    http = live.get("http") or {}

    if (
        http.get("status") == "COMPLETED"
        and http.get("chain")
    ):

        last = http["chain"][-1]

        indicators.append(
            _indicator(
                "HTTP Response Observed",
                (
                    f"Final HTTP response: "
                    f"{last.get('status_code')} "
                    f"{last.get('reason') or ''}"
                ).strip(),
                "INFO",
                0,
                "HTTP",
                "NETWORK",
            )
        )


    # ---------------------------------------------------------
    # 12. REDIRECT ANALYSIS
    # ---------------------------------------------------------

    redirects = live.get(
        "redirects",
        {},
    )

    if redirects.get("cross_domain"):

        indicators.append(
            _indicator(
                "Cross-Domain Redirect",
                (
                    f"The URL ultimately redirected "
                    f"from {domain_result.domain} to "
                    f"{redirects.get('final_registered_domain')}."
                ),
                "MEDIUM",
                15,
                "REDIRECT_ANALYZER",
                "REDIRECT",
            )
        )


    # ---------------------------------------------------------
    # 13. THREAT INTELLIGENCE / REPUTATION
    # ---------------------------------------------------------

    reputation = live.get(
        "reputation",
        {},
    )

    confirmed_malicious = (
        reputation.get("status") == "AVAILABLE"
        and
        reputation.get("verdict") == "MALICIOUS"
    )


    if reputation.get("status") == "AVAILABLE":

        if confirmed_malicious:

            indicators.append(
                _indicator(
                    "Threat Intelligence: Malicious",
                    (
                        "VirusTotal reported "
                        f"{reputation.get('malicious', 0)} "
                        "malicious engine detections."
                    ),
                    "CRITICAL",
                    70,
                    "VirusTotal",
                    "THREAT_INTELLIGENCE",
                )
            )

        elif reputation.get("verdict") == "SUSPICIOUS":

            indicators.append(
                _indicator(
                    "Threat Intelligence: Suspicious",
                    (
                        "VirusTotal reported "
                        f"{reputation.get('suspicious', 0)} "
                        "suspicious engine detections."
                    ),
                    "HIGH",
                    25,
                    "VirusTotal",
                    "THREAT_INTELLIGENCE",
                )
            )

        else:

            indicators.append(
                _indicator(
                    "Threat Intelligence: No Malicious Detections",
                    (
                        "The configured provider returned "
                        "no malicious detections for this URL "
                        "at scan time."
                    ),
                    "INFO",
                    0,
                    "VirusTotal",
                    "THREAT_INTELLIGENCE",
                )
            )


    # ---------------------------------------------------------
    # 14. MULTI-SIGNAL SCORING
    # ---------------------------------------------------------

    # ML and weak lexical heuristics are intentionally capped.

    score = ml_probability * 20

    score += (
        min(
            rule_result.rule_score,
            20,
        )
        * 0.75
    )


    # Trusted-domain evidence

    if domain_result.known_trusted:
        score -= 12


    # Valid TLS is a small positive signal only.
    # HTTPS does NOT prove that a website is safe.

    if tls.get("status") == "VALID":
        score -= 3


    # Plain HTTP is a weak negative signal.

    if rule_result.scheme == "http":
        score += 4


    # Brand impersonation is stronger evidence.

    if (
        domain_result.impersonation_suspected
        and not domain_result.known_trusted
    ):
        score += 35


    # Direct IP URL.

    if rule_result.features.get(
        "has_ip_address"
    ):
        score += 8


    # URL shortening.

    if rule_result.features.get(
        "is_shortened_url"
    ):
        score += 4


    # Cross-domain redirect.

    if redirects.get("cross_domain"):
        score += 15


    # Invalid TLS.

    if tls.get("status") == "INVALID":
        score += 8


    # Threat intelligence.

    if reputation.get("status") == "AVAILABLE":

        if confirmed_malicious:

            score += 70

        elif reputation.get("verdict") == "SUSPICIOUS":

            score += 25

        else:

            score -= 3


    # ---------------------------------------------------------
    # 15. FINAL SCORE
    # ---------------------------------------------------------

    # Strong evidence can dominate weak evidence.
    # ML alone cannot create CRITICAL.

    final_score = max(
        0,
        min(
            100,
            round(score),
        ),
    )


    # Brand impersonation should produce at least
    # a meaningful medium-level score.

    if (
        domain_result.impersonation_suspected
        and not domain_result.known_trusted
    ):

        final_score = max(
            final_score,
            45
            if ml_probability < 0.70
            else 50,
        )


    # ---------------------------------------------------------
    # 16. ANALYSIS COMPLETENESS
    # ---------------------------------------------------------

    dns_status = (
        live.get("dns") or {}
    ).get("status")

    tls_status = (
        live.get("tls") or {}
    ).get("status")

    http_available = (
        live.get("http") is not None
    )

    reputation_status = (
        live.get("reputation") or {}
    ).get("status")


    analysis_incomplete = False

    incomplete_reasons = []


    # DNS is a core prerequisite for public URL analysis.

    if dns_status not in {
        "RESOLVED",
        "BLOCKED",
    }:

        analysis_incomplete = True

        incomplete_reasons.append(
            "DNS resolution was unavailable."
        )


    # HTTPS requires TLS evidence.

    if (
        rule_result.scheme == "https"
        and tls_status is None
    ):

        analysis_incomplete = True

        incomplete_reasons.append(
            "TLS analysis was unavailable."
        )


    # If DNS resolved, HTTP analysis should normally
    # have been attempted.

    if (
        dns_status == "RESOLVED"
        and not http_available
    ):

        analysis_incomplete = True

        incomplete_reasons.append(
            "HTTP response analysis was unavailable."
        )


    # ---------------------------------------------------------
    # 17. ANALYSIS INCOMPLETE INDICATOR
    # ---------------------------------------------------------

    if incomplete_reasons:

        indicators.append(
            _indicator(
                "Analysis Incomplete",
                " ".join(incomplete_reasons),
                "MEDIUM",
                0,
                "LIVE_ANALYSIS",
                "ANALYSIS",
            )
        )


    # ---------------------------------------------------------
    # 18. FINAL RISK LEVEL
    # ---------------------------------------------------------

    risk_level = determine_risk_level(
        final_score,
        confirmed_malicious,
        analysis_incomplete=analysis_incomplete,
    )


    # ---------------------------------------------------------
    # 19. FINAL VERDICT
    # ---------------------------------------------------------

    if confirmed_malicious:

        verdict = "Malicious"

    elif risk_level == "HIGH":

        verdict = "High Risk"

    elif risk_level == "MEDIUM":

        verdict = (
            "Suspicious — further verification recommended"
        )

    elif risk_level == "UNKNOWN":

        if ml_probability >= 0.70:

            verdict = (
                "Analysis Incomplete — strong ML phishing "
                "signal detected, but independent live "
                "security evidence was unavailable"
            )

        else:

            verdict = (
                "Analysis Incomplete — insufficient live "
                "evidence to determine whether the URL is safe"
            )

    elif (
        domain_result.known_trusted
        and final_score <= 20
    ):

        verdict = (
            "Low Risk — evidence supports legitimacy, "
            "but HTTPS/reputation are not proof of safety"
        )

    elif reputation.get("status") != "AVAILABLE":

        verdict = (
            "Low Risk — no confirmed malicious evidence "
            "was available from the configured checks"
        )

    else:

        verdict = "Low Risk"


    # ---------------------------------------------------------
    # 20. CONFIDENCE
    # ---------------------------------------------------------

    confidence = _confidence(
        live,
        ml_probability,
        final_score,
    )


    # If analysis is incomplete, confidence should not
    # imply that the verdict is strongly established.

    if analysis_incomplete:

        confidence = min(
            confidence,
            70,
        )


    # ---------------------------------------------------------
    # 21. EVIDENCE OBJECT
    # ---------------------------------------------------------

    evidence = {

        "ml": {
            "prediction": ml_result.get(
                "prediction"
            ),
            "phishing_probability": round(
                ml_probability * 100,
                2,
            ),
            "model_features": ml_result.get(
                "features",
                {},
            ),
            "role": "signal_only",
        },

        "url": {
            "normalized_url": rule_result.normalized_url,
            "scheme": rule_result.scheme,
            "hostname": rule_result.hostname,
            "features": rule_result.features,
            "rule_score": rule_result.rule_score,
        },

        "domain": {
            "registered_domain": domain_result.domain,
            "subdomain": domain_result.subdomain,
            "trusted": domain_result.known_trusted,
            "brand_match": domain_result.brand_match,
            "impersonation": impersonation,
        },

        "live": live,

        "analysis_status": {
            "complete": not analysis_incomplete,
            "incomplete": analysis_incomplete,
            "reasons": incomplete_reasons,
            "dns_status": dns_status,
            "tls_status": tls_status,
            "http_available": http_available,
            "reputation_status": reputation_status,
        },

        "score_model": {
            "ml_weight_cap": 20,
            "heuristic_weight_cap": 15,
            "strong_evidence_overrides": True,
        },
    }


    # ---------------------------------------------------------
    # 22. RETURN RESULT
    # ---------------------------------------------------------

    return HybridRiskResult(
        url=url,
        normalized_url=rule_result.normalized_url,
        ml_probability=ml_probability,
        rule_score=rule_result.rule_score,
        domain_trust=domain_result.known_trusted,
        brand_match=domain_result.brand_match,
        final_score=final_score,
        risk_level=risk_level,
        verdict=verdict,
        confidence=confidence,
        indicators=indicators,
        domain_notes=domain_result.notes,
        evidence=evidence,
    )