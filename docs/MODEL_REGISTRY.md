# SatQuery AI — Specialist Model Registry

This document lists all specialist remote sensing model adapters integrated into SatQuery AI.

---

## Registered Model Adapters

### 1. `SatQueryVQA-RSAdapter`
- **Task:** Single-Image Remote Sensing VQA
- **Modality:** Optical / Multispectral / SAR
- **Interface:** `predict(images, query, metadata)`
- **Behavior:** Processes satellite rasters with CRS metadata and returns direct, authoritative natural language answers regarding land cover, terrain, and infrastructure.

### 2. `SatCaptioner-ViT-RS`
- **Task:** Remote Sensing Image Captioning
- **Modality:** Optical / Multispectral
- **Behavior:** Generates comprehensive scientific descriptions detailing spatial scale, band composition, and CRS context.

### 3. `SatGrounder-Segmenter`
- **Task:** Visual Grounding & Feature Segmentation
- **Modality:** Optical / Multispectral
- **Behavior:** Segment target features (water, vegetation, built-up) and outputs pixel-level binary masks and bounding box coordinates.

### 4. `SatChangeDetector-BiTemporal`
- **Task:** Bi-Temporal Change Detection
- **Modality:** Bi-Temporal Optical / SAR (T1 & T2)
- **Behavior:** Calculates absolute spectral difference rasters, generates colorized difference maps, computes changed pixel percentages, and extracts change bounding boxes.

### 5. `SatChangeVQA-RSNet`
- **Task:** Bi-Temporal Change VQA
- **Modality:** Bi-Temporal Optical / SAR
- **Behavior:** Integrates `SatChangeDetector` outputs to answer complex natural language change queries ("What changed between these dates?").

### 6. `SatFusionNet-OpticalSAR`
- **Task:** Optical + SAR Joint Cross-Modal Fusion
- **Modality:** Optical + SAR Dual Modality
- **Behavior:** Fuses optical reflectance with SAR microwave backscatter intensity for cloud-penetrating water and urban structure extraction.
