import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class OfficerDispatch(Base):
    __tablename__ = "officer_dispatches"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    inspection_id = Column(Integer, ForeignKey("inspections.id", ondelete="CASCADE"), index=True, nullable=False)
    detection_id = Column(Integer, ForeignKey("detections.id", ondelete="SET NULL"), index=True, nullable=True)
    assigned_officer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    
    status = Column(String(50), default="Pending", index=True)  # Pending, In Progress, Resolved, Dismissed
    priority = Column(String(50), default="High", index=True)  # Low, Medium, High, Critical
    damage_summary = Column(String(500), nullable=False)
    boxed_image_path = Column(String(500), nullable=True)
    action_notes = Column(Text, nullable=True)
    
    dispatch_time = Column(DateTime, default=datetime.utcnow, index=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    inspection = relationship("Inspection", back_populates="officer_dispatches")
    detection = relationship("Detection", back_populates="officer_dispatches")
    assigned_officer = relationship("User", back_populates="assigned_dispatches")
