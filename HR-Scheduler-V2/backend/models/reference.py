"""
Reference models — seeded data for dropdowns.
Edit db/seed.py to add/modify departments, roles, offices, teams, managers.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from db.base import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    code = Column(String(10), unique=True, nullable=False)  # e.g., "ENG", "AI"
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    roles = relationship("Role", back_populates="department")
    teams = relationship("Team", back_populates="department")
    managers = relationship("Manager", back_populates="department")


class Role(Base):
    __tablename__ = "roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"))
    default_equipment = Column(JSONB, default=list)  # ["MacBook Pro 16", "Monitor"]
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    department = relationship("Department", back_populates="roles")


class Office(Base):
    __tablename__ = "offices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    location = Column(String(200))
    country = Column(String(100), default="India")
    created_at = Column(DateTime, default=datetime.utcnow)


class Team(Base):
    __tablename__ = "teams"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    department = relationship("Department", back_populates="teams")


class Manager(Base):
    __tablename__ = "managers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(200), nullable=False)
    designation = Column(String(100))
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    department = relationship("Department", back_populates="managers")
