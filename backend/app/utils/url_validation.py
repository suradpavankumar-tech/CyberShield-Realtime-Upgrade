from urllib.parse import urlparse


ALLOWED_SCHEMES = {
    "http",
    "https",
}


def validate_url(url: str) -> tuple[bool, str | None]:

    url = url.strip()

    if not url:
        return False, "URL cannot be empty."

    if len(url) > 2048:
        return False, "URL is too long."

    parsed = urlparse(url)

    if parsed.scheme.lower() not in ALLOWED_SCHEMES:
        return False, (
            "URL must use HTTP or HTTPS."
        )

    if not parsed.netloc:
        return False, (
            "URL does not contain a valid hostname."
        )

    if " " in url:
        return False, (
            "URL cannot contain spaces."
        )

    if parsed.username or parsed.password:
        return False, (
            "URLs containing embedded credentials "
            "are not currently supported."
        )

    return True, None