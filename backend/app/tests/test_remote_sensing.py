import pytest
import numpy as np
import io
import base64
from PIL import Image
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.remote_sensing.geotiff import parse_geotiff_or_image
from app.remote_sensing.modality import detect_image_modality
from app.remote_sensing.preprocessing import normalize_to_uint8, convert_array_to_base64_png
from app.remote_sensing.registration import align_image_pair

def test_parse_image():
    # Create simple RGB test image
    img = Image.new("RGB", (128, 128), color=(40, 80, 120))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

    arr, meta = parse_geotiff_or_image(b64, "test_scene.png")
    assert arr.shape == (128, 128, 3)
    assert meta["width"] == 128
    assert meta["height"] == 128
    assert meta["bands"] == 3

def test_modality_detection():
    # Optical RGB
    opt_arr = np.random.randint(0, 255, (64, 64, 3), dtype=np.uint8)
    mod_opt = detect_image_modality(opt_arr, {"filename": "optical.png"}, hint="optical")
    assert mod_opt == "OPTICAL"

    # SAR single-channel / hint
    sar_arr = np.random.randint(0, 255, (64, 64), dtype=np.uint8)
    mod_sar = detect_image_modality(sar_arr, {"filename": "risat_sar.tif"}, hint="sar")
    assert mod_sar == "SAR"

def test_percentile_normalization():
    # uint16 simulated satellite raster
    u16_arr = (np.random.rand(64, 64) * 4096).astype(np.uint16)
    u8_arr = normalize_to_uint8(u16_arr)
    assert u8_arr.dtype == np.uint8
    assert np.min(u8_arr) >= 0
    assert np.max(u8_arr) <= 255

def test_image_pair_alignment():
    img_a = np.zeros((100, 100, 3), dtype=np.uint8)
    img_b = np.zeros((150, 120, 3), dtype=np.uint8)
    aligned_a, aligned_b, info = align_image_pair(img_a, img_b)
    assert aligned_a.shape == (100, 100, 3)
    assert aligned_b.shape == (100, 100, 3)
    assert info["aligned"] is True
