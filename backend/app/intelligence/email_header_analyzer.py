from __future__ import annotations

import re
from email import policy
from email.parser import Parser

AUTH_KEYS = ("spf", "dkim", "dmarc")
ADDRESS_HEADERS = ("from", "to", "cc", "reply-to", "return-path", "message-id", "date")


def _domain(value: str | None) -> str | None:
    if not value:
        return None
    match = re.search(r"@([A-Za-z0-9.-]+)", value)
    return match.group(1).lower().rstrip(".") if match else None


def _auth_result(value: str, mechanism: str) -> str | None:
    match = re.search(rf"\b{re.escape(mechanism)}\s*=\s*([A-Za-z]+)", value, re.I)
    return match.group(1).lower() if match else None


def _normalise_header(value: str) -> str:
    return " ".join(value.split())


def _risk_level(score: int) -> str:
    if score >= 80:
        return "CRITICAL"
    if score >= 60:
        return "HIGH"
    if score >= 35:
        return "MEDIUM"
    return "LOW"


def analyze_email_headers(raw_headers: str) -> dict:
    if not raw_headers.strip():
        raise ValueError("Email headers cannot be empty.")

    # Parser is deliberately limited to headers: callers may pass a full .eml,
    # but only the message header block is used by this analyzer.
    message = Parser(policy=policy.default).parsestr(raw_headers)

    header_values: dict[str, str | list[str]] = {}
    for name in ADDRESS_HEADERS:
        values = message.get_all(name, [])
        if values:
            header_values[name] = (
                [_normalise_header(str(v)) for v in values]
                if len(values) > 1
                else _normalise_header(str(values[0]))
            )

    received = [_normalise_header(v) for v in message.get_all("received", [])]
    auth_results = [_normalise_header(v) for v in message.get_all("authentication-results", [])]

    from_domain = _domain(str(message.get("from", "")))
    reply_domain = _domain(str(message.get("reply-to", "")))
    return_domain = _domain(str(message.get("return-path", "")))
    message_id = str(message.get("message-id", "")).strip()
    message_id_domain = _domain(message_id)

    authentication = {
        "spf": None,
        "dkim": None,
        "dmarc": None,
    }
    for result in auth_results:
        for mechanism in AUTH_KEYS:
            parsed = _auth_result(result, mechanism)
            if parsed:
                authentication[mechanism] = parsed

    findings: list[dict] = []
    score = 0

    def add(code: str, severity: str, title: str, description: str, evidence: str | None, points: int):
        nonlocal score
        findings.append({
            "code": code,
            "severity": severity,
            "title": title,
            "description": description,
            "evidence": evidence,
            "score": points,
        })
        score += points

    if not from_domain:
        add(
            "MISSING_FROM_DOMAIN", "MEDIUM", "From domain is unavailable",
            "The From header does not expose a parseable sender domain.",
            str(message.get("from", "")) or None, 15,
        )

    if reply_domain and from_domain and reply_domain != from_domain:
        add(
            "REPLY_TO_MISMATCH", "HIGH", "Reply-To domain differs from From domain",
            "Replies would be directed to a different domain than the visible sender.",
            f"From={from_domain}; Reply-To={reply_domain}", 25,
        )

    if return_domain and from_domain and return_domain != from_domain:
        add(
            "RETURN_PATH_MISMATCH", "MEDIUM", "Return-Path differs from From domain",
            "The envelope return address uses a different domain. This can be legitimate for mailing services, so it is treated as supporting evidence only.",
            f"From={from_domain}; Return-Path={return_domain}", 12,
        )

    if message_id_domain and from_domain and message_id_domain != from_domain:
        add(
            "MESSAGE_ID_DOMAIN_MISMATCH", "MEDIUM", "Message-ID domain differs from From domain",
            "The Message-ID domain does not match the visible sender domain.",
            f"From={from_domain}; Message-ID={message_id_domain}", 10,
        )

    if len(received) == 0:
        add(
            "MISSING_RECEIVED_CHAIN", "MEDIUM", "No Received chain was supplied",
            "Without Received headers, routing provenance cannot be evaluated.",
            None, 10,
        )
    elif len(received) == 1:
        add(
            "LIMITED_RECEIVED_CHAIN", "INFO", "Only one Received hop is present",
            "A single hop limits provenance analysis but is not inherently malicious.",
            received[0], 3,
        )

    if not auth_results:
        add(
            "MISSING_AUTHENTICATION_RESULTS", "MEDIUM",
            "Authentication-Results is absent",
            "SPF, DKIM and DMARC outcomes could not be established from supplied headers.",
            None, 12,
        )
    else:
        for mechanism in AUTH_KEYS:
            outcome = authentication[mechanism]
            if outcome in {"fail", "softfail", "neutral", "temperror", "permerror"}:
                points = {"fail": 22, "softfail": 15, "neutral": 8, "temperror": 6, "permerror": 8}[outcome]
                add(
                    f"{mechanism.upper()}_{outcome.upper()}",
                    "HIGH" if outcome == "fail" else "MEDIUM",
                    f"{mechanism.upper()} result is {outcome}",
                    f"The supplied Authentication-Results reports {mechanism.upper()} as {outcome}.",
                    outcome,
                    points,
                )

    if authentication["dmarc"] == "pass" and authentication["spf"] == "pass":
        # Strong positive evidence should not erase other findings.
        score -= 8
    if authentication["dmarc"] == "fail" and authentication["dkim"] == "fail":
        add(
            "MULTI_AUTH_FAILURE",
            "CRITICAL",
            "Multiple authentication mechanisms failed",
            "Both DMARC and DKIM are reported as failed in the supplied authentication results.",
            f"DKIM={authentication['dkim']}; DMARC={authentication['dmarc']}",
            20,
        )

    score = max(0, min(100, score))

    if score >= 60:
        category = "EMAIL_HEADER_SPOOFING"
    elif any(f["code"] == "REPLY_TO_MISMATCH" for f in findings):
        category = "POTENTIAL_EMAIL_PHISHING"
    elif findings:
        category = "HEADER_ANOMALY"
    else:
        category = "NO_HEADER_ANOMALY_DETECTED"

    # Confidence reflects evidence coverage, not simply risk.
    coverage = 0
    if from_domain:
        coverage += 20
    if received:
        coverage += 20
    if auth_results:
        coverage += 40
    if message_id:
        coverage += 10
    if return_domain:
        coverage += 5
    if reply_domain:
        coverage += 5
    confidence = min(100, coverage)

    recommendations = []
    if authentication["dmarc"] != "pass":
        recommendations.append("Treat sender identity as unverified until DMARC alignment is established.")
    if authentication["spf"] not in {"pass", None}:
        recommendations.append("Verify the sending infrastructure and SPF result with the mail provider.")
    if authentication["dkim"] not in {"pass", None}:
        recommendations.append("Verify DKIM signing and the selector used by the sending service.")
    if any(f["code"] == "REPLY_TO_MISMATCH" for f in findings):
        recommendations.append("Do not reply or send sensitive information until the Reply-To domain is verified.")
    if not received:
        recommendations.append("Obtain the complete original header block before making an attribution decision.")
    if not recommendations:
        recommendations.append("No header-specific remediation is indicated; still evaluate the message body and URLs.")

    evidence = {
        "from_domain": from_domain,
        "reply_to_domain": reply_domain,
        "return_path_domain": return_domain,
        "message_id_domain": message_id_domain,
        "received_hops": len(received),
        "authentication_results_count": len(auth_results),
        "authentication": authentication,
    }

    return {
        "headers": header_values,
        "received": received,
        "authentication": authentication,
        "findings": findings,
        "evidence": evidence,
        "recommendations": recommendations,
        "risk_score": score,
        "risk_level": _risk_level(score),
        "confidence": confidence,
        "threat_category": category,
    }
