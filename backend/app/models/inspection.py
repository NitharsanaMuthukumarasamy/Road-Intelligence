import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    road_segment_id = Column(Integer, ForeignKey("road_segments.id", ondelete="SET NULL"), index=True, nullable=True)
    
    media_type = Column(String(20), default="image")  # image or video
    status = Column(String(50), default="queued", index=True)  # queued, processing, completed, failed
    
    # Location data
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    road_segment_name = Column(String(255), nullable=True)
    road_name = Column(String(255), nullable=True)
    district = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    
    # Summaries
    total_defects = Column(Integer, default=0)
    highest_severity = Column(String(50), default="Low", index=True)
    highest_risk = Column(Float, default=0.0)
    priority = Column(String(50), default="Low", index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="inspections")
    road_segment_rel = relationship("RoadSegment", back_populates="inspections")
    files = relationship("FileRecord", back_populates="inspection", cascade="all, delete-orphan")
    processing_jobs = relationship("ProcessingJob", back_populates="inspection", cascade="all, delete-orphan")
    detections = relationship("Detection", back_populates="inspection", cascade="all, delete-orphan")
    recommendations = relationship("MaintenanceRecommendation", back_populates="inspection", cascade="all, delete-orphan")
    officer_dispatches = relationship("OfficerDispatch", back_populates="inspection", cascade="all, delete-orphan")
