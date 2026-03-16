from pymongo import MongoClient
from config import Config
import werkzeug.security
import sys

def seed():
    print("Connecting to MongoDB Atlas...")
    try:
        client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=5000)
        # This line forces a connection check
        client.admin.command('ping')
        print("Pinged your deployment. You successfully connected to MongoDB!")

        db = client[Config.MONGO_DB_NAME]
        
        admin_user = {
            "email": "admin@university.edu",
            "password": werkzeug.security.generate_password_hash("admin123"),
            "role": "admin",
            "name": "Sushmit Admin"
        }

        # Check if user already exists
        if db.users.find_one({"email": "admin@university.edu"}):
            print("Admin user already exists in Atlas!")
        else:
            db.users.insert_one(admin_user)
            print("Success! Admin user created in the Cloud.")
            
    except Exception as e:
        print(f"FAILED to connect: {e}")

if __name__ == "__main__":
    seed()