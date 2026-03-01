"""
HR Scheduler Platform — SQLAlchemy Models
All database entities for the HR onboarding automation system.
"""

import uuid
from datetime import datetime, date
from sqlalchemy import (
    Column, String, Integer, Text, Boolean, DateTime, Date,
    ForeignKey, Enum as SAEnum, JSON, Float
)
from sqlalchemy.orm import relationship
from database import Base
import enum


# ─── Enums ───────────────────────────────────────────────────────────────────

class OfferStatus(str, enum.Enum):
    SENT = "sent"
    ACCEPTED = "accepted"
    NEGOTIATING = "negotiating"
    DECLINED = "declined"
    EXPIRED = "expired"


class EmployeeStage(str, enum.Enum):
    OFFER_SENT = "offer_sent"
    OFFER_ACCEPTED = "offer_accepted"
    PRE_BOARDING = "pre_boarding"
    READY_TO_JOIN = "ready_to_join"
    DAY_ONE = "day_one"
    ONBOARDING = "onboarding"
    COMPLETED = "completed"


class ExperienceType(str, enum.Enum):
    FRESHER = "fresher"
    EXPERIENCED = "experienced"


class Domain(str, enum.Enum):
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


class WorkflowType(str, enum.Enum):
    PRE_BOARDING = "pre_boarding"
    ONBOARDING = "onboarding"


class StepStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    WAITING_REPLY = "waiting_reply"
    COMPLETED = "completed"
    SKIPPED = "skipped"
    FAILED = "failed"
    HITL = "hitl"  # Human-in-the-loop required


class NotificationType(str, enum.Enum):
    INFO = "info"
    ACTION_REQUIRED = "action_required"
    ESCALATION = "escalation"
    REMINDER = "reminder"
    ALERT = "alert"


class NotificationChannel(str, enum.Enum):
    IN_APP = "in_app"
    EMAIL = "email"
    BOTH = "both"


class AIContentType(str, enum.Enum):
    WELCOME_WRITEUP = "welcome_writeup"
    LINKEDIN_POST = "linkedin_post"
    WELCOME_EMAIL = "welcome_email"
    POSTCARD = "postcard"
    FOLLOWUP_EMAIL = "followup_email"
    DASHBOARD_INSIGHT = "dashboard_insight"


