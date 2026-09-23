import pytest
from app.utils.severity import calculate_severity, get_severity_factors
from app.utils.risk import calculate_risk_score
from app.utils.recommendation import generate_rule_based_recommendation

def test_severity_calculation_bounds():
    # Minor crack
    sev_minor = calculate_severity(
        defect_type="crack",
        area_ratio=0.01,
        confidence=0.8,
        road_importance="Low"
    )
    assert sev_minor["severity"] in ["Low", "Medium"]
    assert 0 <= sev_minor["score"] <= 100
    assert "crack" in sev_minor["factors"]["defect_type"].lower()

    # Major pothole with water on arterial highway
    sev_critical = calculate_severity(
        defect_type="pothole",
        area_ratio=0.20,
        confidence=0.95,
        defect_frequency=5,
        has_water=True,
        road_importance="High",
        historical_worsened=True
    )
    assert sev_critical["severity"] == "Critical"
    assert sev_critical["score"] >= 75.0

def test_risk_score_priority_banding():
    # 0–25 Low
    risk_low = calculate_risk_score(severity="Low", defect_size_ratio=0.01, road_importance="Low")
    assert 0 <= risk_low["risk_score"] <= 100
    assert risk_low["priority"] in ["Low", "Medium"]

    # 76–100 Critical
    risk_crit = calculate_risk_score(
        severity="Critical",
        defect_size_ratio=0.25,
        defect_frequency=6,
        has_water=True,
        road_importance="High"
    )
    assert risk_crit["risk_score"] >= 76
    assert risk_crit["priority"] == "Critical"

def test_rule_based_recommendation_fallback():
    rec = generate_rule_based_recommendation(
        defect_type="pothole",
        severity="Critical",
        risk_score=85.0,
        confidence=0.92,
        road_importance="High"
    )
    assert rec["urgency"] == "Immediate"
    assert "asphalt" in rec["maintenance_recommendation"].lower()
    assert len(rec["inspection_checklist"]) >= 3
    assert len(rec["risk_factors"]) >= 2
