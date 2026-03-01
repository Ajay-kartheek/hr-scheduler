"""
HR Scheduler — Google Integration Router
OAuth2 auth flow + Gmail poll + Calendar event endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import logging

logger = logging.getLogger("hr_scheduler")
router = APIRouter(prefix="/api/google", tags=["Google Integration"])


@router.get("/auth/status")
def auth_status():
    """Check OAuth2 authentication status for Gmail and Calendar."""
    from services.gmail_service import is_authenticated as gmail_auth
    from services.calendar_service import is_authenticated as cal_auth

    return {
        "gmail": gmail_auth(),
        "calendar": cal_auth(),
    }


@router.post("/auth/gmail")
def auth_gmail():
    """
    Trigger Gmail OAuth2 flow.
    Opens browser for user consent — run this ONCE from the machine.
    """
    try:
        from services.gmail_service import get_gmail_credentials
        creds = get_gmail_credentials()
        return {"status": "authenticated", "email": "kalaiarasan6923@gmail.com"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gmail auth failed: {str(e)}")


@router.post("/auth/calendar")
def auth_calendar():
    """
    Trigger Calendar OAuth2 flow.
    Opens browser for user consent — run this ONCE from the machine.
    """
    try:
        from services.calendar_service import get_calendar_credentials
        creds = get_calendar_credentials()
        return {"status": "authenticated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calendar auth failed: {str(e)}")


@router.post("/gmail/poll")
def poll_gmail_now(db: Session = Depends(get_db)):
    """Manually trigger a Gmail inbox poll right now."""
    from services.gmail_service import is_authenticated, process_inbox

    if not is_authenticated():
        raise HTTPException(status_code=401, detail="Gmail not authenticated. Call /api/google/auth/gmail first.")

    count = process_inbox()
    return {"processed": count, "message": f"Processed {count} emails"}


@router.post("/calendar/create-day1/{employee_id}")
def create_day1_calendar(employee_id: str, db: Session = Depends(get_db)):
    """Create Day 1 calendar events for an employee."""
    from models import Employee
    from services.calendar_service import is_authenticated, create_day1_events

    if not is_authenticated():
        raise HTTPException(status_code=401, detail="Calendar not authenticated. Call /api/google/auth/calendar first.")

    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    events = create_day1_events(emp, db=db)
    db.commit()
    return {"events": events, "count": len(events)}
