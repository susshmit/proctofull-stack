"""
AI / ML Service Stubs

This module contains function wrappers where the actual ML model inference
will be integrated. Each function clearly indicates which library and model
to import when ready.

Dependencies to install later:
    pip install opencv-python dlib ultralytics numpy
"""


def verify_face(frame_bytes: bytes, student_id: str) -> dict:
    """
    FACE VERIFICATION using OpenCV + Dlib

    Integration Steps:
    1. import cv2
    2. import dlib
    3. Load the pre-trained shape predictor:
       predictor = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")
    4. Load the face recognition model:
       face_rec = dlib.face_recognition_model_v1("dlib_face_recognition_resnet_model_v1.dat")
    5. Decode frame_bytes into a numpy array using cv2.imdecode()
    6. Detect faces using dlib.get_frontal_face_detector()
    7. Compute the 128-D face descriptor for the detected face
    8. Compare against the stored biometric profile for student_id
    9. Return match confidence score

    Args:
        frame_bytes: Raw image bytes from the webcam frame
        student_id: The student's database ID to match against stored profile

    Returns:
        dict with keys: "match" (bool), "confidence" (float 0-1), "faces_detected" (int)
    """
    # TODO: Replace with actual OpenCV + Dlib implementation
    return {
        "match": True,
        "confidence": 0.0,
        "faces_detected": 0,
    }


def track_gaze(frame_bytes: bytes) -> dict:
    """
    GAZE TRACKING using Dlib 68-point facial landmark detection

    Integration Steps:
    1. import cv2
    2. import dlib
    3. import numpy as np
    4. Load shape predictor: dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")
    5. Decode frame_bytes with cv2.imdecode()
    6. Detect face landmarks (points 36-47 are the eye regions)
    7. Calculate the eye aspect ratio (EAR) to detect blinks
    8. Compute gaze direction from pupil position relative to eye corners
    9. Determine if the student is looking at the screen, left, right, up, or down
    10. Flag "looking_away" if gaze deviates beyond threshold for > 3 seconds

    Args:
        frame_bytes: Raw image bytes from the webcam frame

    Returns:
        dict with keys: "gaze_direction" (str), "looking_at_screen" (bool),
                        "eye_aspect_ratio" (float), "blink_detected" (bool)
    """
    # TODO: Replace with actual Dlib gaze tracking implementation
    return {
        "gaze_direction": "center",
        "looking_at_screen": True,
        "eye_aspect_ratio": 0.0,
        "blink_detected": False,
    }


def detect_objects(frame_bytes: bytes) -> dict:
    """
    OBJECT DETECTION using YOLOv8 (Ultralytics)

    Integration Steps:
    1. from ultralytics import YOLO
    2. Load the model: model = YOLO("yolov8n.pt")  # nano model for speed
    3. Decode frame_bytes with cv2.imdecode()
    4. Run inference: results = model(frame, conf=0.5)
    5. Parse results for forbidden objects:
       - "cell phone" (class 67 in COCO)
       - "book" (class 73)
       - "laptop" (class 63) — if secondary device
       - "person" (class 0) — count > 1 means multiple people
    6. Return list of detected forbidden objects with confidence scores

    Args:
        frame_bytes: Raw image bytes from the webcam frame

    Returns:
        dict with keys: "forbidden_objects" (list of str), "person_count" (int),
                        "detections" (list of dicts with "label", "confidence", "bbox")
    """
    # TODO: Replace with actual YOLOv8 implementation
    return {
        "forbidden_objects": [],
        "person_count": 1,
        "detections": [],
    }


def analyze_frame(frame_bytes: bytes, student_id: str) -> dict:
    """
    Master analysis function — runs all three AI checks on a single frame.

    This is the main entry point called from monitoring_routes.py.
    It orchestrates face verification, gaze tracking, and object detection,
    then aggregates the results into a single response with violation flags.

    Args:
        frame_bytes: Raw image bytes from the webcam frame
        student_id: The student's database ID

    Returns:
        dict with aggregated results and a list of violations detected
    """
    face_result = verify_face(frame_bytes, student_id)
    gaze_result = track_gaze(frame_bytes)
    object_result = detect_objects(frame_bytes)

    violations = []

    if not face_result["match"]:
        violations.append("face_not_visible")
    if face_result["faces_detected"] > 1:
        violations.append("multiple_faces")
    if not gaze_result["looking_at_screen"]:
        violations.append("looking_away")
    if object_result["forbidden_objects"]:
        violations.append("mobile_detected")
    if object_result["person_count"] > 1:
        violations.append("multiple_faces")

    return {
        "face": face_result,
        "gaze": gaze_result,
        "objects": object_result,
        "violations": list(set(violations)),
        "is_clean": len(violations) == 0,
    }
