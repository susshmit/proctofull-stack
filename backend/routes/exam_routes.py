from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime, timezone

exam_bp = Blueprint("exam", __name__, url_prefix="/api/exams")


@exam_bp.route("/create", methods=["POST"])
@jwt_required()
def create_exam():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    title = data.get("title")
    description = data.get("description", "")
    subject = data.get("subject", "")
    duration_minutes = data.get("duration", 60)
    questions = data.get("questions", [])

    start_time_str = data.get("start_time")
    end_time_str = data.get("end_time")
    
    start_time = datetime.fromisoformat(start_time_str.replace('Z', '+00:00')) if start_time_str else None
    end_time = datetime.fromisoformat(end_time_str.replace('Z', '+00:00')) if end_time_str else None

    allowed_students_raw = data.get("allowed_students", "")
    allowed_students = [email.strip() for email in allowed_students_raw.split(",") if email.strip()]

    if not title:
        return jsonify({"error": "title is required"}), 400

    db = current_app.config["MONGO_DB"]
    created_by = get_jwt_identity()

    from models import exam_schema
    exam_doc = exam_schema(
        title=title,
        description=description,
        subject=subject,
        questions=questions,
        created_by=created_by,
        start_time=start_time,
        end_time=end_time,
        allowed_students=allowed_students
    )

    result = db.exams.insert_one(exam_doc)

    return jsonify({
        "message": "Exam created successfully",
        "exam_id": str(result.inserted_id)
    }), 201


@exam_bp.route("", methods=["GET"])
@jwt_required()
def get_exams():
    db = current_app.config["MONGO_DB"]
    student_id = get_jwt_identity()
    student = db.users.find_one({"_id": ObjectId(student_id)})
    student_email = student.get("email") if student else ""
    
    # Only return exams where allowed_students is empty (open to all) OR student_email is in allowed_students
    exams = list(db.exams.find({
        "$or": [
            {"allowed_students": {"$exists": False}},
            {"allowed_students": {"$size": 0}},
            {"allowed_students": student_email}
        ]
    }))

    from demo_exam import get_demo_exam
    exams.insert(0, get_demo_exam())
    
    # Get all submissions for this student
    submissions = list(db.submissions.find({"student_id": student_id}))
    submitted_exam_ids = {str(sub["exam_id"]) for sub in submissions}
    
    # Format exams for frontend
    formatted_exams = []
    for exam in exams:
        exam_id_str = str(exam["_id"])
        status = exam.get("status", "upcoming")
        if exam_id_str in submitted_exam_ids and exam_id_str != "demo-exam-12345":
            status = "completed"
            
        formatted_exams.append({
            "id": exam_id_str,
            "title": exam.get("title", ""),
            "description": exam.get("description", ""),
            "subject": exam.get("subject", ""),
            "duration": exam.get("duration_minutes", 60),
            "totalQuestions": len(exam.get("questions", [])),
            "scheduledAt": exam.get("created_at").isoformat(),
            "status": status,
            "instructions": [] # Can be added later
        })

    return jsonify(formatted_exams), 200


@exam_bp.route("/<exam_id>", methods=["GET"])
@jwt_required()
def get_exam(exam_id):
    db = current_app.config["MONGO_DB"]
    student_id = get_jwt_identity()
    
    try:
        from demo_exam import get_demo_exam
        demo = get_demo_exam()
        if exam_id == demo["_id"]:
            exam = demo
        else:
            exam = db.exams.find_one({"_id": ObjectId(exam_id)})
    except Exception:
        return jsonify({"error": "Invalid exam ID format"}), 400

    if not exam:
        return jsonify({"error": "Exam not found"}), 404

    student = db.users.find_one({"_id": ObjectId(student_id)})
    student_email = student.get("email") if student else ""

    allowed_students = exam.get("allowed_students", [])
    if allowed_students and student_email not in allowed_students:
        return jsonify({"error": "You are not authorized for this exam"}), 403

    # Check if submitted
    submission = db.submissions.find_one({
        "student_id": student_id,
        "exam_id": exam_id
    })
    
    if submission and exam_id != demo["_id"]:
        status = "completed"
    else:
        status = exam.get("status", "upcoming")

    now = datetime.now(timezone.utc)
    st_str = exam.get("start_time")
    et_str = exam.get("end_time")
    if st_str and et_str:
        st = datetime.fromisoformat(st_str)
        et = datetime.fromisoformat(et_str)
        if now < st or now > et:
            return jsonify({"error": "Exam is not currently active."}), 403

    return jsonify({
        "id": str(exam["_id"]),
        "title": exam.get("title", ""),
        "description": exam.get("description", ""),
        "subject": exam.get("subject", ""),
        "duration": exam.get("duration_minutes", 60),
        "totalQuestions": len(exam.get("questions", [])),
        "scheduledAt": exam.get("created_at").isoformat(),
        "status": status,
        "instructions": [],
        "questions": exam.get("questions", [])
    }), 200


