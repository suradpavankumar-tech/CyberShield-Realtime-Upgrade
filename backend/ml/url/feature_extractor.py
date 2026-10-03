import ipaddress
import re
from urllib.parse import urlparse


MODEL_FEATURES = [
    "url_length",
    "hostname_length",
    "path_length",
    "query_length",
    "fragment_length",
    "domain_length",
    "subdomain_count",
    "dot_count",
    "hyphen_count",
    "underscore_count",
    "slash_count",
    "question_mark_count",
    "equal_sign_count",
    "ampersand_count",
    "at_symbol_count",
    "percent_count",
    "digit_count",
    "letter_count",
    "special_character_count",
    "digit_ratio",
    "letter_ratio",
    "special_character_ratio",
    "has_ip_address",
    "has_port",
    "has_query",
    "has_fragment",
    "is_https",
    "has_obfuscation",
    "obfuscation_count",
    "suspicious_keyword_count",
    "suspicious_tld",
    "brand_keyword_count",
    "path_depth",
    "has_punycode",
    "has_double_slash_path",
]


SUSPICIOUS_KEYWORDS = [
    "login",
    "signin",
    "verify",
    "verification",
    "account",
    "secure",
    "security",
    "update",
    "confirm",
    "password",
    "credential",
    "wallet",
    "bank",
    "banking",
    "payment",
    "pay",
    "invoice",
    "billing",
    "refund",
    "reward",
    "claim",
    "bonus",
    "gift",
    "prize",
    "urgent",
    "suspend",
    "suspended",
    "unlock",
    "authenticate",
    "kyc",
    "otp",
]


SUSPICIOUS_TLDS = {
    "xyz",
    "top",
    "click",
    "work",
    "zip",
    "mov",
    "gq",
    "tk",
    "ml",
    "ga",
    "cf",
}


BRAND_KEYWORDS = [
    "google",
    "microsoft",
    "apple",
    "amazon",
    "paypal",
    "facebook",
    "instagram",
    "netflix",
    "linkedin",
    "whatsapp",
    "telegram",
    "adobe",
    "dropbox",
]


def normalize_url(url: str) -> str:

    url = str(url).strip()

    if not url:
        return ""

    if not re.match(
        r"^[a-zA-Z][a-zA-Z0-9+.-]*://",
        url,
    ):
        url = "https://" + url

    return url


def is_ip_address(hostname: str) -> int:

    if not hostname:
        return 0

    try:
        ipaddress.ip_address(
            hostname
        )

        return 1

    except ValueError:
        return 0


def safe_hostname(parsed) -> str:

    try:
        return parsed.hostname or ""

    except ValueError:
        return ""


def extract_url_features(
    url: str,
) -> dict:

    url = normalize_url(url)

    parsed = urlparse(url)

    hostname = safe_hostname(
        parsed
    )

    path = parsed.path or ""

    query = parsed.query or ""

    fragment = parsed.fragment or ""

    hostname_parts = [
        part
        for part in hostname.split(".")
        if part
    ]

    domain_length = len(
        hostname
    )

    subdomain_count = max(
        len(hostname_parts) - 2,
        0,
    )

    tld = ""

    if len(hostname_parts) >= 2:

        tld = hostname_parts[-1].lower()

    url_length = len(url)

    letter_count = sum(
        character.isalpha()
        for character in url
    )

    digit_count = sum(
        character.isdigit()
        for character in url
    )

    special_character_count = sum(
        not character.isalnum()
        for character in url
    )

    obfuscation_matches = re.findall(
        r"%[0-9a-fA-F]{2}",
        url,
    )

    suspicious_keyword_count = sum(
        1
        for keyword in SUSPICIOUS_KEYWORDS
        if keyword in url.lower()
    )

    brand_keyword_count = sum(
        1
        for brand in BRAND_KEYWORDS
        if brand in hostname.lower()
    )

    path_depth = len(
        [
            segment
            for segment in path.split("/")
            if segment
        ]
    )

    features = {

        "url_length": url_length,

        "hostname_length": len(
            hostname
        ),

        "path_length": len(
            path
        ),

        "query_length": len(
            query
        ),

        "fragment_length": len(
            fragment
        ),

        "domain_length": domain_length,

        "subdomain_count": (
            subdomain_count
        ),

        "dot_count": url.count("."),

        "hyphen_count": url.count(
            "-"
        ),

        "underscore_count": url.count(
            "_"
        ),

        "slash_count": url.count(
            "/"
        ),

        "question_mark_count": url.count(
            "?"
        ),

        "equal_sign_count": url.count(
            "="
        ),

        "ampersand_count": url.count(
            "&"
        ),

        "at_symbol_count": url.count(
            "@"
        ),

        "percent_count": url.count(
            "%"
        ),

        "digit_count": digit_count,

        "letter_count": letter_count,

        "special_character_count": (
            special_character_count
        ),

        "digit_ratio": (
            digit_count / url_length
            if url_length
            else 0
        ),

        "letter_ratio": (
            letter_count / url_length
            if url_length
            else 0
        ),

        "special_character_ratio": (
            special_character_count
            / url_length
            if url_length
            else 0
        ),

        "has_ip_address": is_ip_address(
            hostname
        ),

        "has_port": int(
            parsed.port is not None
        ),

        "has_query": int(
            bool(query)
        ),

        "has_fragment": int(
            bool(fragment)
        ),

        "is_https": int(
            parsed.scheme.lower()
            == "https"
        ),

        "has_obfuscation": int(
            len(
                obfuscation_matches
            ) > 0
        ),

        "obfuscation_count": len(
            obfuscation_matches
        ),

        "suspicious_keyword_count": (
            suspicious_keyword_count
        ),

        "suspicious_tld": int(
            tld in SUSPICIOUS_TLDS
        ),

        "brand_keyword_count": (
            brand_keyword_count
        ),

        "path_depth": path_depth,

        "has_punycode": int(
            "xn--" in hostname.lower()
        ),

        "has_double_slash_path": int(
            "//" in path
        ),
    }

    return features


def extract_feature_vector(
    url: str,
):

    features = extract_url_features(
        url
    )

    return [
        features[name]
        for name in MODEL_FEATURES
    ]