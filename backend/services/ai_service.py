"""
HR Scheduler Platform — AI Service (AWS Bedrock)
All AI-powered features using Claude 4.5 Sonnet via AWS Bedrock.
"""

import json
import os
import logging
from typing import Optional
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

# Configuration
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
BEDROCK_MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "us.anthropic.claude-sonnet-4-20250514-v1:0")
AI_MOCK_MODE = os.getenv("AI_MOCK_MODE", "false").lower() == "true"


def _get_bedrock_client():
    """Get the Bedrock Runtime client."""
    return boto3.client("bedrock-runtime", region_name=AWS_REGION)


def _invoke_claude(system_prompt: str, user_prompt: str, max_tokens: int = 2048) -> str:
    """
    Invoke Claude 4.5 Sonnet via Bedrock's Converse API.
    Returns the text response.
    """
    if AI_MOCK_MODE:
        return _mock_response(system_prompt, user_prompt)

    try:
        client = _get_bedrock_client()
        response = client.converse(
            modelId=BEDROCK_MODEL_ID,
            messages=[
                {
                    "role": "user",
                    "content": [{"text": user_prompt}]
                }
            ],
            system=[{"text": system_prompt}],
            inferenceConfig={
                "maxTokens": max_tokens,
                "temperature": 0.7,
                "topP": 0.95,
            }
        )
        return response["output"]["message"]["content"][0]["text"]

    except ClientError as e:
        logger.error(f"Bedrock API error: {e}")
        raise Exception(f"AI service error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected AI error: {e}")
        raise


# ─── AI Features ─────────────────────────────────────────────────────────────

def classify_email_reply(email_body: str, context: str = "") -> dict:
    """
    Classify a candidate's reply to an offer letter.
    Returns: {status, confidence, extracted_points, suggested_action, summary}
    """
    system = """You are an HR email classifier for Shellkode, an IT services company.
Analyze the candidate's reply to an offer letter and classify it.

Return a JSON object with exactly these fields:
- status: one of "accepted", "declined", "negotiating", "unclear"
- confidence: float between 0 and 1
- extracted_points: list of key points from the email (e.g., salary expectations, notice period concerns)
- suggested_action: what HR should do next
- summary: one-line summary of the email's intent

Return ONLY the JSON object, no other text."""

    prompt = f"""Context: {context}

Candidate's email reply:
---
{email_body}
---

Classify this reply and return the JSON object."""

    result = _invoke_claude(system, prompt, max_tokens=500)

    try:
        # Parse JSON from response, handling markdown code blocks
        cleaned = result.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0]
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return {
            "status": "unclear",
            "confidence": 0.5,
            "extracted_points": [],
            "suggested_action": "Manual review required - AI could not parse the email",
            "summary": result[:200]
        }


def classify_all_emails(subject: str, body: str, sender_email: str) -> dict:
    """
    Unified AI email classifier — classifies ALL incoming emails.
    Returns: {category, action, employee_name, step_key, confidence, summary}
    """
    system = """You are an HR email classifier for Shellkode Technologies' onboarding system.
Analyze the incoming email and classify it. The system sends automated emails for various workflow steps,
and people reply to confirm/approve actions.

The system sends these types of emails:
1. Offer letters to candidates → candidates reply to accept/decline/negotiate
2. Laptop request emails to admin → admin replies to approve/confirm
3. ID card generation requests to admin → admin replies when card is ready
4. Access card requests to facility admin → admin replies to confirm
5. Company email creation requests to IT → IT replies to confirm
6. Buddy assignment notifications → buddy acknowledges
7. Follow-up reminders → recipient acknowledges

Classify the email into one of these categories and determine the action:

Return a JSON object with exactly these fields:
- category: one of "candidate_offer_reply", "laptop_approval", "id_card_confirmation", "access_card_confirmation", "company_email_confirmation", "buddy_acknowledgment", "general_inquiry", "irrelevant"
- action: one of "complete_step", "accept_offer", "decline_offer", "negotiate_offer", "no_action", "needs_review"
- employee_name: the name of the employee this relates to (extract from subject or body if possible, else null)
- step_key: the workflow step key to complete (one of "laptop_approval", "id_card_generation", "access_card", "create_email", "offer_acceptance", or null)
- confidence: float between 0 and 1
- summary: one-line summary of the email's intent
- sentiment: "positive", "negative", or "neutral"

IMPORTANT: Look at the subject line carefully — it usually contains the employee's name and the type of request.
If the subject contains "Re:" it's a reply to a previous email.
Look for approval/confirmation keywords like "approved", "done", "ready", "confirmed", "completed", "yes", "okay", "processed".
Also look for the original email type in the subject (laptop, ID card, access card, company email).

Return ONLY the JSON object, no other text."""

    prompt = f"""Incoming email:
From: {sender_email}
Subject: {subject}
Body:
---
{body[:1000]}
---

Classify this email and return the JSON object."""

    result = _invoke_claude(system, prompt, max_tokens=500)

    try:
        cleaned = result.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0]
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return {
            "category": "irrelevant",
            "action": "needs_review",
            "employee_name": None,
            "step_key": None,
            "confidence": 0.3,
            "summary": f"Could not classify: {subject[:100]}",
            "sentiment": "neutral"
        }

