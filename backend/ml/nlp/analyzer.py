from ml.nlp.predict import (
    get_message_predictor
)

from ml.nlp.category_detector import (
    detect_scam_category
)


HIGH_RISK_CATEGORIES = {
    "BANKING_SCAM",
    "UPI_SCAM",
    "JOB_SCAM",
    "PRIZE_SCAM",
    "DELIVERY_SCAM",
    "DIGITAL_ARREST_SCAM",
    "INVESTMENT_SCAM",
    "CREDENTIAL_PHISHING",
}


def calculate_behavioral_score(
    behavioral: dict
) -> tuple[int, list]:

    score = 0
    signals = []

    # --------------------------------------------------
    # Urgency
    # --------------------------------------------------

    urgency = behavioral.get(
        "urgency_count",
        0
    )

    if urgency >= 3:

        score += 15

        signals.append(
            "HIGH urgency language"
        )

    elif urgency > 0:

        score += 7

        signals.append(
            "Urgency language detected"
        )

    # --------------------------------------------------
    # Threat
    # --------------------------------------------------

    threat = behavioral.get(
        "threat_count",
        0
    )

    if threat >= 2:

        score += 20

        signals.append(
            "Threat language detected"
        )

    elif threat > 0:

        score += 10

        signals.append(
            "Threat language detected"
        )

    # --------------------------------------------------
    # Financial
    # --------------------------------------------------

    financial = behavioral.get(
        "financial_count",
        0
    )

    if financial >= 2:

        score += 15

        signals.append(
            "Financial context detected"
        )

    elif financial > 0:

        score += 8

        signals.append(
            "Financial context detected"
        )

    # --------------------------------------------------
    # Credential
    # --------------------------------------------------

    credential = behavioral.get(
        "credential_count",
        0
    )

    if credential >= 2:

        score += 20

        signals.append(
            "Credential/OTP request detected"
        )

    elif credential > 0:

        score += 10

        signals.append(
            "Credential-related language detected"
        )

    # --------------------------------------------------
    # Call to action
    # --------------------------------------------------

    cta = behavioral.get(
        "cta_count",
        0
    )

    if cta >= 2:

        score += 10

        signals.append(
            "Strong call-to-action detected"
        )

    elif cta > 0:

        score += 5

        signals.append(
            "Call-to-action detected"
        )

    # --------------------------------------------------
    # URL
    # --------------------------------------------------

    url_count = behavioral.get(
        "url_count",
        0
    )

    if url_count > 0:

        score += 10

        signals.append(
            "URL detected in message"
        )

    return min(
        score,
        100
    ), signals


def calculate_final_risk(
    ml_score: float,
    category: dict,
    behavioral_score: int
) -> int:

    category_name = (
        category["category"]
    )

    category_confidence = (
        category["confidence"]
    )

    # --------------------------------------------------
    # Base ML evidence
    # --------------------------------------------------

    ml_component = (
        ml_score * 0.50
    )

    # --------------------------------------------------
    # Behavioral evidence
    # --------------------------------------------------

    behavioral_component = (
        behavioral_score * 0.25
    )

    # --------------------------------------------------
    # Category evidence
    # --------------------------------------------------

    if category_name in HIGH_RISK_CATEGORIES:

        category_component = (
            category_confidence * 0.25
        )

    else:

        category_component = 0

    final_score = (
        ml_component
        + behavioral_component
        + category_component
    )

    # --------------------------------------------------
    # Strong category override
    #
    # Used when the ML classifier underestimates
    # a clearly identifiable scam category.
    # --------------------------------------------------

    if (
        category_name in HIGH_RISK_CATEGORIES
        and category_confidence >= 90
        and behavioral_score >= 15
    ):

        final_score = max(
            final_score,
            70
        )

    return max(
        0,
        min(
            100,
            round(final_score)
        )
    )


def get_risk_level(
    score: int
) -> str:

    if score >= 70:

        return "HIGH"

    if score >= 40:

        return "MEDIUM"

    return "LOW"


def build_indicators(
    behavioral: dict,
    category: dict,
    behavioral_signals: list
) -> list:

    indicators = []

    if behavioral.get(
        "urgency_count",
        0
    ) > 0:

        indicators.append({
            "type": "URGENCY",
            "severity": "MEDIUM",
            "name": "Urgency Language",
            "description":
                "The message attempts to create "
                "time pressure."
        })

    if behavioral.get(
        "threat_count",
        0
    ) > 0:

        indicators.append({
            "type": "THREAT",
            "severity": "HIGH",
            "name": "Threat Language",
            "description":
                "The message contains threatening "
                "or consequence-based language."
        })

    if behavioral.get(
        "financial_count",
        0
    ) > 0:

        indicators.append({
            "type": "FINANCIAL",
            "severity": "HIGH",
            "name": "Financial Context",
            "description":
                "Financial or payment-related "
                "language was detected."
        })

    if behavioral.get(
        "credential_count",
        0
    ) > 0:

        indicators.append({
            "type": "CREDENTIAL",
            "severity": "HIGH",
            "name": "Credential Request",
            "description":
                "The message contains language "
                "associated with passwords, OTP "
                "or verification."
        })

    if behavioral.get(
        "cta_count",
        0
    ) > 0:

        indicators.append({
            "type": "CALL_TO_ACTION",
            "severity": "MEDIUM",
            "name": "Action Request",
            "description":
                "The message asks the recipient "
                "to perform an action."
        })

    if behavioral.get(
        "url_count",
        0
    ) > 0:

        indicators.append({
            "type": "URL",
            "severity": "MEDIUM",
            "name": "URL Detected",
            "description":
                "The message contains a URL."
        })

    if category["category"] != "OTHER":

        indicators.append({

            "type": "SCAM_CATEGORY",

            "severity": "HIGH",

            "name":
                category["category"],

            "description":
                "The message matches patterns "
                "associated with this scam category.",

            "confidence":
                category["confidence"],

            "matched_keywords":
                category["matched_keywords"],
        })

    return indicators


def analyze_message(
    message: str
) -> dict:

    if not message or not message.strip():

        raise ValueError(
            "Message cannot be empty."
        )

    predictor = (
        get_message_predictor()
    )

    prediction = predictor.predict(
        message
    )

    category = (
        detect_scam_category(
            message
        )
    )

    behavioral = (
        prediction[
            "behavioral_features"
        ]
    )

    behavioral_score, behavioral_signals = (
        calculate_behavioral_score(
            behavioral
        )
    )

    final_score = (
        calculate_final_risk(
            prediction[
                "phishing_probability"
            ],
            category,
            behavioral_score
        )
    )

    risk_level = (
        get_risk_level(
            final_score
        )
    )

    indicators = build_indicators(
        behavioral,
        category,
        behavioral_signals
    )

    return {

        "prediction":
            (
                "SUSPICIOUS"
                if final_score >= 40
                else "LEGITIMATE"
            ),

        "ml_probability":
            prediction[
                "phishing_probability"
            ],

        "behavioral_score":
            behavioral_score,

        

        "nlp_risk_score": final_score,

        "risk_score": final_score,

        "risk_level":
            risk_level,

        "scam_category":
            category[
                "category"
            ],

        "category_confidence":
            category[
                "confidence"
            ],

        "category_keywords":
            category[
                "matched_keywords"
            ],

        "behavioral_features":
            behavioral,

        "indicators":
            indicators,
    }