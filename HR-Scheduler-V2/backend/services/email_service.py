"""
HR-Scheduler-V2 — Email Service (Gmail API)
Sends welcome emails and onboarding plans via Gmail.
"""

import os
import base64
import logging
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from jinja2 import Environment, FileSystemLoader
from app.config import get_settings

logger = logging.getLogger("hr_scheduler_v2")
settings = get_settings()

# Jinja2 templates
TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
jinja_env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))


def _get_gmail_service():
    """Get authenticated Gmail API service."""
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build

    token_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        settings.gmail_token_file,
    )
    creds_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        settings.gmail_credentials_file,
    )

    SCOPES = [
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.modify",
    ]
    creds = None

    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            with open(token_path, "w") as f:
                f.write(creds.to_json())
        else:
            logger.warning("Gmail not authenticated. Run auth flow first.")
            return None

    return build("gmail", "v1", credentials=creds, cache_discovery=False)


def send_email(to_email: str, subject: str, body_html: str, body_text: str = None,
               new_hire_id=None, template_type: str = None, db=None,
               attachments: list = None) -> dict:
    """Send an email via Gmail API. Supports optional file attachments."""
    result = {"status": "sent", "message_id": None}

    service = _get_gmail_service()
    if not service:
        logger.info(f"[EMAIL-LOG] To: {to_email} | Subject: {subject}")
        logger.info(f"[EMAIL-LOG] Gmail not authenticated — logged only")
        result["status"] = "logged"
        result["message_id"] = f"log-{datetime.utcnow().timestamp()}"
    else:
        try:
            # Use 'mixed' for attachments, 'alternative' for plain email
            if attachments:
                msg = MIMEMultipart("mixed")
                alt_part = MIMEMultipart("alternative")
                if body_text:
                    alt_part.attach(MIMEText(body_text, "plain"))
                alt_part.attach(MIMEText(body_html, "html"))
                msg.attach(alt_part)

                # Attach files
                import mimetypes
                for file_path in attachments:
                    try:
                        filename = os.path.basename(file_path)
                        content_type, _ = mimetypes.guess_type(file_path)
                        if not content_type:
                            content_type = "application/octet-stream"
                        main_type, sub_type = content_type.split("/", 1)

                        with open(file_path, "rb") as f:
                            file_data = f.read()

                        from email.mime.base import MIMEBase
                        from email import encoders
                        attachment = MIMEBase(main_type, sub_type)
                        attachment.set_payload(file_data)
                        encoders.encode_base64(attachment)
                        attachment.add_header("Content-Disposition", "attachment", filename=filename)
                        msg.attach(attachment)
                        logger.info(f"[GMAIL] Attached: {filename}")
                    except Exception as e:
                        logger.error(f"[GMAIL] Failed to attach {file_path}: {e}")
            else:
                msg = MIMEMultipart("alternative")
                if body_text:
                    msg.attach(MIMEText(body_text, "plain"))
                msg.attach(MIMEText(body_html, "html"))

            msg["From"] = settings.sender_email
            msg["To"] = to_email
            msg["Subject"] = subject

            raw = base64.urlsafe_b64encode(msg.as_bytes()).decode("utf-8")
            sent = service.users().messages().send(
                userId="me", body={"raw": raw}
            ).execute()

            result["message_id"] = sent.get("id", "")
            logger.info(f"[GMAIL] Email sent to {to_email} | ID: {result['message_id']}")
        except Exception as e:
            logger.error(f"[GMAIL] Failed: {e}")
            result["status"] = "failed"
            result["message_id"] = str(e)

    # Log to DB
    if db and new_hire_id:
        try:
            from models import EmailLog
            log = EmailLog(
                new_hire_id=new_hire_id,
                to_email=to_email,
                subject=subject,
                body_preview=(body_text or body_html)[:500],
                template_type=template_type,
                status=result["status"],
            )
            db.add(log)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to log email: {e}")

    return result


def send_welcome_email(new_hire, db=None) -> dict:
    """Send LLM-generated welcome email with onboarding form link."""
    first_name = new_hire.first_name or "there"
    last_name = new_hire.last_name or ""
    doj_str = new_hire.doj.strftime("%B %d, %Y") if new_hire.doj else "To be confirmed"
    designation = new_hire.designation or "your new role"
    department = new_hire.department.name if new_hire.department else ""
    form_url = f"{settings.frontend_url}/welcome/{new_hire.form_token}"

    # Generate personalized content with AI
    try:
        from services.ai_service import generate_welcome_email_content
        ai_body = generate_welcome_email_content(
            first_name=first_name,
            last_name=last_name,
            designation=designation,
            department=department,
            doj=doj_str,
            recruiter_notes=new_hire.recruiter_notes or "",
        )
    except Exception as e:
        logger.error(f"AI welcome generation failed: {e}")
        ai_body = f"""Dear {first_name},

Welcome to Shellkode Technologies! We are excited to have you join us as {designation} in our {department} team.

Your date of joining is {doj_str}. We look forward to seeing you!

Warm regards,
HR Team, Shellkode Technologies"""

    # Render HTML template
    try:
        template = jinja_env.get_template("welcome_email.html")
        body_html = template.render(
            first_name=first_name,
            last_name=last_name,
            full_name=f"{first_name} {last_name}".strip(),
            designation=designation,
            department=department,
            doj=doj_str,
            form_url=form_url,
            ai_body=ai_body,
            sender_email=settings.sender_email,
        )
    except Exception as e:
        logger.error(f"Template render failed: {e}")
        body_html = f"<pre>{ai_body}</pre>"

    subject = f"Welcome to Shellkode Technologies — {designation}"

    return send_email(
        to_email=new_hire.personal_email,
        subject=subject,
        body_html=body_html,
        body_text=ai_body,
        new_hire_id=new_hire.id,
        template_type="welcome",
        db=db,
    )


