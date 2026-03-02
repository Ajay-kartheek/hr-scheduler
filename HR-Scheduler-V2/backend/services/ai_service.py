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
    proposed_doj: str = "",
) -> str:
    """Generate a personalized offer letter using LLM."""
    doj_instruction = ""
    if proposed_doj:
        doj_instruction = f"\n- The proposed date of joining is {proposed_doj}. Include this in the letter and ask them to confirm if this date works or suggest an alternative."
    else:
        doj_instruction = "\n- Ask them to confirm their preferred date of joining"

    system = f"""You are a talent acquisition specialist at Shellkode Pvt Ltd.
Write a warm, professional offer letter for a selected candidate. The letter should:
- Congratulate them on being selected
- Mention the role and department
- If CTC is provided, mention the compensation package
- Highlight the company culture and growth opportunities
- Mention benefits (health insurance, learning budget, flexible hours, team events){doj_instruction}
- Keep it concise (4-5 paragraphs)
- Do NOT include any greeting (no Hi/Hello/Dear), subject line, or sign-off (no Warm regards/Best regards/signature) — just the body paragraphs
- Plain text only, no HTML or markdown"""

    user_parts = [
        f"Write an offer letter for:",
        f"Name: {first_name} {last_name}",
        f"Position: {designation}",
        f"Department: {department}",
        f"Offered CTC: {offered_ctc}",
    ]
    if proposed_doj:
        user_parts.append(f"Proposed Date of Joining: {proposed_doj}")
    user_parts.append(f"Recruiter Notes: {custom_notes}")

    return invoke_llm(system, "\n".join(user_parts), max_tokens=800)


def classify_candidate_reply(
    candidate_name: str,
    designation: str = "",
    offer_content: str = "",
    reply_text: str = "",
) -> dict:
    """Classify a candidate's reply to an offer letter using LLM.
    Returns decision, reasoning, suggested_response, confidence (0.0-1.0), and joining_date if mentioned."""
    system = """You are an AI assistant for Shellkode Pvt Ltd's recruitment team.
Analyze a candidate's reply to an offer letter and classify it.

You MUST respond with ONLY a valid JSON object (no markdown, no backticks):
{
    "decision": "accepted" | "rejected" | "negotiating" | "manual_review",
    "confidence": 0.0 to 1.0,
    "reasoning": "brief explanation of why you classified it this way",
    "suggested_response": "a draft response body the recruiter could send back. Do NOT include any greeting (no Hi/Hello/Dear Name), subject line, or sign-off (no Warm regards/Best regards/signature) — just the body paragraph(s).",
    "joining_date": "YYYY-MM-DD if the candidate mentions a specific joining date or start date, otherwise null"
}

Confidence guidelines:
- 0.9+: Very clear intent (e.g., "I accept the offer" or "I decline")
- 0.7-0.9: Likely intent with some ambiguity
- 0.5-0.7: Uncertain, could go either way
- Below 0.5: Very ambiguous, should be manual_review

Classification rules:
- "accepted": Candidate clearly accepts the offer, mentions joining date, or is enthusiastic
- "rejected": Candidate clearly declines, has taken another offer, or is not interested
- "negotiating": Candidate wants to discuss salary, role, benefits, timeline, or has conditions
- "manual_review": Reply is ambiguous, off-topic, or needs human judgment

IMPORTANT for joining_date — you MUST extract this carefully:
- ONLY extract dates from the CANDIDATE'S REPLY text, NOT from the offer letter content
- If the candidate mentions ANY date in THEIR reply (e.g., "March 3rd works", "I can join on 15th", "starting from 1st April"), extract it as YYYY-MM-DD
- "March 3rd" → "2026-03-03", "April 1st" → "2026-04-01", "15th March" → "2026-03-15"
- Use the current year (2026) if not specified. Use next year if the month has already passed.
- If the candidate just says "I accept" without mentioning any date, set joining_date to null — do NOT copy the date from the offer letter
- EXCEPTION: if the candidate explicitly references the proposed date (e.g., "that date works", "the proposed date is fine", "yes the joining date works"), then extract the proposed date from the offer letter
- Only set a date if the candidate EXPLICITLY mentions or confirms a date in their reply text

IMPORTANT for suggested_response when decision is "accepted":
- Check if the offer letter mentions a proposed joining/start date
- If the offer DOES mention a joining date but the candidate didn't confirm it, the suggested_response MUST ask them to confirm THAT SPECIFIC DATE (e.g., "Could you please confirm if the proposed joining date of March 15 works for you?"). Do NOT generically ask "let us know your preferred start date".
- If the offer does NOT mention a joining date, ask them for their preferred joining date."""

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
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0]
        result = json.loads(cleaned)
        # Ensure confidence exists
        if "confidence" not in result:
            result["confidence"] = 0.5
        return result
    except (json.JSONDecodeError, IndexError):
        logger.warning(f"Failed to parse LLM classification: {raw[:200]}")
        return {
            "decision": "manual_review",
            "confidence": 0.0,
            "reasoning": f"Could not parse LLM response. Raw: {raw[:200]}",
            "suggested_response": "",
        }


