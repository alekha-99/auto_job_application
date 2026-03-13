"""
test_e2e.py — End-to-end test: upload PDF resume + Wells Fargo JD → get tailored JSON.
"""

import requests
import json

API_URL = "http://localhost:8000"

JD_TEXT = """
Generative AI Senior Software Engineer for Cloud and LLM API Systems
Wells Fargo

About this role:
Wells Fargo is seeking a Generative AI Senior Software Engineer for Cloud and LLM API Systems within Digital Technology – AI Capability Engineering to design, build, and operate platform's poly-cloud foundation across GCP/Azure and on-prem OpenShift (OCP). This hands-on platform engineer will cover landing zones, network/IAM, secure perimeter patterns (e.g., VPC-SC/Private Service Connect), infrastructure-as-code provisioning, platform services, observability, DR/BCP, content security, and capacity planning to support Gen AI Studio, APIs, Guardrails, and agent workloads. This role is full stack in addition to infrastructure engineering, you will build automation services and UI experiences that enable onboarding, visibility, and operational workflows across environments. The role requires strong Kubernetes fundamentals (preferably GKE) and hands on knowledge of GenAI concepts to support state-of-the-art platform delivery.

In this role, you will:
* Lead moderately complex initiatives and deliverables within technical domain environments
* Contribute to large scale planning of strategies
* Design, code, test, debug, and document for projects and programs associated with technology domain, including upgrades and deployments
* Review moderately complex technical challenges that require an in-depth evaluation of technologies and procedures
* Resolve moderately complex issues and lead a team to meet existing client needs or potential new clients needs while leveraging solid understanding of the function, policies, procedures, or compliance requirements
* Collaborate and consult with peers, colleagues, and mid-level managers to resolve technical challenges and achieve goals
* Lead projects and act as an escalation point, provide guidance and direction to less experienced staff

Required Qualifications:
* 4+ years of Software Engineering experience, or equivalent demonstrated through one or a combination of the following: work experience, training, military experience, education

Desired Qualifications:
* Hands-on experience engineering cloud landing zones (projects/subscriptions, org policies, VPC/VNETs, firewalls, service perimeters) and documenting control plane vs compute plane topology patterns
* Experience provisioning resources in GCP and Azure using Terraform (IaC), including secrets integration patterns with HashiCorp Vault
* Experience implementing secure hybrid connectivity (peering/PSC, DNS, egress) between on-prem OCP and cloud environments to support API calls to model endpoints and internal services
* Strong Kubernetes knowledge (preferably GKE) and experience hosting applications on Kubernetes platforms (GKE/OCP or similar)
* UI skills: experience building internal portals/dashboards for onboarding, operational visibility, and workflow execution (developer/ops experiences)
* GenAI experience: understanding of GenAI concepts (LLMs, RAG, LLM architecture) to support day-to-day platform design decisions and delivery
"""

RESUME_PDF_PATH = r"C:\Users\Alekh\Downloads\Alekha_Mandalapu_Google.pdf"


def test_tailor_upload():
    """Test /tailor/upload with real PDF + JD."""
    print("=" * 60)
    print("Testing POST /tailor/upload")
    print("=" * 60)

    with open(RESUME_PDF_PATH, "rb") as f:
        resp = requests.post(
            f"{API_URL}/tailor/upload",
            files={"resume_file": ("resume.pdf", f, "application/pdf")},
            data={"job_description": JD_TEXT},
            timeout=120,
        )

    print(f"Status: {resp.status_code}")

    if resp.status_code == 200:
        result = resp.json()

        print(f"\n--- JD Quality Score: {result.get('jd_quality', {}).get('jd_quality_score', 'N/A')}")
        print(f"--- ATS Score: {result.get('ats_score', 'N/A')}")
        print(f"--- Score Breakdown:")
        for k, v in result.get("score_breakdown", {}).items():
            print(f"    {k}: {v.get('score', '?')}/{v.get('max', '?')} — {v.get('reason', '')}")

        tailored = result.get("tailored_resume", {})
        print(f"\n--- Candidate Name: {tailored.get('name', 'N/A')}")
        print(f"--- Summary: {tailored.get('professional_summary', 'N/A')[:200]}...")

        print(f"\n--- Work Experience ({len(tailored.get('work_experience', []))} jobs):")
        for job in tailored.get("work_experience", []):
            print(f"    • {job.get('title', '?')} @ {job.get('company', '?')} ({job.get('duration', '?')})")

        print(f"\n--- Improvement Suggestions ({len(result.get('improvement_suggestions', []))}):")
        for s in result.get("improvement_suggestions", []):
            print(f"    [{s.get('priority', '?')}] {s.get('section', '?')}: {s.get('issue', '?')}")

        # Save full JSON for inspection
        with open("test_result.json", "w", encoding="utf-8") as out:
            json.dump(result, out, indent=2, ensure_ascii=False)
        print("\n✅ Full JSON saved to test_result.json")
    else:
        print(f"ERROR: {resp.text}")


if __name__ == "__main__":
    test_tailor_upload()
