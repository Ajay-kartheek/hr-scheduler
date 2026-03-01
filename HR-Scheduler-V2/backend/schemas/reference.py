"""Schemas for reference/dropdown data."""

from pydantic import BaseModel
from uuid import UUID
from typing import Optional, List


class DepartmentOut(BaseModel):
    id: UUID
    name: str
    code: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class RoleOut(BaseModel):
    id: UUID
    name: str
    department_id: Optional[UUID] = None
    default_equipment: List[str] = []
    description: Optional[str] = None

    class Config:
        from_attributes = True


class OfficeOut(BaseModel):
    id: UUID
    name: str
    location: Optional[str] = None
    country: str = "India"

    class Config:
        from_attributes = True


class TeamOut(BaseModel):
    id: UUID
    name: str
    department_id: Optional[UUID] = None

    class Config:
        from_attributes = True


class ManagerOut(BaseModel):
    id: UUID
    name: str
    email: str
    designation: Optional[str] = None
    department_id: Optional[UUID] = None

    class Config:
        from_attributes = True
