import os
from typing import Optional, Tuple
from PIL import Image, ExifTags

def _convert_to_degrees(value) -> float:
    """Helper function to convert GPS rational tuples to decimal degrees."""
    try:
        d = float(value[0])
        m = float(value[1])
        s = float(value[2])
        return d + (m / 60.0) + (s / 3600.0)
    except Exception:
        return 0.0

def extract_exif_gps(image_path: str) -> Tuple[Optional[float], Optional[float]]:
    """
    Attempts to extract latitude and longitude from image EXIF metadata.
    Returns (latitude, longitude) as floats, or (None, None) if unavailable.
    """
    if not os.path.exists(image_path):
        return None, None

    try:
        image = Image.open(image_path)
        exif_raw = image._getexif()
        if not exif_raw:
            return None, None

        exif = {}
        for tag_id, val in exif_raw.items():
            tag_name = ExifTags.TAGS.get(tag_id, tag_id)
            exif[tag_name] = val

        gps_info = exif.get("GPSInfo")
        if not gps_info:
            return None, None

        # GPS Info tags
        gps_tags = {}
        for key in gps_info.keys():
            sub_name = ExifTags.GPSTAGS.get(key, key)
            gps_tags[sub_name] = gps_info[key]

        lat_val = gps_tags.get("GPSLatitude")
        lat_ref = gps_tags.get("GPSLatitudeRef")
        lng_val = gps_tags.get("GPSLongitude")
        lng_ref = gps_tags.get("GPSLongitudeRef")

        if lat_val and lat_ref and lng_val and lng_ref:
            lat = _convert_to_degrees(lat_val)
            if lat_ref != "N":
                lat = -lat

            lng = _convert_to_degrees(lng_val)
            if lng_ref != "E":
                lng = -lng

            # Basic sanity check
            if -90.0 <= lat <= 90.0 and -180.0 <= lng <= 180.0:
                return round(lat, 6), round(lng, 6)
    except Exception:
        pass

    return None, None
