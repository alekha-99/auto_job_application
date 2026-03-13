"""
claude_service.py — Anthropic Claude API integration for resume tailoring.
"""

import json
import os
import re
import logging

import anthropic
from dotenv import load_dotenv

from prompts import SYSTEM_PROMPT, USER_PROMPT

load_dotenv()
logger = logging.getLogger(__name__)

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-20250514")


def _extract_json(text: str) -> dict:
    """
    Extract valid JSON from Claude's response, handling markdown fences
    or extra text around the JSON payload.
    """
    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Strip markdown code fences if present
    fence_pattern = r"```(?:json)?\s*\n?(.*?)\n?```"
    match = re.search(fence_pattern, text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    # Try to find the first { ... } block
    brace_start = text.find("{")
    brace_end = text.rfind("}")
    if brace_start != -1 and brace_end != -1 and brace_end > brace_start:
        try:
            return json.loads(text[brace_start : brace_end + 1])
        except json.JSONDecodeError:
            pass

    raise ValueError("Could not extract valid JSON from Claude response.")


def generate_tailored_resume(base_resume_text: str, job_description_text: str) -> dict:
    """
    Send the base resume and job description to Claude for ATS-optimized
    resume tailoring. Returns the parsed JSON response dict.
    """
    if not ANTHROPIC_API_KEY:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not set. Add it to .env or environment variables."
        )

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    user_message = USER_PROMPT.format(
        base_resume_text=base_resume_text,
        job_description_text=job_description_text,
    )

    logger.info("Sending request to Claude model=%s", CLAUDE_MODEL)

    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=8192,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    raw_text = response.content[0].text
    logger.info(
        "Received response from Claude — %d characters, stop_reason=%s",
        len(raw_text),
        response.stop_reason,
    )

    result = _extract_json(raw_text)
    return result
