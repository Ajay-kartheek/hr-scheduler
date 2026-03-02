"""Employee CRUD router — keep it simple, just CRUD."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from db.database import get_db
from models import NewHire, HireStatus
from schemas.employee import NewHireCreate, NewHireOut, NewHireListItem

router = APIRouter(prefix="/api/employees", tags=["Employees"])


def _hire_to_response(hire: NewHire) -> dict:
    return {
        "id": hire.id,
        "first_name": hire.first_name,
        "last_name": hire.last_name,
        "personal_email": hire.personal_email,
        "phone": hire.phone,
        "designation": hire.designation,
        "department_id": hire.department_id,
        "role_id": hire.role_id,
        "manager_id": hire.manager_id,
        "office_id": hire.office_id,
        "team_id": hire.team_id,
        "country": hire.country,
        "doj": hire.doj,
        "offer_date": hire.offer_date,
        "status": hire.status.value if isinstance(hire.status, HireStatus) else hire.status,
        "form_token": hire.form_token,
        "company_email": hire.company_email,
        "employee_id_code": hire.employee_id_code,
        "recruiter_notes": hire.recruiter_notes,
        "linkedin_url": hire.linkedin_url,
        "previous_company": hire.previous_company,
        "years_experience": hire.years_experience,
        "created_at": hire.created_at,
        "updated_at": hire.updated_at,
        "department_name": hire.department.name if hire.department else None,
        "role_name": hire.role.name if hire.role else None,
        "manager_name": hire.manager.name if hire.manager else None,
        "office_name": hire.office.name if hire.office else None,
        "team_name": hire.team.name if hire.team else None,
        "form_submitted": hire.form_response is not None,
    }


@router.get("/", response_model=list[NewHireListItem])
def list_employees(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(NewHire)
    if status:
        q = q.filter(NewHire.status == status)
    hires = q.order_by(NewHire.created_at.desc()).all()
    return [
        {
            "id": h.id,
            "first_name": h.first_name,
            "last_name": h.last_name,
            "personal_email": h.personal_email,
            "designation": h.designation,
            "department_name": h.department.name if h.department else None,
            "doj": h.doj,
            "status": h.status.value if isinstance(h.status, HireStatus) else h.status,
            "created_at": h.created_at,
            "form_submitted": h.form_response is not None,
        }
        for h in hires
    ]


@router.get("/{hire_id}", response_model=NewHireOut)
def get_employee(hire_id: UUID, db: Session = Depends(get_db)):
    hire = db.query(NewHire).filter(NewHire.id == hire_id).first()
    if not hire:
        raise HTTPException(status_code=404, detail="Employee not found")
    return _hire_to_response(hire)


@router.post("/", response_model=NewHireOut, status_code=201)
def create_employee(data: NewHireCreate, db: Session = Depends(get_db)):
    existing = db.query(NewHire).filter(NewHire.personal_email == data.personal_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee with this email already exists")

    hire = NewHire(
        first_name=data.first_name,
        last_name=data.last_name,
        personal_email=data.personal_email,
        phone=data.phone,
        designation=data.designation,
        department_id=data.department_id,
        doj=data.doj,
        recruiter_notes=data.recruiter_notes,
        linkedin_url=data.linkedin_url,
        previous_company=data.previous_company,
        years_experience=data.years_experience,
        status=HireStatus.WAITING_FOR_INPUT,
    )
    db.add(hire)
    db.commit()
    db.refresh(hire)
    return _hire_to_response(hire)


@router.post("/{hire_id}/send-welcome")
def send_welcome(hire_id: UUID, db: Session = Depends(get_db)):
    """Send LLM-generated welcome email + form link. Moves to welcome_sent."""
    hire = db.query(NewHire).filter(NewHire.id == hire_id).first()
    if not hire:
        raise HTTPException(status_code=404, detail="Employee not found")

    from services.email_service import send_welcome_email
    result = send_welcome_email(hire, db=db)

    hire.status = HireStatus.WELCOME_SENT
    db.commit()
    db.refresh(hire)

    return {"message": f"Welcome email sent to {hire.personal_email}", "email": result}


@router.get("/{hire_id}/form-response")
def get_form_response(hire_id: UUID, db: Session = Depends(get_db)):
    """Return the submitted form data for HR to review."""
    from models import FormResponse
    hire = db.query(NewHire).filter(NewHire.id == hire_id).first()
    if not hire:
        raise HTTPException(status_code=404, detail="Employee not found")

    fr = db.query(FormResponse).filter(FormResponse.new_hire_id == hire.id).first()
    if not fr:
        raise HTTPException(status_code=404, detail="Form not yet submitted")

    return {
        "id": fr.id,
        "new_hire_id": fr.new_hire_id,
        "phone": fr.phone,
        "blood_group": fr.blood_group,
        "emergency_contact_name": fr.emergency_contact_name,
        "emergency_contact_phone": fr.emergency_contact_phone,
        "address": fr.address,
        "tshirt_size": fr.tshirt_size,
        "dietary_preference": fr.dietary_preference,
        "linkedin_url": fr.linkedin_url,
        "bio": fr.bio,
        "extra_data": fr.extra_data,
        "submitted_at": fr.submitted_at,
    }


@router.post("/{hire_id}/confirm-joined")
def confirm_joined(hire_id: UUID, db: Session = Depends(get_db)):
    """
    HR confirms the employee has actually joined on their DOJ.
    Triggers: company email assignment, employee ID generation,
    portal credential generation, status -> ACTIVE, and joining email.
    """
    import hashlib
    import string
    import random

    hire = db.query(NewHire).filter(NewHire.id == hire_id).first()
    if not hire:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Generate company email
    first = (hire.first_name or "user").lower().replace(" ", "")
    last = (hire.last_name or "").lower().replace(" ", "")
    company_email = f"{first}.{last}@shellkode.com" if last else f"{first}@shellkode.com"

    # Check for duplicates
    existing = db.query(NewHire).filter(
        NewHire.company_email == company_email,
        NewHire.id != hire.id,
    ).first()
    if existing:
        company_email = f"{first}.{last}{random.randint(1,99)}@shellkode.com"

    hire.company_email = company_email

    # Generate employee ID code
    dept_code = hire.department.code if hire.department else "GEN"
    count = db.query(NewHire).filter(
        NewHire.employee_id_code.isnot(None),
        NewHire.department_id == hire.department_id,
    ).count()
    hire.employee_id_code = f"SK-{dept_code}-{count + 1:04d}"

    # ── Generate portal credentials ──
    chars = string.ascii_letters + string.digits
    temp_password = "".join(random.choices(chars, k=10))
    hire.portal_password_hash = hashlib.sha256(temp_password.encode()).hexdigest()

    # Move to active
    hire.status = HireStatus.ACTIVE

    db.commit()
    db.refresh(hire)

    # Send joining confirmation email with portal credentials
    email_result = {"status": "skipped"}
    try:
        from services.email_service import send_joining_confirmation_email
        email_result = send_joining_confirmation_email(hire, temp_password=temp_password, db=db)
    except Exception as e:
        import logging
        logging.getLogger("hr_scheduler_v2").error(f"Joining confirmation email failed: {e}")
        email_result = {"status": "failed", "error": str(e)}

    return {
        "message": f"{hire.first_name} has been confirmed as joined!",
        "company_email": hire.company_email,
        "employee_id": hire.employee_id_code,
        "temp_password": temp_password,
        "status": "active",
        "email_sent": email_result.get("status", "unknown"),
    }


# ── Send Portal Credentials ──

@router.post("/{hire_id}/send-portal-credentials")
def send_portal_credentials(hire_id: UUID, db: Session = Depends(get_db)):
    """Generate temp password, store hash, and email portal credentials."""
    import hashlib
    import string
    import random

    hire = db.query(NewHire).filter(NewHire.id == hire_id).first()
    if not hire:
        raise HTTPException(status_code=404, detail="Employee not found")

    if not hire.company_email:
        raise HTTPException(status_code=400, detail="Company email not set. Complete onboarding first.")

    # Generate temp password
    chars = string.ascii_letters + string.digits
    temp_password = "".join(random.choices(chars, k=10))

    # Hash and store
    hire.portal_password_hash = hashlib.sha256(temp_password.encode()).hexdigest()
    db.commit()

    name = f"{hire.first_name} {hire.last_name or ''}".strip()

    # Send email
    email_result = {"status": "skipped"}
    try:
        from services.email_service import send_email
        body_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #00275E;">Welcome to Shellkode Pvt Ltd</h2>
            <p>Hello {hire.first_name},</p>
            <p>Your employee portal is ready. Use the credentials below to log in:</p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 4px 0;"><strong>Portal URL:</strong> <a href="http://localhost:3000/portal">http://localhost:3000/portal</a></p>
                <p style="margin: 4px 0;"><strong>Email:</strong> {hire.company_email}</p>
                <p style="margin: 4px 0;"><strong>Password:</strong> {temp_password}</p>
            </div>
            <p>Please complete the mandatory onboarding steps after logging in.</p>
            <p>Best regards,<br/>HR Team, Shellkode Pvt Ltd</p>
        </div>
        """
        email_result = send_email(
            to_email=hire.personal_email,  # Send to personal email since they may not have company email access yet
            subject=f"Your Shellkode Portal Credentials | {name}",
            body_html=body_html,
            body_text=f"Portal: http://localhost:3000/portal\\nEmail: {hire.company_email}\\nPassword: {temp_password}",
        )
    except Exception as e:
        email_result = {"status": "failed", "error": str(e)}

    return {
        "message": f"Portal credentials sent to {hire.personal_email}",
        "company_email": hire.company_email,
        "temp_password": temp_password,  # Show in response for demo
        "email_status": email_result.get("status", "unknown"),
    }


@router.delete("/{hire_id}")
def delete_employee(hire_id: UUID, db: Session = Depends(get_db)):
    hire = db.query(NewHire).filter(NewHire.id == hire_id).first()
    if not hire:
        raise HTTPException(status_code=404, detail="Employee not found")
    db.delete(hire)
    db.commit()
    return {"message": "Employee deleted"}
