import numpy as np
from PIL import Image
import io
import base64

def normalize_to_uint8(arr: np.ndarray) -> np.ndarray:
    """
    Normalizes multi-bit satellite rasters (uint16, float32) into 8-bit uint8 using 2-98 percentile clipping.
    """
    if arr.dtype == np.uint8:
        return arr

    arr_float = arr.astype(np.float32)
    p2, p98 = np.percentile(arr_float, (2, 98))
    
    if p98 > p2:
        normalized = np.clip((arr_float - p2) / (p98 - p2) * 255.0, 0, 255)
    else:
        normalized = np.clip(arr_float, 0, 255)
        
    return normalized.astype(np.uint8)

def convert_array_to_base64_png(arr: np.ndarray) -> str:
    """
    Converts a NumPy array (RGB or Grayscale uint8) to a Base64-encoded PNG image string.
    """
    arr_uint8 = normalize_to_uint8(arr)
    if arr_uint8.ndim == 2:
        img = Image.fromarray(arr_uint8, mode="L")
    elif arr_uint8.ndim == 3 and arr_uint8.shape[2] == 1:
        img = Image.fromarray(arr_uint8[:, :, 0], mode="L")
    elif arr_uint8.ndim == 3 and arr_uint8.shape[2] >= 3:
        img = Image.fromarray(arr_uint8[:, :, :3], mode="RGB")
    else:
        img = Image.fromarray(arr_uint8, mode="L")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    b64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64_str}"
