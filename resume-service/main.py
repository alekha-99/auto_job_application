"""
main.py — FastAPI application for the Resume Tailoring Microservice.

Endpoints:
  GET  /health        → Health check
  POST /tailor        → JSON in, full Claude JSON out
  POST /tailor/pdf    → JSON in, PDF download out
  POST /tailor/upload → PDF file upload + JD text, JSON out
"""

import io
import logging
import re
import tempfile
from typing import Optional

import pdfplumber
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

from claude_service import generate_tailored_resume
from pdf_service import render_resume_pdf

# ── Bootstrap ──────────────────────────────────────────────────────────
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)

# ── FastAPI app ────────────────────────────────────────────────────────
app = FastAPI(
    title="Resume Tailoring Microservice",
    description=(
        "ATS-optimized resume tailoring powered by Claude. "
        "Submit a base resume + job description and receive a "
        "tailored resume as JSON or downloadable PDF."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response models ──────────────────────────────────────────
class TailorRequest(BaseModel):
    base_resume: str
    job_description: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


# ── Helpers ────────────────────────────────────────────────────────────
def _extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract all text from an uploaded PDF using pdfplumber."""
    text_parts: list[str] = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    full_text = "\n".join(text_parts)
    if not full_text.strip():
        raise ValueError("Could not extract any text from the uploaded PDF.")
    return full_text


def _extract_company_name(result: dict, jd_text: str) -> str:
    """
    Extract the TARGET company name (from the JD) for use in the PDF filename.
    Priority:
      1. Pattern match the company name from the JD text (the target employer)
      2. Fallback to 'Company'
    """
    # Try to extract from JD text — the company name is what we want
    # (not the candidate's current employer from their resume)
    patterns = [
        r"^([A-Z][A-Za-z &.,'-]+?)\s+is seeking",
        r"(?:company|employer|organization)[:\s]+([A-Z][A-Za-z &.,'-]+)",
        r"(?:at|join)\s+([A-Z][A-Za-z &.,'-]+?)\s",
        # Common JD headers
        r"^([A-Z][A-Za-z &.,'-]+?)\n",
    ]
    for pattern in patterns:
        match = re.search(pattern, jd_text, re.MULTILINE)
        if match:
            name = match.group(1).strip().rstrip(".,-")
            if 2 < len(name) < 50:
                return name

    return "Company"


def _build_pdf_filename(candidate_name: str, company_name: str) -> str:
    """
    Build the PDF filename in the format: Alekha_Mandalapu_Wells_Fargo.pdf
    """
    # Clean and format candidate name
    name_part = re.sub(r"[^A-Za-z\s]", "", candidate_name).strip()
    name_part = "_".join(name_part.split())

    # Clean and format company name
    company_part = re.sub(r"[^A-Za-z\s]", "", company_name).strip()
    company_part = "_".join(company_part.split())

    if name_part and company_part:
        return f"{name_part}_{company_part}.pdf"
    elif name_part:
        return f"{name_part}_Resume.pdf"
    else:
        return "Tailored_Resume.pdf"


# ── Routes ─────────────────────────────────────────────────────────────
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Simple health / readiness probe."""
    return HealthResponse(
        status="ok",
        service="resume-tailoring-service",
        version="1.0.0",
    )


@app.post("/tailor")
async def tailor_resume(payload: TailorRequest):
    """
    Accept base resume text + job description text as JSON.
    Returns the full Claude analysis JSON (keyword analysis, ATS score,
    tailored resume, improvement suggestions, etc.).
    """
    if not payload.base_resume.strip():
        raise HTTPException(status_code=400, detail="base_resume cannot be empty.")
    if not payload.job_description.strip():
        raise HTTPException(status_code=400, detail="job_description cannot be empty.")

    try:
        result = generate_tailored_resume(
            base_resume_text=payload.base_resume,
            job_description_text=payload.job_description,
        )
    except ValueError as exc:
        logger.exception("JSON parsing error from Claude response")
        raise HTTPException(
            status_code=502,
            detail=f"Failed to parse Claude response as JSON: {exc}",
        )
    except Exception as exc:
        logger.exception("Error calling Claude API")
        raise HTTPException(
            status_code=502,
            detail=f"Claude API error: {exc}",
        )

    return result


@app.post("/tailor/pdf")
async def tailor_resume_pdf(payload: TailorRequest):
    """
    Accept base resume text + job description text as JSON.
    Returns a downloadable PDF of the tailored resume.
    """
    if not payload.base_resume.strip():
        raise HTTPException(status_code=400, detail="base_resume cannot be empty.")
    if not payload.job_description.strip():
        raise HTTPException(status_code=400, detail="job_description cannot be empty.")

    try:
        result = generate_tailored_resume(
            base_resume_text=payload.base_resume,
            job_description_text=payload.job_description,
        )
    except ValueError as exc:
        logger.exception("JSON parsing error from Claude response")
        raise HTTPException(
            status_code=502,
            detail=f"Failed to parse Claude response as JSON: {exc}",
        )
    except Exception as exc:
        logger.exception("Error calling Claude API")
        raise HTTPException(
            status_code=502,
            detail=f"Claude API error: {exc}",
        )

    tailored = result.get("tailored_resume")
    if not tailored:
        raise HTTPException(
            status_code=502,
            detail="Claude response did not contain a tailored_resume section.",
        )

    try:
        pdf_bytes = render_resume_pdf(tailored)
    except Exception as exc:
        logger.exception("PDF rendering error")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to render PDF: {exc}",
        )

    # Build filename: Name_CompanyName.pdf
    candidate_name = tailored.get("name", "")
    company_name = _extract_company_name(result, payload.job_description)
    filename = _build_pdf_filename(candidate_name, company_name)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.post("/tailor/upload")
async def tailor_resume_upload(
    resume_file: UploadFile = File(..., description="PDF resume file"),
    job_description: str = Form(..., description="Job description text"),
):
    """
    Accept a PDF resume file upload + job description as form data.
    Extracts text from the PDF and returns the full Claude analysis JSON.
    """
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="job_description cannot be empty.")

    # Validate file type
    if resume_file.content_type and "pdf" not in resume_file.content_type.lower():
        raise HTTPException(
            status_code=400,
            detail=f"Expected a PDF file, got {resume_file.content_type}.",
        )

    file_bytes = await resume_file.read()

    try:
        base_resume_text = _extract_text_from_pdf(file_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.exception("PDF extraction error")
        raise HTTPException(
            status_code=400,
            detail=f"Could not read the uploaded PDF: {exc}",
        )

    logger.info(
        "Extracted %d characters from uploaded PDF '%s'",
        len(base_resume_text),
        resume_file.filename,
    )

    try:
        result = generate_tailored_resume(
            base_resume_text=base_resume_text,
            job_description_text=job_description,
        )
    except ValueError as exc:
        logger.exception("JSON parsing error from Claude response")
        raise HTTPException(
            status_code=502,
            detail=f"Failed to parse Claude response as JSON: {exc}",
        )
    except Exception as exc:
        logger.exception("Error calling Claude API")
        raise HTTPException(
            status_code=502,
            detail=f"Claude API error: {exc}",
        )

    return result


# ── Entrypoint ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
