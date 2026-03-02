"""
Candidates router — the offer letter pipeline for recruiters.
"""

import logging
import os
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from db.database import get_db
from models.candidate import Candidate, CandidateStatus
from sqlalchemy.orm.attributes import flag_modified
from models.employee import NewHire, HireStatus

logger = logging.getLogger("hr_scheduler_v2")
router = APIRouter(prefix="/api/candidates", tags=["Candidates"])

# Upload dir for attachments
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "offer_attachments")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ── Schemas ──
class CandidateOut(BaseModel):
    id: UUID
    first_name: str
    last_name: Optional[str] = None
    email: str
    phone: Optional[str] = None
    designation: Optional[str] = None
    department_name: Optional[str] = None
    department_id: Optional[UUID] = None
    current_company: Optional[str] = None
    years_experience: Optional[float] = None
    linkedin_url: Optional[str] = None
    expected_ctc: Optional[str] = None
    offered_ctc: Optional[str] = None
    recruiter_notes: Optional[str] = None
    status: str
    offer_sent_at: Optional[datetime] = None
    offer_letter_content: Optional[str] = None
    conversation_history: Optional[list] = None
    doj: Optional[str] = None
    converted_hire_id: Optional[UUID] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GenerateOfferRequest(BaseModel):
    custom_notes: Optional[str] = None


class SimulateReplyRequest(BaseModel):
    reply_text: str


class ConvertToHireRequest(BaseModel):
    doj: str
    phone: Optional[str] = None
    recruiter_notes: Optional[str] = None


# ── Helpers ──
def _candidate_to_dict(c: Candidate) -> dict:
    return {
        "id": c.id,
        "first_name": c.first_name,
        "last_name": c.last_name,
        "email": c.email,
        "phone": c.phone,
        "designation": c.designation,
        "department_name": c.department.name if c.department else None,
        "department_id": c.department_id,
        "current_company": c.current_company,
        "years_experience": c.years_experience,
        "linkedin_url": c.linkedin_url,
        "expected_ctc": c.expected_ctc,
        "offered_ctc": c.offered_ctc,
        "recruiter_notes": c.recruiter_notes,
        "status": c.status.value if isinstance(c.status, CandidateStatus) else c.status,
        "offer_sent_at": c.offer_sent_at,
        "offer_letter_content": c.offer_letter_content,
        "conversation_history": c.conversation_history or [],
        "doj": str(c.doj) if c.doj else None,
        "converted_hire_id": c.converted_hire_id,
        "created_at": c.created_at,
    }


def _status(c):
    return c.status.value if isinstance(c.status, CandidateStatus) else c.status


# ── CRUD ──
@router.get("/", response_model=list[CandidateOut])
def list_candidates(db: Session = Depends(get_db)):
    candidates = db.query(Candidate).order_by(Candidate.created_at.desc()).all()
    return [_candidate_to_dict(c) for c in candidates]


@router.get("/stats")
def candidate_stats(db: Session = Depends(get_db)):
    all_c = db.query(Candidate).all()
    return {
        "total": len(all_c),
        "selected": sum(1 for c in all_c if _status(c) == CandidateStatus.SELECTED.value),
        "offer_sent": sum(1 for c in all_c if _status(c) == CandidateStatus.OFFER_SENT.value),
        "negotiating": sum(1 for c in all_c if _status(c) == CandidateStatus.NEGOTIATING.value),
        "accepted": sum(1 for c in all_c if _status(c) == CandidateStatus.ACCEPTED.value),
        "rejected": sum(1 for c in all_c if _status(c) == CandidateStatus.REJECTED.value),
        "manual_review": sum(1 for c in all_c if _status(c) == CandidateStatus.MANUAL_REVIEW.value),
    }


@router.get("/{candidate_id}", response_model=CandidateOut)
def get_candidate(candidate_id: UUID, db: Session = Depends(get_db)):
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return _candidate_to_dict(c)


