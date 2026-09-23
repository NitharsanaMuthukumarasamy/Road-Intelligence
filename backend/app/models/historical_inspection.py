import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class HistoricalInspection(Base):
    __tablename__ = "historical_inspections"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    road_segment_id = Column(Integer, ForeignKey("road_segments.id", ondelete="CASCADE"), index=True, nullable=False)
    inspection_id = Column(Integer, ForeignKey("inspections.id", ondelete="SET NULL"), index=True, nullable=True)
    
    inspection_date = Column(DateTime, default=datetime.utcnow, index=True)
    defect_count = Column(Integer, default=0)
    avg_risk = Column(Float, default=0.0)
    max_risk = Column(Float, default=0.0)
    severity_distribution = Column(JSON, default=dict)  # {"Low": 2, "Medium": 5, "High": 3, "Critical": 1}
    
    resolved_count = Column(Integer, default=0)
    persistent_count = Column(Integer, default=0)
    new_count = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    road_segment_rel = relationship("RoadSegment", back_populates="historical_records")
