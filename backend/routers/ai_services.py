"""
HR Scheduler — AI Services Router
Endpoints for AI-powered content generation.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json
import logging

logger = logging.getLogger(__name__)

from database import get_db
from models import Employee, AIContent, AIContentType, AIContentStatus
from schemas import AIGenerateRequest, AIContentResponse, EmailClassificationResult
from services.ai_service import (
    generate_welcome_writeup, generate_linkedin_post,
    generate_welcome_email, generate_followup_email,
    generate_dashboard_insight, classify_email_reply,
    generate_chatbot_response
)

router = APIRouter(prefix="/api/ai", tags=["AI Services"])


@router.post("/generate", response_model=AIContentResponse)
def generate_content(request: AIGenerateRequest, db: Session = Depends(get_db)):
    """Generate AI content for an employee."""
    emp = db.query(Employee).filter(Employee.id == request.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    first_name = emp.first_name or "New Hire"
    last_name = emp.last_name or ""
    content = ""

    if request.content_type.value == "welcome_writeup":
        content = generate_welcome_writeup(
            first_name=first_name,
            last_name=last_name,
            designation=emp.designation,
            domain=emp.domain.value,
            experience_type=emp.experience_type.value,
            bio=emp.bio,
            previous_company=emp.previous_company,
            tone=request.tone.value,
        )
    elif request.content_type.value == "linkedin_post":
        content = generate_linkedin_post(
            first_name=first_name,
            last_name=last_name,
            designation=emp.designation,
            domain=emp.domain.value,
            experience_type=emp.experience_type.value,
            bio=emp.bio,
            previous_company=emp.previous_company,
            tone=request.tone.value,
        )
    elif request.content_type.value == "welcome_email":
        form_url = f"/welcome/{emp.form_token}" if emp.form_token else ""
        content = generate_welcome_email(
            first_name=first_name,
            designation=emp.designation,
            doj=str(emp.doj) if emp.doj else None,
            form_url=form_url,
        )
    elif request.content_type.value == "followup_email":
        content = generate_followup_email(
            context=request.additional_context or f"Follow-up for {first_name}'s onboarding",
            recipient_role="admin",
        )
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported content type: {request.content_type}")

    # Save to DB
    ai_content = AIContent(
        employee_id=emp.id,
        content_type=AIContentType(request.content_type.value),
        content=content,
        tone=request.tone.value,
        status=AIContentStatus.DRAFT,
    )
    db.add(ai_content)
    db.commit()
    db.refresh(ai_content)

    return ai_content


@router.get("/content/{employee_id}", response_model=list[AIContentResponse])
def get_employee_ai_content(employee_id: str, db: Session = Depends(get_db)):
    """Get all AI-generated content for an employee."""
    contents = db.query(AIContent).filter(
        AIContent.employee_id == employee_id
    ).order_by(AIContent.generated_at.desc()).all()
    return contents


@router.put("/content/{content_id}/approve", response_model=AIContentResponse)
def approve_ai_content(content_id: str, db: Session = Depends(get_db)):
    """Approve AI-generated content. Sends email automatically for email/writeup types."""
    content = db.query(AIContent).filter(AIContent.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    content.status = AIContentStatus.APPROVED
    from datetime import datetime
    content.approved_at = datetime.utcnow()
    content.approved_by = "hr_admin"

    # Auto-send email for email types
    if content.content_type in (AIContentType.WELCOME_EMAIL, AIContentType.WELCOME_WRITEUP, AIContentType.FOLLOWUP_EMAIL):
        emp = db.query(Employee).filter(Employee.id == content.employee_id).first()
        if emp:
            from services.email_service import send_welcome_content_email, send_followup_email
            import logging
            logger = logging.getLogger("hr_scheduler")
            try:
                if content.content_type == AIContentType.FOLLOWUP_EMAIL:
                    send_followup_email(emp, "Follow-up from Shellkode HR", content.content, db=db)
                else:
                    send_welcome_content_email(emp, content.content, db=db)
                logger.info(f"Auto-sent {content.content_type.value} to {emp.personal_email}")
            except Exception as e:
                logger.error(f"Failed to auto-send email: {e}")

    db.commit()
    db.refresh(content)
    return content


@router.put("/content/{content_id}/edit")
def edit_ai_content(content_id: str, new_content: dict, db: Session = Depends(get_db)):
    """Edit AI-generated content before approval."""
    content = db.query(AIContent).filter(AIContent.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    content.content = new_content.get("content", content.content)
    content.status = AIContentStatus.DRAFT
    db.commit()
    db.refresh(content)
    return content


@router.post("/classify-email", response_model=EmailClassificationResult)
def classify_email(body: dict, db: Session = Depends(get_db)):
    """
    Classify a candidate's email reply using AI.
    If employee_id and email_context are provided, auto-triggers workflow actions.
    """
    import logging
    logger = logging.getLogger("hr_scheduler")

    email_body = body.get("email_body", "")
    context = body.get("context", "")
    employee_id = body.get("employee_id")
    email_context = body.get("email_context", "offer_reply")  # offer_reply, admin_laptop, it_email, general

    if not email_body:
        raise HTTPException(status_code=400, detail="email_body is required")

    result = classify_email_reply(email_body, context)
    classification = EmailClassificationResult(**result)

    # Log the inbound email
    if employee_id:
        from models import EmailLog
        log = EmailLog(
            employee_id=employee_id,
            direction="inbound",
            from_email=body.get("from_email", "unknown"),
            to_email="hr@shellkode.com",
            subject=body.get("subject", f"Re: {email_context}"),
            body_preview=email_body[:500],
            full_body=email_body,
            ai_classification=result,
            processed=True,
        )
        db.add(log)

        # Auto-trigger actions based on classification + context
        emp = db.query(Employee).filter(Employee.id == employee_id).first()
        if emp:
            if email_context == "offer_reply":
                if classification.status == "accepted":
                    # Import and call accept_offer logic
                    from routers.employees import accept_offer
                    logger.info(f"Auto-triggering offer acceptance for {emp.first_name} based on email classification")
                    try:
                        accept_offer(employee_id, db)
                    except Exception as e:
                        logger.error(f"Auto accept-offer failed: {e}")

            elif email_context == "admin_laptop":
                if classification.status == "accepted":
                    # Laptop approved by admin
                    from models import WorkflowInstance, WorkflowStep, StepStatus, LaptopStatus
                    emp.laptop_status = LaptopStatus.APPROVED
                    logger.info(f"Laptop approved for {emp.first_name}")

            elif email_context == "it_email":
                if classification.status == "accepted":
                    # IT confirmed email creation
                    emp.email_created = True
                    logger.info(f"Email creation confirmed for {emp.first_name}")

        db.commit()

    return classification


@router.post("/chatbot")
def chatbot(body: dict, db: Session = Depends(get_db)):
    """AI chatbot for new hire questions."""
    question = body.get("question", "")
    if not question:
        raise HTTPException(status_code=400, detail="question is required")

    company_context = """
    Shellkode is an IT services and solutions company specializing in Cloud, AI/ML, Data Engineering,
    Security, and Managed Services. We operate from Bangalore, India.
    Work hours: 9:30 AM - 6:30 PM, Monday to Friday.
    Leave policy: 24 days annual leave + 12 public holidays.
    Probation period: 6 months for all new hires.
    """

    response = generate_chatbot_response(
        question=question,
        company_context=company_context,
        conversation_history=body.get("history", []),
    )

    return {"response": response}


@router.post("/dashboard-insight")
def get_ai_insight(db: Session = Depends(get_db)):
    """Generate an AI-powered dashboard insight."""
    from models import EmployeeStage, StepStatus, WorkflowStep

    # Gather pipeline data
    pipeline_data = {
        "active_onboardings": db.query(Employee).filter(
            Employee.current_stage.in_([
                EmployeeStage.PRE_BOARDING, EmployeeStage.ONBOARDING,
                EmployeeStage.DAY_ONE
            ])
        ).count(),
        "pending_steps": db.query(WorkflowStep).filter(
            WorkflowStep.status.in_([StepStatus.PENDING, StepStatus.HITL])
        ).count(),
        "hitl_steps": db.query(WorkflowStep).filter(
            WorkflowStep.status == StepStatus.HITL
        ).count(),
    }

    insight = generate_dashboard_insight(pipeline_data)
    return {"insight": insight}


@router.get("/email-activity")
def get_email_activity(limit: int = 50, db: Session = Depends(get_db)):
    """Get recent email activity across all employees — for Mail Center feed."""
    from models import EmailLog, Employee

    logs = db.query(EmailLog).order_by(EmailLog.created_at.desc()).limit(limit).all()

    result = []
    for log in logs:
        emp = db.query(Employee).filter(Employee.id == log.employee_id).first() if log.employee_id else None
        result.append({
            "id": log.id,
            "employee_name": f"{emp.first_name or ''} {emp.last_name or ''}".strip() if emp else "Unknown",
            "employee_id": log.employee_id,
            "direction": log.direction,
            "from_email": log.from_email,
            "to_email": log.to_email,
            "subject": log.subject,
            "body_preview": log.body_preview,
            "ai_classification": log.ai_classification,
            "processed": log.processed,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        })

    return result


@router.post("/copilot")
def copilot_chat(body: dict, db: Session = Depends(get_db)):
    """
    AI Copilot — HR assistant that understands your pipeline.
    Queries the database for live context and uses Claude to answer.
    """
    from models import Employee, WorkflowInstance, WorkflowStep, EmailLog
    from services.ai_service import _invoke_claude
    from sqlalchemy import func
    from datetime import datetime, timedelta

    question = body.get("question", "").strip()
    history = body.get("history", [])

    if not question:
        raise HTTPException(status_code=400, detail="Question is required")

    # ── Gather live pipeline context from the database ──
    employees = db.query(Employee).order_by(Employee.created_at.desc()).all()

    # Stage counts
    stage_counts = {}
    for emp in employees:
        stage = emp.current_stage.value if emp.current_stage else "unknown"
        stage_counts[stage] = stage_counts.get(stage, 0) + 1

    # Employee details
    emp_summaries = []
    for emp in employees[:30]:  # Limit for context window
        wfs = db.query(WorkflowInstance).filter(
            WorkflowInstance.employee_id == emp.id
        ).all()

        wf_info = []
        for wf in wfs:
            steps = db.query(WorkflowStep).filter(
                WorkflowStep.workflow_id == wf.id
            ).order_by(WorkflowStep.step_order).all()

            completed = sum(1 for s in steps if s.status.value == "completed")
            total = len(steps)
            pending_steps = [
                f"{s.step_name} ({s.status.value})"
                for s in steps if s.status.value not in ("completed", "skipped")
            ]

            wf_info.append({
                "type": wf.workflow_type.value,
                "status": wf.status,
                "progress": f"{completed}/{total}",
                "pending_steps": pending_steps[:5],
            })

        emp_summaries.append({
            "name": f"{emp.first_name or ''} {emp.last_name or ''}".strip(),
            "email": emp.personal_email,
            "designation": emp.designation,
            "domain": emp.domain.value if emp.domain else None,
            "stage": emp.current_stage.value if emp.current_stage else None,
            "doj": str(emp.doj) if emp.doj else None,
            "laptop_status": emp.laptop_status.value if emp.laptop_status else None,
            "form_submitted": emp.form_submitted,
            "buddy": emp.buddy_name,
            "workflows": wf_info,
        })

    # Recent email activity
    recent_emails = db.query(EmailLog).order_by(
        EmailLog.created_at.desc()
    ).limit(10).all()

    email_summary = []
    for e in recent_emails:
        email_summary.append({
            "subject": e.subject,
            "from": e.from_email,
            "to": e.to_email,
            "direction": e.direction,
            "classification": e.ai_classification,
            "time": e.created_at.isoformat() if e.created_at else None,
        })

    # Build context
    context = f"""## Live HR Pipeline Data (as of {datetime.now().strftime('%Y-%m-%d %H:%M')})

