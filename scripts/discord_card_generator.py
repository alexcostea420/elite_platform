#!/usr/bin/env python3
"""
Discord Message Card Generator
Creates screenshot-like images of Discord messages for social proof.

Usage:
  python3 discord_card_generator.py              # Generate all predefined cards
  python3 discord_card_generator.py --single 0    # Generate card at index 0
  python3 discord_card_generator.py --custom "AlexArk" "Message text" "12 Oct 2025"
"""

from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import sys
import hashlib
import math

# ── Config ──────────────────────────────────────────────────────────────
OUTPUT_DIR = Path(__file__).parent.parent / "public" / "track-record"
CARD_WIDTH = 800
PADDING = 32
AVATAR_SIZE = 44
NAME_GAP = 12
MSG_LEFT = PADDING + AVATAR_SIZE + NAME_GAP
FONT_DIR = Path.home() / "Library" / "Fonts"
SYSTEM_FONT = "/System/Library/Fonts/Helvetica.ttc"

# Discord dark theme colors
BG_COLOR = "#2B2D31"
BG_BORDER = "#1E1F22"
NAME_COLORS = [
    "#5865F2",  # blurple
    "#57F287",  # green
    "#FEE75C",  # yellow
    "#EB459E",  # fuchsia
    "#ED4245",  # red
    "#F47B67",  # salmon
    "#3BA55D",  # dark green
    "#FAA61A",  # orange
]
TEXT_COLOR = "#DBDEE1"
TIMESTAMP_COLOR = "#949BA4"
CHANNEL_COLOR = "#80848E"
CHANNEL_HASH = "#5865F2"

# ── Fonts ───────────────────────────────────────────────────────────────
def get_font(size, bold=False):
    """Try system fonts for Discord-like text."""
    candidates = [
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/System/Library/Fonts/Helvetica.ttc",
        SYSTEM_FONT,
    ]
    for fp in candidates:
        try:
            # Index 1 is usually bold for .ttc collections
            idx = 1 if bold else 0
            return ImageFont.truetype(fp, size, index=idx)
        except Exception:
            try:
                return ImageFont.truetype(fp, size)
            except Exception:
                continue
    return ImageFont.load_default()

FONT_NAME = get_font(16, bold=True)
FONT_TIMESTAMP = get_font(12)
FONT_TEXT = get_font(15)
FONT_CHANNEL = get_font(13, bold=True)
FONT_HEADER = get_font(11)

