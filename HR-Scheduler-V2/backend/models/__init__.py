"""
Models package — imports all models so SQLAlchemy can discover them.
"""

from models.reference import Department, Role, Office, Team, Manager
from models.employee import NewHire, HireStatus
from models.onboarding import FormResponse, OnboardingSession
from models.document import Document
from models.asset_request import AssetRequest
from models.email_log import EmailLog

__all__ = [
    "Department", "Role", "Office", "Team", "Manager",
    "NewHire", "HireStatus",
    "FormResponse", "OnboardingSession",
    "Document", "AssetRequest", "EmailLog",
]
