from pathlib import Path
import time
import json

import joblib
import pandas as pd

from scipy.sparse import hstack

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import LinearSVC

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
)

from ml.nlp.preprocessing import normalize_text
from ml.nlp.feature_extractor import (
    extract_behavioral_features,
)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).parent

DATASET_FILE = (
    BASE_DIR
    / "datasets"
    / "messages_dataset.csv"
)

MODEL_DIR = (
    BASE_DIR
    / "models"
)

MODEL_DIR.mkdir(
    parents=True,
    exist_ok=True
)

RANDOM_STATE = 42


# ============================================================
# BEHAVIORAL FEATURES
# ============================================================

def build_behavioral_features(
    dataframe: pd.DataFrame
) -> pd.DataFrame:

    rows = []

    for message in dataframe["message"]:

        rows.append(
            extract_behavioral_features(
                message
            )
        )

    return pd.DataFrame(rows)


# ============================================================
# MODEL DEFINITIONS
# ============================================================

def build_models():

    return {

        "Logistic Regression":
            LogisticRegression(
                max_iter=2000,
                class_weight="balanced",
                random_state=RANDOM_STATE
            ),

        "Naive Bayes":
            MultinomialNB(),

        "Linear SVM":
            LinearSVC(
                class_weight="balanced",
                max_iter=10000,
                random_state=RANDOM_STATE
            ),
    }


# ============================================================
# EVALUATION
# ============================================================

