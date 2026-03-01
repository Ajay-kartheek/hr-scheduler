"""
HR Scheduler — Email Service (Gmail API)
Sends all outbound emails via Gmail API using OAuth2.
No sandbox restrictions — can send to any email address.
"""

import os
import base64
import logging
from datetime import datetime
from typing import Optional
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger("hr_scheduler")

SENDER_EMAIL = os.getenv("SES_SENDER_EMAIL", "kalaiarasan6923@gmail.com")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "ajaykartheek.cloud@gmail.com")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def _get_gmail_service():
    """Get authenticated Gmail service for sending."""
    from services.gmail_service import get_gmail_service
    return get_gmail_service()


def send_email(
    to_email: str,
    subject: str,
    body_html: str,
    body_text: Optional[str] = None,
    employee_id: Optional[str] = None,
    db=None,
) -> dict:
    """
    Send an email via Gmail API.
    Returns dict with message_id and status.
    Falls back to logging if Gmail is not authenticated.
    """
    result = {"status": "sent", "message_id": None, "error": None}

    try:
        from services.gmail_service import is_authenticated
        if not is_authenticated():
            # Fall back to logging only
            logger.info(f"[EMAIL-LOG] To: {to_email} | Subject: {subject}")
            logger.info(f"[EMAIL-LOG] Gmail not authenticated — email logged only")
            result["status"] = "logged"
            result["message_id"] = f"log-{datetime.utcnow().timestamp()}"
        else:
            service = _get_gmail_service()

            # Build MIME message
            msg = MIMEMultipart("alternative")
            msg["From"] = SENDER_EMAIL
            msg["To"] = to_email
            msg["Subject"] = subject

            if body_text:
                msg.attach(MIMEText(body_text, "plain"))
            msg.attach(MIMEText(body_html, "html"))

            # Encode and send
            raw = base64.urlsafe_b64encode(msg.as_bytes()).decode("utf-8")
            sent = service.users().messages().send(
                userId="me",
                body={"raw": raw},
            ).execute()

            result["message_id"] = sent.get("id", "")
            logger.info(f"[GMAIL] ✅ Email sent to {to_email} | ID: {result['message_id']}")

    except Exception as e:
        logger.error(f"[GMAIL] ❌ Failed to send email to {to_email}: {e}")
        result["status"] = "failed"
        result["error"] = str(e)

    # Log to database
    if db and employee_id:
        try:
            from models import EmailLog
            log = EmailLog(
                employee_id=employee_id,
                direction="outbound",
                from_email=SENDER_EMAIL,
                to_email=to_email,
                subject=subject,
                body_preview=body_text[:500] if body_text else body_html[:500],
                full_body=body_html,
                message_id=result["message_id"],
                processed=result["status"] == "sent",
                received_at=datetime.utcnow(),
            )
            db.add(log)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to log email to DB: {e}")

    return result


