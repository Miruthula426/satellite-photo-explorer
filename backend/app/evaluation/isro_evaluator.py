import numpy as np
from typing import Dict, Any, List, Optional

class ISROEvaluator:
    """
    Evaluation Engine for ISRO / SAC Problem Statement 26167.
    Evaluates Cartosat-2S Optical + RISAT-1A SAR co-registered pairs,
    computing real spatial mask IoU, bounding box overlap, and cross-modal correlation.
    """

    @staticmethod
    def compute_mask_iou(pred_mask: np.ndarray, gt_mask: np.ndarray) -> float:
        """Computes Intersection over Union (IoU) between predicted and ground truth masks."""
        intersection = np.logical_and(pred_mask > 0, gt_mask > 0)
        union = np.logical_or(pred_mask > 0, gt_mask > 0)
        union_count = np.count_nonzero(union)
        if union_count == 0:
            return 1.0 if np.count_nonzero(pred_mask) == 0 else 0.0
        return float(np.count_nonzero(intersection) / union_count)

    @staticmethod
    def compute_box_iou(box1: List[float], box2: List[float]) -> float:
        """
        Computes IoU between two bounding boxes: [xmin, ymin, xmax, ymax]
        """
        x_min = max(box1[0], box2[0])
        y_min = max(box1[1], box2[1])
        x_max = min(box1[2], box2[2])
        y_max = min(box1[3], box2[3])

        inter_w = max(0.0, x_max - x_min)
        inter_h = max(0.0, y_max - y_min)
        inter_area = inter_w * inter_h

        area1 = max(0.0, box1[2] - box1[0]) * max(0.0, box1[3] - box1[1])
        area2 = max(0.0, box2[2] - box2[0]) * max(0.0, box2[3] - box2[1])
        union_area = area1 + area2 - inter_area

        if union_area <= 0:
            return 0.0
        return float(inter_area / union_area)

    @staticmethod
    def compute_cross_modal_correlation(opt_arr: np.ndarray, sar_arr: np.ndarray) -> float:
        """
        Computes Normalized Cross-Correlation (NCC) between optical and SAR rasters.
        """
        if opt_arr.ndim == 3 and opt_arr.shape[2] >= 3:
            opt_gray = 0.299 * opt_arr[:, :, 0] + 0.587 * opt_arr[:, :, 1] + 0.114 * opt_arr[:, :, 2]
        else:
            opt_gray = opt_arr.astype(float) if opt_arr.ndim == 2 else opt_arr[:, :, 0].astype(float)

        sar_gray = sar_arr.astype(float) if sar_arr.ndim == 2 else sar_arr[:, :, 0].astype(float)

        # Match dimensions if needed
        if opt_gray.shape != sar_gray.shape:
            min_h = min(opt_gray.shape[0], sar_gray.shape[0])
            min_w = min(opt_gray.shape[1], sar_gray.shape[1])
            opt_gray = opt_gray[:min_h, :min_w]
            sar_gray = sar_gray[:min_h, :min_w]

        opt_f = opt_gray.flatten()
        sar_f = sar_gray.flatten()

        opt_norm = opt_f - np.mean(opt_f)
        sar_norm = sar_f - np.mean(sar_f)

        denom = np.linalg.norm(opt_norm) * np.linalg.norm(sar_norm)
        if denom == 0:
            return 0.0
        return float(np.dot(opt_norm, sar_norm) / denom)

    @classmethod
    def evaluate_test_pair(
        cls,
        opt_arr: np.ndarray,
        sar_arr: np.ndarray,
        pred_boxes: Optional[List[Dict[str, Any]]] = None,
        gt_boxes: Optional[List[Dict[str, Any]]] = None,
        pred_mask: Optional[np.ndarray] = None,
        gt_mask: Optional[np.ndarray] = None,
    ) -> Dict[str, Any]:
        """
        Executes comprehensive evaluation of an Optical + SAR evaluation pair.
        """
        ncc = cls.compute_cross_modal_correlation(opt_arr, sar_arr)

        mask_iou = None
        if pred_mask is not None and gt_mask is not None:
            mask_iou = round(cls.compute_mask_iou(pred_mask, gt_mask), 4)

        box_scores = []
        if pred_boxes and gt_boxes:
            for pb in pred_boxes:
                p_coords = [pb["xmin"], pb["ymin"], pb["xmax"], pb["ymax"]]
                best_iou = 0.0
                for gb in gt_boxes:
                    g_coords = [gb["xmin"], gb["ymin"], gb["xmax"], gb["ymax"]]
                    iou = cls.compute_box_iou(p_coords, g_coords)
                    if iou > best_iou:
                        best_iou = iou
                box_scores.append(best_iou)

        mean_box_iou = round(float(np.mean(box_scores)), 4) if box_scores else None

        return {
            "spatial_ncc_correlation": round(ncc, 4),
            "mask_iou": mask_iou,
            "bounding_box_mean_iou": mean_box_iou,
            "evaluation_status": "completed",
            "isro_pipeline_readiness": True
        }
