"""
HR Scheduler Platform — Pydantic Schemas
Request/Response models for the API layer.
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Any
from datetime import datetime, date
from enum import Enum


# ─── Enums (mirror SQLAlchemy enums for API) ─────────────────────────────────

class OfferStatusEnum(str, Enum):
    SENT = "sent"
    ACCEPTED = "accepted"
    NEGOTIATING = "negotiating"
    DECLINED = "declined"
    EXPIRED = "expired"


class EmployeeStageEnum(str, Enum):
    OFFER_SENT = "offer_sent"
    OFFER_ACCEPTED = "offer_accepted"
    PRE_BOARDING = "pre_boarding"
    READY_TO_JOIN = "ready_to_join"
    DAY_ONE = "day_one"
    ONBOARDING = "onboarding"
    COMPLETED = "completed"


class ExperienceTypeEnum(str, Enum):
    FRESHER = "fresher"
    EXPERIENCED = "experienced"


class DomainEnum(str, Enum):
    AI = "AI"
    CLOUD = "Cloud"
    DATA = "Data"
    DB = "DB"
    MSP = "MSP"
    SALES = "Sales"
    HR = "HR"
    DEVOPS = "DevOps"
    FULLSTACK = "FullStack"
    SECURITY = "Security"


class StepStatusEnum(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    WAITING_REPLY = "waiting_reply"
    COMPLETED = "completed"
    SKIPPED = "skipped"
    FAILED = "failed"
    HITL = "hitl"


class AIContentTypeEnum(str, Enum):
    WELCOME_WRITEUP = "welcome_writeup"
    LINKEDIN_POST = "linkedin_post"
    WELCOME_EMAIL = "welcome_email"
    POSTCARD = "postcard"
    FOLLOWUP_EMAIL = "followup_email"
    DASHBOARD_INSIGHT = "dashboard_insight"


class ToneEnum(str, Enum):
    PROFESSIONAL = "professional"
    CELEBRATORY = "celebratory"
    CASUAL = "casual"


# ─── Employee Schemas ────────────────────────────────────────────────────────

class EmployeeCreate(BaseModel):
    """Create a new employee (initiate offer)."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    personal_email: str
    phone: Optional[str] = None
    designation: str
    department_id: Optional[str] = None
    domain: DomainEnum
    experience_type: ExperienceTypeEnum
    doj: Optional[date] = None
    linkedin_url: Optional[str] = None
    bio: Optional[str] = None
    previous_company: Optional[str] = None
    years_experience: Optional[float] = None


class EmployeeFormSubmission(BaseModel):
    """Data submitted by the employee via the welcome form."""
    first_name: str
    last_name: str
    phone: str
    blood_group: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    address: Optional[str] = None
    tshirt_size: Optional[str] = None
    dietary_preference: Optional[str] = None
    linkedin_url: Optional[str] = None
    bio: Optional[str] = None


