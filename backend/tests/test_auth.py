import pytest
from app.utils.security import hash_password, verify_password, create_access_token, decode_access_token

def test_password_hashing():
    pw = "SuperSecurePassword123"
    hashed = hash_password(pw)
    assert hashed != pw
    assert verify_password(pw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_token_generation_and_decoding():
    payload = {"sub": "42", "role": "Government Officer"}
    token = create_access_token(payload)
    assert isinstance(token, str)
    decoded = decode_access_token(token)
    assert decoded["sub"] == "42"
    assert decoded["role"] == "Government Officer"
