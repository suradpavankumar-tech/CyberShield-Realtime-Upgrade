from dataclasses import dataclass
from urllib.parse import urlparse

from app.intelligence.live_url_intelligence import (
    BRAND_DOMAINS,
    TRUSTED_DOMAINS,
    registered_domain,
)


@dataclass
class DomainIntelligenceResult:
    domain: str
    known_trusted: bool
    trusted_source: str | None
    brand_match: bool
    notes: list[str]
    subdomain: str
    impersonation_suspected: bool = False
    impersonation_matches: list[dict] | None = None


def extract_registered_domain(hostname: str) -> str:
    return registered_domain(hostname)


def analyze_domain(url: str) -> DomainIntelligenceResult:
    parsed = urlparse(url)
    hostname = (parsed.hostname or "").lower().strip(".")
    root = registered_domain(hostname)

    known_trusted = root in TRUSTED_DOMAINS
    brand_match = root in BRAND_DOMAINS

    subdomain = ""
    if hostname.endswith("." + root):
        subdomain = hostname[: -(len(root) + 1)]

    notes: list[str] = []
    if known_trusted:
        notes.append("Registered domain exactly matches CyberShield's trusted-domain registry.")
    if brand_match:
        notes.append("Registered domain matches a known brand's official domain.")
    if subdomain:
        notes.append(f"Subdomain detected: {subdomain}.")

    return DomainIntelligenceResult(
        domain=root,
        known_trusted=known_trusted,
        trusted_source="CyberShield Trusted Domain Registry" if known_trusted else None,
        brand_match=brand_match,
        notes=notes,
        subdomain=subdomain,
    )
