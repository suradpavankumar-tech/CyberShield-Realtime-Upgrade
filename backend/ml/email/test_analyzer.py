from pprint import pprint

from ml.email.analyzer import analyze_email


RAW_EMAIL = """\
From: security@example.com
To: user@example.com
Subject: Urgent account verification

URGENT! Your bank account will be permanently
blocked today. Verify your KYC immediately.

https://secure-bank-login.example.xyz/verify/account
"""


def main():

    print("=" * 80)
    print("CYBERSHIELD — EMAIL INTELLIGENCE")
    print("=" * 80)

    result = analyze_email(
        RAW_EMAIL
    )

    print("\nSender:")
    print(result["sender"])

    print("\nSubject:")
    print(result["subject"])

    print("\nExtracted URLs:")
    for url in result["urls"]:
        print("-", url)

    print("\nNLP:")
    print(
        "Risk:",
        result["nlp"]["risk_score"]
    )
    print(
        "Category:",
        result["nlp"]["scam_category"]
    )

    print("\nURL analysis:")

    for item in result["url_results"]:

        url_result = item["result"]

        print(
            url_result
        )

    print("\nFINAL EMAIL RESULT")
    print(
        "Risk score:",
        result["risk_score"]
    )
    print(
        "Risk level:",
        result["risk_level"]
    )
    print(
        "Threat category:",
        result["threat_category"]
    )
    print(
        "Confidence:",
        result["confidence"]
    )

    print("\nIndicators:")

    for indicator in result[
        "indicators"
    ]:
        print(
            "-",
            indicator["severity"],
            indicator["name"]
        )


if __name__ == "__main__":
    main()