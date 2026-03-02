"""
Candidate model — selected candidates going through the offer letter pipeline.
These are candidates who have been selected and are awaiting offer letters,
negotiation, and final acceptance before being converted to NewHires.
"""

import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Text, Date, DateTime, Float, Integer, Boolean, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
from db.base import Base


class CandidateStatus(str, enum.Enum):
    """Offer pipeline stages."""
    SELECTED = "selected"                  # Interview passed, ready for offer
    OFFER_SENT = "offer_sent"              # Offer letter emailed
    NEGOTIATING = "negotiating"            # Candidate is negotiating terms
    ACCEPTED = "accepted"                  # Candidate accepted the offer
    REJECTED = "rejected"                  # Candidate declined
    MANUAL_REVIEW = "manual_review"        # LLM couldn't classify reply


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # ── Basic info ──
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100))
    email = Column(String(200), nullable=False, unique=True)
    phone = Column(String(20))
    designation = Column(String(150))

    # ── References ──
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=True)

    # ── Professional background ──
    current_company = Column(String(200))
    years_experience = Column(Float)
    linkedin_url = Column(String(500))
    expected_ctc = Column(String(100))
    offered_ctc = Column(String(100))
    resume_url = Column(String(500))

    # ── Recruiter notes ──
    recruiter_notes = Column(Text)

    # ── Pipeline state ──
    status = Column(
        Enum(CandidateStatus, name="candidate_status", create_constraint=False),
        default=CandidateStatus.SELECTED,
    )

    # ── Offer data ──
    offer_sent_at = Column(DateTime, nullable=True)
    offer_letter_content = Column(Text)
    offer_thread_id = Column(String(200), nullable=True)  # Gmail thread ID for reply polling
    conversation_history = Column(JSON, default=list)

    # ── AI Agent: Follow-up tracking ──
    last_email_at = Column(DateTime, nullable=True)        # When we last emailed them (offer or follow-up)
    followup_count = Column(Integer, default=0)            # How many follow-ups sent (0-3)

    # ── AI Agent: Smart reply & flagging ──
    ai_draft_response = Column(Text, nullable=True)        # Queued AI draft awaiting recruiter approval
    ai_confidence = Column(Float, nullable=True)           # Classification confidence (0.0 - 1.0)
    flagged = Column(Boolean, default=False)               # Needs recruiter attention
    flag_reason = Column(String(500), nullable=True)       # Why it was flagged

    # ── Post-acceptance ──
    doj = Column(Date, nullable=True)
    converted_hire_id = Column(UUID(as_uuid=True), ForeignKey("new_hires.id"), nullable=True)

    # ── Timestamps ──
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ── Relationships ──
    department = relationship("Department")
    converted_hire = relationship("NewHire")
