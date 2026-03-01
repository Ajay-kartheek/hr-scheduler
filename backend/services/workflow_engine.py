"""
HR Scheduler Platform — Workflow Engine
Event-driven state machine that orchestrates the entire onboarding pipeline.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session

from models import (
    Employee, WorkflowInstance, WorkflowStep, LaptopRequest, SecurityChecklist,
    TrainingCompletion, TrainingModule, Notification, AuditLog, AIContent,
    WorkflowType, StepStatus, EmployeeStage, OfferStatus,
    LaptopStatus, NotificationType, NotificationChannel, AIContentType, AIContentStatus
)

logger = logging.getLogger(__name__)


# ─── Laptop Spec Mapping by Domain ──────────────────────────────────────────

LAPTOP_SPECS = {
    "AI": {
        "type": "High Performance Workstation",
        "cpu": "Intel i9 / Apple M3 Pro",
        "ram": "32GB",
        "storage": "1TB NVMe SSD",
        "gpu": "NVIDIA RTX 4080 / Apple GPU",
        "os": "Ubuntu 22.04 / macOS",
        "notes": "GPU required for ML/DL workloads"
    },
    "Cloud": {
        "type": "Standard Laptop",
        "cpu": "Intel i7 / Apple M3",
        "ram": "16GB",
        "storage": "512GB NVMe SSD",
        "gpu": "Integrated",
        "os": "macOS / Windows 11 Pro",
        "notes": "Cloud workloads are remote, standard spec sufficient"
    },
    "Data": {
        "type": "Performance Laptop",
        "cpu": "Intel i7 / Apple M3 Pro",
        "ram": "32GB",
        "storage": "1TB NVMe SSD",
        "gpu": "Integrated",
        "os": "macOS / Ubuntu 22.04",
        "notes": "Heavy data processing, needs high RAM"
    },
    "DB": {
        "type": "Standard Laptop",
        "cpu": "Intel i7 / Apple M3",
        "ram": "16GB",
        "storage": "512GB NVMe SSD",
        "gpu": "Integrated",
        "os": "macOS / Windows 11 Pro",
        "notes": "Database admin tools, standard spec"
    },
    "MSP": {
        "type": "Standard Laptop",
        "cpu": "Intel i5 / Apple M3",
        "ram": "16GB",
        "storage": "256GB NVMe SSD",
        "gpu": "Integrated",
        "os": "Windows 11 Pro",
        "notes": "Managed services, monitoring tools"
    },
    "Sales": {
        "type": "Ultrabook",
        "cpu": "Intel i5 / Apple M3",
        "ram": "8GB",
        "storage": "256GB NVMe SSD",
        "gpu": "Integrated",
        "os": "macOS / Windows 11",
        "notes": "Lightweight for travel, presentations"
    },
    "HR": {
        "type": "Standard Laptop",
        "cpu": "Intel i5 / Apple M3",
        "ram": "8GB",
        "storage": "256GB NVMe SSD",
        "gpu": "Integrated",
        "os": "macOS / Windows 11",
        "notes": "Office tools and HR software"
    },
    "DevOps": {
        "type": "Performance Laptop",
        "cpu": "Intel i7 / Apple M3 Pro",
        "ram": "16GB",
        "storage": "512GB NVMe SSD",
        "gpu": "Integrated",
        "os": "macOS / Ubuntu 22.04",
        "notes": "Docker, K8s, CI/CD tools"
    },
    "FullStack": {
        "type": "Performance Laptop",
        "cpu": "Intel i7 / Apple M3 Pro",
        "ram": "16GB",
        "storage": "512GB NVMe SSD",
        "gpu": "Integrated",
        "os": "macOS",
        "notes": "Full dev environment, multiple services"
    },
    "Security": {
        "type": "Performance Laptop",
        "cpu": "Intel i7 / Apple M3 Pro",
        "ram": "16GB",
        "storage": "512GB NVMe SSD",
        "gpu": "Integrated",
        "os": "macOS / Linux",
        "notes": "Security tools, VMs for testing"
    },
}

# ─── Security Hardening Checklist Template ───────────────────────────────────

SECURITY_CHECKLIST_ITEMS = [
    {"item_name": "Sprinto Agent Installation", "item_category": "security_tool", "order": 1},
    {"item_name": "MDM Enrollment", "item_category": "device_management", "order": 2},
    {"item_name": "Disk Encryption (FileVault/BitLocker)", "item_category": "security_tool", "order": 3},
    {"item_name": "Antivirus Installation", "item_category": "security_tool", "order": 4},
    {"item_name": "VPN Setup & Configuration", "item_category": "network", "order": 5},
    {"item_name": "Password Manager Setup", "item_category": "security_tool", "order": 6},
    {"item_name": "2FA Configuration", "item_category": "access", "order": 7},
    {"item_name": "OS Updates Applied", "item_category": "device_management", "order": 8},
    {"item_name": "Firewall Enabled", "item_category": "network", "order": 9},
    {"item_name": "Auto-lock Screen (5 min)", "item_category": "policy", "order": 10},
]


# ─── Pre-Boarding Workflow Steps ─────────────────────────────────────────────

PRE_BOARDING_STEPS = [
    {
        "step_key": "offer_acceptance",
        "step_name": "Offer Acceptance Confirmation",
        "step_description": "Monitor inbox for candidate's reply to the offer letter. AI classifies the response.",
        "assigned_role": "system",
        "order": 1,
    },
    {
        "step_key": "generate_role_id",
        "step_name": "Generate Role ID",
        "step_description": "Auto-generate a unique Role ID (e.g., SK-26-AI-0042) for the new hire.",
        "assigned_role": "system",
        "order": 2,
    },
    {
        "step_key": "send_welcome_email",
        "step_name": "Send Welcome Email & Form",
        "step_description": "Send personalized welcome email with postcard and data collection form link.",
        "assigned_role": "system",
        "order": 3,
    },
    {
        "step_key": "form_submission",
        "step_name": "Employee Details Form",
        "step_description": "Wait for the candidate to submit personal details via the welcome form.",
        "assigned_role": "employee",
        "order": 4,
    },
    {
        "step_key": "laptop_request",
        "step_name": "Request Laptop",
        "step_description": "Determine laptop specs by domain and send request to admin.",
        "assigned_role": "system",
        "order": 5,
    },
    {
        "step_key": "laptop_approval",
        "step_name": "Laptop Approval & Delivery",
        "step_description": "Monitor admin reply for laptop approval, track delivery date.",
        "assigned_role": "admin",
        "order": 6,
    },
    {
        "step_key": "create_email",
        "step_name": "Create Company Email",
        "step_description": "Create company email (firstname.lastname@shellkode.com) via Google Workspace Admin.",
        "assigned_role": "it",
        "order": 7,
    },
    {
        "step_key": "id_card_generation",
        "step_name": "Generate ID Card",
        "step_description": "Generate employee ID card using form data and photo.",
        "assigned_role": "admin",
        "order": 8,
    },
    {
        "step_key": "access_card",
        "step_name": "Request Access Card",
        "step_description": "Send access card request to facility admin.",
        "assigned_role": "admin",
        "order": 9,
    },
    {
        "step_key": "add_to_groups",
        "step_name": "Add to BU Groups",
        "step_description": "Add employee to BU-specific email groups and Teams channels.",
        "assigned_role": "it",
        "order": 10,
    },

    {
        "step_key": "buddy_assignment",
        "step_name": "Assign Buddy/Mentor",
        "step_description": "Assign a buddy from the same BU and notify them.",
        "assigned_role": "hr",
        "order": 12,
    },
    {
        "step_key": "pre_joining_email",
        "step_name": "Send Pre-Joining Details",
        "step_description": "Send joining details email 2 days before DOJ (where, when, whom to meet).",
        "assigned_role": "system",
        "order": 13,
    },
    {
        "step_key": "laptop_hardening",
        "step_name": "Laptop Security Hardening",
        "step_description": "Complete security checklist: Sprinto, MDM, encryption, VPN, etc.",
        "assigned_role": "it",
        "order": 14,
    },
]


# ─── Onboarding Workflow Steps ───────────────────────────────────────────────

ONBOARDING_STEPS = [
    {
        "step_key": "day1_induction",
        "step_name": "Day 1 Induction",
        "step_description": "Send induction plan, set up meetings with manager and HR.",
        "assigned_role": "hr",
        "order": 1,
    },
    {
        "step_key": "manager_meeting",
        "step_name": "Manager Introduction",
        "step_description": "1:1 meeting with reporting manager.",
        "assigned_role": "manager",
        "order": 2,
    },
    {
        "step_key": "hr_meeting",
        "step_name": "HR Session",
        "step_description": "HR walkthrough covering company overview, mission & vision, org hierarchy.",
        "assigned_role": "hr",
        "order": 3,
    },
    {
        "step_key": "it_setup",
        "step_name": "IT Setup & Handover",
        "step_description": "Laptop handover, tool installation, access provisioning.",
        "assigned_role": "it",
        "order": 4,
    },
    {
        "step_key": "team_introduction",
        "step_name": "Team Introduction",
        "step_description": "Introduce to team members and key stakeholders.",
        "assigned_role": "manager",
        "order": 5,
    },
    {
        "step_key": "security_training",
        "step_name": "Security & Policy Training",
        "step_description": "Complete security awareness and company policy training module.",
        "assigned_role": "employee",
        "order": 6,
    },
    {
        "step_key": "communication_ethics",
        "step_name": "Communication Ethics",
        "step_description": "Complete communication ethics training module.",
        "assigned_role": "employee",
        "order": 7,
    },
    {
        "step_key": "leave_policy",
        "step_name": "Leave Policy Acknowledgment",
        "step_description": "Review and acknowledge the leave policy.",
        "assigned_role": "employee",
        "order": 8,
    },
    {
        "step_key": "employee_spotlight",
        "step_name": "Employee Spotlight",
        "step_description": "AI generates welcome write-up and LinkedIn post for approval.",
        "assigned_role": "system",
        "order": 9,
    },
    {
        "step_key": "linkedin_post",
        "step_name": "LinkedIn Announcement",
        "step_description": "Publish approved LinkedIn welcome post.",
        "assigned_role": "hr",
        "order": 10,
    },
    {
        "step_key": "onboarding_complete",
        "step_name": "Onboarding Complete",
        "step_description": "All onboarding tasks completed. Schedule 30-60-90 day check-ins.",
        "assigned_role": "system",
        "order": 11,
    },
]


# ─── Workflow Engine ─────────────────────────────────────────────────────────

class WorkflowEngine:
    """
    Event-driven workflow engine that manages the entire onboarding lifecycle.
    """

    def __init__(self, db: Session):
        self.db = db

    def initiate_pre_boarding(self, employee: Employee) -> WorkflowInstance:
        """Create and start the pre-boarding workflow for an employee."""
        workflow = WorkflowInstance(
            employee_id=employee.id,
            workflow_type=WorkflowType.PRE_BOARDING,
            status="active",
        )
        self.db.add(workflow)
        self.db.flush()

        # Create all steps
        for step_def in PRE_BOARDING_STEPS:
            step = WorkflowStep(
                workflow_instance_id=workflow.id,
                step_key=step_def["step_key"],
                step_name=step_def["step_name"],
                step_description=step_def["step_description"],
                step_order=step_def["order"],
                assigned_role=step_def["assigned_role"],
                status=StepStatus.PENDING,
            )
            self.db.add(step)

        # Log
        self._log_audit(employee.id, "system", "workflow_initiated",
                        "workflow_instance", workflow.id,
                        {"type": "pre_boarding"})

        self.db.commit()
        logger.info(f"Pre-boarding workflow initiated for employee {employee.id}")
        return workflow

    def initiate_onboarding(self, employee: Employee) -> WorkflowInstance:
        """Create and start the onboarding workflow (Day 1)."""
        workflow = WorkflowInstance(
            employee_id=employee.id,
            workflow_type=WorkflowType.ONBOARDING,
            status="active",
        )
        self.db.add(workflow)
        self.db.flush()

        for step_def in ONBOARDING_STEPS:
            step = WorkflowStep(
                workflow_instance_id=workflow.id,
                step_key=step_def["step_key"],
                step_name=step_def["step_name"],
                step_description=step_def["step_description"],
                step_order=step_def["order"],
                assigned_role=step_def["assigned_role"],
                status=StepStatus.PENDING,
            )
            self.db.add(step)

        # Also create training completion records
        self._create_training_records(employee.id)

        # Grant portal access
        employee.portal_access_granted = True
        employee.current_stage = EmployeeStage.ONBOARDING

        self._log_audit(employee.id, "system", "onboarding_initiated",
                        "workflow_instance", workflow.id,
                        {"type": "onboarding"})

        self.db.commit()
        logger.info(f"Onboarding workflow initiated for employee {employee.id}")
        return workflow

    def complete_step(self, step_id: str, result_data: dict = None,
                      notes: str = None, actor: str = "system") -> WorkflowStep:
        """Mark a workflow step as completed and trigger downstream actions."""
        step = self.db.query(WorkflowStep).filter(WorkflowStep.id == step_id).first()
        if not step:
            raise ValueError(f"Step {step_id} not found")

        step.status = StepStatus.COMPLETED
        step.completed_at = datetime.utcnow()
        if result_data:
            step.result = result_data
        if notes:
            step.notes = notes

        # Update workflow current step
        workflow = step.workflow_instance
        workflow.current_step_order = step.step_order

        # Log
        employee_id = workflow.employee_id
        self._log_audit(employee_id, actor, "step_completed",
                        "workflow_step", step.id,
                        {"step_key": step.step_key, "step_name": step.step_name})

        # Trigger downstream actions
        self._on_step_completed(step, workflow)

        self.db.commit()
        return step

    def start_step(self, step_id: str) -> WorkflowStep:
        """Mark a step as in-progress."""
        step = self.db.query(WorkflowStep).filter(WorkflowStep.id == step_id).first()
        if not step:
            raise ValueError(f"Step {step_id} not found")

        step.status = StepStatus.IN_PROGRESS
        step.started_at = datetime.utcnow()
        self.db.commit()
        return step

    def mark_hitl(self, step_id: str, notes: str = None) -> WorkflowStep:
        """Mark a step as requiring human intervention."""
        step = self.db.query(WorkflowStep).filter(WorkflowStep.id == step_id).first()
        if not step:
            raise ValueError(f"Step {step_id} not found")

        step.status = StepStatus.HITL
        if notes:
            step.notes = notes

        # Create notification for HR
        employee = self.db.query(Employee).filter(Employee.id == step.workflow_instance.employee_id).first()
        self._create_notification(
            employee_id=employee.id,
            recipient_email="hr@shellkode.com",
            recipient_role="hr",
            notification_type=NotificationType.ACTION_REQUIRED,
            title=f"Action Required: {step.step_name}",
            message=f"Human intervention needed for {employee.first_name}'s onboarding step: {step.step_name}. {notes or ''}",
            action_url=f"/employees/{employee.id}"
        )

        self.db.commit()
        return step

    def skip_step(self, step_id: str, notes: str = None) -> WorkflowStep:
        """Skip a workflow step."""
        step = self.db.query(WorkflowStep).filter(WorkflowStep.id == step_id).first()
        if not step:
            raise ValueError(f"Step {step_id} not found")

        step.status = StepStatus.SKIPPED
        step.completed_at = datetime.utcnow()
        if notes:
            step.notes = notes

        self.db.commit()
        return step

    def generate_role_id(self, employee: Employee) -> str:
        """
        Generate a unique Role ID: SK-{YY}-{BU_CODE}-{SEQUENCE}
        Example: SK-26-AI-0042
        """
        year = datetime.utcnow().strftime("%y")
        domain_code = employee.domain.value[:3].upper()

        # Get the next sequence number for this BU+year
        existing = self.db.query(Employee).filter(
            Employee.role_id.like(f"SK-{year}-{domain_code}-%")
        ).count()
        sequence = str(existing + 1).zfill(4)

        role_id = f"SK-{year}-{domain_code}-{sequence}"
        employee.role_id = role_id
        self.db.commit()

        logger.info(f"Generated Role ID: {role_id} for employee {employee.id}")
        return role_id

    def create_laptop_request(self, employee: Employee) -> LaptopRequest:
        """Create a laptop request based on the employee's domain."""
        specs = LAPTOP_SPECS.get(employee.domain.value, LAPTOP_SPECS["FullStack"])

        laptop_req = LaptopRequest(
            employee_id=employee.id,
            domain=employee.domain,
            specs=specs,
            status=LaptopStatus.REQUESTED,
        )
        self.db.add(laptop_req)
        employee.laptop_status = LaptopStatus.REQUESTED

        self.db.commit()
        logger.info(f"Laptop request created for employee {employee.id}: {specs['type']}")
        return laptop_req

    def create_security_checklist(self, employee_id: str) -> list:
        """Create the security hardening checklist for an employee."""
        items = []
        for item_def in SECURITY_CHECKLIST_ITEMS:
            item = SecurityChecklist(
                employee_id=employee_id,
                item_name=item_def["item_name"],
                item_category=item_def["item_category"],
                order=item_def["order"],
            )
            self.db.add(item)
            items.append(item)

        self.db.commit()
        return items

    # ─── Internal Helpers ────────────────────────────────────────────────────

    def _on_step_completed(self, step: WorkflowStep, workflow: WorkflowInstance):
        """Handle post-step-completion logic and trigger next steps."""
        employee = self.db.query(Employee).filter(Employee.id == workflow.employee_id).first()

        # Check if the entire workflow is complete
        all_steps = self.db.query(WorkflowStep).filter(
            WorkflowStep.workflow_instance_id == workflow.id
        ).all()

        completed_or_skipped = all(
            s.status in (StepStatus.COMPLETED, StepStatus.SKIPPED) for s in all_steps
        )

        if completed_or_skipped:
            workflow.status = "completed"
            workflow.completed_at = datetime.utcnow()

            if workflow.workflow_type == WorkflowType.PRE_BOARDING:
                employee.current_stage = EmployeeStage.READY_TO_JOIN
            elif workflow.workflow_type == WorkflowType.ONBOARDING:
                employee.current_stage = EmployeeStage.COMPLETED

            logger.info(f"Workflow {workflow.id} completed for employee {employee.id}")

        # Auto-advance: start the next pending step
        next_step = self.db.query(WorkflowStep).filter(
            WorkflowStep.workflow_instance_id == workflow.id,
            WorkflowStep.step_order > step.step_order,
            WorkflowStep.status == StepStatus.PENDING
        ).order_by(WorkflowStep.step_order).first()

        if next_step and next_step.assigned_role == "system":
            next_step.status = StepStatus.IN_PROGRESS
            next_step.started_at = datetime.utcnow()

    def _create_training_records(self, employee_id: str):
        """Create training completion records for all active modules."""
        modules = self.db.query(TrainingModule).filter(
            TrainingModule.is_active == True
        ).all()

        for module in modules:
            completion = TrainingCompletion(
                employee_id=employee_id,
                module_id=module.id,
                status="not_started",
            )
            self.db.add(completion)

    def _create_notification(self, employee_id: str, recipient_email: str,
                             recipient_role: str, notification_type: NotificationType,
                             title: str, message: str, action_url: str = None):
        """Create an in-app notification."""
        notif = Notification(
            employee_id=employee_id,
            recipient_email=recipient_email,
            recipient_role=recipient_role,
            notification_type=notification_type,
            channel=NotificationChannel.BOTH,
            title=title,
            message=message,
            action_url=action_url,
        )
        self.db.add(notif)

    def _log_audit(self, employee_id: str, actor: str, action: str,
                   entity_type: str = None, entity_id: str = None,
                   details: dict = None):
        """Log an audit entry."""
        log = AuditLog(
            employee_id=employee_id,
            actor=actor,
            actor_role="system" if actor == "system" else "hr",
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
        )
        self.db.add(log)
