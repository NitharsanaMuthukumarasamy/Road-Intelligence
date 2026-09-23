"""
Demo Data Seeder for AI-Powered Road Condition Intelligence & Maintenance Prioritization System
CLEARLY LABELED AS: [DEMO DATA]
"""

import os
import sys
import uuid
from datetime import datetime, timedelta
import cv2
import numpy as np

# Ensure app package is importable
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.road_segment import RoadSegment
from app.models.inspection import Inspection
from app.models.file import FileRecord
from app.models.detection import Detection
from app.models.maintenance_recommendation import MaintenanceRecommendation
from app.models.officer_dispatch import OfficerDispatch
from app.models.historical_inspection import HistoricalInspection
from app.utils.security import hash_password
from app.services.cv_service import annotate_damage_box
from app.config import settings

def create_sample_road_image(filename: str, defect_type: str = "pothole") -> str:
    """Generates a realistic synthetic road surface image with asphalt texture and visible damage."""
    os.makedirs(settings.UPLOADS_DIR, exist_ok=True)
    os.makedirs(settings.PROCESSED_DIR, exist_ok=True)
    filepath = os.path.join(settings.UPLOADS_DIR, filename)

    h, w = 600, 800
    # Asphalt base: dark gray with grain noise
    img = np.full((h, w, 3), 70, dtype=np.uint8)
    noise = np.random.normal(0, 15, (h, w, 3)).astype(np.int16)
    img = np.clip(img.astype(np.int16) + noise, 30, 110).astype(np.uint8)

    # Road lane line (yellow dashed)
    cv2.line(img, (w // 2, 0), (w // 2, h), (30, 200, 240), 4)

    # Draw synthetic defect
    if defect_type == "pothole":
        cv2.ellipse(img, (400, 380), (70, 45), 15, 0, 360, (25, 25, 25), -1)
        cv2.ellipse(img, (400, 380), (75, 48), 15, 0, 360, (40, 40, 40), 3)
    elif defect_type == "water accumulation":
        cv2.ellipse(img, (350, 350), (120, 60), -10, 0, 360, (80, 60, 40), -1)
        cv2.ellipse(img, (350, 350), (125, 63), -10, 0, 360, (120, 90, 60), 2)
    else:  # crack
        points = np.array([
            [250, 280], [310, 320], [380, 300], [420, 360], [490, 380], [530, 440]
        ], np.int32)
        cv2.polylines(img, [points], False, (20, 20, 20), 4)

    cv2.imwrite(filepath, img)

    # Generate annotated version
    annotated_path = os.path.join(settings.PROCESSED_DIR, f"annotated_{filename}")
    annotated_img = img.copy()
    if defect_type == "pothole":
        annotate_damage_box(annotated_img, 320, 330, 480, 430, "pothole", 0.94, "Critical", 86.0)
    elif defect_type == "water accumulation":
        annotate_damage_box(annotated_img, 220, 280, 480, 420, "water accumulation", 0.89, "High", 72.0)
    else:
        annotate_damage_box(annotated_img, 240, 270, 540, 450, "crack", 0.91, "High", 64.0)

    cv2.imwrite(annotated_path, annotated_img)
    return filepath, annotated_path

def seed_database():
    print("Ensuring database tables exist...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if users exist
        if db.query(User).count() > 0:
            print("Database already populated. Skipping demo data insertion.")
            return

        print("Seeding [Demo Data] Users...")
        # 1. Admin Officer
        admin = User(
            email="admin@roadintelligence.gov",
            hashed_password=hash_password("admin123"),
            full_name="Chief Engineer Rajesh Sharma [Demo Data]",
            role="Admin Officer",
            department="State Highway & Transportation Authority",
            is_active=True
        )
        # 2. Government Officer
        officer1 = User(
            email="officer@roadintelligence.gov",
            hashed_password=hash_password("officer123"),
            full_name="Inspecting Officer Priya Verma [Demo Data]",
            role="Government Officer",
            department="Municipal Road Maintenance Division",
            is_active=True
        )
        # 3. Citizen
        citizen1 = User(
            email="citizen@example.com",
            hashed_password=hash_password("citizen123"),
            full_name="Arun Kumar [Demo Data Citizen]",
            role="Citizen",
            department=None,
            is_active=True
        )
        db.add_all([admin, officer1, citizen1])
        db.commit()
        db.refresh(admin)
        db.refresh(officer1)
        db.refresh(citizen1)

        print("Seeding [Demo Data] Road Segments...")
        seg1 = RoadSegment(
            segment_code="SEG-NH44-01",
            segment_name="NH-44 Arterial North Section [Demo Data]",
            road_name="National Highway 44",
            district="North Suburban",
            city="Metropolitan Metro",
            state="Delhi NCR",
            start_lat=28.7041,
            start_lng=77.1025,
            end_lat=28.7241,
            end_lng=77.1225,
            length_km=4.2,
            road_importance="High",
            total_defects=14,
            pothole_count=6,
            crack_count=5,
            water_count=3,
            avg_risk=74.5,
            max_risk=88.0,
            highest_severity="Critical",
            priority="Critical"
        )
        seg2 = RoadSegment(
            segment_code="SEG-SH12-04",
            segment_name="State Highway 12 Western Link [Demo Data]",
            road_name="State Highway 12",
            district="West Industrial Zone",
            city="Metropolitan Metro",
            state="Delhi NCR",
            start_lat=28.6280,
            start_lng=77.0600,
            end_lat=28.6480,
            end_lng=77.0800,
            length_km=3.5,
            road_importance="Medium",
            total_defects=8,
            pothole_count=2,
            crack_count=4,
            water_count=2,
            avg_risk=58.0,
            max_risk=72.0,
            highest_severity="High",
            priority="High"
        )
        seg3 = RoadSegment(
            segment_code="SEG-URB-09",
            segment_name="Civil Lines Sector 8 Connector [Demo Data]",
            road_name="Mahatma Gandhi Marg",
            district="Central Urban",
            city="Metropolitan Metro",
            state="Delhi NCR",
            start_lat=28.6139,
            start_lng=77.2090,
            end_lat=28.6239,
            end_lng=77.2190,
            length_km=1.8,
            road_importance="Medium",
            total_defects=3,
            pothole_count=1,
            crack_count=2,
            water_count=0,
            avg_risk=38.0,
            max_risk=45.0,
            highest_severity="Medium",
            priority="Medium"
        )
        db.add_all([seg1, seg2, seg3])
        db.commit()
        db.refresh(seg1)
        db.refresh(seg2)
        db.refresh(seg3)

        print("Seeding [Demo Data] Sample Media & Inspections...")
        img1_path, ann1_path = create_sample_road_image("demo_pothole_inspection.jpg", "pothole")
        img2_path, ann2_path = create_sample_road_image("demo_crack_inspection.jpg", "crack")
        img3_path, ann3_path = create_sample_road_image("demo_water_inspection.jpg", "water accumulation")

        # Inspection 1: Critical Pothole on NH-44
        insp1 = Inspection(
            title="Severe Pothole Cluster Inspection [Demo Data]",
            description="High-traffic lane surface failure observed near Flyover Pillar 14.",
            user_id=citizen1.id,
            road_segment_id=seg1.id,
            road_segment_name=seg1.segment_name,
            road_name=seg1.road_name,
            district=seg1.district,
            city=seg1.city,
            state=seg1.state,
            latitude=28.7100,
            longitude=77.1100,
            media_type="image",
            status="completed",
            total_defects=2,
            highest_severity="Critical",
            highest_risk=86.0,
            priority="Critical",
            created_at=datetime.utcnow() - timedelta(days=2)
        )
        db.add(insp1)
        db.commit()
        db.refresh(insp1)

        file1 = FileRecord(
            inspection_id=insp1.id,
            original_filename="demo_pothole_inspection.jpg",
            stored_filename="demo_pothole_inspection.jpg",
            storage_path=img1_path,
            processed_path=ann1_path,
            file_type="image",
            mime_type="image/jpeg",
            file_size=os.path.getsize(img1_path),
            width=800,
            height=600
        )
        db.add(file1)

        det1 = Detection(
            inspection_id=insp1.id,
            defect_type="pothole",
            confidence=0.94,
            x1=320.0, y1=330.0, x2=480.0, y2=430.0,
            image_width=800, image_height=600,
            area_ratio=0.033,
            severity="Critical",
            risk_score=86.0
        )
        det2 = Detection(
            inspection_id=insp1.id,
            defect_type="crack",
            confidence=0.87,
            x1=150.0, y1=380.0, x2=290.0, y2=420.0,
            image_width=800, image_height=600,
            area_ratio=0.012,
            severity="High",
            risk_score=62.0
        )
        db.add_all([det1, det2])
        db.commit()
        db.refresh(det1)

        rec1 = MaintenanceRecommendation(
            inspection_id=insp1.id,
            detection_id=det1.id,
            source="Rule-Based Fallback",
            explanation="Critical cavity detected in heavy vehicular speed zone; depth and footprint present serious wheel deflection hazard.",
            risk_factors=[
                "Wheel rim damage and loss-of-control hazard at highway speeds",
                "Moisture accumulation threatening asphalt base course compaction"
            ],
            maintenance_recommendation="Deploy emergency asphalt maintenance team within 24 hours. Square edges with saw cut, apply bitumen tack coat, and compact hot-mix asphalt.",
            urgency="Immediate",
            inspection_checklist=[
                "Confirm depth and square perimeter of pothole cavity",
                "Erect lane closure signs and safety arrow board",
                "Ensure asphalt compaction density passes proof roll test"
            ]
        )
        db.add(rec1)

        # Automated Officer Dispatch for Inspection 1
        disp1 = OfficerDispatch(
            inspection_id=insp1.id,
            detection_id=det1.id,
            assigned_officer_id=officer1.id,
            status="In Progress",
            priority="Critical",
            damage_summary="Automated AI Alert: Critical Pothole (86/100 Risk) detected on NH-44. Damage boxed.",
            boxed_image_path=ann1_path,
            action_notes="Assigned to Officer Priya Verma. Maintenance team dispatched with quick-set asphalt emulsion.",
            dispatch_time=datetime.utcnow() - timedelta(days=2)
        )
        db.add(disp1)

        # Inspection 2: Water Accumulation & Rutting
        insp2 = Inspection(
            title="Standing Water & Aquaplaning Hazard [Demo Data]",
            description="Drainage slope issue causing prolonged surface water ponding.",
            user_id=citizen1.id,
            road_segment_id=seg2.id,
            road_segment_name=seg2.segment_name,
            road_name=seg2.road_name,
            district=seg2.district,
            city=seg2.city,
            state=seg2.state,
            latitude=28.6350,
            longitude=77.0700,
            media_type="image",
            status="completed",
            total_defects=1,
            highest_severity="High",
            highest_risk=72.0,
            priority="High",
            created_at=datetime.utcnow() - timedelta(days=1)
        )
        db.add(insp2)
        db.commit()
        db.refresh(insp2)

        file2 = FileRecord(
            inspection_id=insp2.id,
            original_filename="demo_water_inspection.jpg",
            stored_filename="demo_water_inspection.jpg",
            storage_path=img3_path,
            processed_path=ann3_path,
            file_type="image",
            mime_type="image/jpeg",
            file_size=os.path.getsize(img3_path),
            width=800,
            height=600
        )
        db.add(file2)

        det3 = Detection(
            inspection_id=insp2.id,
            defect_type="water accumulation",
            confidence=0.89,
            x1=220.0, y1=280.0, x2=480.0, y2=420.0,
            image_width=800, image_height=600,
            area_ratio=0.075,
            severity="High",
            risk_score=72.0
        )
        db.add(det3)
        db.commit()
        db.refresh(det3)

        rec2 = MaintenanceRecommendation(
            inspection_id=insp2.id,
            detection_id=det3.id,
            source="Rule-Based Fallback",
            explanation="Surface ponding detected. Poses vehicular hydroplaning risk during precipitation.",
            risk_factors=[
                "Braking distance elongation due to water film layer",
                "Pavement delamination caused by hydrostatic pumping under heavy axles"
            ],
            maintenance_recommendation="Clear roadside curb inlets and regrade shoulder cross-slope to 2.5% transverse gradient.",
            urgency="Within 48 Hours",
            inspection_checklist=[
                "Check storm drain inlet for silt and debris blockage",
                "Measure ponding depth across wheel paths",
                "Verify shoulder cross-slope runoff"
            ]
        )
        db.add(rec2)

        disp2 = OfficerDispatch(
            inspection_id=insp2.id,
            detection_id=det3.id,
            assigned_officer_id=None,
            status="Pending",
            priority="High",
            damage_summary="Automated AI Alert: High Severity Water Accumulation (72/100 Risk) on SH-12. Damage boxed.",
            boxed_image_path=ann3_path,
            action_notes="Awaiting officer assignment from municipal pool.",
            dispatch_time=datetime.utcnow() - timedelta(days=1)
        )
        db.add(disp2)

        # Historical inspections
        hist1 = HistoricalInspection(
            road_segment_id=seg1.id,
            inspection_id=insp1.id,
            inspection_date=datetime.utcnow() - timedelta(days=30),
            defect_count=8,
            avg_risk=62.0,
            max_risk=75.0,
            severity_distribution={"Low": 2, "Medium": 4, "High": 2, "Critical": 0},
            resolved_count=3,
            persistent_count=5,
            new_count=6
        )
        db.add(hist1)

        db.commit()
        print("Successfully seeded [Demo Data] into database.")

    except Exception as e:
        print(f"Error seeding demo data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
