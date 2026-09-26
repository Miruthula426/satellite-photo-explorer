import numpy as np
from typing import Dict, Any

def detect_image_modality(arr: np.ndarray, metadata: Dict[str, Any], hint: str = "primary") -> str:
    """
    Detects whether an image array represents OPTICAL, SAR, or MULTISPECTRAL data.
    Uses band count, variance/grayscale statistics, filename cues, or explicit hints.
    """
    filename = (metadata.get("filename") or "").lower()
    hint_lower = (hint or "").lower()
    
    if "sar" in filename or "risat" in filename or "sentinel1" in filename or hint_lower == "sar":
        return "SAR"
    
    if metadata.get("bands", 3) > 3 or arr.ndim == 3 and arr.shape[2] > 3:
        return "MULTISPECTRAL"
        
    # Statistical check for 1-channel or grayscale SAR intensity
    if arr.ndim == 2 or (arr.ndim == 3 and arr.shape[2] == 1):
        return "SAR"
        
    if arr.ndim == 3 and arr.shape[2] == 3:
        # Check if RGB channels are identical (grayscale SAR saved as RGB)
        r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
        if np.array_equal(r, g) and np.array_equal(g, b):
            # Check high dynamic range / speckled variance characteristic of SAR
            variance = np.var(r)
            if variance > 1000:
                return "SAR"

    return "OPTICAL"
