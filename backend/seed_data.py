"""
HR Scheduler — Seed Data
Populates the database with departments, training modules, and sample data.
"""

from database import SessionLocal
from models import (
    Department, TrainingModule, TrainingType, QuizQuestion, AppConfig
)


def seed_departments(db):
    """Create the Shellkode org hierarchy."""
    existing = db.query(Department).count()
    if existing > 0:
        return

    # Root
    root = Department(
        name="Shellkode Technologies",
        code="SK",
        head_name="CEO",
        head_email="ceo@shellkode.com",
    )
    db.add(root)
    db.flush()

    departments = [
        {"name": "Artificial Intelligence", "code": "AI", "parent_id": root.id,
         "head_name": "AI Lead", "email_group": "ai-team@shellkode.com"},
        {"name": "Cloud Solutions", "code": "CLD", "parent_id": root.id,
         "head_name": "Cloud Lead", "email_group": "cloud-team@shellkode.com"},
        {"name": "Data Engineering", "code": "DAT", "parent_id": root.id,
         "head_name": "Data Lead", "email_group": "data-team@shellkode.com"},
        {"name": "Database Services", "code": "DBA", "parent_id": root.id,
         "head_name": "DB Lead", "email_group": "db-team@shellkode.com"},
        {"name": "Managed Services", "code": "MSP", "parent_id": root.id,
         "head_name": "MSP Lead", "email_group": "msp-team@shellkode.com"},
        {"name": "DevOps", "code": "DVO", "parent_id": root.id,
         "head_name": "DevOps Lead", "email_group": "devops-team@shellkode.com"},
        {"name": "Full Stack Development", "code": "FSD", "parent_id": root.id,
         "head_name": "FullStack Lead", "email_group": "fullstack-team@shellkode.com"},
        {"name": "Security", "code": "SEC", "parent_id": root.id,
         "head_name": "Security Lead", "email_group": "security-team@shellkode.com"},
        {"name": "Sales & Marketing", "code": "SAL", "parent_id": root.id,
         "head_name": "Sales Lead", "email_group": "sales-team@shellkode.com"},
        {"name": "Human Resources", "code": "HRD", "parent_id": root.id,
         "head_name": "HR Lead", "email_group": "hr-team@shellkode.com"},
    ]

    for dept_data in departments:
        dept = Department(**dept_data)
        db.add(dept)

    db.commit()
    print(f"✅ Seeded {len(departments) + 1} departments")


