"""
Onboarding wizard router — the 4-step HR workflow.
Step 1: General Information
Step 2: Job & Assets (auto-triggers asset request)
Step 3: Global Documents
Step 4: Onboarding Planning (LLM-generated, emailed to employee)
"""

import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from db.database import get_db
from models import (
    NewHire, HireStatus, OnboardingSession, AssetRequest,
    Document, Role, EmailLog,
)
from schemas.onboarding import (
    OnboardingSessionOut, Step1Data, Step2Data, Step3Data, Step4Data,
)

logger = logging.getLogger("hr_scheduler_v2")
router = APIRouter(prefix="/api/onboarding", tags=["Onboarding Wizard"])


@router.post("/{hire_id}/start", response_model=OnboardingSessionOut)
def start_onboarding(hire_id: UUID, db: Session = Depends(get_db)):
    """Start the 4-step onboarding wizard for a hire."""
    hire = db.query(NewHire).filter(NewHire.id == hire_id).first()
    if not hire:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Check if already started
    existing = db.query(OnboardingSession).filter(
        OnboardingSession.new_hire_id == hire.id
    ).first()
    if existing:
        return existing

    session = OnboardingSession(new_hire_id=hire.id, current_step=1)
    db.add(session)

    hire.status = HireStatus.ONBOARDING_IN_PROGRESS
    db.commit()
    db.refresh(session)
    return session


@router.get("/{hire_id}", response_model=OnboardingSessionOut)
def get_onboarding(hire_id: UUID, db: Session = Depends(get_db)):
    """Get current onboarding wizard state."""
    session = db.query(OnboardingSession).filter(
        OnboardingSession.new_hire_id == hire_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Onboarding not started")
    return session


@router.put("/{hire_id}/step/1", response_model=OnboardingSessionOut)
def save_step1(hire_id: UUID, data: Step1Data, db: Session = Depends(get_db)):
    """Step 1: General Information — HR verifies/updates candidate details."""
    session = db.query(OnboardingSession).filter(
        OnboardingSession.new_hire_id == hire_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Onboarding not started")

    hire = db.query(NewHire).filter(NewHire.id == hire_id).first()

    # Update hire with general info
    hire.first_name = data.first_name
    hire.last_name = data.last_name
    hire.personal_email = data.personal_email
    hire.phone = data.phone
    hire.country = data.country
    hire.manager_id = data.manager_id
    hire.office_id = data.office_id
    hire.team_id = data.team_id

    # Save to session
    session.general_info = data.model_dump(mode="json")
    session.current_step = max(session.current_step, 2)

    db.commit()
    db.refresh(session)
    return session


@router.put("/{hire_id}/step/2", response_model=OnboardingSessionOut)
def save_step2(hire_id: UUID, data: Step2Data, db: Session = Depends(get_db)):
    """Step 2: Job & Assets — select role, auto-create asset request."""
    session = db.query(OnboardingSession).filter(
        OnboardingSession.new_hire_id == hire_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Onboarding not started")

    hire = db.query(NewHire).filter(NewHire.id == hire_id).first()
    role = db.query(Role).filter(Role.id == data.role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Update hire with role
    hire.role_id = data.role_id
    session.role_id = data.role_id
    session.job_info = {
        "role_name": role.name,
        "equipment": role.default_equipment,
        "notes": data.equipment_notes,
    }

    # Auto-generate employee ID
    dept = hire.department
    dept_code = dept.code if dept else "GEN"
    count = db.query(NewHire).filter(NewHire.department_id == hire.department_id).count()
    hire.employee_id_code = f"SK-{dept_code}-{count:04d}"

    # Auto-generate company email
    first = (hire.first_name or "new").lower().replace(" ", "")
    last = (hire.last_name or "hire").lower().replace(" ", "")
    hire.company_email = f"{first}.{last}@shellkode.com"

    # Auto-create asset request
    existing_req = db.query(AssetRequest).filter(
        AssetRequest.new_hire_id == hire.id
    ).first()
    if not existing_req and role.default_equipment:
        asset_req = AssetRequest(
            new_hire_id=hire.id,
            role_id=role.id,
            equipment_list=role.default_equipment,
            notes=data.equipment_notes,
        )
        db.add(asset_req)
        logger.info(f"📦 Asset request created for {hire.first_name}: {role.default_equipment}")

        # Send asset request notification (async in future)
        try:
            from services.asset_service import notify_asset_team
            notify_asset_team(hire, role, db=db)
        except Exception as e:
            logger.error(f"Asset notification failed: {e}")

    session.current_step = max(session.current_step, 3)
    db.commit()
    db.refresh(session)
    return session


@router.put("/{hire_id}/step/3", response_model=OnboardingSessionOut)
def save_step3(hire_id: UUID, data: Step3Data, db: Session = Depends(get_db)):
    """Step 3: Global Documents — assign documents to hire."""
    session = db.query(OnboardingSession).filter(
        OnboardingSession.new_hire_id == hire_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Onboarding not started")

    # Link documents to this hire (if not already)
    for doc_id in data.document_ids:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            doc.new_hire_id = hire_id

    session.current_step = max(session.current_step, 4)
    db.commit()
    db.refresh(session)
    return session


@router.put("/{hire_id}/step/4", response_model=OnboardingSessionOut)
def save_step4(hire_id: UUID, data: Step4Data, db: Session = Depends(get_db)):
    """Step 4: Onboarding Planning — generate LLM plan and email to employee."""
    session = db.query(OnboardingSession).filter(
        OnboardingSession.new_hire_id == hire_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Onboarding not started")

    hire = db.query(NewHire).filter(NewHire.id == hire_id).first()

    # Generate onboarding plan via AI
    try:
        from services.onboarding_planner import generate_and_send_plan
        plan = generate_and_send_plan(hire, session, custom_notes=data.custom_notes, db=db)
        session.onboarding_plan = plan
        session.plan_sent_at = datetime.utcnow()
    except Exception as e:
        logger.error(f"Plan generation failed: {e}")
        session.onboarding_plan = f"[Plan generation failed: {e}]"

    db.commit()
    db.refresh(session)
    return session


@router.post("/{hire_id}/complete")
def complete_onboarding(hire_id: UUID, db: Session = Depends(get_db)):
    """Mark onboarding as completed."""
    session = db.query(OnboardingSession).filter(
        OnboardingSession.new_hire_id == hire_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Onboarding not started")

    hire = db.query(NewHire).filter(NewHire.id == hire_id).first()

    session.status = "completed"
    session.completed_at = datetime.utcnow()
    hire.status = HireStatus.ONBOARDING_COMPLETED

    db.commit()
    return {"message": f"Onboarding completed for {hire.first_name} {hire.last_name}"}
