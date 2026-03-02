"""
HR-Scheduler-V2 — AI Agent Dashboard Router
Provides endpoints for the recruiter escalation/agent dashboard:
- Flagged items list
- Activity log
- Approve/dismiss/edit AI drafts
"""

import logging
from datetime import datetime
from uuid import UUID
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from sqlalchemy.orm.attributes import flag_modified

from db.database import get_db
from models.candidate import Candidate, CandidateStatus
from services.email_service import send_email, get_thread_reply_headers

logger = logging.getLogger("hr_scheduler_v2")

router = APIRouter(prefix="/api/agent", tags=["AI Agent"])


# ── Schemas ──

class ApproveAction(BaseModel):
    edited_content: Optional[str] = None  # If recruiter edited the draft


class DismissAction(BaseModel):
    reason: Optional[str] = None


# ── Flagged Items ──

@router.get("/flagged")
def get_flagged_items(db: Session = Depends(get_db)):
    """Get all candidates flagged for recruiter attention."""
    candidates = db.query(Candidate).filter(
        Candidate.flagged == True  # noqa: E712
    ).order_by(desc(Candidate.updated_at)).all()

    items = []
    for c in candidates:
        # Get latest reply from conversation history
        latest_reply = ""
        latest_classification = {}
        for h in reversed(c.conversation_history or []):
            if h.get("type") == "candidate_reply" and not latest_reply:
                latest_reply = h.get("content", "")
            if h.get("type") in ("llm_classification", "draft_queued") and not latest_classification:
                latest_classification = h
            if latest_reply and latest_classification:
                break

        items.append({
            "id": str(c.id),
            "name": f"{c.first_name} {c.last_name or ''}".strip(),
            "email": c.email,
            "designation": c.designation,
            "status": c.status.value if isinstance(c.status, CandidateStatus) else c.status,
            "flag_reason": c.flag_reason,
            "ai_confidence": c.ai_confidence,
            "ai_draft": c.ai_draft_response,
            "latest_reply": latest_reply[:500] if latest_reply else None,
            "latest_decision": latest_classification.get("decision"),
            "latest_reasoning": latest_classification.get("reasoning"),
            "followup_count": c.followup_count or 0,
            "days_since_offer": (datetime.utcnow() - c.offer_sent_at).days if c.offer_sent_at else None,
            "updated_at": c.updated_at.isoformat() if c.updated_at else None,
        })

    return {"flagged": items, "count": len(items)}


# ── Activity Log ──

@router.get("/activity")
def get_activity_log(limit: int = 50, db: Session = Depends(get_db)):
    """Get recent AI agent activity across all candidates."""
    # Get all candidates with conversation history
    candidates = db.query(Candidate).filter(
        Candidate.conversation_history.isnot(None),
    ).order_by(desc(Candidate.updated_at)).limit(100).all()

    activities = []
    for c in candidates:
        name = f"{c.first_name} {c.last_name or ''}".strip()
        for h in (c.conversation_history or []):
            if h.get("source") in ("ai_agent", "gmail_polling") or h.get("type") in (
                "llm_classification", "followup_sent", "auto_reply_sent", "draft_queued"
            ):
                activities.append({
                    "candidate_id": str(c.id),
                    "candidate_name": name,
                    "designation": c.designation,
                    "type": h.get("type"),
                    "decision": h.get("decision"),
                    "confidence": h.get("confidence"),
                    "content": (h.get("content", "") or "")[:300],
                    "reasoning": h.get("reasoning"),
                    "sender": h.get("sender"),
                    "timestamp": h.get("timestamp"),
                })

    # Sort by timestamp descending
    activities.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return {"activities": activities[:limit], "total": len(activities)}


# ── Agent Stats ──

