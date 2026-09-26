import logging
import numpy as np
from typing import Dict, Any, Optional, List
from app.models.base import BaseModel
from app.remote_sensing.registration import align_image_pair
from app.remote_sensing.preprocessing import convert_array_to_base64_png, normalize_to_uint8

logger = logging.getLogger("satquery.optical_sar")

class OpticalSARAnalyzer(BaseModel):
    def __init__(self):
        super().__init__(model_name="SatFusionNet-OpticalSAR", task_type="optical_sar")

    def predict(
        self, 
        images: List[np.ndarray], 
        query: Optional[str] = None, 
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if len(images) < 2:
            raise ValueError("Optical+SAR analysis requires 2 co-registered images (Optical & SAR).")

        img_opt, img_sar = images[0], images[1]
        img_opt, img_sar_aligned, reg_info = align_image_pair(img_opt, img_sar)

        h, w = img_opt.shape[:2]
        opt_u8 = normalize_to_uint8(img_opt)
        sar_u8 = normalize_to_uint8(img_sar_aligned)

        # Grayscale extraction
        if opt_u8.ndim == 3 and opt_u8.shape[2] >= 3:
            opt_rgb = opt_u8[:, :, :3]
        else:
            gray_opt = opt_u8 if opt_u8.ndim == 2 else opt_u8[:, :, 0]
            opt_rgb = np.stack([gray_opt]*3, axis=-1)

        if sar_u8.ndim == 3 and sar_u8.shape[2] >= 3:
            sar_gray = (0.299 * sar_u8[:, :, 0] + 0.587 * sar_u8[:, :, 1] + 0.114 * sar_u8[:, :, 2]).astype(np.uint8)
        else:
            sar_gray = sar_u8 if sar_u8.ndim == 2 else sar_u8[:, :, 0]

        # Fusion: Blend optical RGB with SAR backscatter grayscale intensity
        fused_rgb = (0.5 * opt_rgb.astype(float) + 0.5 * np.stack([sar_gray]*3, axis=-1).astype(float)).astype(np.uint8)

        # SAR water body mask (low backscatter < 40)
        sar_water_mask = np.where(sar_gray < 40, 255, 0).astype(np.uint8)
        
        # SAR high double-bounce urban mask (high backscatter > 200)
        sar_urban_mask = np.where(sar_gray > 200, 255, 0).astype(np.uint8)

        fused_b64 = convert_array_to_base64_png(fused_rgb)
        sar_water_b64 = convert_array_to_base64_png(sar_water_mask)
        sar_urban_b64 = convert_array_to_base64_png(sar_urban_mask)

        q = query or "Use optical and SAR images together to identify built-up and water-covered regions."

        answer = (
            f"Joint Optical-SAR cross-modal analysis completed across {w}x{h} scene. "
            f"Combining Optical spectral reflectance with SAR microwave backscatter intensity enables cloud/shadow illumination invariant classification. "
            f"SAR backscatter isolated {int(np.count_nonzero(sar_water_mask))} specular water pixels and {int(np.count_nonzero(sar_urban_mask))} double-bounce urban scatterers."
        )

        evidence = [
            {
                "id": "ev_fused_scene",
                "type": "fused",
                "title": "Cross-Modal Optical + SAR Fused Composite",
                "description": "Pixel-level fusion combining Optical spectral reflectance with SAR microwave backscatter amplitude.",
                "data_base64": fused_b64,
                "statistics": {
                    "fusion_technique": "Dual-Modality Cross-Channel Blend",
                    "scene_width": w,
                    "scene_height": h
                }
            },
            {
                "id": "ev_sar_water_mask",
                "type": "mask",
                "title": "SAR Specular Water Mask (Low Backscatter)",
                "description": "Microwave specular reflection mask detecting water bodies invariant to cloud cover.",
                "data_base64": sar_water_b64,
                "statistics": {
                    "water_pixels": int(np.count_nonzero(sar_water_mask))
                }
            },
            {
                "id": "ev_sar_urban_mask",
                "type": "mask",
                "title": "SAR Double-Bounce Urban Mask (High Backscatter)",
                "description": "Corner reflection mask isolating man-made metallic and concrete structures.",
                "data_base64": sar_urban_b64,
                "statistics": {
                    "urban_high_scatterers": int(np.count_nonzero(sar_urban_mask))
                }
            }
        ]

        return {
            "answer": answer,
            "confidence": None,
            "confidence_label": "Not available",
            "models": [self.model_name],
            "evidence": evidence
        }
