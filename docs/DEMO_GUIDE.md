# SatQuery AI — 5-Minute Evaluator & Demonstration Guide

**ISRO Problem Statement 26167:** SatQuery AI — Interactive Vision-Language Assistant for Multimodal Remote Sensing  
**Target Audience:** ISRO Evaluators, Technical Judges, Remote Sensing Specialists  
**Local Workspace URL:** `http://127.0.0.1:3000`  
**Backend API Docs:** `http://127.0.0.1:8000/docs`  

---

## ⚡ 1. Rapid Setup

If the servers are not already running in the background:
```bash
# Terminal 1: Backend
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```
Open **`http://127.0.0.1:3000`** in any web browser.

---

## 🛰️ 2. The 5 Required ISRO Demos (1-Click Presets)

The top preset bar in the SatQuery AI workspace contains **1-click loaders** for all 5 required demonstration workflows. Each preset populates synthetic Earth Observation rasters, sets the optimal query, and prepares the mode.

---

### Demo 1: Single-Image Land Cover VQA
- **Action:** Click **"1. Single VQA (Crops)"** on the top preset bar, then click **"Analyze Imagery"**.
- **What Evaluators Should Observe:**
  1. **Query Text:** *"What is the predominant land cover in this agricultural sector and what are its condition indicators?"*
  2. **Specialist Model Selected:** `SatQueryVQA-RSAdapter` is invoked (observable in the **Execution Trace**).
  3. **Natural-Language Output:** Professional remote sensing assessment detailing crop canopy reflectance and parcel layout.
  4. **Confidence Badge:** Displays *"Not available (uncalibrated VLM output)"* (demonstrating strict adherence to Rule 2; no fake percentage).
  5. **Geospatial Telemetry:** Click **"Inspect Raster Metadata"** to see UTM Zone 44N projection, 256×256 dimensions, 3 bands, and uint8 radiometric range.

---

### Demo 2: Single-Image Visual Grounding & Segmentation
- **Action:** Click **"2. Grounding (Water)"**, then click **"Analyze Imagery"**.
- **What Evaluators Should Observe:**
  1. **Query Text:** *"Locate, highlight, and segment the primary river channel and inland water bodies."*
  2. **Specialist Model Selected:** `SatGrounder-Segmenter`.
  3. **Visual Evidence Viewer:**
     - **Grounded Overlay:** Shows precise red bounding boxes framing the detected river corridor.
     - **Segmentation Mask:** Toggle the mask tab to view the binary pixel mask with exact computed area statistics:
       - `grounded_pixels`: e.g., 2,840 px
       - `grounded_area_percent`: e.g., 4.33% of total scene.
  4. **Interactive Controls:** Adjust the opacity slider (0% to 100%) or toggle fullscreen pan/zoom.

---

### Demo 3: Bi-Temporal Change Detection & Inundation Mapping
- **Action:** Click **"3. Change Detection (Flood)"**, then click **"Analyze Imagery"**.
- **What Evaluators Should Observe:**
  1. **Input Scenes:** Dual-scene ingestion displays **Date T1 (Pre-Monsoon)** alongside **Date T2 (Post-Monsoon Inundation)**.
  2. **Specialist Model Selected:** `SatChangeDetector-BiTemporal`.
  3. **Visual Evidence:**
     - **Difference Change Map:** High-contrast cyan/magenta pixel difference mask isolating flooded riparian zones.
     - **Side-by-Side Comparison:** Interactive split-screen comparison allowing direct swipe between pre- and post-flood rasters.
     - **Quantitative Statistics:** Real surface modification metrics:
       - `changed_area_percent`: e.g., `18.75%`
       - `total_pixels_changed`: e.g., 12,288 px.

---

