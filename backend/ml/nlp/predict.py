from pathlib import Path

import joblib
import pandas as pd
from scipy.sparse import hstack

from ml.nlp.preprocessing import normalize_text
from ml.nlp.feature_extractor import (
    extract_behavioral_features,
)


BASE_DIR = Path(__file__).parent

MODEL_DIR = (
    BASE_DIR / "models"
)


MODEL_FILE = (
    MODEL_DIR / "message_model.joblib"
)

TFIDF_FILE = (
    MODEL_DIR / "tfidf_vectorizer.joblib"
)

SCALER_FILE = (
    MODEL_DIR / "behavioral_scaler.joblib"
)

METADATA_FILE = (
    MODEL_DIR / "model_metadata.json"
)


class MessagePredictor:

    def __init__(self):

        self.model = joblib.load(
            MODEL_FILE
        )

        self.tfidf = joblib.load(
            TFIDF_FILE
        )

        self.scaler = joblib.load(
            SCALER_FILE
        )

        self.metadata = joblib.load(
            METADATA_FILE
        ) if False else None

    def _build_features(
        self,
        message: str
    ):

        normalized = normalize_text(
            message
        )

        # -----------------------------------------
        # TF-IDF
        # -----------------------------------------

        tfidf_features = (
            self.tfidf.transform(
                [normalized]
            )
        )

        # -----------------------------------------
        # Behavioral features
        # -----------------------------------------

        behavioral = (
            extract_behavioral_features(
                message
            )
        )

        behavioral_dataframe = (
            pd.DataFrame(
                [behavioral]
            )
        )

        behavioral_scaled = (
            self.scaler.transform(
                behavioral_dataframe
            )
        )

        # -----------------------------------------
        # Combined representation
        # -----------------------------------------

        combined = hstack(
            [
                tfidf_features,
                behavioral_scaled
            ]
        )

        return combined

    def predict(
        self,
        message: str
    ):

        if not message or not message.strip():

            raise ValueError(
                "Message cannot be empty."
            )

        features = self._build_features(
            message
        )

        prediction = (
            self.model.predict(
                features
            )[0]
        )

        decision_score = (
            self.model.decision_function(
                features
            )[0]
        )

        # Convert SVM decision score
        # into a smooth 0-100 probability-like
        # confidence value.
        #
        # This is NOT a calibrated probability.
        # It is a risk-oriented score.

        import math

        phishing_probability = (
            1 /
            (
                1 +
                math.exp(
                    -float(decision_score)
                )
            )
        )

        phishing_probability *= 100

        phishing_probability = max(
            0,
            min(
                100,
                phishing_probability
            )
        )

        risk_level = (
            "HIGH"
            if phishing_probability >= 70
            else
            "MEDIUM"
            if phishing_probability >= 40
            else
            "LOW"
        )

        behavioral_features = (
            extract_behavioral_features(
                message
            )
        )

        return {

            "prediction":
                (
                    "SUSPICIOUS"
                    if prediction == 1
                    else
                    "LEGITIMATE"
                ),

            "phishing_probability":
                round(
                    phishing_probability,
                    2
                ),

            "risk_score":
                round(
                    phishing_probability
                ),

            "risk_level":
                risk_level,

            "behavioral_features":
                behavioral_features,
        }


_predictor = None


def get_message_predictor():

    global _predictor

    if _predictor is None:

        _predictor = (
            MessagePredictor()
        )

    return _predictor