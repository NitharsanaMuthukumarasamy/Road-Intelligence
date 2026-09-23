import os
import cv2
import numpy as np
import pytest
from app.services.cv_service import annotate_damage_box, process_image, get_yolo_model
from app.config import settings

def test_damage_boxing_annotation(tmp_path):
    # Create test synthetic image
    test_img = np.full((300, 400, 3), 100, dtype=np.uint8)
    annotated = annotate_damage_box(
        img_bgr=test_img,
        x1=50, y1=50, x2=200, y2=180,
        defect_type="pothole",
        confidence=0.92,
        severity="Critical",
        risk_score=85.0
    )
    assert annotated.shape == (300, 400, 3)

def test_process_image_pipeline(tmp_path):
    # Create synthetic test file
    test_file = tmp_path / "test_road.jpg"
    out_file = tmp_path / "test_road_annotated.jpg"

    img = np.full((400, 500, 3), 80, dtype=np.uint8)
    # Draw dark depression
    cv2.ellipse(img, (250, 250), (40, 25), 0, 0, 360, (20, 20, 20), -1)
    cv2.imwrite(str(test_file), img)

    result = process_image(str(test_file), str(out_file))
    assert os.path.exists(str(out_file))
    assert result["width"] == 500
    assert result["height"] == 400
    assert "detections" in result
    assert "highest_severity" in result
