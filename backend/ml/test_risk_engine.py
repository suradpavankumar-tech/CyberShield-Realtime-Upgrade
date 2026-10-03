from pprint import pprint

from ml.risk_engine import (
    calculate_final_score
)


def test_nlp_result():

    nlp_result = {

        "ml_probability": 91.25,

        "behavioral_score": 70,

        "scam_category":
            "BANKING_SCAM",

        "category_confidence":
            100,

        "indicators": [
            {
                "type": "URGENCY",
                "severity": "MEDIUM",
                "name": "Urgency Language",
                "description":
                    "The message attempts to "
                    "create time pressure."
            },
            {
                "type": "THREAT",
                "severity": "HIGH",
                "name": "Threat Language",
                "description":
                    "Threat language detected."
            },
            {
                "type": "FINANCIAL",
                "severity": "HIGH",
                "name": "Financial Context",
                "description":
                    "Financial context detected."
            }
        ]
    }

    result = calculate_final_score(
        nlp_result=nlp_result
    )

    print("=" * 80)

    print(
        "CYBERSHIELD — MASTER RISK ENGINE"
    )

    print("=" * 80)

    print("\nNLP-only analysis:")

    pprint(
        result
    )


def test_url_result():

    url_result = {

        "ml_probability": 100.0,

        "rule_score": 50,

        "trusted_domain": False,

        "brand_match": False,

        "indicators": [
            {
                "type": "NETWORK",
                "severity": "HIGH",
                "name": "IP-Based URL",
                "description":
                    "The hostname is an IP address."
            },
            {
                "type": "SECURITY",
                "severity": "MEDIUM",
                "name": "No HTTPS",
                "description":
                    "The URL does not use HTTPS."
            }
        ]
    }

    result = calculate_final_score(
        url_result=url_result
    )

    print("\n" + "=" * 80)

    print(
        "URL-only analysis:"
    )

    print("=" * 80)

    pprint(
        result
    )


if __name__ == "__main__":

    test_nlp_result()

    test_url_result()