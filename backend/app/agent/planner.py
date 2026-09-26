from typing import Dict, Any, List

class AgentPlanner:
    """
    Formulates specialist execution strategy based on task classification and raster metadata.
    """
    @staticmethod
    def create_plan(task: str, modalities: List[str], metadata_list: List[Dict[str, Any]]) -> Dict[str, Any]:
        plan = {
            "task": task,
            "modalities_detected": modalities,
            "requires_registration": len(metadata_list) > 1,
            "specialist_task": task,
            "preprocessing_steps": ["base64_decode", "geotiff_parse", "percentile_normalize"]
        }
        if len(metadata_list) > 1:
            plan["preprocessing_steps"].append("spatial_affine_align")
        return plan
