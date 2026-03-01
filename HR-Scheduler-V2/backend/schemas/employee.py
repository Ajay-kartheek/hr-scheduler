"""Schemas for new hires — request and response."""

from pydantic import BaseModel, EmailStr
from uuid import UUID
from typing import Optional
from datetime import date, datetime


class NewHireCreate(BaseModel):
    """Used when seeding or adding a new hire (recruiter handoff)."""
    first_name: str
    last_name: Optional[str] = None
    personal_email: str
    phone: Optional[str] = None
    designation: Optional[str] = None
    department_id: Optional[UUID] = None
    doj: Optional[date] = None
    recruiter_notes: Optional[str] = None
    linkedin_url: Optional[str] = None
    previous_company: Optional[str] = None
    years_experience: Optional[float] = None


class NewHireOut(BaseModel):
    """Full new hire response."""
    id: UUID
    first_name: str
    last_name: Optional[str] = None
    personal_email: str
    phone: Optional[str] = None
    designation: Optional[str] = None
    department_id: Optional[UUID] = None
    role_id: Optional[UUID] = None
    manager_id: Optional[UUID] = None
    office_id: Optional[UUID] = None
    team_id: Optional[UUID] = None
    country: Optional[str] = "India"
    doj: Optional[date] = None
    offer_date: Optional[date] = None
    status: str
    form_token: Optional[UUID] = None
    company_email: Optional[str] = None
    employee_id_code: Optional[str] = None
    recruiter_notes: Optional[str] = None
    linkedin_url: Optional[str] = None
    previous_company: Optional[str] = None
    years_experience: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # Resolved names (populated in router)
    department_name: Optional[str] = None
    role_name: Optional[str] = None
    manager_name: Optional[str] = None
    office_name: Optional[str] = None
    team_name: Optional[str] = None

    # Form status
    form_submitted: bool = False

    class Config:
        from_attributes = True


class NewHireListItem(BaseModel):
    """Slim response for lists."""
    id: UUID
    first_name: str
    last_name: Optional[str] = None
    personal_email: str
    designation: Optional[str] = None
    department_name: Optional[str] = None
    doj: Optional[date] = None
    status: str
    created_at: Optional[datetime] = None
    form_submitted: bool = False

    class Config:
        from_attributes = True
