from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class AIExplainRequest(BaseModel):
    defect_type: str
    severity: str
    risk_score: float
    confidence: float
    area_ratio: Optional[float] = 0.05
    road_importance: Optional[str] = "Medium"
    location_context: Optional[str] = "Main Road Corridor"
    has_water: Optional[bool] = False

class AIRecommendationResponse(BaseModel):
    source: str = Field(..., description="'OpenRouter' or 'Rule-Based Fallback'")
    explanation: str
    risk_factors: List[str]
    maintenance_recommendation: str
    urgency: str
    inspection_checklist: List[str]
    disclaimer: Optional[str] = "Project-defined heuristics; subject to review by certified road authorities."

    class Config:
        from_attributes = True
