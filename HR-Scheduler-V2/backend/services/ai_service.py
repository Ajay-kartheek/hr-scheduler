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
    system = """You are an HR communications specialist at Shellkode Pvt Ltd.
Write a warm, professional welcome email for a new hire. The email should:
- Be personalized based on the recruiter's notes
- Mention their role and team
- Reference their date of joining
- Be encouraging and make them excited to join
- Keep it concise (3-4 paragraphs max)
- Don't include any subject line — just the email body
- Don't include any HTML — plain text only
- Sign off as 'HR Team, Shellkode Pvt Ltd'"""

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
    system = """You are an onboarding specialist at Shellkode Pvt Ltd.
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


def generate_offer_letter(
    first_name: str,
    last_name: str = "",
    designation: str = "",
    department: str = "",
    offered_ctc: str = "",
    custom_notes: str = "",
) -> str:
    """Generate a personalized offer letter using LLM."""
    system = """You are a talent acquisition specialist at Shellkode Pvt Ltd.
Write a warm, professional offer letter for a selected candidate. The letter should:
- Congratulate them on being selected
- Mention the role and department
- If CTC is provided, mention the compensation package
- Highlight the company culture and growth opportunities
- Mention benefits (health insurance, learning budget, flexible hours, team events)
- Ask them to confirm acceptance and preferred date of joining
- Keep it concise (4-5 paragraphs)
- Don't include subject line, greeting, or sign-off — just the body paragraphs
- Plain text only, no HTML or markdown"""

    user = f"""Write an offer letter for:
Name: {first_name} {last_name}
Position: {designation}
Department: {department}
Offered CTC: {offered_ctc}
Recruiter Notes: {custom_notes}"""

    return invoke_llm(system, user, max_tokens=800)


def classify_candidate_reply(
    candidate_name: str,
    designation: str = "",
    offer_content: str = "",
    reply_text: str = "",
) -> dict:
    """Classify a candidate's reply to an offer letter using LLM."""
    system = """You are an AI assistant for Shellkode Pvt Ltd' recruitment team.
Analyze a candidate's reply to an offer letter and classify it.

You MUST respond with ONLY a valid JSON object (no markdown, no backticks):
{
    "decision": "accepted" | "rejected" | "negotiating" | "manual_review",
    "reasoning": "brief explanation of why you classified it this way",
    "suggested_response": "a draft response the recruiter could send back"
}

Classification rules:
- "accepted": Candidate clearly accepts the offer, mentions joining date, or is enthusiastic
- "rejected": Candidate clearly declines, has taken another offer, or is not interested
- "negotiating": Candidate wants to discuss salary, role, benefits, timeline, or has conditions
- "manual_review": Reply is ambiguous, off-topic, or needs human judgment"""

    user = f"""Candidate: {candidate_name}
Position: {designation}

Original offer summary: {offer_content[:500]}

Candidate's reply:
\"{reply_text}\"

Classify this reply:"""

    raw = invoke_llm(system, user, max_tokens=500)

    # Parse the JSON response
    import json
    try:
        # Clean up potential markdown formatting
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0]
        return json.loads(cleaned)
    except (json.JSONDecodeError, IndexError):
        logger.warning(f"Failed to parse LLM classification: {raw[:200]}")
        return {
            "decision": "manual_review",
            "reasoning": f"Could not parse LLM response. Raw: {raw[:200]}",
            "suggested_response": "",
        }


def _mock_response(prompt: str) -> str:
    """Fallback mock for when AI is disabled."""
    lower = prompt.lower()

    if "welcome email" in lower:
        return """Dear New Hire,

Welcome to Shellkode Pvt Ltd! We're thrilled to have you join our team.

Your skills and experience will be a valuable addition. We've been looking forward to your arrival and have everything prepared for a smooth start.

Please don't hesitate to reach out if you have any questions before your joining date.

Warm regards,
HR Team, Shellkode Pvt Ltd"""

    if "offer letter" in lower:
        return """We are delighted to inform you that after careful consideration, we have selected you for this position at Shellkode Pvt Ltd. Your skills, experience, and passion stood out during the interview process.

At Shellkode, we believe in fostering an environment of innovation and continuous growth. You will be joining a dynamic team that values collaboration, technical excellence, and creative problem-solving. We are confident that your expertise will make a meaningful impact.

We offer a comprehensive benefits package including health insurance for you and your family, a dedicated learning and development budget, flexible working hours, and regular team events and offsites. We are committed to supporting your professional growth and well-being.

Please review the details and confirm your acceptance at your earliest convenience. We would also appreciate it if you could share your preferred date of joining so we can prepare everything for a smooth onboarding experience.

We look forward to welcoming you to the Shellkode family!"""

    if "classify" in lower:
        import json
        return json.dumps({
            "decision": "accepted",
            "reasoning": "The candidate has clearly expressed acceptance of the offer.",
            "suggested_response": "Thank you for accepting! We're excited to have you on board. Please share your preferred date of joining and we'll get everything ready for you."
        })

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

