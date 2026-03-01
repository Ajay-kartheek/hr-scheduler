"""
HR Scheduler — 30-60-90 Day Check-In Router
Auto-schedules pulse check meetings, generates AI questions, tracks completion.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
from database import get_db
from models import Employee, EmployeeStage, CheckIn

router = APIRouter(prefix="/api/check-ins", tags=["Check-ins"])


@router.get("/")
def get_all_checkins(db: Session = Depends(get_db)):
    """Get all check-ins across employees with employee details."""
    checkins = db.query(CheckIn).order_by(CheckIn.scheduled_date.asc()).all()

    result = []
    for ci in checkins:
        emp = db.query(Employee).filter(Employee.id == ci.employee_id).first()
        # Auto-mark overdue
        if ci.status == "scheduled" and ci.scheduled_date < date.today():
            ci.status = "overdue"
            db.commit()

        result.append({
            "id": ci.id,
            "employee_id": ci.employee_id,
            "employee_name": f"{emp.first_name or ''} {emp.last_name or ''}".strip() if emp else "Unknown",
            "designation": emp.designation if emp else "",
            "check_in_type": ci.check_in_type,
            "scheduled_date": str(ci.scheduled_date),
            "status": ci.status,
            "ai_questions": ci.ai_questions,
            "employee_responses": ci.employee_responses,
            "manager_notes": ci.manager_notes,
            "rating": ci.rating,
            "completed_at": ci.completed_at.isoformat() if ci.completed_at else None,
        })

    return result


@router.post("/auto-schedule/{employee_id}")
def auto_schedule_checkins(employee_id: str, db: Session = Depends(get_db)):
    """
    Auto-schedule 30-60-90 day check-ins for an employee.
    Called automatically when employee reaches ONBOARDING stage.
    """
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    if not emp.doj:
        raise HTTPException(status_code=400, detail="Employee has no DOJ set")

    # Check if already scheduled
    existing = db.query(CheckIn).filter(CheckIn.employee_id == employee_id).count()
    if existing > 0:
        return {"message": "Check-ins already scheduled", "count": existing}

    # Generate AI questions for each milestone
    from services.ai_service import _invoke_claude
    import json

    milestones = [
        ("day_30", 30, "30-day"),
        ("day_60", 60, "60-day"),
        ("day_90", 90, "90-day"),
    ]

    created = []
    for check_type, days, label in milestones:
        scheduled = emp.doj + timedelta(days=days)

        # AI-generate check-in questions
        try:
            system = f"""You are an HR specialist at Shellkode.
Generate 5 thoughtful questions for a {label} check-in with a new hire.

Guidelines:
- Questions should assess integration, satisfaction, and development
- Be specific to the milestone ({label})
- Include both open-ended and scale-based questions
- Return a JSON array of objects: [{{"question": "...", "type": "open" or "scale"}}]
- Return ONLY the JSON array"""

            prompt = f"""Employee: {emp.first_name} {emp.last_name or ''}
Role: {emp.designation}
Domain: {emp.domain.value if emp.domain else 'General'}
Experience: {emp.experience_type.value if emp.experience_type else 'N/A'}

Generate {label} check-in questions."""

            result = _invoke_claude(system, prompt, max_tokens=500)
            cleaned = result.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0]
            questions = json.loads(cleaned)
        except Exception:
            questions = [
                {"question": f"How would you rate your overall experience after {days} days? (1-5)", "type": "scale"},
                {"question": "What has been your biggest achievement so far?", "type": "open"},
                {"question": "What challenges have you faced?", "type": "open"},
                {"question": "Do you feel well-supported by your team and manager?", "type": "open"},
                {"question": "What would you like to focus on in the next 30 days?", "type": "open"},
            ]

        checkin = CheckIn(
            employee_id=employee_id,
            check_in_type=check_type,
            scheduled_date=scheduled,
            status="scheduled",
            ai_questions=questions,
        )
        db.add(checkin)
        created.append({
            "type": check_type,
            "scheduled": str(scheduled),
            "questions": len(questions),
        })

    db.commit()
    return {"message": f"Scheduled {len(created)} check-ins", "check_ins": created}


@router.put("/{checkin_id}/complete")
def complete_checkin(checkin_id: str, body: dict, db: Session = Depends(get_db)):
    """Complete a check-in with responses and manager notes."""
    ci = db.query(CheckIn).filter(CheckIn.id == checkin_id).first()
    if not ci:
        raise HTTPException(status_code=404, detail="Check-in not found")

    ci.employee_responses = body.get("responses", {})
    ci.manager_notes = body.get("manager_notes", "")
    ci.rating = body.get("rating")
    ci.status = "completed"
    ci.completed_at = datetime.utcnow()
    db.commit()

    return {"message": "Check-in completed", "id": ci.id}