### Pipeline Summary
Total employees: {len(employees)}
Stage breakdown: {json.dumps(stage_counts)}

### Employee Details
{json.dumps(emp_summaries, indent=2, default=str)}

### Recent Email Activity (last 10)
{json.dumps(email_summary, indent=2, default=str)}
"""

    # Build conversation
    conv_context = ""
    if history:
        for msg in history[-6:]:  # Last 3 exchanges
            role = msg.get("role", "user")
            conv_context += f"\n{'User' if role == 'user' else 'Assistant'}: {msg.get('content', '')}\n"

    system_prompt = """You are the HR Copilot for Shellkode Technologies' onboarding platform. You have access to the live database.

CAPABILITIES:
- Answer questions about employee status, pipeline stages, and workflows
- Provide insights on bottlenecks, pending actions, and progress
- Summarize onboarding status for any employee by name
- Highlight what needs attention
- Give recommendations for improving the onboarding process

RULES:
- Be concise and direct — HR people are busy
- Use bullet points for clarity
- Reference specific employee names and data when relevant
- If asked about actions (like sending emails), explain you can provide the info but the HR admin should use the platform controls to execute
- Never make up data — only reference what's in the provided context
- Format responses clearly with markdown"""

    user_prompt = f"""{context}

{f'Previous conversation:{conv_context}' if conv_context else ''}

