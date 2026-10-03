from pathlib import Path

import pandas as pd


BASE_DIR = Path(__file__).parent

INPUT_FILE = (
    BASE_DIR
    / "datasets"
    / "phiusiil_urls.csv"
)

OUTPUT_FILE = (
    BASE_DIR
    / "datasets"
    / "url_ml_dataset.csv"
)


MODEL_FEATURES = [
    "URLLength",
    "DomainLength",
    "IsDomainIP",
    "TLDLength",
    "NoOfSubDomain",
    "HasObfuscation",
    "NoOfObfuscatedChar",
    "ObfuscationRatio",
    "NoOfLettersInURL",
    "LetterRatioInURL",
    "NoOfDegitsInURL",
    "DegitRatioInURL",
    "NoOfEqualsInURL",
    "NoOfQMarkInURL",
    "NoOfAmpersandInURL",
    "NoOfOtherSpecialCharsInURL",
    "SpacialCharRatioInURL",
    "IsHTTPS",
]


def main():

    print("=" * 80)
    print("CYBERSHIELD — URL ML DATASET PREPARATION")
    print("=" * 80)

    print("\nLoading dataset...")

    df = pd.read_csv(INPUT_FILE)

    print(
        f"Original shape: {df.shape}"
    )

    required_columns = (
        ["URL"]
        + MODEL_FEATURES
        + ["label"]
    )

    missing_columns = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:

        raise ValueError(
            "Missing required columns: "
            + str(missing_columns)
        )

    # --------------------------------------------------
    # SELECT REQUIRED COLUMNS
    # --------------------------------------------------

    data = df[
        required_columns
    ].copy()

    print(
        f"Selected shape: {data.shape}"
    )

    # --------------------------------------------------
    # NORMALIZE URL
    # --------------------------------------------------

    data["URL"] = (
        data["URL"]
        .astype(str)
        .str.strip()
    )

    # Remove empty URLs.

    data = data[
        data["URL"].ne("")
    ]

    # --------------------------------------------------
    # REMOVE DUPLICATE URLs ONLY
    # --------------------------------------------------

    before = len(data)

    data = data.drop_duplicates(
        subset=["URL"],
        keep="first"
    )

    after = len(data)

    print(
        f"Duplicate URLs removed: "
        f"{before - after}"
    )

    # --------------------------------------------------
    # REMOVE MISSING VALUES
    # --------------------------------------------------

    before = len(data)

    data = data.dropna(
        subset=MODEL_FEATURES + ["label"]
    )

    after = len(data)

    print(
        f"Rows removed for missing values: "
        f"{before - after}"
    )

    # --------------------------------------------------
    # VALIDATE TARGET
    # --------------------------------------------------

    data["label"] = pd.to_numeric(
        data["label"],
        errors="coerce"
    )

    data = data.dropna(
        subset=["label"]
    )

    data["label"] = data[
        "label"
    ].astype(int)

    # Keep only valid classes.

    data = data[
        data["label"].isin([0, 1])
    ]

    # --------------------------------------------------
    # DATASET SUMMARY
    # --------------------------------------------------

    print(
        f"\nFinal dataset shape: "
        f"{data.shape}"
    )

    print("\nTarget distribution:")

    print(
        data["label"].value_counts()
    )

    print("\nTarget percentages:")

    print(
        data["label"]
        .value_counts(
            normalize=True
        )
        .mul(100)
        .round(2)
    )

    print("\nURL examples:")

    print(
        data[
            ["URL", "label"]
        ].head(10)
    )

    # --------------------------------------------------
    # SAVE
    # --------------------------------------------------

    data.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print("\nSaved to:")

    print(OUTPUT_FILE)


if __name__ == "__main__":
    main()