from ml.nlp.predict import (
    get_message_predictor
)


TEST_MESSAGES = [

    (
        "BANKING SCAM",
        """
        URGENT! Your bank account will be
        permanently blocked today. Verify your
        KYC immediately using the link below.
        Confirm your OTP now.
        """
    ),

    (
        "UPI SCAM",
        """
        Your UPI payment has failed.
        Verify your account immediately and
        enter your OTP to receive the refund.
        """
    ),

    (
        "JOB SCAM",
        """
        Congratulations! You have been selected
        for a high salary job. Pay Rs 2000
        registration fee immediately to confirm
        your position.
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
        "DELIVERY SCAM",
        """
        Your parcel is currently on hold.
        Pay Rs 25 immediately to complete
        delivery verification.
        """
    ),

    (
        "DIGITAL ARREST SCAM",
        """
        Your Aadhaar has been linked to a
        criminal investigation. Contact the
        police officer immediately or legal
        action will be taken.
        """
    ),

    (
        "LEGITIMATE",
        """
        Your order has been delivered successfully.
        Thank you for shopping with us.
        """
    ),

    (
        "LEGITIMATE",
        """
        Your appointment is confirmed for tomorrow
        at 10 AM. Please arrive 10 minutes early.
        """
    ),
]


def main():

    predictor = (
        get_message_predictor()
    )

    print("=" * 80)

    print(
        "CYBERSHIELD — NLP MESSAGE PREDICTION"
    )

    print("=" * 80)

    for category, message in TEST_MESSAGES:

        result = predictor.predict(
            message
        )

        print("\n" + "-" * 80)

        print(
            f"Test category: {category}"
        )

        print(
            f"Message: "
            f"{message.strip()}"
        )

        print(
            f"Prediction: "
            f"{result['prediction']}"
        )

        print(
            f"Risk score: "
            f"{result['risk_score']}/100"
        )

        print(
            f"Risk level: "
            f"{result['risk_level']}"
        )

        print(
            f"Phishing probability: "
            f"{result['phishing_probability']}%"
        )

        print("\nBehavioral signals:")

        for name, value in (
            result[
                "behavioral_features"
            ].items()
        ):

            if value:

                print(
                    f"  {name}: {value}"
                )


if __name__ == "__main__":

    main()