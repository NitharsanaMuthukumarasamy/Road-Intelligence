from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class JobCreateResponse(BaseModel):
    job_id: str
    status: str
    inspection_id: int
    inspection_uuid: str
    message: str = "Job accepted and queued for background inference"

class JobStatusResponse(BaseModel):
    id: int
    job_id: str
    user_id: int
    inspection_id: int
    task_type: str
    status: str  # queued, processing, completed, failed
    progress: float
    step_message: str
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
