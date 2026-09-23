from typing import Dict, Any, List

def generate_rule_based_recommendation(
    defect_type: str,
    severity: str,
    risk_score: float,
    confidence: float,
    road_importance: str = "Medium",
    defect_frequency: int = 1,
    has_water: bool = False
) -> Dict[str, Any]:
    """
    Expert rule-based fallback generator for maintenance recommendations
    when OpenRouter API is unavailable or offline.
    """
    norm_type = defect_type.lower()
    
    # 1. Determine Urgency
    if severity == "Critical" or risk_score >= 76:
        urgency = "Immediate"
    elif severity == "High" or risk_score >= 51:
        urgency = "Within 48 Hours"
    elif severity == "Medium" or risk_score >= 26:
        urgency = "Within 7 Days"
    else:
        urgency = "Scheduled Maintenance"

    # 2. Determine Risk Factors
    risk_factors: List[str] = [
        f"Localized pavement disruption ({defect_type}) with {severity.lower()} severity profile",
        f"Corridor categorization: {road_importance} vehicular density impact"
    ]
    if "pothole" in norm_type:
        risk_factors.append("Vehicle rim impact, tire deflation, and rapid suspension fatigue risk")
        risk_factors.append("Potential for catastrophic sudden deceleration on high-speed traversal")
    elif "water" in norm_type or has_water:
        risk_factors.append("Loss of tire traction and heightened vehicle hydroplaning hazard")
        risk_factors.append("Sub-base moisture ingress causing rapid structural pavement softening")
    elif "crack" in norm_type:
        risk_factors.append("Rainwater infiltration risking base course erosion and frost heave expansion")
    else:
        risk_factors.append("Surface friction loss and progressive macro-texture degradation")

    if defect_frequency > 1:
        risk_factors.append(f"Cumulative fatigue indicated by {defect_frequency} neighboring defects")

    # 3. Determine Maintenance Actions
    if "pothole" in norm_type:
        if severity in ["Critical", "High"]:
            action = (
                "Deploy emergency cold/warm asphalt patch crew immediately. Excavate failed perimeter to solid "
                "edges, apply tack coat emulsion (CSS-1h), compact dense-graded hot-mix asphalt (HMA) in 50mm lifts, "
                "and seal vertical joints."
            )
        else:
            action = (
                "Square edges using mechanical saw-cut, clean debris with compressed air, apply bitumen bonding emulsion, "
                "and tamp with polymer-modified asphalt compound."
            )
    elif "water" in norm_type or has_water:
        action = (
            "Inspect roadside ditch grades, storm catch basins, and cross-culverts for blockages. Regrade shoulder "
            "and install sub-surface french drain or edge drain tile to divert standing surface water."
        )
    elif "crack" in norm_type:
        if severity in ["Critical", "High"]:
            action = (
                "Perform high-pressure hot-air lance clearing, routing cracks >5mm width, and inject hot-applied "
                "polymer elastomeric crack sealant (ASTM D6690 Type II) followed by surface blotting."
            )
        else:
            action = (
                "Clean crack aperture of vegetative and loose debris; apply cold-pour elastomeric emulsion sealant "
                "during regular preventative maintenance cycle."
            )
    else:
        action = (
            "Perform mill-and-overlay or localized micro-surfacing thin-lift asphalt treatment across the affected section."
        )

    # 4. Determine Explanation
    explanation = (
        f"The defect was evaluated as '{severity}' severity with a risk index of {int(risk_score)}/100 based on the "
        f"detected {defect_type} characteristics, an AI model detection confidence of {confidence*100:.1f}%, and "
        f"traffic exposure on a {road_importance} importance roadway. The defect exhibits significant potential "
        f"to compromise road safety and trigger progressive sub-base pavement deterioration if left unmitigated."
    )

    # 5. Inspection Checklist
    checklist: List[str] = [
        f"Measure physical cavity dimensions (depth, width, and perimeter) of {defect_type}",
        "Examine surrounding pavement for delamination, ravelling, or alligator fatigue webbing",
        "Inspect curb, gutter, and stormwater drainage outfall points within 30 meters",
        "Record high-resolution pre-repair condition photographs with scale reference",
        "Verify placement of temporary high-visibility warning signage and traffic cones if in active travel lane",
        "Log completed maintenance action in municipal asset management register"
    ]

    return {
        "source": "Rule-Based Fallback",
        "explanation": explanation,
        "risk_factors": risk_factors,
        "maintenance_recommendation": action,
        "urgency": urgency,
        "inspection_checklist": checklist,
        "disclaimer": "Project-defined civil engineering heuristic guidelines; subject to physical verification by a certified road engineer."
    }