# ── Step 1: Generate Offer (AI) ──
@router.post("/{candidate_id}/generate-offer")
def generate_offer(candidate_id: UUID, data: GenerateOfferRequest, db: Session = Depends(get_db)):
    """Generate AI offer letter content — recruiter can then edit before sending."""
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")

    try:
        from services.ai_service import generate_offer_letter
        offer_content = generate_offer_letter(
            first_name=c.first_name,
            last_name=c.last_name or "",
            designation=c.designation or "",
            department=c.department.name if c.department else "",
            offered_ctc=c.offered_ctc or "",
            custom_notes=data.custom_notes or c.recruiter_notes or "",
        )
    except Exception as e:
        logger.error(f"Offer letter generation failed: {e}")
        offer_content = f"""Dear {c.first_name},

We are pleased to offer you the position of {c.designation or 'Team Member'} at Shellkode Pvt Ltd.

We believe your skills and experience will be a great addition to our team. Please find the details of your offer below.

We look forward to welcoming you aboard!

Best regards,
HR Team, Shellkode Pvt Ltd"""

    # Save draft (don't change status yet)
    c.offer_letter_content = offer_content
    db.commit()

    return {"offer_content": offer_content}


# ── Step 2: Send Offer (with edited content + optional attachments) ──
@router.post("/{candidate_id}/send-offer")
async def send_offer(
    candidate_id: UUID,
    offer_content: str = Form(...),
    attachments: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
):
    """Send the (possibly edited) offer letter with optional attachments."""
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")

    name = f"{c.first_name} {c.last_name or ''}".strip()
    c.offer_letter_content = offer_content

    # Save attachments to disk
    saved_files = []
    for file in attachments:
        if file.filename:
            safe_name = f"{candidate_id}_{file.filename}"
            file_path = os.path.join(UPLOAD_DIR, safe_name)
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            saved_files.append({"name": file.filename, "path": file_path})

    # Send email with attachments
    email_result = {"status": "skipped"}
    try:
        from services.email_service import send_email
        from jinja2 import Environment, FileSystemLoader

        template_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
        env = Environment(loader=FileSystemLoader(template_dir))

        try:
            template = env.get_template("offer_letter.html")
            from app.config import get_settings
            settings = get_settings()
            body_html = template.render(
                full_name=name,
                first_name=c.first_name,
                designation=c.designation or "Team Member",
                department=c.department.name if c.department else "",
                offered_ctc=c.offered_ctc or "",
                offer_content=offer_content,
                sender_email=settings.sender_email,
            )
        except Exception as e:
            logger.error(f"Offer template render failed: {e}")
            body_html = f"<pre>{offer_content}</pre>"

        # Build attachment list for email
        attachment_paths = [f["path"] for f in saved_files]

        email_result = send_email(
            to_email=c.email,
            subject=f"Offer Letter — {c.designation or 'Position'} at Shellkode Pvt Ltd | {name}",
            body_html=body_html,
            body_text=offer_content,
            attachments=attachment_paths,
        )
    except Exception as e:
        logger.error(f"Offer email failed: {e}")
        email_result = {"status": "failed", "error": str(e)}

    # Capture Gmail thread ID for reply polling
    msg_id = email_result.get("message_id", "")
    if msg_id and email_result.get("status") == "sent":
        try:
            from services.email_service import _get_gmail_service
            gmail = _get_gmail_service()
            if gmail:
                sent_msg = gmail.users().messages().get(userId="me", id=msg_id, format="metadata").execute()
                c.offer_thread_id = sent_msg.get("threadId", "")
                logger.info(f"Captured thread ID: {c.offer_thread_id}")
        except Exception as e:
            logger.error(f"Failed to get thread ID: {e}")

    # Update status and conversation history
    c.status = CandidateStatus.OFFER_SENT
    c.offer_sent_at = datetime.utcnow()
    history = list(c.conversation_history or [])
    history.append({
        "type": "offer_sent",
        "timestamp": datetime.utcnow().isoformat(),
        "content": offer_content,
        "email_status": email_result.get("status", "unknown"),
        "attachments": [f["name"] for f in saved_files],
        "sender": "recruiter",
    })
    c.conversation_history = history
    flag_modified(c, "conversation_history")

    db.commit()
    db.refresh(c)

    return {
        "message": f"Offer letter sent to {name}",
        "email_status": email_result.get("status", "unknown"),
        "attachments": [f["name"] for f in saved_files],
        "thread_id": c.offer_thread_id,
    }


