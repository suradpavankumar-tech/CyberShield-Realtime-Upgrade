"""Live, defensive URL intelligence for CyberShield.

All network checks are bounded and SSRF-aware. Missing external providers are
reported as unavailable; no reputation result is fabricated.
"""

from __future__ import annotations

import ipaddress
import json
import os
import socket
import ssl
import time
from dataclasses import asdict, dataclass, field
from difflib import SequenceMatcher
from http.client import HTTPResponse
from io import BytesIO
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen


MAX_REDIRECTS = 5
CONNECT_TIMEOUT = 5.0
MAX_HEADER_BYTES = 64 * 1024
MAX_BODY_BYTES = 64 * 1024

TRUSTED_DOMAINS = {
    "google.com", "googleusercontent.com", "youtube.com", "github.com",
    "microsoft.com", "apple.com", "amazon.com", "wikipedia.org",
    "linkedin.com", "netflix.com", "adobe.com", "paypal.com",
}

BRAND_DOMAINS = {
    "google.com": "google", "youtube.com": "youtube", "github.com": "github",
    "microsoft.com": "microsoft", "apple.com": "apple", "amazon.com": "amazon",
    "paypal.com": "paypal", "linkedin.com": "linkedin", "netflix.com": "netflix",
}

# Conservative fallback for common multi-label public suffixes when tldextract
# is not installed. The application also supports tldextract when available.
MULTI_LABEL_SUFFIXES = {
    "co.uk", "org.uk", "ac.uk", "gov.uk", "com.au", "net.au", "org.au",
    "co.in", "firm.in", "net.in", "org.in", "gen.in", "ind.in", "ac.in",
    "co.jp", "com.br", "com.cn", "com.sg", "com.my", "co.nz", "co.za",
}


def registered_domain(hostname: str) -> str:
    host = hostname.strip(".").lower()
    if not host:
        return ""
    try:
        import tldextract  # type: ignore
        extracted = tldextract.extract(host)
        if extracted.domain and extracted.suffix:
            return f"{extracted.domain}.{extracted.suffix}".lower()
    except Exception:
        pass
    parts = host.split(".")
    if len(parts) < 2:
        return host
    suffix = ".".join(parts[-2:])
    if suffix in MULTI_LABEL_SUFFIXES and len(parts) >= 3:
        return ".".join(parts[-3:])
    return suffix


def is_unsafe_ip(ip: str) -> bool:
    addr = ipaddress.ip_address(ip)
    return any((
        addr.is_private,
        addr.is_loopback,
        addr.is_link_local,
        addr.is_multicast,
        addr.is_reserved,
        addr.is_unspecified,
    ))


def resolve_host(hostname: str) -> dict:
    if not hostname:
        return {"status": "FAILED", "addresses": [], "error": "Hostname is missing."}
    try:
        infos = socket.getaddrinfo(hostname, None, type=socket.SOCK_STREAM)
        addresses = sorted({info[4][0] for info in infos})
        if not addresses:
            return {"status": "FAILED", "addresses": [], "error": "No DNS addresses returned."}
        unsafe = [ip for ip in addresses if is_unsafe_ip(ip)]
        if unsafe:
            return {
                "status": "BLOCKED",
                "addresses": addresses,
                "unsafe_addresses": unsafe,
                "error": "Resolution returned a private or otherwise non-public address.",
            }
        return {"status": "RESOLVED", "addresses": addresses, "unsafe_addresses": []}
    except Exception as exc:
        return {"status": "FAILED", "addresses": [], "error": str(exc)[:300]}


def select_public_ip(addresses: list[str]) -> str | None:
    for ip in addresses:
        try:
            if not is_unsafe_ip(ip):
                return ip
        except ValueError:
            continue
    return None


def tls_probe(hostname: str, ip: str, port: int) -> dict:
    if port != 443:
        return {"status": "NOT_CHECKED", "reason": "HTTPS port is not 443."}
    context = ssl.create_default_context()
    sock = None
    try:
        sock = socket.create_connection((ip, port), timeout=CONNECT_TIMEOUT)
        with context.wrap_socket(sock, server_hostname=hostname) as tls_sock:
            cert = tls_sock.getpeercert()
            cipher = tls_sock.cipher()
            return {
                "status": "VALID",
                "protocol": tls_sock.version(),
                "cipher": cipher[0] if cipher else None,
                "subject": dict(x[0] for x in cert.get("subject", [])) if cert else {},
                "issuer": dict(x[0] for x in cert.get("issuer", [])) if cert else {},
                "not_before": cert.get("notBefore") if cert else None,
                "not_after": cert.get("notAfter") if cert else None,
            }
    except ssl.SSLCertVerificationError as exc:
        return {"status": "INVALID", "error": str(exc)[:300]}
    except Exception as exc:
        return {"status": "UNAVAILABLE", "error": str(exc)[:300]}
    finally:
        if sock is not None:
            try:
                sock.close()
            except Exception:
                pass


