"""
HR-Scheduler-V2 — Auto-Reply Service
Handles post-classification actions: auto-sends emails for clear decisions,
queues drafts for recruiter approval on ambiguous ones.
"""

import logging
from datetime import datetime
from sqlalchemy.orm.attributes import flag_modified

from models.candidate import Candidate, CandidateStatus
from services.ai_service import generate_auto_reply
from services.email_service import send_email, get_thread_reply_headers
from services.email_template import wrap_email_body
from app.config import get_settings

logger = logging.getLogger("hr_scheduler_v2")
settings = get_settings()

# Confidence threshold: above this → auto-act, below → flag for recruiter
AUTO_ACTION_THRESHOLD = 0.75


def handle_classified_reply(candidate: Candidate, classification: dict, db_session):
    """
    After a reply is classified, decide what to do:
    - High confidence accepted WITH joining date → auto-send congrats
    - High confidence accepted WITHOUT joining date → ask for joining date
    - High confidence rejected → auto-send closure
    - Negotiating → draft response, flag for recruiter review
    - Low confidence or manual_review → flag for recruiter
    """
    decision = classification.get("decision", "manual_review").lower()
    confidence = float(classification.get("confidence", 0.5))
    reasoning = classification.get("reasoning", "")
    suggested = classification.get("suggested_response", "")
    joining_date = classification.get("joining_date")
    name = f"{candidate.first_name} {candidate.last_name or ''}".strip()

    result = {
        "candidate": name,
        "decision": decision,
        "confidence": confidence,
        "action_taken": None,
    }

    # Store confidence on the candidate
    candidate.ai_confidence = confidence

    # Remember the originally proposed DOJ (set during offer generation)
    proposed_doj = candidate.doj  # may be None if no date was proposed

    # Store joining date if extracted from reply
    if joining_date:
        try:
            from datetime import date as date_type
            extracted_date = date_type.fromisoformat(joining_date)
            logger.info(f"[AUTO-REPLY] Extracted joining date for {name}: {joining_date}")
        except (ValueError, TypeError):
            extracted_date = None
            logger.warning(f"[AUTO-REPLY] Could not parse joining date: {joining_date}")
    else:
        extracted_date = None

    try:
        if decision == "accepted" and confidence >= AUTO_ACTION_THRESHOLD:
            if candidate.status == CandidateStatus.ACCEPTED:
                # ── Already accepted (we asked for date) — this is their date reply ──
                if extracted_date:
                    if proposed_doj and extracted_date != proposed_doj:
                        # Different date → flag for recruiter
                        candidate.doj = extracted_date
                        _flag_for_recruiter(candidate, {
                            **classification,
                            "reasoning": (
                                f"Candidate accepted but suggested a different joining date "
                                f"({extracted_date.strftime('%B %d, %Y')}) than the proposed date "
                                f"({proposed_doj.strftime('%B %d, %Y')}). Recruiter should review."
                            ),
                        }, db_session)
                        result["action_taken"] = "flagged_different_doj"
                    else:
                        # Confirmed the proposed date → auto-congrats
                        candidate.doj = extracted_date
                        _send_auto_reply(candidate, decision, classification, db_session)
                        result["action_taken"] = "auto_sent_congrats"
                elif proposed_doj:
                    # No date extracted but we have a proposed DOJ → treat as confirmation
                    logger.info(f"[AUTO-REPLY] {name} already accepted with proposed DOJ, treating reply as confirmation")
                    _send_auto_reply(candidate, decision, classification, db_session)
                    result["action_taken"] = "auto_sent_congrats"
                else:
                    # No date at all — ask again
                    _ask_for_joining_date(candidate, classification, db_session)
                    result["action_taken"] = "asked_for_joining_date"
            else:
                # ── First acceptance (status != ACCEPTED) ──
                # ALWAYS ask for joining date. The LLM's extracted_date is unreliable
                # on the first reply because it copies dates from the offer content.
                # Date extraction is only trusted on follow-up replies (status=ACCEPTED).
                _ask_for_joining_date(candidate, classification, db_session)
                result["action_taken"] = "asked_for_joining_date"

        elif decision == "rejected" and confidence >= AUTO_ACTION_THRESHOLD:
            # ── AUTO: Send graceful closure ──
            _send_auto_reply(candidate, decision, classification, db_session)
            result["action_taken"] = "auto_sent_closure"

        elif decision == "negotiating":
            # ── QUEUE: Draft counter-response for recruiter approval ──
            _queue_draft_for_approval(candidate, classification, db_session)
            result["action_taken"] = "queued_for_approval"

        else:
            # ── FLAG: Low confidence or manual_review ──
            _flag_for_recruiter(candidate, classification, db_session)
            result["action_taken"] = "flagged_for_review"

    except Exception as e:
        logger.error(f"[AUTO-REPLY] Error handling {name}: {e}")
        _flag_for_recruiter(candidate, {
            **classification,
            "reasoning": f"Auto-reply failed: {e}. Original: {reasoning}",
        }, db_session)
        result["action_taken"] = "flagged_due_to_error"

    logger.info(f"[AUTO-REPLY] {name}: {decision} (conf={confidence:.2f}) → {result['action_taken']}")
    return result


