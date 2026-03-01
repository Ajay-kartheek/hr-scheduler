"""
NewHire model — the central entity of the onboarding pipeline.
"""

import uuid
import enum
from datetime import datetime, date
from sqlalchemy import Column, String, Text, Date, DateTime, Float, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.base import Base


class HireStatus(str, enum.Enum):
    """Pipeline stages — a new hire moves through these in order."""
    WAITING_FOR_INPUT = "waiting_for_input"       # Recruiter handed off, HR hasn't acted
    WELCOME_SENT = "welcome_sent"                 # Welcome email + form link sent
    FORM_RECEIVED = "form_received"               # Candidate submitted the form
    ONBOARDING_IN_PROGRESS = "onboarding_in_progress"  # HR is doing 4-step wizard
    ONBOARDING_COMPLETED = "onboarding_completed"      # All 4 steps done
    ACTIVE = "active"                                    # HR confirmed employee joined


class NewHire(Base):
    __tablename__ = "new_hires"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # ── Basic info (set by recruiter / seeded) ──
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100))
    personal_email = Column(String(200), nullable=False, unique=True)
    phone = Column(String(20))
    designation = Column(String(150))

    # ── References ──
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"))
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id"), nullable=True)
    manager_id = Column(UUID(as_uuid=True), ForeignKey("managers.id"), nullable=True)
    office_id = Column(UUID(as_uuid=True), ForeignKey("offices.id"), nullable=True)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=True)
    country = Column(String(100), default="India")

    # ── Dates ──
    doj = Column(Date)
    offer_date = Column(Date, default=date.today)

    # ── Pipeline state ──
    status = Column(
        Enum(HireStatus, name="hire_status", create_constraint=False),
        default=HireStatus.WAITING_FOR_INPUT,
    )

    # ── Token (for public form access) ──
    form_token = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True)

    # ── Company info (filled during onboarding) ──
    company_email = Column(String(200))
    employee_id_code = Column(String(50))  # e.g., SK-ENG-0042

    # ── Recruiter context (used by LLM) ──
    recruiter_notes = Column(Text)
    linkedin_url = Column(String(500))
    previous_company = Column(String(200))
    years_experience = Column(Float)

    # ── Timestamps ──
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ── Relationships ──
    department = relationship("Department")
    role = relationship("Role")
    manager = relationship("Manager")
    office = relationship("Office")
    team = relationship("Team")
    form_response = relationship("FormResponse", back_populates="new_hire", uselist=False)
    onboarding_session = relationship("OnboardingSession", back_populates="new_hire", uselist=False)
    documents = relationship("Document", back_populates="new_hire")
    asset_requests = relationship("AssetRequest", back_populates="new_hire")
    email_logs = relationship("EmailLog", back_populates="new_hire")
