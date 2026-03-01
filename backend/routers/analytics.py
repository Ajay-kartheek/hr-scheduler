"""
HR Scheduler — Analytics Router
Provides analytics endpoints for onboarding metrics, bottleneck analysis, and SLA tracking.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import func, case
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from database import get_db
from models import (
    Employee, EmployeeStage, WorkflowStep, WorkflowInstance,
    StepStatus, EmailLog, LaptopRequest, LaptopStatus
)

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/overview")
def get_analytics_overview(db: Session = Depends(get_db)):
    """Main analytics overview — pipeline metrics, bottlenecks, SLAs."""
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)

    total = db.query(Employee).count()
    active = db.query(Employee).filter(
        Employee.current_stage.in_([
            EmployeeStage.OFFER_SENT, EmployeeStage.OFFER_ACCEPTED,
            EmployeeStage.PRE_BOARDING, EmployeeStage.READY_TO_JOIN,
            EmployeeStage.DAY_ONE, EmployeeStage.ONBOARDING
        ])
    ).count()
    completed = db.query(Employee).filter(
        Employee.current_stage == EmployeeStage.COMPLETED
    ).count()

    # Stage distribution
    stage_counts = db.query(
        Employee.current_stage, func.count(Employee.id)
    ).group_by(Employee.current_stage).all()
    stage_distribution = {str(s.value) if hasattr(s, 'value') else str(s): c for s, c in stage_counts}

    # Domain distribution
    domain_counts = db.query(
        Employee.domain, func.count(Employee.id)
    ).group_by(Employee.domain).all()
    domain_distribution = {str(d.value) if hasattr(d, 'value') else str(d): c for d, c in domain_counts}

    # Average time per stage (for completed employees)
    # Calculate from workflow steps
    all_steps = db.query(WorkflowStep).filter(
        WorkflowStep.status == StepStatus.COMPLETED,
        WorkflowStep.started_at.isnot(None),
        WorkflowStep.completed_at.isnot(None),
    ).all()

    step_durations = {}
    for step in all_steps:
        if step.started_at and step.completed_at:
            duration_hours = (step.completed_at - step.started_at).total_seconds() / 3600
            key = step.step_name or step.step_key
            if key not in step_durations:
                step_durations[key] = []
            step_durations[key].append(duration_hours)

    bottlenecks = []
    for name, durations in step_durations.items():
        avg_hours = sum(durations) / len(durations)
        bottlenecks.append({
            "step": name,
            "avg_hours": round(avg_hours, 1),
            "count": len(durations),
        })
    bottlenecks.sort(key=lambda x: x["avg_hours"], reverse=True)

    # Pending steps
    pending = db.query(WorkflowStep).filter(
        WorkflowStep.status.in_([StepStatus.PENDING, StepStatus.IN_PROGRESS, StepStatus.HITL])
    ).count()
    overdue_steps = []
    overdue_qs = db.query(WorkflowStep).filter(
        WorkflowStep.status.in_([StepStatus.PENDING, StepStatus.IN_PROGRESS]),
        WorkflowStep.started_at.isnot(None),
    ).all()
    for s in overdue_qs:
        if s.started_at and (now - s.started_at).days >= 2:
            wi = db.query(WorkflowInstance).filter(WorkflowInstance.id == s.workflow_instance_id).first()
            emp = db.query(Employee).filter(Employee.id == wi.employee_id).first() if wi else None
            overdue_steps.append({
                "step": s.step_name or s.step_key,
                "employee": f"{emp.first_name or ''} {emp.last_name or ''}".strip() if emp else "Unknown",
                "employee_id": emp.id if emp else None,
                "days_pending": (now - s.started_at).days,
            })

    # Email stats
    total_emails = db.query(EmailLog).count()
    sent_emails = db.query(EmailLog).filter(EmailLog.direction == "outbound").count()
    received_emails = db.query(EmailLog).filter(EmailLog.direction == "inbound").count()

    # Laptop stats
    laptops_requested = db.query(LaptopRequest).count()
    laptops_delivered = db.query(LaptopRequest).filter(
        LaptopRequest.status == LaptopStatus.DELIVERED
    ).count()

    # Monthly trend (last 6 months)
    monthly_trend = []
    for i in range(5, -1, -1):
        month_start = (now.replace(day=1) - timedelta(days=30 * i)).replace(day=1)
        if i > 0:
            month_end = (now.replace(day=1) - timedelta(days=30 * (i - 1))).replace(day=1)
        else:
            month_end = now
        count = db.query(Employee).filter(
            Employee.created_at >= month_start,
            Employee.created_at < month_end,
        ).count()
        monthly_trend.append({
            "month": month_start.strftime("%b %Y"),
            "hires": count,
        })

    return {
        "summary": {
            "total_employees": total,
            "active_onboardings": active,
            "completed": completed,
            "pending_steps": pending,
            "overdue_count": len(overdue_steps),
        },
        "stage_distribution": stage_distribution,
        "domain_distribution": domain_distribution,
        "bottlenecks": bottlenecks[:5],
        "overdue_steps": overdue_steps[:10],
        "email_stats": {
            "total": total_emails,
            "sent": sent_emails,
            "received": received_emails,
        },
        "laptop_stats": {
            "requested": laptops_requested,
            "delivered": laptops_delivered,
        },
        "monthly_trend": monthly_trend,
    }


@router.get("/employee/{employee_id}/timeline")
def get_employee_timeline(employee_id: str, db: Session = Depends(get_db)):
    """Get detailed onboarding timeline for a specific employee."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        return {"error": "Employee not found"}

    # Get workflow steps
    workflows = db.query(WorkflowInstance).filter(
        WorkflowInstance.employee_id == employee_id
    ).all()

    events = []
    for wf in workflows:
        steps = db.query(WorkflowStep).filter(
            WorkflowStep.workflow_instance_id == wf.id
        ).order_by(WorkflowStep.order).all()

        for step in steps:
            events.append({
                "step": step.step_name or step.step_key,
                "status": step.status.value if hasattr(step.status, 'value') else str(step.status),
                "started_at": step.started_at.isoformat() if step.started_at else None,
                "completed_at": step.completed_at.isoformat() if step.completed_at else None,
                "notes": step.notes,
                "duration_hours": round((step.completed_at - step.started_at).total_seconds() / 3600, 1)
                    if step.started_at and step.completed_at else None,
            })

    # Get email activity
    emails = db.query(EmailLog).filter(EmailLog.employee_id == employee_id).order_by(EmailLog.created_at).all()
    for email in emails:
        events.append({
            "step": f"Email {'sent' if email.direction == 'outbound' else 'received'}: {email.subject or 'No subject'}",
            "status": "completed",
            "started_at": email.created_at.isoformat() if email.created_at else None,
            "completed_at": email.created_at.isoformat() if email.created_at else None,
            "notes": email.body_preview,
            "duration_hours": None,
        })

    return {
        "employee": {
            "name": f"{emp.first_name or ''} {emp.last_name or ''}".strip(),
            "designation": emp.designation,
            "stage": emp.current_stage.value if hasattr(emp.current_stage, 'value') else str(emp.current_stage),
            "doj": str(emp.doj) if emp.doj else None,
        },
        "events": events,
    }
