"""
Asset request service — notifies asset management team when equipment is needed.
"""

import logging
from services.email_service import send_email
from app.config import get_settings

logger = logging.getLogger("hr_scheduler_v2")
settings = get_settings()

# Edit this to change who receives asset requests
ASSET_TEAM_EMAIL = "ajaykartheek.cloud@gmail.com"


def notify_asset_team(new_hire, role, db=None):
    """
    Notify the asset management team about a new equipment request.
    In future, this will call the Asset Management Platform API.
    """
    first_name = new_hire.first_name or "New Hire"
    full_name = f"{first_name} {new_hire.last_name or ''}".strip()
    doj_str = new_hire.doj.strftime("%B %d, %Y") if new_hire.doj else "TBD"
    equipment = role.default_equipment or []

    equipment_html = "".join(f"<li>{item}</li>" for item in equipment)

    subject = f"🖥️ Equipment Request — {full_name} ({role.name})"
    body_html = f"""
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e40af; padding: 24px; border-radius: 12px 12px 0 0; color: white;">
            <h2 style="margin: 0;">New Equipment Request</h2>
        </div>
        <div style="background: white; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <p><strong>Employee:</strong> {full_name}</p>
            <p><strong>Role:</strong> {role.name}</p>
            <p><strong>Date of Joining:</strong> {doj_str}</p>
            <p><strong>Equipment Required:</strong></p>
            <ul>{equipment_html}</ul>
            <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">
                — HR Onboarding System, Shellkode Pvt Ltd
            </p>
        </div>
    </div>
    """

    send_email(
        to_email=ASSET_TEAM_EMAIL,
        subject=subject,
        body_html=body_html,
        body_text=f"Equipment request for {full_name} ({role.name}): {', '.join(equipment)}",
        new_hire_id=new_hire.id,
        template_type="asset_request",
        db=db,
    )
    logger.info(f"📦 Asset request notification sent for {full_name}")
