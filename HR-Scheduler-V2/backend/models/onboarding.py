"""
Onboarding models — form responses and the 4-step wizard session.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from db.base import Base


class FormResponse(Base):
    """Candidate-submitted onboarding form data."""
    __tablename__ = "form_responses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    new_hire_id = Column(UUID(as_uuid=True), ForeignKey("new_hires.id", ondelete="CASCADE"), unique=True)

    # ── Personal details (filled by candidate) ──
    phone = Column(String(20))
    blood_group = Column(String(5))
    emergency_contact_name = Column(String(100))
    emergency_contact_phone = Column(String(20))
    address = Column(Text)
    tshirt_size = Column(String(5))
    dietary_preference = Column(String(20))
    linkedin_url = Column(String(500))
    bio = Column(Text)

    # ── Flexible extra data ──
    extra_data = Column(JSONB, default=dict)

    submitted_at = Column(DateTime, default=datetime.utcnow)

    new_hire = relationship("NewHire", back_populates="form_response")


class OnboardingSession(Base):
    """
    HR's 4-step onboarding wizard state.
    Steps: 1=General Info, 2=Job & Assets, 3=Global Documents, 4=Onboarding Planning
    """
    __tablename__ = "onboarding_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    new_hire_id = Column(UUID(as_uuid=True), ForeignKey("new_hires.id", ondelete="CASCADE"), unique=True)

    current_step = Column(Integer, default=1)  # 1-4
    status = Column(String(30), default="in_progress")  # in_progress | completed

    # ── Step 1: General Info ──
    general_info = Column(JSONB, default=dict)

    # ── Step 2: Job & Assets ──
    job_info = Column(JSONB, default=dict)
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id"), nullable=True)

    # ── Step 4: Onboarding Plan ──
    onboarding_plan = Column(Text)
    plan_sent_at = Column(DateTime)

    # ── Timestamps ──
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)

    new_hire = relationship("NewHire", back_populates="onboarding_session")
    role = relationship("Role")
