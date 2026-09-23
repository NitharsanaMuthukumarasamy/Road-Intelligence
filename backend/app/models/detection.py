import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    inspection_id = Column(Integer, ForeignKey("inspections.id", ondelete="CASCADE"), index=True, nullable=False)
    
    defect_type = Column(String(100), nullable=False, index=True)  # pothole, crack, damaged road, water accumulation, etc.
    confidence = Column(Float, nullable=False)
    
    # Bounding box coordinates normalized or pixel
    x1 = Column(Float, nullable=False)
    y1 = Column(Float, nullable=False)
    x2 = Column(Float, nullable=False)
    y2 = Column(Float, nullable=False)
    
    image_width = Column(Integer, nullable=False)
    image_height = Column(Integer, nullable=False)
    area_ratio = Column(Float, nullable=False)  # box_area / image_area
    
    # For video analysis
    frame_number = Column(Integer, nullable=True)
    timestamp_sec = Column(Float, nullable=True)
    track_id = Column(Integer, nullable=True)
    
    # Severity & Risk
    severity = Column(String(50), default="Medium", index=True)  # Low, Medium, High, Critical
    risk_score = Column(Float, default=50.0, index=True)  # 0 to 100
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    inspection = relationship("Inspection", back_populates="detections")
    recommendation = relationship("MaintenanceRecommendation", back_populates="detection", uselist=False, cascade="all, delete-orphan")
    officer_dispatches = relationship("OfficerDispatch", back_populates="detection", cascade="all, delete-orphan")