HR Admin Question: {question}"""

    try:
        response = _invoke_claude(system_prompt, user_prompt, max_tokens=1024)
        return {"response": response}
    except Exception as e:
        logger.error(f"Copilot error: {e}")
        return {"response": f"I encountered an error processing your request. Please try again."}


@router.get("/suggestions")
def get_smart_suggestions(db: Session = Depends(get_db)):
    """
    Smart Suggestions — AI-powered actionable recommendations.
    Analyzes pipeline state and returns suggestions.
    """
    from models import Employee, WorkflowInstance, WorkflowStep, EmailLog
    from datetime import datetime, timedelta

    suggestions = []
    now = datetime.utcnow()

    employees = db.query(Employee).all()

    for emp in employees:
        name = f"{emp.first_name or ''} {emp.last_name or ''}".strip() or emp.personal_email

        # 1. Stale offers — offer sent > 3 days ago with no response
        if emp.current_stage and emp.current_stage.value == "offer_sent":
            days_since = (now - emp.created_at).days if emp.created_at else 0
            if days_since >= 3:
                suggestions.append({
                    "type": "warning",
                    "title": f"Offer pending for {days_since} days",
                    "description": f"{name} hasn't responded to their offer letter. Consider sending a follow-up.",
                    "employee_id": emp.id,
                    "employee_name": name,
                    "action": "send_followup",
                    "priority": "high" if days_since >= 5 else "medium",
                })

        # 2. Ready to join — suggest starting Day 1
        if emp.current_stage and emp.current_stage.value == "ready_to_join":
            if emp.doj:
                days_until = (emp.doj - now.date()).days
                if days_until <= 2:
                    suggestions.append({
                        "type": "action",
                        "title": f"Day 1 approaching for {name}",
                        "description": f"Joining date is {'today' if days_until == 0 else f'in {days_until} day(s)'}. Initiate Day 1 workflow.",
                        "employee_id": emp.id,
                        "employee_name": name,
                        "action": "start_day1",
                        "priority": "high",
                    })

        # 3. Form not submitted
        if emp.form_token and not emp.form_submitted:
            days_since = (now - emp.created_at).days if emp.created_at else 0
            if days_since >= 2:
                suggestions.append({
                    "type": "info",
                    "title": f"Welcome form pending from {name}",
                    "description": f"Form was sent {days_since} days ago but not yet submitted.",
                    "employee_id": emp.id,
                    "employee_name": name,
                    "action": "remind_form",
                    "priority": "low" if days_since < 4 else "medium",
                })

        # 4. Blocked workflow steps (HITL or stuck in_progress)
        wfs = db.query(WorkflowInstance).filter(
            WorkflowInstance.employee_id == emp.id
        ).all()

        for wf in wfs:
            steps = db.query(WorkflowStep).filter(
                WorkflowStep.workflow_id == wf.id,
                WorkflowStep.status.in_(["hitl", "in_progress", "waiting_reply"])
            ).all()

            for step in steps:
                if step.status.value == "hitl":
                    suggestions.append({
                        "type": "action",
                        "title": f"Action required: {step.step_name}",
                        "description": f"{name}'s workflow needs manual intervention on \"{step.step_name}\".",
                        "employee_id": emp.id,
                        "employee_name": name,
                        "action": "resolve_step",
                        "step_id": step.id,
                        "priority": "high",
                    })

                elif step.status.value in ("in_progress", "waiting_reply"):
                    step_age = (now - step.updated_at).days if step.updated_at else 0
                    if step_age >= 2:
                        suggestions.append({
                            "type": "warning",
                            "title": f"\"{step.step_name}\" stuck for {step_age} days",
                            "description": f"{name}'s step hasn't progressed. May need follow-up.",
                            "employee_id": emp.id,
                            "employee_name": name,
                            "action": "followup_step",
                            "step_id": step.id,
                            "priority": "medium",
                        })

    # Sort by priority
    priority_order = {"high": 0, "medium": 1, "low": 2}
    suggestions.sort(key=lambda s: priority_order.get(s["priority"], 3))

    return suggestions[:15]  # Cap at 15

