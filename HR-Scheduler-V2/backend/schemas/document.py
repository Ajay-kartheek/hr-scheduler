"""Schemas for document management."""

from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime


class DocumentOut(BaseModel):
    id: UUID
    new_hire_id: Optional[UUID] = None
    name: str
    file_path: Optional[str] = None
    document_type: str = "global"
    requires_signature: bool = False
    signature_status: str = "not_required"
    uploaded_by: str = "hr"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DocumentCreate(BaseModel):
    name: str
    document_type: str = "global"
    requires_signature: bool = False


class SignatureUpdate(BaseModel):
    signature_status: str  # "pending" | "signed"
