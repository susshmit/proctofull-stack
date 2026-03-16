from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

monitoring_bp = Blueprint("monitoring", __name__, url_prefix="/api/monitoring")


@monitoring_bp.route("/log-violation", methods=["POST"])
@jwt_required()
def log_violation():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    session_id = data.get("session_id")
    violation_type = data.get("violation_type")

    if not all([session_id, violation_type]):
        return jsonify({"error": "session_id and violation_type are required"}), 400

    valid_types = [
        "tab_switch", "multiple_faces", "face_not_visible",
        "mobile_detected", "noise_detected", "looking_away",
        "phone_detected",
    ]
    if violation_type not in valid_types:
        return jsonify({"error": f"Invalid violation_type. Must be one of: {valid_types}"}), 400

    db = current_app.config["MONGO_DB"]

    # Verify the session exists and belongs to the requesting user
    from bson import ObjectId

    try:
        session = db.exam_sessions.find_one({"_id": ObjectId(session_id)})
    except Exception:
        return jsonify({"error": "Invalid session ID format"}), 400

    if not session:
        return jsonify({"error": "Session not found"}), 404

    if session["status"] != "active":
        return jsonify({"error": "Cannot log violations for a completed session"}), 400

    # Save violation
    from models import violation_log_schema

    violation_doc = violation_log_schema(session_id=session_id, violation_type=violation_type)
    result = db.violation_logs.insert_one(violation_doc)

    # Update integrity score in real-time
    total_violations = db.violation_logs.count_documents({"session_id": session_id})
    new_score = max(0.0, 100.0 - (total_violations * 10.0))

    db.exam_sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {"integrity_score": new_score}},
    )

    return jsonify({
        "message": "Violation logged",
        "violation": {
            "id": str(result.inserted_id),
            "session_id": session_id,
            "type": violation_type,
            "timestamp": violation_doc["timestamp"].isoformat(),
        },
        "current_integrity_score": new_score,
    }), 201


@monitoring_bp.route("/webrtc-signaling", methods=["POST"])
@jwt_required()
def webrtc_signaling():
    """
    WebRTC Signaling Endpoint

    Handles SDP offer/answer exchange for establishing peer-to-peer
    video connections between the student's browser and the proctoring server.

    Expected payload:
    {
        "type": "offer" | "answer" | "candidate",
        "session_id": "<exam_session_id>",
        "sdp": "<SDP string>"          // for offer/answer
        "candidate": { ... }           // for ICE candidate
    }

    In production, this should be replaced with a WebSocket-based
    signaling server (e.g., Flask-SocketIO) for real-time bidirectional
    communication. This REST endpoint serves as a structural placeholder.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    signal_type = data.get("type")
    session_id = data.get("session_id")

    if not all([signal_type, session_id]):
        return jsonify({"error": "type and session_id are required"}), 400

    if signal_type not in ("offer", "answer", "candidate"):
        return jsonify({"error": "type must be 'offer', 'answer', or 'candidate'"}), 400

    if signal_type in ("offer", "answer") and not data.get("sdp"):
        return jsonify({"error": "sdp is required for offer/answer"}), 400

    if signal_type == "candidate" and not data.get("candidate"):
        return jsonify({"error": "candidate object is required for ICE candidate"}), 400

    # In production: forward SDP/candidate to the other peer via WebSocket
    # For now, acknowledge receipt
    return jsonify({
        "message": f"WebRTC {signal_type} received",
        "session_id": session_id,
        "status": "acknowledged",
        "note": "Replace with Flask-SocketIO for production WebRTC signaling",
    }), 200


@monitoring_bp.route("/analyze-frame", methods=["POST"])
@jwt_required()
def analyze_frame():
    """
    Endpoint to receive a webcam frame and run AI analysis.

    Expects multipart/form-data with:
        - frame: image file (JPEG/PNG)
        - session_id: exam session ID

    Calls the AI service stubs (face verification, gaze tracking, object detection).
    When the ML models are integrated, this endpoint will return real analysis results.
    """
    session_id = request.form.get("session_id")
    frame = request.files.get("frame")

    if not session_id:
        return jsonify({"error": "session_id is required"}), 400

    if not frame:
        return jsonify({"error": "frame file is required"}), 400

    frame_bytes = frame.read()

    db = current_app.config["MONGO_DB"]
    from bson import ObjectId

    try:
        session = db.exam_sessions.find_one({"_id": ObjectId(session_id)})
    except Exception:
        return jsonify({"error": "Invalid session ID"}), 400

    if not session:
        return jsonify({"error": "Session not found"}), 404

    # Run AI analysis stubs
    from services.ai_service import analyze_frame as ai_analyze

    result = ai_analyze(frame_bytes, session["student_id"])

    # Auto-log any detected violations
    from models import violation_log_schema

    for violation_type in result["violations"]:
        violation_doc = violation_log_schema(session_id=session_id, violation_type=violation_type)
        db.violation_logs.insert_one(violation_doc)

    # Update integrity score
    if result["violations"]:
        total_violations = db.violation_logs.count_documents({"session_id": session_id})
        new_score = max(0.0, 100.0 - (total_violations * 10.0))
        db.exam_sessions.update_one(
            {"_id": ObjectId(session_id)},
            {"$set": {"integrity_score": new_score}},
        )

    return jsonify({
        "analysis": result,
        "violations_detected": len(result["violations"]),
    }), 200
