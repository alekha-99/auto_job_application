"""
pdf_service.py — fpdf2-based PDF generation from tailored resume data.

Uses fpdf2 (pure Python, no system dependencies) to generate clean,
ATS-safe, single-column PDF resumes.
"""

import logging
import re
from typing import Any

from fpdf import FPDF

logger = logging.getLogger(__name__)


def _sanitize_text(text: str) -> str:
    """
    Replace or strip characters that built-in PDF fonts (latin-1) cannot render.
    """
    replacements = {
        "\u2022": "-",    # bullet
        "\u2013": "-",    # en-dash
        "\u2014": "--",   # em-dash
        "\u2018": "'",    # left single quote
        "\u2019": "'",    # right single quote
        "\u201c": '"',    # left double quote
        "\u201d": '"',    # right double quote
        "\u2026": "...",  # ellipsis
        "\u00a0": " ",    # non-breaking space
    }
    for char, replacement in replacements.items():
        text = text.replace(char, replacement)
    # Strip any remaining non-latin-1 characters
    text = text.encode("latin-1", errors="replace").decode("latin-1")
    return text

# Friendly labels for the technical_skills dict keys
SKILL_LABELS = [
    ("programming_languages", "Programming Languages"),
    ("frameworks_libraries", "Frameworks & Libraries"),
    ("cloud_platforms", "Cloud Platforms"),
    ("containerization_orchestration", "Containerization & Orchestration"),
    ("infrastructure_as_code", "Infrastructure as Code"),
    ("security_secrets_management", "Security & Secrets Management"),
    ("databases", "Databases"),
    ("ci_cd_devops", "CI/CD & DevOps"),
    ("observability_monitoring", "Observability & Monitoring"),
    ("generative_ai_llms", "Generative AI & LLMs"),
    ("web_technologies_ui", "Web Technologies & UI"),
]


def _build_skill_rows(technical_skills: dict[str, str]) -> list[tuple[str, str]]:
    """
    Convert the technical_skills dict into an ordered list of
    (label, value) tuples, skipping empty entries.
    """
    rows: list[tuple[str, str]] = []
    for key, label in SKILL_LABELS:
        value = technical_skills.get(key, "")
        if value:
            rows.append((label, value))

    # Include any extra keys not in SKILL_LABELS
    known_keys = {k for k, _ in SKILL_LABELS}
    for key, value in technical_skills.items():
        if key not in known_keys and value:
            label = key.replace("_", " ").title()
            rows.append((label, value))

    return rows


class ResumePDF(FPDF):
    """Custom FPDF subclass for ATS-safe resume rendering."""

    def __init__(self):
        super().__init__(format="letter")
        self.set_auto_page_break(auto=True, margin=15)
        # Use built-in fonts (universally available, ATS-safe)
        self.add_page()
        self.set_margins(18, 15, 18)

    def section_title(self, title: str):
        """Render an uppercase section header with a bottom rule."""
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(30, 30, 30)
        self.cell(0, 7, title.upper(), new_x="LMARGIN", new_y="NEXT")
        # Underline
        y = self.get_y()
        self.set_draw_color(60, 60, 60)
        self.set_line_width(0.4)
        self.line(self.l_margin, y, self.w - self.r_margin, y)
        self.ln(3)

    def body_text(self, text: str, size: float = 10):
        """Render a paragraph of body text."""
        self.set_font("Helvetica", "", size)
        self.set_text_color(40, 40, 40)
        self.multi_cell(0, 5, _sanitize_text(text))
        self.ln(1)

    def bullet_point(self, text: str, size: float = 10):
        """Render a bullet point with indent."""
        self.set_font("Helvetica", "", size)
        self.set_text_color(40, 40, 40)
        indent = 6
        self.set_x(self.l_margin + indent)
        self.multi_cell(
            self.w - self.l_margin - self.r_margin - indent,
            5,
            f"-  {_sanitize_text(text)}",
        )
        self.ln(0.5)


