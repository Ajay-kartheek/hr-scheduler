"""Reference data router — dropdown endpoints for the frontend."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from db.database import get_db
from models import Department, Role, Office, Team, Manager
from schemas.reference import DepartmentOut, RoleOut, OfficeOut, TeamOut, ManagerOut

router = APIRouter(prefix="/api/ref", tags=["Reference Data"])


@router.get("/departments", response_model=list[DepartmentOut])
def list_departments(db: Session = Depends(get_db)):
    return db.query(Department).order_by(Department.name).all()


@router.get("/roles", response_model=list[RoleOut])
def list_roles(department_id: Optional[UUID] = Query(None), db: Session = Depends(get_db)):
    q = db.query(Role)
    if department_id:
        q = q.filter(Role.department_id == department_id)
    return q.order_by(Role.name).all()


@router.get("/offices", response_model=list[OfficeOut])
def list_offices(db: Session = Depends(get_db)):
    return db.query(Office).order_by(Office.name).all()


@router.get("/teams", response_model=list[TeamOut])
def list_teams(department_id: Optional[UUID] = Query(None), db: Session = Depends(get_db)):
    q = db.query(Team)
    if department_id:
        q = q.filter(Team.department_id == department_id)
    return q.order_by(Team.name).all()


@router.get("/managers", response_model=list[ManagerOut])
def list_managers(department_id: Optional[UUID] = Query(None), db: Session = Depends(get_db)):
    q = db.query(Manager)
    if department_id:
        q = q.filter(Manager.department_id == department_id)
    return q.order_by(Manager.name).all()
