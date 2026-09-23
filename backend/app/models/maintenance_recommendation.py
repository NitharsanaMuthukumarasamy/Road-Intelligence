import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class MaintenanceRecommendation(Base):
    __tablename__ = "maintenance_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    inspection_id = Column(Integer, ForeignKey("inspections.id", ondelete="CASCADE"), index=True, nullable=False)
    detection_id = Column(Integer, ForeignKey("detections.id", ondelete="CASCADE"), index=True, nullable=True)
    
    source = Column(String(50), default="Rule-Based Fallback")  # "OpenRouter" or "Rule-Based Fallback"
    explanation = Column(Text, nullable=False)
    risk_factors = Column(JSON, nullable=False, default=list)  # List of strings
    maintenance_recommendation = Column(Text, nullable=False)
    urgency = Column(String(50), default="Within 7 Days")  # Immediate, Within 48 Hours, Within 7 Days, Scheduled Maintenance
    inspection_checklist = Column(JSON, nullable=False, default=list)  # List of checklist items
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    inspection = relationship("Inspection", back_populates="recommendations")
    detection = relationship("Detection", back_populates="recommendation")
