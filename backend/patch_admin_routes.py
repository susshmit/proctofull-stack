with open(r"c:\Users\SUSHMIT\Downloads\ProctorGuard-Final\backend\routes\admin_routes.py", "r", encoding="utf-8") as f:
    content = f.read()

delete_exam_code = """

# ✅ Delete Exam
@admin_bp.route("/exams/<exam_id>", methods=["DELETE"])
@admin_required
def delete_exam(exam_id: str):
    db = current_app.config["MONGO_DB"]
    try:
        result = db.exams.delete_one({"_id": ObjectId(exam_id)})
        if result.deleted_count == 0:
            return jsonify({"error": "Exam not found"}), 404
            
        # Optionally, delete associated sessions and submissions
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
    try:
        result = db.exams.update_one(
            {"_id": ObjectId(exam_id)},
            {"$pull": {"allowed_students": student_email}}
        )
        if result.matched_count == 0:
            return jsonify({"error": "Exam not found"}), 404
        if result.modified_count == 0:
            return jsonify({"message": "Student was not in the allowed list"}), 200
            
        return jsonify({"message": "Student removed successfully"}), 200
    except Exception:
        return jsonify({"error": "Invalid exam ID format"}), 400
"""

if "def delete_exam" not in content:
    content += delete_exam_code
    with open(r"c:\Users\SUSHMIT\Downloads\ProctorGuard-Final\backend\routes\admin_routes.py", "w", encoding="utf-8") as f:
        f.write(content)
    print("Added delete endpoints to admin routes.")
else:
    print("Delete endpoints already exist.")