def send_onboarding_plan_email(new_hire, plan_text: str, db=None) -> dict:
    """Send the generated onboarding plan to the employee."""
    first_name = new_hire.first_name or "there"
    doj_str = new_hire.doj.strftime("%B %d, %Y") if new_hire.doj else "To be confirmed"

    try:
        template = jinja_env.get_template("onboarding_plan.html")
        body_html = template.render(
            first_name=first_name,
            full_name=f"{first_name} {new_hire.last_name or ''}".strip(),
            designation=new_hire.designation or "",
            doj=doj_str,
            plan_text=plan_text,
            sender_email=settings.sender_email,
        )
    except Exception as e:
        logger.error(f"Template render failed: {e}")
        body_html = f"<pre>{plan_text}</pre>"

    subject = f"Your Onboarding Plan — Shellkode Technologies"

    return send_email(
        to_email=new_hire.personal_email,
        subject=subject,
        body_html=body_html,
        body_text=plan_text,
        new_hire_id=new_hire.id,
        template_type="onboarding_plan",
        db=db,
    )


def send_joining_confirmation_email(new_hire, temp_password=None, db=None) -> dict:
    """
    Send joining confirmation email with company email, employee ID,
    portal credentials, access card details, and provisioning info.
    """
    first_name = new_hire.first_name or "there"
    last_name = new_hire.last_name or ""
    full_name = f"{first_name} {last_name}".strip()
    designation = new_hire.designation or "Team Member"
    department = new_hire.department.name if new_hire.department else ""
    company_email = new_hire.company_email or "pending@shellkode.com"
    employee_id = new_hire.employee_id_code or "TBD"

    try:
        template = jinja_env.get_template("joining_confirmation.html")
        body_html = template.render(
            full_name=full_name,
            first_name=first_name,
            designation=designation,
            department=department,
            company_email=company_email,
            employee_id=employee_id,
            temp_password=temp_password,
            portal_url="http://localhost:3000/portal",
            sender_email=settings.sender_email,
        )
    except Exception as e:
        logger.error(f"Joining confirmation template failed: {e}")
        portal_section = ""
        if temp_password:
            portal_section = f"""
<h3 style="color: #00275E; margin-top: 24px;">Employee Portal Access</h3>
<div style="background: #f0f4ff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 12px 0;">
    <p style="margin: 4px 0;"><strong>Portal URL:</strong> <a href="http://localhost:3000/portal">http://localhost:3000/portal</a></p>
    <p style="margin: 4px 0;"><strong>Login Email:</strong> {company_email}</p>
    <p style="margin: 4px 0;"><strong>Temporary Password:</strong> {temp_password}</p>
</div>
<p>Please log in and complete the mandatory onboarding steps (NDA, policies, profile details).</p>"""
        body_html = f"""<h2>Welcome Aboard, {full_name}!</h2>
<p>Your company email: <strong>{company_email}</strong></p>
<p>Your employee ID: <strong>{employee_id}</strong></p>
<p>Your access card and IT equipment are being provisioned.</p>
{portal_section}"""

    portal_text = ""
    if temp_password:
        portal_text = f"""
Employee Portal
───────────────
Portal URL: http://localhost:3000/portal
Login Email: {company_email}
Temporary Password: {temp_password}

Please log in and complete the mandatory onboarding steps.
"""

    body_text = f"""Welcome Aboard, {full_name}!

Your onboarding is complete. Here are your details:

Company Email: {company_email}
Employee ID: {employee_id}
Designation: {designation}
Department: {department}

Your access card, IT equipment, and internal tools are being provisioned.
Report to the front desk on your first day to collect your badge and welcome kit.
{portal_text}
— HR Team, Shellkode Technologies"""

    subject = f"Welcome Aboard — Your Credentials & Access | {full_name}"

    return send_email(
        to_email=new_hire.personal_email,
        subject=subject,
        body_html=body_html,
        body_text=body_text,
        new_hire_id=new_hire.id,
        template_type="joining_confirmation",
        db=db,
    )

