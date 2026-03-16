"""
AI-Powered Remote Proctoring System — Flask Backend
====================================================

Run:
    pip install flask flask-cors flask-jwt-extended pymongo werkzeug
    python app.py

Server:
    http://localhost:5000
"""

import sys
import os

# Ensure backend dir is in path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from pymongo import MongoClient
from config import Config

# Blueprints
from routes.auth_routes import auth_bp
from routes.admin_routes import admin_bp
from routes.student_routes import student_bp
from routes.exam_routes import exam_bp
from routes.monitoring_routes import monitoring_bp


# ... (imports remain same)

def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(
    app,
    resources={r"/*": {"origins": [
        "https://proctofull-stack-62hlcz6kd-susshmits-projects.vercel.app"
    ]}},
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
)

    # Use environment variables first, fallback to Config (Local)
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", Config.JWT_SECRET_KEY)
    JWTManager(app)

    # DATABASE CONNECTION
    db_uri = os.environ.get("MONGO_URI", Config.MONGO_URI)
    mongo_client = MongoClient(db_uri, tlsAllowInvalidCertificates=True)
    app.config["MONGO_DB"] = mongo_client[Config.MONGO_DB_NAME]

    # Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(exam_bp)
    app.register_blueprint(monitoring_bp)

    # MANDATORY FOR RENDER: Health Check
    @app.route("/", methods=["GET"])
    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({"status": "healthy", "service": "ProctorGuard-AI"}), 200

    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", 5000))
    
    print("\n" + "="*30)
    print("🚀 PROCTORGUARD AI BACKEND")
    print(f"📡 Status: LIVE on Port {port}")
    print("="*30 + "\n")
    
    # NO DEBUG=TRUE IN PRODUCTION
    app.run(host="0.0.0.0", port=port)