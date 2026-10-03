import re


CATEGORY_RULES = {

    "BANKING_SCAM": {
        "keywords": {
            "bank",
            "banking",
            "account",
            "kyc",
            "blocked",
            "suspended",
            "branch",
            "netbanking",
        },
        "minimum_matches": 2,
    },

    "UPI_SCAM": {
        "keywords": {
            "upi",
            "payment",
            "upi id",
            "collect request",
            "qr",
            "scan",
            "refund",
            "transaction",
        },
        "minimum_matches": 2,
    },

    "JOB_SCAM": {
        "keywords": {
            "job",
            "hiring",
            "salary",
            "selected",
            "selection",
            "vacancy",
            "registration fee",
            "work from home",
            "employment",
        },
        "minimum_matches": 2,
    },

    "PRIZE_SCAM": {
        "keywords": {
            "winner",
            "won",
            "prize",
            "lottery",
            "reward",
            "gift",
            "jackpot",
            "cashback",
        },
        "minimum_matches": 2,
    },

    "DELIVERY_SCAM": {
        "keywords": {
            "parcel",
            "package",
            "delivery",
            "courier",
            "shipment",
            "shipping",
            "customs",
        },
        "minimum_matches": 2,
    },

    "DIGITAL_ARREST_SCAM": {
        "keywords": {
            "arrest",
            "police",
            "criminal",
            "crime",
            "court",
            "aadhaar",
            "investigation",
            "legal action",
            "cbi",
            "cybercrime",
        },
        "minimum_matches": 2,
    },

    "INVESTMENT_SCAM": {
        "keywords": {
            "investment",
            "invest",
            "trading",
            "profit",
            "returns",
            "crypto",
            "bitcoin",
            "stock",
            "double your money",
        },
        "minimum_matches": 2,
    },

    "CREDENTIAL_PHISHING": {
        "keywords": {
            "password",
            "otp",
            "pin",
            "cvv",
            "login",
            "sign in",
            "verify",
            "verification",
            "credential",
            "authenticate",
        },
        "minimum_matches": 2,
    },
}


def normalize_for_matching(text: str) -> str:

    text = text.lower()

    text = re.sub(
        r"\s+",
        " ",
        text
    )

    return text.strip()


def detect_scam_category(
    text: str
) -> dict:

    normalized = normalize_for_matching(
        text
    )

    words = set(
        re.findall(
            r"\b[a-zA-Z0-9]+\b",
            normalized
        )
    )

    results = []

    for category, config in (
        CATEGORY_RULES.items()
    ):

        matches = []

        for keyword in config["keywords"]:

            keyword_lower = keyword.lower()

            # Multi-word phrase
            if " " in keyword_lower:

                if keyword_lower in normalized:

                    matches.append(
                        keyword
                    )

            # Single word
            else:

                if keyword_lower in words:

                    matches.append(
                        keyword
                    )

        match_count = len(matches)

        if (
            match_count
            >= config["minimum_matches"]
        ):

            confidence = min(
                100,
                50 + (
                    match_count * 15
                )
            )

            results.append({

                "category":
                    category,

                "confidence":
                    confidence,

                "matched_keywords":
                    matches,

                "match_count":
                    match_count,
            })

    # ----------------------------------------------------
    # No category
    # ----------------------------------------------------

    if not results:

        return {

            "category":
                "OTHER",

            "confidence":
                0,

            "matched_keywords":
                [],

            "all_matches":
                [],
        }

    # Highest matching category
    results.sort(
        key=lambda item: (
            item["match_count"],
            item["confidence"]
        ),
        reverse=True
    )

    best = results[0]

    return {

        "category":
            best["category"],

        "confidence":
            best["confidence"],

        "matched_keywords":
            best["matched_keywords"],

        "all_matches":
            results,
    }