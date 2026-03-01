"""
HR Scheduler — Scheduled Email Engine
Uses APScheduler to send timed emails:
- 2 days before DOJ: Joining details (where, whom, what)
- Day 1 morning: Induction plan
- Follow-up reminders (Day 1, 3, 5) for pending actions
"""

import os
import logging
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.memory import MemoryJobStore

logger = logging.getLogger("hr_scheduler")

scheduler = BackgroundScheduler(
    jobstores={"default": MemoryJobStore()},
    job_defaults={"coalesce": True, "max_instances": 1},
)

SCHEDULER_STARTED = False


def start_scheduler():
    """Start the scheduler if not already running."""
    global SCHEDULER_STARTED
    if not SCHEDULER_STARTED:
        scheduler.start()
        SCHEDULER_STARTED = True
        logger.info("📅 Scheduler started")

        # Run the check every hour
        scheduler.add_job(
            check_and_send_scheduled_emails,
            "interval", hours=1,
            id="check_scheduled_emails",
            replace_existing=True,
        )
        # Also run immediately on startup
        scheduler.add_job(
            check_and_send_scheduled_emails,
            "date", run_date=datetime.utcnow() + timedelta(seconds=10),
            id="initial_check",
        )

        # ──── REAL GMAIL: Poll inbox every 2 minutes ────
        scheduler.add_job(
            _poll_gmail_inbox,
            "interval", minutes=2,
            id="gmail_inbox_poll",
            replace_existing=True,
        )
        logger.info("📬 Gmail inbox polling scheduled (every 2 min)")


def _poll_gmail_inbox():
    """Poll Gmail inbox for new emails and auto-process them."""
    try:
        from services.gmail_service import is_authenticated, process_inbox
        if not is_authenticated():
            return  # Skip if not authenticated yet
        count = process_inbox()
        if count > 0:
            logger.info(f"📬 Gmail: Processed {count} new emails")
    except Exception as e:
        logger.error(f"📬 Gmail polling error: {e}")


def check_and_send_scheduled_emails():
    """
    Check all employees and send scheduled emails as needed.
    Called periodically by the scheduler.
    """
    from database import SessionLocal
    from models import Employee, EmployeeStage

    db = SessionLocal()
    try:
        today = datetime.utcnow().date()

        # 1. DOJ - 2 days: Send joining details
        doj_target = today + timedelta(days=2)
        employees_doj2 = db.query(Employee).filter(
            Employee.doj == doj_target,
            Employee.current_stage.in_([EmployeeStage.PRE_BOARDING, EmployeeStage.READY_TO_JOIN]),
        ).all()

        for emp in employees_doj2:
            _send_joining_details(emp, db)

        # 2. DOJ = today: Send Day 1 induction plan
        employees_day1 = db.query(Employee).filter(
            Employee.doj == today,
            Employee.current_stage.in_([EmployeeStage.READY_TO_JOIN, EmployeeStage.DAY_ONE]),
        ).all()

        for emp in employees_day1:
            _send_induction_plan(emp, db)

        # 3. Follow-up reminders for pending workflow steps
        _send_followup_reminders(db)

        logger.info(f"📅 Scheduled check complete: {len(employees_doj2)} DOJ-2, {len(employees_day1)} Day 1")

    except Exception as e:
        logger.error(f"Scheduler check failed: {e}")
    finally:
        db.close()


