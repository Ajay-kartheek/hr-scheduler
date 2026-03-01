"""Dashboard router — stats and lists for the HR dashboard."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date, timedelta

from db.database import get_db
from models import NewHire, HireStatus
from schemas.onboarding import DashboardStats
from schemas.employee import NewHireListItem

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


def _hire_to_list_item(hire: NewHire) -> dict:
    return {
        "id": hire.id,
        "first_name": hire.first_name,
        "last_name": hire.last_name,
        "personal_email": hire.personal_email,
        "designation": hire.designation,
        "department_name": hire.department.name if hire.department else None,
        "doj": hire.doj,
        "status": hire.status.value if isinstance(hire.status, HireStatus) else hire.status,
        "created_at": hire.created_at,
        "form_submitted": hire.form_response is not None,
    }


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    today = date.today()
    thirty_days_ago = today - timedelta(days=30)
    sixty_days_ago = today - timedelta(days=60)

    all_hires = db.query(NewHire).all()

    stats = DashboardStats(
        total_hires=len(all_hires),
        waiting_for_input=sum(
            1 for h in all_hires
            if (h.status.value if isinstance(h.status, HireStatus) else h.status) == HireStatus.WAITING_FOR_INPUT.value
        ),
        provisioning=sum(
            1 for h in all_hires
            if (h.status.value if isinstance(h.status, HireStatus) else h.status) in (
                HireStatus.WELCOME_SENT.value, HireStatus.FORM_RECEIVED.value
            )
        ),
        onboarding=sum(
            1 for h in all_hires
            if (h.status.value if isinstance(h.status, HireStatus) else h.status) == HireStatus.ONBOARDING_IN_PROGRESS.value
        ),
        first_month=sum(
            1 for h in all_hires
            if h.doj and thirty_days_ago <= h.doj <= today
        ),
        second_month=sum(
            1 for h in all_hires
            if h.doj and sixty_days_ago <= h.doj < thirty_days_ago
        ),
    )
    return stats


@router.get("/recent-hires", response_model=list[NewHireListItem])
def get_recent_hires(limit: int = 20, db: Session = Depends(get_db)):
    """Brand new employees — those who completed onboarding or are active."""
    hires = (
        db.query(NewHire)
        .filter(NewHire.status.in_([HireStatus.ONBOARDING_COMPLETED, HireStatus.ACTIVE]))
        .order_by(NewHire.created_at.desc())
        .limit(limit)
        .all()
    )
    return [_hire_to_list_item(h) for h in hires]


@router.get("/waiting", response_model=list[NewHireListItem])
def get_waiting_hires(db: Session = Depends(get_db)):
    """All hires that are not yet completed — visible in the dashboard waiting section."""
    hires = (
        db.query(NewHire)
        .filter(NewHire.status.in_([
            HireStatus.WAITING_FOR_INPUT,
            HireStatus.WELCOME_SENT,
            HireStatus.FORM_RECEIVED,
            HireStatus.ONBOARDING_IN_PROGRESS,
        ]))
        .order_by(NewHire.doj.asc())
        .all()
    )
    return [_hire_to_list_item(h) for h in hires]
