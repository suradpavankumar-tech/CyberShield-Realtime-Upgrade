import ipaddress
import re
from dataclasses import dataclass
from urllib.parse import parse_qs, urlparse


SUSPICIOUS_KEYWORDS = {
    "login",
    "signin",
    "verify",
    "verification",
    "account",
    "secure",
    "security",
    "update",
    "confirm",
    "confirmation",
    "password",
    "credential",
    "payment",
    "billing",
    "wallet",
    "bank",
    "banking",
    "kyc",
    "otp",
    "refund",
    "reward",
    "claim",
    "prize",
    "free",
    "urgent",
    "suspend",
    "suspended",
    "unlock",
    "authenticate",
}


SUSPICIOUS_TLDS = {
    "zip",
    "mov",
    "click",
    "top",
    "xyz",
    "work",
    "gq",
    "tk",
    "ml",
    "cf",
    "ga",
}


SHORTENER_DOMAINS = {
    "bit.ly",
    "tinyurl.com",
    "t.co",
    "goo.gl",
    "ow.ly",
    "is.gd",
    "buff.ly",
    "cutt.ly",
    "rb.gy",
    "shorturl.at",
}


BRAND_NAMES = {
    "paypal",
    "microsoft",
    "google",
    "apple",
    "amazon",
    "netflix",
    "instagram",
    "facebook",
    "whatsapp",
    "linkedin",
    "sbi",
    "hdfc",
    "icici",
    "axis",
    "phonepe",
    "paytm",
    "googlepay",
}


@dataclass
class URLIndicator:
    indicator_type: str
    name: str
    description: str
    severity: str
    score: int
    source: str = "URL_RULE_ENGINE"


@dataclass
class URLAnalysisResult:
    normalized_url: str
    scheme: str
    hostname: str | None

    features: dict
    indicators: list[URLIndicator]

    rule_score: int
    risk_level: str


def normalize_url(url: str) -> str:
    """
    Normalize a URL without making any network request.
    """

    url = url.strip()

    if not url:
        return url

    if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", url):
        url = "https://" + url

    return url


def is_ip_address(hostname: str | None) -> bool:
    """
    Check whether hostname is an IPv4 or IPv6 address.
    """

    if not hostname:
        return False

    try:
        ipaddress.ip_address(hostname)
        return True
    except ValueError:
        return False


def count_digits(value: str) -> int:
    return sum(character.isdigit() for character in value)


def count_special_characters(value: str) -> int:
    return len(
        re.findall(
            r"[^a-zA-Z0-9]",
            value
        )
    )


def count_subdomains(hostname: str | None) -> int:
    if not hostname:
        return 0

    parts = hostname.split(".")

    if len(parts) <= 2:
        return 0

    return len(parts) - 2


def extract_suspicious_keywords(url: str) -> list[str]:
    url_lower = url.lower()

    found = []

    for keyword in SUSPICIOUS_KEYWORDS:
        if keyword in url_lower:
            found.append(keyword)

    return sorted(found)


def extract_brand_names(url: str) -> list[str]:
    url_lower = url.lower()

    found = []

    for brand in BRAND_NAMES:
        if brand in url_lower:
            found.append(brand)

    return sorted(found)


def is_shortened_url(hostname: str | None) -> bool:
    if not hostname:
        return False

    hostname = hostname.lower().strip(".")

    return hostname in SHORTENER_DOMAINS


def get_tld(hostname: str | None) -> str | None:
    if not hostname:
        return None

    parts = hostname.lower().strip(".").split(".")

    if len(parts) < 2:
        return None

    return parts[-1]


def calculate_rule_score(
    indicators: list[URLIndicator]
) -> int:

    score = sum(
        indicator.score
        for indicator in indicators
    )

    return min(score, 100)


def determine_risk_level(score: int) -> str:

    if score >= 70:
        return "HIGH"

    if score >= 40:
        return "MEDIUM"

    return "LOW"


