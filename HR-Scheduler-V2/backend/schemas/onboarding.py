"""Schemas for onboarding — form submissions and wizard steps."""

from pydantic import BaseModel
from uuid import UUID
from typing import Optional, Dict, Any, List
from datetime import datetime


# ── Public form (candidate-facing) ──

class FormDetails(BaseModel):
    """Returned when candidate loads the form."""
    first_name: str
    last_name: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    doj: Optional[str] = None
    form_submitted: bool = False


class FormSubmission(BaseModel):
    """Candidate submits their details."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    address: Optional[str] = None
    tshirt_size: Optional[str] = None
    dietary_preference: Optional[str] = None
    linkedin_url: Optional[str] = None
    bio: Optional[str] = None
    extra_data: Dict[str, Any] = {}


# ── Onboarding wizard (HR-facing) ──

class OnboardingSessionOut(BaseModel):
    """Current state of the onboarding wizard."""
    id: UUID
    new_hire_id: UUID
    current_step: int
    status: str
    general_info: Dict[str, Any] = {}
    job_info: Dict[str, Any] = {}
    role_id: Optional[UUID] = None
    onboarding_plan: Optional[str] = None
    plan_sent_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Step1Data(BaseModel):
    """Step 1: General Information — HR fills/verifies."""
    first_name: str
    last_name: Optional[str] = None
    personal_email: str
    phone: Optional[str] = None
    country: Optional[str] = "India"
    manager_id: Optional[UUID] = None
    office_id: Optional[UUID] = None
    team_id: Optional[UUID] = None


class Step2Data(BaseModel):
    """Step 2: Job & Assets — HR selects role → triggers asset request."""
    role_id: UUID
    equipment_notes: Optional[str] = None


class Step3Data(BaseModel):
    """Step 3: Global Documents — HR attaches documents."""
    document_ids: List[UUID] = []  # IDs of documents assigned to this hire


class Step4Data(BaseModel):
    """Step 4: Onboarding Planning — triggers LLM plan generation."""
    custom_notes: Optional[str] = None  # HR can add custom instructions


# ── Dashboard ──

class DashboardStats(BaseModel):
    onboarding: int = 0        # Currently in 4-step wizard
    provisioning: int = 0      # Welcome sent, waiting for form
    first_month: int = 0       # DOJ within last 30 days
    second_month: int = 0      # DOJ within 30-60 days
    total_hires: int = 0
    waiting_for_input: int = 0
