import re


URGENCY_WORDS = {
    "urgent",
    "urgently",
    "immediately",
    "immediate",
    "now",
    "today",
    "hurry",
    "quick",
    "quickly",
    "deadline",
    "expires",
    "expired",
    "final",
    "last",
    "warning",
}


THREAT_WORDS = {
    "blocked",
    "suspended",
    "terminated",
    "closed",
    "arrest",
    "police",
    "legal",
    "court",
    "penalty",
    "fine",
    "criminal",
    "action",
    "warning",
}


FINANCIAL_WORDS = {
    "bank",
    "banking",
    "account",
    "payment",
    "upi",
    "money",
    "cash",
    "transaction",
    "credit",
    "debit",
    "loan",
    "refund",
    "transfer",
    "wallet",
}


CREDENTIAL_WORDS = {
    "password",
    "otp",
    "pin",
    "cvv",
    "card",
    "credential",
    "login",
    "signin",
    "verify",
    "verification",
    "kyc",
    "authenticate",
}


REWARD_WORDS = {
    "winner",
    "won",
    "prize",
    "reward",
    "lottery",
    "gift",
    "bonus",
    "cashback",
    "claim",
}


JOB_WORDS = {
    "job",
    "hiring",
    "selected",
    "selection",
    "salary",
    "work",
    "vacancy",
    "employment",
    "interview",
    "registration",
}


CTA_WORDS = {
    "click",
    "tap",
    "open",
    "visit",
    "verify",
    "confirm",
    "submit",
    "claim",
    "update",
    "activate",
    "login",
    "pay",
}


def count_word_matches(
    text: str,
    vocabulary: set[str],
) -> int:

    words = set(
        re.findall(
            r"\b[a-zA-Z]+\b",
            text.lower()
        )
    )

    return len(
        words.intersection(
            vocabulary
        )
    )


def extract_behavioral_features(
    text: str,
) -> dict:

    text_lower = text.lower()

    words = re.findall(
        r"\b\w+\b",
        text_lower
    )

    word_count = len(words)

    character_count = len(text)

    exclamation_count = text.count("!")

    question_count = text.count("?")

    uppercase_count = sum(
        1
        for char in text
        if char.isupper()
    )

    alphabetic_count = sum(
        1
        for char in text
        if char.isalpha()
    )

    uppercase_ratio = (
        uppercase_count / alphabetic_count
        if alphabetic_count > 0
        else 0.0
    )

    url_count = len(
        re.findall(
            r"https?://\S+",
            text_lower
        )
    )

    phone_count = len(
        re.findall(
            r"\b(?:\+?\d[\d\s\-]{8,}\d)\b",
            text
        )
    )

    email_count = len(
        re.findall(
            r"\b[\w\.-]+@[\w\.-]+\.\w+\b",
            text_lower
        )
    )

    return {

        "word_count": word_count,

        "character_count": character_count,

        "exclamation_count": (
            exclamation_count
        ),

        "question_count": (
            question_count
        ),

        "uppercase_ratio": (
            uppercase_ratio
        ),

        "url_count": url_count,

        "phone_count": phone_count,

        "email_count": email_count,

        "urgency_count": count_word_matches(
            text,
            URGENCY_WORDS
        ),

        "threat_count": count_word_matches(
            text,
            THREAT_WORDS
        ),

        "financial_count": count_word_matches(
            text,
            FINANCIAL_WORDS
        ),

        "credential_count": count_word_matches(
            text,
            CREDENTIAL_WORDS
        ),

        "reward_count": count_word_matches(
            text,
            REWARD_WORDS
        ),

        "job_count": count_word_matches(
            text,
            JOB_WORDS
        ),

        "cta_count": count_word_matches(
            text,
            CTA_WORDS
        ),
    }