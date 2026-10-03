import re


def normalize_text(text: str) -> str:

    if not isinstance(text, str):
        return ""

    text = text.lower()

    # Normalize URLs
    text = re.sub(
        r"https?://\S+",
        " URL ",
        text
    )

    # Normalize email addresses
    text = re.sub(
        r"\b[\w\.-]+@[\w\.-]+\.\w+\b",
        " EMAIL ",
        text
    )

    # Normalize phone numbers
    text = re.sub(
        r"\b(?:\+?\d[\d\s\-]{8,}\d)\b",
        " PHONE ",
        text
    )

    # Normalize currency amounts
    text = re.sub(
        r"(₹|\$|€|£)\s*\d+(?:[,.]\d+)*",
        " MONEY ",
        text
    )

    # Normalize numbers
    text = re.sub(
        r"\b\d+\b",
        " NUMBER ",
        text
    )

    # Keep basic punctuation because punctuation
    # can carry useful linguistic information.
    text = re.sub(
        r"[^\w\s!?.,:%$₹€£]",
        " ",
        text
    )

    # Normalize repeated whitespace
    text = re.sub(
        r"\s+",
        " ",
        text
    )

    return text.strip()