from ml.nlp.analyzer import (
    analyze_message
)


TEST_MESSAGES = [

    (
        "BANKING SCAM",
        """
        URGENT! Your bank account will be
        permanently blocked today.
        Verify your KYC immediately
        and confirm your OTP.
        """
    ),

    (
        "UPI SCAM",
        """
        Your UPI payment has failed.
        Scan this QR code immediately
        to receive your refund.
        """
    ),

    (
        "JOB SCAM",
        """
        Congratulations! You have been
        selected for a high salary
        work from home job.
        Pay the registration fee now.
        """
    ),

    (
        "PRIZE SCAM",
        """
        Congratulations! You have won
        a 50 lakh lottery prize.
        Claim your reward immediately.
        """
    ),

    (
        "LEGITIMATE",
        """
        Your order has been delivered
        successfully. Thank you for
        shopping with us.
        """
    ),

    (
        "LEGITIMATE",
        """
        Your appointment is confirmed
        for tomorrow at 10 AM.
        Please arrive 10 minutes early.
        """
    ),
]


def main():

    print("=" * 80)

    print(
        "CYBERSHIELD — NLP RISK FUSION"
    )

    print("=" * 80)

    for name, message in TEST_MESSAGES:

        result = analyze_message(
            message
        )

        print("\n" + "-" * 80)

        print(
            f"TEST: {name}"
        )

        print(
            f"Prediction: "
            f"{result['prediction']}"
        )

        print(
            f"ML probability: "
            f"{result['ml_probability']:.2f}%"
        )

        print(
            f"Behavioral score: "
            f"{result['behavioral_score']}/100"
        )

        print(
            f"Final NLP score: "
            f"{result['risk_score']}/100"
        )

        print(
            f"Risk level: "
            f"{result['risk_level']}"
        )

        print(
            f"Scam category: "
            f"{result['scam_category']}"
        )

        print(
            f"Category confidence: "
            f"{result['category_confidence']}%"
        )

        print("\nIndicators:")

        for indicator in result[
            "indicators"
        ]:

            print(
                f"- [{indicator['severity']}] "
                f"{indicator['name']}"
            )


if __name__ == "__main__":

    main()