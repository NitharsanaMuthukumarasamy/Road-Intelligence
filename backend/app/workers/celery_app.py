import os
from celery import Celery
from app.config import settings

celery_app = Celery(
    "road_intelligence_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.workers.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    worker_concurrency=settings.CELERY_CONCURRENCY,
    task_time_limit=1800,  # 30 min max for large videos
)