def render_resume_pdf(resume_data: dict[str, Any]) -> bytes:
    """
    Accept the `tailored_resume` section from Claude's JSON response
    and return rendered PDF bytes using fpdf2.
    """
    pdf = ResumePDF()

    name = resume_data.get("name", "")
    contact = resume_data.get("contact", {})

    # ── Header ──
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(20, 20, 20)
    pdf.cell(0, 10, name, align="C", new_x="LMARGIN", new_y="NEXT")

    # Contact line
    contact_parts = []
    if contact.get("phone"):
        contact_parts.append(contact["phone"])
    if contact.get("email"):
        contact_parts.append(contact["email"])
    if contact.get("linkedin"):
        contact_parts.append(contact["linkedin"])
    if contact.get("github"):
        contact_parts.append(contact["github"])

    if contact_parts:
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(100, 100, 100)
        pdf.cell(
            0, 5, "  |  ".join(contact_parts), align="C",
            new_x="LMARGIN", new_y="NEXT",
        )
    pdf.ln(4)

    # ── Professional Summary ──
    summary = resume_data.get("professional_summary", "")
    if summary:
        pdf.section_title("Professional Summary")
        pdf.body_text(summary)
        pdf.ln(2)

    # ── Work Experience ──
    work_experience = resume_data.get("work_experience", [])
    if work_experience:
        pdf.section_title("Work Experience")
        for job in work_experience:
            # Job title + company
            pdf.set_font("Helvetica", "B", 10.5)
            pdf.set_text_color(30, 30, 30)
            title_line = job.get("title", "")
            if job.get("company"):
                title_line += f"  @  {job['company']}"
            if job.get("location"):
                title_line += f"  |  {job['location']}"
            pdf.cell(0, 6, _sanitize_text(title_line), new_x="LMARGIN", new_y="NEXT")

            # Duration
            if job.get("duration"):
                pdf.set_font("Helvetica", "I", 9)
                pdf.set_text_color(100, 100, 100)
                pdf.cell(0, 5, _sanitize_text(job["duration"]), new_x="LMARGIN", new_y="NEXT")

            pdf.ln(1)

            # Bullets
            for bullet in job.get("bullets", []):
                pdf.bullet_point(bullet)

            # Technologies
            if job.get("technologies"):
                pdf.set_font("Helvetica", "I", 9)
                pdf.set_text_color(80, 80, 80)
                pdf.cell(
                    0, 5,
                    _sanitize_text(f"Technologies: {job['technologies']}"),
                    new_x="LMARGIN", new_y="NEXT",
                )

            pdf.ln(3)

    # ── Technical Skills ──
    technical_skills = resume_data.get("technical_skills", {})
    skill_rows = _build_skill_rows(technical_skills)
    if skill_rows:
        pdf.section_title("Technical Skills")
        for label, value in skill_rows:
            pdf.set_font("Helvetica", "B", 9.5)
            pdf.set_text_color(30, 30, 30)
            label_w = 58
            pdf.cell(label_w, 5, f"{label}:")
            pdf.set_font("Helvetica", "", 9.5)
            pdf.set_text_color(50, 50, 50)
            pdf.multi_cell(
                pdf.w - pdf.l_margin - pdf.r_margin - label_w,
                5,
                _sanitize_text(value),
            )
            pdf.ln(0.5)
        pdf.ln(2)

    # ── Certifications ──
    certifications = resume_data.get("certifications", [])
    if certifications:
        pdf.section_title("Certifications")
        for cert in certifications:
            pdf.bullet_point(cert, size=10)
        pdf.ln(2)

    # ── Education ──
    education = resume_data.get("education", [])
    if education:
        pdf.section_title("Education")
        for edu in education:
            pdf.set_font("Helvetica", "B", 10)
            pdf.set_text_color(30, 30, 30)
            line = edu.get("degree", "")
            if edu.get("institution"):
                line += f" — {edu['institution']}"
            if edu.get("graduation_year"):
                line += f" ({edu['graduation_year']})"
            pdf.cell(0, 6, _sanitize_text(line), new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)

    # ── Output ──
    pdf_bytes = pdf.output()
    logger.info("Generated PDF — %d bytes", len(pdf_bytes))
    return pdf_bytes
