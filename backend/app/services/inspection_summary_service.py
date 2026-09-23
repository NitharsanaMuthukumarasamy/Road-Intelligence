import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.inspection import Inspection
from app.models.detection import Detection
from app.utils.logger import get_logger

logger = get_logger("inspection_summary_service")

def normalize_defect_type(raw_name: Optional[str]) -> str:
    """
    Normalizes model defect class names into canonical categories:
    - 'pothole'
    - 'crack'
    - 'water_accumulation'
    - 'damaged_surface'
    - 'other'
    
    Case-insensitive matching supporting various YOLO sub-classes.
    """
    if not raw_name:
        return "other"

    clean = str(raw_name).strip().lower().replace("-", " ").replace("_", " ")

    # 1. Potholes
    if any(k in clean for k in ["pothole", "potholes", "depression", "cavity", "hole"]):
        return "pothole"

    # 2. Cracks
    if any(k in clean for k in [
        "crack", "cracks", "fissure", "alligator", "longitudinal", "transverse"
    ]):
        return "crack"

    # 3. Water Accumulation
    if any(k in clean for k in [
        "water", "puddle", "accumulation", "standing water", "drainage", "ponding", "flood"
    ]):
        return "water_accumulation"

    # 4. Damaged Surfaces
    if any(k in clean for k in [
        "damaged surface", "damage surface", "surface damage", "road damage",
        "damaged road", "damage", "rutting", "raveling", "subsidence", "delamination"
    ]):
        return "damaged_surface"

    return "other"


def get_inspection_summary(db: Session, inspection_id: int) -> Optional[Dict[str, Any]]:
    """
    Calculates the exact inspection summary from the database for a selected inspection.
    
    Filters: WHERE inspection_id = selected_inspection_id
    
    Returns:
    {
      "inspection_id": 13,
      "status": "ANALYZED",
      "total_defects": 8,
      "potholes": 3,
      "cracks": 2,
      "water_accumulation": 1,
      "damaged_surfaces": 2,
      "other_defects": 0,
      "critical_defects": 2,
      "average_risk_score": 72.0,
      "maximum_risk_score": 91.0
    }
    """
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        logger.warning(f"Inspection #{inspection_id} not found in database.")
        return None

    # Query all detections for this specific inspection
    # ALWAYS filter: WHERE inspection_id = selected_inspection_id
    detections = (
        db.query(Detection)
        .filter(Detection.inspection_id == inspection_id)
        .order_by(Detection.id.asc())
        .all()
    )

    # Video tracking deduplication:
    # If video detections have track_id, group by track_id so a persistent defect across 20 frames
    # is counted as 1 unique defect.
    unique_detections: List[Detection] = []
    seen_tracks = set()

    for d in detections:
        if d.track_id is not None and d.track_id > 0:
            if d.track_id not in seen_tracks:
                seen_tracks.add(d.track_id)
                unique_detections.append(d)
        else:
            unique_detections.append(d)

    # If all detections had track_ids, use unique_detections; otherwise fall back to all detections
    active_records = unique_detections if unique_detections else detections

    potholes = 0
    cracks = 0
    water = 0
    damaged_surfaces = 0
    other = 0
    critical = 0
    risk_values: List[float] = []

    for det in active_records:
        norm_type = normalize_defect_type(det.defect_type)

        if norm_type == "pothole":
            potholes += 1
        elif norm_type == "crack":
            cracks += 1
        elif norm_type == "water_accumulation":
            water += 1
        elif norm_type == "damaged_surface":
            damaged_surfaces += 1
        else:
            other += 1

        # Check severity = "Critical" (case-insensitive)
        if det.severity and str(det.severity).strip().lower() == "critical":
            critical += 1

        # Collect risk score
        if det.risk_score is not None:
            try:
                r_val = float(det.risk_score)
                risk_values.append(r_val)
            except (ValueError, TypeError):
                pass

    total = potholes + cracks + water + damaged_surfaces + other

    if risk_values:
        average_risk = round(sum(risk_values) / len(risk_values), 2)
        max_risk = round(max(risk_values), 2)
    else:
        average_risk = 0.0
        max_risk = 0.0

    # Determine status: ANALYZED, PROCESSING, FAILED, or UPLOADED
    status_str = "ANALYZED"
    if inspection.status:
        raw_status = inspection.status.strip().upper()
        if raw_status in ["PROCESSING", "QUEUED"]:
            status_str = "PROCESSING"
        elif raw_status in ["FAILED", "ERROR"]:
            status_str = "FAILED"
        elif raw_status in ["COMPLETED", "ANALYZED"]:
            status_str = "ANALYZED"
        else:
            status_str = raw_status

    # Detailed debug log as requested in requirement 22
    logger.info(
        f"Inspection #{inspection_id} -> Total detections: {total} "
        f"(Potholes: {potholes}, Cracks: {cracks}, Water: {water}, "
        f"Damaged surfaces: {damaged_surfaces}, Other: {other}), "
        f"Critical: {critical}, Average risk: {average_risk:.2f}, Max risk: {max_risk:.2f}, "
        f"Status: {status_str}"
    )

    return {
        "inspection_id": inspection.id,
        "uuid": inspection.uuid,
        "title": inspection.title,
        "road_name": inspection.road_name,
        "road_segment_name": inspection.road_segment_name,
        "district": inspection.district,
        "status": status_str,
        "total_defects": total,
        "potholes": potholes,
        "cracks": cracks,
        "water_accumulation": water,
        "damaged_surfaces": damaged_surfaces,
        "other_defects": other,
        "critical_defects": critical,
        "average_risk_score": average_risk,
        "maximum_risk_score": max_risk,
        "detections_count": len(detections)
    }
