import pytest
import base64
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.remote_sensing.validation import InputValidator, ValidationError

def test_valid_image_payload():
    # Valid base64 encoded dummy string
    dummy_bytes = b"\x89PNG\r\n\x1a\n" + b"\x00" * 50
    b64 = base64.b64encode(dummy_bytes).decode("utf-8")
    size = InputValidator.validate_image_payload(b64, "image/png", "test.png")
    assert size == len(dummy_bytes)

def test_empty_image_payload():
    with pytest.raises(ValidationError, match="empty or invalid"):
        InputValidator.validate_image_payload("", "image/png")

def test_malformed_base64():
    with pytest.raises(ValidationError, match="malformed"):
        InputValidator.validate_image_payload("!!!not_base64!!!", "image/png")

def test_unsupported_mime_type():
    dummy_bytes = b"sample content"
    b64 = base64.b64encode(dummy_bytes).decode("utf-8")
    with pytest.raises(ValidationError, match="Unsupported file format"):
        InputValidator.validate_image_payload(b64, "application/pdf", "document.pdf")

def test_dual_scenes_validation():
    meta_a = {"width": 512, "height": 512, "crs": "EPSG:4326", "modality": "OPTICAL"}
    meta_b = {"width": 512, "height": 512, "crs": "EPSG:4326", "modality": "OPTICAL"}
    # Should pass without error
    InputValidator.validate_dual_scenes(meta_a, meta_b, mode="bitemporal")
