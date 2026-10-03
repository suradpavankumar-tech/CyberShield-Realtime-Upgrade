from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import pandas as pd

from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    ConfusionMatrixDisplay,
    roc_auc_score,
    roc_curve,
)


BASE_DIR = Path(__file__).parent

DATA_FILE = (
    BASE_DIR
    / "datasets"
    / "url_ml_dataset.csv"
)

MODEL_FILE = (
    BASE_DIR
    / "models"
    / "url_phishing_model.joblib"
)

RESULTS_DIR = (
    BASE_DIR
    / "results"
)

FEATURE_COLUMNS = [
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


RANDOM_STATE = 42


def main():

    print("=" * 80)
    print("CYBERSHIELD — URL MODEL EVALUATION")
    print("=" * 80)

    RESULTS_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    # --------------------------------------------------
    # LOAD DATA
    # --------------------------------------------------

    print("\nLoading dataset...")

    df = pd.read_csv(
        DATA_FILE
    )

    X = df[
        FEATURE_COLUMNS
    ].copy()

    # 1 = phishing
    # 0 = legitimate

    y = (
        1 - df["label"]
    ).astype(int)

    # --------------------------------------------------
    # RECREATE TEST SPLIT
    # --------------------------------------------------

    from sklearn.model_selection import train_test_split

    (
        X_train,
        X_test,
        y_train,
        y_test
    ) = train_test_split(
        X,
        y,
        test_size=0.20,
        stratify=y,
        random_state=RANDOM_STATE
    )

    # --------------------------------------------------
    # LOAD MODEL
    # --------------------------------------------------

    print("\nLoading trained model...")

    model = joblib.load(
        MODEL_FILE
    )

    print(
        f"Model loaded from:\n{MODEL_FILE}"
    )

    # --------------------------------------------------
    # PREDICTIONS
    # --------------------------------------------------

    predictions = model.predict(
        X_test
    )

    probabilities = model.predict_proba(
        X_test
    )[:, 1]

    # --------------------------------------------------
    # CLASSIFICATION REPORT
    # --------------------------------------------------

    print("\n" + "=" * 80)

    print(
        "CLASSIFICATION REPORT"
    )

    print("=" * 80)

    report = classification_report(
        y_test,
        predictions,
        target_names=[
            "LEGITIMATE",
            "PHISHING"
        ],
        digits=4
    )

    print(report)

    report_file = (
        RESULTS_DIR
        / "classification_report.txt"
    )

    with open(
        report_file,
        "w",
        encoding="utf-8"
    ) as file:

        file.write(report)

    # --------------------------------------------------
    # CONFUSION MATRIX
    # --------------------------------------------------

    matrix = confusion_matrix(
        y_test,
        predictions
    )

    print("\n" + "=" * 80)

    print(
        "CONFUSION MATRIX"
    )

    print("=" * 80)

    print(matrix)

    print("\nMatrix interpretation:")

    print(
        "TN = Legitimate correctly detected"
    )

    print(
        "FP = Legitimate incorrectly flagged as phishing"
    )

    print(
        "FN = Phishing incorrectly classified as legitimate"
    )

    print(
        "TP = Phishing correctly detected"
    )

    display = ConfusionMatrixDisplay(
        confusion_matrix=matrix,
        display_labels=[
            "LEGITIMATE",
            "PHISHING"
        ]
    )

    display.plot()

    plt.title(
        "CyberShield URL Phishing Detection"
    )

    plt.tight_layout()

    confusion_file = (
        RESULTS_DIR
        / "confusion_matrix.png"
    )

    plt.savefig(
        confusion_file,
        dpi=200
    )

    plt.close()

    # --------------------------------------------------
    # ROC CURVE
    # --------------------------------------------------

    auc = roc_auc_score(
        y_test,
        probabilities
    )

    false_positive_rate, true_positive_rate, _ = (
        roc_curve(
            y_test,
            probabilities
        )
    )

    plt.figure()

    plt.plot(
        false_positive_rate,
        true_positive_rate,
        label=f"ROC-AUC = {auc:.4f}"
    )

    plt.plot(
        [0, 1],
        [0, 1],
        linestyle="--"
    )

    plt.xlabel(
        "False Positive Rate"
    )

    plt.ylabel(
        "True Positive Rate"
    )

    plt.title(
        "CyberShield URL ROC Curve"
    )

    plt.legend()

    plt.tight_layout()

    roc_file = (
        RESULTS_DIR
        / "roc_curve.png"
    )

    plt.savefig(
        roc_file,
        dpi=200
    )

    plt.close()

    print(
        f"\nROC-AUC: {auc:.4f}"
    )

    # --------------------------------------------------
    # FEATURE IMPORTANCE
    # --------------------------------------------------

    print("\n" + "=" * 80)

    print(
        "FEATURE IMPORTANCE"
    )

    print("=" * 80)

    classifier = model

    # Random Forest / Decision Tree
    # expose feature_importances_ directly.

    if hasattr(
        classifier,
        "feature_importances_"
    ):

        importance = pd.DataFrame(
            {
                "feature": FEATURE_COLUMNS,
                "importance": (
                    classifier.feature_importances_
                )
            }
        )

        importance = importance.sort_values(
            by="importance",
            ascending=False
        )

        print(
            importance.to_string(
                index=False
            )
        )

        importance_file = (
            RESULTS_DIR
            / "feature_importance.csv"
        )

        importance.to_csv(
            importance_file,
            index=False
        )

        plt.figure()

        top_features = (
            importance.head(10)
            .sort_values(
                "importance"
            )
        )

        plt.barh(
            top_features["feature"],
            top_features["importance"]
        )

        plt.xlabel(
            "Importance"
        )

        plt.title(
            "Top URL Features"
        )

        plt.tight_layout()

        feature_plot = (
            RESULTS_DIR
            / "feature_importance.png"
        )

        plt.savefig(
            feature_plot,
            dpi=200
        )

        plt.close()

        print(
            f"\nFeature importance saved to:"
            f"\n{importance_file}"
        )

    else:

        print(
            "\nThe selected model does not "
            "expose feature_importances_."
        )

    print("\n" + "=" * 80)

    print("EVALUATION COMPLETE")

    print("=" * 80)

    print(
        f"\nClassification report:\n"
        f"{report_file}"
    )

    print(
        f"\nConfusion matrix:\n"
        f"{confusion_file}"
    )

    print(
        f"\nROC curve:\n"
        f"{roc_file}"
    )


if __name__ == "__main__":
    main()