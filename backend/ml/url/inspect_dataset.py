from pathlib import Path

import pandas as pd


DATA_FILE = (
    Path(__file__).parent
    / "datasets"
    / "phiusiil_urls.csv"
)


def main():

    print("=" * 80)
    print("CYBERSHIELD — URL DATASET INSPECTION")
    print("=" * 80)

    df = pd.read_csv(DATA_FILE)

    print("\nShape:")
    print(df.shape)

    print("\nColumns:")
    for index, column in enumerate(df.columns):
        print(
            f"{index:02d}. {column}"
        )

    print("\nData types:")
    print(df.dtypes)

    print("\nMissing values:")
    missing = df.isnull().sum()

    print(
        missing[
            missing > 0
        ]
    )

    print("\nDuplicate rows:")
    print(
        df.duplicated().sum()
    )

    target_column = "label"

    if target_column in df.columns:

        print("\nTarget distribution:")
        print(
            df[target_column].value_counts()
        )

    print("\nFirst 5 rows:")
    print(
        df.head()
    )


if __name__ == "__main__":
    main()