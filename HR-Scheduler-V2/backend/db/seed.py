"""
HR-Scheduler-V2 — Seed Data
═══════════════════════════════════════════════════════════
To edit departments, roles, offices, etc., modify the lists below.
Run: python -m db.seed
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import date, timedelta
from db.database import SessionLocal, init_db, drop_all_tables
from models import (
    Department, Role, Office, Team, Manager, NewHire, HireStatus,
)


# ═══════════════════════════════════════════════════════════════
# EDIT THESE LISTS to customize your seed data
# ═══════════════════════════════════════════════════════════════

DEPARTMENTS = [
    {"name": "Engineering", "code": "ENG", "description": "Software Engineering & DevOps"},
    {"name": "AI & Machine Learning", "code": "AI", "description": "AI/ML Research & Engineering"},
    {"name": "Human Resources", "code": "HR", "description": "People Operations & HR"},
    {"name": "Marketing", "code": "MKT", "description": "Marketing & Brand"},
    {"name": "Sales", "code": "SAL", "description": "Sales & Business Development"},
    {"name": "Finance", "code": "FIN", "description": "Finance & Accounting"},
    {"name": "Design", "code": "DES", "description": "UI/UX & Product Design"},
    {"name": "Product", "code": "PRD", "description": "Product Management"},
]

ROLES = [
    # Engineering
    {"name": "Software Engineer", "dept_code": "ENG", "equipment": ["MacBook Pro 16\"", "Monitor 27\"", "Keyboard", "Mouse"]},
    {"name": "Senior Software Engineer", "dept_code": "ENG", "equipment": ["MacBook Pro 16\" M3", "Monitor 32\"", "Keyboard", "Mouse", "Standing Desk"]},
    {"name": "DevOps Engineer", "dept_code": "ENG", "equipment": ["MacBook Pro 16\"", "Monitor 27\"", "Keyboard", "Mouse"]},
    {"name": "Frontend Developer", "dept_code": "ENG", "equipment": ["MacBook Pro 16\"", "Monitor 27\"", "Keyboard", "Mouse"]},
    {"name": "Backend Developer", "dept_code": "ENG", "equipment": ["MacBook Pro 16\"", "Monitor 27\"", "Keyboard", "Mouse"]},
    # AI
    {"name": "AIML Engineer", "dept_code": "AI", "equipment": ["MacBook Pro 16\" M3 Max", "Monitor 32\" 4K", "GPU Access", "Keyboard", "Mouse"]},
    {"name": "Data Scientist", "dept_code": "AI", "equipment": ["MacBook Pro 16\"", "Monitor 27\"", "Keyboard", "Mouse"]},
    {"name": "ML Ops Engineer", "dept_code": "AI", "equipment": ["MacBook Pro 16\"", "Monitor 27\"", "Keyboard", "Mouse"]},
    # HR
    {"name": "HR Specialist", "dept_code": "HR", "equipment": ["MacBook Air", "Monitor 24\""]},
    {"name": "Talent Acquisition Lead", "dept_code": "HR", "equipment": ["MacBook Air", "Monitor 24\""]},
    # Marketing
    {"name": "Marketing Manager", "dept_code": "MKT", "equipment": ["MacBook Pro 14\"", "Monitor 27\""]},
    {"name": "Content Writer", "dept_code": "MKT", "equipment": ["MacBook Air", "Monitor 24\""]},
    # Sales
    {"name": "Sales Executive", "dept_code": "SAL", "equipment": ["MacBook Air", "Monitor 24\""]},
    {"name": "Business Development Manager", "dept_code": "SAL", "equipment": ["MacBook Pro 14\"", "Monitor 27\""]},
    # Finance
    {"name": "Financial Analyst", "dept_code": "FIN", "equipment": ["MacBook Air", "Monitor 24\""]},
    # Design
    {"name": "UI/UX Designer", "dept_code": "DES", "equipment": ["MacBook Pro 16\" M3", "Monitor 32\" 4K", "Wacom Tablet", "Keyboard", "Mouse"]},
    {"name": "Graphic Designer", "dept_code": "DES", "equipment": ["MacBook Pro 14\"", "Monitor 27\"", "Wacom Tablet"]},
    # Product
    {"name": "Product Manager", "dept_code": "PRD", "equipment": ["MacBook Pro 14\"", "Monitor 27\""]},
]

OFFICES = [
    {"name": "Chennai HQ", "location": "OMR, Thoraipakkam, Chennai", "country": "India"},
    {"name": "Bangalore Office", "location": "Koramangala, Bangalore", "country": "India"},
    {"name": "Hyderabad Office", "location": "HITEC City, Hyderabad", "country": "India"},
]

TEAMS = [
    {"name": "Platform Team", "dept_code": "ENG"},
    {"name": "Product Engineering", "dept_code": "ENG"},
    {"name": "Infrastructure", "dept_code": "ENG"},
    {"name": "AI Research", "dept_code": "AI"},
    {"name": "Applied AI", "dept_code": "AI"},
    {"name": "People Operations", "dept_code": "HR"},
    {"name": "Brand & Growth", "dept_code": "MKT"},
    {"name": "Enterprise Sales", "dept_code": "SAL"},
    {"name": "Creative Studio", "dept_code": "DES"},
]

MANAGERS = [
    {"name": "Kalaiarasan S", "email": "kalai@shellkode.com", "designation": "Engineering Lead", "dept_code": "ENG"},
    {"name": "Ajay Kartheek", "email": "ajay@shellkode.com", "designation": "AI Team Lead", "dept_code": "AI"},
    {"name": "Meena Kumari", "email": "meena@shellkode.com", "designation": "HR Director", "dept_code": "HR"},
    {"name": "Vikram Patel", "email": "vikram@shellkode.com", "designation": "Marketing Head", "dept_code": "MKT"},
    {"name": "Deepak Sharma", "email": "deepak@shellkode.com", "designation": "Sales Director", "dept_code": "SAL"},
    {"name": "Anitha R", "email": "anitha@shellkode.com", "designation": "Design Lead", "dept_code": "DES"},
]

# Test new hires (simulating recruiter handoff) — edit as needed
TEST_HIRES = [
    {
        "first_name": "Ajay",
        "last_name": "Kartheek",
        "personal_email": "s.ajaykartheek@gmail.com",
        "phone": "+91 9876543210",
        "designation": "Frontend Developer",
        "dept_code": "ENG",
        "doj": date.today() + timedelta(days=14),
        "recruiter_notes": "Strong React/Next.js skills, 3 years at Infosys. Excellent communication. Passed all 4 interview rounds.",
        "previous_company": "Infosys",
        "years_experience": 3.0,
    },
    {
        "first_name": "Rahul",
        "last_name": "Kumar",
        "personal_email": "rahul.kumar.test@gmail.com",
        "phone": "+91 9876543211",
        "designation": "AIML Engineer",
        "dept_code": "AI",
        "doj": date.today() + timedelta(days=21),
        "recruiter_notes": "MS in Computer Science, specializes in NLP. Published 2 papers on transformer architectures. 2 years at TCS Research.",
        "previous_company": "TCS Research",
        "years_experience": 2.0,
        "linkedin_url": "https://linkedin.com/in/rahulkumar",
    },
    {
        "first_name": "Sneha",
        "last_name": "Reddy",
        "personal_email": "sneha.reddy.test@gmail.com",
        "phone": "+91 9876543212",
        "designation": "UI/UX Designer",
        "dept_code": "DES",
        "doj": date.today() + timedelta(days=10),
        "recruiter_notes": "Outstanding portfolio. 4 years at Zoho, expert in Figma and design systems. Great cultural fit.",
        "previous_company": "Zoho",
        "years_experience": 4.0,
    },
    {
        "first_name": "Arjun",
        "last_name": "Nair",
        "personal_email": "arjun.nair.test@gmail.com",
        "designation": "DevOps Engineer",
        "dept_code": "ENG",
        "doj": date.today() + timedelta(days=7),
        "recruiter_notes": "AWS certified, 5 years experience. Strong Kubernetes and Terraform skills. Previously at Freshworks.",
        "previous_company": "Freshworks",
        "years_experience": 5.0,
    },
    {
        "first_name": "Kavya",
        "last_name": "Menon",
        "personal_email": "kavya.menon.test@gmail.com",
        "designation": "Product Manager",
        "dept_code": "PRD",
        "doj": date.today() + timedelta(days=30),
        "recruiter_notes": "MBA from IIM-B, 6 years in product. Led B2B SaaS products at Chargebee. Strong stakeholder management.",
        "previous_company": "Chargebee",
        "years_experience": 6.0,
    },
]

# Employees who already completed onboarding — shown in "Brand New Employees"
COMPLETED_HIRES = [
    {
        "first_name": "Priya",
        "last_name": "Sharma",
        "personal_email": "priya.sharma@gmail.com",
        "designation": "Senior Software Engineer",
        "dept_code": "ENG",
        "doj": date.today() - timedelta(days=5),
        "previous_company": "Wipro",
        "years_experience": 5.0,
        "employee_id_code": "SK-ENG-0001",
        "company_email": "priya.sharma@shellkode.com",
    },
    {
        "first_name": "Rohan",
        "last_name": "Gupta",
        "personal_email": "rohan.gupta@gmail.com",
        "designation": "Data Scientist",
        "dept_code": "AI",
        "doj": date.today() - timedelta(days=3),
        "previous_company": "Mu Sigma",
        "years_experience": 3.0,
        "employee_id_code": "SK-AI-0001",
        "company_email": "rohan.gupta@shellkode.com",
    },
    {
        "first_name": "Ananya",
        "last_name": "Iyer",
        "personal_email": "ananya.iyer@gmail.com",
        "designation": "Marketing Manager",
        "dept_code": "MKT",
        "doj": date.today() - timedelta(days=7),
        "previous_company": "HubSpot",
        "years_experience": 4.0,
        "employee_id_code": "SK-MKT-0001",
        "company_email": "ananya.iyer@shellkode.com",
    },
    {
        "first_name": "Vikash",
        "last_name": "Pillai",
        "personal_email": "vikash.pillai@gmail.com",
        "designation": "Financial Analyst",
        "dept_code": "FIN",
        "doj": date.today() - timedelta(days=10),
        "previous_company": "Deloitte",
        "years_experience": 2.0,
        "employee_id_code": "SK-FIN-0001",
        "company_email": "vikash.pillai@shellkode.com",
    },
    {
        "first_name": "Divya",
        "last_name": "Krishnan",
        "personal_email": "divya.krishnan@gmail.com",
        "designation": "Graphic Designer",
        "dept_code": "DES",
        "doj": date.today() - timedelta(days=2),
        "previous_company": "Canva",
        "years_experience": 3.5,
        "employee_id_code": "SK-DES-0001",
        "company_email": "divya.krishnan@shellkode.com",
    },
]


def seed():
    """Seed the database with reference data and test hires."""
    print("🌱 Seeding HR-Scheduler-V2 database...")

    # Drop and recreate tables
    print("   Dropping existing tables...")
    drop_all_tables()
    print("   Creating tables...")
    init_db()

    db = SessionLocal()
    try:
        # ── Departments ──
        dept_map = {}
        for d in DEPARTMENTS:
            dept = Department(name=d["name"], code=d["code"], description=d.get("description"))
            db.add(dept)
            db.flush()
            dept_map[d["code"]] = dept.id
        print(f"   ✓ Departments: {len(DEPARTMENTS)}")

        # ── Roles ──
        for r in ROLES:
            role = Role(
                name=r["name"],
                department_id=dept_map.get(r["dept_code"]),
                default_equipment=r.get("equipment", []),
            )
            db.add(role)
        print(f"   ✓ Roles: {len(ROLES)}")

        # ── Offices ──
        for o in OFFICES:
            db.add(Office(name=o["name"], location=o["location"], country=o["country"]))
        print(f"   ✓ Offices: {len(OFFICES)}")

        # ── Teams ──
        for t in TEAMS:
            db.add(Team(name=t["name"], department_id=dept_map.get(t["dept_code"])))
        print(f"   ✓ Teams: {len(TEAMS)}")

        # ── Managers ──
        for m in MANAGERS:
            db.add(Manager(
                name=m["name"], email=m["email"],
                designation=m.get("designation"),
                department_id=dept_map.get(m["dept_code"]),
            ))
        print(f"   ✓ Managers: {len(MANAGERS)}")

        # ── Test New Hires ──
        for h in TEST_HIRES:
            hire = NewHire(
                first_name=h["first_name"],
                last_name=h.get("last_name"),
                personal_email=h["personal_email"],
                phone=h.get("phone"),
                designation=h.get("designation"),
                department_id=dept_map.get(h.get("dept_code")),
                doj=h.get("doj"),
                recruiter_notes=h.get("recruiter_notes"),
                linkedin_url=h.get("linkedin_url"),
                previous_company=h.get("previous_company"),
                years_experience=h.get("years_experience"),
                status=HireStatus.WAITING_FOR_INPUT,
            )
            db.add(hire)
        print(f"   ✓ Test Hires: {len(TEST_HIRES)}")

        # ── Completed Hires (for Brand New Employees section) ──
        for h in COMPLETED_HIRES:
            hire = NewHire(
                first_name=h["first_name"],
                last_name=h.get("last_name"),
                personal_email=h["personal_email"],
                designation=h.get("designation"),
                department_id=dept_map.get(h.get("dept_code")),
                doj=h.get("doj"),
                previous_company=h.get("previous_company"),
                years_experience=h.get("years_experience"),
                employee_id_code=h.get("employee_id_code"),
                company_email=h.get("company_email"),
                status=HireStatus.ACTIVE,
            )
            db.add(hire)
        print(f"   ✓ Completed Hires: {len(COMPLETED_HIRES)}")

        db.commit()
        print("\n✅ Database seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
