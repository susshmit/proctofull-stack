from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity
from bson import ObjectId

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


# ✅ CORS-safe admin auth decorator
def admin_required(fn):
    from functools import wraps
    from flask_jwt_extended import jwt_required, get_jwt

    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if not claims or claims.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return fn(*args, **kwargs)

    return wrapper


# ✅ Create Exam
@admin_bp.route("/exams", methods=["POST"])
@admin_required
def create_exam():
    data = request.get_json()
    if not data:
        return jsonify({"detail": "Request body is required"}), 400

    title = data.get("title")
    subject = data.get("subject", "")
    duration_minutes = data.get("duration")
    questions = data.get("questions", [])
    allowed_students = data.get("allowed_students", [])

    start_time_str = data.get("start_time")
    end_time_str = data.get("end_time")

    if not all([title, duration_minutes]):
        return jsonify({"detail": "title and duration are required"}), 400

    if not isinstance(questions, list) or len(questions) == 0:
        return jsonify({"detail": "questions must be a non-empty array"}), 400

    from datetime import datetime
    start_time = datetime.fromisoformat(start_time_str.replace('Z', '+00:00')) if start_time_str else None
    end_time = datetime.fromisoformat(end_time_str.replace('Z', '+00:00')) if end_time_str else None

    if start_time and end_time and start_time >= end_time:
        return jsonify({"detail": "start_time must be before end_time"}), 400

    # Ensure format for each question matches DB expectations
    formatted_questions = []
    for q in questions:
        formatted_q = {
            "id": q.get("id"),
            "text": q.get("text"),
            "options": q.get("options", []),
            "type": q.get("type", "mcq"),
            "correct_answer": q.get("correct_option") # Mapping frontend correct_option to DB correct_answer
        }
        formatted_questions.append(formatted_q)

    from models import exam_schema

    db = current_app.config["MONGO_DB"]
    admin_id = get_jwt_identity()

    exam_doc = exam_schema(
        title=title,
        description=data.get("description", ""),
        subject=subject,
        duration_minutes=duration_minutes,
        questions=formatted_questions,
        created_by=admin_id,
        start_time=start_time,
        end_time=end_time,
        allowed_students=allowed_students
    )

    result = db.exams.insert_one(exam_doc)

    return jsonify({
        "message": "Exam created successfully",
        "exam": {
            "id": str(result.inserted_id),
            "title": title,
            "duration_minutes": duration_minutes,
            "total_questions": len(questions),
        },
    }), 201


# ✅ List Exams (with Demo data fallback)
@admin_bp.route("/exams", methods=["GET"])
@admin_required
def list_exams():
    db = current_app.config["MONGO_DB"]
    admin_id = get_jwt_identity()
    
    exams = list(db.exams.find({"created_by": admin_id}))

    result = []
    
    # Check if we should show demo data
    if len(exams) == 0:
        from demo_exam import get_demo_exam
        demo = get_demo_exam()
        demo_formatted = {
            "id": str(demo["_id"]),
            "title": demo["title"],
            "duration_minutes": demo["duration_minutes"],
            "total_questions": len(demo.get("questions", [])),
            "created_at": demo["created_at"].isoformat(),
            "allowed_students": demo.get("allowed_students", []),
            "start_time": demo.get("start_time"),
            "end_time": demo.get("end_time")
        }
        result.append(demo_formatted)

    for exam in exams:
        result.append({
            "id": str(exam["_id"]),
            "title": exam["title"],
            "duration_minutes": exam["duration_minutes"],
            "total_questions": len(exam.get("questions", [])),
            "created_at": exam["created_at"].isoformat(),
            "allowed_students": exam.get("allowed_students", []),
            "start_time": exam.get("start_time"),
            "end_time": exam.get("end_time")
        })

    return jsonify({"exams": result}), 200


# ✅ Exam Report
@admin_bp.route("/reports/<exam_id>", methods=["GET"])
@admin_required
def get_exam_report(exam_id: str):
    db = current_app.config["MONGO_DB"]
    admin_id = get_jwt_identity()

    # Provide demo report if requesting the demo exam ID
    if exam_id == "demo-exam-12345":
        demo_report = {
            "exam_id": "demo-exam-12345",
            "exam_title": "AI Proctoring Demo Exam",
            "student_id": "demo-student",
            "studentName": "Demo Student",
            "status": "suspicious",
            "integrityScore": 72,
            "answered": 20,
            "totalQuestions": 20,
            "violations": 2,
            "submittedAt": "2026-03-10T10:00:00Z"
        }
        return jsonify({
            "exam_id": exam_id,
            "exam_title": "AI Proctoring Demo Exam",
            "total_sessions": 1,
            "reports": [demo_report]
        }), 200

    try:
        exam = db.exams.find_one({
            "_id": ObjectId(exam_id), 
            "created_by": admin_id
        })
    except Exception:
        return jsonify({"error": "Invalid exam ID format"}), 400

    if not exam:
        return jsonify({"error": "Exam not found or you do not have permission"}), 404

    sessions = list(db.exam_sessions.find({"exam_id": exam_id}))
    
    report = []
    for session in sessions:
        session_id = str(session["_id"])
        
        # Determine student name
        student = db.users.find_one({"_id": ObjectId(session["student_id"])})
        student_name = student.get("name", "Unknown") if student else "Unknown"
        
        # Get submissions and violations to ensure accurate data mapping for frontend AdminDashboard
        submission = db.submissions.find_one({"exam_id": exam_id, "student_id": session["student_id"]})
        violations_count = db.violation_logs.count_documents({"session_id": session_id})
        
        answered = len(submission.get("answers_json", {})) if submission else 0
        status = "suspicious" if violations_count > 0 else "clean"
        if session.get("integrity_score", 100) < 50:
             status = "flagged"
             
        report.append({
            "session_id": session_id,
            "student_id": session["student_id"],
            "studentName": student_name,
            "examTitle": exam["title"],
            "status": status,
            "integrityScore": session.get("integrity_score", 100),
            "answered": answered,
            "totalQuestions": len(exam.get("questions", [])),
            "violations": violations_count,
            "submittedAt": submission.get("submitted_at", session["start_time"]).isoformat() if submission else session["start_time"].isoformat()
        })

    return jsonify({
        "exam_id": exam_id,
        "exam_title": exam["title"],
        "total_sessions": len(sessions),
        "reports": report,
    }), 200


