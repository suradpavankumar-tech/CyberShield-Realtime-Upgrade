from pathlib import Path
import json
import time

import joblib
import pandas as pd

from sklearn.ensemble import (
    GradientBoostingClassifier,
    HistGradientBoostingClassifier,
    RandomForestClassifier,
)
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier


BASE_DIR = Path(__file__).parent

DATA_FILE = (
    BASE_DIR
    / "datasets"
    / "url_only_dataset.csv"
)

MODEL_DIR = (
    BASE_DIR
    / "models"
)

RESULTS_DIR = (
    BASE_DIR
    / "results"
)


FEATURE_COLUMNS = [
    "url_length",
    "hostname_length",
    "path_length",
    "query_length",
    "fragment_length",
    "domain_length",
    "subdomain_count",
    "dot_count",
    "hyphen_count",
    "underscore_count",
    "slash_count",
    "question_mark_count",
    "equal_sign_count",
    "ampersand_count",
    "at_symbol_count",
    "percent_count",
    "digit_count",
    "letter_count",
    "special_character_count",
    "digit_ratio",
    "letter_ratio",
    "special_character_ratio",
    "has_ip_address",
    "has_port",
    "has_query",
    "has_fragment",
    "is_https",
    "has_obfuscation",
    "obfuscation_count",
    "suspicious_keyword_count",
    "suspicious_tld",
    "brand_keyword_count",
    "path_depth",
    "has_punycode",
    "has_double_slash_path",
]


RANDOM_STATE = 42


def load_dataset():

    print("\nLoading URL-only dataset...")

    df = pd.read_csv(
        DATA_FILE
    )

    print(
        f"Dataset shape: {df.shape}"
    )

    missing = [
        column
        for column in (
            FEATURE_COLUMNS + ["phishing"]
        )
        if column not in df.columns
    ]

    if missing:

        raise ValueError(
            "Missing columns: "
            + str(missing)
        )

    X = df[
        FEATURE_COLUMNS
    ].copy()

    y = df[
        "phishing"
    ].astype(int)

    return X, y


def build_models():

    return {

        "Logistic Regression": Pipeline(
            [
                (
                    "scaler",
                    StandardScaler()
                ),
                (
                    "classifier",
                    LogisticRegression(
                        max_iter=1000,
                        random_state=RANDOM_STATE
                    )
                ),
            ]
        ),

        "Decision Tree": DecisionTreeClassifier(
            max_depth=20,
            min_samples_leaf=2,
            random_state=RANDOM_STATE
        ),

        "Random Forest": RandomForestClassifier(
            n_estimators=250,
            max_depth=25,
            min_samples_leaf=2,
            n_jobs=-1,
            random_state=RANDOM_STATE
        ),

        
    }


def evaluate_model(
    model,
    X_train,
    X_test,
    y_train,
    y_test,
):

    start = time.time()

    model.fit(
        X_train,
        y_train
    )

    training_time = (
        time.time() - start
    )

    predictions = model.predict(
        X_test
    )

    probabilities = model.predict_proba(
        X_test
    )[:, 1]

    metrics = {

        "accuracy": accuracy_score(
            y_test,
            predictions
        ),

        "precision": precision_score(
            y_test,
            predictions,
            zero_division=0
        ),

        "recall": recall_score(
            y_test,
            predictions,
            zero_division=0
        ),

        "f1": f1_score(
            y_test,
            predictions,
            zero_division=0
        ),

        "roc_auc": roc_auc_score(
            y_test,
            probabilities
        ),

        "training_time_seconds": (
            training_time
        ),
    }

    return metrics, model


def main():

    print("=" * 80)
    print("CYBERSHIELD — URL-ONLY ML TRAINING")
    print("=" * 80)

    MODEL_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    RESULTS_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    X, y = load_dataset()

    print("\nTarget distribution:")

    print(
        y.value_counts()
    )

    print("\nTarget meaning:")

    print(
        "0 = LEGITIMATE"
    )

    print(
        "1 = PHISHING"
    )

    # --------------------------------------------------
    # STRATIFIED SPLIT
    # --------------------------------------------------

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

    print(
        f"\nTraining samples: "
        f"{len(X_train):,}"
    )

    print(
        f"Testing samples: "
        f"{len(X_test):,}"
    )

    # --------------------------------------------------
    # TRAIN MODELS
    # --------------------------------------------------

    models = build_models()

    results = {}

    trained_models = {}

    for name, model in models.items():

        print("\n" + "-" * 80)

        print(
            f"Training: {name}"
        )

        metrics, trained_model = (
            evaluate_model(
                model,
                X_train,
                X_test,
                y_train,
                y_test,
            )
        )

        results[name] = metrics

        trained_models[name] = (
            trained_model
        )

        print(
            f"Accuracy : "
            f"{metrics['accuracy']:.4f}"
        )

        print(
            f"Precision: "
            f"{metrics['precision']:.4f}"
        )

        print(
            f"Recall   : "
            f"{metrics['recall']:.4f}"
        )

        print(
            f"F1 Score : "
            f"{metrics['f1']:.4f}"
        )

        print(
            f"ROC-AUC  : "
            f"{metrics['roc_auc']:.4f}"
        )

        print(
            f"Training time: "
            f"{metrics['training_time_seconds']:.2f}s"
        )

    # --------------------------------------------------
    # COMPARISON
    # --------------------------------------------------

    comparison = pd.DataFrame(
        results
    ).T

    comparison.index.name = (
        "model"
    )

    comparison = comparison.sort_values(
        by="f1",
        ascending=False
    )

    print("\n" + "=" * 80)

    print(
        "URL-ONLY MODEL COMPARISON"
    )

    print("=" * 80)

    print(
        comparison.to_string()
    )

    # --------------------------------------------------
    # BEST MODEL
    # --------------------------------------------------

    best_model_name = (
        comparison.index[0]
    )

    best_model = trained_models[
        best_model_name
    ]

    print("\n" + "=" * 80)

    print(
        f"BEST MODEL: "
        f"{best_model_name}"
    )

    print("=" * 80)

    # --------------------------------------------------
    # SAVE MODEL
    # --------------------------------------------------

    model_file = (
        MODEL_DIR
        / "url_phishing_model.joblib"
    )

    joblib.dump(
        best_model,
        model_file
    )

    print(
        f"\nModel saved to:\n"
        f"{model_file}"
    )

    # --------------------------------------------------
    # SAVE METADATA
    # --------------------------------------------------

    best_metrics = (
        comparison.iloc[0]
        .to_dict()
    )

    metadata = {

        "model_name": (
            best_model_name
        ),

        "feature_columns": (
            FEATURE_COLUMNS
        ),

        "feature_count": (
            len(FEATURE_COLUMNS)
        ),

        "target": {
            "0": "LEGITIMATE",
            "1": "PHISHING",
        },

        "random_state": (
            RANDOM_STATE
        ),

        "test_size": 0.20,

        "selection_metric": "f1",

        "metrics": best_metrics,
    }

    metadata_file = (
        MODEL_DIR
        / "model_metadata.json"
    )

    with open(
        metadata_file,
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            metadata,
            file,
            indent=4
        )

    # --------------------------------------------------
    # SAVE COMPARISON
    # --------------------------------------------------

    comparison_file = (
        RESULTS_DIR
        / "url_only_model_comparison.csv"
    )

    comparison.to_csv(
        comparison_file
    )

    print(
        f"\nMetadata saved to:\n"
        f"{metadata_file}"
    )

    print(
        f"\nComparison saved to:\n"
        f"{comparison_file}"
    )


if __name__ == "__main__":
    main()