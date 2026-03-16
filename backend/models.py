"""
MongoDB Document Schemas (PyMongo)

Collections:
  - users
  - exams
  - exam_sessions
  - violation_logs
"""

from datetime import datetime, timezone


def user_schema(name: str, email: str, password_hash: str, role: str = "student") -> dict:
    """Create a User document."""
    return {
        "name": name,
        "email": email,
        "password_hash": password_hash,
        "role": role,  # "admin" or "student"
        "biometric_profile_registered": False,
        "created_at": datetime.now(timezone.utc),
    }


def exam_schema(title: str, description: str, subject: str, duration_minutes: int, questions: list, created_by: str, start_time: datetime = None, end_time: datetime = None, allowed_students: list = None) -> dict:
    """Create an Exam document.

    questions should be a list of dicts:
    [
        {
            "id": "q1",
            "text": "What is O(log n)?",
            "options": ["Binary Search", "Linear Search", "Bubble Sort", "Insertion Sort"],
            "type": "mcq",
            "correct_answer": "Binary Search"
        },
        ...
    ]
    """
    return {
        "title": title,
        "description": description,
        "subject": subject,
        "duration_minutes": duration_minutes,
        "questions": questions,
        "created_by": created_by,
        "start_time": start_time.isoformat() if start_time else None,
        "end_time": end_time.isoformat() if end_time else None,
        "allowed_students": allowed_students or [],
        "created_at": datetime.now(timezone.utc),
        "status": "upcoming", # active, upcoming, completed
    }


def submission_schema(student_id: str, exam_id: str, answers_json: dict, final_score: float) -> dict:
    """Create a Submission document."""
    return {
        "student_id": student_id,
        "exam_id": exam_id,
        "answers_json": answers_json,
        "final_score": final_score,
        "submitted_at": datetime.now(timezone.utc),
    }


def exam_session_schema(student_id: str, exam_id: str) -> dict:
    """Create an ExamSession document."""
    return {
        "student_id": student_id,
        "exam_id": exam_id,
        "start_time": datetime.now(timezone.utc),
        "end_time": None,
        "status": "active",  # "active" or "completed"
        "answers": {},
        "integrity_score": 100.0,
    }


def violation_log_schema(session_id: str, violation_type: str) -> dict:
    """Create a ViolationLog document.

    violation_type examples:
        'tab_switch', 'multiple_faces', 'face_not_visible',
        'mobile_detected', 'noise_detected', 'looking_away'
    """
    return {
        "session_id": session_id,
        "violation_type": violation_type,
        "timestamp": datetime.now(timezone.utc),
    }
