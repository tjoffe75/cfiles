"""
Simple script to test database connectivity using SQLAlchemy SessionLocal
"""
import sys
from sqlalchemy import text
from database.database import SessionLocal

def test_db_connection():
    db = None  # Ensure db is defined in the outer scope
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
        print(f"❌ Database connection failed: {e}")
        return 1
    finally:
        if db:
            db.close()

if __name__ == "__main__":
    sys.exit(test_db_connection())
