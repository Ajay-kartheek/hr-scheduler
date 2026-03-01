"""
Clean all employee/transactional data from the RDS database.
Keeps: departments, training modules, quiz questions, app config.
Removes: employees + everything related (workflows, emails, AI content, check-ins, etc.)
"""

from dotenv import load_dotenv
load_dotenv()

from database import SessionLocal
from sqlalchemy import text


def clean_all():
    db = SessionLocal()
    try:
        print("🧹 Cleaning employee data from RDS...")

        # TRUNCATE CASCADE handles all foreign key constraints at once
        db.execute(text("TRUNCATE TABLE employees CASCADE"))
        db.commit()

        # Verify
        tables = ["employees", "workflow_instances", "workflow_steps",
                   "ai_contents", "email_logs", "check_ins", "audit_logs",
                   "notifications", "laptop_requests", "documents"]
        for t in tables:
            try:
                r = db.execute(text(f"SELECT count(*) FROM {t}"))
                count = r.scalar()
                print(f"   {'✓' if count == 0 else '✗'} {t}: {count} rows")
            except Exception:
                print(f"   - {t}: table not found (OK)")

        # Show preserved data
        r = db.execute(text("SELECT count(*) FROM departments"))
        print(f"\n   Departments (kept): {r.scalar()}")
        r = db.execute(text("SELECT count(*) FROM training_modules"))
        print(f"   Training modules (kept): {r.scalar()}")

        print("\n✅ Database cleaned! Ready for fresh testing.")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    clean_all()
