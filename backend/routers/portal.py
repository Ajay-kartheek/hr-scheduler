"""
HR Scheduler — Portal Router
Public endpoints for the new hire self-service portal.
Authenticated via unique tokens (no login required).
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import (
    Employee, WorkflowInstance, WorkflowStep, TrainingCompletion,
    TrainingModule, Notification, QuizQuestion
)
from schemas import (
    PortalDashboard, EmployeeResponse, TrainingProgressResponse,
    TrainingCompletionResponse, TrainingModuleResponse,
    WorkflowStepResponse, NotificationResponse, QuizSubmission, QuizResult
)
from routers.employees import _employee_to_response

router = APIRouter(prefix="/api/portal", tags=["Employee Portal"])


def _get_employee_by_token(portal_token: str, db: Session) -> Employee:
    """Look up employee by portal token."""
    emp = db.query(Employee).options(
        joinedload(Employee.department)
    ).filter(Employee.portal_token == portal_token).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Invalid portal token")
    if not emp.portal_access_granted:
        raise HTTPException(status_code=403, detail="Portal access not yet granted")
    return emp


@router.get("/{portal_token}", response_model=PortalDashboard)
def get_portal_dashboard(portal_token: str, db: Session = Depends(get_db)):
    """Get the full portal dashboard for a new hire."""
    emp = _get_employee_by_token(portal_token, db)

    # Training progress
    training_progress = _get_training_progress(emp.id, db)

    # Workflow steps (onboarding only, employee-assigned)
    onboarding = db.query(WorkflowInstance).filter(
        WorkflowInstance.employee_id == emp.id,
        WorkflowInstance.workflow_type == "onboarding"
    ).first()

    workflow_steps = []
    if onboarding:
        steps = db.query(WorkflowStep).filter(
            WorkflowStep.workflow_instance_id == onboarding.id
        ).order_by(WorkflowStep.step_order).all()
        workflow_steps = steps

    # Notifications for this employee
    notifications = db.query(Notification).filter(
        Notification.employee_id == emp.id,
        Notification.read == False
    ).order_by(Notification.created_at.desc()).limit(10).all()

    company_info = {
        "name": "Shellkode Technologies",
        "mission": "To deliver innovative technology solutions that transform businesses and empower teams.",
        "vision": "To be the most trusted technology partner for organizations worldwide.",
        "values": ["Innovation", "Integrity", "Collaboration", "Excellence", "Customer First"],
        "office_address": "Shellkode Technologies, Bangalore, India",
        "hr_email": "hr@shellkode.com",
        "website": "https://shellkode.com",
    }

    return PortalDashboard(
        employee=_employee_to_response(emp),
        training_progress=training_progress,
        workflow_steps=workflow_steps,
        notifications=notifications,
        company_info=company_info,
    )


@router.get("/{portal_token}/training", response_model=TrainingProgressResponse)
def get_portal_training(portal_token: str, db: Session = Depends(get_db)):
    """Get training progress for the employee."""
    emp = _get_employee_by_token(portal_token, db)
    return _get_training_progress(emp.id, db)


@router.post("/{portal_token}/training/{module_id}/start")
def start_training_module(portal_token: str, module_id: str, db: Session = Depends(get_db)):
    """Mark a training module as started."""
    emp = _get_employee_by_token(portal_token, db)

    completion = db.query(TrainingCompletion).filter(
        TrainingCompletion.employee_id == emp.id,
        TrainingCompletion.module_id == module_id
    ).first()

    if not completion:
        raise HTTPException(status_code=404, detail="Training module not found for this employee")

    completion.status = "in_progress"
    completion.started_at = datetime.utcnow()
    db.commit()

    return {"status": "started"}


@router.post("/{portal_token}/training/{module_id}/complete")
def complete_training_module(portal_token: str, module_id: str, db: Session = Depends(get_db)):
    """Mark a training module as completed."""
    emp = _get_employee_by_token(portal_token, db)

    completion = db.query(TrainingCompletion).filter(
        TrainingCompletion.employee_id == emp.id,
        TrainingCompletion.module_id == module_id
    ).first()

    if not completion:
        raise HTTPException(status_code=404, detail="Training module not found")

    completion.status = "completed"
    completion.completed_at = datetime.utcnow()
    db.commit()

    return {"status": "completed"}


@router.post("/{portal_token}/training/{module_id}/acknowledge")
def acknowledge_policy(portal_token: str, module_id: str, db: Session = Depends(get_db)):
    """Digitally acknowledge a policy/training module."""
    emp = _get_employee_by_token(portal_token, db)

    completion = db.query(TrainingCompletion).filter(
        TrainingCompletion.employee_id == emp.id,
        TrainingCompletion.module_id == module_id
    ).first()

    if not completion:
        raise HTTPException(status_code=404, detail="Training module not found")

    completion.acknowledgment_signed = True
    completion.status = "completed"
    completion.completed_at = datetime.utcnow()
    db.commit()

    return {"status": "acknowledged"}


@router.post("/{portal_token}/training/{module_id}/quiz", response_model=QuizResult)
def submit_quiz(portal_token: str, module_id: str, submission: QuizSubmission, db: Session = Depends(get_db)):
    """Submit a quiz for a training module."""
    emp = _get_employee_by_token(portal_token, db)

    questions = db.query(QuizQuestion).filter(
        QuizQuestion.module_id == module_id
    ).order_by(QuizQuestion.order).all()

    if not questions:
        raise HTTPException(status_code=404, detail="No quiz found for this module")

    correct = 0
    feedback = []
    for i, q in enumerate(questions):
        user_answer = submission.answers[i] if i < len(submission.answers) else -1
        is_correct = user_answer == q.correct_answer
        if is_correct:
            correct += 1
        feedback.append({
            "question": q.question,
            "your_answer": user_answer,
            "correct_answer": q.correct_answer,
            "is_correct": is_correct,
            "explanation": q.explanation,
        })

    score = (correct / len(questions)) * 100 if questions else 0
    passed = score >= 70

    # Update completion
    completion = db.query(TrainingCompletion).filter(
        TrainingCompletion.employee_id == emp.id,
        TrainingCompletion.module_id == module_id
    ).first()
    if completion:
        completion.quiz_score = score
        if passed:
            completion.status = "completed"
            completion.completed_at = datetime.utcnow()
        db.commit()

    return QuizResult(
        score=score, passed=passed,
        total_questions=len(questions), correct_answers=correct,
        feedback=feedback,
    )


# Form endpoint (public, no portal auth needed — uses form_token)
@router.get("/form/{form_token}")
def get_form_details(form_token: str, db: Session = Depends(get_db)):
    """Get employee details for the welcome form page."""
    emp = db.query(Employee).filter(Employee.form_token == form_token).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Invalid form token")

    return {
        "designation": emp.designation,
        "domain": emp.domain.value,
        "first_name": emp.first_name,
        "last_name": emp.last_name,
        "email": emp.personal_email,
        "form_submitted": emp.form_submitted,
        "company_name": "Shellkode Technologies",
    }


def _get_training_progress(employee_id: str, db: Session) -> TrainingProgressResponse:
    """Build training progress response."""
    completions = db.query(TrainingCompletion).options(
        joinedload(TrainingCompletion.module)
    ).filter(
        TrainingCompletion.employee_id == employee_id
    ).all()

    total = len(completions)
    completed = sum(1 for c in completions if c.status == "completed")
    in_progress = sum(1 for c in completions if c.status == "in_progress")
    not_started = sum(1 for c in completions if c.status == "not_started")

    modules = []
    for c in completions:
        mod = TrainingModuleResponse(
            id=c.module.id, title=c.module.title,
            description=c.module.description,
            training_type=c.module.training_type.value,
            content_html=c.module.content_html,
            video_url=c.module.video_url,
            duration_minutes=c.module.duration_minutes,
            order=c.module.order,
            requires_acknowledgment=c.module.requires_acknowledgment,
        )
        modules.append(TrainingCompletionResponse(
            id=c.id, module=mod, status=c.status,
            started_at=c.started_at, completed_at=c.completed_at,
            acknowledgment_signed=c.acknowledgment_signed,
            quiz_score=c.quiz_score,
        ))

    return TrainingProgressResponse(
        employee_id=employee_id,
        total_modules=total, completed=completed,
        in_progress=in_progress, not_started=not_started,
        completion_percentage=round((completed / total * 100) if total > 0 else 0, 1),
        modules=sorted(modules, key=lambda m: m.module.order),
    )