def generate_followup_email(
    candidate_name: str,
    designation: str = "",
    followup_number: int = 1,
    days_since_offer: int = 3,
) -> str:
    """Generate a personalized follow-up email for an unresponsive candidate."""
    system = """You are drafting a follow-up email on behalf of the HR team at Shellkode Pvt Ltd.
Write a warm, professional follow-up email. Keep it brief (3-5 sentences).
Do NOT include any greeting (no Hi/Hello/Dear), subject line, or sign-off (no Warm regards/Best regards/signature) — just the body paragraph(s).
Match the tone to the follow-up number:
- Follow-up 1: Friendly check-in, show enthusiasm about them joining
- Follow-up 2: Slightly more urgent, mention that the team is eager to finalize
- Follow-up 3: Final reminder, mention that the offer may need to be closed soon"""

    user = f"""Candidate: {candidate_name}
Position: {designation}
Follow-up number: {followup_number} of 3
Days since offer was sent: {days_since_offer}

Write the follow-up email body:"""

    return invoke_llm(system, user, max_tokens=400)


def generate_auto_reply(
    candidate_name: str,
    designation: str = "",
    decision: str = "",
    reply_text: str = "",
    conversation_history: list = None,
) -> str:
    """Generate a smart auto-reply based on the classified decision."""
    history_summary = ""
    if conversation_history:
        recent = [h for h in conversation_history[-6:] if h.get("content")]
        history_summary = "\n".join(
            f"  {'Candidate' if h.get('sender')=='candidate' else 'Shellkode'}: {h['content'][:200]}"
            for h in recent
        )

    prompts = {
        "accepted": f"""The candidate has ACCEPTED the offer. Write a warm congratulations email.
- Thank them for choosing Shellkode Pvt Ltd
- Mention next steps (HR will share onboarding details and joining kit soon)
- If they mentioned a joining date, acknowledge it and confirm the team is preparing for their arrival
- Do NOT ask for a start date or joining date — it has already been confirmed
- Keep it enthusiastic but professional, 3-4 sentences
- Do NOT include any greeting (no Hi/Hello/Dear), subject line, or sign-off (no Warm regards/Best regards/signature) — just the body""",

        "rejected": f"""The candidate has DECLINED the offer. Write a graceful closure email.
- Thank them for their time and consideration
- Wish them well in their future endeavors
- Leave the door open for future opportunities
- Keep it professional and warm, 3-4 sentences
- Do NOT include any greeting (no Hi/Hello/Dear), subject line, or sign-off (no Warm regards/Best regards/signature) — just the body""",

        "negotiating": f"""The candidate is NEGOTIATING. Draft a balanced counter-response.
- Acknowledge their concerns from their reply
- Be open to discussion while being professional
- Suggest scheduling a call to discuss further
- Keep it collaborative, 3-5 sentences
- Do NOT include any greeting (no Hi/Hello/Dear), subject line, or sign-off (no Warm regards/Best regards/signature) — just the body

Their reply was: "{reply_text[:300]}"
""",
    }

    system = f"""You are the HR team at Shellkode Pvt Ltd responding to a candidate.
Write only the email body — no subject line, no "Dear [Name]" greeting, no signatures."""

    user = f"""Candidate: {candidate_name}
Position: {designation}

{f'Recent conversation:{chr(10)}{history_summary}' if history_summary else ''}

{prompts.get(decision, prompts['negotiating'])}"""

    return invoke_llm(system, user, max_tokens=500)


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

