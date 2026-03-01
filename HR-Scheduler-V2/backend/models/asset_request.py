"""
Asset request model — equipment requests triggered by role selection.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from db.base import Base


class AssetRequest(Base):
    __tablename__ = "asset_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    new_hire_id = Column(UUID(as_uuid=True), ForeignKey("new_hires.id", ondelete="CASCADE"))

    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id"), nullable=True)
    equipment_list = Column(JSONB, nullable=False)   # ["MacBook Pro 16", "Monitor 27in"]
    notes = Column(Text)

    status = Column(String(20), default="pending")   # pending | approved | fulfilled
    requested_at = Column(DateTime, default=datetime.utcnow)
    fulfilled_at = Column(DateTime)

    new_hire = relationship("NewHire", back_populates="asset_requests")
    role = relationship("Role")
