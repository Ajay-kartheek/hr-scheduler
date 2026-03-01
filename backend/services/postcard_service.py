"""
HR Scheduler — AI Welcome Postcard Generator
Creates a branded visual welcome card using Pillow.
Auto-attached to welcome emails.
"""

import os
import logging
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO

logger = logging.getLogger("hr_scheduler")

# Shellkode brand colors
BRAND_PRIMARY = (67, 56, 202)      # #4338ca
BRAND_SECONDARY = (99, 102, 241)   # #6366f1
BRAND_ACCENT = (16, 185, 129)      # #10b981
WHITE = (255, 255, 255)
DARK = (17, 24, 39)
GRAY = (107, 114, 128)
LIGHT_BG = (248, 250, 252)


def _get_font(size: int, bold: bool = False):
    """Get a font - tries system fonts, falls back to default."""
    font_paths = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for path in font_paths:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def generate_welcome_postcard(
    first_name: str,
    last_name: str = "",
    designation: str = "",
    domain: str = "",
    experience_type: str = "fresher",
    doj: str = "",
    role_id: str = "",
) -> bytes:
    """
    Generate a branded welcome postcard image.
    Returns PNG bytes.
    """
    width, height = 900, 500
    img = Image.new("RGB", (width, height), WHITE)
    draw = ImageDraw.Draw(img)

    # ── Background gradient band (top) ──
    for y in range(180):
        ratio = y / 180
        r = int(BRAND_PRIMARY[0] + (BRAND_SECONDARY[0] - BRAND_PRIMARY[0]) * ratio)
        g = int(BRAND_PRIMARY[1] + (BRAND_SECONDARY[1] - BRAND_PRIMARY[1]) * ratio)
        b = int(BRAND_PRIMARY[2] + (BRAND_SECONDARY[2] - BRAND_PRIMARY[2]) * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    # ── Accent bar at top ──
    draw.rectangle([(0, 0), (width, 6)], fill=BRAND_ACCENT)

    # ── Company name ──
    font_company = _get_font(14)
    draw.text((40, 25), "SHELLKODE TECHNOLOGIES", fill=(200, 200, 255), font=font_company)

    # ── Welcome text ──
    font_welcome = _get_font(16)
    draw.text((40, 55), "WELCOME TO THE TEAM", fill=(200, 200, 255), font=font_welcome)

    # ── Name (large) ──
    full_name = f"{first_name} {last_name}".strip()
    font_name = _get_font(42, bold=True)
    draw.text((40, 80), full_name, fill=WHITE, font=font_name)

    # ── Designation ──
    font_designation = _get_font(20)
    draw.text((40, 135), designation, fill=(220, 220, 255), font=font_designation)

    # ── Decorative circle (avatar placeholder) ──
    circle_x, circle_y = 770, 90
    circle_r = 55
    draw.ellipse(
        [circle_x - circle_r, circle_y - circle_r, circle_x + circle_r, circle_y + circle_r],
        fill=BRAND_ACCENT
    )
    # Initials
    initials = (first_name[0] if first_name else "") + (last_name[0] if last_name else "")
    font_initials = _get_font(32, bold=True)
    bbox = draw.textbbox((0, 0), initials, font=font_initials)
    iw, ih = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((circle_x - iw // 2, circle_y - ih // 2 - 4), initials, fill=WHITE, font=font_initials)

    # ── Info cards section (below gradient) ──
    y_start = 210
    card_gap = 20
    cards = []

    if domain:
        cards.append(("Domain", domain.replace("_", " ").title()))
    if experience_type:
        cards.append(("Experience", experience_type.replace("_", " ").title()))
    if role_id:
        cards.append(("Role ID", role_id))
    if doj:
        cards.append(("Joining Date", doj))

    card_width = (width - 80 - card_gap * (len(cards) - 1)) // max(len(cards), 1)
    for i, (label, value) in enumerate(cards):
        x = 40 + i * (card_width + card_gap)
        # Card background
        draw.rounded_rectangle(
            [(x, y_start), (x + card_width, y_start + 80)],
            radius=8, fill=LIGHT_BG, outline=(229, 231, 235)
        )
        font_label = _get_font(11)
        font_value = _get_font(15, bold=True)
        draw.text((x + 16, y_start + 15), label.upper(), fill=GRAY, font=font_label)
        draw.text((x + 16, y_start + 38), value, fill=DARK, font=font_value)

    # ── Motivational quote ──
    y_quote = 320
    quotes = {
        "fresher": "Every great journey begins with a single step. Welcome to yours!",
        "experienced": "Your expertise will help us build something extraordinary together.",
    }
    quote_text = quotes.get(experience_type, quotes["fresher"])
    font_quote = _get_font(15)
    draw.text((40, y_quote), f'"{quote_text}"', fill=GRAY, font=font_quote)

    # ── Bottom bar ──
    draw.rectangle([(0, height - 60), (width, height)], fill=LIGHT_BG)
    draw.rectangle([(0, height - 60), (width, height - 58)], fill=(229, 231, 235))

    # Emoji + text
    font_bottom = _get_font(13)
    draw.text((40, height - 42), "We can't wait to see the amazing things we'll build together!", fill=GRAY, font=font_bottom)

    # Company website
    font_url = _get_font(12)
    draw.text((width - 200, height - 42), "shellkode.com", fill=BRAND_PRIMARY, font=font_url)

    # ── Accent bar at bottom ──
    draw.rectangle([(0, height - 4), (width, height)], fill=BRAND_ACCENT)

    # Save
    buffer = BytesIO()
    img.save(buffer, format="PNG", quality=95)
    buffer.seek(0)
    return buffer.getvalue()


def save_postcard(employee_id: str, **kwargs) -> str:
    """Generate and save postcard, return file path."""
    os.makedirs("uploads/postcards", exist_ok=True)
    filepath = f"uploads/postcards/{employee_id}_welcome.png"

    png_bytes = generate_welcome_postcard(**kwargs)
    with open(filepath, "wb") as f:
        f.write(png_bytes)

    logger.info(f"🎨 Welcome postcard saved: {filepath}")
    return filepath
