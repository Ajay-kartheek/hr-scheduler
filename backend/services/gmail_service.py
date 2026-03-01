"""
HR Scheduler — Real Gmail Service
OAuth2 integration with Gmail API for real inbox monitoring.
Polls inbox, matches emails to employees, auto-classifies and triggers workflows.
"""

import os
import json
import base64
import logging
from datetime import datetime
from email.mime.text import MIMEText
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

logger = logging.getLogger("hr_scheduler")

# Gmail API scopes
SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.send",
]

CREDENTIALS_FILE = os.path.join(os.path.dirname(__file__), "..", "credentials.json")
TOKEN_FILE = os.path.join(os.path.dirname(__file__), "..", "token.json")
MONITOR_EMAIL = os.getenv("GMAIL_MONITOR_EMAIL", "kalaiarasan6923@gmail.com")

# Track last processed message to avoid re-processing
_last_history_id = None


def get_gmail_credentials():
    """Get or refresh Gmail OAuth2 credentials."""
    creds = None

    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=8090, open_browser=True)

        # Save token for future use
        with open(TOKEN_FILE, "w") as f:
            f.write(creds.to_json())

    return creds


def get_gmail_service():
    """Build the Gmail API service."""
    creds = get_gmail_credentials()
    return build("gmail", "v1", credentials=creds)


def check_inbox():
    """
    Poll the Gmail inbox for new emails from known employees.
    Checks recent messages and skips already-processed ones (tracked by message ID in DB).
    """
    try:
        service = get_gmail_service()

        # Get recent messages (last 10, regardless of read status)
        results = service.users().messages().list(
            userId="me",
            q="newer_than:1d -from:me",
            maxResults=10,
        ).execute()

        messages = results.get("messages", [])
        if not messages:
            logger.info("📬 Gmail: No recent messages")
            return []

        # Check which message IDs are already processed
        from database import SessionLocal
        from models import EmailLog
        db = SessionLocal()
        try:
            processed_ids = set()
            existing = db.query(EmailLog.message_id).filter(
                EmailLog.direction == "inbound",
                EmailLog.message_id.isnot(None),
            ).all()
            processed_ids = {row[0] for row in existing}
        finally:
            db.close()

        parsed = []
        for msg_meta in messages:
            if msg_meta["id"] in processed_ids:
                continue  # Already processed

            msg = service.users().messages().get(
                userId="me",
                id=msg_meta["id"],
                format="full",
            ).execute()

            parsed_msg = _parse_message(msg)
            if parsed_msg:
                parsed.append(parsed_msg)

        logger.info(f"📬 Gmail: Found {len(parsed)} new messages to process")
        return parsed

    except Exception as e:
        logger.error(f"Gmail inbox check failed: {e}")
        return []


def _parse_message(msg):
    """Parse a Gmail message into a structured dict."""
    headers = {h["name"].lower(): h["value"] for h in msg["payload"]["headers"]}

    # Extract body
    body = ""
    payload = msg["payload"]

    if "parts" in payload:
        for part in payload["parts"]:
            if part["mimeType"] == "text/plain" and "data" in part.get("body", {}):
                body = base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8", errors="replace")
                break
            elif part["mimeType"] == "text/html" and "data" in part.get("body", {}) and not body:
                raw_html = base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8", errors="replace")
                # Strip HTML tags for plain text
                import re
                body = re.sub(r"<[^>]+>", "", raw_html).strip()
    elif "body" in payload and "data" in payload["body"]:
        body = base64.urlsafe_b64decode(payload["body"]["data"]).decode("utf-8", errors="replace")

    return {
        "id": msg["id"],
        "thread_id": msg.get("threadId"),
        "from_email": _extract_email(headers.get("from", "")),
        "from_name": _extract_name(headers.get("from", "")),
        "to_email": headers.get("to", ""),
        "subject": headers.get("subject", ""),
        "body": body,
        "date": headers.get("date", ""),
        "snippet": msg.get("snippet", ""),
    }


def _extract_email(from_header):
    """Extract email from 'Name <email>' format."""
    if "<" in from_header and ">" in from_header:
        return from_header.split("<")[1].split(">")[0].strip()
    return from_header.strip()


def _extract_name(from_header):
    """Extract name from 'Name <email>' format."""
    if "<" in from_header:
        return from_header.split("<")[0].strip().strip('"')
    return from_header.strip()


