"""
HR Scheduler — Dashboard Router
Aggregated metrics, pipeline view, and activity feed for the HR dashboard.
"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from database import get_db
from models import (
    Employee, WorkflowInstance, WorkflowStep, Notification, AuditLog,
    EmployeeStage, StepStatus, OfferStatus
)
from schemas import (
    DashboardMetrics, PipelineResponse, PipelineColumn, RecentActivity, EmployeeResponse
)
from routers.employees import _employee_to_response

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/metrics", response_model=DashboardMetrics)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    """Get aggregated dashboard metrics."""
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    total = db.query(Employee).count()

    active_stages = [
        EmployeeStage.OFFER_ACCEPTED, EmployeeStage.PRE_BOARDING,
        EmployeeStage.READY_TO_JOIN, EmployeeStage.DAY_ONE,
        EmployeeStage.ONBOARDING
    ]
    active = db.query(Employee).filter(Employee.current_stage.in_(active_stages)).count()

    pending = db.query(WorkflowStep).filter(
        WorkflowStep.status.in_([StepStatus.PENDING, StepStatus.IN_PROGRESS,
                                  StepStatus.WAITING_REPLY, StepStatus.HITL])
    ).count()

    completed_month = db.query(Employee).filter(
        Employee.current_stage == EmployeeStage.COMPLETED,
        Employee.updated_at >= month_start
    ).count()

    # Overdue steps (due date passed and not completed)
    overdue = db.query(WorkflowStep).filter(
        WorkflowStep.due_date < now,
        WorkflowStep.status.not_in([StepStatus.COMPLETED, StepStatus.SKIPPED])
    ).count()

    # Offer acceptance rate
    total_offers = db.query(Employee).filter(Employee.offer_date.isnot(None)).count()
    accepted_offers = db.query(Employee).filter(
        Employee.offer_status == OfferStatus.ACCEPTED
    ).count()
    acceptance_rate = (accepted_offers / total_offers * 100) if total_offers > 0 else 0

    # Average onboarding days
    completed_workflows = db.query(WorkflowInstance).filter(
        WorkflowInstance.status == "completed"
    ).all()
    if completed_workflows:
        total_days = sum(
            (w.completed_at - w.started_at).days
            for w in completed_workflows if w.completed_at
        )
        avg_days = total_days / len(completed_workflows)
    else:
        avg_days = 0

    return DashboardMetrics(
        total_employees=total,
        active_onboardings=active,
        pending_actions=pending,
        completed_this_month=completed_month,
        avg_onboarding_days=round(avg_days, 1),
        offer_acceptance_rate=round(acceptance_rate, 1),
        overdue_steps=overdue,
    )


@router.get("/pipeline", response_model=PipelineResponse)
def get_pipeline(db: Session = Depends(get_db)):
    """Get the Kanban pipeline view of all employees by stage."""
    stages = [
        ("offer_sent", "Offer Sent"),
        ("offer_accepted", "Offer Accepted"),
        ("pre_boarding", "Pre-Boarding"),
        ("ready_to_join", "Ready to Join"),
        ("day_one", "Day 1"),
        ("onboarding", "Onboarding"),
        ("completed", "Completed"),
    ]

    columns = []
    for stage_value, stage_label in stages:
        employees = db.query(Employee).options(
            joinedload(Employee.department)
        ).filter(
            Employee.current_stage == stage_value
        ).order_by(Employee.doj).all()

        columns.append(PipelineColumn(
            stage=stage_value,
            label=stage_label,
            count=len(employees),
            employees=[_employee_to_response(e) for e in employees],
        ))

    return PipelineResponse(columns=columns)


@router.get("/activity", response_model=list[RecentActivity])
def get_recent_activity(limit: int = 20, db: Session = Depends(get_db)):
    """Get recent activity feed."""
    logs = db.query(AuditLog).options(
        joinedload(AuditLog.employee)
    ).order_by(AuditLog.timestamp.desc()).limit(limit).all()

    activities = []
    for log in logs:
        emp_name = None
        if log.employee:
            emp_name = f"{log.employee.first_name or ''} {log.employee.last_name or ''}".strip()
            if not emp_name:
                emp_name = log.employee.personal_email

        activities.append(RecentActivity(
            id=log.id,
            employee_name=emp_name,
            action=log.action.replace("_", " ").title(),
            details=str(log.details) if log.details else None,
            timestamp=log.timestamp,
            actor=log.actor,
        ))

    return activities