# ── Avatar Generation ───────────────────────────────────────────────────
def generate_avatar(draw_target, username, x, y, size):
    """Draw a colored circle with initials like Discord default avatars."""
    # Deterministic color from username
    color_idx = int(hashlib.md5(username.encode()).hexdigest(), 16) % len(NAME_COLORS)
    color = NAME_COLORS[color_idx]

    # Draw circle
    draw_target.ellipse([x, y, x + size, y + size], fill=color)

    # Draw initials
    initials = username[0].upper()
    font = get_font(size // 2, bold=True)
    bbox = draw_target.textbbox((0, 0), initials, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw_target.text(
        (x + (size - tw) // 2, y + (size - th) // 2 - 2),
        initials, fill="white", font=font
    )

def name_color_for(username):
    color_idx = int(hashlib.md5(username.encode()).hexdigest(), 16) % len(NAME_COLORS)
    return NAME_COLORS[color_idx]

# ── Word Wrap ───────────────────────────────────────────────────────────
def wrap_text(text, font, max_width, draw):
    """Wrap text to fit within max_width."""
    words = text.split()
    lines = []
    current = ""
    for word in words:
        test = f"{current} {word}".strip()
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] - bbox[0] > max_width:
            if current:
                lines.append(current)
            current = word
        else:
            current = test
    if current:
        lines.append(current)
    return lines

# ── Card Generator ──────────────────────────────────────────────────────
def generate_card(username, message, timestamp, channel=None, output_name=None):
    """Generate a Discord-style message card image."""
    # Create temp image to measure text
    temp_img = Image.new("RGB", (CARD_WIDTH, 1000), BG_COLOR)
    temp_draw = ImageDraw.Draw(temp_img)

    max_text_width = CARD_WIDTH - MSG_LEFT - PADDING
    lines = wrap_text(message, FONT_TEXT, max_text_width, temp_draw)

    # Calculate height
    line_height = 22
    header_height = 28 if channel else 0
    content_top = PADDING + header_height
    name_height = 22
    text_height = len(lines) * line_height
    total_height = content_top + max(AVATAR_SIZE, name_height + text_height + 4) + PADDING

    # Create final image
    img = Image.new("RGB", (CARD_WIDTH, total_height), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # Border (subtle, like Discord message hover)
    draw.rectangle([0, 0, CARD_WIDTH - 1, total_height - 1], outline=BG_BORDER, width=2)

    # Left accent line (subtle green like Discord)
    draw.rectangle([0, 0, 3, total_height], fill="#5865F2")

    # Channel header
    y_cursor = PADDING
    if channel:
        draw.text((PADDING, y_cursor - 4), "#", fill=CHANNEL_HASH, font=FONT_CHANNEL)
        hash_w = draw.textbbox((0, 0), "# ", font=FONT_CHANNEL)[2]
        draw.text((PADDING + hash_w, y_cursor - 4), channel, fill=CHANNEL_COLOR, font=FONT_CHANNEL)
        # Separator line
        draw.line([(PADDING, y_cursor + 18), (CARD_WIDTH - PADDING, y_cursor + 18)], fill=BG_BORDER, width=1)
        y_cursor += header_height

    # Avatar
    generate_avatar(draw, username, PADDING, y_cursor, AVATAR_SIZE)

    # Username + timestamp on same line
    name_color = name_color_for(username)
    draw.text((MSG_LEFT, y_cursor), username, fill=name_color, font=FONT_NAME)
    name_bbox = draw.textbbox((0, 0), username, font=FONT_NAME)
    name_w = name_bbox[2] - name_bbox[0]
    draw.text((MSG_LEFT + name_w + 10, y_cursor + 4), timestamp, fill=TIMESTAMP_COLOR, font=FONT_TIMESTAMP)

    # Message text
    text_y = y_cursor + name_height + 2
    for line in lines:
        draw.text((MSG_LEFT, text_y), line, fill=TEXT_COLOR, font=FONT_TEXT)
        text_y += line_height

    # Save
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    if output_name is None:
        safe = username.lower().replace(" ", "_")[:20]
        output_name = f"card_{safe}_{timestamp.replace(' ', '_').replace('/', '-')}"

    output_path = OUTPUT_DIR / f"{output_name}.png"
    img.save(output_path, "PNG", quality=95)
    print(f"✓ Saved: {output_path}")
    return output_path

# ── Multi-message Card ──────────────────────────────────────────────────
def generate_multi_card(messages, channel=None, output_name="multi"):
    """
    Generate a card with multiple messages.
    messages: list of (username, text, timestamp) tuples
    """
    temp_img = Image.new("RGB", (CARD_WIDTH, 2000), BG_COLOR)
    temp_draw = ImageDraw.Draw(temp_img)
    max_text_width = CARD_WIDTH - MSG_LEFT - PADDING

    # Pre-calculate all heights
    msg_blocks = []
    for username, text, timestamp in messages:
        lines = wrap_text(text, FONT_TEXT, max_text_width, temp_draw)
        line_height = 22
        name_height = 22
        block_h = max(AVATAR_SIZE, name_height + len(lines) * line_height + 4)
        msg_blocks.append((username, text, timestamp, lines, block_h))

    header_height = 28 if channel else 0
    total_content = sum(b[4] for b in msg_blocks) + 8 * (len(msg_blocks) - 1)
    total_height = PADDING + header_height + total_content + PADDING

    img = Image.new("RGB", (CARD_WIDTH, total_height), BG_COLOR)
    draw = ImageDraw.Draw(img)

    draw.rectangle([0, 0, CARD_WIDTH - 1, total_height - 1], outline=BG_BORDER, width=2)
    draw.rectangle([0, 0, 3, total_height], fill="#5865F2")

    y_cursor = PADDING
    if channel:
        draw.text((PADDING, y_cursor - 4), "#", fill=CHANNEL_HASH, font=FONT_CHANNEL)
        hash_w = draw.textbbox((0, 0), "# ", font=FONT_CHANNEL)[2]
        draw.text((PADDING + hash_w, y_cursor - 4), channel, fill=CHANNEL_COLOR, font=FONT_CHANNEL)
        draw.line([(PADDING, y_cursor + 18), (CARD_WIDTH - PADDING, y_cursor + 18)], fill=BG_BORDER, width=1)
        y_cursor += header_height

    line_height = 22
    name_height = 22

    for username, text, timestamp, lines, block_h in msg_blocks:
        generate_avatar(draw, username, PADDING, y_cursor, AVATAR_SIZE)
        name_color = name_color_for(username)
        draw.text((MSG_LEFT, y_cursor), username, fill=name_color, font=FONT_NAME)
        name_bbox = draw.textbbox((0, 0), username, font=FONT_NAME)
        name_w = name_bbox[2] - name_bbox[0]
        draw.text((MSG_LEFT + name_w + 10, y_cursor + 4), timestamp, fill=TIMESTAMP_COLOR, font=FONT_TIMESTAMP)

        text_y = y_cursor + name_height + 2
        for line in lines:
            draw.text((MSG_LEFT, text_y), line, fill=TEXT_COLOR, font=FONT_TEXT)
            text_y += line_height

        y_cursor += block_h + 8

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / f"{output_name}.png"
    img.save(output_path, "PNG", quality=95)
    print(f"✓ Saved: {output_path}")
    return output_path

# ── Track Record Cards ──────────────────────────────────────────────────
TRACK_RECORD_CARDS = [
    # Card 0: August — cautious start
    {
        "type": "multi",
        "channel": "portofel-elite",
        "output": "01_aug_cautious",
        "messages": [
            ("AlexArk", "Am ajuns la 55% USDT. Piata e nesigura, prefer sa stau defensiv.", "13 Aug 2025"),
            ("AlexArk", "Indicator-ul meu e gata. L-am testat 3 luni pe backtesting, arata bine.", "20 Aug 2025"),
        ]
    },
    # Card 1: August — reducing exposure
    {
        "type": "single",
        "channel": "portofel-elite",
        "output": "02_aug_reducing",
        "username": "AlexArk",
        "message": "Am redus expunerea. Sunt 92% USDT acum. Ceva nu se simte bine pe piata.",
        "timestamp": "28 Aug 2025",
    },
    # Card 2: September — selective entries
    {
        "type": "multi",
        "channel": "portofel-elite",
        "output": "03_sep_selective",
        "messages": [
            ("AlexArk", "CRV, ALGO, DOGE - mici pozitii. Sistemul de pivoti confirma zone bune de intrare.", "8 Sep 2025"),
            ("AlexArk", "50-50 in piata acum. Nu merg all-in, dar nici nu stau pe margine.", "15 Sep 2025"),
        ]
    },
    # Card 3: October crash — THE CALL
    {
        "type": "single",
        "channel": "anunturi-elite",
        "output": "04_oct_crash",
        "username": "AlexArk",
        "message": "AM VANDUT TOT. -60% in 5 minute pe altcoins. E bearmarket. Cash is king.",
        "timestamp": "10 Oct 2025",
    },
    # Card 4: October — dead cat bounce call
    {
        "type": "single",
        "channel": "portofel-elite",
        "output": "05_oct_dead_cat",
        "username": "AlexArk",
        "message": "Mi se pare totul fake, fix dead cat bounce. Nu intru. Astept confirmarea.",
        "timestamp": "12 Oct 2025",
    },
    # Card 5: October — 100% cash
    {
        "type": "single",
        "channel": "portofel-elite",
        "output": "06_oct_full_cash",
        "username": "AlexArk",
        "message": "Sunt 100% USDC. Am iesit complet. Piata o sa cada mai mult.",
        "timestamp": "30 Oct 2025",
    },
    # Card 6: November — reaccumulation
    {
        "type": "multi",
        "channel": "portofel-elite",
        "output": "07_nov_reaccumulate",
        "messages": [
            ("AlexArk", "Incep sa reacumulez incet. 5% alocat. Zone bune pe BTC si ETH.", "15 Nov 2025"),
            ("AlexArk", "Piata arata semne de stabilizare. Cresc expunerea treptat.", "28 Nov 2025"),
        ]
    },
]

# ── Main ────────────────────────────────────────────────────────────────
def generate_all():
    """Generate all track record cards."""
    print(f"Generating {len(TRACK_RECORD_CARDS)} track record cards...")
    for card in TRACK_RECORD_CARDS:
        if card["type"] == "single":
            generate_card(
                card["username"], card["message"], card["timestamp"],
                channel=card.get("channel"),
                output_name=card["output"]
            )
        elif card["type"] == "multi":
            generate_multi_card(
                card["messages"],
                channel=card.get("channel"),
                output_name=card["output"]
            )
    print(f"\nAll cards saved to {OUTPUT_DIR}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "--single" and len(sys.argv) > 2:
            idx = int(sys.argv[2])
            card = TRACK_RECORD_CARDS[idx]
            if card["type"] == "single":
                generate_card(card["username"], card["message"], card["timestamp"],
                            channel=card.get("channel"), output_name=card["output"])
            else:
                generate_multi_card(card["messages"], channel=card.get("channel"),
                                  output_name=card["output"])
        elif sys.argv[1] == "--custom" and len(sys.argv) >= 5:
            generate_card(sys.argv[2], sys.argv[3], sys.argv[4],
                        channel=sys.argv[5] if len(sys.argv) > 5 else None)
        else:
            print(__doc__)
    else:
        generate_all()