# ── Check for Replies (Gmail Polling) ──
@router.post("/check-replies")
def check_replies(db: Session = Depends(get_db)):
    """Poll Gmail for new candidate replies and classify them."""
    from services.email_monitor import check_candidate_replies
    results = check_candidate_replies(db)
    return results


# ── Simulate + Classify Reply ──
@router.post("/{candidate_id}/simulate-reply")
def simulate_reply(candidate_id: UUID, data: SimulateReplyRequest, db: Session = Depends(get_db)):
    """
    Simulate a candidate reply and classify it with LLM.
    In production: this would be a webhook from email service.
    """
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")

    reply_text = data.reply_text
    name = f"{c.first_name} {c.last_name or ''}".strip()

    # Add reply to conversation
    history = list(c.conversation_history or [])
    history.append({
        "type": "candidate_reply",
        "timestamp": datetime.utcnow().isoformat(),
        "content": reply_text,
        "sender": "candidate",
    })

    # LLM Classification
    try:
        from services.ai_service import classify_candidate_reply
        classification = classify_candidate_reply(
            candidate_name=name,
            designation=c.designation or "",
            offer_content=c.offer_letter_content or "",
            reply_text=reply_text,
        )
    except Exception as e:
        logger.error(f"Reply classification failed: {e}")
        classification = {
            "decision": "manual_review",
            "reasoning": f"Classification failed: {e}",
            "suggested_response": "",
        }

    # Update status based on classification
    decision = classification.get("decision", "manual_review").lower()
    if decision == "accepted":
        c.status = CandidateStatus.ACCEPTED
    elif decision == "rejected":
        c.status = CandidateStatus.REJECTED
    elif decision == "negotiating":
        c.status = CandidateStatus.NEGOTIATING
    else:
        c.status = CandidateStatus.MANUAL_REVIEW

    # Add classification to conversation
    history.append({
        "type": "llm_classification",
        "timestamp": datetime.utcnow().isoformat(),
        "decision": decision,
        "reasoning": classification.get("reasoning", ""),
        "suggested_response": classification.get("suggested_response", ""),
        "sender": "system",
    })
    c.conversation_history = history
    flag_modified(c, "conversation_history")

    db.commit()
    db.refresh(c)

    return {
        "classification": classification,
        "new_status": c.status.value if isinstance(c.status, CandidateStatus) else c.status,
    }


# ── Convert to New Hire ──
@router.post("/{candidate_id}/convert-to-hire")
def convert_to_hire(candidate_id: UUID, data: ConvertToHireRequest, db: Session = Depends(get_db)):
    """Convert an accepted candidate to a NewHire for the HR pipeline."""
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")

    status_val = c.status.value if isinstance(c.status, CandidateStatus) else c.status
    if status_val != CandidateStatus.ACCEPTED.value:
        raise HTTPException(status_code=400, detail="Candidate must be in 'accepted' status to convert")

    if c.converted_hire_id:
        raise HTTPException(status_code=400, detail="Candidate already converted to hire")

    from datetime import date as date_type
    try:
        doj = date_type.fromisoformat(data.doj)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    hire = NewHire(
        first_name=c.first_name,
        last_name=c.last_name,
        personal_email=c.email,
        phone=data.phone or c.phone,
        designation=c.designation,
        department_id=c.department_id,
        doj=doj,
        recruiter_notes=data.recruiter_notes or c.recruiter_notes,
        linkedin_url=c.linkedin_url,
        previous_company=c.current_company,
        years_experience=c.years_experience,
        status=HireStatus.WAITING_FOR_INPUT,
    )
    db.add(hire)
    db.flush()

    c.converted_hire_id = hire.id
    c.doj = doj

    history = list(c.conversation_history or [])
    history.append({
        "type": "converted_to_hire",
        "timestamp": datetime.utcnow().isoformat(),
        "hire_id": str(hire.id),
        "doj": str(doj),
        "sender": "recruiter",
    })
    c.conversation_history = history
    flag_modified(c, "conversation_history")

    db.commit()

    return {
        "message": f"{c.first_name} has been added as a new hire!",
        "hire_id": str(hire.id),
        "doj": str(doj),
    }
