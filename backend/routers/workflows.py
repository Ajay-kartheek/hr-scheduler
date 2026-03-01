"""
HR Scheduler — Workflow Router
Manage workflow steps: view, complete, skip, HITL actions.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import (
    WorkflowInstance, WorkflowStep, Employee,
    StepStatus, WorkflowType
)
from schemas import (
    WorkflowInstanceResponse, WorkflowStepResponse, StepActionRequest
)
from services.workflow_engine import WorkflowEngine

router = APIRouter(prefix="/api/workflows", tags=["Workflows"])


@router.get("/", response_model=list[WorkflowInstanceResponse])
def list_workflows(
    workflow_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List all workflow instances with optional filtering."""
    query = db.query(WorkflowInstance).options(joinedload(WorkflowInstance.steps))

    if workflow_type:
        query = query.filter(WorkflowInstance.workflow_type == workflow_type)
    if status:
        query = query.filter(WorkflowInstance.status == status)

    return query.order_by(WorkflowInstance.started_at.desc()).all()


@router.get("/{workflow_id}", response_model=WorkflowInstanceResponse)
def get_workflow(workflow_id: str, db: Session = Depends(get_db)):
    """Get a specific workflow instance with all steps."""
    workflow = db.query(WorkflowInstance).options(
        joinedload(WorkflowInstance.steps)
    ).filter(WorkflowInstance.id == workflow_id).first()

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow


@router.post("/steps/{step_id}/action", response_model=WorkflowStepResponse)
def perform_step_action(step_id: str, action: StepActionRequest, db: Session = Depends(get_db)):
    """
    Perform an action on a workflow step.
    Actions: complete, skip, start, hitl, reassign, add_notes
    """
    engine = WorkflowEngine(db)

    if action.action == "complete":
        step = engine.complete_step(step_id, action.result_data, action.notes, actor="hr")
    elif action.action == "skip":
        step = engine.skip_step(step_id, action.notes)
    elif action.action == "start":
        step = engine.start_step(step_id)
    elif action.action == "hitl":
        step = engine.mark_hitl(step_id, action.notes)
    elif action.action == "reassign":
        step = db.query(WorkflowStep).filter(WorkflowStep.id == step_id).first()
        if not step:
            raise HTTPException(status_code=404, detail="Step not found")
        step.assigned_to = action.assigned_to
        step.notes = action.notes
        db.commit()
    elif action.action == "add_notes":
        step = db.query(WorkflowStep).filter(WorkflowStep.id == step_id).first()
        if not step:
            raise HTTPException(status_code=404, detail="Step not found")
        step.notes = action.notes
        db.commit()
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {action.action}")

    db.refresh(step)
    return step


@router.get("/steps/pending", response_model=list[WorkflowStepResponse])
def get_pending_steps(
    assigned_role: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Get all pending/HITL steps across all workflows."""
    query = db.query(WorkflowStep).filter(
        WorkflowStep.status.in_([StepStatus.PENDING, StepStatus.IN_PROGRESS,
                                  StepStatus.WAITING_REPLY, StepStatus.HITL])
    )

    if assigned_role:
        query = query.filter(WorkflowStep.assigned_role == assigned_role)

    return query.order_by(WorkflowStep.step_order).all()


@router.post("/{employee_id}/initiate-onboarding", response_model=WorkflowInstanceResponse)
def initiate_onboarding(employee_id: str, db: Session = Depends(get_db)):
    """Manually initiate the onboarding workflow for Day 1."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Check if onboarding already exists
    existing = db.query(WorkflowInstance).filter(
        WorkflowInstance.employee_id == employee_id,
        WorkflowInstance.workflow_type == WorkflowType.ONBOARDING
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Onboarding workflow already exists")

    engine = WorkflowEngine(db)
    workflow = engine.initiate_onboarding(emp)

    db.refresh(workflow)
    return db.query(WorkflowInstance).options(
        joinedload(WorkflowInstance.steps)
    ).filter(WorkflowInstance.id == workflow.id).first()
