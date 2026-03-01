"""
HR-Scheduler-V2 — AI Service (AWS Bedrock / Claude)
Generates personalized content: welcome emails, onboarding plans.
"""

import json
import os
import logging
import boto3
from botocore.exceptions import ClientError
from app.config import get_settings

logger = logging.getLogger("hr_scheduler_v2")
settings = get_settings()


def _get_bedrock_client():
    return boto3.client("bedrock-runtime", region_name=settings.aws_region)


def invoke_llm(system_prompt: str, user_prompt: str, max_tokens: int = 2048) -> str:
    """
    Invoke Claude via Bedrock. Falls back to mock in AI_MOCK_MODE.
    """
    if settings.ai_mock_mode:
        return _mock_response(user_prompt)

    try:
        client = _get_bedrock_client()
        response = client.converse(
            modelId=settings.bedrock_model_id,
            messages=[{"role": "user", "content": [{"text": user_prompt}]}],
            system=[{"text": system_prompt}],
            inferenceConfig={"maxTokens": max_tokens, "temperature": 0.7, "topP": 0.95},
        )
        return response["output"]["message"]["content"][0]["text"]
    except ClientError as e:
        logger.error(f"Bedrock API error: {e}")
        raise Exception(f"AI service error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected AI error: {e}")
        raise


def generate_welcome_email_content(
    first_name: str,
    last_name: str = "",
    designation: str = "",
    department: str = "",
    doj: str = "",
    recruiter_notes: str = "",
) -> str:
    """Generate a personalized welcome email body using LLM."""
    system = """You are an HR communications specialist at Shellkode Technologies.
Write a warm, professional welcome email for a new hire. The email should:
- Be personalized based on the recruiter's notes
- Mention their role and team
- Reference their date of joining
- Be encouraging and make them excited to join
- Keep it concise (3-4 paragraphs max)
- Don't include any subject line — just the email body
- Don't include any HTML — plain text only
- Sign off as 'HR Team, Shellkode Technologies'"""

    user = f"""Write a welcome email for:
Name: {first_name} {last_name}
Role: {designation}
Department: {department}
Date of Joining: {doj}
Recruiter Notes: {recruiter_notes}"""

    return invoke_llm(system, user, max_tokens=800)


def generate_onboarding_plan(
    first_name: str,
    designation: str = "",
    department: str = "",
    doj: str = "",
    manager_name: str = "",
    role_name: str = "",
    custom_notes: str = "",
) -> str:
    """Generate a personalized 1-week onboarding plan."""
    system = """You are an onboarding specialist at Shellkode Technologies.
Create a structured 1-week (5-day) onboarding schedule for a new hire. Format as:

DAY 1: Welcome and Setup
- Specific activities with times (e.g. 09:30 AM - Badge Collection)

DAY 2: Product and Tools
- Training sessions

DAY 3: Codebase and Workflow
- Technical onboarding

DAY 4: Compliance and Team
- Required training and team activities

DAY 5: Review and Planning
- Week 1 review with manager, plan for week 2

Rules:
- Keep each day to 3-5 activities
- Include realistic time slots
- Make activities role-specific
- Format as clean plain text with bullet points
- No HTML, no markdown headers"""

    user = f"""Create a 1-week onboarding schedule for:
Name: {first_name}
Role: {designation} ({role_name})
Department: {department}
Date of Joining: {doj}
Manager: {manager_name}
Additional Notes: {custom_notes}"""

    return invoke_llm(system, user, max_tokens=1000)


def _mock_response(prompt: str) -> str:
    """Fallback mock for when AI is disabled."""
    if "welcome email" in prompt.lower():
        return """Dear New Hire,

Welcome to Shellkode Technologies! We're thrilled to have you join our team.

Your skills and experience will be a valuable addition. We've been looking forward to your arrival and have everything prepared for a smooth start.

Please don't hesitate to reach out if you have any questions before your joining date.

Warm regards,
HR Team, Shellkode Technologies"""

    return """30-60-90 Day Onboarding Plan

WEEK 1: Orientation & Setup
- Complete IT setup and access provisioning
- Meet your team and manager
- Review company policies and culture guide
- Attend new hire orientation session

DAYS 8-30: Learning & Integration
- Shadow team members on active projects
- Complete required compliance training
- Begin role-specific skill development
- Weekly 1:1 with manager

DAYS 31-60: Building & Contributing
- Take ownership of assigned tasks
- Contribute to team projects
- Provide feedback on onboarding experience
- Mid-point review with manager

DAYS 61-90: Ownership & Growth
- Independent project execution
- Identify areas for growth
- 90-day performance review
- Set goals for the next quarter"""