def _request_once(url: str, resolved_ip: str) -> dict:
    parsed = urlparse(url)
    scheme = parsed.scheme.lower()
    hostname = parsed.hostname or ""
    port = parsed.port or (443 if scheme == "https" else 80)
    if port not in (80, 443):
        # Non-standard ports are allowed only if explicitly public; they are
        # still treated as a risk signal rather than scanned arbitrarily.
        if not (1 <= port <= 65535):
            raise ValueError("Invalid port")

    sock = socket.create_connection((resolved_ip, port), timeout=CONNECT_TIMEOUT)
    try:
        tls_info = None
        if scheme == "https":
            context = ssl.create_default_context()
            sock = context.wrap_socket(sock, server_hostname=hostname)
            tls_info = {
                "status": "VALID",
                "protocol": sock.version(),
                "cipher": sock.cipher()[0] if sock.cipher() else None,
            }

        path = parsed.path or "/"
        if parsed.query:
            path += "?" + parsed.query
        request = (
            f"HEAD {path} HTTP/1.1\r\n"
            f"Host: {hostname}\r\n"
            "User-Agent: CyberShield-URL-Analyzer/1.0\r\n"
            "Accept: */*\r\n"
            "Connection: close\r\n\r\n"
        ).encode("ascii", "ignore")
        sock.sendall(request)

        response = HTTPResponse(sock)
        response.begin()
        headers = {}
        header_size = 0
        for key, value in response.getheaders():
            header_size += len(key) + len(value) + 4
            if header_size > MAX_HEADER_BYTES:
                break
            headers[key.lower()] = value[:1000]
        location = headers.get("location")
        # HEAD responses are useful for headers/redirects and avoid downloading
        # arbitrary content. We intentionally do not read a response body.
        return {
            "status_code": response.status,
            "reason": response.reason,
            "headers": headers,
            "location": location,
            "tls": tls_info,
        }
    finally:
        try:
            sock.close()
        except Exception:
            pass


def analyze_http_chain(start_url: str) -> dict:
    current = start_url
    chain = []
    errors = []
    visited = set()

    for hop in range(MAX_REDIRECTS + 1):
        parsed = urlparse(current)
        hostname = parsed.hostname or ""
        scheme = parsed.scheme.lower()
        if scheme not in {"http", "https"}:
            errors.append(f"Unsupported redirect protocol: {scheme}")
            break
        if hostname in visited and current in visited:
            errors.append("Redirect loop detected.")
            break
        visited.add(current)

        dns = resolve_host(hostname)
        if dns["status"] != "RESOLVED":
            return {
                "status": dns["status"], "chain": chain, "final_url": current,
                "dns": dns, "errors": errors + ([dns.get("error")] if dns.get("error") else []),
            }
        ip = select_public_ip(dns["addresses"])
        if not ip:
            return {"status": "BLOCKED", "chain": chain, "final_url": current, "dns": dns, "errors": errors}

        tls = None
        if scheme == "https":
            tls = tls_probe(hostname, ip, parsed.port or 443)

        try:
            result = _request_once(current, ip)
        except Exception as exc:
            return {
                "status": "UNAVAILABLE", "chain": chain, "final_url": current,
                "dns": dns, "tls": tls, "errors": errors + [str(exc)[:300]],
            }

        hop_data = {
            "url": current,
            "hostname": hostname,
            "ip": ip,
            "status_code": result["status_code"],
            "reason": result["reason"],
            "location": result.get("location"),
            "tls": tls or result.get("tls"),
        }
        chain.append(hop_data)

        location = result.get("location")
        if not location or result["status_code"] not in {301, 302, 303, 307, 308}:
            return {
                "status": "COMPLETED", "chain": chain, "final_url": current,
                "dns": dns, "tls": tls, "errors": errors,
            }
        if hop >= MAX_REDIRECTS:
            errors.append("Redirect limit reached.")
            break
        current = urljoin(current, location)

    return {"status": "INCOMPLETE", "chain": chain, "final_url": current, "errors": errors}