@router.get("/stats")
def get_agent_stats(db: Session = Depends(get_db)):
    """Get AI agent summary statistics."""
    total_flagged = db.query(Candidate).filter(Candidate.flagged == True).count()  # noqa
    total_followups = db.query(Candidate).filter(Candidate.followup_count > 0).count()

    # Count auto-actions from conversation history
    auto_sent = 0
    drafts_pending = 0
    candidates = db.query(Candidate).filter(
        Candidate.conversation_history.isnot(None)
    ).all()

    for c in candidates:
        for h in (c.conversation_history or []):
            if h.get("type") == "auto_reply_sent":
                auto_sent += 1
            if h.get("type") == "draft_queued" and h.get("awaiting_approval"):
                drafts_pending += 1

    return {
        "flagged_items": total_flagged,
        "follow_ups_sent": total_followups,
        "auto_replies_sent": auto_sent,
        "drafts_pending": drafts_pending,
    }


# ── Approve AI Draft ──

@router.post("/flagged/{candidate_id}/approve")
def approve_draft(candidate_id: UUID, data: ApproveAction, db: Session = Depends(get_db)):
    """Approve (and optionally edit) an AI-drafted reply, then send it."""
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")

    content = data.edited_content or c.ai_draft_response
    if not content:
        raise HTTPException(status_code=400, detail="No draft content to send")

    # Strip duplicate greeting (AI may include "Hi Name," but template adds it)
    import re
    lines = content.strip().split("\n")
    if lines and re.match(r'^(Hi|Hello|Dear|Hey)\s+\w+[,!.]?\s*$', lines[0].strip(), re.IGNORECASE):
        lines = lines[1:]
    content = "\n".join(lines).strip()

    name = f"{c.first_name} {c.last_name or ''}".strip()

    # Build and send email
    from services.email_template import wrap_email_body
    subject = f"Re: Your offer from Shellkode Pvt Ltd — {c.designation or 'Position'}"
    inner_body = f"""
        <p>Hi {c.first_name},</p>
        {''.join(f'<p>{p.strip()}</p>' for p in content.strip().split(chr(10)+chr(10)) if p.strip())}
        <p style="margin-top: 16px;">
            Warm regards,<br/>
            <strong>HR Team</strong><br/>
            Shellkode Pvt Ltd
        </p>
    """
    html_body = wrap_email_body(inner_body)

    # Get thread info for reply-in-thread
    tid = c.offer_thread_id
    thread_headers = get_thread_reply_headers(tid) if tid else {}
    msg_id = thread_headers.get("message_id")
    orig_subject = thread_headers.get("subject")

    # Use Re: of original subject for proper Gmail threading
    subject = f"Re: {orig_subject}" if orig_subject else subject

    send_email(
        to_email=c.email,
        subject=subject,
        body_html=html_body,
        body_text=f"Hi {c.first_name},\n\n{content}\n\nWarm regards,\nHR Team\nShellkode Pvt Ltd",
        thread_id=tid,
        message_id_header=msg_id,
    )

    # Update candidate
    history = list(c.conversation_history or [])
    history.append({
        "type": "approved_reply_sent",
        "timestamp": datetime.utcnow().isoformat(),
        "content": content,
        "sender": "recruiter_approved",
        "source": "ai_agent",
        "was_edited": bool(data.edited_content),
    })
    c.conversation_history = history
    flag_modified(c, "conversation_history")

    c.ai_draft_response = None
    c.flagged = False
    c.flag_reason = None
    c.last_email_at = datetime.utcnow()

    db.commit()

    return {"message": f"Reply sent to {name}", "status": "sent"}


# ── Dismiss Flag ──

@router.post("/flagged/{candidate_id}/dismiss")
def dismiss_flag(candidate_id: UUID, data: DismissAction, db: Session = Depends(get_db)):
    """Dismiss a flagged item — recruiter has handled it manually."""
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")

    name = f"{c.first_name} {c.last_name or ''}".strip()

    # Log the dismissal
    history = list(c.conversation_history or [])
    history.append({
        "type": "flag_dismissed",
        "timestamp": datetime.utcnow().isoformat(),
        "reason": data.reason or "Handled manually",
        "sender": "recruiter",
        "source": "ai_agent",
    })
    c.conversation_history = history
    flag_modified(c, "conversation_history")

    c.flagged = False
    c.flag_reason = None
    c.ai_draft_response = None

    db.commit()

    return {"message": f"Flag dismissed for {name}"}
