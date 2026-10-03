from ml.nlp.category_detector import (
    detect_scam_category
)


TEST_MESSAGES = [

    (
        "BANKING",
        """
        URGENT! Your bank account has been
        blocked. Complete KYC verification
        immediately.
        """
    ),

    (
        "UPI",
        """
        Your UPI payment failed.
        Scan this QR code and complete
        the refund verification.
        """
    ),

    (
        "JOB",
        """
        Congratulations! You have been selected
        for a high salary work from home job.
        Pay the registration fee to continue.
        """
    ),

    (
        "PRIZE",
        """
        Congratulations! You have won a
        lottery prize and cashback reward.
        Claim your gift immediately.
        """
    ),

    (
        "DELIVERY",
        """
        Your parcel delivery is on hold.
        Pay the customs fee to receive
        your shipment.
        """
    ),

    (
        "DIGITAL ARREST",
        """
        Your Aadhaar is linked to a criminal
        investigation. The police will arrest
        you unless you cooperate immediately.
        """
    ),

    (
        "INVESTMENT",
        """
        Invest today in our crypto trading
        platform and double your money with
        guaranteed profits.
        """
    ),

    (
        "CREDENTIAL",
        """
        Your account will be suspended.
        Verify your password and OTP
        immediately.
        """
    ),
]


def main():

    print("=" * 80)

    print(
        "CYBERSHIELD — SCAM CATEGORY DETECTION"
    )

    print("=" * 80)

    for name, message in TEST_MESSAGES:

        result = detect_scam_category(
            message
        )

        print("\n" + "-" * 80)

        print(
            f"Test: {name}"
        )

        print(
            f"Detected category: "
            f"{result['category']}"
        )

        print(
            f"Confidence: "
            f"{result['confidence']}%"
        )

        print(
            "Matched keywords:",
            result["matched_keywords"]
        )


if __name__ == "__main__":

    main()