class AIContentStatus(str, enum.Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    PUBLISHED = "published"
    REJECTED = "rejected"


class TrainingType(str, enum.Enum):
    INDUCTION = "induction"
    SECURITY = "security"
    COMMUNICATION = "communication"
    LEAVE_POLICY = "leave_policy"
    CUSTOM = "custom"


class LaptopStatus(str, enum.Enum):
    NOT_REQUESTED = "not_requested"
    REQUESTED = "requested"
    APPROVED = "approved"
    REJECTED = "rejected"
    ORDERED = "ordered"
    DELIVERED = "delivered"
    HARDENED = "hardened"
    ASSIGNED = "assigned"


class BGVStatus(str, enum.Enum):
    NOT_INITIATED = "not_initiated"
    INITIATED = "initiated"
    IN_PROGRESS = "in_progress"
    CLEAR = "clear"
    FLAGGED = "flagged"


def generate_uuid():
    return str(uuid.uuid4())


# ─── Models ──────────────────────────────────────────────────────────────────

class Employee(Base):
    __tablename__ = "employees"

    id = Column(String, primary_key=True, default=generate_uuid)
    role_id = Column(String, unique=True, nullable=True)  # e.g., SK-26-AI-0042

    # Personal details (from offer / google form)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    personal_email = Column(String, nullable=False)
    company_email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    blood_group = Column(String, nullable=True)
    emergency_contact_name = Column(String, nullable=True)
    emergency_contact_phone = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    tshirt_size = Column(String, nullable=True)
    dietary_preference = Column(String, nullable=True)

    # Professional details
    designation = Column(String, nullable=False)
    department_id = Column(String, ForeignKey("departments.id"), nullable=True)
    domain = Column(SAEnum(Domain), nullable=False)
    experience_type = Column(SAEnum(ExperienceType), nullable=False)
    linkedin_url = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    previous_company = Column(String, nullable=True)
    years_experience = Column(Float, nullable=True)

    # Offer & joining
    offer_date = Column(Date, nullable=True)
    offer_status = Column(SAEnum(OfferStatus), default=OfferStatus.SENT)
    doj = Column(Date, nullable=True)  # Date of Joining
    current_stage = Column(SAEnum(EmployeeStage), default=EmployeeStage.OFFER_SENT)

    # Tracking
    form_submitted = Column(Boolean, default=False)
    form_token = Column(String, unique=True, nullable=True)  # Unique token for form access
    portal_token = Column(String, unique=True, nullable=True)  # Unique token for portal access
    portal_access_granted = Column(Boolean, default=False)
    documents_uploaded = Column(Boolean, default=False)

    # Laptop tracking
    laptop_status = Column(SAEnum(LaptopStatus), default=LaptopStatus.NOT_REQUESTED)
    laptop_spec = Column(JSON, nullable=True)  # Auto-determined by domain
    laptop_arrival_date = Column(Date, nullable=True)

    # BGV
    bgv_status = Column(SAEnum(BGVStatus), default=BGVStatus.NOT_INITIATED)

    # Buddy
    buddy_id = Column(String, ForeignKey("employees.id"), nullable=True)
    buddy_name = Column(String, nullable=True)
    buddy_email = Column(String, nullable=True)

    # Email ID creation
    email_created = Column(Boolean, default=False)
    id_card_generated = Column(Boolean, default=False)
    access_card_requested = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    department = relationship("Department", back_populates="employees", foreign_keys=[department_id])
    buddy = relationship("Employee", remote_side="Employee.id", foreign_keys=[buddy_id])
    workflow_instances = relationship("WorkflowInstance", back_populates="employee", cascade="all, delete-orphan")
    training_completions = relationship("TrainingCompletion", back_populates="employee", cascade="all, delete-orphan")
    ai_contents = relationship("AIContent", back_populates="employee", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="employee", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="employee", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="employee", cascade="all, delete-orphan")


class Department(Base):
    __tablename__ = "departments"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    code = Column(String, nullable=False, unique=True)  # 3-letter BU code
    parent_id = Column(String, ForeignKey("departments.id"), nullable=True)
    head_name = Column(String, nullable=True)
    head_email = Column(String, nullable=True)
    email_group = Column(String, nullable=True)  # Distribution list for the BU
    teams_channel = Column(String, nullable=True)  # Teams/Slack channel

    # Relationships
    parent = relationship("Department", remote_side="Department.id", backref="children")
    employees = relationship("Employee", back_populates="department", foreign_keys=[Employee.department_id])


class WorkflowInstance(Base):
    __tablename__ = "workflow_instances"

    id = Column(String, primary_key=True, default=generate_uuid)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    workflow_type = Column(SAEnum(WorkflowType), nullable=False)
    status = Column(String, default="active")  # active, completed, paused, cancelled
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    current_step_order = Column(Integer, default=0)

    # Relationships
    employee = relationship("Employee", back_populates="workflow_instances")
    steps = relationship("WorkflowStep", back_populates="workflow_instance", cascade="all, delete-orphan",
                         order_by="WorkflowStep.step_order")


class WorkflowStep(Base):
    __tablename__ = "workflow_steps"

    id = Column(String, primary_key=True, default=generate_uuid)
    workflow_instance_id = Column(String, ForeignKey("workflow_instances.id"), nullable=False)

    step_key = Column(String, nullable=False)  # machine-readable key e.g. "generate_role_id"
    step_name = Column(String, nullable=False)  # human-readable e.g. "Generate Role ID"
    step_description = Column(Text, nullable=True)
    step_order = Column(Integer, nullable=False)
    status = Column(SAEnum(StepStatus), default=StepStatus.PENDING)

    # Assignment
    assigned_to = Column(String, nullable=True)  # email of person responsible
    assigned_role = Column(String, nullable=True)  # "hr", "admin", "it", "system"

    # Timing
    due_date = Column(DateTime, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Follow-up tracking
    reminder_count = Column(Integer, default=0)
    last_reminder_at = Column(DateTime, nullable=True)
    escalated = Column(Boolean, default=False)

    # Result
    result = Column(JSON, nullable=True)  # Step-specific result data
    notes = Column(Text, nullable=True)
    ai_generated_content = Column(Text, nullable=True)

    # Relationships
    workflow_instance = relationship("WorkflowInstance", back_populates="steps")


class TrainingModule(Base):
    __tablename__ = "training_modules"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    training_type = Column(SAEnum(TrainingType), nullable=False)
    content_html = Column(Text, nullable=True)  # Rich content
    video_url = Column(String, nullable=True)
    document_url = Column(String, nullable=True)
    duration_minutes = Column(Integer, default=30)
    order = Column(Integer, default=0)
    requires_acknowledgment = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    completions = relationship("TrainingCompletion", back_populates="module")
    quiz_questions = relationship("QuizQuestion", back_populates="module", cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(String, primary_key=True, default=generate_uuid)
    module_id = Column(String, ForeignKey("training_modules.id"), nullable=False)
    question = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)  # List of options
    correct_answer = Column(Integer, nullable=False)  # Index of correct option
    explanation = Column(Text, nullable=True)
    order = Column(Integer, default=0)

    module = relationship("TrainingModule", back_populates="quiz_questions")


class TrainingCompletion(Base):
    __tablename__ = "training_completions"

    id = Column(String, primary_key=True, default=generate_uuid)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    module_id = Column(String, ForeignKey("training_modules.id"), nullable=False)
    status = Column(String, default="not_started")  # not_started, in_progress, completed
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    acknowledgment_signed = Column(Boolean, default=False)
    quiz_score = Column(Float, nullable=True)  # Percentage score
    time_spent_minutes = Column(Integer, default=0)

    # Relationships
    employee = relationship("Employee", back_populates="training_completions")
    module = relationship("TrainingModule", back_populates="completions")


class AIContent(Base):
    __tablename__ = "ai_contents"

    id = Column(String, primary_key=True, default=generate_uuid)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    content_type = Column(SAEnum(AIContentType), nullable=False)
    content = Column(Text, nullable=False)
    tone = Column(String, default="professional")  # professional, celebratory, casual
    status = Column(SAEnum(AIContentStatus), default=AIContentStatus.DRAFT)
    extra_data = Column(JSON, nullable=True)  # Extra data (e.g., LinkedIn image URL)
    generated_at = Column(DateTime, default=datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)
    approved_by = Column(String, nullable=True)

    # Relationships
    employee = relationship("Employee", back_populates="ai_contents")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=generate_uuid)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=True)
    recipient_email = Column(String, nullable=False)
    recipient_role = Column(String, nullable=True)  # hr, admin, it, manager
    notification_type = Column(SAEnum(NotificationType), default=NotificationType.INFO)
    channel = Column(SAEnum(NotificationChannel), default=NotificationChannel.IN_APP)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    action_url = Column(String, nullable=True)
    read = Column(Boolean, default=False)
    sent_via_email = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime, nullable=True)

    # Relationships
    employee = relationship("Employee", back_populates="notifications")