def send_offer_email(employee, db=None) -> dict:
    """Send a formal offer letter email to a new hire."""
    first_name = employee.first_name or "there"
    last_name = employee.last_name or ""
    full_name = f"{first_name} {last_name}".strip()
    form_url = f"{FRONTEND_URL}/welcome/{employee.form_token}" if employee.form_token else ""
    doj_str = employee.doj.strftime("%B %d, %Y") if employee.doj else "To be confirmed"
    designation = employee.designation or "the offered position"
    domain = employee.domain.value if employee.domain else "Engineering"

    subject = f"Offer Letter — {designation} at Shellkode Technologies"
    body_html = f"""
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 0; background: #f0f4ff;">
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #00275E, #003580); padding: 36px 32px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 22px; color: #ffffff; font-weight: 700; letter-spacing: -0.3px;">Offer of Employment</h1>
            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.75); font-size: 14px;">Shellkode Technologies Private Limited</p>
        </div>

        <!-- Body -->
        <div style="background: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 15px; color: #1e293b; line-height: 1.7;">Dear <strong>{full_name}</strong>,</p>

            <p style="font-size: 14px; color: #334155; line-height: 1.7;">
                We are pleased to extend an offer of employment for the position of
                <strong style="color: #00275E;">{designation}</strong> in our
                <strong style="color: #00275E;">{domain}</strong> team at Shellkode Technologies.
            </p>

            <!-- DOJ Highlight Box -->
            <div style="background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border: 1px solid #bae6fd; border-left: 4px solid #00ADEF; border-radius: 8px; padding: 20px 24px; margin: 24px 0;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; width: 160px;">Position</td>
                        <td style="padding: 6px 0; color: #1e293b; font-weight: 600;">{designation}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748b;">Department</td>
                        <td style="padding: 6px 0; color: #1e293b; font-weight: 600;">{domain}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748b;">Expected Date of Joining</td>
                        <td style="padding: 6px 0; color: #00275E; font-weight: 700; font-size: 15px;">{doj_str}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748b;">Reporting Time</td>
                        <td style="padding: 6px 0; color: #1e293b; font-weight: 600;">9:30 AM IST</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748b;">Location</td>
                        <td style="padding: 6px 0; color: #1e293b; font-weight: 600;">Shellkode Technologies Office</td>
                    </tr>
                </table>
            </div>

            <p style="font-size: 14px; color: #334155; line-height: 1.7;">
                We believe your skills and experience will be a valuable addition to our team. Please find the key details of your offer above.
            </p>

            <!-- Accept Instructions -->
            <div style="background: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px 20px; margin: 24px 0;">
                <p style="margin: 0; font-size: 14px; color: #92400e; font-weight: 600;">
                    ✉️ To accept this offer:
                </p>
                <p style="margin: 8px 0 0; font-size: 13px; color: #78350f; line-height: 1.6;">
                    Please <strong>reply to this email</strong> confirming your acceptance of the offer and your availability for the mentioned date of joining. A simple "I accept the offer" will suffice.
                </p>
            </div>

            <p style="font-size: 14px; color: #334155; line-height: 1.7;">
                Once you accept, we'll begin your pre-boarding process. You'll receive a link to complete your onboarding details, including personal information, documents, and preferences.
            </p>

            {'<div style="text-align: center; margin: 28px 0;"><a href="' + form_url + '" style="display: inline-block; background: linear-gradient(135deg, #00275E, #003580); color: white; padding: 14px 36px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; box-shadow: 0 4px 12px rgba(0,39,94,0.2);">Complete Your Onboarding Details</a></div>' if form_url else ''}

            <p style="font-size: 14px; color: #334155; line-height: 1.7;">
                If you have any questions about the role, compensation, or joining process, please don't hesitate to reach out.
            </p>

            <p style="font-size: 14px; color: #334155; line-height: 1.7;">
                We look forward to welcoming you to Shellkode!
            </p>

            <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.6;">
                    Warm regards,<br>
                    <strong style="color: #1e293b;">HR Team</strong><br>
                    Shellkode Technologies Pvt. Ltd.<br>
                    <a href="mailto:{SENDER_EMAIL}" style="color: #00ADEF; text-decoration: none;">{SENDER_EMAIL}</a>
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 16px; font-size: 11px; color: #94a3b8;">
            This is an official communication from Shellkode Technologies.<br>
            Please do not share this email with unauthorized persons.
        </div>
    </div>
    """

    body_text = f"""Dear {full_name},

We are pleased to extend an offer of employment for the position of {designation} in our {domain} team at Shellkode Technologies.

OFFER DETAILS:
- Position: {designation}
- Department: {domain}
- Expected Date of Joining: {doj_str}
- Reporting Time: 9:30 AM IST

TO ACCEPT THIS OFFER:
Please reply to this email confirming your acceptance and availability for the mentioned date of joining.

{('Complete your onboarding details at: ' + form_url) if form_url else ''}

We look forward to welcoming you to Shellkode!

Warm regards,
HR Team
Shellkode Technologies Pvt. Ltd.
{SENDER_EMAIL}"""

    return send_email(
        to_email=employee.personal_email,
        subject=subject,
        body_html=body_html,
        body_text=body_text,
        employee_id=employee.id,
        db=db,
    )


