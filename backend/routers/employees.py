"""
HR Scheduler — Employee Router
CRUD operations + workflow triggers for employees.
"""

import uuid
from datetime import datetime, date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_

from database import get_db
from models import (
    Employee, Department, WorkflowInstance, WorkflowStep, Document,
    EmployeeStage, OfferStatus, ExperienceType, Domain, StepStatus
)
from schemas import (
    EmployeeCreate, EmployeeUpdate, EmployeeResponse, EmployeeListResponse,
    EmployeeFormSubmission, WorkflowInstanceResponse, DocumentResponse
)
from services.workflow_engine import WorkflowEngine

router = APIRouter(prefix="/api/employees", tags=["Employees"])


def _employee_to_response(emp: Employee) -> EmployeeResponse:
    """Convert Employee model to response schema."""
    return EmployeeResponse(
        id=emp.id,
        role_id=emp.role_id,
        first_name=emp.first_name,
        last_name=emp.last_name,
        full_name=f"{emp.first_name or ''} {emp.last_name or ''}".strip() or emp.personal_email,
        personal_email=emp.personal_email,
        company_email=emp.company_email,
        phone=emp.phone,
        photo_url=emp.photo_url,
        blood_group=emp.blood_group,
        designation=emp.designation,
        department_id=emp.department_id,
        department_name=emp.department.name if emp.department else None,
        domain=emp.domain.value if emp.domain else None,
        experience_type=emp.experience_type.value if emp.experience_type else None,
        linkedin_url=emp.linkedin_url,
        bio=emp.bio,
        previous_company=emp.previous_company,
        years_experience=emp.years_experience,
        offer_date=emp.offer_date,
        offer_status=emp.offer_status.value if emp.offer_status else "sent",
        doj=emp.doj,
        current_stage=emp.current_stage.value if emp.current_stage else "offer_sent",
        form_submitted=emp.form_submitted,
        form_token=emp.form_token,
        portal_token=emp.portal_token,
        portal_access_granted=emp.portal_access_granted,
        documents_uploaded=emp.documents_uploaded,
        laptop_status=emp.laptop_status.value if emp.laptop_status else "not_requested",
        bgv_status=emp.bgv_status.value if emp.bgv_status else "not_initiated",
        email_created=emp.email_created,
        id_card_generated=emp.id_card_generated,
        access_card_requested=emp.access_card_requested,
        buddy_id=emp.buddy_id,
        created_at=emp.created_at,
        updated_at=emp.updated_at,
    )


