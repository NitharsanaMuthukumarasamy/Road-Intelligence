import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class RoadSegment(Base):
    __tablename__ = "road_segments"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    segment_code = Column(String(100), unique=True, index=True, nullable=False)
    segment_name = Column(String(255), nullable=False)
    road_name = Column(String(255), nullable=False)
    district = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    start_lat = Column(Float, nullable=True)
    start_lng = Column(Float, nullable=True)
    end_lat = Column(Float, nullable=True)
    end_lng = Column(Float, nullable=True)
    length_km = Column(Float, default=1.0)
    road_importance = Column(String(50), default="Medium")  # High, Medium, Low
    
    # Aggregated stats
    total_defects = Column(Integer, default=0)
    pothole_count = Column(Integer, default=0)
    crack_count = Column(Integer, default=0)
    water_count = Column(Integer, default=0)
    damaged_road_count = Column(Integer, default=0)
    other_count = Column(Integer, default=0)
    avg_risk = Column(Float, default=0.0)
    max_risk = Column(Float, default=0.0)
    highest_severity = Column(String(50), default="Low", index=True)
    priority = Column(String(50), default="Low", index=True)  # Low, Medium, High, Critical
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    inspections = relationship("Inspection", back_populates="road_segment_rel")
    historical_records = relationship("HistoricalInspection", back_populates="road_segment_rel")
