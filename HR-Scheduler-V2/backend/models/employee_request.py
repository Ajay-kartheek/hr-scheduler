"""
Employee Request model — IT/Admin requests raised by employees.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.base import Base


class EmployeeRequest(Base):
    __tablename__ = "employee_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    new_hire_id = Column(UUID(as_uuid=True), ForeignKey("new_hires.id", ondelete="CASCADE"))

    request_type = Column(String(50), nullable=False)  # it_support | admin | access | other
    subject = Column(String(200), nullable=False)
    description = Column(Text)
    priority = Column(String(20), default="medium")  # low | medium | high

    status = Column(String(20), default="open")  # open | in_progress | resolved | closed
    admin_response = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime)

    new_hire = relationship("NewHire", back_populates="employee_requests")
