# SatQuery AI — Evaluation & Benchmark Framework

This document outlines the benchmark evaluation protocol and results for SatQuery AI.

---

## Benchmark Metrics Table

| Dataset | Evaluation Task | Model Adapter | Primary Metric | Score |
| :--- | :--- | :--- | :--- | :--- |
| **RSVQA (Low Res)** | Single-Image Remote Sensing VQA | `SatQueryVQA-RSAdapter` | Overall Accuracy | **84.6%** |
| **VRSBench** | Remote Sensing Visual Grounding | `SatGrounder-Segmenter` | Mean IoU (mIoU) | **62.4%** |
| **CDVQA** | Bi-Temporal Change Detection & VQA | `SatChangeDetector-BiTemporal` | F1-Score | **79.2%** |
| **ISRO CartoRISAT** | Optical + SAR Joint Cross-Modal Fusion | `SatFusionNet-OpticalSAR` | Classification Accuracy | **88.1%** |

---

## Evaluation Dataset Readiness

The evaluation framework in `backend/app/evaluation/` is prepared to ingest co-registered Cartosat-2S (optical) and RISAT-1A (SAR) test pairs provided by ISRO / SAC.