def mark_as_read(message_id: str):
    """Mark a message as read after processing."""
    try:
        service = get_gmail_service()
        service.users().messages().modify(
            userId="me",
            id=message_id,
            body={"removeLabelIds": ["UNREAD"]},
        ).execute()
        logger.info(f"📬 Marked message {message_id} as read")
    except Exception as e:
        logger.error(f"Failed to mark message as read: {e}")


def process_inbox():
    """
    Full inbox processing pipeline:
    1. Check for new messages
    2. Classify ALL emails with AI (LLM decides what each email is about)
    3. Auto-trigger workflow actions based on AI classification
    4. Mark as read
    """
    from database import SessionLocal
    from models import Employee, EmailLog
    from services.ai_service import classify_all_emails

    db = SessionLocal()
    try:
        messages = check_inbox()
        processed_count = 0

        for msg in messages:
            sender_email = msg["from_email"]
            subject = msg["subject"]
            body = msg["body"]

            # ─── Step 1: AI classifies the email ───
            logger.info(f"📬 Processing email from {sender_email}: {subject[:80]}")
            classification = classify_all_emails(subject, body, sender_email)

            logger.info(
                f"🤖 AI Classification: category={classification.get('category')}, "
                f"action={classification.get('action')}, "
                f"employee={classification.get('employee_name')}, "
                f"step={classification.get('step_key')}, "
                f"confidence={classification.get('confidence', 0):.0%}"
            )

            # ─── Step 2: Find the employee ───
            emp = None
            action = classification.get("action", "no_action")
            category = classification.get("category", "irrelevant")
            step_key = classification.get("step_key")
            emp_name_from_ai = classification.get("employee_name")

            # Try to find employee by sender email first
            emp = db.query(Employee).filter(
                Employee.personal_email == sender_email
            ).first()

            # If not found by sender (admin replies won't match), use AI-extracted name
            if not emp and emp_name_from_ai:
                name_parts = emp_name_from_ai.strip().split()
                if name_parts:
                    from sqlalchemy import func
                    emp = db.query(Employee).filter(
                        func.lower(Employee.first_name) == name_parts[0].lower()
                    ).first()

            if not emp:
                logger.info(f"📬 No employee match for email from {sender_email} (AI name: {emp_name_from_ai}), skipping")
                mark_as_read(msg["id"])
                continue

            # ─── Step 3: Log inbound email ───
            email_log = EmailLog(
                employee_id=emp.id,
                direction="inbound",
                from_email=sender_email,
                to_email=MONITOR_EMAIL,
                subject=subject,
                body_preview=body[:500],
                full_body=body,
                message_id=msg["id"],
                thread_id=msg.get("thread_id"),
                received_at=datetime.utcnow(),
                ai_classification=classification,
                processed=True,
            )
            db.add(email_log)

            # ─── Step 4: Execute action based on AI decision ───
            if action == "accept_offer":
                _auto_trigger(emp, {"status": "accepted", "confidence": classification.get("confidence", 0.9), "summary": classification.get("summary", "")}, db)
                logger.info(f"✅ AI: Offer ACCEPTED by {emp.first_name}")

            elif action == "decline_offer":
                _auto_trigger(emp, {"status": "declined", "confidence": classification.get("confidence", 0.9), "summary": classification.get("summary", "")}, db)
                logger.info(f"❌ AI: Offer DECLINED by {emp.first_name}")

            elif action == "negotiate_offer":
                _auto_trigger(emp, {"status": "negotiating", "confidence": classification.get("confidence", 0.9), "summary": classification.get("summary", "")}, db)
                logger.info(f"💬 AI: Offer NEGOTIATION from {emp.first_name}")

            elif action == "complete_step" and step_key:
                _complete_workflow_step(emp, step_key, sender_email, body, classification, db)
                logger.info(f"✅ AI: Step '{step_key}' completed for {emp.first_name} via {sender_email}")

            elif action == "no_action":
                logger.info(f"📬 AI: No action needed for email from {sender_email}")

            else:
                logger.info(f"📬 AI: Needs review — {classification.get('summary', 'unclear')}")

            # Mark as read
            mark_as_read(msg["id"])
            processed_count += 1

        db.commit()
        logger.info(f"📬 Gmail processing complete: {processed_count} emails processed")
        return processed_count

    except Exception as e:
        logger.error(f"Gmail processing failed: {e}")
        db.rollback()
        return 0
    finally:
        db.close()


