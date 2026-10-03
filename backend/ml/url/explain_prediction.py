from pprint import pprint

from ml.url.predict import get_url_predictor
from ml.url.feature_extractor import (
    MODEL_FEATURES,
    extract_url_features,
)


def explain(url: str):

    predictor = get_url_predictor()

    result = predictor.predict(
        url
    )

    features = extract_url_features(
        url
    )

    print("\n" + "=" * 80)

    print(
        f"URL: {url}"
    )

    print("=" * 80)

    print(
        f"\nPrediction: "
        f"{'PHISHING' if result['prediction'] == 1 else 'LEGITIMATE'}"
    )

    print(
        f"Phishing probability: "
        f"{result['phishing_probability'] * 100:.2f}%"
    )

    print(
        f"Legitimate probability: "
        f"{result['legitimate_probability'] * 100:.2f}%"
    )

    print("\nFeatures sent to model:")

    for feature in MODEL_FEATURES:

        print(
            f"{feature:35} "
            f"{features[feature]}"
        )


def main():

    urls = [

        "https://www.google.com",

        "https://www.microsoft.com",

        "https://www.amazon.com",

        "https://www.wikipedia.org",

        "https://secure-bank-login.example.xyz/verify/account",

        "http://192.168.1.100/login",

    ]

    for url in urls:

        explain(url)


if __name__ == "__main__":
    main()