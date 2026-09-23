import os
import asyncio
from datetime import datetime
from app.workers.celery_app import celery_app
from app.database import SessionLocal
from app.models.processing_job import ProcessingJob
from app.models.inspection import Inspection
from app.models.file import FileRecord
from app.models.detection import Detection
from app.models.maintenance_recommendation import MaintenanceRecommendation
from app.models.officer_dispatch import OfficerDispatch
from app.models.road_segment import RoadSegment
from app.models.audit_log import AuditLog
from app.services.cv_service import process_image, process_video
from app.services.openrouter_service import get_ai_recommendation
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("worker_tasks")

def run_image_processing_sync(
    job_id: str,
    inspection_id: int,
    file_id: int,
    file_path: str,
    user_id: int,
    road_importance: str = "Medium"
):
    """
    Core image processing workflow.
    Can be called by Celery worker or background task queue.
    """
    db = SessionLocal()
    try:
        job = db.query(ProcessingJob).filter(ProcessingJob.job_id == job_id).first()
        if job:
            job.status = "processing"
            job.progress = 15.0
            job.step_message = "Running YOLO defect detection & damage boxing..."
            db.commit()

        # Define output path for boxed/annotated image
        base_name = os.path.basename(file_path)
        output_filename = f"annotated_{base_name}"
        output_path = os.path.join(settings.PROCESSED_DIR, output_filename)

        # 1. Run CV Inference
        cv_result = process_image(
            input_path=file_path,
            output_path=output_path,
            road_importance=road_importance
        )

        if job:
            job.progress = 55.0
            job.step_message = "Storing defect telemetry & bounding boxes..."
            db.commit()

        # 2. Update File Record
        file_rec = db.query(FileRecord).filter(FileRecord.id == file_id).first()
        if file_rec:
            file_rec.processed_path = output_path
            file_rec.width = cv_result["width"]
            file_rec.height = cv_result["height"]
            db.commit()

        # 3. Store Detections
        created_detections = []
        for det_data in cv_result["detections"]:
            det = Detection(
                inspection_id=inspection_id,
                defect_type=det_data["defect_type"],
                confidence=det_data["confidence"],
                x1=det_data["x1"],
                y1=det_data["y1"],
                x2=det_data["x2"],
                y2=det_data["y2"],
                image_width=cv_result["width"],
                image_height=cv_result["height"],
                area_ratio=det_data["area_ratio"],
                severity=det_data["severity"],
                risk_score=det_data["risk_score"]
            )
            db.add(det)
            db.flush()
            created_detections.append(det)

        db.commit()

        if job:
            job.progress = 75.0
            job.step_message = "Generating AI maintenance recommendations & officer dispatch..."
            db.commit()

        # 4. Generate AI Recommendation (OpenRouter or Rule-Based Fallback)
        primary_defect = "Road Surface Anomaly"
        primary_sev = cv_result["highest_severity"]
        primary_risk = cv_result["highest_risk"]
        primary_conf = 0.85
        has_water = any("water" in d["defect_type"] for d in cv_result["detections"])

        if created_detections:
            # Sort by risk descending
            top_det = sorted(created_detections, key=lambda d: d.risk_score, reverse=True)[0]
            primary_defect = top_det.defect_type
            primary_sev = top_det.severity
            primary_risk = top_det.risk_score
            primary_conf = top_det.confidence

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            ai_rec = loop.run_until_complete(
                get_ai_recommendation(
                    defect_type=primary_defect,
                    severity=primary_sev,
                    risk_score=primary_risk,
                    confidence=primary_conf,
                    road_importance=road_importance,
                    defect_frequency=len(created_detections),
                    has_water=has_water
                )
            )
        finally:
            loop.close()

        rec_entry = MaintenanceRecommendation(
            inspection_id=inspection_id,
            detection_id=created_detections[0].id if created_detections else None,
            source=ai_rec.get("source", "Rule-Based Fallback"),
            explanation=ai_rec.get("explanation", ""),
            risk_factors=ai_rec.get("risk_factors", []),
            maintenance_recommendation=ai_rec.get("maintenance_recommendation", ""),
            urgency=ai_rec.get("urgency", "Within 7 Days"),
            inspection_checklist=ai_rec.get("inspection_checklist", [])
        )
        db.add(rec_entry)
        db.commit()

        # 5. AUTOMATED DAMAGE BOXING & OFFICER DISPATCH
        # As requested: "and the step need to be automattically need to box the damage area and send to the officer"
        # If defects are detected, an alert ticket is automatically generated for officers
        if len(created_detections) > 0:
            top_det = created_detections[0]
            dispatch_priority = "Critical" if primary_risk >= 76 else ("High" if primary_risk >= 51 else "Medium")
            dispatch = OfficerDispatch(
                inspection_id=inspection_id,
                detection_id=top_det.id,
                status="Pending",
                priority=dispatch_priority,
                damage_summary=f"Automated AI Alert: {len(created_detections)} defect(s) detected. Peak defect: {primary_defect} ({primary_sev} severity, {int(primary_risk)}/100 risk). Damage boxed.",
                boxed_image_path=output_path,
                action_notes="Auto-dispatched by AI Road Condition Intelligence System upon defect verification.",
                dispatch_time=datetime.utcnow()
            )
            db.add(dispatch)
            db.commit()

        # 6. Update Inspection Summary
        insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
        if insp:
            insp.total_defects = cv_result["total_defects"]
            insp.highest_severity = cv_result["highest_severity"]
            insp.highest_risk = cv_result["highest_risk"]
            insp.priority = "Critical" if cv_result["highest_risk"] >= 76 else (
                "High" if cv_result["highest_risk"] >= 51 else (
                    "Medium" if cv_result["highest_risk"] >= 26 else "Low"
                )
            )
            insp.status = "ANALYZED"
            db.commit()

            # 7. Update Road Segment aggregate if linked
            if insp.road_segment_id:
                seg = db.query(RoadSegment).filter(RoadSegment.id == insp.road_segment_id).first()
                if seg:
                    seg.total_defects += len(created_detections)
                    for d in created_detections:
                        if "pothole" in d.defect_type:
                            seg.pothole_count += 1
                        elif "crack" in d.defect_type:
                            seg.crack_count += 1
                        elif "water" in d.defect_type:
                            seg.water_count += 1
                        else:
                            seg.damaged_road_count += 1
                    seg.max_risk = max(seg.max_risk, cv_result["highest_risk"])
                    seg.avg_risk = round((seg.avg_risk + cv_result["highest_risk"]) / 2.0, 1)
                    if cv_result["highest_severity"] in ["High", "Critical"]:
                        seg.highest_severity = cv_result["highest_severity"]
                        seg.priority = "Critical" if seg.max_risk >= 76 else "High"
                    db.commit()

        # 8. Complete Job
        if job:
            job.status = "completed"
            job.progress = 100.0
            job.step_message = "Analysis complete. Damage boxed and dispatched."
            job.completed_at = datetime.utcnow()
            db.commit()

        logger.info(f"Successfully processed image job {job_id} for inspection {inspection_id}")

    except Exception as exc:
        logger.error(f"Error in image processing job {job_id}: {str(exc)}", exc_info=True)
        db.rollback()
        job = db.query(ProcessingJob).filter(ProcessingJob.job_id == job_id).first()
        if job:
            job.status = "failed"
            job.error_message = str(exc)
            job.completed_at = datetime.utcnow()
            db.commit()
        insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
        if insp:
            insp.status = "failed"
            db.commit()
    finally:
        db.close()

