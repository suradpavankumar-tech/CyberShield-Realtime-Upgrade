from email import policy
from email.parser import Parser
from email.utils import parseaddr
from urllib.parse import urlparse
import re


URL_PATTERN = re.compile(
    r"https?://[^\s<>\"]+",
    re.IGNORECASE
)


def _extract_body(message) -> str:

    plain_parts = []
    html_parts = []

    if message.is_multipart():

        for part in message.walk():

            content_type = (
                part.get_content_type()
            )

            disposition = (
                part.get_content_disposition()
            )

            if disposition == "attachment":
                continue

            try:
                payload = part.get_content()
            except Exception:
                continue

            if not isinstance(
                payload,
                str
            ):
                continue

            if content_type == "text/plain":
                plain_parts.append(
                    payload
                )

            elif content_type == "text/html":
                html_parts.append(
                    payload
                )

    else:

        try:
            payload = message.get_content()
        except Exception:
            payload = ""

        if isinstance(
            payload,
            str
        ):

            if (
                message.get_content_type()
                == "text/html"
            ):

                html_parts.append(
                    payload
                )

            else:

                plain_parts.append(
                    payload
                )

    if plain_parts:

        return "\n".join(
            plain_parts
        ).strip()

    if html_parts:

        # Basic HTML-to-text fallback.
        # We deliberately keep this lightweight.
        text = re.sub(
            r"<[^>]+>",
            " ",
            "\n".join(html_parts)
        )

        return re.sub(
            r"\s+",
            " ",
            text
        ).strip()

    return ""


def _extract_urls(
    message,
    body: str
) -> list[str]:

    urls = []

    # --------------------------------------------------
    # Markdown links
    # [visible text](https://example.com)
    # --------------------------------------------------

    markdown_urls = re.findall(
        r'\]\((https?://[^)]+)\)',
        body,
        re.IGNORECASE
    )

    urls.extend(markdown_urls)

    # --------------------------------------------------
    # Remove Markdown links from body
    # --------------------------------------------------

    body_without_markdown = re.sub(
        r'\[[^\]]+\]\(https?://[^)]+\)',
        '',
        body,
        flags=re.IGNORECASE
    )

    # --------------------------------------------------
    # Plain URLs
    # --------------------------------------------------

    plain_urls = re.findall(
        r'https?://[^\s<>"\']+',
        body_without_markdown,
        re.IGNORECASE
    )

    urls.extend(plain_urls)

    # --------------------------------------------------
    # HTML href URLs
    # --------------------------------------------------

    html_sources = []

    if message.is_multipart():

        for part in message.walk():

            if part.get_content_type() != "text/html":
                continue

            try:
                html = part.get_content()
            except Exception:
                continue

            if isinstance(html, str):
                html_sources.append(html)

    elif message.get_content_type() == "text/html":

        try:
            html = message.get_content()
        except Exception:
            html = ""

        if isinstance(html, str):
            html_sources.append(html)

    for html in html_sources:

        html_urls = re.findall(
            r'href\s*=\s*["\'](https?://[^"\']+)["\']',
            html,
            re.IGNORECASE
        )

        urls.extend(html_urls)

    # --------------------------------------------------
    # Clean + deduplicate
    # --------------------------------------------------

    unique_urls = []
    seen = set()

    for url in urls:

        url = url.strip()

        url = url.rstrip(
            ".,;:!?)]}>\"'"
        )

        if not url.lower().startswith(
            ("http://", "https://")
        ):
            continue

        if url not in seen:

            seen.add(url)
            unique_urls.append(url)

    return unique_urls


def parse_email(
    raw_email: str
) -> dict:

    if not raw_email or not raw_email.strip():

        raise ValueError(
            "Email content cannot be empty."
        )

    message = Parser(
        policy=policy.default
    ).parsestr(
        raw_email
    )

    sender_name, sender_address = (
        parseaddr(
            message.get(
                "From",
                ""
            )
        )
    )

    recipient_name, recipient_address = (
        parseaddr(
            message.get(
                "To",
                ""
            )
        )
    )

    subject = (
        message.get(
            "Subject",
            ""
        ).strip()
    )

    body = _extract_body(
        message
    )

    urls = _extract_urls(
        message,
        body
    )

    return {

        "sender_name":
            sender_name,

        "sender_address":
            sender_address,

        "recipient_name":
            recipient_name,

        "recipient_address":
            recipient_address,

        "subject":
            subject,

        "body":
            body,

        "urls":
            urls,

        "url_count":
            len(urls),

        "has_html":
            bool(
                message.get_body(
                    preferencelist=(
                        "html",
                        "plain"
                    )
                )
                and
                message.get_body(
                    preferencelist=(
                        "html",
                    )
                )
            ),
    }