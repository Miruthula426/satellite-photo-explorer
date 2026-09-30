import os
import pytest
import numpy as np
from unittest.mock import MagicMock, patch

from app.models.vqa.vqa_model import (
    GenericVLMOrchestrator,
    SpectralStatisticsBaseline,
    RemoteSensingVLMProvider,
    GenericVLMSynthesisAdapter
)
from app.agent.controller import agent_controller
from app.schemas.analysis import AnalysisRequest, ImageInput
from app.remote_sensing.preprocessing import convert_array_to_base64_png

def test_provider_initialization():
    """1. Test real VLM provider properties and honesty metadata."""
    provider = RemoteSensingVLMProvider()
    assert provider.model_name == "Florence-2-base"
    assert provider.model_id == "microsoft/Florence-2-base"
    assert provider.provider_name == "RemoteSensingVLMProvider"
    assert provider.is_available is False or bool(provider.checkpoint_path and os.path.exists(provider.checkpoint_path))

def test_missing_checkpoint_availability():
    """2 & 3. Test missing checkpoint handling and lazy load safety."""
    with patch.dict(os.environ, {"RS_VLM_CHECKPOINT_PATH": "non_existent_weights_dir"}):
        p = RemoteSensingVLMProvider()
        assert p.is_available is False
        loaded = p.load()
        assert loaded is False
        assert p._load_failed is True

def test_multiband_nan_preprocessing():
    """4. Test robust preprocessing on 4-band multispectral rasters with NaNs."""
    orchestrator = GenericVLMOrchestrator()
    img_4band = np.random.randint(10, 240, (64, 64, 4), dtype=np.uint8).astype(np.float32)
    img_4band[10:15, 10:15, :] = np.nan  # Inject NaNs

    res = orchestrator.predict(
        [img_4band], 
        query="Analyze multispectral band characteristics.",
        metadata={"is_geotiff": True, "driver": "GTiff", "nodata": -9999}
    )
    assert "answer" in res
    provenance = res.get("preprocessing", {})
    assert provenance.get("source_bands") == 4
    assert provenance.get("nan_detected") is True
    assert "multispectral_bands_1_2_3_to_rgb" in provenance.get("preprocessing", "")
    assert provenance.get("normalization") == "percentile_2_98"

def test_fallback_chain_behavior():
    """5. Test explicit fallback reporting when real VLM weights are not mounted."""
    orchestrator = GenericVLMOrchestrator()
    img = np.random.randint(50, 200, (64, 64, 3), dtype=np.uint8)

    # Ensure neither local weights nor Gemini API key are active for deterministic fallback
    with patch.dict(os.environ, {"RS_VLM_CHECKPOINT_PATH": "", "GEMINI_API_KEY": ""}):
        orchestrator.real_vlm_provider._is_loaded = False
        res = orchestrator.predict([img], query="Describe scene", metadata={})

        assert res["primary_model"] == "Florence-2-base"
        assert res["actual_model_used"] == "SpectralStatisticsBaseline"
        assert res["fallback_used"] is True
        assert res["implementation_status"] == "baseline"

def test_mocked_florence_real_vlm_inference():
    """6. Test real VLM inference flow when checkpoint is active (using mock)."""
    orchestrator = GenericVLMOrchestrator()
    img = np.random.randint(50, 200, (64, 64, 3), dtype=np.uint8)

    mock_res = {
        "answer": "An agricultural crop parcel with irrigation canals is identified.",
        "model_name": "Florence-2-base",
        "provider": "RemoteSensingVLMProvider",
        "model_type": "PRETRAINED_GENERAL_VLM",
        "is_remote_sensing_adapted": False,
        "adaptation_status": "pretrained_general_vlm",
        "evidence_based": True,
        "implementation_status": "pretrained_model",
        "confidence": None,
        "confidence_label": "Not calibrated (General-Purpose Pretrained VLM)",
        "preprocessing": {"source_bands": 3}
    }

    from unittest.mock import PropertyMock

    with patch.object(RemoteSensingVLMProvider, "is_available", new_callable=PropertyMock, return_value=True), \
         patch.object(RemoteSensingVLMProvider, "predict", return_value=mock_res):
        
        res = orchestrator.predict([img], query="Identify land use", metadata={})
        assert res["primary_model"] == "Florence-2-base"
        assert res["actual_model_used"] == "Florence-2-base"
        assert res["fallback_used"] is False
        assert res["implementation_status"] == "pretrained_model"
        assert res["is_remote_sensing_adapted"] is False
        assert res["adaptation_status"] == "pretrained_general_vlm"
        assert "agricultural crop parcel" in res["answer"]

def test_vqa_trace_fallback_logging():
    """7 & 8. Test that agent trace logs FALLBACK_TRIGGERED when VLM weights are absent."""
    img = np.random.randint(50, 200, (64, 64, 3), dtype=np.uint8)
    b64_img = convert_array_to_base64_png(img)

    req = AnalysisRequest(
        query="What is the surface feature?",
        mode="single",
        images=[ImageInput(data=b64_img, filename="test.png", role="primary")]
    )

    with patch.dict(os.environ, {"RS_VLM_CHECKPOINT_PATH": "", "GEMINI_API_KEY": ""}):
        resp = agent_controller.process_request(req)
        assert resp.task == "vqa"
        assert resp.primary_model == "Florence-2-base"
        assert resp.fallback_used is True
        assert resp.actual_model_used == "SpectralStatisticsBaseline"

        step_names = [s.step for s in resp.trace.steps]
        assert "FALLBACK_TRIGGERED" in step_names
        assert "MODEL_EXECUTED" in step_names

def test_scientific_honesty_florence():
    """Verify that Florence-2 is never claimed to be remote-sensing fine-tuned."""
    provider = RemoteSensingVLMProvider()
    orchestrator = GenericVLMOrchestrator()
    assert provider.model_id == "microsoft/Florence-2-base"
    assert orchestrator.is_remote_sensing_adapted is False

@pytest.mark.skipif(
    not os.getenv("RS_VLM_CHECKPOINT_PATH") or not os.path.exists(os.getenv("RS_VLM_CHECKPOINT_PATH", "")),
    reason="RS_VLM_CHECKPOINT_PATH not configured with physical weights directory"
)
def test_optional_physical_weights_integration():
    """Optional integration test executing against mounted physical Florence-2 weights."""
    provider = RemoteSensingVLMProvider()
    assert provider.is_available is True
    img = np.random.randint(50, 200, (64, 64, 3), dtype=np.uint8)
    res = provider.predict([img], query="What is in this image?", metadata={})
    assert len(res["answer"]) > 0