def generate_welcome_writeup(
    first_name: str,
    last_name: str,
    designation: str,
    domain: str,
    experience_type: str,
    bio: Optional[str] = None,
    previous_company: Optional[str] = None,
    tone: str = "professional"
) -> str:
    """Generate a warm, personalized welcome write-up for a new employee."""
    system = f"""You are a content writer for Shellkode, a leading IT services and solutions company.
Write a warm, {tone} welcome write-up for a new team member joining the company.

Guidelines:
- Keep it to 120-150 words
- Make it personal and genuine
- Highlight what they bring to the team
- Express excitement about their joining
- If they're a fresher, emphasize growth opportunities and fresh perspectives
- If experienced, highlight their expertise and what they'll contribute
- End with a welcoming statement
- Do NOT use generic corporate jargon
- Write ONLY the writeup text, no headers or labels"""

    prompt = f"""New team member details:
- Name: {first_name} {last_name}
- Designation: {designation}
- Domain: {domain}
- Experience: {experience_type}
{f'- Bio: {bio}' if bio else ''}
{f'- Previous Company: {previous_company}' if previous_company else ''}

Write the welcome write-up."""

    return _invoke_claude(system, prompt, max_tokens=400)


def generate_linkedin_post(
    first_name: str,
    last_name: str,
    designation: str,
    domain: str,
    experience_type: str,
    bio: Optional[str] = None,
    previous_company: Optional[str] = None,
    tone: str = "celebratory"
) -> str:
    """Generate a LinkedIn post announcing a new hire."""
    if experience_type == "fresher":
        system = """You are a social media content creator for Shellkode's LinkedIn page.
Write a celebratory LinkedIn post welcoming a new fresher to the team.

Guidelines:
- Start with an engaging hook (emoji + exciting statement)
- Celebrate their fresh start and potential
- Mention Shellkode's commitment to nurturing talent
- Keep it to 150-200 words
- Include 3-5 relevant hashtags at the end
- Make it feel genuine, not corporate
- Use the tone of a proud company welcoming new talent
- Include a call-to-action (e.g., "Join us in welcoming...")
- Write ONLY the post text, no labels"""
    else:
        system = """You are a social media content creator for Shellkode's LinkedIn page.
Write a professional LinkedIn post welcoming an experienced hire to the team.

Guidelines:
- Start with an engaging hook
- Highlight their expertise and what they bring
- Express why this hire strengthens the team
- Keep it to 150-200 words
- Include 3-5 relevant hashtags at the end
- Make it feel authentic and prestigious
- Mention their domain expertise
- Write ONLY the post text, no labels"""

    prompt = f"""New hire details:
- Name: {first_name} {last_name}
- Designation: {designation}
- Domain: {domain}
- Type: {experience_type}
{f'- Bio: {bio}' if bio else ''}
{f'- Previous Company: {previous_company}' if previous_company else ''}

Generate the LinkedIn post."""

    return _invoke_claude(system, prompt, max_tokens=500)