def send_welcome_content_email(employee, content_text: str, db=None) -> dict:
    """Send HR-approved welcome content to the new hire."""
    first_name = employee.first_name or "there"

    subject = f"{first_name}, here's your personalized welcome from Shellkode!"
    body_html = f"""
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1e1b4b;">Your Welcome Writeup</h2>
        <div style="background: #f8fafc; border-radius: 8px; padding: 24px; border: 1px solid #e2e8f0; white-space: pre-wrap;">
{content_text}
        </div>
        <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">
            Best regards,<br>
            <strong>HR Team</strong>, Shellkode Technologies
        </p>
    </div>
    """

    return send_email(
        to_email=employee.personal_email,
        subject=subject,
        body_html=body_html,
        body_text=content_text,
        employee_id=employee.id,
        db=db,
    )


def send_followup_email(employee, subject: str, body: str, db=None) -> dict:
    """Send a follow-up email to the new hire."""
    body_html = f"""
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
        <p>Hi <strong>{employee.first_name or 'there'}</strong>,</p>
        <div style="white-space: pre-wrap;">{body}</div>
        <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">
            Best regards,<br>
            <strong>HR Team</strong>, Shellkode Technologies
        </p>
    </div>
    """

    return send_email(
        to_email=employee.personal_email,
        subject=subject,
        body_html=body_html,
        body_text=body,
        employee_id=employee.id,
        db=db,
    )


def send_laptop_request_email(employee, db=None) -> dict:
    """Send laptop request email to admin/HR with employee details."""
    emp_name = f"{employee.first_name or ''} {employee.last_name or ''}".strip()
    domain = employee.domain.value if employee.domain else "General"
    exp = employee.experience_type.value if employee.experience_type else "fresher"
    designation = employee.designation or "N/A"
    doj = str(employee.doj) if employee.doj else "TBD"
    role_id = employee.role_id or "Pending"

    # Domain-based laptop specs
    laptop_specs = {
        "ai": {"type": "High Performance", "ram": "32 GB", "gpu": "NVIDIA RTX", "storage": "1 TB SSD", "os": "Ubuntu 22.04 / Windows 11"},
        "cloud": {"type": "Standard", "ram": "16 GB", "gpu": "Integrated", "storage": "512 GB SSD", "os": "Windows 11 Pro"},
        "data_engineering": {"type": "High Performance", "ram": "32 GB", "gpu": "Integrated", "storage": "1 TB SSD", "os": "Ubuntu 22.04"},
        "devops": {"type": "Standard", "ram": "16 GB", "gpu": "Integrated", "storage": "512 GB SSD", "os": "Ubuntu 22.04"},
        "full_stack": {"type": "Standard", "ram": "16 GB", "gpu": "Integrated", "storage": "512 GB SSD", "os": "macOS / Windows 11"},
        "security": {"type": "High Performance", "ram": "32 GB", "gpu": "Integrated", "storage": "1 TB SSD", "os": "Kali Linux / Windows 11"},
    }
    specs = laptop_specs.get(domain.lower().replace(" ", "_"), {"type": "Standard", "ram": "16 GB", "gpu": "Integrated", "storage": "512 GB SSD", "os": "Windows 11 Pro"})

    subject = f"🖥️ Laptop Request — {emp_name} ({role_id}) | {domain} Team"
    body_html = f"""
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #7c3aed, #8b5cf6); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">🖥️ New Laptop Request</h1>
        </div>
        <div style="background: white; padding: 28px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 14px; color: #374151; margin-bottom: 20px;">
                A new laptop has been <strong>auto-requested</strong> for the following employee. Please arrange and confirm.
            </p>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 16px;">
                <h3 style="font-size: 13px; color: #6b7280; text-transform: uppercase; margin: 0 0 12px;">Employee Details</h3>
                <table style="width: 100%; font-size: 14px;">
                    <tr><td style="color: #6b7280; padding: 4px 0; width: 130px;">Name</td><td style="font-weight: 600;">{emp_name}</td></tr>
                    <tr><td style="color: #6b7280; padding: 4px 0;">Role ID</td><td style="font-weight: 600;">{role_id}</td></tr>
                    <tr><td style="color: #6b7280; padding: 4px 0;">Designation</td><td>{designation}</td></tr>
                    <tr><td style="color: #6b7280; padding: 4px 0;">Domain</td><td>{domain}</td></tr>
                    <tr><td style="color: #6b7280; padding: 4px 0;">Experience</td><td>{exp}</td></tr>
                    <tr><td style="color: #6b7280; padding: 4px 0;">Date of Joining</td><td style="font-weight: 600;">{doj}</td></tr>
                </table>
            </div>

            <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 18px; margin-bottom: 16px;">
                <h3 style="font-size: 13px; color: #7c3aed; text-transform: uppercase; margin: 0 0 12px;">Recommended Specs ({domain})</h3>
                <table style="width: 100%; font-size: 14px;">
                    <tr><td style="color: #6b7280; padding: 4px 0; width: 130px;">Type</td><td style="font-weight: 600;">{specs['type']}</td></tr>
                    <tr><td style="color: #6b7280; padding: 4px 0;">RAM</td><td>{specs['ram']}</td></tr>
                    <tr><td style="color: #6b7280; padding: 4px 0;">GPU</td><td>{specs['gpu']}</td></tr>
                    <tr><td style="color: #6b7280; padding: 4px 0;">Storage</td><td>{specs['storage']}</td></tr>
                    <tr><td style="color: #6b7280; padding: 4px 0;">OS</td><td>{specs['os']}</td></tr>
                </table>
            </div>

            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px; font-size: 13px; color: #92400e;">
                ⏰ <strong>Action Required:</strong> Please process this request before <strong>{doj}</strong> so the laptop is ready on Day 1.
                <br>Reply to this email to confirm or raise any concerns.
            </div>

            <p style="font-size: 13px; color: #6b7280; margin-top: 20px;">
                This is an automated request from the HR Scheduler Platform.<br>
                <strong>HR Team, Shellkode Technologies</strong>
            </p>
        </div>
    </div>
    """

    body_text = f"""LAPTOP REQUEST — {emp_name}

Employee: {emp_name}
Role ID: {role_id}
Designation: {designation}
Domain: {domain}
Experience: {exp}
DOJ: {doj}

Recommended: {specs['type']} | {specs['ram']} RAM | {specs['storage']} | {specs['os']}

Please arrange before {doj}. Reply to confirm."""

    return send_email(
        to_email=ADMIN_EMAIL,  # Send to admin
        subject=subject,
        body_html=body_html,
        body_text=body_text,
        employee_id=employee.id,
        db=db,
    )


