"""
Onboarding planner — generates a 1-week plan using AI, emails it, and creates calendar events.
"""

import logging
from services.ai_service import generate_onboarding_plan
from services.email_service import send_onboarding_plan_email

logger = logging.getLogger("hr_scheduler_v2")


def generate_and_send_plan(new_hire, session, custom_notes: str = None, db=None) -> str:
    """
    Generate personalized onboarding plan, email it, and create calendar events.
    Returns the plan text.
    """
    first_name = new_hire.first_name or "New Hire"
    designation = new_hire.designation or ""
    department = new_hire.department.name if new_hire.department else ""
    doj = str(new_hire.doj) if new_hire.doj else ""
    manager_name = new_hire.manager.name if new_hire.manager else ""
    role_name = session.role.name if session.role else designation

    # Generate plan
    plan = generate_onboarding_plan(
        first_name=first_name,
        designation=designation,
        department=department,
        doj=doj,
        manager_name=manager_name,
        role_name=role_name,
        custom_notes=custom_notes or "",
    )

    logger.info(f"Onboarding plan generated for {first_name}")

    # Send plan via email
    try:
        send_onboarding_plan_email(new_hire, plan, db=db)
        logger.info(f"Onboarding plan emailed to {new_hire.personal_email}")
    except Exception as e:
        logger.error(f"Failed to email onboarding plan: {e}")

    # Create first-week calendar events with invites
    try:
        from services.calendar_service import create_first_week_events
        events = create_first_week_events(new_hire, db=db)
        logger.info(f"Created {len(events)} calendar events for {first_name}")
    except Exception as e:
        logger.error(f"Calendar event creation failed: {e}")

    return plan
