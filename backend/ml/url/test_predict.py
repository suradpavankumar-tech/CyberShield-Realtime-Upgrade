from ml.url.predict import get_url_predictor


def main():

    predictor = get_url_predictor()

    urls = [
        "https://www.google.com",
        "https://secure-bank-login.example.xyz/verify/account",
        "http://192.168.1.100/login",
        "https://bit.ly/3Example",
    ]

    for url in urls:

        print("\n" + "=" * 80)

        print(
            f"URL: {url}"
        )

        result = predictor.predict(
            url
        )

        print(
            f"Prediction: "
            f"{result['prediction']}"
        )

        print(
            f"Phishing probability: "
            f"{result['phishing_probability']:.4f}"
        )

        print(
            f"Legitimate probability: "
            f"{result['legitimate_probability']:.4f}"
        )


if __name__ == "__main__":
    main()