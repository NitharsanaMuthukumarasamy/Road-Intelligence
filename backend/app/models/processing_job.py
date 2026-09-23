import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String(36), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    inspection_id = Column(Integer, ForeignKey("inspections.id", ondelete="CASCADE"), index=True, nullable=False)
    
    task_type = Column(String(50), default="image")  # image or video
    status = Column(String(50), default="queued", index=True)  # queued, processing, completed, failed
    progress = Column(Float, default=0.0)  # 0.0 to 100.0
    step_message = Column(String(255), default="Job queued in processing pipeline")
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="processing_jobs")
    inspection = relationship("Inspection", back_populates="processing_jobs")