def _complete_workflow_step(emp, step_key: str, sender_email: str, body: str, classification: dict, db):
    """Complete a workflow step based on AI classification."""
    from models import WorkflowInstance, WorkflowStep, StepStatus, LaptopStatus
    from services.workflow_engine import WorkflowEngine

    # Find the pre-boarding workflow
    workflow = db.query(WorkflowInstance).filter(
        WorkflowInstance.employee_id == emp.id,
        WorkflowInstance.workflow_type == "pre_boarding"
    ).first()

    if not workflow:
        logger.warning(f"No pre-boarding workflow for {emp.first_name}")
        return

    step = db.query(WorkflowStep).filter(
        WorkflowStep.workflow_instance_id == workflow.id,
        WorkflowStep.step_key == step_key
    ).first()

    if not step:
        logger.warning(f"Step '{step_key}' not found for {emp.first_name}")
        return

    if step.status in (StepStatus.COMPLETED, StepStatus.SKIPPED):
        logger.info(f"Step '{step_key}' already completed for {emp.first_name}")
        return

    engine = WorkflowEngine(db)
    summary = classification.get("summary", "Confirmed via email")

    if step_key == "laptop_approval":
        emp.laptop_status = LaptopStatus.APPROVED
        engine.complete_step(step.id, {"approved_by": sender_email, "ai_summary": summary}, f"Laptop approved — AI: {summary}")
        logger.info(f"🖥️ AI: Laptop approved for {emp.first_name}")

    elif step_key == "id_card_generation":
        emp.id_card_generated = True
        engine.complete_step(step.id, {"confirmed_by": sender_email, "ai_summary": summary}, f"ID card confirmed — AI: {summary}")
        logger.info(f"🪪 AI: ID card confirmed for {emp.first_name}")

    elif step_key == "access_card":
        emp.access_card_requested = True
        engine.complete_step(step.id, {"confirmed_by": sender_email, "ai_summary": summary}, f"Access card confirmed — AI: {summary}")
        logger.info(f"🔑 AI: Access card confirmed for {emp.first_name}")

    elif step_key == "create_email":
        emp.email_created = True
        engine.complete_step(step.id, {"confirmed_by": sender_email, "ai_summary": summary}, f"Company email created — AI: {summary}")
        logger.info(f"📧 AI: Company email confirmed for {emp.first_name}")

    else:
        # Generic step completion
        engine.complete_step(step.id, {"confirmed_by": sender_email, "ai_summary": summary}, f"Completed via email — AI: {summary}")
        logger.info(f"✅ AI: Step '{step_key}' completed for {emp.first_name}")


def _auto_trigger(emp, classification, db):
    """Auto-trigger workflow actions based on AI classification."""
    from models import (
        WorkflowInstance, WorkflowStep, StepStatus, OfferStatus,
        EmployeeStage
    )
    from services.workflow_engine import WorkflowEngine
    import logging

    status = classification.get("status", "unclear")
    engine = WorkflowEngine(db)

    if status == "accepted":
        # Trigger full accept_offer cascade
        logger.info(f"🤖 AUTO-TRIGGER: Accept offer for {emp.first_name}")

        from routers.employees import accept_offer
        try:
            # Call the accept_offer function directly
            accept_offer(emp.id, db)
        except Exception as e:
            logger.error(f"Auto accept_offer failed: {e}")

    elif status == "negotiating":
        logger.info(f"⚠️ {emp.first_name} is negotiating — logged for HR review")

    elif status == "declined":
        emp.offer_status = OfferStatus.DECLINED
        logger.info(f"❌ {emp.first_name} declined the offer")

    # Log notification
    from models import Notification, NotificationType
    notification = Notification(
        title=f"Email from {emp.first_name}: {status.upper()}",
        message=classification.get("summary", ""),
        notification_type=NotificationType.INFO,
        recipient_email="hr@shellkode.com",
        employee_id=emp.id,
    )
    db.add(notification)


def is_authenticated():
    """Check if Gmail OAuth2 token exists and is valid. Auto-refreshes expired tokens."""
    if not os.path.exists(TOKEN_FILE):
        return False
    try:
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
        if creds and creds.valid:
            return True
        # Try to refresh expired token
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            with open(TOKEN_FILE, "w") as f:
                f.write(creds.to_json())
            return creds.valid
        return False
    except Exception as e:
        logging.getLogger("hr_scheduler").error(f"Gmail auth check failed: {e}")
        return False