def send_step_followup_email(employee, step_name: str, days_pending: int, to_email: str = None, db=None) -> dict:
    """Send a follow-up reminder email for a pending workflow step."""
    emp_name = f"{employee.first_name or ''} {employee.last_name or ''}".strip()
    recipient = to_email or SENDER_EMAIL

    urgency_config = {
        1: {"label": "Gentle Reminder", "color": "#3b82f6", "bg": "#eff6ff", "border": "#bfdbfe", "icon": "🔔"},
        3: {"label": "Follow-up", "color": "#d97706", "bg": "#fffbeb", "border": "#fde68a", "icon": "⚠️"},
        5: {"label": "ESCALATION", "color": "#dc2626", "bg": "#fef2f2", "border": "#fecaca", "icon": "🚨"},
    }
    config = urgency_config.get(days_pending, urgency_config[1])

    subject = f"{config['icon']} {config['label']}: {step_name} pending for {emp_name} ({days_pending} days)"
    body_html = f"""
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: {config['bg']}; border: 1px solid {config['border']}; border-radius: 8px; padding: 20px;">
            <h2 style="color: {config['color']}; margin: 0 0 12px; font-size: 16px;">{config['icon']} {config['label']}</h2>
            <p style="font-size: 14px; color: #374151; margin: 0 0 12px;">
                The step <strong>"{step_name}"</strong> has been pending for <strong>{days_pending} day(s)</strong>
                for employee <strong>{emp_name}</strong>.
            </p>
            <p style="font-size: 14px; color: {config['color']}; font-weight: 600;">
                {'Please escalate to management immediately.' if days_pending >= 5 else 'Please take action at your earliest convenience.'}
            </p>
        </div>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 12px;">
            Automated reminder from HR Scheduler Platform
        </p>
    </div>
    """

    return send_email(
        to_email=recipient,
        subject=subject,
        body_html=body_html,
        body_text=f"{config['label']}: {step_name} has been pending for {days_pending} day(s) for {emp_name}. Please take action.",
        employee_id=employee.id,
        db=db,
    )


