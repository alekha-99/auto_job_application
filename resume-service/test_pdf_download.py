"""
test_pdf_download.py — Generate and download a PDF from the saved test results.
Uses the locally saved test_result.json to generate a PDF without calling Claude again.
"""
import json
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from pdf_service import render_resume_pdf

# Load the saved Claude result
with open("test_result.json", "r", encoding="utf-8") as f:
    result = json.load(f)

tailored = result["tailored_resume"]

# Generate PDF
pdf_bytes = render_resume_pdf(tailored)

# Save to a file the user can inspect
output_path = os.path.join(os.path.dirname(__file__), "Alekha_Mandalapu_Wells_Fargo.pdf")
with open(output_path, "wb") as f:
    f.write(pdf_bytes)

print(f"✅ PDF saved to: {output_path}")
print(f"   Size: {len(pdf_bytes):,} bytes")
print(f"   Candidate: {tailored.get('name')}")
print(f"   Jobs: {len(tailored.get('work_experience', []))}")
