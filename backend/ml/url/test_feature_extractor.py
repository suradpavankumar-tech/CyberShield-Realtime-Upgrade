from pprint import pprint

from ml.url.feature_extractor import (
    MODEL_FEATURES,
    extract_url_features,
    extract_feature_vector,
)


test_url = (
    "https://secure-bank-login.example.xyz/"
    "verify/account"
)


print("=" * 80)
print("CYBERSHIELD URL ML FEATURE EXTRACTOR")
print("=" * 80)

print("\nURL:")
print(test_url)

features = extract_url_features(
    test_url
)

print("\nNamed features:")

pprint(features)

print("\nFeature count:")
print(len(features))

print("\nExpected feature count:")
print(len(MODEL_FEATURES))

print("\nFeature vector:")

vector = extract_feature_vector(
    test_url
)

print(vector)