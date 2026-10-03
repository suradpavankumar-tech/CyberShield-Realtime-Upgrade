from pathlib import Path

import pandas as pd

from ml.url.feature_extractor import (
    MODEL_FEATURES,
    extract_url_features,
)


BASE_DIR = Path(__file__).parent

INPUT_FILE = (
    BASE_DIR
    / "datasets"
    / "phiusiil_urls.csv"
)

OUTPUT_FILE = (
    BASE_DIR
    / "datasets"
    / "url_only_dataset.csv"
)


def main():

    print("=" * 80)
    print("CYBERSHIELD — URL-ONLY DATASET BUILDER")
    print("=" * 80)

    # --------------------------------------------------
    # LOAD ORIGINAL DATASET
    # --------------------------------------------------

    print("\nLoading original dataset...")

    df = pd.read_csv(
        INPUT_FILE
    )

    print(
        f"Original dataset shape: "
        f"{df.shape}"
    )

    # --------------------------------------------------
    # VALIDATE REQUIRED COLUMNS
    # --------------------------------------------------

    required_columns = [
        "URL",
        "label",
    ]

    missing = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing:

        raise ValueError(
            "Missing required columns: "
            + str(missing)
        )

    # --------------------------------------------------
    # KEEP ONLY URL + LABEL
    # --------------------------------------------------

    data = df[
        ["URL", "label"]
    ].copy()

    # --------------------------------------------------
    # CLEAN URL
    # --------------------------------------------------

    data["URL"] = (
        data["URL"]
        .astype(str)
        .str.strip()
    )

    data = data[
        data["URL"].ne("")
    ]

    # --------------------------------------------------
    # REMOVE DUPLICATE URLS
    # --------------------------------------------------

    before = len(data)

    data = data.drop_duplicates(
        subset=["URL"],
        keep="first",
    )

    after = len(data)

    print(
        f"Duplicate URLs removed: "
        f"{before - after}"
    )

    # --------------------------------------------------
    # VALIDATE LABEL
    # --------------------------------------------------

    data["label"] = pd.to_numeric(
        data["label"],
        errors="coerce",
    )

    data = data.dropna(
        subset=["label"]
    )

    data["label"] = (
        data["label"]
        .astype(int)
    )

    data = data[
        data["label"].isin([0, 1])
    ]

    # --------------------------------------------------
    # EXTRACT CYBERSHIELD FEATURES
    # --------------------------------------------------

    print(
        "\nExtracting CyberShield URL features..."
    )

    feature_rows = []

    total = len(data)

    for index, url in enumerate(
        data["URL"],
        start=1,
    ):

        try:

            features = extract_url_features(
                url
            )

            feature_rows.append(
                features
            )

        except Exception as error:

            print(
                f"\nFeature extraction failed "
                f"for URL:\n{url}"
            )

            print(
                f"Error: {error}"
            )

            # Keep the row aligned.
            feature_rows.append(
                {
                    feature: 0
                    for feature
                    in MODEL_FEATURES
                }
            )

        # Progress every 10,000 URLs.

        if index % 10000 == 0:

            print(
                f"Processed "
                f"{index:,}/{total:,} URLs"
            )

    features_df = pd.DataFrame(
        feature_rows,
        columns=MODEL_FEATURES,
    )

    # --------------------------------------------------
    # COMBINE FEATURES + LABEL
    # --------------------------------------------------

    final_df = pd.concat(
        [
            features_df.reset_index(
                drop=True
            ),
            data["label"].reset_index(
                drop=True
            ),
        ],
        axis=1,
    )

    # --------------------------------------------------
    # CREATE PRODUCTION TARGET
    # --------------------------------------------------

    # Original PhiUSIIL:
    #
    # 1 = legitimate
    # 0 = phishing
    #
    # CyberShield:
    #
    # 0 = legitimate
    # 1 = phishing

    final_df["phishing"] = (
        1 - final_df["label"]
    )

    final_df = final_df.drop(
        columns=["label"]
    )

    # --------------------------------------------------
    # REMOVE INVALID VALUES
    # --------------------------------------------------

    final_df = final_df.replace(
        [
            float("inf"),
            float("-inf"),
        ],
        0,
    )

    final_df = final_df.fillna(
        0
    )

    # --------------------------------------------------
    # SAVE DATASET
    # --------------------------------------------------

    final_df.to_csv(
        OUTPUT_FILE,
        index=False,
    )

    # --------------------------------------------------
    # SUMMARY
    # --------------------------------------------------

    print("\n" + "=" * 80)

    print(
        "URL-ONLY DATASET CREATED"
    )

    print("=" * 80)

    print(
        f"\nFinal dataset shape: "
        f"{final_df.shape}"
    )

    print(
        f"\nFeature count: "
        f"{len(MODEL_FEATURES)}"
    )

    print("\nTarget distribution:")

    print(
        final_df[
            "phishing"
        ].value_counts()
    )

    print("\nTarget percentages:")

    print(
        final_df[
            "phishing"
        ]
        .value_counts(
            normalize=True
        )
        .mul(100)
        .round(2)
    )

    print("\nTarget meaning:")

    print(
        "0 = LEGITIMATE"
    )

    print(
        "1 = PHISHING"
    )

    print("\nFeatures:")

    for feature in MODEL_FEATURES:

        print(
            f"- {feature}"
        )

    print("\nSaved to:")

    print(
        OUTPUT_FILE
    )


if __name__ == "__main__":
    main()