from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from bson import ObjectId

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "student")
    adminKey = data.get("adminKey")

    if not all([name, email, password]):
        return jsonify({"error": "name, email, and password are required"}), 400

    if role not in ("student", "admin"):
        return jsonify({"error": "role must be 'student' or 'admin'"}), 400

    if role == "admin":
        if adminKey != current_app.config.get("ADMIN_REGISTRATION_KEY"):
            return jsonify({"error": "Invalid admin registration key"}), 403

    db = current_app.config["MONGO_DB"]

    existing = db.users.find_one({"email": email})
    if existing:
        return jsonify({"error": "A user with this email already exists"}), 409

    from models import user_schema

    user_doc = user_schema(
        name=name,
        email=email,
        password_hash=generate_password_hash(password),
        role=role,
    )
    result = db.users.insert_one(user_doc)

    access_token = create_access_token(
        identity=str(result.inserted_id),
        additional_claims={"role": role, "name": name},
    )

    return jsonify({
        "message": "User registered successfully",
        "access_token": access_token,
        "user": {
            "id": str(result.inserted_id),
            "name": name,
            "email": email,
            "role": role,
        },
    }), 201


@auth_bp.route("/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    email = data.get("email")
    password = data.get("password")

    if not all([email, password]):
        return jsonify({"error": "email and password are required"}), 400

    db = current_app.config["MONGO_DB"]

    user = db.users.find_one({"email": email})
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    if not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid email or password"}), 401

    access_token = create_access_token(
        identity=str(user["_id"]),
        additional_claims={"role": user["role"], "name": user["name"]},
    )

    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
        },
    }), 200