def send_id_card_request_email(employee, db=None) -> dict:
    """Send ID card info to admin for generation."""
    emp_name = f"{employee.first_name or ''} {employee.last_name or ''}".strip()
    role_id = employee.role_id or "Pending"
    designation = employee.designation or "N/A"
    domain = employee.domain.value if employee.domain else "General"
    company_email = employee.company_email or "Pending"
    doj = str(employee.doj) if employee.doj else "TBD"
    phone = employee.phone or "N/A"

    subject = f"🪪 ID Card Generation Request — {emp_name} ({role_id})"
    body_html = f"""
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0d9488, #14b8a6); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">🪪 ID Card Generation Request</h1>
        </div>
        <div style="background: white; padding: 28px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 14px; color: #374151;">Please generate an employee ID card with the following details:</p>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 16px 0;">
                <table style="width: 100%; font-size: 14px;">
                    <tr><td style="color: #6b7280; padding: 4px 0; width: 140px;">Full Name</td><td style="font-weight: 600;">{emp_name}</td></tr>
                    <tr><td style="color: #6b7280; padding: 4px 0;">Role ID</td><td style="font-weight: 600;">{role_id}</td></tr>
                    <tr><td style="color: #6b7280; padding: 4px 0;">Designation</td><td>{designation}</td></tr>
                    <tr><td style="color: #6b7280; padding: 4px 0;">Department</td><td>{domain}</td></tr>
                    <tr><td style="color: #6b7280; padding: 4px 0;">Company Email</td><td>{company_email}</td></tr>
                    <tr><td style="color: #6b7280; padding: 4px 0;">Phone</td><td>{phone}</td></tr>
                    <tr><td style="color: #6b7280; padding: 4px 0;">Date of Joining</td><td style="font-weight: 600;">{doj}</td></tr>
                </table>
            </div>

            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px; font-size: 13px; color: #92400e;">
                ⏰ <strong>Action Required:</strong> Please prepare the ID card before <strong>{doj}</strong> for Day 1 handover.
                <br>Reply to this email once the card is ready.
            </div>

            <p style="font-size: 12px; color: #9ca3af; margin-top: 16px;">
                Automated request from HR Scheduler Platform
            </p>
        </div>
    </div>
    """

    return send_email(
        to_email=ADMIN_EMAIL,
        subject=subject,
        body_html=body_html,
        body_text=f"ID Card Request for {emp_name} ({role_id}). Designation: {designation}, Dept: {domain}. Please prepare before {doj}.",
        employee_id=employee.id,
        db=db,
    )


