# Agentic-AI-Guardrail-Engine-for-FinTech-Companies
## Governed Agentic AI Decision Control Platform

A recruiter-grade full-stack web application that demonstrates how agentic AI can be used in financial workflows under deterministic governance, policy controls, explainability, auditability, and human oversight.

## Overview

The platform sits between an AI recommendation and a financial business action such as:

- approving or rejecting a loan
- escalating a suspicious transaction
- prioritizing KYC / AML review
- generating an investment recommendation memo
- suggesting a customer risk tier
- flagging a compliance risk

Every proposed action moves through a governed pipeline:

1. Worker Agent / Case Intake
2. Policy Agent / Rule Engine
3. Risk Agent / Risk Scoring
4. Fairness & Governance Agent
5. Audit Agent / Decision Trace
6. Human Review Layer
7. Final Decision Output

Allowed final outcomes:

- `APPROVE`
- `REJECT`
- `ESCALATE TO HUMAN REVIEW`

## Why This Matters

Financial AI should not directly execute high-impact actions without controls. This project demonstrates a practical internal control plane that:

- enforces deterministic hard rules before execution
- routes weak or sensitive cases to humans
- records versioned policy decisions for reproducibility
- exposes explainable reasoning and risk contributors
- preserves override history and audit-grade exports

## Stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- Recharts

### Backend

- FastAPI
- SQLAlchemy
- Pydantic
- SQLite for local development
- PostgreSQL-ready database handling via SQLAlchemy + `psycopg`

### Deployment

- Docker
- docker-compose
- Vercel-ready frontend config
- Railway-ready backend path

## Core Features

- governance-first financial case evaluation workflow
- deterministic policy engine with configurable thresholds
- policy versioning with persisted rule edits
- explainability panel with deterministic reasoning
- risk scoring with detailed component breakdown
- fairness and governance escalation logic
- human review queue with override tracking
- audit export to JSON and TXT
- dashboard KPIs, charts, audit logs, and queue analytics
- synthetic seed data for realistic demo scenarios
- backend tests with `pytest`

## Web Pages

- Landing page
- Dashboard
- New evaluation form
- Case detail page
- Audit log registry
- Human review queue
- Policy management

## Repository Structure

```text
github-web-release/
├── .env.example
├── .gitignore
├── docker-compose.yml
├── README.md
├── backend/
│   ├── .dockerignore
│   ├── .env.example
│   ├── Dockerfile
│   ├── Procfile
│   ├── requirements.txt
│   ├── run_backend.py
│   └── app/
│       ├── main.py
│       ├── seed.py
│       ├── core/
│       ├── models/
│       ├── routes/
│       ├── schemas/
│       ├── services/
│       ├── tests/
│       └── utils/
└── frontend/
    ├── .dockerignore
    ├── .env.example
    ├── Dockerfile
    ├── package.json
    ├── vercel.json
    ├── next.config.ts
    ├── app/
    ├── components/
    ├── lib/
    └── public/
```

## Guardrail Rules

- reject if credit score is below minimum threshold
- escalate if debt-to-income exceeds policy threshold
- escalate if model confidence is too low
- escalate if evidence completeness is too low
- escalate if supporting evidence text is too short
- escalate or reject if transaction amount is unusually high relative to income
- escalate risky synthetic country / product combinations
- escalate contradictory model recommendations
- escalate fairness-sensitive synthetic scenarios
- escalate stacked medium-risk signals

## Seeded Demo Cases

- safe approval
- low credit rejection
- high debt-to-income escalation
- low-confidence escalation
- missing evidence escalation
- suspicious large transaction
- fairness-sensitive intervention
- contradictory recommendation
- borderline case with human override

## Clone And Run From Terminal

Repository URL:

```text
https://github.com/Saroswat/Agentic-Guardrail-Engine-for-FinTech-Companies.git
```

### Prerequisites

- Git
- Node.js LTS with npm
- Python 3.11 or newer

### Windows Setup And Run

#### 1. Install required tools

```powershell
winget install --id Git.Git -e --source winget
winget install --id OpenJS.NodeJS.LTS -e --source winget
winget install --id Python.Python.3.12 -e --source winget
```