def generate_welcome_email(
    first_name: str,
    designation: str,
    doj: Optional[str] = None,
    form_url: str = ""
) -> str:
    """Generate a warm welcome email to send to a new hire after offer acceptance."""
    system = """You are writing a welcome email on behalf of the HR team at Shellkode.
The email should be warm, professional, and make the candidate feel valued.

Guidelines:
- Start with a congratulatory greeting
- Express genuine excitement
- Mention the form they need to fill with basic info
- Mention that the team will reach out before their DOJ with joining details
- Keep it concise (150-200 words)
- Sign off as "The HR Team, Shellkode"
- Write the email body only (no Subject line, no "To:" header)
- Use a friendly but professional tone"""

    prompt = f"""Write a welcome email for:
- Name: {first_name}
- Designation: {designation}
{f'- Date of Joining: {doj}' if doj else ''}
- Form URL to collect details: {form_url}

Generate the welcome email body."""

    return _invoke_claude(system, prompt, max_tokens=500)


def generate_followup_email(
    context: str,
    recipient_role: str,
    urgency: str = "normal",
    attempt_number: int = 1
) -> str:
    """Generate a contextual follow-up email for pending actions."""
    urgency_map = {
        "normal": "polite and professional",
        "high": "friendly but firm, emphasizing importance",
        "critical": "urgent, clearly stating the impact of delay"
    }

    system = f"""You are writing a follow-up email on behalf of HR at Shellkode.
The tone should be {urgency_map.get(urgency, 'polite and professional')}.
This is follow-up attempt #{attempt_number}.

Guidelines:
- Reference the original request briefly
- Be respectful but clear about what's needed
- If this is a 2nd+ follow-up, acknowledge the previous reminder
- Include a clear call-to-action
- Keep it under 100 words
- Write ONLY the email body"""

    prompt = f"""Context: {context}
Recipient role: {recipient_role}
Follow-up attempt: #{attempt_number}

Generate the follow-up email."""

    return _invoke_claude(system, prompt, max_tokens=300)


def generate_joining_details_email(
    first_name: str,
    doj: str,
    office_address: str = "Shellkode Technologies, Bangalore",
    reporting_manager: str = "",
    hr_contact: str = ""
) -> str:
    """Generate the pre-joining email sent 2 days before DOJ."""
    system = """You are writing a pre-joining details email from HR at Shellkode.
This is sent 2 days before the employee's joining date.

Guidelines:
- Be warm and helpful
- Include all logistical details clearly
- Make them feel prepared and excited
- Structure the information with clear sections
- Keep it organized and scannable
- Write ONLY the email body"""

    prompt = f"""Write a pre-joining details email for:
- Name: {first_name}
- Date of Joining: {doj}
- Office Address: {office_address}
{f'- Reporting Manager: {reporting_manager}' if reporting_manager else ''}
{f'- HR Contact: {hr_contact}' if hr_contact else ''}

Include:
1. When and where to report
2. What to bring (ID proof, documents)
3. Dress code
4. Day 1 agenda overview
5. Parking/transport tips (if applicable)
6. Emergency contact

Generate the email."""

    return _invoke_claude(system, prompt, max_tokens=600)


def generate_dashboard_insight(pipeline_data: dict) -> str:
    """Generate a natural-language insight summary for the HR dashboard."""
    system = """You are an intelligent HR assistant for Shellkode.
Analyze the onboarding pipeline data and provide a brief, actionable insight.

Guidelines:
- Keep it to 1-2 sentences
- Highlight the most important thing HR should know right now
- If there are overdue items, lead with that
- If everything is on track, mention positive progress
- Be specific (mention names, numbers, timeframes)
- Write ONLY the insight text"""

    prompt = f"""Current pipeline data:
{json.dumps(pipeline_data, indent=2, default=str)}

Generate a dashboard insight."""

    return _invoke_claude(system, prompt, max_tokens=200)


def generate_chatbot_response(
    question: str,
    company_context: str = "",
    conversation_history: list = None
) -> str:
    """AI chatbot for new hires to ask questions about the company."""
    system = f"""You are a friendly AI onboarding assistant for Shellkode, an IT services company.
Help new employees with their questions about the company, policies, and onboarding process.

Company context:
{company_context}

Guidelines:
- Be warm, helpful, and encouraging
- If you don't know something specific, say so honestly and suggest who to ask
- Keep answers concise but thorough
- Use a conversational, friendly tone
- For policy questions, be accurate and clear
- If asked about personal matters (salary, leave balance), direct them to HR"""

    history_text = ""
    if conversation_history:
        for msg in conversation_history[-5:]:  # Last 5 messages for context
            history_text += f"\n{msg['role']}: {msg['content']}"

    prompt = f"""{f'Previous conversation:{history_text}' if history_text else ''}

New hire asks: {question}

Respond helpfully."""

    return _invoke_claude(system, prompt, max_tokens=500)


