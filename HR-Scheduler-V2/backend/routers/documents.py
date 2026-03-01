"""Document management router — upload, list, delete, signature updates."""

import os
import shutil
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional

from db.database import get_db
from models import Document
from schemas.document import DocumentOut, SignatureUpdate

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(prefix="/api/documents", tags=["Documents"])


@router.post("/upload", response_model=DocumentOut)
async def upload_document(
    file: UploadFile = File(...),
    new_hire_id: Optional[str] = Form(None),
    document_type: str = Form("global"),
    requires_signature: bool = Form(False),
    db: Session = Depends(get_db),
):
    """Upload a document (file + metadata)."""
    # Save file
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    doc = Document(
        new_hire_id=UUID(new_hire_id) if new_hire_id else None,
        name=file.filename,
        file_path=file_path,
        document_type=document_type,
        requires_signature=requires_signature,
        signature_status="pending" if requires_signature else "not_required",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/{hire_id}", response_model=list[DocumentOut])
def list_documents(hire_id: UUID, db: Session = Depends(get_db)):
    """List all documents for a specific hire."""
    docs = (
        db.query(Document)
        .filter(Document.new_hire_id == hire_id)
        .order_by(Document.created_at.desc())
        .all()
    )
    return docs


@router.delete("/{doc_id}")
def delete_document(doc_id: UUID, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Remove file
    if doc.file_path and os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    db.delete(doc)
    db.commit()
    return {"message": "Document deleted"}


@router.patch("/{doc_id}/signature", response_model=DocumentOut)
def update_signature(doc_id: UUID, data: SignatureUpdate, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.signature_status = data.signature_status
    db.commit()
    db.refresh(doc)
    return doc
