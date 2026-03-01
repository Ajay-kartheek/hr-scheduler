"""Public form router — no auth required. Candidate-facing."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from db.database import get_db
from models import NewHire, FormResponse, HireStatus
from schemas.onboarding import FormDetails, FormSubmission

router = APIRouter(prefix="/api/forms", tags=["Public Forms"])


@router.get("/{token}", response_model=FormDetails)
def get_form(token: UUID, db: Session = Depends(get_db)):
    """Load form details for a candidate (public, no auth)."""
    hire = db.query(NewHire).filter(NewHire.form_token == token).first()
    if not hire:
        raise HTTPException(status_code=404, detail="Invalid or expired form link")

    return FormDetails(
        first_name=hire.first_name,
        last_name=hire.last_name,
        designation=hire.designation,
        department=hire.department.name if hire.department else None,
        doj=str(hire.doj) if hire.doj else None,
        form_submitted=hire.form_response is not None,
    )


@router.post("/{token}")
def submit_form(token: UUID, data: FormSubmission, db: Session = Depends(get_db)):
    """Candidate submits their onboarding form."""
    hire = db.query(NewHire).filter(NewHire.form_token == token).first()
    if not hire:
        raise HTTPException(status_code=404, detail="Invalid or expired form link")

    # Check if already submitted
    existing = db.query(FormResponse).filter(FormResponse.new_hire_id == hire.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Form already submitted")

    # Save response
    response = FormResponse(
        new_hire_id=hire.id,
        phone=data.phone,
        blood_group=data.blood_group,
        emergency_contact_name=data.emergency_contact_name,
        emergency_contact_phone=data.emergency_contact_phone,
        address=data.address,
        tshirt_size=data.tshirt_size,
        dietary_preference=data.dietary_preference,
        linkedin_url=data.linkedin_url,
        bio=data.bio,
        extra_data=data.extra_data,
    )
    db.add(response)

    # Update hire status
    hire.status = HireStatus.FORM_RECEIVED

    # Update hire fields if candidate provided updated info
    if data.phone:
        hire.phone = data.phone
    if data.linkedin_url:
        hire.linkedin_url = data.linkedin_url

    db.commit()
    return {"message": "Form submitted successfully. Our HR team will reach out soon!"}