def send_access_card_request_email(employee, db=None) -> dict:
    """Send access card request to facility admin."""
    emp_name = f"{employee.first_name or ''} {employee.last_name or ''}".strip()
    role_id = employee.role_id or "Pending"
    domain = employee.domain.value if employee.domain else "General"
    doj = str(employee.doj) if employee.doj else "TBD"

    subject = f"🔑 Access Card Request — {emp_name} ({role_id}) | Starting {doj}"
    body_html = f"""
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">🔑 New Access Card Request</h1>
        </div>
        <div style="background: white; padding: 28px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 14px; color: #374151;">
                A new employee is joining and needs an <strong>office access card</strong> for Day 1.
            </p>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 16px 0;">
                <table style="width: 100%; font-size: 14px;">
                    <tr><td style="color: #6b7280; padding: 4px 0; width: 140px;">Employee</td><td style="font-weight: 600;">{emp_name}</td></tr>
                    <tr><td style="color: #6b7280; padding: 4px 0;">Role ID</td><td>{role_id}</td></tr>
                    <tr><td style="color: #6b7280; padding: 4px 0;">Department</td><td>{domain}</td></tr>
                    <tr><td style="color: #6b7280; padding: 4px 0;">Joining Date</td><td style="font-weight: 600;">{doj}</td></tr>
                </table>
            </div>

            <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 14px; font-size: 13px; color: #0369a1;">
                <strong>Access required for:</strong>
                <ul style="margin: 8px 0 0; padding-left: 18px;">
                    <li>Main entrance</li>
                    <li>Floor access — {domain} team area</li>
                    <li>Parking (if applicable)</li>
                    <li>Cafeteria</li>
                </ul>
            </div>

            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px; font-size: 13px; color: #92400e; margin-top: 12px;">
                ⏰ <strong>Please activate before {doj}.</strong> Reply to confirm.
            </div>

            <p style="font-size: 12px; color: #9ca3af; margin-top: 16px;">
                Automated request from HR Scheduler Platform
            </p>
        </div>
    </div>
    """

    return send_email(
        to_email=ADMIN_EMAIL,
        subject=subject,
        body_html=body_html,
        body_text=f"Access Card Request: {emp_name} ({role_id}) joining {doj}. Please prepare access card for main entrance, {domain} floor, parking, cafeteria.",
        employee_id=employee.id,
        db=db,
    )


def send_buddy_assignment_email(employee, buddy_name: str, buddy_email: str, buddy_designation: str, db=None) -> dict:
    """Send buddy assignment notification to the buddy."""
    emp_name = f"{employee.first_name or ''} {employee.last_name or ''}".strip()
    domain = employee.domain.value if employee.domain else "General"
    designation = employee.designation or "N/A"
    doj = str(employee.doj) if employee.doj else "TBD"

    subject = f"🤝 Buddy Assignment — You're {emp_name}'s onboarding buddy!"
    body_html = f"""
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f59e0b, #fbbf24); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">🤝 You've Been Assigned as a Buddy!</h1>
        </div>
        <div style="background: white; padding: 28px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 14px; color: #374151;">
                Hi <strong>{buddy_name}</strong>,
            </p>
            <p style="font-size: 14px; color: #6b7280; line-height: 1.7;">
                You've been selected as the <strong>onboarding buddy</strong> for a new team member
                who will be joining Shellkode soon. Here are their details:
            </p>

            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 18px; margin: 16px 0;">
                <table style="width: 100%; font-size: 14px;">
                    <tr><td style="color: #6b7280; padding: 4px 0; width: 140px;">New Joiner</td><td style="font-weight: 700;">{emp_name}</td></tr>
                    <tr><td style="color: #6b7280; padding: 4px 0;">Designation</td><td>{designation}</td></tr>
                    <tr><td style="color: #6b7280; padding: 4px 0;">Department</td><td>{domain}</td></tr>
                    <tr><td style="color: #6b7280; padding: 4px 0;">Joining Date</td><td style="font-weight: 600;">{doj}</td></tr>
                </table>
            </div>

            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; font-size: 13px; color: #166534;">
                <strong>Your role as a buddy:</strong>
                <ul style="margin: 8px 0 0; padding-left: 18px;">
                    <li>Welcome them on Day 1 and give an office tour</li>
                    <li>Take them for lunch on Day 1</li>
                    <li>Help them settle in during the first 2 weeks</li>
                    <li>Answer questions about team culture and processes</li>
                    <li>Be their go-to person for anything informal</li>
                </ul>
            </div>

            <p style="font-size: 14px; color: #374151; margin-top: 16px;">
                Thank you for helping make their transition smooth! 🎉
            </p>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 16px;">
                HR Team, Shellkode Technologies
            </p>
        </div>
    </div>
    """

    return send_email(
        to_email=buddy_email,
        subject=subject,
        body_html=body_html,
        body_text=f"Hi {buddy_name}, you've been assigned as the onboarding buddy for {emp_name} ({designation}, {domain}) joining on {doj}.",
        employee_id=employee.id,
        db=db,
    )