# ─── Mock Responses (for development without Bedrock) ────────────────────────

def _mock_response(system_prompt: str, user_prompt: str) -> str:
    """Return mock responses for development without AWS credentials."""
    prompt_lower = user_prompt.lower()

    if "classify" in system_prompt.lower() or "classify" in prompt_lower:
        return json.dumps({
            "status": "accepted",
            "confidence": 0.95,
            "extracted_points": ["Candidate has accepted the offer", "Ready to join on the proposed date"],
            "suggested_action": "Proceed with pre-boarding workflow",
            "summary": "The candidate has enthusiastically accepted the offer and confirmed the joining date."
        })

    if "welcome write-up" in system_prompt.lower() or "writeup" in prompt_lower:
        return ("We are thrilled to welcome our newest team member to the Shellkode family! "
                "Bringing a unique blend of technical expertise and fresh perspective, they are set to "
                "make a significant impact in our growing team. Their passion for technology and "
                "problem-solving perfectly aligns with our mission to deliver innovative solutions. "
                "We're excited about the energy and ideas they'll bring to our collaborative environment. "
                "Welcome aboard — the journey starts here, and we can't wait to see the amazing things "
                "we'll build together!")

    if "linkedin" in system_prompt.lower() or "linkedin" in prompt_lower:
        return ("🎉 Exciting News! We're thrilled to welcome a brilliant new mind to the Shellkode family! 🚀\n\n"
                "As we continue to grow and innovate, we're proud to have exceptional talent joining our team. "
                "Their expertise and passion will be instrumental in driving our mission forward.\n\n"
                "At Shellkode, we believe in nurturing talent and building a culture of continuous learning. "
                "Every new team member strengthens our ability to deliver world-class solutions.\n\n"
                "Join us in welcoming them to the team! 🙌\n\n"
                "#Shellkode #NewHire #TeamGrowth #TechTalent #WelcomeAboard")

    if "welcome email" in system_prompt.lower():
        return ("Dear [Name],\n\n"
                "Congratulations and welcome to the Shellkode family! 🎉\n\n"
                "We are absolutely delighted that you've chosen to embark on this journey with us. "
                "Your skills and experience will be a fantastic addition to our team.\n\n"
                "To help us prepare for your arrival, please fill out the following form with your details: "
                "[FORM_URL]\n\n"
                "Our team will reach out to you before your joining date with all the details you'll need "
                "for a smooth first day.\n\n"
                "Welcome aboard!\n\n"
                "Warm regards,\nThe HR Team, Shellkode")

    if "follow-up" in system_prompt.lower() or "followup" in prompt_lower:
        return ("Hi,\n\n"
                "I wanted to follow up on the pending request. "
                "Could you please provide an update at your earliest convenience? "
                "This will help us ensure a smooth onboarding experience for our new hire.\n\n"
                "Thank you!\n\nBest regards,\nHR Team")

    if "joining details" in system_prompt.lower() or "pre-joining" in system_prompt.lower():
        return ("Dear [Name],\n\n"
                "Your first day is just around the corner, and we're excited! Here's everything you need to know:\n\n"
                "📍 Where: Shellkode Technologies, Bangalore\n"
                "🕐 When: 9:30 AM\n"
                "👔 Dress Code: Smart casual\n\n"
                "Please bring:\n- Government ID proof\n- Educational certificates\n- 2 passport-sized photos\n\n"
                "Your Day 1 Agenda:\n"
                "- 9:30: Welcome & badge collection\n"
                "- 10:00: HR induction\n"
                "- 11:30: Meet your manager\n"
                "- 12:30: Lunch with your buddy\n"
                "- 2:00: IT setup\n\n"
                "See you soon!\nHR Team, Shellkode")

    if "dashboard" in system_prompt.lower() or "insight" in prompt_lower:
        return "3 new hires are on track this week. 1 employee's laptop delivery is pending for 4+ days — consider following up with the admin team."

    if "chatbot" in system_prompt.lower() or "assistant" in system_prompt.lower():
        return ("Great question! I'd recommend reaching out to the HR team directly for the most "
                "up-to-date information on that. You can email hr@shellkode.com or ask your buddy "
                "who'll be assigned to you on your first day. Is there anything else I can help with?")

    return "AI-generated content will appear here when connected to AWS Bedrock."
