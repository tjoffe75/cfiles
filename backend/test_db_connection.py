"""
Simple script to test database connectivity using SQLAlchemy SessionLocal
"""
import os
import sys
sys.path.insert(0, '/app')

# Ensure env vars are loaded; if you're using dotenv locally, uncomment below:
# from dotenv import load_dotenv
# load_dotenv()

from sqlalchemy import text
from backend.database.database import SessionLocal


def test_db_connection():
    try:
        db = SessionLocal()
        # simple test query
        result = db.execute(text("SELECT 1")).scalar()
        if result == 1:
            print("✅ Database connection successful!")
            return 0
        else:
            print(f"⚠️ Unexpected result: {result}")
            return 1
    except Exception as e:
        print("❌ Database connection failed:", e)
        return 1
    finally:
        try:
            db.close()
        except:
            pass


if __name__ == "__main__":
    code = test_db_connection()
    sys.exit(code)
