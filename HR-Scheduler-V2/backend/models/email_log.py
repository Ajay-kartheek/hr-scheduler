"""
Email log model — tracks all outbound emails.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.base import Base


class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    new_hire_id = Column(UUID(as_uuid=True), ForeignKey("new_hires.id", ondelete="CASCADE"))

    direction = Column(String(10), default="outbound")
    to_email = Column(String(200))
    subject = Column(String(500))
    body_preview = Column(Text)
    template_type = Column(String(50))   # welcome | onboarding_plan | asset_request

    status = Column(String(20), default="sent")  # sent | failed | logged
    sent_at = Column(DateTime, default=datetime.utcnow)

    new_hire = relationship("NewHire", back_populates="email_logs")