def seed_training_modules(db):
    """Create default training modules."""
    existing = db.query(TrainingModule).count()
    if existing > 0:
        return

    modules = [
        {
            "title": "Company Induction",
            "description": "Overview of Shellkode — our mission, vision, values, and organizational structure.",
            "training_type": TrainingType.INDUCTION,
            "content_html": """
<h2>Welcome to Shellkode Technologies</h2>
<p>Shellkode is a leading IT services and solutions company, specializing in Cloud, AI/ML, Data Engineering, Security, and Managed Services.</p>

<h3>Our Mission</h3>
<p>To deliver innovative technology solutions that transform businesses and empower teams to achieve their full potential.</p>

<h3>Our Vision</h3>
<p>To be the most trusted technology partner for organizations worldwide, known for excellence, innovation, and integrity.</p>

<h3>Our Core Values</h3>
<ul>
<li><strong>Innovation</strong> — We embrace new ideas and technologies</li>
<li><strong>Integrity</strong> — We do the right thing, always</li>
<li><strong>Collaboration</strong> — We succeed together</li>
<li><strong>Excellence</strong> — We set high standards and deliver</li>
<li><strong>Customer First</strong> — Our clients' success is our success</li>
</ul>

<h3>Organizational Structure</h3>
<p>Shellkode operates through specialized Business Units including AI, Cloud, Data, DevOps, Security, MSP, and more. Each BU is led by a domain expert who ensures we deliver best-in-class solutions.</p>
""",
            "duration_minutes": 30,
            "order": 1,
            "requires_acknowledgment": True,
        },
        {
            "title": "Security & Policy Training",
            "description": "Information security best practices, data protection, and compliance policies.",
            "training_type": TrainingType.SECURITY,
            "content_html": """
<h2>Information Security at Shellkode</h2>

<h3>Data Protection Policy</h3>
<ul>
<li>Never share client data outside authorized channels</li>
<li>Always use encrypted communication for sensitive information</li>
<li>Report any data breach immediately to security@shellkode.com</li>
<li>Do not store client data on personal devices</li>
</ul>

<h3>Access Control</h3>
<ul>
<li>Use strong passwords (min 12 characters, mixed case, numbers, symbols)</li>
<li>Enable 2FA on all company accounts</li>
<li>Never share credentials with anyone</li>
<li>Lock your screen when stepping away (max 5 min auto-lock)</li>
</ul>

<h3>Device Security</h3>
<ul>
<li>Keep operating system and software updated</li>
<li>Do not install unauthorized software</li>
<li>Ensure disk encryption is enabled (FileVault/BitLocker)</li>
<li>Use company VPN when on public networks</li>
</ul>

<h3>Incident Reporting</h3>
<p>If you suspect a security incident, immediately contact security@shellkode.com with details of the incident.</p>
""",
            "duration_minutes": 45,
            "order": 2,
            "requires_acknowledgment": True,
        },
        {
            "title": "Communication Ethics",
            "description": "Professional communication guidelines for email, chat, meetings, and external interactions.",
            "training_type": TrainingType.COMMUNICATION,
            "content_html": """
<h2>Communication Ethics at Shellkode</h2>

<h3>Email Etiquette</h3>
<ul>
<li>Use clear, professional subject lines</li>
<li>Respond within 24 hours on business days</li>
<li>CC only relevant stakeholders</li>
<li>Proofread before sending</li>
</ul>

<h3>Meeting Guidelines</h3>
<ul>
<li>Be punctual to all meetings</li>
<li>Come prepared with agenda items</li>
<li>Mute when not speaking in virtual meetings</li>
<li>Follow up with action items within 24 hours</li>
</ul>

<h3>Client Communication</h3>
<ul>
<li>Always maintain professionalism</li>
<li>Never discuss internal matters with clients</li>
<li>Escalate client concerns through proper channels</li>
<li>Represent Shellkode with pride and integrity</li>
</ul>

<h3>Social Media</h3>
<ul>
<li>Do not share confidential company information on social media</li>
<li>Use discretion when posting about work</li>
<li>Clearly distinguish personal opinions from company positions</li>
</ul>
""",
            "duration_minutes": 30,
            "order": 3,
            "requires_acknowledgment": True,
        },
        {
            "title": "Leave Policy",
            "description": "Understanding your leave entitlements, types of leave, and the process for applying.",
            "training_type": TrainingType.LEAVE_POLICY,
            "content_html": """
<h2>Leave Policy — Shellkode Technologies</h2>

<h3>Leave Entitlements (Annual)</h3>
<table>
<tr><th>Leave Type</th><th>Days</th><th>Notes</th></tr>
<tr><td>Casual Leave</td><td>12</td><td>Max 3 consecutive days</td></tr>
<tr><td>Sick Leave</td><td>12</td><td>Medical certificate for 3+ days</td></tr>
<tr><td>Public Holidays</td><td>12</td><td>As per calendar</td></tr>
<tr><td>Comp-off</td><td>As earned</td><td>For weekend/holiday work</td></tr>
</table>

<h3>How to Apply</h3>
<ol>
<li>Submit leave request through the HR portal at least 3 days in advance (planned leave)</li>
<li>For emergency/sick leave, inform your manager via email/chat immediately</li>
<li>Manager approval is required for all leaves</li>
</ol>

<h3>Probation Period</h3>
<p>During the probation period (first 6 months), leave entitlements are prorated.</p>

<h3>Important Notes</h3>
<ul>
<li>Unused casual leave can be carried forward (max 5 days)</li>
<li>Sick leave cannot be carried forward</li>
<li>Unauthorized absence may lead to disciplinary action</li>
</ul>
""",
            "duration_minutes": 20,
            "order": 4,
            "requires_acknowledgment": True,
        },
    ]

    for mod_data in modules:
        module = TrainingModule(**mod_data)
        db.add(module)

    db.commit()

    # Add quiz questions for Security training
    security_module = db.query(TrainingModule).filter(
        TrainingModule.training_type == TrainingType.SECURITY
    ).first()

    if security_module:
        quiz_questions = [
            {
                "module_id": security_module.id,
                "question": "What should you do if you suspect a data breach?",
                "options": [
                    "Ignore it",
                    "Tell a colleague",
                    "Report immediately to security@shellkode.com",
                    "Post about it on social media"
                ],
                "correct_answer": 2,
                "explanation": "Security incidents must be reported immediately to the security team.",
                "order": 1,
            },
            {
                "module_id": security_module.id,
                "question": "What is the minimum password length recommended?",
                "options": ["6 characters", "8 characters", "10 characters", "12 characters"],
                "correct_answer": 3,
                "explanation": "We require a minimum of 12 characters with mixed case, numbers, and symbols.",
                "order": 2,
            },
            {
                "module_id": security_module.id,
                "question": "When should you use the company VPN?",
                "options": [
                    "Only at the office",
                    "When on public networks",
                    "Never",
                    "Only when accessing social media"
                ],
                "correct_answer": 1,
                "explanation": "The VPN should always be used when connected to public or untrusted networks.",
                "order": 3,
            },
        ]

        for q_data in quiz_questions:
            q = QuizQuestion(**q_data)
            db.add(q)

        db.commit()

    print(f"✅ Seeded {len(modules)} training modules with quiz questions")