@router.post("/", response_model=EmployeeResponse, status_code=201)
def create_employee(data: EmployeeCreate, db: Session = Depends(get_db)):
    """
    Create a new employee record and initiate the pre-boarding workflow.
    This is triggered when HR sends an offer letter.
    """
    # Check for duplicate email
    existing = db.query(Employee).filter(Employee.personal_email == data.personal_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee with this email already exists")

    # Create employee
    employee = Employee(
        first_name=data.first_name,
        last_name=data.last_name,
        personal_email=data.personal_email,
        phone=data.phone,
        designation=data.designation,
        department_id=data.department_id,
        domain=Domain(data.domain.value),
        experience_type=ExperienceType(data.experience_type.value),
        doj=data.doj,
        linkedin_url=data.linkedin_url,
        bio=data.bio,
        previous_company=data.previous_company,
        years_experience=data.years_experience,
        offer_date=date.today(),
        offer_status=OfferStatus.SENT,
        current_stage=EmployeeStage.OFFER_SENT,
        form_token=str(uuid.uuid4()),
        portal_token=str(uuid.uuid4()),
    )

    db.add(employee)
    db.commit()
    db.refresh(employee)

    # Initiate pre-boarding workflow
    engine = WorkflowEngine(db)
    engine.initiate_pre_boarding(employee)

    # ──── AUTONOMOUS: Auto-send offer letter email ────
    import logging
    logger = logging.getLogger("hr_scheduler")
    logger.info(f"🤖 AUTO: Sending offer letter to {employee.personal_email}")

    from services.email_service import send_offer_email
    try:
        send_offer_email(employee, db=db)
    except Exception as e:
        logger.error(f"Auto send offer failed: {e}")

    # Auto-complete the send_offer workflow step
    workflow = db.query(WorkflowInstance).filter(
        WorkflowInstance.employee_id == employee.id,
        WorkflowInstance.workflow_type == "pre_boarding"
    ).first()
    if workflow:
        step = db.query(WorkflowStep).filter(
            WorkflowStep.workflow_instance_id == workflow.id,
            WorkflowStep.step_key == "send_offer"
        ).first()
        if step and step.status in (StepStatus.PENDING, StepStatus.IN_PROGRESS):
            engine.complete_step(step.id, {"email_sent": True, "auto": True},
                                 f"Offer letter auto-emailed to {employee.personal_email}")

    db.commit()
    db.refresh(employee)
    return _employee_to_response(employee)


@router.get("/", response_model=EmployeeListResponse)
def list_employees(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    stage: Optional[str] = None,
    domain: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List all employees with filtering and pagination."""
    query = db.query(Employee).options(joinedload(Employee.department))

    if stage:
        query = query.filter(Employee.current_stage == stage)
    if domain:
        query = query.filter(Employee.domain == domain)
    if search:
        query = query.filter(
            or_(
                Employee.first_name.ilike(f"%{search}%"),
                Employee.last_name.ilike(f"%{search}%"),
                Employee.personal_email.ilike(f"%{search}%"),
                Employee.designation.ilike(f"%{search}%"),
                Employee.role_id.ilike(f"%{search}%"),
            )
        )

    total = query.count()
    employees = query.order_by(Employee.created_at.desc()) \
        .offset((page - 1) * per_page).limit(per_page).all()

    return EmployeeListResponse(
        employees=[_employee_to_response(e) for e in employees],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(employee_id: str, db: Session = Depends(get_db)):
    """Get a single employee by ID."""
    emp = db.query(Employee).options(joinedload(Employee.department)) \
        .filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return _employee_to_response(emp)


@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(employee_id: str, data: EmployeeUpdate, db: Session = Depends(get_db)):
    """Update employee details."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            if hasattr(value, 'value'):  # Handle enums
                setattr(emp, field, value.value)
            else:
                setattr(emp, field, value)

    emp.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(emp)
    return _employee_to_response(emp)


@router.post("/{employee_id}/send-offer", response_model=EmployeeResponse)
def send_offer_letter(employee_id: str, db: Session = Depends(get_db)):
    """
    Send the offer letter email to the candidate.
    This is the ENTRY POINT of the entire email-driven workflow.
    After this, we wait for the candidate's email reply.
    """
    import logging
    logger = logging.getLogger("hr_scheduler")

    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    emp.offer_status = OfferStatus.SENT

    # Send offer email
    from services.email_service import send_offer_email
    try:
        send_offer_email(emp, db=db)
        logger.info(f"📧 Offer letter sent to {emp.personal_email}")
    except Exception as e:
        logger.error(f"Failed to send offer letter: {e}")

    # Complete the "send_offer" workflow step if it exists
    engine = WorkflowEngine(db)
    workflow = db.query(WorkflowInstance).filter(
        WorkflowInstance.employee_id == emp.id,
        WorkflowInstance.workflow_type == "pre_boarding"
    ).first()

    if workflow:
        step = db.query(WorkflowStep).filter(
            WorkflowStep.workflow_instance_id == workflow.id,
            WorkflowStep.step_key == "send_offer"
        ).first()
        if step and step.status in (StepStatus.PENDING, StepStatus.IN_PROGRESS):
            engine.complete_step(step.id, {"email_sent": True}, f"Offer letter emailed to {emp.personal_email}")

    emp.current_stage = EmployeeStage.OFFER_SENT
    db.commit()
    db.refresh(emp)
    return _employee_to_response(emp)


@router.post("/{employee_id}/accept-offer", response_model=EmployeeResponse)
def accept_offer(employee_id: str, db: Session = Depends(get_db)):
    """
    Mark offer as accepted and trigger FULL pre-boarding automation:
    1. Generate Role ID
    2. Auto-generate AI content (welcome writeup, LinkedIn post, welcome email)
    3. Auto-complete all system-executable workflow steps
    4. Generate company email
    """
    import logging
    logger = logging.getLogger("hr_scheduler")

    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    emp.offer_status = OfferStatus.ACCEPTED
    emp.current_stage = EmployeeStage.OFFER_ACCEPTED

    engine = WorkflowEngine(db)

    # 1. Generate Role ID
    role_id = engine.generate_role_id(emp)

    # 2. Generate company email
    first = (emp.first_name or "newhire").lower().replace(" ", "")
    last = (emp.last_name or str(uuid.uuid4())[:4]).lower().replace(" ", "")
    emp.company_email = f"{first}.{last}@shellkode.com"

    # 3. Auto-generate AI content (3 pieces)
    from models import AIContent, AIContentType, AIContentStatus
    from services.ai_service import (
        generate_welcome_writeup, generate_linkedin_post, generate_welcome_email
    )

    content_jobs = [
        ("welcome_writeup", AIContentType.WELCOME_WRITEUP, generate_welcome_writeup),
        ("linkedin_post", AIContentType.LINKEDIN_POST, generate_linkedin_post),
    ]

    for label, content_type, gen_func in content_jobs:
        try:
            if content_type == AIContentType.LINKEDIN_POST:
                text = gen_func(
                    first_name=emp.first_name or "New Hire",
                    last_name=emp.last_name or "",
                    designation=emp.designation,
                    domain=emp.domain.value,
                    experience_type=emp.experience_type.value,
                    bio=emp.bio,
                    previous_company=emp.previous_company,
                    tone="celebratory",
                )
            else:
                text = gen_func(
                    first_name=emp.first_name or "New Hire",
                    last_name=emp.last_name or "",
                    designation=emp.designation,
                    domain=emp.domain.value,
                    experience_type=emp.experience_type.value,
                    bio=emp.bio,
                    previous_company=emp.previous_company,
                    tone="professional",
                )
            ai_content = AIContent(
                employee_id=emp.id,
                content_type=content_type,
                content=text,
                tone="professional" if content_type != AIContentType.LINKEDIN_POST else "celebratory",
                status=AIContentStatus.DRAFT,
            )
            db.add(ai_content)
            logger.info(f"Auto-generated {label} for {emp.first_name}")
        except Exception as e:
            logger.error(f"Failed to auto-generate {label}: {e}")

    # Generate welcome email
    try:
        form_url = f"/welcome/{emp.form_token}" if emp.form_token else ""
        email_text = generate_welcome_email(
            first_name=emp.first_name or "New Hire",
            designation=emp.designation,
            doj=str(emp.doj) if emp.doj else None,
            form_url=form_url,
        )
        ai_email = AIContent(
            employee_id=emp.id,
            content_type=AIContentType.WELCOME_EMAIL,
            content=email_text,
            tone="professional",
            status=AIContentStatus.DRAFT,
        )
        db.add(ai_email)
        logger.info(f"Auto-generated welcome email for {emp.first_name}")
    except Exception as e:
        logger.error(f"Failed to auto-generate welcome email: {e}")

    # 3b. Auto-generate welcome postcard
    from services.postcard_service import save_postcard
    postcard_path = None
    try:
        postcard_path = save_postcard(
            employee_id=emp.id,
            first_name=emp.first_name or "New Hire",
            last_name=emp.last_name or "",
            designation=emp.designation,
            domain=emp.domain.value if emp.domain else "",
            experience_type=emp.experience_type.value if emp.experience_type else "fresher",
            doj=str(emp.doj) if emp.doj else "",
            role_id=role_id,
        )
        logger.info(f"🎨 AUTO: Welcome postcard generated for {emp.first_name}")
    except Exception as e:
        logger.error(f"Failed to generate postcard: {e}")

    # 4. Auto-complete workflow steps
    workflow = db.query(WorkflowInstance).filter(
        WorkflowInstance.employee_id == emp.id,
        WorkflowInstance.workflow_type == "pre_boarding"
    ).first()

    if workflow:
        auto_steps = {
            "offer_acceptance": ("Offer accepted by candidate", {"status": "accepted"}),
            "generate_role_id": (f"Role ID generated: {role_id}", {"role_id": role_id}),
            "send_welcome_form": (f"Welcome form link sent: /welcome/{emp.form_token}", {"form_url": f"/welcome/{emp.form_token}"}),
            "create_email_id": (f"Company email created: {emp.company_email}", {"email": emp.company_email}),
            "generate_welcome_content": ("AI content auto-generated: writeup + LinkedIn + email", {"auto_generated": True}),
        }

        for step_key, (note, result) in auto_steps.items():
            step = db.query(WorkflowStep).filter(
                WorkflowStep.workflow_instance_id == workflow.id,
                WorkflowStep.step_key == step_key
            ).first()
            if step and step.status in (StepStatus.PENDING, StepStatus.IN_PROGRESS):
                engine.complete_step(step.id, result, note)

    # 5. Send welcome/offer email
    from services.email_service import send_offer_email
    try:
        send_offer_email(emp, db=db)
        logger.info(f"Offer email sent to {emp.personal_email}")
    except Exception as e:
        logger.error(f"Failed to send offer email: {e}")

    # Calendar events are created later during form submission (when DOJ is confirmed)

    emp.current_stage = EmployeeStage.PRE_BOARDING
    db.commit()
    db.refresh(emp)
    return _employee_to_response(emp)


@router.post("/form/{form_token}", response_model=EmployeeResponse)
def submit_employee_form(form_token: str, data: EmployeeFormSubmission, db: Session = Depends(get_db)):
    """
    Submit employee details via the welcome form.
    Auto-completes related workflow steps and advances the pipeline.
    """
    emp = db.query(Employee).filter(Employee.form_token == form_token).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Invalid form token")

    # Update employee with form data
    emp.first_name = data.first_name
    emp.last_name = data.last_name
    emp.phone = data.phone
    emp.blood_group = data.blood_group
    emp.emergency_contact_name = data.emergency_contact_name
    emp.emergency_contact_phone = data.emergency_contact_phone
    emp.address = data.address
    emp.tshirt_size = data.tshirt_size
    emp.dietary_preference = data.dietary_preference
    emp.linkedin_url = data.linkedin_url or emp.linkedin_url
    emp.bio = data.bio or emp.bio
    emp.form_submitted = True
    emp.updated_at = datetime.utcnow()

    # Generate company email if not already set
    if not emp.company_email:
        emp.company_email = f"{data.first_name.lower()}.{data.last_name.lower()}@shellkode.com"

    # Grant portal access
    emp.portal_access_granted = True

    # Flush all changes so role_id, company_email etc are available for emails
    db.flush()
    db.refresh(emp)

    # Complete workflow steps automatically
    engine = WorkflowEngine(db)
    workflow = db.query(WorkflowInstance).filter(
        WorkflowInstance.employee_id == emp.id,
        WorkflowInstance.workflow_type == "pre_boarding"
    ).first()

    if workflow:
        import logging
        _logger = logging.getLogger("hr_scheduler")

        # ─── Steps that AUTO-COMPLETE immediately ───
        auto_complete_steps = {
            "form_submission": ("Form submitted by candidate", {"form_data": data.model_dump()}),
            "laptop_request": ("Laptop auto-requested based on domain", {"specs": {"domain": emp.domain.value if emp.domain else "general"}}),

            "buddy_assignment": ("Buddy auto-assigned from same department", {"auto": True}),
        }

        # ─── Steps that SEND EMAIL + WAIT FOR REPLY (not completed until admin confirms) ───
        waiting_steps = {
            "laptop_approval": ("Laptop request sent to admin — awaiting approval", {"sent_to": "admin"}),
            "create_email": ("Email sent to IT for company email creation", {"email": emp.company_email}),
            "id_card_generation": ("ID card request sent to admin — awaiting confirmation", {"sent_to": "admin"}),
            "access_card": ("Access card request sent to facility — awaiting confirmation", {"sent_to": "facility"}),
        }

        # Process auto-complete steps
        for step_key, (note, result) in auto_complete_steps.items():
            step = db.query(WorkflowStep).filter(
                WorkflowStep.workflow_instance_id == workflow.id,
                WorkflowStep.step_key == step_key
            ).first()
            if not step or step.status not in (StepStatus.PENDING, StepStatus.IN_PROGRESS):
                continue

            try:
                if step_key == "laptop_request":
                    engine.create_laptop_request(emp)
                    from services.email_service import send_laptop_request_email
                    send_laptop_request_email(emp, db=db)
                    _logger.info(f"🖥️ AUTO: Laptop request email sent for {emp.first_name}")

                elif step_key == "buddy_assignment":
                    from models import BuddyEmployee
                    buddy = db.query(BuddyEmployee).filter(
                        BuddyEmployee.department == (emp.domain.value if emp.domain else ""),
                        BuddyEmployee.is_active == True,
                    ).first()
                    if not buddy:
                        buddy = db.query(BuddyEmployee).filter(BuddyEmployee.is_active == True).first()

                    if buddy:
                        emp.buddy_name = buddy.name
                        emp.buddy_email = buddy.email
                        result = {"buddy_name": buddy.name, "buddy_email": buddy.email, "buddy_designation": buddy.designation}
                        note = f"Buddy assigned: {buddy.name} ({buddy.designation})"

                        from services.email_service import send_buddy_assignment_email
                        send_buddy_assignment_email(emp, buddy.name, buddy.email, buddy.designation, db=db)
                        _logger.info(f"🤝 AUTO: Buddy {buddy.name} assigned for {emp.first_name}")
                    else:
                        note = "No buddy available — marked for HR review"
                        _logger.warning(f"No buddy found for {emp.first_name}")

            except Exception as e:
                _logger.error(f"Step {step_key} failed: {e}")

            engine.complete_step(step.id, result, note)

        # Process waiting-for-reply steps (send email, mark WAITING_REPLY)
        for step_key, (note, result) in waiting_steps.items():
            step = db.query(WorkflowStep).filter(
                WorkflowStep.workflow_instance_id == workflow.id,
                WorkflowStep.step_key == step_key
            ).first()
            if not step or step.status not in (StepStatus.PENDING, StepStatus.IN_PROGRESS):
                continue

            try:
                if step_key == "id_card_generation":
                    from services.email_service import send_id_card_request_email
                    send_id_card_request_email(emp, db=db)
                    _logger.info(f"🪪 AUTO: ID card request email sent for {emp.first_name} — awaiting reply")

                elif step_key == "access_card":
                    from services.email_service import send_access_card_request_email
                    send_access_card_request_email(emp, db=db)
                    _logger.info(f"🔑 AUTO: Access card request email sent for {emp.first_name} — awaiting reply")

                elif step_key == "create_email":
                    # Email is auto-generated but IT needs to actually create it
                    from services.email_service import send_email, ADMIN_EMAIL
                    send_email(
                        to_email=ADMIN_EMAIL,
                        subject=f"📧 Create Company Email — {emp.first_name} {emp.last_name or ''} ({emp.role_id or 'N/A'})",
                        body_html=f"""
                        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto;">
                            <div style="background: linear-gradient(135deg, #2563eb, #3b82f6); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
                                <h1 style="color: white; margin: 0; font-size: 20px;">📧 Company Email Creation Request</h1>
                            </div>
                            <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                                <p>Please create the following email in Google Workspace:</p>
                                <table style="width: 100%; font-size: 14px;">
                                    <tr><td style="color: #6b7280; padding: 4px 0; width: 130px;">Employee</td><td style="font-weight: 600;">{emp.first_name} {emp.last_name or ''}</td></tr>
                                    <tr><td style="color: #6b7280; padding: 4px 0;">Email to create</td><td style="font-weight: 700; color: #2563eb;">{emp.company_email}</td></tr>
                                    <tr><td style="color: #6b7280; padding: 4px 0;">Department</td><td>{emp.domain.value if emp.domain else 'N/A'}</td></tr>
                                    <tr><td style="color: #6b7280; padding: 4px 0;">DOJ</td><td>{emp.doj}</td></tr>
                                </table>
                                <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; margin-top: 12px; font-size: 13px; color: #92400e;">
                                    ⏰ <strong>Reply to confirm</strong> once the email account is created.
                                </div>
                            </div>
                        </div>
                        """,
                        body_text=f"Create company email {emp.company_email} for {emp.first_name}. Reply to confirm.",
                        employee_id=emp.id,
                        db=db,
                    )
                    _logger.info(f"📧 AUTO: Company email creation request sent for {emp.first_name}")

            except Exception as e:
                _logger.error(f"Step {step_key} email failed: {e}")

            # Mark as IN_PROGRESS — NOT completed (waiting for admin reply)
            step.status = StepStatus.IN_PROGRESS
            step.started_at = step.started_at or __import__('datetime').datetime.utcnow()
            step.notes = note

        # Check if all pre-boarding steps are done → advance to ready_to_join
        all_steps = db.query(WorkflowStep).filter(
            WorkflowStep.workflow_instance_id == workflow.id
        ).all()
        incomplete = [s for s in all_steps if s.status not in (StepStatus.COMPLETED, StepStatus.SKIPPED)]
        if not incomplete:
            workflow.status = "completed"
            emp.current_stage = EmployeeStage.READY_TO_JOIN

    # AUTO: Create Day 1 calendar events
    if emp.doj:
        try:
            from services.calendar_service import create_day1_events
            created = create_day1_events(emp, db=db)
            import logging
            logging.getLogger("hr_scheduler").info(f"📅 AUTO: {len(created)} Day 1 calendar events created for {emp.first_name}")
        except Exception as e:
            import logging
            logging.getLogger("hr_scheduler").error(f"Calendar event creation failed: {e}")

    # AUTO: Schedule 30-60-90 day check-ins
    from models import CheckIn
    if emp.doj:
        existing = db.query(CheckIn).filter(CheckIn.employee_id == emp.id).count()
        if existing == 0:
            from datetime import timedelta
            for check_type, days in [("day_30", 30), ("day_60", 60), ("day_90", 90)]:
                ci = CheckIn(
                    employee_id=emp.id,
                    check_in_type=check_type,
                    scheduled_date=emp.doj + timedelta(days=days),
                    status="scheduled",
                    ai_questions=[
                        {"question": f"How would you rate your experience after {days} days? (1-5)", "type": "scale"},
                        {"question": "What has been your biggest win so far?", "type": "open"},
                        {"question": "What challenges have you faced?", "type": "open"},
                        {"question": "Do you feel supported by your team?", "type": "open"},
                        {"question": f"What are your goals for the next {30 if days < 90 else 0} days?", "type": "open"},
                    ],
                )
                db.add(ci)
            import logging
            logging.getLogger("hr_scheduler").info(f"📅 AUTO: Scheduled 30-60-90 check-ins for {emp.first_name}")

    db.commit()
    db.refresh(emp)
    return _employee_to_response(emp)


@router.get("/{employee_id}/workflows", response_model=list[WorkflowInstanceResponse])
def get_employee_workflows(employee_id: str, db: Session = Depends(get_db)):
    """Get all workflow instances for an employee."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    workflows = db.query(WorkflowInstance).options(
        joinedload(WorkflowInstance.steps)
    ).filter(
        WorkflowInstance.employee_id == employee_id
    ).all()

    return workflows


@router.get("/{employee_id}/documents", response_model=list[DocumentResponse])
def get_employee_documents(employee_id: str, db: Session = Depends(get_db)):
    """Get all documents for an employee."""
    documents = db.query(Document).filter(Document.employee_id == employee_id).all()
    return documents


@router.get("/{employee_id}/emails")
def get_employee_emails(employee_id: str, db: Session = Depends(get_db)):
    """Get all email logs for an employee."""
    from models import EmailLog
    logs = db.query(EmailLog).filter(
        EmailLog.employee_id == employee_id
    ).order_by(EmailLog.created_at.desc()).all()

    return [
        {
            "id": log.id,
            "direction": log.direction,
            "from_email": log.from_email,
            "to_email": log.to_email,
            "subject": log.subject,
            "body_preview": log.body_preview,
            "message_id": log.message_id,
            "processed": log.processed,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]


@router.delete("/{employee_id}", status_code=204)
def delete_employee(employee_id: str, db: Session = Depends(get_db)):
    """Delete an employee and all related data (cascading)."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    db.delete(emp)
    db.commit()