class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=generate_uuid)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    document_type = Column(String, nullable=False)  # id_proof, address_proof, education, experience, offer_letter
    file_name = Column(String, nullable=False)
    file_url = Column(String, nullable=False)  # S3 URL or local path
    file_size = Column(Integer, nullable=True)
    verified = Column(Boolean, default=False)
    verification_notes = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    employee = relationship("Employee", back_populates="documents")


class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=True)
    direction = Column(String, nullable=False)  # inbound, outbound
    from_email = Column(String, nullable=False)
    to_email = Column(String, nullable=False)
    subject = Column(String, nullable=True)
    body_preview = Column(Text, nullable=True)
    full_body = Column(Text, nullable=True)
    message_id = Column(String, nullable=True)  # Gmail/Outlook message ID
    thread_id = Column(String, nullable=True)
    ai_classification = Column(JSON, nullable=True)  # AI analysis result
    processed = Column(Boolean, default=False)
    received_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class LaptopRequest(Base):
    __tablename__ = "laptop_requests"

    id = Column(String, primary_key=True, default=generate_uuid)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    domain = Column(SAEnum(Domain), nullable=False)
    specs = Column(JSON, nullable=False)  # CPU, RAM, Storage etc.
    status = Column(SAEnum(LaptopStatus), default=LaptopStatus.REQUESTED)
    requested_at = Column(DateTime, default=datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)
    approved_by = Column(String, nullable=True)
    expected_delivery = Column(Date, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    hardening_completed = Column(Boolean, default=False)
    hardening_checklist = Column(JSON, nullable=True)  # Checklist items with status
    notes = Column(Text, nullable=True)


class SecurityChecklist(Base):
    __tablename__ = "security_checklists"

    id = Column(String, primary_key=True, default=generate_uuid)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    item_name = Column(String, nullable=False)  # e.g., "Sprinto Agent", "MDM Enrollment"
    item_category = Column(String, nullable=False)  # e.g., "security_tool", "policy", "access"
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    completed_by = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    order = Column(Integer, default=0)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=True)
    actor = Column(String, nullable=False)  # Who performed the action
    actor_role = Column(String, nullable=True)  # system, hr, admin, employee
    action = Column(String, nullable=False)  # e.g., "offer_accepted", "step_completed"
    entity_type = Column(String, nullable=True)  # e.g., "employee", "workflow_step"
    entity_id = Column(String, nullable=True)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    employee = relationship("Employee", back_populates="audit_logs")


class AppConfig(Base):
    """Application-wide configuration stored in DB for runtime changes."""
    __tablename__ = "app_config"

    key = Column(String, primary_key=True)
    value = Column(JSON, nullable=False)
    description = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CheckIn(Base):
    """30-60-90 day check-in records."""
    __tablename__ = "check_ins"

    id = Column(String, primary_key=True, default=generate_uuid)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    check_in_type = Column(String, nullable=False)  # day_30, day_60, day_90
    scheduled_date = Column(Date, nullable=False)
    status = Column(String, default="scheduled")  # scheduled, completed, overdue, skipped
    ai_questions = Column(JSON, nullable=True)  # AI-generated questions
    employee_responses = Column(JSON, nullable=True)
    manager_notes = Column(Text, nullable=True)
    rating = Column(Integer, nullable=True)  # 1-5 satisfaction score
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class BuddyEmployee(Base):
    """Existing team members who can be assigned as onboarding buddies."""
    __tablename__ = "buddy_employees"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    designation = Column(String, nullable=False)
    department = Column(String, nullable=False)  # Matches Domain enum values
    phone = Column(String, nullable=True)
    experience_years = Column(Integer, default=2)
    is_active = Column(Boolean, default=True)
    assigned_count = Column(Integer, default=0)  # Track how many buddies they've mentored
    created_at = Column(DateTime, default=datetime.utcnow)
