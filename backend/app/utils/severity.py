from typing import Dict, Any, Optional

# Notice: These thresholds and weights are project-defined heuristic rules
# for the AI Road Condition Intelligence platform and do not constitute
# certified regulatory civil engineering standards.

DEFECT_TYPE_WEIGHTS = {
    "pothole": 1.4,
    "damaged road": 1.3,
    "crack": 1.0,
    "water accumulation": 1.2,
    "subsidence": 1.5,
    "alligator crack": 1.2,
    "longitudinal crack": 0.9,
    "other hazards": 1.0,
}

ROAD_IMPORTANCE_MULTIPLIERS = {
    "High": 1.3,     # Arterial / Highway / Expressway
    "Medium": 1.0,   # Major City Road / Collector
    "Low": 0.8,      # Local Street / Residential
}

def get_severity_factors(
    defect_type: str,
    area_ratio: float,
    confidence: float,
    defect_frequency: int = 1,
    has_water: bool = False,
    road_importance: str = "Medium",
    historical_worsened: bool = False
) -> Dict[str, str]:
    """
    Returns transparent human-readable explanations of each factor contributing
    to the defect's computed severity.
    """
    normalized_type = defect_type.lower()
    
    # Defect size factor
    if area_ratio >= 0.15:
        size_factor = f"Extensive surface area footprint ({area_ratio*100:.1f}% of frame)"
    elif area_ratio >= 0.05:
        size_factor = f"Moderate surface area footprint ({area_ratio*100:.1f}% of frame)"
    else:
        size_factor = f"Minor localized footprint ({area_ratio*100:.1f}% of frame)"

    # Defect type factor
    if "pothole" in normalized_type or "damaged" in normalized_type:
        type_factor = f"Structural road depression/cavity ({defect_type})"
    elif "water" in normalized_type or has_water:
        type_factor = f"Hydrological surface water accumulation ({defect_type})"
    elif "crack" in normalized_type:
        type_factor = f"Surface fissuring/cracking ({defect_type})"
    else:
        type_factor = f"General roadway surface hazard ({defect_type})"

    # Frequency factor
    if defect_frequency > 5:
        freq_factor = f"Dense cluster defect occurrence ({defect_frequency} defects in segment)"
    elif defect_frequency > 1:
        freq_factor = f"Repeated localized defect occurrence ({defect_frequency} defects in segment)"
    else:
        freq_factor = "Isolated single defect occurrence"

    # Historical change
    if historical_worsened:
        hist_factor = "Documented degradation relative to baseline historical inspection"
    else:
        hist_factor = "First-time or stable observation"

    return {
        "defect_size": size_factor,
        "defect_type": type_factor,
        "frequency": freq_factor,
        "historical_change": hist_factor,
        "road_importance": f"{road_importance} vehicular traffic corridor",
        "detection_confidence": f"{confidence * 100:.1f}% AI confidence score",
        "regulatory_disclaimer": "Project-defined heuristics; not an official statutory civil engineering standard."
    }

def calculate_severity(
    defect_type: str,
    area_ratio: float,
    confidence: float,
    defect_frequency: int = 1,
    has_water: bool = False,
    road_importance: str = "Medium",
    historical_worsened: bool = False
) -> Dict[str, Any]:
    """
    Transparent rule-based heuristic severity classification.
    Returns:
        {
            "severity": "Low" | "Medium" | "High" | "Critical",
            "score": float (0-100),
            "factors": Dict[str, str]
        }
    """
    normalized_type = defect_type.lower()
    type_weight = DEFECT_TYPE_WEIGHTS.get(normalized_type, 1.0)
    importance_mult = ROAD_IMPORTANCE_MULTIPLIERS.get(road_importance, 1.0)

    # Base raw score calculation
    # 1. Size contribution (0 - 45 pts)
    size_pts = min(45.0, area_ratio * 300.0)

    # 2. Type contribution (10 - 25 pts)
    base_type_pts = 15.0 * type_weight

    # 3. Frequency contribution (0 - 15 pts)
    freq_pts = min(15.0, (defect_frequency - 1) * 3.0)

    # 4. Water accumulation penalty (+10 pts)
    water_pts = 10.0 if (has_water or "water" in normalized_type) else 0.0

    # 5. Historical degradation (+8 pts)
    hist_pts = 8.0 if historical_worsened else 0.0

    raw_score = (size_pts + base_type_pts + freq_pts + water_pts + hist_pts) * importance_mult
    # Scale with confidence slightly so low-confidence edge detections don't over-escalate
    calibrated_score = min(100.0, max(5.0, raw_score * (0.6 + 0.4 * confidence)))

    # Classification thresholds
    if calibrated_score >= 75.0 or (area_ratio >= 0.18 and "pothole" in normalized_type):
        severity = "Critical"
    elif calibrated_score >= 50.0:
        severity = "High"
    elif calibrated_score >= 25.0:
        severity = "Medium"
    else:
        severity = "Low"

    factors = get_severity_factors(
        defect_type=defect_type,
        area_ratio=area_ratio,
        confidence=confidence,
        defect_frequency=defect_frequency,
        has_water=has_water,
        road_importance=road_importance,
        historical_worsened=historical_worsened,
    )

    return {
        "severity": severity,
        "score": round(calibrated_score, 1),
        "factors": factors
    }