def _send_auto_reply(candidate: Candidate, decision: str, classification: dict, db_session):
    """Generate and send an auto-reply email."""
    name = f"{candidate.first_name} {candidate.last_name or ''}".strip()

    # Get the latest reply text for context
    history = list(candidate.conversation_history or [])
    latest_reply = ""
    for h in reversed(history):
        if h.get("type") == "candidate_reply":
            latest_reply = h.get("content", "")
            break

    # Generate AI response
    reply_body = generate_auto_reply(
        candidate_name=name,
        designation=candidate.designation or "",
        decision=decision,
        reply_text=latest_reply,
        conversation_history=history,
    )
    reply_body = _strip_greeting(reply_body)  # Remove duplicate greeting

    # Build HTML body
    inner_body = f"""
        <p>Hi {candidate.first_name},</p>
        {_text_to_html(reply_body)}
        <p style="margin-top: 16px;">
            Warm regards,<br/>
            <strong>HR Team</strong><br/>
            Shellkode Pvt Ltd
        </p>
    """
    html_body = wrap_email_body(inner_body)

    # Get thread info for reply-in-thread
    tid = candidate.offer_thread_id
    thread_headers = get_thread_reply_headers(tid) if tid else {}
    msg_id = thread_headers.get("message_id")
    orig_subject = thread_headers.get("subject")

    # Use Re: of original subject for proper Gmail threading
    subject = f"Re: {orig_subject}" if orig_subject else f"Re: Your offer from Shellkode Pvt Ltd"

    # Send email in the same thread
    send_email(
        to_email=candidate.email,
        subject=subject,
        body_html=html_body,
        body_text=f"Hi {candidate.first_name},\n\n{reply_body}\n\nWarm regards,\nHR Team\nShellkode Pvt Ltd",
        thread_id=tid,
        message_id_header=msg_id,
    )

    # Update candidate
    candidate.last_email_at = datetime.utcnow()

    # Log in conversation history
    history.append({
        "type": "auto_reply_sent",
        "timestamp": datetime.utcnow().isoformat(),
        "content": reply_body,
        "sender": "system",
        "decision": decision,
        "confidence": float(classification.get("confidence", 0)),
        "source": "ai_agent",
    })
    candidate.conversation_history = history
    flag_modified(candidate, "conversation_history")

    logger.info(f"[AUTO-REPLY] Sent {decision} reply to {name}")


