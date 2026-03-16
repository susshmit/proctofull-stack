import os

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "super-secret-key-change-in-production")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt-secret-key-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour
    
    # INDENTED & SECURE:
    # We try to get the URI from the environment (Render), otherwise use your string
    MONGO_URI = os.environ.get("MONGO_URI", "mongodb+srv://susshmit748_db_user:Sushmit123@cluster0.barn4pr.mongodb.net/proctoring_db?retryWrites=true&w=majority&appName=Cluster0")    
    
    MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME", "proctoring_db")
    
    # For the demo, keeping CORS wide or flexible is fine
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",") 
    
    ADMIN_REGISTRATION_KEY = os.environ.get("ADMIN_REGISTRATION_KEY", "UNI-PROCTOR-2026")