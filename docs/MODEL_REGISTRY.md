# SatQuery AI — Specialist Model & Baseline Registry

This document records all active model adapters, classical baselines, and targeted open-source remote sensing backbones.
Every component truthfully declares whether it is a classical baseline, API orchestrator, or deep learning checkpoint.

---

## 1. Active In-Repository Implementations

| Component Name | Task Category | Implementation Status | Method / Backbone | Modality | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GenericVLMOrchestrator` | Single-Image VQA | `demo` | Google Gemini 2.5 Flash / Local Spectral Baseline | Optical / Multispectral | `demo` |
| `ClassicalSpectralCaptionerBaseline` | Image Captioning | `baseline` | Procedural band albedo & dynamic range dispersion | Optical / Multispectral | `baseline` |
| `ClassicalBaselineGrounder` | Visual Grounding | `baseline` | Spectral thresholding + connected component contours | Optical / Multispectral | `baseline` |
| `PixelDifferenceChangeBaseline` | Change Detection | `baseline` | Absolute spectral difference magnitude with spatial overlap check | Bi-Temporal Optical / SAR | `baseline` |
| `EvidenceGroundedChangeVQA` | Change VQA | `baseline` | Natural language synthesis strictly grounded in change metrics | Bi-Temporal Optical / SAR | `baseline` |
| `OpticalSARVisualizationBaseline` | Optical+SAR Fusion | `baseline` | Dual-modality linear blend + empirical backscatter thresholding | Optical + SAR | `baseline` |

---

## 2. Targeted Open-Source Foundation Models for Deep Integration

The following publicly available foundation models have been audited for future weights integration:

### A. Single-Image Remote Sensing VLM
* **Target Model Identifier:** `OpenGVLab/InternVL2-8B` / `Qwen/Qwen2-VL-7B-Instruct`
* **HuggingFace Repository:** `https://huggingface.co/Qwen/Qwen2-VL-7B-Instruct`
* **License:** Apache 2.0
* **Input Modality:** Multi-band RGB / GeoTIFF normalized rasters
* **Hardware Requirements:** Minimum 16GB VRAM (FP16 / Int4 quantization)

### B. Remote Sensing Visual Grounding & Segmentation
* **Target Model Identifier:** `google/owlvit-base-patch32` / `facebook/sam-vit-base`
* **HuggingFace Repository:** `https://huggingface.co/google/owlvit-base-patch32`
* **License:** Apache 2.0
* **Input Modality:** Optical RGB raster scenes
* **Hardware Requirements:** 8GB VRAM (or CPU inference)

### C. Bi-Temporal Change Detection
* **Target Model Architecture:** Bitemporal Image Transformer (`BIT`) / `ChangeFormer`
* **Repository:** `https://github.com/justchenhao/BIT_CD`
* **License:** MIT License
* **Input Modality:** Dual co-registered optical rasters (T1, T2)
* **Hardware Requirements:** 4GB VRAM

### D. Optical + SAR Cross-Modal Representation
* **Target Model Architecture:** `BigEarthNet-MM` multi-modal contrastive encoder
* **License:** CDLA-Permissive-1.0
* **Input Modality:** Sentinel-2 (B2-B8) + Sentinel-1 (VV, VH)
* **Hardware Requirements:** 8GB VRAM