class EmployeeUpdate(BaseModel):
    """Update employee details."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    personal_email: Optional[str] = None
    phone: Optional[str] = None
    designation: Optional[str] = None
    department_id: Optional[str] = None
    domain: Optional[DomainEnum] = None
    experience_type: Optional[ExperienceTypeEnum] = None
    doj: Optional[date] = None
    linkedin_url: Optional[str] = None
    bio: Optional[str] = None
    current_stage: Optional[EmployeeStageEnum] = None
    offer_status: Optional[OfferStatusEnum] = None


class EmployeeResponse(BaseModel):
    """Employee response with all details."""
    id: str
    role_id: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    personal_email: str
    company_email: Optional[str] = None
    phone: Optional[str] = None
    photo_url: Optional[str] = None
    blood_group: Optional[str] = None
    designation: str
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    domain: str
    experience_type: str
    linkedin_url: Optional[str] = None
    bio: Optional[str] = None
    previous_company: Optional[str] = None
    years_experience: Optional[float] = None
    offer_date: Optional[date] = None
    offer_status: str
    doj: Optional[date] = None
    current_stage: str
    form_submitted: bool = False
    form_token: Optional[str] = None
    portal_token: Optional[str] = None
    portal_access_granted: bool = False
    documents_uploaded: bool = False
    laptop_status: str = "not_requested"
    bgv_status: str = "not_initiated"
    email_created: bool = False
    id_card_generated: bool = False
    access_card_requested: bool = False
    buddy_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EmployeeListResponse(BaseModel):
    """Paginated list of employees."""
    employees: List[EmployeeResponse]
    total: int
    page: int
    per_page: int


# ─── Workflow Schemas ────────────────────────────────────────────────────────

class WorkflowStepResponse(BaseModel):
    id: str
    step_key: str
    step_name: str
    step_description: Optional[str] = None
    step_order: int
    status: str
    assigned_to: Optional[str] = None
    assigned_role: Optional[str] = None
    due_date: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    reminder_count: int = 0
    escalated: bool = False
    result: Optional[Any] = None
    notes: Optional[str] = None
    ai_generated_content: Optional[str] = None

    class Config:
        from_attributes = True


class WorkflowInstanceResponse(BaseModel):
    id: str
    employee_id: str
    workflow_type: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    current_step_order: int = 0
    steps: List[WorkflowStepResponse] = []

    class Config:
        from_attributes = True


class StepActionRequest(BaseModel):
    """HR/Admin action on a workflow step."""
    action: str  # complete, skip, reassign, add_notes, hitl_resolve
    notes: Optional[str] = None
    result_data: Optional[dict] = None
    assigned_to: Optional[str] = None


# ─── Dashboard Schemas ───────────────────────────────────────────────────────

class DashboardMetrics(BaseModel):
    total_employees: int = 0
    active_onboardings: int = 0
    pending_actions: int = 0
    completed_this_month: int = 0
    avg_onboarding_days: float = 0.0
    offer_acceptance_rate: float = 0.0
    overdue_steps: int = 0


class PipelineColumn(BaseModel):
    stage: str
    label: str
    count: int
    employees: List[EmployeeResponse]


class PipelineResponse(BaseModel):
    columns: List[PipelineColumn]


class RecentActivity(BaseModel):
    id: str
    employee_name: Optional[str] = None
    action: str
    details: Optional[str] = None
    timestamp: datetime
    actor: str


# ─── AI Content Schemas ──────────────────────────────────────────────────────

class AIGenerateRequest(BaseModel):
    employee_id: str
    content_type: AIContentTypeEnum
    tone: ToneEnum = ToneEnum.PROFESSIONAL
    additional_context: Optional[str] = None


class AIContentResponse(BaseModel):
    id: str
    employee_id: str
    content_type: str
    content: str
    tone: str
    status: str
    extra_data: Optional[dict] = None
    generated_at: datetime

    class Config:
        from_attributes = True


class EmailClassificationResult(BaseModel):
    status: str  # accepted, declined, negotiating, unclear
    confidence: float
    extracted_points: List[str] = []
    suggested_action: str
    summary: str


# ─── Notification Schemas ────────────────────────────────────────────────────

class NotificationResponse(BaseModel):
    id: str
    employee_id: Optional[str] = None
    title: str
    message: str
    notification_type: str
    read: bool
    action_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Training Schemas ────────────────────────────────────────────────────────

class TrainingModuleResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    training_type: str
    content_html: Optional[str] = None
    video_url: Optional[str] = None
    duration_minutes: int
    order: int
    requires_acknowledgment: bool

    class Config:
        from_attributes = True


class TrainingCompletionResponse(BaseModel):
    id: str
    module: TrainingModuleResponse
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    acknowledgment_signed: bool = False
    quiz_score: Optional[float] = None

    class Config:
        from_attributes = True


class TrainingProgressResponse(BaseModel):
    employee_id: str
    total_modules: int
    completed: int
    in_progress: int
    not_started: int
    completion_percentage: float
    modules: List[TrainingCompletionResponse]


class QuizSubmission(BaseModel):
    module_id: str
    answers: List[int]  # selected option indices


class QuizResult(BaseModel):
    score: float
    passed: bool
    total_questions: int
    correct_answers: int
    feedback: List[dict]


# ─── Org Chart Schemas ───────────────────────────────────────────────────────

class DepartmentResponse(BaseModel):
    id: str
    name: str
    code: str
    parent_id: Optional[str] = None
    head_name: Optional[str] = None
    head_email: Optional[str] = None
    email_group: Optional[str] = None
    children: List["DepartmentResponse"] = []
    employee_count: int = 0

    class Config:
        from_attributes = True


class OrgChartNode(BaseModel):
    id: str
    name: str
    code: str
    head_name: Optional[str] = None
    employee_count: int = 0
    children: List["OrgChartNode"] = []
    new_hires: List[EmployeeResponse] = []


# ─── Laptop Schemas ──────────────────────────────────────────────────────────

class LaptopRequestResponse(BaseModel):
    id: str
    employee_id: str
    domain: str
    specs: dict
    status: str
    requested_at: datetime
    approved_at: Optional[datetime] = None
    expected_delivery: Optional[date] = None
    hardening_completed: bool = False
    hardening_checklist: Optional[dict] = None

    class Config:
        from_attributes = True


class LaptopActionRequest(BaseModel):
    action: str  # approve, reject, mark_delivered, update_delivery_date
    notes: Optional[str] = None
    expected_delivery: Optional[date] = None


# ─── Document Schemas ────────────────────────────────────────────────────────

class DocumentResponse(BaseModel):
    id: str
    document_type: str
    file_name: str
    file_url: str
    verified: bool
    uploaded_at: datetime

    class Config:
        from_attributes = True


# ─── Portal Schemas ──────────────────────────────────────────────────────────

class PortalDashboard(BaseModel):
    employee: EmployeeResponse
    training_progress: TrainingProgressResponse
    workflow_steps: List[WorkflowStepResponse]
    notifications: List[NotificationResponse]
    company_info: dict