If PowerShell blocks `npm`, use `npm.cmd` in the commands below.

#### 2. Clone the repository

```powershell
git clone https://github.com/Saroswat/Agentic-Guardrail-Engine-for-FinTech-Companies.git
cd Agentic-Guardrail-Engine-for-FinTech-Companies
```

#### 3. Start the backend

Open terminal 1:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env -Force
.\.venv\Scripts\python.exe run_backend.py
```

#### 4. Start the frontend

Open terminal 2:

```powershell
cd frontend
Copy-Item .env.example .env.local -Force
npm.cmd install
npm.cmd run dev
```

Open in browser:

- `http://localhost:3000`
- `http://localhost:8000/health`

### macOS Setup And Run

#### 1. Install required tools

If Homebrew is not installed:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Then install the required packages:

```bash
brew install git node python@3.12
```

#### 2. Clone the repository

```bash
git clone https://github.com/Saroswat/Agentic-Guardrail-Engine-for-FinTech-Companies.git
cd Agentic-Guardrail-Engine-for-FinTech-Companies
```

#### 3. Start the backend

Open terminal 1:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
cp .env.example .env
python run_backend.py
```

#### 4. Start the frontend

Open terminal 2:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open in browser:

- `http://localhost:3000`
- `http://localhost:8000/health`

### One-Time Docker Alternative

If Docker Desktop is already installed, you can run the full web stack with one command after cloning:

```bash
docker compose up --build
```

## Local Run

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env -Force
.\.venv\Scripts\python.exe run_backend.py
```

### Frontend

Open a second terminal:

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local -Force
npm.cmd run dev
```

Open:

- frontend: [http://localhost:3000](http://localhost:3000)
- backend health: [http://localhost:8000/health](http://localhost:8000/health)
- backend docs: [http://localhost:8000/docs](http://localhost:8000/docs)

## Docker

```powershell
docker compose up --build
```

## Deployment

### Frontend to Vercel

```powershell
cd frontend
npm install
vercel link
vercel env add NEXT_PUBLIC_API_BASE_URL production
vercel env add NEXT_PUBLIC_API_BASE_URL preview
vercel deploy --prod
```

### Backend to Railway

```powershell
cd backend
railway login
railway init -n agentic-guardrail-backend
railway variable set DATABASE_URL=postgresql://REPLACE_WITH_POSTGRES_URL
railway variable set AUDIT_EXPORT_DIR=/data/audit_exports
railway variable set CORS_ORIGINS=https://REPLACE_WITH_YOUR_VERCEL_DOMAIN
railway variable set SEED_ON_STARTUP=true
railway up
```

## Environment Variables

### Root

```env
APP_ENV=development
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
DATABASE_URL=sqlite:///./agentic_guardrail.db
AUDIT_EXPORT_DIR=./audit_exports
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
SEED_ON_STARTUP=true
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Backend Production Example

```env
APP_ENV=production
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
DATABASE_URL=postgresql+psycopg://username:password@host:5432/agentic_guardrail
AUDIT_EXPORT_DIR=/data/audit_exports
CORS_ORIGINS=https://your-frontend.vercel.app
SEED_ON_STARTUP=true
```

### Frontend Production Example

```env
NEXT_PUBLIC_API_BASE_URL=https://agentic-guardrail-backend.up.railway.app
```

## API Routes

- `GET /health`
- `GET /dashboard/summary`
- `GET /dashboard/charts`
- `GET /cases`
- `GET /cases/{id}`
- `POST /cases`
- `POST /cases/{id}/evaluate`
- `GET /reviews/pending`
- `POST /reviews/{id}/decision`
- `GET /policies`
- `POST /policies/update`
- `GET /audit/{case_id}/export/json`
- `GET /audit/{case_id}/export/txt`

## Interview Talking Points

- deterministic governance layer for financial AI decisions
- explainability and auditability as first-class product features
- policy versioning with reproducible rule outcomes
- human override capture for model risk and compliance workflows
- realistic full-stack architecture using a modern React frontend and Python API backend

## Future Upgrades

- authentication and RBAC
- Alembic migrations
- PostgreSQL production persistence
- governed LLM explanation adapters
- LangGraph-style orchestration
- observability and tracing
