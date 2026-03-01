"""
HR-Scheduler-V2 — Configuration
All env vars in one place. Edit .env to change values.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── Database ──
    database_url: str = "postgresql://localhost:5432/hr_scheduler_v2"

    # ── AI (Bedrock) ──
    aws_region: str = "us-east-1"
    bedrock_model_id: str = "us.anthropic.claude-sonnet-4-20250514-v1:0"
    ai_mock_mode: bool = False

    # ── Email (Gmail) ──
    gmail_credentials_file: str = "../../backend/credentials.json"
    gmail_token_file: str = "../../backend/token.json"
    sender_email: str = "kalaiarasan6923@gmail.com"

    # ── App ──
    frontend_url: str = "http://localhost:3001"
    app_env: str = "development"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
