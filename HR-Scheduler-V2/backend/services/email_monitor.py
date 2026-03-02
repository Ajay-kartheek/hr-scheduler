"""
HR-Scheduler-V2 — Email Monitor Service
Polls Gmail inbox for candidate replies to offer letters.
Extracts reply text, classifies with LLM, and updates candidate status.
"""

import os
import logging
import base64
import re
from datetime import datetime
from email.utils import parseaddr
from sqlalchemy.orm.attributes import flag_modified

from app.config import get_settings

logger = logging.getLogger("hr_scheduler_v2")
settings = get_settings()


def _get_gmail_service():
    """Get authenticated Gmail API service with read access."""
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build

    token_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        settings.gmail_token_file,
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
            logger.warning("Gmail not authenticated for inbox polling.")
            return None

    return build("gmail", "v1", credentials=creds, cache_discovery=False)


def _extract_reply_text(payload) -> str:
    """Extract the plain text reply from a Gmail message payload.
    Strips quoted text (lines starting with >) and signature blocks."""
    body = ""

    if payload.get("mimeType") == "text/plain" and payload.get("body", {}).get("data"):
        body = base64.urlsafe_b64decode(payload["body"]["data"]).decode("utf-8", errors="ignore")
    elif payload.get("parts"):
        for part in payload["parts"]:
            if part.get("mimeType") == "text/plain" and part.get("body", {}).get("data"):
                body = base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8", errors="ignore")
                break
            elif part.get("mimeType") == "multipart/alternative" and part.get("parts"):
                for sub in part["parts"]:
                    if sub.get("mimeType") == "text/plain" and sub.get("body", {}).get("data"):
                        body = base64.urlsafe_b64decode(sub["body"]["data"]).decode("utf-8", errors="ignore")
                        break

    if not body:
        return ""

    # Strip quoted text and signature
    lines = body.split("\n")
    clean_lines = []
    for line in lines:
        stripped = line.strip()
        # Stop at quoted text markers
        if stripped.startswith(">"):
            break
        if stripped.startswith("On ") and stripped.endswith("wrote:"):
            break
        if re.match(r"^-{2,}\s*(Original Message|Forwarded)", stripped, re.IGNORECASE):
            break
        # Stop at common signature markers
        if stripped in ("--", "---", "Regards,", "Best,", "Thanks,", "Thank you,"):
            clean_lines.append(line)
            break
        clean_lines.append(line)

    return "\n".join(clean_lines).strip()