# ✅ Delete Exam
@admin_bp.route("/exams/<exam_id>", methods=["DELETE"])
@admin_required
def delete_exam(exam_id: str):
    db = current_app.config["MONGO_DB"]
    admin_id = get_jwt_identity()

    try:
        # Check ownership before deleting
        result = db.exams.delete_one({"_id": ObjectId(exam_id), "created_by": admin_id})
        if result.deleted_count == 0:
            return jsonify({"error": "Exam not found or access denied"}), 404

        # Clean up related records
        db.exam_sessions.delete_many({"exam_id": exam_id})
        db.submissions.delete_many({"exam_id": exam_id})

        return jsonify({"message": "Exam deleted successfully"}), 200
    except Exception:
        return jsonify({"error": "Invalid exam ID format"}), 400


# ✅ Remove Student from Exam
@admin_bp.route("/exams/<exam_id>/students/<student_email>", methods=["DELETE"])
@admin_required
def remove_student_from_exam(exam_id: str, student_email: str):
    db = current_app.config["MONGO_DB"]
    admin_id = get_jwt_identity()

    try:
        # Check ownership before updating
        exam = db.exams.find_one({"_id": ObjectId(exam_id), "created_by": admin_id})
        if not exam:
            return jsonify({"error": "Exam not found or access denied"}), 404

        result = db.exams.update_one(
            {"_id": ObjectId(exam_id)},
            {"$pull": {"allowed_students": student_email}}
        )
        if result.modified_count == 0:
            return jsonify({"message": "Student was not in the allowed list"}), 200

        return jsonify({"message": "Student removed successfully"}), 200
    except Exception:
        return jsonify({"error": "Invalid exam ID format"}), 400


# ✅ Active Students
@admin_bp.route("/active-students", methods=["GET"])
@admin_required
def get_active_students():
    db = current_app.config["MONGO_DB"]
    admin_id = get_jwt_identity()
    
    # 1. Get all exams created by this teacher
    teacher_exams = list(db.exams.find({"created_by": admin_id}, {"_id": 1}))
    teacher_exam_ids = [str(e["_id"]) for e in teacher_exams]
    
    # 2. Find active sessions ONLY for this teacher's exams
    active_sessions = list(db.exam_sessions.find({
        "status": "active",
        "exam_id": {"$in": teacher_exam_ids}
    }))
    
    students = []
    for session in active_sessions:
        student = db.users.find_one({"_id": ObjectId(session["student_id"])})
        if student:
            students.append({
                "id": str(student["_id"]),
                "name": student.get("name", ""),
                "email": student.get("email", ""),
                "exam_id": session["exam_id"]
            })
    return jsonify(students), 200


# ✅ Recent Violations
@admin_bp.route("/violations", methods=["GET"])
@admin_required
def get_all_violations():
    db = current_app.config["MONGO_DB"]
    admin_id = get_jwt_identity()

    # 1. Check if we should inject demo data
    teacher_exams = list(db.exams.find({"created_by": admin_id}, {"_id": 1}))
    if len(teacher_exams) == 0:
        return jsonify([
            {
                "id": "demo-violation-1",
                "student_id": "demo-student",
                "studentName": "Demo Student",
                "type": "multiple_faces",
                "severity": "high",
                "timestamp": "2026-03-10T09:45:00Z"
            },
            {
                "id": "demo-violation-2",
                "student_id": "demo-student",
                "studentName": "Demo Student",
                "type": "prohibited_object",
                "severity": "high",
                "timestamp": "2026-03-10T09:50:00Z"
            }
        ]), 200

    # 2. Retrieve real violations for the teacher's actual exams
    teacher_exam_ids = [str(e["_id"]) for e in teacher_exams]
    
    # Find all sessions matching those exam IDs
    teacher_sessions = list(db.exam_sessions.find({"exam_id": {"$in": teacher_exam_ids}}, {"_id": 1}))
    teacher_session_ids = [str(s["_id"]) for s in teacher_sessions]

    # Find violations for those sessions
    violations = list(db.violation_logs.find({
        "session_id": {"$in": teacher_session_ids}
    }).sort("timestamp", -1).limit(50))
    
    result = []
    for v in violations:
        session = db.exam_sessions.find_one({"_id": ObjectId(v["session_id"])})
        student_name = "Unknown"
        if session:
            student = db.users.find_one({"_id": ObjectId(session["student_id"])})
            if student:
                student_name = student.get("name", "Unknown")
        
        # Calculate severity based on existing frontend penalty logic proxy
        v_type = v.get("violation_type", "unknown")
        severity = "medium"
        if v_type in ["multiple_faces", "prohibited_object", "no_face"]:
             severity = "high"
             
        result.append({
            "id": str(v["_id"]),
            "student_id": session["student_id"] if session else "",
            "studentName": student_name,
            "type": v_type,
            "severity": severity,
            "timestamp": v["timestamp"].isoformat(),
        })
    return jsonify(result), 200