def analyze_url(url: str) -> URLAnalysisResult:

    normalized_url = normalize_url(url)

    parsed = urlparse(normalized_url)

    hostname = parsed.hostname

    scheme = parsed.scheme.lower()

    path = parsed.path or ""

    query = parsed.query or ""

    fragment = parsed.fragment or ""

    query_parameters = parse_qs(query)

    suspicious_keywords = extract_suspicious_keywords(
        normalized_url
    )

    brands_found = extract_brand_names(
        normalized_url
    )

    ip_based = is_ip_address(hostname)

    subdomain_count = count_subdomains(hostname)

    tld = get_tld(hostname)

    shortened = is_shortened_url(hostname)

    features = {
        "url_length": len(normalized_url),

        "hostname_length": (
            len(hostname)
            if hostname
            else 0
        ),

        "path_length": len(path),

        "query_length": len(query),

        "fragment_length": len(fragment),

        "subdomain_count": subdomain_count,

        "dot_count": normalized_url.count("."),

        "hyphen_count": normalized_url.count("-"),

        "underscore_count": normalized_url.count("_"),

        "slash_count": normalized_url.count("/"),

        "question_mark_count": normalized_url.count("?"),

        "equal_sign_count": normalized_url.count("="),

        "ampersand_count": normalized_url.count("&"),

        "at_symbol_count": normalized_url.count("@"),

        "percent_count": normalized_url.count("%"),

        "digit_count": count_digits(
            normalized_url
        ),

        "special_character_count": (
            count_special_characters(
                normalized_url
            )
        ),

        "https": scheme == "https",

        "has_ip_address": ip_based,

        "has_port": parsed.port is not None,

        "has_query": bool(query),

        "query_parameter_count": len(
            query_parameters
        ),

        "is_shortened_url": shortened,

        "suspicious_keyword_count": len(
            suspicious_keywords
        ),

        "brand_name_count": len(
            brands_found
        ),

        "suspicious_tld": (
            tld in SUSPICIOUS_TLDS
            if tld
            else False
        ),
    }

    indicators: list[URLIndicator] = []

    # --------------------------------------------------
    # URL LENGTH
    # --------------------------------------------------

    if len(normalized_url) >= 150:

        indicators.append(
            URLIndicator(
                indicator_type="STRUCTURAL",
                name="Very Long URL",
                description=(
                    "The URL is unusually long and "
                    "contains a large amount of data."
                ),
                severity="LOW",
                score=2
            )
        )

    elif len(normalized_url) >= 100:

        indicators.append(
            URLIndicator(
                indicator_type="STRUCTURAL",
                name="Long URL",
                description=(
                    "The URL is longer than typical "
                    "web addresses."
                ),
                severity="LOW",
                score=1
            )
        )

    # --------------------------------------------------
    # IP ADDRESS
    # --------------------------------------------------

    if ip_based:

        indicators.append(
            URLIndicator(
                indicator_type="NETWORK",
                name="IP-Based URL",
                description=(
                    "The hostname is an IP address "
                    "rather than a conventional domain."
                ),
                severity="MEDIUM",
                score=12
            )
        )

    # --------------------------------------------------
    # HTTPS
    # --------------------------------------------------

    if scheme != "https":

        indicators.append(
            URLIndicator(
                indicator_type="SECURITY",
                name="No HTTPS",
                description=(
                    "The URL does not use HTTPS."
                ),
                severity="LOW",
                score=2
            )
        )

    # --------------------------------------------------
    # SUBDOMAINS
    # --------------------------------------------------

    if subdomain_count >= 4:

        indicators.append(
            URLIndicator(
                indicator_type="STRUCTURAL",
                name="Excessive Subdomains",
                description=(
                    "The hostname contains an unusually "
                    "large number of subdomains."
                ),
                severity="LOW",
                score=3
            )
        )

    elif subdomain_count >= 2:

        indicators.append(
            URLIndicator(
                indicator_type="STRUCTURAL",
                name="Multiple Subdomains",
                description=(
                    "The hostname contains multiple "
                    "subdomain levels."
                ),
                severity="LOW",
                score=1
            )
        )

    # --------------------------------------------------
    # SUSPICIOUS KEYWORDS
    # --------------------------------------------------

    if suspicious_keywords:

        keyword_text = ", ".join(
            suspicious_keywords[:8]
        )

        indicators.append(
            URLIndicator(
                indicator_type="SEMANTIC",
                name="Suspicious URL Keywords",
                description=(
                    f"Potentially sensitive or "
                    f"action-oriented terms detected: "
                    f"{keyword_text}."
                ),
                severity=(
                    "MEDIUM"
                    if len(suspicious_keywords) >= 4
                    else "LOW"
                ),
                score=min(
                    2 * len(suspicious_keywords),
                    8
                )
            )
        )

    # --------------------------------------------------
    # SHORTENED URL
    # --------------------------------------------------

    if shortened:

        indicators.append(
            URLIndicator(
                indicator_type="OBFUSCATION",
                name="URL Shortener Detected",
                description=(
                    "The URL uses a known URL-shortening "
                    "service, hiding the destination."
                ),
                severity="LOW",
                score=5
            )
        )

    # --------------------------------------------------
    # SUSPICIOUS TLD
    # --------------------------------------------------

    if tld in SUSPICIOUS_TLDS:

        indicators.append(
            URLIndicator(
                indicator_type="DOMAIN",
                name="Suspicious TLD",
                description=(
                    f"The domain uses the .{tld} "
                    "top-level domain, which is treated "
                    "as a risk signal by the rule engine."
                ),
                severity="LOW",
                score=2
            )
        )

    # --------------------------------------------------
    # @ SYMBOL
    # --------------------------------------------------

    if "@" in normalized_url:

        indicators.append(
            URLIndicator(
                indicator_type="OBFUSCATION",
                name="@ Symbol in URL",
                description=(
                    "An @ symbol can be used to obscure "
                    "the actual destination hostname."
                ),
                severity="MEDIUM",
                score=10
            )
        )

    # --------------------------------------------------
    # EXCESSIVE DIGITS
    # --------------------------------------------------

    if features["digit_count"] >= 8:

        indicators.append(
            URLIndicator(
                indicator_type="STRUCTURAL",
                name="Excessive Digits",
                description=(
                    "The URL contains an unusually high "
                    "number of numeric characters."
                ),
                severity="LOW",
                score=1
            )
        )

    # --------------------------------------------------
    # ENCODED CHARACTERS
    # --------------------------------------------------

    if "%" in normalized_url:

        indicators.append(
            URLIndicator(
                indicator_type="OBFUSCATION",
                name="Encoded Characters",
                description=(
                    "Percent-encoded characters were "
                    "detected in the URL."
                ),
                severity="LOW",
                score=1
            )
        )

    # --------------------------------------------------
    # BRAND INDICATORS
    # --------------------------------------------------

    if brands_found:

        brand_text = ", ".join(
            brands_found
        )

        indicators.append(
            URLIndicator(
                indicator_type="BRAND",
                name="Brand Name Detected",
                description=(
                    f"Known brand-related terms detected: "
                    f"{brand_text}."
                ),
                severity="INFO",
                score=0
            )
        )

    # --------------------------------------------------
    # QUERY PARAMETERS
    # --------------------------------------------------

    if len(query_parameters) >= 8:

        indicators.append(
            URLIndicator(
                indicator_type="STRUCTURAL",
                name="Many Query Parameters",
                description=(
                    "The URL contains a large number "
                    "of query parameters."
                ),
                severity="LOW",
                score=1
            )
        )

    # --------------------------------------------------
    # FINAL RULE SCORE
    # --------------------------------------------------

    rule_score = calculate_rule_score(
        indicators
    )

    risk_level = determine_risk_level(
        rule_score
    )

    return URLAnalysisResult(
        normalized_url=normalized_url,
        scheme=scheme,
        hostname=hostname,
        features=features,
        indicators=indicators,
        rule_score=rule_score,
        risk_level=risk_level
    )