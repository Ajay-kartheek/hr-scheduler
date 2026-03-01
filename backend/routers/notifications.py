"""
HR Scheduler — Notifications Router
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from models import Notification
from schemas import NotificationResponse

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("/", response_model=list[NotificationResponse])
def list_notifications(
    unread_only: bool = False,
    recipient_role: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """Get notifications, optionally filtered."""
    query = db.query(Notification)

    if unread_only:
        query = query.filter(Notification.read == False)
    if recipient_role:
        query = query.filter(Notification.recipient_role == recipient_role)

    return query.order_by(Notification.created_at.desc()).limit(limit).all()


@router.get("/unread-count")
def get_unread_count(db: Session = Depends(get_db)):
    """Get count of unread notifications."""
    count = db.query(Notification).filter(Notification.read == False).count()
    return {"count": count}


@router.put("/{notification_id}/read")
def mark_as_read(notification_id: str, db: Session = Depends(get_db)):
    """Mark a notification as read."""
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.read = True
    notif.read_at = datetime.utcnow()
    db.commit()
    return {"status": "ok"}


@router.put("/read-all")
def mark_all_as_read(db: Session = Depends(get_db)):
    """Mark all notifications as read."""
    db.query(Notification).filter(Notification.read == False).update(
        {"read": True, "read_at": datetime.utcnow()}
    )
    db.commit()
    return {"status": "ok"}
