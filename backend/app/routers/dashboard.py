from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Dict, Any, List

from app.database import get_db
from app.models.inspection import Inspection
from app.models.detection import Detection
from app.models.road_segment import RoadSegment
from app.models.officer_dispatch import OfficerDispatch
from app.utils.security import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Returns executive metrics for government authority dashboard cards:
    - Total Inspections
    - Total Defects
    - Critical Defects
    - High Priority
    - Medium Priority
    - Low Priority
    - Active Officer Dispatches
    """
    total_inspections = db.query(func.count(Inspection.id)).scalar() or 0
    total_defects = db.query(func.count(Detection.id)).scalar() or 0

    # Severity counts
    critical_defects = db.query(func.count(Detection.id)).filter(Detection.severity == "Critical").scalar() or 0
    high_defects = db.query(func.count(Detection.id)).filter(Detection.severity == "High").scalar() or 0
    medium_defects = db.query(func.count(Detection.id)).filter(Detection.severity == "Medium").scalar() or 0
    low_defects = db.query(func.count(Detection.id)).filter(Detection.severity == "Low").scalar() or 0

    # Priority counts for inspections
    critical_priority = db.query(func.count(Inspection.id)).filter(Inspection.priority == "Critical").scalar() or 0
    high_priority = db.query(func.count(Inspection.id)).filter(Inspection.priority == "High").scalar() or 0
    medium_priority = db.query(func.count(Inspection.id)).filter(Inspection.priority == "Medium").scalar() or 0
    low_priority = db.query(func.count(Inspection.id)).filter(Inspection.priority == "Low").scalar() or 0

    # High-risk road segments count
    high_risk_segments = db.query(func.count(RoadSegment.id)).filter(
        (RoadSegment.avg_risk >= 51.0) | (RoadSegment.priority.in_(["High", "Critical"]))
    ).scalar() or 0

    # Dispatches counts
    pending_dispatches = db.query(func.count(OfficerDispatch.id)).filter(OfficerDispatch.status == "Pending").scalar() or 0
    total_dispatches = db.query(func.count(OfficerDispatch.id)).scalar() or 0

    # Pending maintenance count
    pending_maintenance = db.query(func.count(Inspection.id)).filter(
        Inspection.priority.in_(["Immediate Action", "Urgent Inspection", "Critical", "High"])
    ).scalar() or pending_dispatches

    # Recently analyzed roads
    recent = (
        db.query(Inspection)
        .order_by(Inspection.created_at.desc())
        .limit(6)
        .all()
    )
    recently_analyzed_roads = [
        {
            "id": i.id,
            "road_name": i.road_name or "State Highway",
            "segment_name": i.road_segment_name or "Main Segment",
            "district": i.district,
            "total_defects": i.total_defects,
            "highest_severity": i.highest_severity,
            "highest_risk": i.highest_risk,
            "priority": i.priority,
            "created_at": i.created_at.isoformat() if i.created_at else None
        }
        for i in recent
    ]

    return {
        "total_inspections": total_inspections,
        "total_defects": total_defects,
        "critical_defects": critical_defects,
        "high_risk_road_segments": high_risk_segments,
        "pending_maintenance": pending_maintenance,
        "high_priority": high_priority,
        "medium_priority": medium_priority,
        "low_priority": low_priority,
        "critical_priority_inspections": critical_priority,
        "severity_breakdown": {
            "Critical": critical_defects,
            "High": high_defects,
            "Medium": medium_defects,
            "Low": low_defects
        },
        "dispatches": {
            "pending": pending_dispatches,
            "total": total_dispatches
        },
        "recently_analyzed_roads": recently_analyzed_roads
    }


@router.get("/trends")
def get_dashboard_trends(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Returns data series for charts:
    1. Defects by type
    2. Severity distribution
    3. Risk trend over time
    4. Defects over time
    5. Road segment risk rankings
    """
    # 1. Defects by type
    type_counts = (
        db.query(Detection.defect_type, func.count(Detection.id))
        .group_by(Detection.defect_type)
        .order_by(func.count(Detection.id).desc())
        .all()
    )
    defects_by_type = [{"name": str(t[0]).capitalize(), "count": t[1]} for t in type_counts]

    # 2. Severity distribution
    sev_counts = (
        db.query(Detection.severity, func.count(Detection.id))
        .group_by(Detection.severity)
        .all()
    )
    severity_distribution = [{"severity": s[0], "count": s[1]} for s in sev_counts]

    # 3 & 4. Timeline trends (last 7-14 days or by inspection date)
    timeline_query = (
        db.query(
            func.date(Inspection.created_at).label("date"),
            func.count(Inspection.id).label("inspections"),
            func.sum(Inspection.total_defects).label("defects"),
            func.avg(Inspection.highest_risk).label("avg_risk")
        )
        .group_by(func.date(Inspection.created_at))
        .order_by(func.date(Inspection.created_at).asc())
        .limit(14)
        .all()
    )

    trends_timeline = []
    for t in timeline_query:
        trends_timeline.append({
            "date": str(t.date),
            "inspections": t.inspections or 0,
            "defects": int(t.defects or 0),
            "avg_risk": round(float(t.avg_risk or 0), 1)
        })

    # 5. Road segment risk rankings
    segments = (
        db.query(RoadSegment)
        .order_by(RoadSegment.avg_risk.desc())
        .limit(10)
        .all()
    )
    road_segment_risk = [
        {
            "segment_name": s.segment_name,
            "road_name": s.road_name,
            "total_defects": s.total_defects,
            "avg_risk": round(s.avg_risk, 1),
            "max_risk": round(s.max_risk, 1),
            "priority": s.priority,
            "highest_severity": s.highest_severity
        }
        for s in segments
    ]

    return {
        "defects_by_type": defects_by_type,
        "severity_distribution": severity_distribution,
        "timeline_trends": trends_timeline,
        "road_segment_risk": road_segment_risk
    }
