"""
HR-Scheduler-V2 — Database (PostgreSQL only)
No SQLite. Directly targets RDS.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.database_url,
    echo=False,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI dependency — yields a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables from models."""
    from db.base import Base
    import models  # noqa — registers all models
    Base.metadata.create_all(bind=engine)


def drop_all_tables():
    """Drop ALL tables (including V1 leftovers) — use for reset only."""
    from sqlalchemy import text
    with engine.connect() as conn:
        # Drop all tables in public schema with CASCADE
        conn.execute(text("""
            DO $$ DECLARE
                r RECORD;
            BEGIN
                FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                    EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
                END LOOP;
            END $$;
        """))
        # Drop custom enum types
        conn.execute(text("DROP TYPE IF EXISTS hire_status CASCADE"))
        conn.commit()

