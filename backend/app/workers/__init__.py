from app.workers.celery_app import celery_app
from app.workers.tasks import (
    process_image_celery_task,
    process_video_celery_task,
    run_image_processing_sync,
    run_video_processing_sync
)
from app.workers.local_queue import dispatch_image_task, dispatch_video_task

__all__ = [
    "celery_app",
    "process_image_celery_task",
    "process_video_celery_task",
    "run_image_processing_sync",
    "run_video_processing_sync",
    "dispatch_image_task",
    "dispatch_video_task",
]