def _send_joining_details(emp, db):
    """Send joining details email 2 days before DOJ."""
    from services.email_service import send_email

    already_sent = _check_email_sent(emp.id, "joining_details", db)
    if already_sent:
        return

    doj_formatted = emp.doj.strftime("%A, %d %B %Y") if emp.doj else "your joining date"

    subject = f"Joining Details — {doj_formatted} | Shellkode Technologies"
    body_html = f"""
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4338ca, #6366f1); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">Your First Day is Almost Here!</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 15px; color: #374151;">Hi {emp.first_name or 'there'},</p>
            <p style="font-size: 14px; color: #6b7280; line-height: 1.7;">
                We're looking forward to welcoming you on <strong>{doj_formatted}</strong>!
                Here are the details for your first day:
            </p>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="font-size: 14px; color: #111827; margin: 0 0 12px;">📍 Where to Report</h3>
                <p style="font-size: 13px; color: #6b7280; margin: 0;">
                    Shellkode Technologies Office<br>
                    Ground Floor Reception<br>
                    <em>Please arrive by 9:00 AM</em>
                </p>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="font-size: 14px; color: #111827; margin: 0 0 12px;">👤 Whom to Meet</h3>
                <p style="font-size: 13px; color: #6b7280; margin: 0;">
                    Ask for <strong>HR Team</strong> at the reception.<br>
                    They will guide you through badge collection and the induction process.
                </p>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="font-size: 14px; color: #111827; margin: 0 0 12px;">📋 What to Bring</h3>
                <ul style="font-size: 13px; color: #6b7280; margin: 0; padding-left: 16px;">
                    <li>Government-issued photo ID (Aadhaar/Passport/DL)</li>
                    <li>Original education certificates</li>
                    <li>Previous employment relieving letters</li>
                    <li>2 passport-size photographs</li>
                    <li>Cancelled cheque or bank passbook (for payroll)</li>
                </ul>
            </div>

            <p style="font-size: 14px; color: #6b7280; line-height: 1.7;">
                If you have any questions, feel free to reach out to
                <a href="mailto:hr@shellkode.com" style="color: #4f46e5;">hr@shellkode.com</a>.
            </p>

            <p style="font-size: 14px; color: #374151; margin-top: 20px;">
                See you soon! 🎉<br>
                <strong>HR Team, Shellkode Technologies</strong>
            </p>
        </div>
    </div>
    """

    result = send_email(
        to_email=emp.personal_email,
        subject=subject,
        body_html=body_html,
        body_text=f"Hi {emp.first_name}, your first day is on {doj_formatted}. Please arrive by 9 AM at the Shellkode office.",
        employee_id=emp.id,
        db=db,
    )
    logger.info(f"📅 Joining details email sent to {emp.personal_email}: {result['status']}")


def _send_induction_plan(emp, db):
    """Send Day 1 induction plan email."""
    from services.email_service import send_email

    already_sent = _check_email_sent(emp.id, "induction_plan", db)
    if already_sent:
        return

    subject = "Day 1 Induction Plan | Shellkode Technologies"
    body_html = f"""
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0d9488, #14b8a6); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">Welcome to Day 1! 🎉</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 15px; color: #374151;">Hi {emp.first_name or 'there'},</p>
            <p style="font-size: 14px; color: #6b7280;">Here's your schedule for today:</p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background: #f0fdfa; border-bottom: 1px solid #ccfbf1;">
                    <td style="padding: 10px 14px; font-weight: 700; color: #0d9488; width: 90px;">9:00 AM</td>
                    <td style="padding: 10px 14px;">
                        <strong>Welcome & Badge Collection</strong><br>
                        <span style="font-size: 12px; color: #6b7280;">Reception, Ground Floor</span>
                    </td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 10px 14px; font-weight: 700; color: #0d9488;">10:00 AM</td>
                    <td style="padding: 10px 14px;">
                        <strong>HR Induction Session</strong><br>
                        <span style="font-size: 12px; color: #6b7280;">Company overview, policies, benefits</span>
                    </td>
                </tr>
                <tr style="background: #f0fdfa; border-bottom: 1px solid #ccfbf1;">
                    <td style="padding: 10px 14px; font-weight: 700; color: #0d9488;">11:30 AM</td>
                    <td style="padding: 10px 14px;">
                        <strong>Manager 1:1</strong><br>
                        <span style="font-size: 12px; color: #6b7280;">Team goals, expectations, 30-day plan</span>
                    </td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 10px 14px; font-weight: 700; color: #0d9488;">12:30 PM</td>
                    <td style="padding: 10px 14px;">
                        <strong>Lunch with Buddy</strong><br>
                        <span style="font-size: 12px; color: #6b7280;">Office tour and lunch</span>
                    </td>
                </tr>
                <tr style="background: #f0fdfa; border-bottom: 1px solid #ccfbf1;">
                    <td style="padding: 10px 14px; font-weight: 700; color: #0d9488;">2:00 PM</td>
                    <td style="padding: 10px 14px;">
                        <strong>IT Setup & Tools</strong><br>
                        <span style="font-size: 12px; color: #6b7280;">Laptop, VPN, email, dev tools, security</span>
                    </td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 10px 14px; font-weight: 700; color: #0d9488;">3:30 PM</td>
                    <td style="padding: 10px 14px;">
                        <strong>Team Introduction</strong><br>
                        <span style="font-size: 12px; color: #6b7280;">Meet the team, intro round</span>
                    </td>
                </tr>
                <tr style="background: #f0fdfa;">
                    <td style="padding: 10px 14px; font-weight: 700; color: #0d9488;">4:30 PM</td>
                    <td style="padding: 10px 14px;">
                        <strong>Day 1 Wrap-up</strong><br>
                        <span style="font-size: 12px; color: #6b7280;">HR check-in, Q&A, Day 2 plan</span>
                    </td>
                </tr>
            </table>

            {f'<p style="font-size: 14px; color: #6b7280;">Your company email is: <strong>{emp.company_email}</strong></p>' if emp.company_email else ''}

            <p style="font-size: 14px; color: #374151; margin-top: 20px;">
                Welcome aboard! 🚀<br>
                <strong>HR Team, Shellkode Technologies</strong>
            </p>
        </div>
    </div>
    """

    result = send_email(
        to_email=emp.personal_email,
        subject=subject,
        body_html=body_html,
        body_text=f"Welcome to Day 1, {emp.first_name}! Check-in at 9 AM at reception.",
        employee_id=emp.id,
        db=db,
    )
    logger.info(f"📅 Induction plan email sent to {emp.personal_email}: {result['status']}")


