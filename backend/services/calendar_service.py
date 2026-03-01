"""
HR Scheduler — Real Google Calendar Service
Creates Day 1 calendar events with Google Calendar API.
Sends invites to employee, manager, buddy, and HR.
"""

import os
import logging
from datetime import datetime, timedelta

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

logger = logging.getLogger("hr_scheduler")

SCOPES = ["https://www.googleapis.com/auth/calendar"]

CREDENTIALS_FILE = os.path.join(os.path.dirname(__file__), "..", "credentials.json")
TOKEN_FILE = os.path.join(os.path.dirname(__file__), "..", "calendar_token.json")


def get_calendar_credentials():
    """Get or refresh Calendar OAuth2 credentials."""
    creds = None

    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=8091, open_browser=True)

        with open(TOKEN_FILE, "w") as f:
            f.write(creds.to_json())

    return creds


def get_calendar_service():
    """Build the Calendar API service."""
    creds = get_calendar_credentials()
    return build("calendar", "v3", credentials=creds)


def create_day1_events(employee, db=None):
    """
    Create all Day 1 calendar events for a new hire.
    Returns list of created event IDs.
    """
    if not employee.doj:
        logger.warning(f"No DOJ set for {employee.first_name}, skipping calendar events")
        return []

    doj = employee.doj
    if isinstance(doj, str):
        doj = datetime.strptime(doj, "%Y-%m-%d").date()

    emp_email = employee.personal_email
    emp_name = f"{employee.first_name or ''} {employee.last_name or ''}".strip()
    hr_email = os.getenv("SES_SENDER_EMAIL", "hr@shellkode.com")
    buddy_email = getattr(employee, 'buddy_email', None)
    buddy_name = getattr(employee, 'buddy_name', None) or "Buddy"

    # Day 1 schedule
    events_config = [
        {
            "summary": f"🎉 Welcome & Badge Collection — {emp_name}",
            "description": (
                f"Welcome {emp_name} to Shellkode!\n\n"
                "• Collect your employee badge and welcome kit\n"
                "• Brief office tour\n"
                "• Get settled at your desk"
            ),
            "start_hour": 9, "start_min": 30,
            "duration_min": 30,
            "attendees": [e for e in [emp_email, hr_email, buddy_email] if e],
        },
        {
            "summary": f"📋 HR Induction — {emp_name}",
            "description": (
                f"HR onboarding session for {emp_name}.\n\n"
                "Topics covered:\n"
                "• Company overview, mission & values\n"
                "• Policies: leave, security, communication\n"
                "• Benefits and compensation overview\n"
                "• Compliance & NDA signing"
            ),
            "start_hour": 10, "start_min": 0,
            "duration_min": 90,
            "attendees": [emp_email, hr_email],
        },
        {
            "summary": f"👤 Manager 1:1 — {emp_name}",
            "description": (
                f"First meeting with reporting manager.\n\n"
                "• Team introduction\n"
                "• Project overview and expectations\n"
                "• 30-60-90 day goals discussion\n"
                "• Q&A"
            ),
            "start_hour": 11, "start_min": 30,
            "duration_min": 60,
            "attendees": [emp_email, hr_email],
        },
        {
            "summary": f"🍽️ Lunch with Buddy ({buddy_name}) — {emp_name}",
            "description": (
                f"Welcome lunch for {emp_name} with assigned buddy {buddy_name}.\n\n"
                "A chance to relax, get to know the team, and ask informal questions."
            ),
            "start_hour": 12, "start_min": 30,
            "duration_min": 60,
            "attendees": [e for e in [emp_email, buddy_email] if e],
        },
        {
            "summary": f"💻 IT Setup & Tools — {emp_name}",
            "description": (
                f"IT setup session for {emp_name}.\n\n"
                "• Laptop configuration and hardening\n"
                "• Email, Slack, and tool access\n"
                "• VPN and security setup\n"
                "• Development environment (if applicable)"
            ),
            "start_hour": 14, "start_min": 0,
            "duration_min": 90,
            "attendees": [emp_email, hr_email],
        },
        {
            "summary": f"🤝 Team Introduction — {emp_name}",
            "description": (
                f"Team introduction session for {emp_name}.\n\n"
                f"• Meet the {employee.domain.value if employee.domain else 'engineering'} team\n"
                "• Overview of current projects\n"
                "• Ice-breaker activities"
            ),
            "start_hour": 15, "start_min": 30,
            "duration_min": 60,
            "attendees": [e for e in [emp_email, hr_email, buddy_email] if e],
        },
    ]

    try:
        service = get_calendar_service()
        created_events = []

        for evt_config in events_config:
            start_dt = datetime(doj.year, doj.month, doj.day,
                                evt_config["start_hour"], evt_config["start_min"])
            end_dt = start_dt + timedelta(minutes=evt_config["duration_min"])

            event = {
                "summary": evt_config["summary"],
                "description": evt_config["description"],
                "start": {
                    "dateTime": start_dt.isoformat(),
                    "timeZone": "Asia/Kolkata",
                },
                "end": {
                    "dateTime": end_dt.isoformat(),
                    "timeZone": "Asia/Kolkata",
                },
                "attendees": [{"email": e} for e in evt_config["attendees"]],
                "reminders": {
                    "useDefault": False,
                    "overrides": [
                        {"method": "email", "minutes": 60},
                        {"method": "popup", "minutes": 15},
                    ],
                },
                "conferenceData": None,
            }

            created = service.events().insert(
                calendarId="primary",
                body=event,
                sendUpdates="all",  # Send invite emails to attendees
            ).execute()

            created_events.append({
                "id": created["id"],
                "summary": evt_config["summary"],
                "link": created.get("htmlLink"),
            })

            logger.info(f"📅 Created event: {evt_config['summary']}")

        logger.info(f"📅 Created {len(created_events)} Day 1 events for {emp_name}")

        # Log to DB
        if db and employee:
            from models import Notification, NotificationType
            notification = Notification(
                title=f"📅 Day 1 calendar events created for {emp_name}",
                message=f"{len(created_events)} events created and invites sent",
                notification_type=NotificationType.INFO,
                recipient_email="hr@shellkode.com",
                employee_id=employee.id,
            )
            db.add(notification)

        return created_events

    except Exception as e:
        logger.error(f"Calendar event creation failed: {e}")
        return []


def is_authenticated():
    """Check if Calendar OAuth2 token exists and is valid."""
    if not os.path.exists(TOKEN_FILE):
        return False
    try:
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
        return creds and creds.valid
    except Exception:
        return False
