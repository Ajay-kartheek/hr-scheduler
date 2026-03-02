"""
Portal router — employee self-service portal endpoints.
Auth via company_email + password. Covers login, profile, documents, requests.
"""

import logging
import hashlib
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from db.database import get_db
from models.employee import NewHire, HireStatus
from models.onboarding import FormResponse, OnboardingSession
from models.document import Document
from models.asset_request import AssetRequest
from models.employee_request import EmployeeRequest

logger = logging.getLogger("hr_scheduler_v2")

router = APIRouter(prefix="/api/portal", tags=["Employee Portal"])


# ── Schemas ──

class LoginRequest(BaseModel):
    email: str
    password: str

class ProfileUpdate(BaseModel):
    phone: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    father_name: Optional[str] = None
    pan_number: Optional[str] = None
    aadhaar_number: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_name: Optional[str] = None
    tshirt_size: Optional[str] = None
    dietary_preference: Optional[str] = None
    bio: Optional[str] = None

class RaiseRequestBody(BaseModel):
    request_type: str  # it_support | admin | access | other
    subject: str
    description: Optional[str] = None
    priority: Optional[str] = "medium"


# ── Helpers ──

def _hash_password(password: str) -> str:
    """Simple SHA-256 hash for demo (use bcrypt in production)."""
    return hashlib.sha256(password.encode()).hexdigest()

def _verify_password(password: str, hashed: str) -> bool:
    return _hash_password(password) == hashed


def _serialize_employee(emp: NewHire, db: Session) -> dict:
    """Full employee data for portal."""
    form = db.query(FormResponse).filter(FormResponse.new_hire_id == emp.id).first()
    session = db.query(OnboardingSession).filter(OnboardingSession.new_hire_id == emp.id).first()
    docs = db.query(Document).filter(Document.new_hire_id == emp.id).all()
    assets = db.query(AssetRequest).filter(AssetRequest.new_hire_id == emp.id).all()
    requests = db.query(EmployeeRequest).filter(EmployeeRequest.new_hire_id == emp.id).order_by(EmployeeRequest.created_at.desc()).all()

    return {
        "id": str(emp.id),
        "first_name": emp.first_name,
        "last_name": emp.last_name,
        "company_email": emp.company_email,
        "personal_email": emp.personal_email,
        "phone": emp.phone,
        "designation": emp.designation,
        "employee_id_code": emp.employee_id_code,
        "department_name": emp.department.name if emp.department else None,
        "role_name": emp.role.name if emp.role else None,
        "manager_name": emp.manager.name if emp.manager else None,
        "office_name": emp.office.name if emp.office else None,
        "team_name": emp.team.name if emp.team else None,
        "country": emp.country,
        "doj": str(emp.doj) if emp.doj else None,
        "status": emp.status.value if emp.status else None,
        "portal_onboarding_complete": emp.portal_onboarding_complete,
        "linkedin_url": emp.linkedin_url,
        "previous_company": emp.previous_company,
        "years_experience": emp.years_experience,

        # Form data (personal details submitted during pre-joining)
        "profile": {
            "phone": form.phone if form else emp.phone,
            "blood_group": form.blood_group if form else None,
            "emergency_contact_name": form.emergency_contact_name if form else None,
            "emergency_contact_phone": form.emergency_contact_phone if form else None,
            "address": form.address if form else None,
            "tshirt_size": form.tshirt_size if form else None,
            "dietary_preference": form.dietary_preference if form else None,
            "bio": form.bio if form else None,
            "date_of_birth": form.date_of_birth if form else None,
            "father_name": form.father_name if form else None,
            "pan_number": form.pan_number if form else None,
            "aadhaar_number": form.aadhaar_number if form else None,
            "bank_account_number": form.bank_account_number if form else None,
            "bank_ifsc": form.bank_ifsc if form else None,
            "bank_name": form.bank_name if form else None,
        } if form else None,

        # Onboarding plan
        "onboarding_plan": session.onboarding_plan if session else None,

        # Documents (NDA, leave policy, etc.)
        "documents": [
            {
                "id": str(d.id),
                "name": d.name,
                "document_type": d.document_type,
                "requires_signature": d.requires_signature,
                "signature_status": d.signature_status,
                "file_path": d.file_path,
            }
            for d in docs
        ],

        # Assets
        "assets": [
            {
                "id": str(a.id),
                "equipment_list": a.equipment_list,
                "status": a.status,
                "notes": a.notes,
            }
            for a in assets
        ],

        # Requests
        "requests": [
            {
                "id": str(r.id),
                "request_type": r.request_type,
                "subject": r.subject,
                "description": r.description,
                "priority": r.priority,
                "status": r.status,
                "admin_response": r.admin_response,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "resolved_at": r.resolved_at.isoformat() if r.resolved_at else None,
            }
            for r in requests
        ],
    }


