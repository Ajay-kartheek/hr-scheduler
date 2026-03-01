"""
Document model — global policies and per-employee documents.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.base import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    new_hire_id = Column(UUID(as_uuid=True), ForeignKey("new_hires.id", ondelete="CASCADE"))

    name = Column(String(255), nullable=False)      # "Non-Disclosure Agreement.pdf"
    file_path = Column(String(500))                  # Local path or S3 URL
    document_type = Column(String(20), default="global")  # 'global' | 'personal'
    requires_signature = Column(Boolean, default=False)
    signature_status = Column(String(20), default="not_required")
    # not_required | pending | signed

    uploaded_by = Column(String(100), default="hr")
    created_at = Column(DateTime, default=datetime.utcnow)

    new_hire = relationship("NewHire", back_populates="documents")