def check_candidate_replies(db_session):
    """
    Poll Gmail for replies to sent offer emails.
    For each candidate with offer_thread_id, check if there are new messages
    in that thread from the candidate.
    """
    from models.candidate import Candidate, CandidateStatus
    from services.ai_service import classify_candidate_reply

    service = _get_gmail_service()
    if not service:
        logger.warning("[EMAIL-MONITOR] Gmail service not available")
        return {"checked": 0, "new_replies": 0, "errors": []}

    # Get candidates with active offer threads (awaiting reply)
    # Include ACCEPTED so we can catch joining date replies
    active_statuses = [
        CandidateStatus.OFFER_SENT,
        CandidateStatus.NEGOTIATING,
        CandidateStatus.MANUAL_REVIEW,
        CandidateStatus.ACCEPTED,
    ]

    candidates = db_session.query(Candidate).filter(
        Candidate.offer_thread_id.isnot(None),
        Candidate.status.in_(active_statuses),
    ).all()

    if not candidates:
        logger.info("[EMAIL-MONITOR] No candidates awaiting replies")
        return {"checked": 0, "new_replies": 0, "errors": []}

    results = {"checked": len(candidates), "new_replies": 0, "errors": [], "details": []}

    for candidate in candidates:
        try:
            name = f"{candidate.first_name} {candidate.last_name or ''}".strip()
            logger.info(f"[EMAIL-MONITOR] Checking replies for {name} (thread: {candidate.offer_thread_id})")

            # Get the thread
            thread = service.users().threads().get(
                userId="me",
                id=candidate.offer_thread_id,
                format="full",
            ).execute()

            messages = thread.get("messages", [])

            # Find messages FROM the candidate (not from us)
            # The first message is our sent offer, any subsequent from the candidate is a reply
            already_processed = set()
            history = list(candidate.conversation_history or [])
            for h in history:
                if h.get("type") == "candidate_reply" and h.get("gmail_msg_id"):
                    already_processed.add(h["gmail_msg_id"])

            for msg in messages:
                msg_id = msg.get("id", "")

                # Skip if already processed
                if msg_id in already_processed:
                    continue

                # Check sender — is this from the candidate?
                headers = {h["name"].lower(): h["value"] for h in msg.get("payload", {}).get("headers", [])}
                from_header = headers.get("from", "")
                _, from_email = parseaddr(from_header)
                from_email = from_email.lower()

                # Skip our own sent messages
                if from_email == settings.sender_email.lower():
                    continue

                # Check if it's from the candidate
                if from_email != candidate.email.lower():
                    continue

                # Extract reply text
                reply_text = _extract_reply_text(msg.get("payload", {}))
                if not reply_text:
                    logger.info(f"[EMAIL-MONITOR] Empty reply from {from_email}, skipping")
                    continue

                logger.info(f"[EMAIL-MONITOR] New reply from {name}: {reply_text[:100]}...")

                # Add to conversation history
                history.append({
                    "type": "candidate_reply",
                    "timestamp": datetime.utcnow().isoformat(),
                    "content": reply_text,
                    "sender": "candidate",
                    "gmail_msg_id": msg_id,
                    "source": "gmail_polling",
                })

                # Classify with LLM
                try:
                    classification = classify_candidate_reply(
                        candidate_name=name,
                        designation=candidate.designation or "",
                        offer_content=candidate.offer_letter_content or "",
                        reply_text=reply_text,
                    )
                except Exception as e:
                    logger.error(f"[EMAIL-MONITOR] Classification failed for {name}: {e}")
                    classification = {
                        "decision": "manual_review",
                        "reasoning": f"Classification error: {str(e)}",
                        "suggested_response": "",
                    }

                decision = classification.get("decision", "manual_review").lower()
                confidence = classification.get("confidence", 0.5)

                # Update status (except accepted — let handle_classified_reply manage it
                # so first-acceptance date confirmation flow works correctly)
                if decision == "rejected":
                    candidate.status = CandidateStatus.REJECTED
                elif decision == "negotiating":
                    candidate.status = CandidateStatus.NEGOTIATING
                elif decision != "accepted":
                    candidate.status = CandidateStatus.MANUAL_REVIEW

                # Add classification to history
                history.append({
                    "type": "llm_classification",
                    "timestamp": datetime.utcnow().isoformat(),
                    "decision": decision,
                    "confidence": confidence,
                    "reasoning": classification.get("reasoning", ""),
                    "suggested_response": classification.get("suggested_response", ""),
                    "sender": "system",
                    "source": "gmail_polling",
                })

                results["new_replies"] += 1
                results["details"].append({
                    "candidate": name,
                    "decision": decision,
                    "confidence": confidence,
                    "reply_preview": reply_text[:100],
                })

                logger.info(f"[EMAIL-MONITOR] {name} classified as: {decision} (conf={confidence:.2f})")

            candidate.conversation_history = history
            flag_modified(candidate, "conversation_history")
            db_session.commit()

            # ── AI Agent: Trigger auto-reply actions ──
            if results["new_replies"] > 0:
                try:
                    from services.auto_reply_service import handle_classified_reply
                    # Get the latest classification from history
                    latest_class = None
                    for h in reversed(history):
                        if h.get("type") == "llm_classification":
                            latest_class = h
                            break
                    if latest_class:
                        handle_classified_reply(candidate, {
                            "decision": latest_class.get("decision", "manual_review"),
                            "confidence": latest_class.get("confidence", 0.5),
                            "reasoning": latest_class.get("reasoning", ""),
                            "suggested_response": latest_class.get("suggested_response", ""),
                            "joining_date": latest_class.get("joining_date"),
                        }, db_session)
                        db_session.commit()
                except Exception as e:
                    logger.error(f"[EMAIL-MONITOR] Auto-reply error for {candidate.email}: {e}")

        except Exception as e:
            logger.error(f"[EMAIL-MONITOR] Error checking {candidate.email}: {e}")
            results["errors"].append(f"{candidate.email}: {str(e)}")

    logger.info(f"[EMAIL-MONITOR] Done. Checked {results['checked']}, found {results['new_replies']} new replies")
    return results