@exam_bp.route("/start", methods=["POST"])
@jwt_required()
def start_exam():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    exam_id = data.get("exam_id")
    if not exam_id:
        return jsonify({"error": "exam_id is required"}), 400

    db = current_app.config["MONGO_DB"]
    student_id = get_jwt_identity()

    # Verify the exam exists
    try:
        from demo_exam import get_demo_exam
        demo = get_demo_exam()
        if exam_id == demo["_id"]:
            exam = demo
        else:
            exam = db.exams.find_one({"_id": ObjectId(exam_id)})
    except Exception:
        return jsonify({"error": "Invalid exam ID format"}), 400

    if not exam:
        return jsonify({"error": "Exam not found"}), 404

    student = db.users.find_one({"_id": ObjectId(student_id)})
    student_email = student.get("email") if student else ""

    allowed_students = exam.get("allowed_students", [])
    if allowed_students and student_email not in allowed_students:
        return jsonify({"error": "You are not authorized for this exam"}), 403

    # Check for existing active session
    active_session = db.exam_sessions.find_one({
        "student_id": student_id,
        "exam_id": exam_id,
        "status": "active",
    })
    if active_session:
        return jsonify({
            "message": "Resuming existing session",
            "session": {
                "id": str(active_session["_id"]),
                "exam_id": exam_id,
                "start_time": active_session["start_time"].isoformat(),
                "status": "active",
            },
            "questions": [
                {
                    "id": q.get("id", str(i)),
                    "text": q["text"],
                    "options": q["options"],
                    "type": q.get("type", "mcq"),
                }
                for i, q in enumerate(exam.get("questions", []))
            ],
        }), 200

    # Create a new session
    from models import exam_session_schema

    session_doc = exam_session_schema(student_id=student_id, exam_id=exam_id)
    result = db.exam_sessions.insert_one(session_doc)

    # Return exam questions (without correct answers)
    questions = []
    for i, q in enumerate(exam.get("questions", [])):
        questions.append({
            "id": q.get("id", str(i)),
            "text": q["text"],
            "options": q["options"],
            "type": q.get("type", "mcq"),
        })

    return jsonify({
        "message": "Exam session started",
        "session": {
            "id": str(result.inserted_id),
            "exam_id": exam_id,
            "start_time": session_doc["start_time"].isoformat(),
            "status": "active",
        },
        "exam": {
            "title": exam["title"],
            "duration_minutes": exam["duration_minutes"],
        },
        "questions": questions,
    }), 201


@exam_bp.route("/submit", methods=["POST"])
@jwt_required()
def submit_exam():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    session_id = data.get("session_id")
    answers = data.get("answers", {})
    violations = data.get("violations", [])

    if not session_id:
        return jsonify({"error": "session_id is required"}), 400

    db = current_app.config["MONGO_DB"]
    student_id = get_jwt_identity()

    # Find the session
    try:
        session = db.exam_sessions.find_one({
            "_id": ObjectId(session_id),
            "student_id": student_id,
        })
    except Exception:
        return jsonify({"error": "Invalid session ID format"}), 400

    if not session:
        return jsonify({"error": "Session not found or access denied"}), 404

    if session["status"] == "completed" and session["exam_id"] != "demo-exam-12345":
        return jsonify({"error": "This exam session has already been submitted"}), 400

    from demo_exam import get_demo_exam
    demo = get_demo_exam()
    if session["exam_id"] == demo["_id"]:
        exam = demo
    else:
        exam = db.exams.find_one({"_id": ObjectId(session["exam_id"])})
        
    if not exam:
        return jsonify({"error": "Exam not found"}), 404

    correct_answers = {q.get("id"): q.get("correct_answer") for q in exam.get("questions", [])}
    
    score = 0
    total_questions = len(correct_answers)
    for q_id, ans in answers.items():
        if correct_answers.get(q_id) == ans:
            score += 1
            
    final_score = (score / total_questions * 100) if total_questions > 0 else 0

    from models import submission_schema, violation_log_schema
    submission_doc = submission_schema(student_id, session["exam_id"], answers, final_score)
    db.submissions.insert_one(submission_doc)

    # Insert violations
    if violations:
        for v in violations:
            v_type = v.get("type")
            if v_type:
                v_doc = violation_log_schema(session_id=session_id, violation_type=v_type)
                try:
                    v_timestamp = v.get("timestamp")
                    if v_timestamp:
                        v_doc["timestamp"] = datetime.fromtimestamp(v_timestamp / 1000.0, timezone.utc)
                except Exception:
                    pass
                db.violation_logs.insert_one(v_doc)

    # Calculate integrity score based on violations
    violation_count = db.violation_logs.count_documents({"session_id": session_id})
    integrity_score = max(0.0, 100.0 - (violation_count * 10.0))

    # Update the session
    db.exam_sessions.update_one(
        {"_id": ObjectId(session_id)},
        {
            "$set": {
                "status": "completed",
                "end_time": datetime.now(timezone.utc),
                "answers": answers,
                "integrity_score": integrity_score,
            }
        },
    )

    return jsonify({
        "message": "Exam submitted successfully",
        "result": {
            "session_id": session_id,
            "total_answered": len(answers),
            "integrity_score": integrity_score,
            "violations_recorded": violation_count,
            "status": "completed",
        },
    }), 200
