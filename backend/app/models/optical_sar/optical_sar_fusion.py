import logging
import numpy as np
from typing import Dict, Any, Optional, List
from app.models.base import BaseModel
from app.remote_sensing.registration import align_image_pair
from app.remote_sensing.preprocessing import convert_array_to_base64_png, normalize_to_uint8

logger = logging.getLogger("satquery.optical_sar")

class BaseOpticalSARFusion(BaseModel):
    """Abstract base adapter for Optical + SAR multimodal fusion."""
    def __init__(self, model_name: str, implementation_status: str = "baseline"):
        super().__init__(
            model_name=model_name,
            task_type="optical_sar",
            implementation_status=implementation_status,
            is_trained=False,
            is_remote_sensing_adapted=False
        )

class OpticalSARVisualizationBaseline(BaseOpticalSARFusion):
    """
    Classical Optical + SAR composite visualization and thresholding baseline.
    Renamed truthfully: NOT a deep cross-modal neural fusion model.

    Scientific SAR Handling:
    - Preserves sensor & polarization metadata (HH, HV, VV, VH) when present.
    - Thresholds are configurable and documented as empirical baselines,
      NOT universal physical constants (true water mapping requires radiometric calibration sigma0/gamma0).
    """
    def __init__(
        self,
        water_intensity_threshold: float = 40.0,
        urban_intensity_threshold: float = 200.0
    ):
        super().__init__(
            model_name="OpticalSARVisualizationBaseline",
            implementation_status="baseline"
        )
        self.water_threshold = water_intensity_threshold
        self.urban_threshold = urban_intensity_threshold

    def predict(
        self, 
        images: List[np.ndarray], 
        query: Optional[str] = None, 
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if len(images) < 2:
            raise ValueError("Optical+SAR analysis requires 2 images (Optical & SAR).")

        meta = metadata or {}
        meta_opt = meta.get("optical") or meta.get("primary", {})
        meta_sar = meta.get("sar") or meta.get("secondary", {})

        img_opt, img_sar = images[0], images[1]
        img_opt, img_sar_aligned, reg_info = align_image_pair(img_opt, img_sar, meta_opt, meta_sar)

        h, w = img_opt.shape[:2]
        opt_u8 = normalize_to_uint8(img_opt)
        sar_u8 = normalize_to_uint8(img_sar_aligned)

        # Grayscale / RGB extraction
        if opt_u8.ndim == 3 and opt_u8.shape[2] >= 3:
            opt_rgb = opt_u8[:, :, :3]
        else:
            gray_opt = opt_u8 if opt_u8.ndim == 2 else opt_u8[:, :, 0]
            opt_rgb = np.stack([gray_opt]*3, axis=-1)

        if sar_u8.ndim == 3 and sar_u8.shape[2] >= 3:
            sar_gray = (0.299 * sar_u8[:, :, 0] + 0.587 * sar_u8[:, :, 1] + 0.114 * sar_u8[:, :, 2]).astype(np.uint8)
        else:
            sar_gray = sar_u8 if sar_u8.ndim == 2 else sar_u8[:, :, 0]

        # Dual-modality alpha blend (explicitly labeled visualization composite)
        fused_rgb = (0.5 * opt_rgb.astype(float) + 0.5 * np.stack([sar_gray]*3, axis=-1).astype(float)).astype(np.uint8)

        # Extract polarization and sensor metadata if available
        polarization = meta_sar.get("polarization") or meta_sar.get("tags", {}).get("POLARIZATION", "Unknown")
        sensor_type = meta_sar.get("sensor") or meta_sar.get("tags", {}).get("SENSOR", "C-Band SAR")

        # Empirical candidate masks with documented thresholds
        # Note: True specular water requires radiometric calibration (sigma0 < -15 dB)
        sar_water_mask = np.where(sar_gray < self.water_threshold, 255, 0).astype(np.uint8)
        sar_urban_mask = np.where(sar_gray > self.urban_threshold, 255, 0).astype(np.uint8)

        water_px = int(np.count_nonzero(sar_water_mask))
        urban_px = int(np.count_nonzero(sar_urban_mask))

        fused_b64 = convert_array_to_base64_png(fused_rgb)
        sar_water_b64 = convert_array_to_base64_png(sar_water_mask)
        sar_urban_b64 = convert_array_to_base64_png(sar_urban_mask)

        answer = (
            f"Dual-modality Optical + SAR visualization baseline generated across {w}x{h} scene. "
            f"Optical spectral reflectance blended with {sensor_type} microwave intensity. "
            f"Identified {water_px:,} low-backscatter pixels (empirical threshold < {self.water_threshold}) "
            f"and {urban_px:,} high-scatter candidate pixels (threshold > {self.urban_threshold}). "
            f"Co-registration status: {reg_info.get('co_registered')}."
        )

        evidence = [
            {
                "id": "ev_fused_scene",
                "type": "fused",
                "title": "Cross-Modal 50/50 Visualization Composite (Baseline)",
                "description": "Linear 50/50 alpha blend of optical RGB reflectance and SAR intensity for visual inspection.",
                "data_base64": fused_b64,
                "statistics": {
                    "fusion_technique": "Linear Dual-Modality Visual Blend (Baseline)",
                    "scene_width": w,
                    "scene_height": h,
                    "co_registered": reg_info.get("co_registered"),
                    "registration_method": reg_info.get("registration_method")
                }
            },
            {
                "id": "ev_sar_water_mask",
                "type": "mask",
                "title": f"SAR Low Backscatter Mask (< {self.water_threshold})",
                "description": (
                    "Empirical low-intensity microwave mask. NOTE: True physical water delineation "
                    "requires radiometric calibration (sigma0 in dB) and incidence angle normalization."
                ),
                "data_base64": sar_water_b64,
                "statistics": {
                    "low_backscatter_pixels": water_px,
                    "applied_threshold": self.water_threshold,
                    "polarization": polarization
                }
            },
            {
                "id": "ev_sar_urban_mask",
                "type": "mask",
                "title": f"SAR High Backscatter Mask (> {self.urban_threshold})",
                "description": "High double-bounce corner reflection candidate mask.",
                "data_base64": sar_urban_b64,
                "statistics": {
                    "high_scatter_pixels": urban_px,
                    "applied_threshold": self.urban_threshold,
                    "polarization": polarization
                }
            }
        ]

        return {
            "answer": answer,
            "model_type": "visualization_baseline",
            "implementation_status": "baseline",
            "confidence": None,
            "confidence_label": "Not available (Visualization Baseline)",
            "models": [self.model_name],
            "registration_info": reg_info,
            "evidence": evidence
        }

class OpticalSARFusionModel(BaseOpticalSARFusion):
    """
    Pluggable Multimodal Deep Learning Fusion Architecture.
    Represents feature-level neural fusion (e.g. cross-attention or dual-encoder).
    Declared as unavailable when trained checkpoints are not mounted.
    """
    def __init__(self, checkpoint_path: Optional[str] = None):
        super().__init__(
            model_name="OpticalSARNeuralFusion",
            implementation_status="unavailable"
        )
        self.checkpoint_path = checkpoint_path
        self._is_loaded = False

    def load(self) -> None:
        if not self.checkpoint_path:
            self._is_loaded = False
            return
        self._is_loaded = False

    def predict(
        self, 
        images: List[np.ndarray], 
        query: Optional[str] = None, 
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        raise NotImplementedError("OpticalSARNeuralFusion checkpoint not mounted.")

# Backwards compatibility alias
OpticalSARAnalyzer = OpticalSARVisualizationBaseline