# ── Login ──

@router.post("/login")
def portal_login(data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate employee with company email + password."""
    emp = db.query(NewHire).filter(NewHire.company_email == data.email).first()
    if not emp:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not emp.portal_password_hash:
        raise HTTPException(status_code=401, detail="Portal credentials not yet set. Contact HR.")

    if not _verify_password(data.password, emp.portal_password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return _serialize_employee(emp, db)


# ── Get Profile ──

@router.get("/me/{employee_id}")
def get_employee_portal(employee_id: UUID, db: Session = Depends(get_db)):
    """Get full employee data for portal."""
    emp = db.query(NewHire).filter(NewHire.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return _serialize_employee(emp, db)


# ── Acknowledge Document ──

@router.post("/acknowledge/{doc_id}")
def acknowledge_document(doc_id: UUID, db: Session = Depends(get_db)):
    """Sign/acknowledge a document (NDA, leave policy, etc.)."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.signature_status = "signed"
    db.commit()

    return {"message": f"Document '{doc.name}' acknowledged", "signature_status": "signed"}


# ── Update Profile ──

@router.put("/profile/{employee_id}")
def update_profile(employee_id: UUID, data: ProfileUpdate, db: Session = Depends(get_db)):
    """Update personal profile (bank, emergency contact, etc.)."""
    emp = db.query(NewHire).filter(NewHire.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Get or create form response
    form = db.query(FormResponse).filter(FormResponse.new_hire_id == emp.id).first()
    if not form:
        form = FormResponse(new_hire_id=emp.id)
        db.add(form)

    # Update fields
    update_data = data.dict(exclude_unset=True, exclude_none=True)
    for key, value in update_data.items():
        if hasattr(form, key):
            setattr(form, key, value)

    db.commit()
    return {"message": "Profile updated"}


# ── Complete Onboarding ──

@router.post("/complete-onboarding/{employee_id}")
def complete_onboarding(employee_id: UUID, db: Session = Depends(get_db)):
    """Mark employee portal onboarding as complete."""
    emp = db.query(NewHire).filter(NewHire.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    emp.portal_onboarding_complete = True
    db.commit()
    return {"message": "Onboarding completed"}


# ── Raise Request ──

@router.post("/raise-request/{employee_id}")
def raise_request(employee_id: UUID, data: RaiseRequestBody, db: Session = Depends(get_db)):
    """Raise an IT/Admin request."""
    emp = db.query(NewHire).filter(NewHire.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    req = EmployeeRequest(
        new_hire_id=emp.id,
        request_type=data.request_type,
        subject=data.subject,
        description=data.description,
        priority=data.priority,
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    return {
        "message": "Request submitted",
        "request_id": str(req.id),
        "status": req.status,
    }


# ── Get Requests ──

@router.get("/requests/{employee_id}")
def get_requests(employee_id: UUID, db: Session = Depends(get_db)):
    """Get all requests for an employee."""
    requests = db.query(EmployeeRequest).filter(
        EmployeeRequest.new_hire_id == employee_id
    ).order_by(EmployeeRequest.created_at.desc()).all()

    return [
        {
            "id": str(r.id),
            "request_type": r.request_type,
            "subject": r.subject,
            "description": r.description,
            "priority": r.priority,
            "status": r.status,
            "admin_response": r.admin_response,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "resolved_at": r.resolved_at.isoformat() if r.resolved_at else None,
        }
        for r in requests
    ]
