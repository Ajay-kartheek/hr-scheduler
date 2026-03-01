"""
HR Scheduler Platform — Main Application Entry Point
FastAPI app with all routers, CORS, and startup events.
"""

# Load .env file FIRST, before any other imports read env vars
from dotenv import load_dotenv
load_dotenv()

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import init_db
from routers import employees, workflows, dashboard, ai_services, notifications, org_chart, portal

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)-20s | %(levelname)-7s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("hr_scheduler")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    logger.info("🚀 Starting HR Scheduler Platform...")
    init_db()

    # Run seed data
    from seed_data import seed_all
    seed_all()

    # Create uploads directory
    os.makedirs("uploads", exist_ok=True)
    os.makedirs("uploads/photos", exist_ok=True)
    os.makedirs("uploads/documents", exist_ok=True)

    logger.info("✅ HR Scheduler Platform is ready!")

    # Start scheduled email engine
    from services.scheduler_service import start_scheduler
    start_scheduler()

    yield

    # Shutdown
    from services.scheduler_service import scheduler
    scheduler.shutdown(wait=False)
    logger.info("🛑 Shutting down HR Scheduler Platform...")


app = FastAPI(
    title="HR Scheduler Platform",
    description="AI-powered HR onboarding and pre-boarding automation platform for Shellkode Technologies.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
if os.path.exists("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Register all routers
app.include_router(employees.router)
app.include_router(workflows.router)
app.include_router(dashboard.router)
app.include_router(ai_services.router)
app.include_router(notifications.router)
app.include_router(org_chart.router)
app.include_router(portal.router)

from routers import analytics
app.include_router(analytics.router)

from routers import checkins
app.include_router(checkins.router)

from routers import google_integration
app.include_router(google_integration.router)

# Serve uploaded files (postcards, photos, documents)
from fastapi.staticfiles import StaticFiles
os.makedirs("uploads/postcards", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
def root():
    """Health check."""
    return {
        "name": "HR Scheduler Platform",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/health")
def health_check():
    """API health check endpoint."""
    from database import SessionLocal
    try:
        db = SessionLocal()
        db.execute("SELECT 1" if hasattr(db, 'execute') else None)
        db.close()
        db_status = "connected"
    except Exception:
        db_status = "error"

    return {
        "status": "healthy",
        "database": db_status,
        "ai_mode": "mock" if os.getenv("AI_MOCK_MODE", "false").lower() == "true" else "bedrock",
    }
