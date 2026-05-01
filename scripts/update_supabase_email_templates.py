#!/usr/bin/env python3
"""
Push the 3 Supabase auth email templates (Confirm Signup, Reset Password,
Magic Link) from supabase/email-templates.md into Supabase via the
Management API.

Idempotent: re-running just overwrites with the latest .md content.
"""

from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MD = ROOT / "supabase" / "email-templates.md"

PAT = os.environ.get("SUPABASE_ACCESS_TOKEN")
PROJECT = os.environ.get("SUPABASE_PROJECT_REF")
if not PAT or not PROJECT:
    env_path = ROOT / ".env.local"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                k, _, v = line.partition("=")
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                if k == "SUPABASE_ACCESS_TOKEN":
                    PAT = PAT or v
                elif k == "SUPABASE_PROJECT_REF":
                    PROJECT = PROJECT or v

if not PAT or not PROJECT:
    sys.exit("Missing SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_REF")

API = f"https://api.supabase.com/v1/projects/{PROJECT}/config/auth"
HEADERS = {
    "Authorization": f"Bearer {PAT}",
    "Content-Type": "application/json",
    "User-Agent": "elite-platform-email-sync/1.0 (curl-compat)",
}


def parse_md(text: str) -> dict[str, dict[str, str]]:
    """Extract subject + html for each of the 3 templates from the markdown."""
    sections = re.split(r"\n## \d+\. ", text)
    result: dict[str, dict[str, str]] = {}

    name_to_key = {
        "Confirm Signup": "confirmation",
        "Reset Password": "recovery",
        "Magic Link": "magic_link",
    }

    for section in sections[1:]:
        title = section.splitlines()[0].strip()
        key = name_to_key.get(title)
        if not key:
            continue

        subj_match = re.search(r"\*\*Subject:\*\*\s*`([^`]+)`", section)
        if not subj_match:
            continue
        subject = subj_match.group(1).strip()

        # First fenced ```html ... ``` block
        html_match = re.search(r"```html\n(.*?)\n```", section, re.DOTALL)
        if not html_match:
            continue
        html = html_match.group(1).strip()

        result[key] = {"subject": subject, "html": html}

    return result


def patch_auth_config(payload: dict) -> None:
    req = urllib.request.Request(
        API, data=json.dumps(payload).encode(), headers=HEADERS, method="PATCH"
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            r.read()
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        raise RuntimeError(f"HTTP {e.code}: {body}") from e


def main() -> int:
    if not MD.exists():
        sys.exit(f"Missing {MD}")
    parsed = parse_md(MD.read_text())

    expected = {"confirmation", "recovery", "magic_link"}
    missing = expected - parsed.keys()
    if missing:
        sys.exit(f"Could not parse: {missing}")

    payload = {
        "mailer_subjects_confirmation": parsed["confirmation"]["subject"],
        "mailer_templates_confirmation_content": parsed["confirmation"]["html"],
        "mailer_subjects_recovery": parsed["recovery"]["subject"],
        "mailer_templates_recovery_content": parsed["recovery"]["html"],
        "mailer_subjects_magic_link": parsed["magic_link"]["subject"],
        "mailer_templates_magic_link_content": parsed["magic_link"]["html"],
    }

    print("Pushing 3 templates to Supabase auth config...")
    for key in ("confirmation", "recovery", "magic_link"):
        print(f"  · {key}: subject={parsed[key]['subject']!r} html={len(parsed[key]['html'])}b")
    patch_auth_config(payload)
    print("✓ Updated. Test by triggering a signup / reset password / magic link.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
