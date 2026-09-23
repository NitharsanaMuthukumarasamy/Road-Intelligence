from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RoadSegmentBase(BaseModel):
    segment_code: str
    segment_name: str
    road_name: str
    district: str
    city: str
    state: str
    start_lat: Optional[float] = None
    start_lng: Optional[float] = None
    end_lat: Optional[float] = None
    end_lng: Optional[float] = None
    length_km: float = 1.0
    road_importance: str = "Medium"

class RoadSegmentCreate(RoadSegmentBase):
    pass

class RoadSegmentResponse(RoadSegmentBase):
    id: int
    uuid: str
    total_defects: int
    pothole_count: int
    crack_count: int
    water_count: int
    damaged_road_count: int
    other_count: int
    avg_risk: float
    max_risk: float
    highest_severity: str
    priority: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
