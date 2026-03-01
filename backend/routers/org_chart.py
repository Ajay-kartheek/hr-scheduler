"""
HR Scheduler — Org Chart Router
Department hierarchy and org chart data.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Department, Employee
from schemas import DepartmentResponse, OrgChartNode

router = APIRouter(prefix="/api/org-chart", tags=["Org Chart"])


@router.get("/", response_model=list[OrgChartNode])
def get_org_chart(db: Session = Depends(get_db)):
    """Get the full org chart as a tree."""
    # Get all departments
    departments = db.query(Department).all()

    # Build a tree
    dept_map = {d.id: d for d in departments}
    roots = []
    children_map = {}

    for dept in departments:
        children_map.setdefault(dept.parent_id, []).append(dept)

    def build_node(dept: Department) -> OrgChartNode:
        emp_count = db.query(Employee).filter(Employee.department_id == dept.id).count()
        new_hires = db.query(Employee).filter(
            Employee.department_id == dept.id,
            Employee.current_stage.in_(["pre_boarding", "onboarding", "day_one"])
        ).all()

        from routers.employees import _employee_to_response

        return OrgChartNode(
            id=dept.id,
            name=dept.name,
            code=dept.code,
            head_name=dept.head_name,
            employee_count=emp_count,
            children=[build_node(c) for c in children_map.get(dept.id, [])],
            new_hires=[_employee_to_response(e) for e in new_hires],
        )

    for dept in departments:
        if dept.parent_id is None:
            roots.append(build_node(dept))

    return roots


@router.get("/departments", response_model=list[DepartmentResponse])
def list_departments(db: Session = Depends(get_db)):
    """List all departments (flat)."""
    departments = db.query(Department).all()
    result = []
    for dept in departments:
        emp_count = db.query(Employee).filter(Employee.department_id == dept.id).count()
        result.append(DepartmentResponse(
            id=dept.id,
            name=dept.name,
            code=dept.code,
            parent_id=dept.parent_id,
            head_name=dept.head_name,
            head_email=dept.head_email,
            email_group=dept.email_group,
            employee_count=emp_count,
        ))
    return result
