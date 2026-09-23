from typing import Dict, Any

SEVERITY_BASE_RISK = {
    "Low": 18.0,
    "Medium": 42.0,
    "High": 68.0,
    "Critical": 88.0,
}

def calculate_risk_score(
    severity: str,
    defect_size_ratio: float,
    defect_frequency: int = 1,
    has_water: bool = False,
    road_importance: str = "Medium",
    historical_increase: bool = False,
) -> Dict[str, Any]:
    """
    Computes a transparent 0-100 risk score and priority classification.
    Returns:
        {
            "risk_score": int (0-100),
            "priority": "Low" | "Medium" | "High" | "Critical",
            "breakdown": Dict[str, float],
            "factors": Dict[str, str]
        }
    """
    base = SEVERITY_BASE_RISK.get(severity, 35.0)

    # Size adjustment (-5 to +15 pts)
    size_pts = min(15.0, defect_size_ratio * 100.0)

    # Frequency adjustment (0 to +12 pts)
    freq_pts = min(12.0, max(0, defect_frequency - 1) * 2.5)

    # Water hazard (+8 pts for hydroplaning risk)
    water_pts = 8.0 if has_water else 0.0

    # Historical increase (+6 pts)
    hist_pts = 6.0 if historical_increase else 0.0

    # Road importance weight
    importance_multiplier = 1.15 if road_importance == "High" else (0.9 if road_importance == "Low" else 1.0)

    raw_total = (base + size_pts + freq_pts + water_pts + hist_pts) * importance_multiplier
    risk_score = int(round(min(100.0, max(0.0, raw_total))))

    # Priority banding according to specifications:
    # 0–25 Low, 26–50 Medium, 51–75 High, 76–100 Critical
    if risk_score >= 76:
        priority = "Critical"
    elif risk_score >= 51:
        priority = "High"
    elif risk_score >= 26:
        priority = "Medium"
    else:
        priority = "Low"

    return {
        "risk_score": risk_score,
        "priority": priority,
        "breakdown": {
            "base_severity_component": base,
            "defect_size_component": round(size_pts, 1),
            "frequency_clustering_component": round(freq_pts, 1),
            "water_hazard_component": water_pts,
            "historical_increase_component": hist_pts,
            "road_importance_multiplier": importance_multiplier,
        },
        "factors": {
            "severity_level": f"{severity} baseline severity",
            "traffic_impact": f"{road_importance} priority transport corridor",
            "hydroplaning_risk": "Present" if has_water else "Not detected",
            "priority_level": f"{priority} ({risk_score}/100 Index)",
            "disclaimer": "Calculated via project-defined heuristics; intended for decision support only."
        }
    }
