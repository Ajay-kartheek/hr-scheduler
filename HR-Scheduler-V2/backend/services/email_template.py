"""
Branded email template wrapper for all outgoing emails.
Adds Shellkode header and consistent styling.
"""


def wrap_email_body(body_content: str) -> str:
    """Wrap email body content with branded Shellkode header and footer."""
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
        <!-- Header -->
        <div style="padding: 24px 32px; border-bottom: 2px solid #00ADEF;">
            <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td style="vertical-align: middle; padding-right: 12px;">
                        <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #00275E, #003580); border-radius: 8px; text-align: center; line-height: 36px; color: #fff; font-size: 16px; font-weight: 700; font-family: Arial, sans-serif;">S</div>
                    </td>
                    <td style="vertical-align: middle;">
                        <span style="font-size: 18px; font-weight: 700; color: #00275E; letter-spacing: 0.5px;">Shellkode</span>
                        <span style="font-size: 10px; color: #94a3b8; display: block; margin-top: -2px; letter-spacing: 0.3px;">Pvt Ltd</span>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Body -->
        <div style="padding: 28px 32px; font-size: 14px; color: #334155; line-height: 1.7;">
            {body_content}
        </div>

        <!-- Footer -->
        <div style="padding: 20px 32px; border-top: 1px solid #e8ecf4; font-size: 11px; color: #94a3b8; line-height: 1.6;">
            <p style="margin: 0;">This email was sent by Shellkode Pvt Ltd. Please do not reply to this email if it was received in error.</p>
        </div>
    </div>
    """