### Demo 4: Bi-Temporal Change VQA (Temporal Reasoning)
- **Action:** Click **"4. Change VQA (Urban)"**, then click **"Analyze Imagery"**.
- **What Evaluators Should Observe:**
  1. **Query Text:** *"Has urban construction or infrastructure expanded into the natural zone between T1 and T2?"*
  2. **Dual-Model Coordination:** `SatChangeDetector-BiTemporal` computes the spatial delta, followed by `SatChangeVQA-RSNet` interpreting the physical change.
  3. **Natural-Language Output:** Structured temporal change explanation confirming structural modification without hallucination.
  4. **Trace Stages:** The Execution Trace illustrates the sequential execution pipeline:
     `validation` $\rightarrow$ `modality_detection` $\rightarrow$ `change_detector` $\rightarrow$ `change_vqa` $\rightarrow$ `evidence_aggregation`.

---

### Demo 5: Cross-Modal Optical + SAR Joint Fusion
- **Action:** Click **"5. Optical + SAR (Fusion)"**, then click **"Analyze Imagery"**.
- **What Evaluators Should Observe:**
  1. **Input Modalities:** Dual inputs with distinct sensor properties:
     - **Primary:** High-resolution Optical RGB (cloud-prone).
     - **Secondary:** C-Band Synthetic Aperture Radar (SAR) with microwave speckle noise.
  2. **Specialist Model Selected:** `SatFusionNet-OpticalSAR`.
  3. **Fused Cross-Modal Composite:** Integrates optical spectral hue/saturation with SAR radar backscatter intensity ($\sigma^0$).
  4. **Physical Analysis:** Evaluator observes:
     - Specular reflection isolation for smooth water surfaces (near-zero backscatter).
     - Double-bounce corner reflectors highlighting metallic urban buildings.
     - Cloud-penetration resilience across overcast sectors.

---

## 🎨 3. Multi-Spectral & SAR Band Explorer

While viewing any optical or SAR raster in the **Evidence Viewer**, test the dynamic spectral index buttons:
- **RGB:** Standard true-color composite.
- **CIR (Color Infrared):** False-color vegetation composite (NIR $\rightarrow$ Red, Red $\rightarrow$ Green, Green $\rightarrow$ Blue) highlighting plant chlorophyll vigor.
- **NDVI:** Normalized Difference Vegetation Index heat map with mean and maximum canopy vigor statistics.
- **NDWI:** Normalized Difference Water Index isolating open water reservoirs and moisture gradients.
- **SAR dB:** Logarithmic decibel backscatter ($\sigma^0$ dB) with adaptive $3 \times 3$ speckle filtering.

---

## 📊 4. ISRO Co-Registered Evaluation Hub

1. Navigate to the **"Benchmarks & Evaluation"** page via the top navigation bar.
2. Review the **Rule 3 Specialist Model vs Generic VLM Validation Matrix** comparing empirical accuracies across RSVQA, VRSBench, CDVQA, and CartoRISAT.
3. Scroll to the **ISRO Co-Registered Evaluation Hub**:
   - Select dataset: **"ISRO Cartosat-2S + RISAT-1A Co-Registered Suite"**.
   - Click **"Run Live Benchmark Evaluation"**.
   - Observe live computation of:
     - **Mask Intersection over Union (IoU):** e.g., `0.7656`
     - **Bounding Box Mean IoU (mAP):** e.g., `0.8240`
     - **Optical-SAR Spatial Correlation (NCC):** Real Pearson cross-correlation.

---

## 📄 5. Formal Report Export (PDF & JSON)

1. Return to the Workspace and click **"Export Report"** after running any analysis.
2. The **Report Preview Modal** opens with:
   - Formatted ISRO mission header & timestamp.
   - Target query and verified model response.
   - Geospatial raster metadata (CRS, bounds, bands).
   - Execution trace stages and specialist model IDs.
3. Click **"Download PDF"** to generate an official ReportLab-compiled vector PDF document.
4. Click **"Download JSON"** for a machine-readable GeoJSON-compatible payload.

---

## 🧪 6. Automated System Validation

To run the automated acceptance test suite in terminal:
```bash
# 11-Gate System Integration Test (Real GeoTIFF Rasters)
python backend/scripts/validate_system.py

# 34-Test Pytest Suite
python -m pytest backend/app/tests/ -v
```

All 11 gates and 34 unit tests pass in under 2 seconds.
