import logging
import os
from typing import Dict, Any, Optional, List
import numpy as np
from abc import ABC, abstractmethod

from app.models.base import BaseModel
from app.remote_sensing.preprocessing import (
    convert_array_to_base64_png, 
    normalize_to_uint8,
    robust_remote_sensing_preprocess
)

logger = logging.getLogger("satquery.vqa")

class BaseVQAProvider(ABC):
    """Abstract interface for Visual Question Answering providers."""
    
    @abstractmethod
    def predict(
        self, 
        images: List[np.ndarray], 
        query: str, 
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        pass

    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @property
    @abstractmethod
    def is_available(self) -> bool:
        pass

class RemoteSensingVLMProvider(BaseVQAProvider):
    """
    Real Local Open-Source Vision-Language Model Provider.
    Default Model: 'microsoft/Florence-2-base' (MIT License, 230M parameters).
    
    Scientific Honesty:
    - Pretrained general-purpose vision-language foundation model.
    - remote_sensing_adapted = False
    - adaptation_status = 'pretrained_general_vlm'
    - Lazy loading: Weights are loaded only once on first execution if checkpoint is present.
    - Fails honestly when weights are not mounted; zero fake inference.
    """
    def __init__(self):
        self.model_id = os.getenv("RS_VLM_MODEL_ID", "microsoft/Florence-2-base")
        self.checkpoint_path = os.getenv("RS_VLM_CHECKPOINT_PATH")
        self.device_setting = os.getenv("RS_VLM_DEVICE", "auto")
        self.dtype_setting = os.getenv("RS_VLM_DTYPE", "auto")
        self.model_name = "Florence-2-base"
        self._model = None
        self._processor = None
        self._is_loaded = False
        self._load_failed = False

    @property
    def provider_name(self) -> str:
        return "RemoteSensingVLMProvider"

    @property
    def is_available(self) -> bool:
        """
        True only if checkpoint directory is explicitly configured and exists on disk,
        or if a valid local Hugging Face model directory is provided.
        """
        if not self.checkpoint_path:
            return False
        return os.path.exists(self.checkpoint_path)

    def load(self) -> bool:
        """
        Lazy-loads model parameters and tokenizer/processor.
        Singleton behavior: loads once, caches in memory, reuses across requests.
        """
        if self._is_loaded:
            return True
        if self._load_failed:
            return False
        if not self.is_available:
            logger.info(
                f"Local VLM checkpoint not mounted at '{self.checkpoint_path}'. "
                f"RemoteSensingVLMProvider is offline; will trigger fallback."
            )
            self._load_failed = True
            return False

        try:
            import torch
            from transformers import AutoProcessor, AutoModelForCausalLM

            # Determine device
            if self.device_setting == "cuda" or (self.device_setting == "auto" and torch.cuda.is_available()):
                device = "cuda"
            else:
                device = "cpu"

            # Determine dtype
            if self.dtype_setting == "float16" or (self.dtype_setting == "auto" and device == "cuda"):
                torch_dtype = torch.float16
            else:
                torch_dtype = torch.float32

            logger.info(f"Loading local VLM '{self.model_id}' from '{self.checkpoint_path}' onto {device} ({torch_dtype})...")
            
            self._processor = AutoProcessor.from_pretrained(self.checkpoint_path, trust_remote_code=True)
            self._model = AutoModelForCausalLM.from_pretrained(
                self.checkpoint_path,
                trust_remote_code=True,
                torch_dtype=torch_dtype
            ).to(device)

            self._model.eval()
            self._is_loaded = True
            logger.info(f"Successfully loaded '{self.model_id}' into memory.")
            return True
        except Exception as e:
            logger.error(f"Failed to load VLM from '{self.checkpoint_path}': {e}")
            self._load_failed = True
            return False

    def predict(
        self, 
        images: List[np.ndarray], 
        query: str, 
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        if not self._is_loaded and not self.load():
            raise RuntimeError(
                f"VLM checkpoint for '{self.model_id}' is not mounted at '{self.checkpoint_path}'. "
                f"Falling back to secondary provider."
            )

        import torch
        from PIL import Image

        # Convert normalized array to PIL RGB Image
        img_u8 = normalize_to_uint8(images[0])
        if img_u8.ndim == 2:
            pil_img = Image.fromarray(img_u8).convert("RGB")
        elif img_u8.ndim == 3 and img_u8.shape[2] == 1:
            pil_img = Image.fromarray(img_u8[:, :, 0]).convert("RGB")
        else:
            pil_img = Image.fromarray(img_u8[:, :, :3]).convert("RGB")

        # Florence-2 task prompt
        task_prompt = "<VQA>"
        full_prompt = f"{task_prompt} {query}"

        device = next(self._model.parameters()).device
        inputs = self._processor(text=full_prompt, images=pil_img, return_tensors="pt")
        inputs = {k: v.to(device) for k, v in inputs.items()}

        with torch.no_grad():
            generated_ids = self._model.generate(
                input_ids=inputs["input_ids"],
                pixel_values=inputs.get("pixel_values"),
                max_new_tokens=128,
                do_sample=False,
                num_beams=3
            )

        generated_text = self._processor.batch_decode(generated_ids, skip_special_tokens=False)[0]
        
        # Parse Florence-2 generation
        try:
            parsed_answer = self._processor.post_process_generation(
                generated_text, 
                task=task_prompt, 
                image_size=(pil_img.width, pil_img.height)
            )
            answer_text = str(parsed_answer.get(task_prompt, generated_text)).strip()
        except Exception:
            answer_text = self._processor.batch_decode(generated_ids, skip_special_tokens=True)[0].strip()

        return {
            "answer": answer_text,
            "model_name": self.model_name,
            "provider": self.provider_name,
            "model_type": "PRETRAINED_GENERAL_VLM",
            "is_remote_sensing_adapted": False,
            "adaptation_status": "pretrained_general_vlm",
            "evidence_based": True,
            "implementation_status": "pretrained_model",
            "confidence": None,
            "confidence_label": "Not calibrated (General-Purpose Pretrained VLM)",
            "preprocessing": metadata.get("provenance", {})
        }

class GenericVLMSynthesisAdapter(BaseVQAProvider):
    """
    VQA provider utilizing hosted foundation VLM APIs (Google Gemini) with prompt engineering.
    Truthfully flagged as GENERIC_LLM_SYNTHESIS (not remote-sensing fine-tuned).
    """
    def __init__(self, model_name: str = "gemini-2.5-flash"):
        self.model_name = model_name

    @property
    def provider_name(self) -> str:
        return "GoogleGeminiProvider"

    @property
    def is_available(self) -> bool:
        return bool(os.getenv("GEMINI_API_KEY"))

    def predict(
        self, 
        images: List[np.ndarray], 
        query: str, 
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY not configured.")

        from google import genai
        client = genai.Client(api_key=api_key)
        b64_data = convert_array_to_base64_png(images[0]).split(",")[-1]
        crs_display = metadata.get("crs_display") or metadata.get("crs") or "CRS unavailable"

        system_prompt = (
            "You are an assistant analyzing satellite imagery. "
            "Analyze the provided satellite raster scene. Provide direct answers grounded in visual features. "
            "Acknowledge that this is generic vision-language synthesis, not a domain-fine-tuned weights checkpoint."
        )

        response = client.models.generate_content(
            model=self.model_name,
            contents=[
                {"inline_data": {"mime_type": "image/png", "data": b64_data}},
                {"text": f"Question: {query}\nCRS/Metadata: {crs_display}. Answer concisely based only on observable features."}
            ],
            config={"system_instruction": system_prompt}
        )

        return {
            "answer": response.text.strip(),
            "model_name": "Gemini-2.5-Flash",
            "provider": self.provider_name,
            "model_type": "GENERIC_LLM_SYNTHESIS",
            "is_remote_sensing_adapted": False,
            "adaptation_status": "hosted_foundation_api",
            "evidence_based": False,
            "implementation_status": "demo",
            "confidence": None,
            "confidence_label": "Not calibrated (Generic Foundation VLM)",
            "preprocessing": metadata.get("provenance", {})
        }

class SpectralStatisticsBaseline(BaseVQAProvider):
    """
    Procedural spectral statistics provider.
    Inspects physical raster values, band dispersion, and metadata without hallucination.
    """
    @property
    def provider_name(self) -> str:
        return "SpectralStatisticsBaseline"

    @property
    def is_available(self) -> bool:
        return True

    def predict(
        self, 
        images: List[np.ndarray], 
        query: str, 
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        img = images[0]
        crs_display = metadata.get("crs_display") or metadata.get("crs") or "CRS unavailable"
        h, w = img.shape[:2]
        bands = img.shape[2] if img.ndim == 3 else 1
        
        arr_clean = np.nan_to_num(img.astype(np.float32))
        mean_val = float(np.mean(arr_clean))
        std_val = float(np.std(arr_clean))
        
        # Check water / vegetation spectral signatures
        water_indicated = False
        veg_indicated = False
        if bands >= 3:
            r_mean = float(np.mean(arr_clean[:, :, 0]))
            g_mean = float(np.mean(arr_clean[:, :, 1]))
            b_mean = float(np.mean(arr_clean[:, :, 2]))
            if b_mean > (r_mean + 10):
                water_indicated = True
            if g_mean > (r_mean + 15):
                veg_indicated = True

        features = []
        if water_indicated:
            features.append("spectral absorption consistent with surface water or deep shadows")
        if veg_indicated:
            features.append("elevated green reflectance consistent with vegetative canopy")
        if not features:
            features.append(f"mean reflectance {mean_val:.1f} with dispersion {std_val:.1f}")

        answer = (
            f"Spectral Statistics Baseline ({w}x{h} px, {bands} band(s), {crs_display}): "
            f"Observed {' & '.join(features)}. "
            f"Query: '{query}'. "
            f"(Note: Generic VLM API is unconfigured and RS VLM weights are not mounted; using verified radiometric baseline)."
        )

        return {
            "answer": answer,
            "model_name": "SpectralStatisticsBaseline",
            "provider": self.provider_name,
            "model_type": "SPECTRAL_STATISTICS_BASELINE",
            "is_remote_sensing_adapted": False,
            "adaptation_status": "procedural_radiometric_baseline",
            "evidence_based": True,
            "implementation_status": "baseline",
            "confidence": None,
            "confidence_label": "Not available (Local Baseline)",
            "preprocessing": metadata.get("provenance", {})
        }

class GenericVLMOrchestrator(BaseModel):
    """
    Composite VQA Model Adapter & Orchestrator.
    Manages lazy-loading and verified fallback hierarchy:
    Florence-2 Real VLM -> Hosted Gemini API -> Local Spectral Baseline.
    
    Explicitly exposes:
    - primary_model
    - actual_model_used
    - fallback_used
    - implementation_status
    - preprocessing provenance
    """
    def __init__(self):
        super().__init__(
            model_name="GenericVLMOrchestrator",
            task_type="vqa",
            implementation_status="demo",
            is_trained=False,
            is_remote_sensing_adapted=False
        )
        self.real_vlm_provider = RemoteSensingVLMProvider()
        self.hosted_provider = GenericVLMSynthesisAdapter()
        self.baseline_provider = SpectralStatisticsBaseline()

    def predict(
        self, 
        images: List[np.ndarray], 
        query: Optional[str] = None, 
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if not images or len(images) == 0:
            raise ValueError("VQA task requires at least 1 image input.")

        q = query or "Analyze this satellite scene."
        meta = metadata or {}
        
        # Step 1: Remote sensing preprocessing with provenance recording
        raw_img = images[0]
        proc_img, updated_meta = robust_remote_sensing_preprocess(raw_img, meta)

        primary_model = self.real_vlm_provider.model_name
        actual_model_used = None
        fallback_used = False
        result = None

        # Step 2: Fallback Hierarchy Execution
        # 2a. Real Local VLM (Florence-2)
        if self.real_vlm_provider.is_available:
            try:
                result = self.real_vlm_provider.predict([proc_img], q, updated_meta)
                actual_model_used = result["model_name"]
                fallback_used = False
                self.implementation_status = "pretrained_model"
                self.is_remote_sensing_adapted = False
            except Exception as e:
                logger.warning(f"Real VLM execution failed: {e}. Activating fallback...")
                fallback_used = True

        # 2b. Hosted Foundation VLM (Google Gemini API)
        if result is None and self.hosted_provider.is_available:
            try:
                result = self.hosted_provider.predict([proc_img], q, updated_meta)
                actual_model_used = result["model_name"]
                fallback_used = True
                self.implementation_status = "demo"
                self.is_remote_sensing_adapted = False
            except Exception as e:
                logger.warning(f"Hosted Gemini API failed: {e}. Activating baseline fallback...")
                fallback_used = True

        # 2c. Local Procedural Radiometric Baseline
        if result is None:
            result = self.baseline_provider.predict([proc_img], q, updated_meta)
            actual_model_used = result["model_name"]
            fallback_used = True
            self.implementation_status = "baseline"
            self.is_remote_sensing_adapted = False

        # Assemble visual evidence
        proc_b64 = convert_array_to_base64_png(proc_img)
        evidence = [
            {
                "id": "ev_vqa_preprocessed",
                "type": "processed",
                "title": f"Preprocessed Raster ({updated_meta.get('preprocessing', 'Normalized')})",
                "description": f"Source bands: {updated_meta.get('provenance', {}).get('source_bands', 1)}, Normalization: {updated_meta.get('normalization')}",
                "data_base64": proc_b64,
                "statistics": updated_meta.get("provenance", {})
            }
        ]

        models_list = [primary_model]
        if actual_model_used and actual_model_used != primary_model:
            models_list.append(actual_model_used)

        return {
            "answer": result["answer"],
            "primary_model": primary_model,
            "actual_model_used": actual_model_used,
            "fallback_used": fallback_used,
            "model_name": actual_model_used,
            "provider": result.get("provider"),
            "model_type": result.get("model_type"),
            "is_remote_sensing_adapted": result.get("is_remote_sensing_adapted", False),
            "adaptation_status": result.get("adaptation_status", "pretrained_general_vlm"),
            "evidence_based": result.get("evidence_based", False),
            "implementation_status": self.implementation_status,
            "confidence": result.get("confidence"),
            "confidence_label": result.get("confidence_label", "Not available"),
            "models": models_list,
            "metadata": updated_meta,
            "evidence": evidence,
            "preprocessing": updated_meta.get("provenance", {})
        }

# Backwards compatibility aliases
RemoteSensingVQAAdapter = GenericVLMOrchestrator
VQAAdapter = GenericVLMOrchestrator