def run_video_processing_sync(
    job_id: str,
    inspection_id: int,
    file_id: int,
    file_path: str,
    user_id: int,
    road_importance: str = "Medium",
    frame_interval: int = 3
):
    """
    Core video processing workflow.
    """
    db = SessionLocal()
    try:
        job = db.query(ProcessingJob).filter(ProcessingJob.job_id == job_id).first()
        if job:
            job.status = "processing"
            job.progress = 5.0
            job.step_message = "Starting OpenCV video frame extraction & YOLO tracking..."
            db.commit()

        base_name = os.path.basename(file_path)
        name_no_ext = os.path.splitext(base_name)[0]
        output_filename = f"annotated_{name_no_ext}.mp4"
        output_path = os.path.join(settings.VIDEOS_DIR, output_filename)

        def update_progress(pct: float, msg: str):
            try:
                sub_db = SessionLocal()
                sub_job = sub_db.query(ProcessingJob).filter(ProcessingJob.job_id == job_id).first()
                if sub_job:
                    sub_job.progress = pct
                    sub_job.step_message = msg
                    sub_db.commit()
                sub_db.close()
            except Exception:
                pass

        # 1. Run Video Processing
        cv_result = process_video(
            input_path=file_path,
            output_path=output_path,
            road_importance=road_importance,
            frame_interval=frame_interval,
            progress_callback=update_progress
        )

        # 2. Update File Record
        file_rec = db.query(FileRecord).filter(FileRecord.id == file_id).first()
        if file_rec:
            file_rec.processed_path = output_path
            file_rec.width = cv_result["width"]
            file_rec.height = cv_result["height"]
            file_rec.duration_seconds = cv_result["duration_seconds"]
            db.commit()

        # 3. Store sample detections (cap at 50 major events to prevent database bloat)
        created_detections = []
        for det_data in cv_result["detections"][:50]:
            det = Detection(
                inspection_id=inspection_id,
                defect_type=det_data["defect_type"],
                confidence=det_data["confidence"],
                x1=det_data["x1"],
                y1=det_data["y1"],
                x2=det_data["x2"],
                y2=det_data["y2"],
                image_width=cv_result["width"],
                image_height=cv_result["height"],
                area_ratio=det_data["area_ratio"],
                frame_number=det_data["frame_number"],
                timestamp_sec=det_data["timestamp_sec"],
                severity=det_data["severity"],
                risk_score=det_data["risk_score"]
            )
            db.add(det)
            db.flush()
            created_detections.append(det)

        db.commit()

        # 4. Generate AI Recommendation
        primary_defect = "Road Pavement Defects"
        if cv_result["defect_type_counts"]:
            primary_defect = max(cv_result["defect_type_counts"].items(), key=lambda x: x[1])[0]

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            ai_rec = loop.run_until_complete(
                get_ai_recommendation(
                    defect_type=primary_defect,
                    severity=cv_result["highest_severity"],
                    risk_score=cv_result["highest_risk"],
                    confidence=0.88,
                    road_importance=road_importance,
                    defect_frequency=cv_result["total_defects"],
                    has_water="water" in cv_result["defect_type_counts"]
                )
            )
        finally:
            loop.close()

        rec_entry = MaintenanceRecommendation(
            inspection_id=inspection_id,
            source=ai_rec.get("source", "Rule-Based Fallback"),
            explanation=ai_rec.get("explanation", ""),
            risk_factors=ai_rec.get("risk_factors", []),
            maintenance_recommendation=ai_rec.get("maintenance_recommendation", ""),
            urgency=ai_rec.get("urgency", "Within 7 Days"),
            inspection_checklist=ai_rec.get("inspection_checklist", [])
        )
        db.add(rec_entry)
        db.commit()

        # 5. Automated Dispatch to Officer
        if cv_result["total_defects"] > 0:
            dispatch_priority = "Critical" if cv_result["highest_risk"] >= 76 else ("High" if cv_result["highest_risk"] >= 51 else "Medium")
            dispatch = OfficerDispatch(
                inspection_id=inspection_id,
                detection_id=created_detections[0].id if created_detections else None,
                status="Pending",
                priority=dispatch_priority,
                damage_summary=f"Video Analysis Alert: {cv_result['total_defects']} defect instances recorded across {cv_result['duration_seconds']}s video. Peak risk: {int(cv_result['highest_risk'])}/100 ({cv_result['highest_severity']}).",
                boxed_image_path=output_path,
                action_notes="Auto-dispatched to Officer maintenance queue from video survey.",
                dispatch_time=datetime.utcnow()
            )
            db.add(dispatch)
            db.commit()

        # 6. Update Inspection Summary
        insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
        if insp:
            insp.total_defects = cv_result["total_defects"]
            insp.highest_severity = cv_result["highest_severity"]
            insp.highest_risk = cv_result["highest_risk"]
            insp.priority = "Critical" if cv_result["highest_risk"] >= 76 else (
                "High" if cv_result["highest_risk"] >= 51 else (
                    "Medium" if cv_result["highest_risk"] >= 26 else "Low"
                )
            )
            insp.status = "ANALYZED"
            db.commit()

        # 7. Complete Job
        job = db.query(ProcessingJob).filter(ProcessingJob.job_id == job_id).first()
        if job:
            job.status = "completed"
            job.progress = 100.0
            job.step_message = "Video analysis and tracking complete."
            job.completed_at = datetime.utcnow()
            db.commit()

        logger.info(f"Successfully processed video job {job_id}")

    except Exception as exc:
        logger.error(f"Error in video processing job {job_id}: {str(exc)}", exc_info=True)
        db.rollback()
        job = db.query(ProcessingJob).filter(ProcessingJob.job_id == job_id).first()
        if job:
            job.status = "failed"
            job.error_message = str(exc)
            job.completed_at = datetime.utcnow()
            db.commit()
        insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
        if insp:
            insp.status = "failed"
            db.commit()
    finally:
        db.close()

# Celery Task Wrappers
@celery_app.task(name="app.workers.tasks.process_image_celery_task")
def process_image_celery_task(job_id, inspection_id, file_id, file_path, user_id, road_importance="Medium"):
    run_image_processing_sync(job_id, inspection_id, file_id, file_path, user_id, road_importance)

@celery_app.task(name="app.workers.tasks.process_video_celery_task")
def process_video_celery_task(job_id, inspection_id, file_id, file_path, user_id, road_importance="Medium", frame_interval=3):
    run_video_processing_sync(job_id, inspection_id, file_id, file_path, user_id, road_importance, frame_interval)
