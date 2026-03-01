"""
HR-Scheduler-V2 — Main Application
Clean FastAPI server with all routers mounted.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from db.database import init_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)-24s | %(levelname)-7s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("hr_scheduler_v2")
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown events."""
    logger.info("🚀 HR-Scheduler-V2 starting up...")
    init_db()
    logger.info("✅ Database tables ready")
    yield
    logger.info("🛑 HR-Scheduler-V2 shutting down...")


app = FastAPI(
    title="HR-Scheduler-V2",
    description="Shellkode HR Onboarding Platform — Backend API",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
from routers.reference import router as reference_router
from routers.dashboard import router as dashboard_router
from routers.employees import router as employees_router
from routers.forms import router as forms_router
from routers.onboarding import router as onboarding_router
from routers.documents import router as documents_router

app.include_router(reference_router)
app.include_router(dashboard_router)
app.include_router(employees_router)
app.include_router(forms_router)
app.include_router(onboarding_router)
app.include_router(documents_router)


@app.get("/")
def root():
    return {
        "app": "HR-Scheduler-V2",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
