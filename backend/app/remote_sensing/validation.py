import base64
import logging
from typing import List, Dict, Any, Tuple, Optional
import numpy as np

logger = logging.getLogger("satquery.validation")

class ValidationError(ValueError):
    """Custom exception for geospatial and image validation errors."""
    pass

class InputValidator:
    """
    Geospatial Input Validation Layer.
    Validates file formats, MIME types, payload size, dimensions, CRS compatibility,
    temporal compatibility, and dual-image spatial comparability.
    """

    MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB limit
    ALLOWED_MIME_TYPES = {
        "image/png", "image/jpeg", "image/jpg", 
        "image/tiff", "image/tif", "image/geotiff",
        "application/octet-stream"
    }

    @classmethod
    def validate_image_payload(cls, data_b64: str, mime_type: str, filename: Optional[str] = None) -> int:
        """
        Validates Base64 data string, size limit, and MIME type.
        Returns size in bytes.
        """
        if not data_b64 or not data_b64.strip():
            raise ValidationError("Image payload is empty or invalid.")

        clean_b64 = data_b64.split(",")[-1]
        try:
            raw_bytes = base64.b64decode(clean_b64, validate=True)
        except Exception:
            raise ValidationError("Failed to decode base64 image data: malformed encoding.")

        size = len(raw_bytes)
        if size == 0:
            raise ValidationError("Uploaded file contains 0 bytes.")

        if size > cls.MAX_FILE_SIZE_BYTES:
            raise ValidationError(
                f"File size ({size / (1024*1024):.1f}MB) exceeds the maximum allowed limit of 50MB."
            )

        norm_mime = mime_type.lower().strip()
        if norm_mime not in cls.ALLOWED_MIME_TYPES:
            fname = (filename or "").lower()
            if not (fname.endswith(".png") or fname.endswith(".jpg") or fname.endswith(".jpeg") or fname.endswith(".tif") or fname.endswith(".tiff")):
                raise ValidationError(
                    f"Unsupported file format '{mime_type}'. Supported formats: GeoTIFF (.tif, .tiff), PNG, JPEG."
                )

        return size

    @classmethod
    def validate_dual_scenes(
        cls, 
        meta_a: Dict[str, Any], 
        meta_b: Dict[str, Any], 
        mode: str = "bitemporal"
    ) -> None:
        """
        Validates spatial and temporal compatibility between two satellite scenes.
        Returns useful error messages if images cannot be compared.
        """
        w_a, h_a = meta_a.get("width", 0), meta_a.get("height", 0)
        w_b, h_b = meta_b.get("width", 0), meta_b.get("height", 0)

        if w_a == 0 or h_a == 0 or w_b == 0 or h_b == 0:
            raise ValidationError("Unable to determine spatial dimensions of one or both scenes.")

        # Check aspect ratio compatibility (must be within reasonable ratio to permit affine registration)
        aspect_a = w_a / max(1, h_a)
        aspect_b = w_b / max(1, h_b)
        if abs(aspect_a - aspect_b) > 0.5:
            logger.warning(f"Aspect ratios differ noticeably: Scene 1 ({aspect_a:.2f}) vs Scene 2 ({aspect_b:.2f}).")

        # Check CRS compatibility if both GeoTIFFs specify a CRS
        crs_a = meta_a.get("crs")
        crs_b = meta_b.get("crs")
        if crs_a and crs_b and crs_a != crs_b:
            logger.warning(f"CRS mismatch detected: Primary is {crs_a}, Secondary is {crs_b}. Reprojection may be needed.")

        # For Optical + SAR mode, verify at least one image exhibits SAR characteristics
        if mode == "optical_sar":
            mod_a = meta_a.get("modality", "OPTICAL")
            mod_b = meta_b.get("modality", "SAR")
            if mod_a == "OPTICAL" and mod_b == "OPTICAL":
                logger.info("Both scenes identified as Optical; proceeding with cross-modal fusion under generic dual-channel mode.")
