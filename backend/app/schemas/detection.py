from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class DetectionBase(BaseModel):
    defect_type: str
    confidence: float
    x1: float
    y1: float
    x2: float
    y2: float
    image_width: int
    image_height: int
    area_ratio: float
    frame_number: Optional[int] = None
    timestamp_sec: Optional[float] = None
    track_id: Optional[int] = None
    severity: str
    risk_score: float

class DetectionCreate(DetectionBase):
    pass

class DetectionResponse(DetectionBase):
    id: int
    uuid: str
    inspection_id: int
    created_at: datetime

    class Config:
        from_attributes = True
