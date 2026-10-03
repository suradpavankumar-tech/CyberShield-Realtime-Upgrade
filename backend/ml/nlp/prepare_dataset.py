from pathlib import Path

import pandas as pd


BASE_DIR = Path(__file__).parent

INPUT_FILE = (
    BASE_DIR
    / "datasets"
    / "SMSSpamCollection"
)

OUTPUT_FILE = (
    BASE_DIR
    / "datasets"
    / "messages_dataset.csv"
)


def main():

    print("=" * 80)
    print(
        "CYBERSHIELD — NLP DATASET PREPARATION"
    )
    print("=" * 80)

    if not INPUT_FILE.exists():

        raise FileNotFoundError(
            f"Dataset not found:\n"
            f"{INPUT_FILE}"
        )

    print("\nLoading dataset...")

    dataframe = pd.read_csv(
        INPUT_FILE,
        sep="\t",
        header=None,
        names=[
            "label",
            "message"
        ],
        encoding="utf-8"
    )

    print(
        f"Original shape: "
        f"{dataframe.shape}"
    )

    # ------------------------------------------------
    # Convert labels
    # ------------------------------------------------

    dataframe["label"] = (
        dataframe["label"]
        .map(
            {
                "ham": 0,
                "spam": 1
            }
        )
    )

    # ------------------------------------------------
    # Remove invalid rows
    # ------------------------------------------------

    dataframe = dataframe.dropna(
        subset=[
            "message",
            "label"
        ]
    )

    dataframe["message"] = (
        dataframe["message"]
        .astype(str)
        .str.strip()
    )

    dataframe = dataframe[
        dataframe["message"] != ""
    ]

    # ------------------------------------------------
    # Remove duplicates
    # ------------------------------------------------

    before = len(dataframe)

    dataframe = dataframe.drop_duplicates(
        subset=["message"]
    )

    duplicates_removed = (
        before - len(dataframe)
    )

    # ------------------------------------------------
    # Keep only required columns
    # ------------------------------------------------

    dataframe = dataframe[
        [
            "message",
            "label"
        ]
    ]

    dataframe = dataframe.reset_index(
        drop=True
    )

    # ------------------------------------------------
    # Save
    # ------------------------------------------------

    dataframe.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print(
        f"\nDuplicates removed: "
        f"{duplicates_removed}"
    )

    print(
        f"Final shape: "
        f"{dataframe.shape}"
    )

    print("\nTarget distribution:")

    print(
        dataframe["label"]
        .value_counts()
    )

    print("\nTarget percentages:")

    print(
        (
            dataframe["label"]
            .value_counts(
                normalize=True
            )
            * 100
        ).round(2)
    )

    print("\nSample messages:")

    print(
        dataframe.head(10).to_string(
            index=False
        )
    )

    print(
        f"\nSaved to:\n"
        f"{OUTPUT_FILE}"
    )


if __name__ == "__main__":

    main()