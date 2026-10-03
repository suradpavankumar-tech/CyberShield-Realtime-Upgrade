from ml.url.predict import get_url_predictor
from ml.url.feature_extractor import (
    MODEL_FEATURES,
    extract_url_features,
)


def investigate(url: str):

    predictor = get_url_predictor()

    features = extract_url_features(url)

    result = predictor.predict(url)

    print("\n" + "=" * 90)
    print(f"URL: {url}")
    print("=" * 90)

    print(
        f"\nPrediction: "
        f"{'PHISHING' if result['prediction'] == 1 else 'LEGITIMATE'}"
    )

    print(
        f"Phishing probability: "
        f"{result['phishing_probability'] * 100:.2f}%"
    )

    print("\nFeatures:")

    for feature in MODEL_FEATURES:

        print(
            f"{feature:35} "
            f"{features[feature]}"
        )


def main():

    urls = [
        "https://github.com",
        "https://google.com",
        "https://github.com/login",
        "https://github.com/account",
        "https://github.com/security",
    ]

    for url in urls:
        investigate(url)


if __name__ == "__main__":
    main()