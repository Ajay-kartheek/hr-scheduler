"""
HR-Scheduler-V2 — Seed Data
═══════════════════════════════════════════════════════════
To edit departments, roles, offices, etc., modify the lists below.
Run: python -m db.seed
"""

import sys
import os
import hashlib
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import date, timedelta
from db.database import SessionLocal, init_db, drop_all_tables
from models import (
    Department, Role, Office, Team, Manager, NewHire, HireStatus,
)
from models.candidate import Candidate, CandidateStatus


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
        "first_name": "Priya",
        "last_name": "Sharma",
        "personal_email": "priya.sharma.test@gmail.com",
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
        # Portal demo — password: welcome123
        "portal_password_hash": hashlib.sha256("welcome123".encode()).hexdigest(),
        "portal_onboarding_complete": False,
        "_portal_demo": True,
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
    {
        "first_name": "Sanjay",
        "last_name": "Venkat",
        "personal_email": "sanjay.venkat@gmail.com",
        "designation": "Backend Developer",
        "dept_code": "ENG",
        "doj": date.today() - timedelta(days=1),
        "previous_company": "Cognizant",
        "years_experience": 2.5,
        "employee_id_code": "SK-ENG-0003",
        "company_email": "sanjay.venkat@shellkode.com",
    },
    {
        "first_name": "Revathi",
        "last_name": "Sundaram",
        "personal_email": "revathi.sundaram@gmail.com",
        "designation": "Talent Acquisition Lead",
        "dept_code": "HR",
        "doj": date.today() - timedelta(days=4),
        "previous_company": "Randstad",
        "years_experience": 5.0,
        "employee_id_code": "SK-HR-0001",
        "company_email": "revathi.sundaram@shellkode.com",
    },
    {
        "first_name": "Manoj",
        "last_name": "Balaji",
        "personal_email": "manoj.balaji@gmail.com",
        "designation": "Business Development Manager",
        "dept_code": "SAL",
        "doj": date.today() - timedelta(days=6),
        "previous_company": "Oracle",
        "years_experience": 6.0,
        "employee_id_code": "SK-SAL-0001",
        "company_email": "manoj.balaji@shellkode.com",
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
                portal_password_hash=h.get("portal_password_hash"),
                portal_onboarding_complete=h.get("portal_onboarding_complete", False),
            )
            db.add(hire)
            db.flush()

            # Add documents and assets for demo portal hire
            if h.get("_portal_demo"):
                from models.document import Document
                from models.asset_request import AssetRequest
                from models.onboarding import FormResponse, OnboardingSession

                # NDA document
                db.add(Document(
                    new_hire_id=hire.id,
                    name="Non-Disclosure Agreement",
                    document_type="global",
                    requires_signature=True,
                    signature_status="pending",
                    file_path="/documents/nda_shellkode_2026.pdf",
                ))
                # Leave policy
                db.add(Document(
                    new_hire_id=hire.id,
                    name="Leave Policy 2026",
                    document_type="global",
                    requires_signature=True,
                    signature_status="pending",
                    file_path="/documents/leave_policy_2026.pdf",
                ))
                # Employee handbook
                db.add(Document(
                    new_hire_id=hire.id,
                    name="Employee Handbook",
                    document_type="global",
                    requires_signature=False,
                    signature_status="not_required",
                    file_path="/documents/employee_handbook.pdf",
                ))
                # Asset request
                db.add(AssetRequest(
                    new_hire_id=hire.id,
                    equipment_list=["MacBook Pro 16-inch M3", "Dell 27\" 4K Monitor", "Magic Keyboard", "Magic Mouse"],
                    status="pending",
                    notes="Standard engineering setup",
                ))
                # Form response (partial — employee will complete rest)
                db.add(FormResponse(
                    new_hire_id=hire.id,
                    phone="+91 98765 43210",
                    blood_group="O+",
                    address="123 MG Road, Bangalore",
                ))
                # Onboarding session with plan
                db.add(OnboardingSession(
                    new_hire_id=hire.id,
                    current_step=4,
                    status="completed",
                    onboarding_plan="""## Week 1 Schedule

**Monday — Day 1**
- 9:00 AM — Welcome & campus tour
- 10:30 AM — IT setup & laptop handover
- 11:30 AM — Team introduction with Manager
- 2:00 PM — HR orientation session
- 3:30 PM — Access card & ID badge pickup

**Tuesday — Day 2**
- 9:30 AM — Engineering tools setup (Git, IDE, AWS)
- 11:00 AM — Codebase walkthrough with tech lead
- 2:00 PM — Architecture overview presentation
- 4:00 PM — Dev environment verification

**Wednesday — Day 3**
- 9:30 AM — Sprint planning meeting (shadow)
- 11:00 AM — First task assignment
- 2:00 PM — Company values & culture session
- 3:30 PM — Buddy program intro

**Thursday — Day 4**
- 9:30 AM — Deep dive: CI/CD pipeline
- 11:00 AM — Code review process & standards
- 2:00 PM — Cross-team meet & greet
- 4:00 PM — First PR (starter task)

**Friday — Day 5**
- 9:30 AM — Week 1 retrospective with manager
- 11:00 AM — Q&A with team lead
- 2:00 PM — Learning path & goals discussion
- 3:30 PM — Social: team coffee chat""",
                ))
        print(f"   ✓ Completed Hires: {len(COMPLETED_HIRES)}")

        # ── Selected Candidates (Recruiter Pipeline) ──
        SELECTED_CANDIDATES = [
            {
                "first_name": "Ajay", "last_name": "Kartheek",
                "email": "s.ajaykartheek@gmail.com", "phone": "+91 90012 34567",
                "designation": "Senior Backend Engineer",
                "current_company": "Zoho Corporation", "years_experience": 5.5,
                "linkedin_url": "https://linkedin.com/in/ajay-kartheek",
                "expected_ctc": "₹22 LPA", "offered_ctc": "₹24 LPA",
                "recruiter_notes": "Strong in Python/FastAPI, system design. Led a team of 4 at Zoho. Excellent communication skills. Cleared all 4 rounds.",
                "dept_code": "ENG",
            },
            {
                "first_name": "Meera", "last_name": "Joshi",
                "email": "meera.joshi.test@gmail.com", "phone": "+91 98765 43210",
                "designation": "ML Engineer",
                "current_company": "Fractal Analytics", "years_experience": 3.0,
                "linkedin_url": "https://linkedin.com/in/meera-joshi",
                "expected_ctc": "₹18 LPA", "offered_ctc": "₹20 LPA",
                "recruiter_notes": "NLP specialist, published 2 papers. Experience with LLMs and RAG pipelines. Great culture fit.",
                "dept_code": "AI",
            },
            {
                "first_name": "Karthik", "last_name": "Rajan",
                "email": "karthik.rajan.test@gmail.com", "phone": "+91 87654 32109",
                "designation": "Full Stack Developer",
                "current_company": "Freshworks", "years_experience": 4.0,
                "linkedin_url": "https://linkedin.com/in/karthik-rajan",
                "expected_ctc": "₹16 LPA", "offered_ctc": "₹18 LPA",
                "recruiter_notes": "Strong React + Node.js experience. Built customer-facing products at Freshworks serving 10K+ users. Quick learner.",
                "dept_code": "ENG",
            },
            {
                "first_name": "Sneha", "last_name": "Reddy",
                "email": "sneha.reddy.test@gmail.com", "phone": "+91 76543 21098",
                "designation": "UX Designer",
                "current_company": "Swiggy", "years_experience": 3.5,
                "linkedin_url": "https://linkedin.com/in/sneha-reddy",
                "expected_ctc": "₹14 LPA", "offered_ctc": "₹15 LPA",
                "recruiter_notes": "Impressive portfolio, redesigned Swiggy's checkout flow. Strong in Figma, user research, and design systems.",
                "dept_code": "DES",
            },
            {
                "first_name": "Varun", "last_name": "Mehta",
                "email": "varun.mehta.test@gmail.com", "phone": "+91 65432 10987",
                "designation": "DevOps Engineer",
                "current_company": "Razorpay", "years_experience": 6.0,
                "linkedin_url": "https://linkedin.com/in/varun-mehta",
                "expected_ctc": "₹28 LPA", "offered_ctc": "₹30 LPA",
                "recruiter_notes": "AWS certified, managed infrastructure at scale (100+ microservices). Strong in Kubernetes, Terraform, CI/CD.",
                "dept_code": "ENG",
            },
            {
                "first_name": "Divya", "last_name": "Patel",
                "email": "divya.patel.test@gmail.com", "phone": "+91 54321 09876",
                "designation": "Product Marketing Manager",
                "current_company": "Notion", "years_experience": 4.5,
                "linkedin_url": "https://linkedin.com/in/divya-patel",
                "expected_ctc": "₹20 LPA", "offered_ctc": "₹22 LPA",
                "recruiter_notes": "Led GTM strategy for Notion India launch. Strong analytical mindset, great storytelling skills. MBA from ISB.",
                "dept_code": "MKT",
            },
            # ── 12 NEW CANDIDATES ──
            {
                "first_name": "Adhithya", "last_name": "G P",
                "email": "adhithyagp7878@gmail.com", "phone": "+91 91234 56780",
                "designation": "Backend Developer",
                "current_company": "Wipro", "years_experience": 2.5,
                "linkedin_url": "https://linkedin.com/in/adhithya-gp",
                "expected_ctc": "₹12 LPA", "offered_ctc": "₹14 LPA",
                "recruiter_notes": "Strong Java/Spring Boot background, migrated 3 monoliths to microservices at Wipro. Clean coding practices. Passed all rounds.",
                "dept_code": "ENG",
            },
            {
                "first_name": "Kalaiarasan", "last_name": "S",
                "email": "starkgamingchannelyt@gmail.com", "phone": "+91 92345 67801",
                "designation": "AIML Engineer",
                "current_company": "TCS Research", "years_experience": 3.0,
                "linkedin_url": "https://linkedin.com/in/kalaiarasan-s",
                "expected_ctc": "₹20 LPA", "offered_ctc": "₹22 LPA",
                "recruiter_notes": "Built production NLP pipelines, fine-tuned LLMs for enterprise use cases. Published at ACL. Strong Python and PyTorch skills.",
                "dept_code": "AI",
            },
            {
                "first_name": "Kalai", "last_name": "DS",
                "email": "kalaihackathon@gmail.com", "phone": "+91 93456 78902",
                "designation": "Data Scientist",
                "current_company": "Mu Sigma", "years_experience": 2.0,
                "linkedin_url": "https://linkedin.com/in/kalai-ds",
                "expected_ctc": "₹14 LPA", "offered_ctc": "₹16 LPA",
                "recruiter_notes": "Won 3 national hackathons. Strong in statistical modeling, pandas, scikit-learn. Built recommendation engine at Mu Sigma.",
                "dept_code": "AI",
            },
            {
                "first_name": "Kalai", "last_name": "MF",
                "email": "kalai.ds.mfedu@gmail.com", "phone": "+91 94567 89013",
                "designation": "ML Ops Engineer",
                "current_company": "Infosys", "years_experience": 3.5,
                "linkedin_url": "https://linkedin.com/in/kalai-mf",
                "expected_ctc": "₹18 LPA", "offered_ctc": "₹20 LPA",
                "recruiter_notes": "Expert in MLflow, Kubeflow, model deployment pipelines. Automated ML lifecycle for 15+ models in production. AWS ML certified.",
                "dept_code": "AI",
            },
            {
                "first_name": "Nithya", "last_name": "Ramesh",
                "email": "nithya.ramesh.test@gmail.com", "phone": "+91 95678 90124",
                "designation": "Frontend Developer",
                "current_company": "Flipkart", "years_experience": 3.0,
                "linkedin_url": "https://linkedin.com/in/nithya-ramesh",
                "expected_ctc": "₹16 LPA", "offered_ctc": "₹18 LPA",
                "recruiter_notes": "Built Flipkart's seller dashboard in React. Strong TypeScript, Next.js skills. Excellent UI performance optimization experience.",
                "dept_code": "ENG",
            },
            {
                "first_name": "Surya", "last_name": "Prakash",
                "email": "surya.prakash.test@gmail.com", "phone": "+91 96789 01235",
                "designation": "Senior Software Engineer",
                "current_company": "Amazon", "years_experience": 5.0,
                "linkedin_url": "https://linkedin.com/in/surya-prakash",
                "expected_ctc": "₹30 LPA", "offered_ctc": "₹32 LPA",
                "recruiter_notes": "SDE-2 at Amazon, owned order management microservice handling 1M+ daily transactions. Strong system design. Bar raiser approved.",
                "dept_code": "ENG",
            },
            {
                "first_name": "Pooja", "last_name": "Venkatesh",
                "email": "pooja.venkatesh.test@gmail.com", "phone": "+91 97890 12346",
                "designation": "Product Manager",
                "current_company": "PhonePe", "years_experience": 4.0,
                "linkedin_url": "https://linkedin.com/in/pooja-venkatesh",
                "expected_ctc": "₹24 LPA", "offered_ctc": "₹26 LPA",
                "recruiter_notes": "Led insurance vertical at PhonePe, grew user base 3x in 1 year. Strong data-driven decision making. MBA from XLRI.",
                "dept_code": "PRD",
            },
            {
                "first_name": "Aravind", "last_name": "Kumar",
                "email": "aravind.kumar.test@gmail.com", "phone": "+91 98901 23457",
                "designation": "Sales Executive",
                "current_company": "Salesforce", "years_experience": 3.0,
                "linkedin_url": "https://linkedin.com/in/aravind-kumar",
                "expected_ctc": "₹15 LPA", "offered_ctc": "₹17 LPA",
                "recruiter_notes": "Consistently exceeded sales targets by 130% at Salesforce India. Strong relationship building skills. CRM expert.",
                "dept_code": "SAL",
            },
            {
                "first_name": "Lakshmi", "last_name": "Narayanan",
                "email": "lakshmi.narayanan.test@gmail.com", "phone": "+91 90123 45678",
                "designation": "Financial Analyst",
                "current_company": "KPMG", "years_experience": 2.5,
                "linkedin_url": "https://linkedin.com/in/lakshmi-narayanan",
                "expected_ctc": "₹12 LPA", "offered_ctc": "₹14 LPA",
                "recruiter_notes": "CA finalist, strong in financial modeling and audit. Built automated reporting dashboards at KPMG. Detail-oriented.",
                "dept_code": "FIN",
            },
            {
                "first_name": "Harish", "last_name": "Subramanian",
                "email": "harish.subramanian.test@gmail.com", "phone": "+91 91234 56789",
                "designation": "Content Writer",
                "current_company": "Freshdesk", "years_experience": 2.0,
                "linkedin_url": "https://linkedin.com/in/harish-subramanian",
                "expected_ctc": "₹8 LPA", "offered_ctc": "₹10 LPA",
                "recruiter_notes": "Wrote product documentation and blog content for Freshdesk. Strong SEO knowledge. Published in TechCrunch and YourStory.",
                "dept_code": "MKT",
            },
            {
                "first_name": "Deepa", "last_name": "Mohan",
                "email": "deepa.mohan.test@gmail.com", "phone": "+91 92345 67890",
                "designation": "HR Specialist",
                "current_company": "Accenture", "years_experience": 4.0,
                "linkedin_url": "https://linkedin.com/in/deepa-mohan",
                "expected_ctc": "₹14 LPA", "offered_ctc": "₹16 LPA",
                "recruiter_notes": "Managed employee engagement for 500+ staff at Accenture. SHRM certified. Strong in HRIS systems and policy design.",
                "dept_code": "HR",
            },
        ]

        for c in SELECTED_CANDIDATES:
            candidate = Candidate(
                first_name=c["first_name"],
                last_name=c["last_name"],
                email=c["email"],
                phone=c.get("phone"),
                designation=c.get("designation"),
                department_id=dept_map.get(c["dept_code"]),
                current_company=c.get("current_company"),
                years_experience=c.get("years_experience"),
                linkedin_url=c.get("linkedin_url"),
                expected_ctc=c.get("expected_ctc"),
                offered_ctc=c.get("offered_ctc"),
                recruiter_notes=c.get("recruiter_notes"),
                status=CandidateStatus.SELECTED,
            )
            db.add(candidate)
        print(f"   ✓ Selected Candidates: {len(SELECTED_CANDIDATES)}")

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