def seed_app_config(db):
    """Seed default application configuration."""
    existing = db.query(AppConfig).count()
    if existing > 0:
        return

    configs = [
        {
            "key": "company_name",
            "value": "Shellkode Technologies",
            "description": "Company name displayed across the platform",
        },
        {
            "key": "follow_up_cadence",
            "value": {"day_1": "gentle", "day_3": "firm", "day_5": "escalate"},
            "description": "Automated follow-up cadence for pending actions",
        },
        {
            "key": "sla_days",
            "value": {"laptop_approval": 3, "email_creation": 2, "id_card": 5, "access_card": 5},
            "description": "SLA deadlines in days for various workflow steps",
        },
        {
            "key": "email_sending",
            "value": {"enabled": False, "from_address": "hr@shellkode.com"},
            "description": "Email sending configuration (disabled for dev)",
        },
    ]

    for config in configs:
        db.add(AppConfig(**config))

    db.commit()
    print(f"✅ Seeded {len(configs)} app configs")


def seed_buddy_employees(db):
    """Seed existing team members who can be onboarding buddies."""
    from models import BuddyEmployee

    if db.query(BuddyEmployee).count() > 0:
        print("   Buddy employees already seeded, skipping")
        return

    buddies = [
        {"name": "Adhithya GP", "email": "adhithyagp7878@gmail.com", "designation": "Senior AI/ML Engineer", "department": "AI", "experience_years": 4},
        {"name": "Rahul Menon", "email": "rahul.menon@shellkode.com", "designation": "ML Ops Lead", "department": "AI", "experience_years": 5},
        {"name": "Sneha Reddy", "email": "sneha.reddy@shellkode.com", "designation": "Cloud Architect", "department": "Cloud", "experience_years": 6},
        {"name": "Vikram Patel", "email": "vikram.patel@shellkode.com", "designation": "Data Engineer", "department": "Data", "experience_years": 3},
        {"name": "Aisha Khan", "email": "aisha.khan@shellkode.com", "designation": "DevOps Engineer", "department": "DevOps", "experience_years": 3},
        {"name": "Karthik Nair", "email": "karthik.nair@shellkode.com", "designation": "Full Stack Developer", "department": "FullStack", "experience_years": 4},
        {"name": "Ananya Iyer", "email": "ananya.iyer@shellkode.com", "designation": "Security Analyst", "department": "Security", "experience_years": 3},
        {"name": "Deepak Kumar", "email": "deepak.kumar@shellkode.com", "designation": "MSP Manager", "department": "MSP", "experience_years": 5},
        {"name": "Meera Joshi", "email": "meera.joshi@shellkode.com", "designation": "HR Business Partner", "department": "HR", "experience_years": 4},
        {"name": "Arjun Bhat", "email": "arjun.bhat@shellkode.com", "designation": "DBA Lead", "department": "DB", "experience_years": 4},
    ]

    for b in buddies:
        buddy = BuddyEmployee(**b)
        db.add(buddy)

    db.commit()
    print(f"   ✓ {len(buddies)} buddy employees seeded")


def seed_all():
    """Run all seed operations."""
    db = SessionLocal()
    try:
        print("🌱 Seeding database...")
        seed_departments(db)
        seed_training_modules(db)
        seed_app_config(db)
        seed_buddy_employees(db)
        print("🌱 Seeding complete!")
    finally:
        db.close()


if __name__ == "__main__":
    from database import init_db
    init_db()
    seed_all()
