"""
HR-Scheduler-V2 — Follow-up Service
Checks for unresponsive candidates and sends AI-drafted follow-up emails.
Runs as a background task every 30 minutes.
"""

import logging
from datetime import datetime, timedelta
from sqlalchemy.orm.attributes import flag_modified

from models.candidate import Candidate, CandidateStatus
from services.ai_service import generate_followup_email
from services.email_service import send_email, get_thread_reply_headers
from services.email_template import wrap_email_body
from app.config import get_settings

logger = logging.getLogger("hr_scheduler_v2")
settings = get_settings()

# Follow-up schedule: (days_after_offer, followup_number)
FOLLOWUP_SCHEDULE = [
    (3, 1),   # Day 3: First check-in
    (5, 2),   # Day 5: Friendly reminder
    (7, 3),   # Day 7: Final reminder — then flag
]

MAX_FOLLOWUPS = 3


def check_and_send_followups(db_session):
    """
    Check all candidates with OFFER_SENT status for follow-up eligibility.
    Returns summary of actions taken.
    """
    results = {
        "checked": 0,
        "followups_sent": 0,
        "flagged": 0,
        "errors": [],
        "details": [],
    }

    # Get candidates awaiting reply (offer sent, not yet responded)
    candidates = db_session.query(Candidate).filter(
        Candidate.status == CandidateStatus.OFFER_SENT,
        Candidate.offer_sent_at.isnot(None),
        Candidate.flagged == False,  # noqa: E712
    ).all()

    if not candidates:
        return results

    results["checked"] = len(candidates)
    now = datetime.utcnow()

    for candidate in candidates:
        try:
            name = f"{candidate.first_name} {candidate.last_name or ''}".strip()
            days_since_offer = (now - candidate.offer_sent_at).days

            # Determine which follow-up to send
            current_count = candidate.followup_count or 0

            # Check if candidate has exceeded max follow-ups → flag
            if current_count >= MAX_FOLLOWUPS:
                candidate.flagged = True
                candidate.flag_reason = f"Unresponsive after {MAX_FOLLOWUPS} follow-ups over {days_since_offer} days"
                db_session.commit()
                results["flagged"] += 1
                results["details"].append({
                    "candidate": name,
                    "action": "flagged_unresponsive",
                    "days_since_offer": days_since_offer,
                })
                logger.info(f"[FOLLOWUP] Flagged {name} as unresponsive after {MAX_FOLLOWUPS} follow-ups")
                continue

            # Find the next scheduled follow-up
            next_followup = None
            for days_threshold, followup_num in FOLLOWUP_SCHEDULE:
                if current_count < followup_num and days_since_offer >= days_threshold:
                    next_followup = (days_threshold, followup_num)

            if not next_followup:
                continue  # Not yet time for next follow-up

            # Check cooldown: don't send if we emailed within last 24 hours
            last_email = candidate.last_email_at or candidate.offer_sent_at
            if last_email and (now - last_email) < timedelta(hours=24):
                continue

            days_threshold, followup_num = next_followup

            # Generate AI follow-up email
            logger.info(f"[FOLLOWUP] Generating follow-up #{followup_num} for {name}")
            followup_body = generate_followup_email(
                candidate_name=name,
                designation=candidate.designation or "",
                followup_number=followup_num,
                days_since_offer=days_since_offer,
            )
            followup_body = _strip_greeting(followup_body)  # Remove duplicate greeting

            # Build email
            subject = f"Following up on your offer from Shellkode Pvt Ltd — {candidate.designation or 'Position'}"
            html_body = f"""
            <div style="font-family: Arial, sans-serif; font-size: 14px; color: #334155; line-height: 1.7;">
                <p>Hi {candidate.first_name},</p>
                {_text_to_html(followup_body)}
                <p style="margin-top: 16px;">
                    Best regards,<br/>
                    <strong>HR Team</strong><br/>
                    Shellkode Pvt Ltd
                </p>
            </div>
            """
            html_body = wrap_email_body(html_body)

            # Get thread info for reply-in-thread
            tid = candidate.offer_thread_id
            thread_headers = get_thread_reply_headers(tid) if tid else {}
            msg_id = thread_headers.get("message_id")
            orig_subject = thread_headers.get("subject")

            # Use Re: of original subject for proper Gmail threading
            reply_subject = f"Re: {orig_subject}" if orig_subject else subject

            # Send via Gmail (reply in existing thread)
            send_email(
                to_email=candidate.email,
                subject=reply_subject,
                body_html=html_body,
                body_text=f"Hi {candidate.first_name},\n\n{followup_body}\n\nBest regards,\nHR Team\nShellkode Pvt Ltd",
                thread_id=tid,
                message_id_header=msg_id,
            )

            # Update candidate
            candidate.followup_count = followup_num
            candidate.last_email_at = now

            # Add to conversation history
            history = list(candidate.conversation_history or [])
            history.append({
                "type": "followup_sent",
                "timestamp": now.isoformat(),
                "content": followup_body,
                "sender": "system",
                "followup_number": followup_num,
                "source": "ai_agent",
            })
            candidate.conversation_history = history
            flag_modified(candidate, "conversation_history")

            db_session.commit()

            results["followups_sent"] += 1
            results["details"].append({
                "candidate": name,
                "action": f"followup_{followup_num}_sent",
                "days_since_offer": days_since_offer,
            })

            logger.info(f"[FOLLOWUP] Sent follow-up #{followup_num} to {name}")

        except Exception as e:
            logger.error(f"[FOLLOWUP] Error processing {candidate.email}: {e}")
            results["errors"].append(f"{candidate.email}: {str(e)}")

    logger.info(
        f"[FOLLOWUP] Done. Checked {results['checked']}, "
        f"sent {results['followups_sent']}, flagged {results['flagged']}"
    )
    return results


def _text_to_html(text: str) -> str:
    """Convert plain text to HTML paragraphs."""
    paragraphs = text.strip().split("\n\n")
    return "".join(f"<p>{p.strip()}</p>" for p in paragraphs if p.strip())


def _strip_greeting(text: str) -> str:
    """Strip leading greetings like 'Hi Ajay,' from AI text since template adds it."""
    import re
    lines = text.strip().split("\n")
    if lines and re.match(r'^(Hi|Hello|Dear|Hey)\s+\w+[,!.]?\s*$', lines[0].strip(), re.IGNORECASE):
        lines = lines[1:]
    return "\n".join(lines).strip()
