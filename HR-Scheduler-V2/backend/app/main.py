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
    import asyncio

    logger.info("HR-Scheduler-V2 starting up...")
    init_db()
    logger.info("Database tables ready")

    # Background email polling task
    async def poll_email_replies():
        """Poll Gmail for candidate replies every 60 seconds."""
        await asyncio.sleep(10)  # Wait for full startup
        while True:
            try:
                from db.database import SessionLocal
                from services.email_monitor import check_candidate_replies
                db = SessionLocal()
                try:
                    results = check_candidate_replies(db)
                    if results.get("new_replies", 0) > 0:
                        logger.info(f"[EMAIL-POLL] Found {results['new_replies']} new replies")
                finally:
                    db.close()
            except Exception as e:
                logger.error(f"[EMAIL-POLL] Error: {e}")
            await asyncio.sleep(60)  # Poll every 60 seconds

    # Background follow-up scheduler
    async def check_followups():
        """Check for candidates needing follow-up emails every 30 minutes."""
        await asyncio.sleep(30)  # Wait for full startup
        while True:
            try:
                from db.database import SessionLocal
                from services.followup_service import check_and_send_followups
                db = SessionLocal()
                try:
                    results = check_and_send_followups(db)
                    sent = results.get("followups_sent", 0)
                    flagged = results.get("flagged", 0)
                    if sent > 0 or flagged > 0:
                        logger.info(f"[FOLLOWUP-SCHED] Sent {sent} follow-ups, flagged {flagged}")
                finally:
                    db.close()
            except Exception as e:
                logger.error(f"[FOLLOWUP-SCHED] Error: {e}")
            await asyncio.sleep(1800)  # Every 30 minutes

    poll_task = asyncio.create_task(poll_email_replies())
    followup_task = asyncio.create_task(check_followups())

    yield

    poll_task.cancel()
    followup_task.cancel()
    logger.info("HR-Scheduler-V2 shutting down...")


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
from routers.candidates import router as candidates_router
from routers.portal import router as portal_router
from routers.agent_dashboard import router as agent_router

app.include_router(reference_router)
app.include_router(dashboard_router)
app.include_router(employees_router)
app.include_router(forms_router)
app.include_router(onboarding_router)
app.include_router(documents_router)
app.include_router(candidates_router)
app.include_router(portal_router)
app.include_router(agent_router)


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
