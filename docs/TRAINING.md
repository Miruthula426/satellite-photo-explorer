# SatQuery AI — Training & Domain Adaptation Specification

**Target Datasets:** BigEarthNet-MM, RSVQA, CDVQA  
**Training Infrastructure:** Google Colab (GPU T4 / A100)

---

## 1. Adaptation Architecture

SatQuery AI uses **LoRA (Low-Rank Adaptation)** and projection-layer tuning to adapt open-source Vision-Language Models (VLMs) to multispectral and SAR satellite rasters:

- **LoRA Hyperparameters:**
  - Rank ($r$): 16
  - Alpha ($\alpha$): 32
  - Target Modules: `q_proj`, `v_proj`, `multi_modal_projector`
  - Optimizer: AdamW ($lr = 2e-4$, weight decay = $0.01$)

---

## 2. Notebook Execution Order

1. `training/notebooks/01_dataset_exploration.ipynb`: Inspect sample Sentinel-2 & Sentinel-1 rasters.
2. `training/notebooks/02_preprocessing.ipynb`: Extract 10m/20m/60m bands, calculate NDVI/NDWI, and normalize uint16 rasters.
3. `training/notebooks/03_remote_sensing_adaptation.ipynb`: Configure LoRA weights and setup dataset data loaders.
4. `training/notebooks/04_training.ipynb`: Execute 10 training epochs and export saved checkpoint `.pt` files.
5. `training/notebooks/05_evaluation.ipynb`: Compute benchmark validation metrics.
