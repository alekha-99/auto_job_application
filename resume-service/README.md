# Resume Tailoring Microservice

ATS-optimized resume tailoring powered by **Claude AI**.  
Submit a base resume + job description → receive a tailored resume as **JSON** or **PDF**.

## Quick Start

```bash
# 1. Create virtual environment
cd resume-service
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure your API key
#    Edit .env and set ANTHROPIC_API_KEY

# 4. Start the server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Open **http://localhost:8000/docs** for the interactive Swagger UI.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/health` | Health check |
| `POST` | `/tailor` | JSON body → full Claude analysis JSON |
| `POST` | `/tailor/pdf` | JSON body → downloadable PDF |
| `POST` | `/tailor/upload` | File upload (PDF) + JD text → Claude analysis JSON |

### Example — `/tailor`

```bash
curl -X POST http://localhost:8000/tailor \
  -H "Content-Type: application/json" \
  -d '{
    "base_resume": "Alekha Mandalapu — Senior Software Engineer ...",
    "job_description": "We are looking for a Senior DevOps Engineer ..."
  }'
```

### Example — `/tailor/upload`

```bash
curl -X POST http://localhost:8000/tailor/upload \
  -F "resume_file=@my_resume.pdf" \
  -F "job_description=We are looking for a Senior DevOps Engineer ..."
```

---

## Docker

```bash
docker build -t resume-service .
docker run -p 8000:8000 --env-file .env resume-service
```

---

## Project Structure

```
resume-service/
├── main.py              # FastAPI app & routes
├── prompts.py           # System + user prompt definitions
├── claude_service.py    # Claude API integration
├── pdf_service.py       # WeasyPrint PDF generation
├── templates/
│   └── resume.html      # Jinja2 HTML template
├── requirements.txt
├── Dockerfile
├── .env                 # API key (gitignored)
└── README.md
```