def _levenshtein(a: str, b: str) -> int:
    if a == b:
        return 0
    if not a:
        return len(b)
    if not b:
        return len(a)
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(cur[-1] + 1, prev[j] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def impersonation_signal(domain: str) -> dict:
    domain_lower = domain.lower()
    if registered_domain(domain_lower) in BRAND_DOMAINS:
        return {"detected": False, "matches": []}
    label = domain_lower.split(".")[0] if domain_lower else ""
    signals = []
    labels = [part for part in domain_lower.split(".") if part]
    for official, brand in BRAND_DOMAINS.items():
        official_label = official.split(".")[0]
        if domain_lower == official:
            continue
        for candidate in labels:
            normalized = candidate.replace("0", "o").replace("1", "l").replace("3", "e").replace("4", "a").replace("5", "s").replace("7", "t")
            distance = _levenshtein(normalized, official_label)
            similarity = SequenceMatcher(None, normalized, official_label).ratio()
            if brand in candidate or distance <= 2 or similarity >= 0.86:
                signals.append({"brand": brand, "official_domain": official, "matched_label": candidate, "distance": distance, "similarity": round(similarity, 3)})
                break
    return {"detected": bool(signals), "matches": signals}


def reputation_lookup(domain: str, normalized_url: str) -> dict:
    """Optional real provider lookup. No key means explicitly unavailable."""
    vt_key = os.getenv("VIRUSTOTAL_API_KEY", "").strip()
    if not vt_key:
        return {"status": "UNAVAILABLE", "provider": "VirusTotal", "reason": "VIRUSTOTAL_API_KEY is not configured."}

    # URL is sent to the provider only when the deployment explicitly opts in.
    try:
        import base64
        import json as _json
        import urllib.request
        url_id = base64.urlsafe_b64encode(normalized_url.encode()).decode().strip("=")
        request = urllib.request.Request(
            f"https://www.virustotal.com/api/v3/urls/{url_id}",
            headers={"x-apikey": vt_key, "Accept": "application/json"},
        )
        with urllib.request.urlopen(request, timeout=8) as response:
            payload = _json.loads(response.read(MAX_BODY_BYTES).decode("utf-8", "replace"))
        attrs = payload.get("data", {}).get("attributes", {})
        stats = attrs.get("last_analysis_stats", {})
        malicious = int(stats.get("malicious", 0) or 0)
        suspicious = int(stats.get("suspicious", 0) or 0)
        total = sum(int(v or 0) for v in stats.values())
        if malicious > 0:
            verdict = "MALICIOUS"
        elif suspicious > 0:
            verdict = "SUSPICIOUS"
        else:
            verdict = "NO_MALICIOUS_DETECTIONS"
        return {
            "status": "AVAILABLE", "provider": "VirusTotal", "verdict": verdict,
            "malicious": malicious, "suspicious": suspicious, "engines": total,
        }
    except Exception as exc:
        return {"status": "UNAVAILABLE", "provider": "VirusTotal", "reason": str(exc)[:300]}


def analyze_live_url(url: str, domain_result: dict) -> dict:
    parsed = urlparse(url)
    hostname = parsed.hostname or ""
    domain = domain_result.get("domain") or registered_domain(hostname)
    dns = resolve_host(hostname)
    tls = None
    http_result = None
    if dns.get("status") == "RESOLVED":
        public_ip = select_public_ip(dns.get("addresses", []))
        if public_ip and parsed.scheme.lower() == "https":
            tls = tls_probe(hostname, public_ip, parsed.port or 443)
        if public_ip:
            try:
                http_result = analyze_http_chain(url)
            except Exception as exc:
                http_result = {"status": "UNAVAILABLE", "errors": [str(exc)[:300]]}

    reputation = reputation_lookup(domain, url)
    impersonation = impersonation_signal(hostname)

    redirect_chain = (http_result or {}).get("chain", [])
    final_url = (http_result or {}).get("final_url") or url
    final_domain = registered_domain(urlparse(final_url).hostname or "")
    unrelated_redirect = bool(redirect_chain) and final_domain and final_domain != domain

    return {
        "normalized_url": url,
        "hostname": hostname,
        "registered_domain": domain,
        "dns": dns,
        "tls": tls,
        "http": http_result,
        "redirects": {
            "chain": redirect_chain,
            "final_url": final_url,
            "final_registered_domain": final_domain,
            "cross_domain": unrelated_redirect,
        },
        "reputation": reputation,
        "impersonation": impersonation,
        "checked_at": time.time(),
    }