def evaluate_model(
    name,
    model,
    x_test,
    y_test
):

    predictions = model.predict(
        x_test
    )

    accuracy = accuracy_score(
        y_test,
        predictions
    )

    precision = precision_score(
        y_test,
        predictions,
        zero_division=0
    )

    recall = recall_score(
        y_test,
        predictions,
        zero_division=0
    )

    f1 = f1_score(
        y_test,
        predictions,
        zero_division=0
    )

    if hasattr(
        model,
        "predict_proba"
    ):

        scores = model.predict_proba(
            x_test
        )[:, 1]

    else:

        scores = model.decision_function(
            x_test
        )

    roc_auc = roc_auc_score(
        y_test,
        scores
    )

    print("\n" + "-" * 80)

    print(
        f"Training: {name}"
    )

    print(
        f"Accuracy : {accuracy:.4f}"
    )

    print(
        f"Precision: {precision:.4f}"
    )

    print(
        f"Recall   : {recall:.4f}"
    )

    print(
        f"F1 Score : {f1:.4f}"
    )

    print(
        f"ROC-AUC  : {roc_auc:.4f}"
    )

    return {

        "accuracy": accuracy,

        "precision": precision,

        "recall": recall,

        "f1": f1,

        "roc_auc": roc_auc,
    }


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 80)

    print(
        "CYBERSHIELD — NLP MESSAGE MODEL TRAINING"
    )

    print("=" * 80)

    # --------------------------------------------------------
    # Load dataset
    # --------------------------------------------------------

    print("\nLoading dataset...")

    dataframe = pd.read_csv(
        DATASET_FILE
    )

    print(
        f"Dataset shape: "
        f"{dataframe.shape}"
    )

    print("\nTarget distribution:")

    print(
        dataframe["label"]
        .value_counts()
    )

    # --------------------------------------------------------
    # Normalize messages
    # --------------------------------------------------------

    dataframe["message"] = (
        dataframe["message"]
        .astype(str)
        .map(normalize_text)
    )

    dataframe = dataframe[
        dataframe["message"].str.len() > 0
    ].reset_index(drop=True)

    # --------------------------------------------------------
    # Behavioral features
    # --------------------------------------------------------

    print(
        "\nExtracting behavioral NLP features..."
    )

    behavioral = (
        build_behavioral_features(
            dataframe
        )
    )

    print(
        f"Behavioral feature shape: "
        f"{behavioral.shape}"
    )

    # --------------------------------------------------------
    # Train/test split
    # --------------------------------------------------------

    (
        x_train_text,
        x_test_text,
        x_train_behavioral,
        x_test_behavioral,
        y_train,
        y_test
    ) = train_test_split(

        dataframe["message"],

        behavioral,

        dataframe["label"],

        test_size=0.20,

        random_state=RANDOM_STATE,

        stratify=dataframe["label"]
    )

    print(
        f"\nTraining samples: "
        f"{len(x_train_text):,}"
    )

    print(
        f"Testing samples: "
        f"{len(x_test_text):,}"
    )

    # --------------------------------------------------------
    # TF-IDF
    # --------------------------------------------------------

    print(
        "\nBuilding TF-IDF representation..."
    )

    tfidf = TfidfVectorizer(

        ngram_range=(1, 2),

        min_df=2,

        max_df=0.98,

        sublinear_tf=True,

        max_features=50000
    )

    x_train_tfidf = (
        tfidf.fit_transform(
            x_train_text
        )
    )

    x_test_tfidf = (
        tfidf.transform(
            x_test_text
        )
    )

    print(
        f"TF-IDF feature count: "
        f"{x_train_tfidf.shape[1]}"
    )

    # --------------------------------------------------------
    # Behavioral feature scaling
    # --------------------------------------------------------

    scaler = StandardScaler()

    x_train_behavioral_scaled = (
        scaler.fit_transform(
            x_train_behavioral
        )
    )

    x_test_behavioral_scaled = (
        scaler.transform(
            x_test_behavioral
        )
    )

    # --------------------------------------------------------
    # Combined representation
    # --------------------------------------------------------

    x_train_combined = hstack(
        [
            x_train_tfidf,
            x_train_behavioral_scaled
        ]
    )

    x_test_combined = hstack(
        [
            x_test_tfidf,
            x_test_behavioral_scaled
        ]
    )

    print(
        f"Combined feature shape: "
        f"{x_train_combined.shape}"
    )

    # --------------------------------------------------------
    # Train models
    # --------------------------------------------------------

    models = build_models()

    results = {}

    trained_models = {}

    feature_types = {}

    for name, model in models.items():

        start_time = time.time()

        # ====================================================
        # NAIVE BAYES
        #
        # MultinomialNB requires non-negative features.
        # Therefore it uses TF-IDF ONLY.
        # ====================================================

        if name == "Naive Bayes":

            train_features = (
                x_train_tfidf
            )

            test_features = (
                x_test_tfidf
            )

            feature_type = (
                "tfidf_only"
            )

        # ====================================================
        # LOGISTIC REGRESSION
        # LINEAR SVM
        #
        # These support the combined
        # TF-IDF + behavioral representation.
        # ====================================================

        else:

            train_features = (
                x_train_combined
            )

            test_features = (
                x_test_combined
            )

            feature_type = (
                "tfidf_plus_behavioral"
            )

        model.fit(
            train_features,
            y_train
        )

        metrics = evaluate_model(

            name,

            model,

            test_features,

            y_test
        )

        elapsed = (
            time.time()
            - start_time
        )

        metrics["training_time"] = (
            elapsed
        )

        results[name] = metrics

        trained_models[name] = model

        feature_types[name] = (
            feature_type
        )

        print(
            f"Training time: "
            f"{elapsed:.2f}s"
        )

    # ========================================================
    # MODEL COMPARISON
    # ========================================================

    print("\n" + "=" * 80)

    print(
        "CYBERSHIELD — NLP MODEL COMPARISON"
    )

    print("=" * 80)

    comparison_rows = []

    for name, metrics in results.items():

        comparison_rows.append({

            "Model": name,

            "Accuracy":
                metrics["accuracy"],

            "Precision":
                metrics["precision"],

            "Recall":
                metrics["recall"],

            "F1":
                metrics["f1"],

            "ROC-AUC":
                metrics["roc_auc"],
        })

    comparison = pd.DataFrame(
        comparison_rows
    )

    print(
        comparison.to_string(
            index=False
        )
    )

    # ========================================================
    # SELECT BEST MODEL
    # ========================================================

    best_name = max(

        results,

        key=lambda name:
            results[name]["f1"]
    )

    best_model = (
        trained_models[best_name]
    )

    best_feature_type = (
        feature_types[best_name]
    )

    print("\n" + "=" * 80)

    print(
        f"BEST NLP MODEL: "
        f"{best_name}"
    )

    print(
        f"Feature type: "
        f"{best_feature_type}"
    )

    print(
        f"F1 Score: "
        f"{results[best_name]['f1']:.4f}"
    )

    print(
        f"ROC-AUC: "
        f"{results[best_name]['roc_auc']:.4f}"
    )

    print("=" * 80)

    # ========================================================
    # SAVE BEST MODEL
    # ========================================================

    joblib.dump(

        best_model,

        MODEL_DIR
        / "message_model.joblib"
    )

    joblib.dump(

        tfidf,

        MODEL_DIR
        / "tfidf_vectorizer.joblib"
    )

    joblib.dump(

        scaler,

        MODEL_DIR
        / "behavioral_scaler.joblib"
    )

    # ========================================================
    # SAVE METADATA
    # ========================================================

    metadata = {

        "best_model":
            best_name,

        "feature_type":
            best_feature_type,

        "metrics":
            results,

        "tfidf_features":
            int(
                x_train_tfidf.shape[1]
            ),

        "behavioral_features":
            int(
                x_train_behavioral.shape[1]
            ),

        "combined_features":
            int(
                x_train_combined.shape[1]
            ),

        "random_state":
            RANDOM_STATE,
    }

    with open(

        MODEL_DIR
        / "model_metadata.json",

        "w",

        encoding="utf-8"

    ) as file:

        json.dump(

            metadata,

            file,

            indent=4
        )

    print(
        "\nSaved model artifacts to:"
    )

    print(
        MODEL_DIR
    )


if __name__ == "__main__":

    main()