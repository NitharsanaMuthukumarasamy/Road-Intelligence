from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ComplaintCreate(BaseModel):
    user_name: str = Field(..., min_length=2, max_length=100)
    mobile_number: str = Field(..., min_length=7, max_length=20)
    problem_type: str = Field(..., description="Pothole, Crack, Damaged Road Surface, Water Logging, Drainage Problem, Other")
    description: str = Field(..., min_length=5)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    media_url: Optional[str] = None
    urgency: str = Field("Normal", description="Normal, Urgent, Dangerous")

class ComplaintResponse(BaseModel):
    id: int
    ticket_id: str
    user_name: str
    mobile_number: str
    problem_type: str
    description: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    media_url: Optional[str] = None
    urgency: str
    priority: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ComplaintTrackResponse(BaseModel):
    ticket_id: str
    problem_type: str
    location: str
    status: str
    priority: str
    created_at: str
    updated_at: str
    current_stage_index: int
    stages: List[str] = [
        "Submitted",
        "Under Review",
        "Assigned",
        "Inspection",
        "Maintenance",
        "Resolved",
        "Closed"
    ]
    description: Optional[str] = None
    media_url: Optional[str] = None

class ChatbotMessageRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    language: Optional[str] = "en"  # "en" or "ta"
    current_slots: Optional[Dict[str, Any]] = None
    current_step: Optional[str] = None

class ChatbotMessageResponse(BaseModel):
    reply: str
    session_id: str
    language: str
    current_step: str
    slots: Dict[str, Any]
    quick_actions: Optional[List[str]] = None
    confirmation_card: Optional[Dict[str, Any]] = None
    ticket_card: Optional[Dict[str, Any]] = None
    track_card: Optional[Dict[str, Any]] = None
