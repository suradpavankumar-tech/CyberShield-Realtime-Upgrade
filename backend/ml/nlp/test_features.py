from ml.nlp.feature_extractor import (
    extract_behavioral_features,
)


MESSAGE = """
URGENT! Your bank account will be permanently
blocked today. Verify your KYC immediately
using the link below and confirm your OTP.
"""


def main():

    features = extract_behavioral_features(
        MESSAGE
    )

    print("=" * 80)

    print("CYBERSHIELD NLP FEATURE EXTRACTION")

    print("=" * 80)

    print("\nMessage:")

    print(MESSAGE)

    print("\nExtracted Features:")

    for name, value in features.items():

        print(
            f"{name:25} {value}"
        )


if __name__ == "__main__":

    main()