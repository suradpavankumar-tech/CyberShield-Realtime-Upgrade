from pathlib import Path

import joblib
import pandas as pd

from ml.url.feature_extractor import (
    MODEL_FEATURES,
    extract_url_features,
)


BASE_DIR = Path(__file__).parent

MODEL_FILE = (
    BASE_DIR
    / "models"
    / "url_phishing_model.joblib"
)


class URLPredictor:

    def __init__(self):

        if not MODEL_FILE.exists():

            raise FileNotFoundError(
                f"URL model not found: "
                f"{MODEL_FILE}"
            )

        self.model = joblib.load(
            MODEL_FILE
        )

    def predict(
        self,
        url: str,
    ) -> dict:

        features = extract_url_features(
            url
        )

        dataframe = pd.DataFrame(
            [features],
            columns=MODEL_FEATURES,
        )

        prediction = int(
            self.model.predict(
                dataframe
            )[0]
        )

        probabilities = (
            self.model.predict_proba(
                dataframe
            )[0]
        )

        phishing_probability = float(
            probabilities[1]
        )

        legitimate_probability = float(
            probabilities[0]
        )

        return {

            "prediction": prediction,

            "phishing_probability": (
                phishing_probability
            ),

            "legitimate_probability": (
                legitimate_probability
            ),

            "features": features,
        }


_predictor = None


def get_url_predictor():

    global _predictor

    if _predictor is None:

        _predictor = URLPredictor()

    return _predictor