from ml.url.predict import get_url_predictor


LEGITIMATE_URLS = [

    "https://www.google.com",

    "https://www.microsoft.com",

    "https://www.amazon.com",

    "https://www.wikipedia.org",

    "https://www.apple.com",

    "https://github.com",

    "https://www.linkedin.com",

    "https://www.netflix.com",

    "https://www.adobe.com",

    "https://www.paypal.com",
]


SUSPICIOUS_URLS = [

    "https://secure-bank-login.example.xyz/verify/account",

    "http://192.168.1.100/login",

    "http://paypal-account-verification.example.xyz/login",

    "https://microsoft-security-verification.example.xyz/account",

    "https://bank-login-verify.example.xyz/secure",

    "http://account-password-reset.example.xyz/login",

    "https://claim-your-prize.example.xyz/winner",

    "https://urgent-kyc-verification.example.xyz/update",

    "https://payment-confirmation.example.xyz/verify",

    "https://bit.ly/3Example",
]


def run_group(
    predictor,
    title,
    urls,
):

    print("\n" + "=" * 90)

    print(title)

    print("=" * 90)

    for url in urls:

        result = predictor.predict(
            url
        )

        probability = (
            result[
                "phishing_probability"
            ]
            * 100
        )

        prediction = (
            "PHISHING"
            if result["prediction"] == 1
            else "LEGITIMATE"
        )

        print(
            f"\n{url}"
        )

        print(
            f"Prediction: {prediction}"
        )

        print(
            f"Phishing probability: "
            f"{probability:.2f}%"
        )


def main():

    predictor = get_url_predictor()

    run_group(
        predictor,
        "KNOWN / COMMON LEGITIMATE URLS",
        LEGITIMATE_URLS,
    )

    run_group(
        predictor,
        "SUSPICIOUS / PHISHING-LIKE URLS",
        SUSPICIOUS_URLS,
    )


if __name__ == "__main__":
    main()