def _ask_for_joining_date(candidate: Candidate, classification: dict, db_session):
    """When a candidate accepts but doesn't mention a joining date, ask for it."""
    name = f"{candidate.first_name} {candidate.last_name or ''}".strip()

    # Use the proposed DOJ stored on the candidate (set during offer generation)
    if candidate.doj:
        formatted_date = candidate.doj.strftime("%B %d, %Y")  # e.g., "March 15, 2026"
        reply_body = (
            f"Thank you so much for accepting the offer! We're thrilled to have you join our team as {candidate.designation or 'a team member'}. "
            f"As mentioned in the offer letter, the proposed joining date is {formatted_date}. "
            f"Could you please confirm if this date works for you, or suggest an alternative if needed? "
            f"Once confirmed, we'll start setting up your workspace, access credentials, and orientation schedule."
        )
    else:
        reply_body = (
            f"Thank you so much for accepting the offer! We're thrilled to have you join our team as {candidate.designation or 'a team member'}. "
            "Could you please let us know your preferred joining date? "
            "Once confirmed, we'll start setting up your workspace, access credentials, and orientation schedule."
        )

    # Build HTML body
    inner_body = f"""
        <p>Hi {candidate.first_name},</p>
        <p>{reply_body}</p>
        <p style="margin-top: 16px;">
            Warm regards,<br/>
            <strong>HR Team</strong><br/>
            Shellkode Pvt Ltd
        </p>
    """
    html_body = wrap_email_body(inner_body)

    # Get thread info for reply-in-thread
    tid = candidate.offer_thread_id
    thread_headers = get_thread_reply_headers(tid) if tid else {}
    msg_id = thread_headers.get("message_id")
    orig_subject = thread_headers.get("subject")
    subject = f"Re: {orig_subject}" if orig_subject else "Re: Your offer from Shellkode Pvt Ltd"

    send_email(
        to_email=candidate.email,
        subject=subject,
        body_html=html_body,
        body_text=f"Hi {candidate.first_name},\n\n{reply_body}\n\nWarm regards,\nHR Team\nShellkode Pvt Ltd",
        thread_id=tid,
        message_id_header=msg_id,
    )

    # Update candidate — mark as accepted, keep monitoring for joining date
    candidate.status = CandidateStatus.ACCEPTED
    candidate.last_email_at = datetime.utcnow()

    # Log in conversation history
    history = list(candidate.conversation_history or [])
    history.append({
        "type": "joining_date_requested",
        "timestamp": datetime.utcnow().isoformat(),
        "content": reply_body,
        "sender": "system",
        "source": "ai_agent",
        "note": "Candidate accepted but did not mention a joining date",
    })
    candidate.conversation_history = history
    flag_modified(candidate, "conversation_history")

    logger.info(f"[AUTO-REPLY] Asked {name} for joining date (accepted without date)")


def _queue_draft_for_approval(candidate: Candidate, classification: dict, db_session):
    """Queue an AI-drafted response for recruiter approval."""
    name = f"{candidate.first_name} {candidate.last_name or ''}".strip()

    # Get latest reply text
    history = list(candidate.conversation_history or [])
    latest_reply = ""
    for h in reversed(history):
        if h.get("type") == "candidate_reply":
            latest_reply = h.get("content", "")
            break

    # Generate draft
    draft = generate_auto_reply(
        candidate_name=name,
        designation=candidate.designation or "",
        decision="negotiating",
        reply_text=latest_reply,
        conversation_history=history,
    )

    candidate.ai_draft_response = draft
    candidate.flagged = True
    candidate.flag_reason = f"Negotiating (confidence: {classification.get('confidence', 0):.0%}): {classification.get('reasoning', '')[:300]}"

    # Log in conversation history
    history.append({
        "type": "draft_queued",
        "timestamp": datetime.utcnow().isoformat(),
        "content": draft,
        "sender": "system",
        "decision": "negotiating",
        "confidence": float(classification.get("confidence", 0)),
        "source": "ai_agent",
        "awaiting_approval": True,
    })
    candidate.conversation_history = history
    flag_modified(candidate, "conversation_history")

    logger.info(f"[AUTO-REPLY] Queued draft for {name} (negotiating)")


def _flag_for_recruiter(candidate: Candidate, classification: dict, db_session):
    """Flag a candidate for manual recruiter review."""
    candidate.flagged = True
    candidate.flag_reason = (
        f"{classification.get('decision', 'unknown')} "
        f"(confidence: {classification.get('confidence', 0):.0%}): "
        f"{classification.get('reasoning', 'Needs human review')[:300]}"
    )

    # Store suggested response as draft if available
    if classification.get("suggested_response"):
        candidate.ai_draft_response = classification["suggested_response"]

    logger.info(
        f"[AUTO-REPLY] Flagged {candidate.first_name} for review: "
        f"{candidate.flag_reason[:100]}"
    )


def _text_to_html(text: str) -> str:
    """Convert plain text to HTML paragraphs."""
    paragraphs = text.strip().split("\n\n")
    return "".join(f"<p>{p.strip()}</p>" for p in paragraphs if p.strip())


def _strip_greeting(text: str) -> str:
    """Strip leading greetings like 'Hi Ajay,' from AI-generated text
    since the email template already adds the greeting."""
    import re
    lines = text.strip().split("\n")
    if lines and re.match(r'^(Hi|Hello|Dear|Hey)\s+\w+[,!.]?\s*$', lines[0].strip(), re.IGNORECASE):
        lines = lines[1:]
    return "\n".join(lines).strip()