def _send_followup_reminders(db):
    """Send follow-up reminders for pending workflow steps — real emails + in-app."""
    from models import WorkflowStep, WorkflowInstance, Employee, StepStatus
    from services.email_service import send_step_followup_email, ADMIN_EMAIL, SENDER_EMAIL

    # Find steps that have been pending/waiting for 1, 3, or 5 days
    now = datetime.utcnow()
    pending_steps = db.query(WorkflowStep).filter(
        WorkflowStep.status.in_([StepStatus.PENDING, StepStatus.IN_PROGRESS, StepStatus.HITL, StepStatus.WAITING_REPLY]),
    ).all()

    for step in pending_steps:
        if not step.started_at:
            continue

        days_pending = (now - step.started_at).days
        if days_pending not in [1, 3, 5]:
            continue

        # Get the workflow and employee
        workflow = db.query(WorkflowInstance).filter(
            WorkflowInstance.id == step.workflow_instance_id
        ).first()
        if not workflow:
            continue

        emp = db.query(Employee).filter(Employee.id == workflow.employee_id).first()
        if not emp:
            continue

        # Route follow-up to the correct email based on who owns the step
        admin_steps = {"laptop_approval", "id_card_generation", "access_card", "create_email"}
        employee_steps = {"form_submission"}

        if step.step_key in admin_steps:
            followup_email = ADMIN_EMAIL
        elif step.step_key in employee_steps:
            followup_email = emp.personal_email
        else:
            followup_email = SENDER_EMAIL  # HR

        urgency = "gentle" if days_pending == 1 else "follow-up" if days_pending == 3 else "escalation"
        logger.info(f"📅 Sending {urgency} reminder for step '{step.step_name}' → {followup_email}")

        # Send real follow-up email via Gmail
        try:
            send_step_followup_email(emp, step.step_name, days_pending, to_email=followup_email, db=db)
            logger.info(f"📧 Follow-up email sent for '{step.step_name}' → {followup_email}")
        except Exception as e:
            logger.error(f"Follow-up email failed: {e}")

        # Also add in-app notification
        from models import Notification, NotificationType
        notification = Notification(
            title=f"{'⚠️ Escalation' if days_pending == 5 else '🔔 Reminder'}: {step.step_name}",
            message=f"{step.step_name} has been pending for {days_pending} day(s) for {emp.first_name} {emp.last_name or ''}. {'Please escalate to management.' if days_pending == 5 else 'Please take action.'}",
            notification_type=NotificationType.WARNING if days_pending >= 3 else NotificationType.INFO,
            recipient_email=followup_email,
            employee_id=emp.id,
        )
        db.add(notification)

    db.commit()


def _check_email_sent(employee_id: str, email_type: str, db) -> bool:
    """Check if a specific type of scheduled email was already sent."""
    from models import EmailLog
    existing = db.query(EmailLog).filter(
        EmailLog.employee_id == employee_id,
        EmailLog.subject.contains(
            "Joining Details" if email_type == "joining_details"
            else "Induction Plan"
        ),
        EmailLog.direction == "outbound",
    ).first()
    return existing is not None
