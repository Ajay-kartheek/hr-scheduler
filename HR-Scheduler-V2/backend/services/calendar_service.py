"""
HR-Scheduler-V2 — Google Calendar Service
Creates first-week onboarding events for new hires.
Sends calendar invites to employee personal email and HR.
"""

import os
import logging
from datetime import datetime, timedelta

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from app.config import get_settings

logger = logging.getLogger("hr_scheduler_v2")
settings = get_settings()

SCOPES = ["https://www.googleapis.com/auth/calendar"]


def _get_calendar_service():
    """Build the Calendar API service using shared credentials."""
    token_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "calendar_token.json",
    )
    creds_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        settings.gmail_credentials_file,
    )

    creds = None
    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            with open(token_path, "w") as f:
                f.write(creds.to_json())
        else:
            logger.warning("Calendar not authenticated. Run calendar auth flow first.")
            return None

    return build("calendar", "v3", credentials=creds, cache_discovery=False)


def create_first_week_events(new_hire, plan_tasks=None, db=None):
    """
    Create calendar events for the first week of onboarding.
    Each event is sent as an invite to the employee's personal email.
    Returns list of created events or empty list if Calendar is unavailable.
    """
    if not new_hire.doj:
        logger.warning(f"No DOJ set for {new_hire.first_name}, skipping calendar events")
        return []

    doj = new_hire.doj
    if isinstance(doj, str):
        doj = datetime.strptime(doj, "%Y-%m-%d").date()

    emp_email = new_hire.personal_email
    emp_name = f"{new_hire.first_name or ''} {new_hire.last_name or ''}".strip()
    hr_email = settings.sender_email

    # Default 5-day schedule if no AI-generated tasks
    default_schedule = [
        {
            "summary": f"Welcome and Badge Collection -- {emp_name}",
            "description": (
                f"Welcome {emp_name} to Shellkode Pvt Ltd.\n\n"
                "- Collect employee badge and welcome kit\n"
                "- Office tour\n"
                "- Get settled at your desk"
            ),
            "day": 0, "start_hour": 9, "start_min": 30, "duration_min": 30,
        },
        {
            "summary": f"HR Induction -- {emp_name}",
            "description": (
                f"HR onboarding session for {emp_name}.\n\n"
                "Topics covered:\n"
                "- Company overview, mission and values\n"
                "- Policies: leave, security, communication\n"
                "- Benefits and compensation overview\n"
                "- Compliance and NDA signing"
            ),
            "day": 0, "start_hour": 10, "start_min": 0, "duration_min": 90,
        },
        {
            "summary": f"Manager Introduction -- {emp_name}",
            "description": (
                f"First meeting with reporting manager.\n\n"
                "- Team introduction\n"
                "- Project overview and expectations\n"
                "- Goals discussion\n"
                "- Q and A"
            ),
            "day": 0, "start_hour": 11, "start_min": 30, "duration_min": 60,
        },
        {
            "summary": f"IT Setup and Access -- {emp_name}",
            "description": (
                f"IT setup session for {emp_name}.\n\n"
                "- Laptop configuration\n"
                "- Email, Slack, and tool access\n"
                "- VPN and security setup\n"
                "- Development environment setup"
            ),
            "day": 0, "start_hour": 14, "start_min": 0, "duration_min": 90,
        },
        {
            "summary": f"Team Introduction -- {emp_name}",
            "description": (
                f"Meet the team session for {emp_name}.\n\n"
                "- Meet team members\n"
                "- Overview of current projects\n"
                "- Role overview"
            ),
            "day": 0, "start_hour": 16, "start_min": 0, "duration_min": 60,
        },
        {
            "summary": f"Product Deep Dive -- {emp_name}",
            "description": (
                "Product and service overview session.\n\n"
                "- Product architecture walkthrough\n"
                "- Technical stack overview\n"
                "- Demo of key features"
            ),
            "day": 1, "start_hour": 10, "start_min": 0, "duration_min": 90,
        },
        {
            "summary": f"Development Workflow Training -- {emp_name}",
            "description": (
                "Development process and tools training.\n\n"
                "- Git workflow and branching strategy\n"
                "- CI/CD pipeline overview\n"
                "- Code review process\n"
                "- Documentation standards"
            ),
            "day": 1, "start_hour": 14, "start_min": 0, "duration_min": 90,
        },
        {
            "summary": f"Codebase Walkthrough -- {emp_name}",
            "description": (
                "Guided tour of the main codebase.\n\n"
                "- Repository structure\n"
                "- Key modules and dependencies\n"
                "- Assigned starter ticket"
            ),
            "day": 2, "start_hour": 10, "start_min": 0, "duration_min": 120,
        },
        {
            "summary": f"Compliance Training -- {emp_name}",
            "description": (
                "Required compliance and security training.\n\n"
                "- Data protection and privacy policies\n"
                "- Security best practices\n"
                "- Acceptable use policy"
            ),
            "day": 3, "start_hour": 10, "start_min": 0, "duration_min": 60,
        },
        {
            "summary": f"End of Week 1 Review -- {emp_name}",
            "description": (
                f"Week 1 wrap-up with manager for {emp_name}.\n\n"
                "- Review of first week experience\n"
                "- Feedback and questions\n"
                "- Plan for Week 2"
            ),
            "day": 4, "start_hour": 15, "start_min": 0, "duration_min": 60,
        },
    ]

    schedule = default_schedule

    try:
        service = _get_calendar_service()
        if not service:
            logger.info(f"[CALENDAR-LOG] Calendar not authenticated -- logging events only")
            for evt in schedule:
                event_date = doj + timedelta(days=evt["day"])
                logger.info(f"[CALENDAR-LOG] {event_date} {evt['start_hour']:02d}:{evt['start_min']:02d} | {evt['summary']}")
            return [{"summary": e["summary"], "status": "logged"} for e in schedule]

        created_events = []
        for evt in schedule:
            event_date = doj + timedelta(days=evt["day"])
            start_dt = datetime(event_date.year, event_date.month, event_date.day,
                                evt["start_hour"], evt["start_min"])
            end_dt = start_dt + timedelta(minutes=evt["duration_min"])

            event = {
                "summary": evt["summary"],
                "description": evt["description"],
                "start": {"dateTime": start_dt.isoformat(), "timeZone": "Asia/Kolkata"},
                "end": {"dateTime": end_dt.isoformat(), "timeZone": "Asia/Kolkata"},
                "attendees": [{"email": emp_email}, {"email": hr_email}],
                "reminders": {
                    "useDefault": False,
                    "overrides": [
                        {"method": "email", "minutes": 60},
                        {"method": "popup", "minutes": 15},
                    ],
                },
            }

            created = service.events().insert(
                calendarId="primary",
                body=event,
                sendUpdates="all",
            ).execute()

            created_events.append({
                "id": created.get("id"),
                "summary": evt["summary"],
                "link": created.get("htmlLink"),
                "status": "created",
            })
            logger.info(f"Calendar event created: {evt['summary']}")

        logger.info(f"Created {len(created_events)} first-week events for {emp_name}")

        # Log to DB
        if db:
            try:
                from models import EmailLog
                log = EmailLog(
                    new_hire_id=new_hire.id,
                    to_email=emp_email,
                    subject=f"First Week Calendar Events ({len(created_events)} events)",
                    body_preview=", ".join(e["summary"] for e in created_events[:5]),
                    template_type="calendar",
                    status="sent",
                )
                db.add(log)
                db.commit()
            except Exception as e:
                logger.error(f"Failed to log calendar events: {e}")

        return created_events

    except Exception as e:
        logger.error(f"Calendar event creation failed: {e}")
        return [{"summary": evt["summary"], "status": "failed"} for evt in schedule]
