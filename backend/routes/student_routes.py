from flask import Blueprint, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

student_bp = Blueprint("student", __name__, url_prefix="/api/student")


def student_required(fn):
    """Decorator to restrict access to student users only."""
    from functools import wraps

    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get("role") != "student":
            return jsonify({"error": "Student access required"}), 403
        return fn(*args, **kwargs)

    return wrapper


@student_bp.route("/exams", methods=["GET"])
@student_required
def get_available_exams():
    db = current_app.config["MONGO_DB"]
    exams = list(db.exams.find())

    from demo_exam import get_demo_exam
    demo = get_demo_exam()
    # Always include demo exam
    demo_formatted = {
        "id": str(demo["_id"]),
        "title": demo["title"],
        "duration_minutes": demo["duration_minutes"],
        "total_questions": len(demo.get("questions", [])),
        "created_at": demo["created_at"].isoformat(),
    }

    result = [demo_formatted]
    for exam in exams:
        result.append({
            "id": str(exam["_id"]),
            "title": exam["title"],
            "duration_minutes": exam["duration_minutes"],
            "total_questions": len(exam.get("questions", [])),
            "created_at": exam["created_at"].isoformat(),
        })

    return jsonify({"exams": result}), 200
@student_bp.route("/results", methods=["GET"])
@student_required
def get_student_results():
    db = current_app.config["MONGO_DB"]
    student_id = get_jwt_identity()
    
    submissions = list(db.submissions.find({"student_id": student_id}))
    
    results = []
    for sub in submissions:
        exam = db.exams.find_one({"_id": sub["exam_id"]})
        exam_title = exam["title"] if exam else "Unknown Exam"
        results.append({
            "exam_id": str(sub["exam_id"]),
            "exam_title": exam_title,
            "final_score": sub.get("final_score", 0),
            "submitted_at": sub["submitted_at"].isoformat() if "submitted_at" in sub else None
        })
        
    return jsonify({"results": results}), 200


@student_bp.route("/profile", methods=["GET"])
@student_required
def get_profile():
    from bson import ObjectId

    db = current_app.config["MONGO_DB"]
    student_id = get_jwt_identity()

    student = db.users.find_one({"_id": ObjectId(student_id)})
    if not student:
        return jsonify({"error": "Student not found"}), 404

    sessions = list(db.exam_sessions.find({"student_id": student_id}))

    return jsonify({
        "student": {
            "id": str(student["_id"]),
            "name": student["name"],
            "email": student["email"],
            "biometric_profile_registered": student.get("biometric_profile_registered", False),
        },
        "total_exams_taken": len(sessions),
        "completed_exams": len([s for s in sessions if s["status"] == "completed"]),
    }), 200
