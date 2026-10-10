import pytest
from app.core.security import hash_password, verify_password
from app.schemas.auth import UpdateProfileRequest, ChangePasswordRequest
from app.models.user import User


def test_password_hashing_and_verification():
    plain = "SecureCyberShield2026!#"
    hashed = hash_password(plain)
    assert hashed != plain
    assert verify_password(plain, hashed) is True
    assert verify_password("wrong_password", hashed) is False


def test_update_profile_schema_validation():
    req = UpdateProfileRequest(full_name="Pavan Surad")
    assert req.full_name == "Pavan Surad"

    with pytest.raises(Exception):
        UpdateProfileRequest(full_name="P")  # Min length 2


def test_change_password_schema_validation():
    req = ChangePasswordRequest(
        current_password="OldPassword123!",
        new_password="NewSecretPassword2026!"
    )
    assert req.current_password == "OldPassword123!"
    assert req.new_password == "NewSecretPassword2026!"

    with pytest.raises(Exception):
        ChangePasswordRequest(
            current_password="OldPassword123!",
            new_password="short"  # Min length 8
        )
