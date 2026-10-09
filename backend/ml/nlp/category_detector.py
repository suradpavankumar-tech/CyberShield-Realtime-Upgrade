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
            "enter pin",
            "upi pin",
            "receive cashback",
            "scan to receive",
            "approve request",
            "gpay",
            "phonepe",
            "paytm",
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
            "telegram task",
            "like and earn",
            "youtube like",
            "hotel review",
            "daily income",
            "part time",
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
            "india post",
            "address update",
            "failed delivery",
            "redelivery",
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
            "digital arrest",
            "mumbai police",
            "delhi police",
            "narcotics",
            "drugs",
            "contraband",
            "money laundering",
            "video call",
            "skype",
            "stay on line",
            "arrest warrant",
            "supreme court",
        },
        "minimum_matches": 2,
    },

    "ELECTRICITY_BILL_SCAM": {
        "keywords": {
            "electricity",
            "power supply",
            "disconnected",
            "unpaid bill",
            "electric office",
            "bill update",
            "light cut",
            "consumer number",
            "disconnection",
            "officer",
        },
        "minimum_matches": 2,
    },

    "LOAN_HARASSMENT_SCAM": {
        "keywords": {
            "instant loan",
            "loan approved",
            "no cibil",
            "disbursed",
            "repay",
            "overdue penalty",
            "contact list",
            "loan app",
            "credit limit",
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


EXPLAINABLE_PATTERNS = [
    {
        "pattern": r"(enter\s+(?:your\s+)?(?:upi\s+)?pin|scan\s+to\s+receive|receive\s+cashback|approve\s+collect|collect\s+request)",
        "phrase_category": "UPI Trap",
        "explanation": "Scam pattern: Entering a UPI PIN will DEBIT money from your bank account, not credit it. You never need a PIN to receive funds.",
        "severity": "CRITICAL",
    },
    {
        "pattern": r"(digital\s+arrest|cbi\s+officer|mumbai\s+police|delhi\s+police|narcotics\s+control|arrest\s+warrant|stay\s+on\s+(?:skype|video\s+call)|illegal\s+parcel.*drugs)",
        "phrase_category": "Digital Arrest Extortion",
        "explanation": "Coercion alert: Real law enforcement agencies in India never conduct interrogations, court sessions, or issue warrants via Skype/WhatsApp video calls.",
        "severity": "CRITICAL",
    },
    {
        "pattern": r"(electricity.*(?:disconnected|cut|suspended)|power\s+supply.*(?:disconnected|cut)|unpaid\s+bill.*(?:contact|call)|call\s+electric\s+officer)",
        "phrase_category": "Utility Disconnection Scam",
        "explanation": "Fake power cutoff: Electricity boards do not send SMS from personal 10-digit mobile numbers with threats of same-night disconnection.",
        "severity": "HIGH",
    },
    {
        "pattern": r"(telegram\s+task|like\s+and\s+earn|hotel\s+review|youtube\s+like.*earn|daily\s+income\s+\d+|prepaid\s+task|crypto\s+recharge)",
        "phrase_category": "Part-Time Task Fraud",
        "explanation": "Task/Prepaid fraud: Scammers pay trivial sums for simple online tasks, then demand large upfront deposits to 'unlock' earnings.",
        "severity": "HIGH",
    },
    {
        "pattern": r"(verify\s+kyc|account.*(?:blocked|suspended|deactivated)|pan.*not\s+linked.*block|update\s+kyc\s+immediately|netbanking.*access)",
        "phrase_category": "Bank KYC Phishing",
        "explanation": "Credential harvesting: Regulated banks never send SMS links threatening immediate account suspension for missing KYC details.",
        "severity": "HIGH",
    },
    {
        "pattern": r"(won\s+(?:a\s+)?lottery|congratulations.*prize|cashback\s+of\s+rs|claim\s+your\s+reward\s+immediately|jackpot\s+winner)",
        "phrase_category": "Advance Fee / Prize Trap",
        "explanation": "Advance fee fraud: Fake prize or lottery notifications lure victims into paying 'processing fees' or 'GST' to claim fictitious funds.",
        "severity": "MEDIUM",
    },
    {
        "pattern": r"(instant\s+loan\s+approved|disbursed\s+in\s+5\s+minutes|no\s+cibil.*loan|download\s+loan\s+app)",
        "phrase_category": "Predatory Loan Fraud",
        "explanation": "Predatory loan trap: Unregistered loan applications exfiltrate personal photos and contacts to blackmail borrowers.",
        "severity": "HIGH",
    },
    {
        "pattern": r"(india\s+post.*address|courier.*cannot\s+deliver|package.*incomplete\s+address|update\s+address\s+within\s+24\s+hours)",
        "phrase_category": "Postal / Courier Delivery Phishing",
        "explanation": "Package delivery phishing: Smishing messages use postal service branding to lure victims into paying fake 'redelivery fees' via malicious links.",
        "severity": "HIGH",
    },
]


def extract_explainable_phrases(text: str) -> list[dict]:
    """
    Extract specific suspicious phrases from message text with
    contextual explanations for non-technical users.
    """
    if not text:
        return []

    phrases = []
    seen = set()

    for item in EXPLAINABLE_PATTERNS:
        for match in re.finditer(item["pattern"], text, re.IGNORECASE):
            matched_text = match.group(0).strip()
            key = matched_text.lower()
            if key in seen:
                continue
            seen.add(key)

            phrases.append({
                "phrase": matched_text,
                "category": item["phrase_category"],
                "explanation": item["explanation"],
                "severity": item["severity"],
                "start": match.start(),
                "end": match.end(),
            })

    return phrases