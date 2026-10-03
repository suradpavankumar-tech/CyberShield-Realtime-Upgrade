from pathlib import Path

import pandas as pd
from ucimlrepo import fetch_ucirepo


DATA_DIR = Path(__file__).parent / "datasets"
OUTPUT_FILE = DATA_DIR / "phiusiil_urls.csv"


def main():
    DATA_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    print("Downloading PhiUSIIL dataset from UCI...")

    dataset = fetch_ucirepo(id=967)

    features = dataset.data.features.copy()
    targets = dataset.data.targets.copy()

    print(f"Features shape: {features.shape}")
    print(f"Target shape: {targets.shape}")

    # Combine features and target.
    data = pd.concat(
        [
            features,
            targets
        ],
        axis=1
    )

    data.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print()
    print("Dataset saved to:")
    print(OUTPUT_FILE)

    print()
    print("Dataset shape:")
    print(data.shape)

    print()
    print("Columns:")
    print(data.columns.tolist())

    print()
    print("Target distribution:")
    print(
        data.iloc[:, -1].value_counts()
    )


if __name__ == "__main__":
    main()