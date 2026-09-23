# AI-Powered Road Condition Intelligence & Maintenance Prioritization System

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB.svg?logo=react&logoColor=black)](https://vitejs.dev)
[![Ultralytics YOLO](https://img.shields.io/badge/Computer%20Vision-Ultralytics%20YOLO-111111.svg?logo=yolo&logoColor=white)](https://ultralytics.com)
[![Celery](https://img.shields.io/badge/Background%20Workers-Celery%20%2B%20Redis-37814A.svg?logo=celery&logoColor=white)](https://docs.celeryq.dev)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

An enterprise-grade, multi-user web application engineered for municipal transport departments, state highway authorities, and citizens. The system analyzes uploaded road images and dashcam/survey videos to detect surface defects (potholes, transverse/longitudinal cracks, fatigue webbing, standing water, and structural subsidence).

The platform automatically computes transparent, rule-based defect severities and 0–100 risk indices, **automatically annotates bounding boxes highlighting damaged areas**, formulations AI maintenance recommendations via the OpenRouter API (backed by an expert civil engineering rule-based fallback), and **automatically dispatches priority alert tickets to Government Inspecting Officers for on-site verification**.

---

## Table of Contents
1. [Project Overview & Key Capabilities](#1-project-overview--key-capabilities)
2. [System Architecture](#2-system-architecture)
3. [Repository Directory Structure](#3-repository-directory-structure)
4. [Prerequisites (Python & Node.js)](#4-prerequisites)
5. [Database Setup (PostgreSQL & SQLite Fallback)](#5-database-setup)
6. [Redis Setup](#6-redis-setup)
7. [Python Virtual Environment Setup](#7-python-virtual-environment-setup)
8. [Installing Backend Dependencies](#8-installing-backend-dependencies)
9. [Installing Frontend Dependencies](#9-installing-frontend-dependencies)
10. [Environment Variables Configuration](#10-environment-variables-configuration)
11. [Adding the YOLO Defect Detection Model](#11-adding-the-yolo-defect-detection-model)
12. [Configuring OpenRouter AI Assistant](#12-configuring-openrouter-ai-assistant)
13. [Running the Backend Server](#13-running-the-backend-server)
14. [Running Celery Background Workers](#14-running-celery-background-workers)
15. [Running the React Frontend](#15-running-the-react-frontend)
16. [Docker Deployment (`docker compose up`)](#16-docker-deployment)
17. [Multi-User Concurrency & Role Isolation](#17-multi-user-concurrency--role-isolation)
18. [Automated Damage Boxing & Officer Dispatch](#18-automated-damage-boxing--officer-dispatch)
19. [API Documentation](#19-api-documentation)
20. [Troubleshooting & FAQs](#20-troubleshooting--faqs)

---

## 1. Project Overview & Key Capabilities

- **Asynchronous, Non-Blocking Ingestion**: FastAPI immediately returns a unique `job_id` with status `queued`. Large video and image inference tasks are offloaded to Celery + Redis workers, preventing server freezes even during concurrent multi-user load.
- **Automated Damage Boxing & Officer Dispatch**: Every detected defect is boxed with high-contrast colored boundaries, semi-transparent highlight fill, and telemetry badges. The system automatically creates an `OfficerDispatch` ticket in the municipal queue assigned to field officers.
- **Rule-Based Severity & 0–100 Risk Score**: Transparent project-defined heuristics in `severity.py` and `risk.py` combining defect size, defect type, frequency, water accumulation, traffic corridor classification, and historical trend.
- **OpenRouter AI Assistant with Fallback**: Generates structured maintenance dossiers (explanation, risk drivers, asphalt/bitumen intervention specs, urgency, and field verification checklists) via OpenRouter, with zero downtime due to automatic rule-based fallback.
- **Geospatial Intelligence (GIS)**: Interactive Leaflet + OpenStreetMap interface with marker clustering, filtering by severity, defect category, and road segment.
- **Inspection Auditing & Dossiers**: Longitudinal historical comparisons (Survey A vs Survey B) and one-click PDF & CSV report generation.

> [!NOTE]
> **Engineering Disclaimer**: Severity classifications, risk indices, and AI recommendations are project-defined decision-support heuristics designed to prioritize municipal maintenance schedules. They do not supersede physical verification by certified civil engineers.

---

## 2. System Architecture

```
[React + Vite Frontend (Tailwind, Leaflet, Recharts)]
                   │ (HTTP / JWT Bearer)
                   ▼
       [FastAPI Backend Server (Uvicorn)]
       ├── Database: PostgreSQL (Prod) / SQLite (Local Dev)
       ├── File Storage: /storage (uploads, processed, videos, reports)
       └── Task Dispatcher: Redis Broker (Primary) + Local Async Fallback
                   │
                   ▼
       [Distributed Background Workers]
       ├── OpenCV Video Frame Extraction (Configurable VIDEO_FRAME_INTERVAL)
       ├── Ultralytics YOLO Defect Inference (Dynamic Class Extraction)
       ├── Automatic Damage Bounding & Image Highlighting
       ├── Rule-Based Severity & 0-100 Risk Scoring
       ├── OpenRouter AI Recommendation (Fallback to recommendation.py)
       └── Automated Officer Dispatch Ticket Generation
```

---

## 3. Repository Directory Structure

```
PS02_Road_Intelligence/
├── backend/
│   ├── app/
│   │   ├── config.py             # Pydantic environment configurations
│   │   ├── database.py           # SQLAlchemy engine & session pool
│   │   ├── main.py               # FastAPI application entrypoint
│   │   ├── models/               # SQLAlchemy DB ORM models
│   │   │   ├── user.py
│   │   │   ├── inspection.py
│   │   │   ├── file.py
│   │   │   ├── processing_job.py
│   │   │   ├── detection.py
│   │   │   ├── road_segment.py
│   │   │   ├── maintenance_recommendation.py
│   │   │   ├── officer_dispatch.py
│   │   │   ├── historical_inspection.py
│   │   │   └── audit_log.py
│   │   ├── schemas/              # Pydantic validation schemas
│   │   ├── routers/              # REST API endpoint routers
│   │   ├── services/             # CV, OpenRouter, GPS & Report services
│   │   ├── workers/              # Celery & background worker tasks
│   │   └── utils/                # Severity, Risk, Security & Safe Logger
│   ├── models/
│   │   └── road_damage.pt        # Target YOLO model weights path
│   ├── storage/
│   │   ├── uploads/              # Raw incoming image/video uploads
│   │   ├── processed/            # Annotated images with boxed damage
│   │   ├── videos/               # Annotated video survey outputs
│   │   └── reports/              # Generated PDF & CSV inspection reports
│   ├── alembic/                  # Database migration scripts
│   ├── tests/                    # Automated pytest test suite
│   ├── seed_demo_data.py         # Seed script for realistic demo data
│   ├── requirements.txt          # Python package dependencies
│   └── .env.example              # Sample environment configurations
├── frontend/
│   ├── src/
│   │   ├── components/           # Reusable UI badges, cards, charts, maps
│   │   ├── context/              # AuthContext (JWT state & roles)
│   │   ├── layouts/              # Government authority layout wrapper
│   │   ├── pages/                # 13 complete application views
│   │   ├── services/             # Axios API client & interceptors
│   │   ├── App.jsx               # Application root & view controller
│   │   ├── index.css             # Tailwind CSS & Leaflet styles
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js            # Vite config with backend proxy
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── docker-compose.yml
├── docker-compose.yml
└── README.md
```

---

## 4. Prerequisites

- **Python**: Version 3.10, 3.11, 3.12, or 3.13.
- **Node.js**: Version 18.x, 20.x, or 22.x with `npm`.
- **Git**: For version control.

---

## 5. Database Setup

### Local Development (Default):
No external database installation is required. The system defaults to **SQLite** (`road_intelligence.db`) with automatic table creation and foreign key support.

### Production (PostgreSQL):
1. Install PostgreSQL 14+ or launch via Docker:
   ```bash
   docker run --name road_postgres -e POSTGRES_PASSWORD=postgrespassword -e POSTGRES_DB=road_intelligence -p 5432:5432 -d postgres:15-alpine
   ```
2. In `backend/.env`, set:
   ```env
   DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/road_intelligence
   ```

---

## 6. Redis Setup

Redis powers the Celery asynchronous task queue.

### Windows (Local):
You can run Redis in Docker:
```bash
docker run --name road_redis -p 6379:6379 -d redis:7-alpine
```
*Note: If Redis is not running during local Windows development, the backend automatically falls back to an asynchronous in-process thread worker. The server will never freeze or crash!*

---

## 7. Python Virtual Environment Setup

From the project root:
```bash
# Windows PowerShell
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

---

## 8. Installing Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

---

## 9. Installing Frontend Dependencies

```bash
cd frontend
npm install
```

---

## 10. Environment Variables Configuration

In `backend/`, copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Key environment options:
```env
# Database
DATABASE_URL=sqlite:///./road_intelligence.db
# DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/road_intelligence

# Redis & Celery
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
CELERY_CONCURRENCY=2

# OpenRouter AI Assistant
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# Security
JWT_SECRET_KEY=your-custom-production-secret-key-salt
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Ingestion Constraints
MAX_UPLOAD_SIZE=524288000
MAX_VIDEO_DURATION=600
VIDEO_FRAME_INTERVAL=3
CONFIDENCE_THRESHOLD=0.25
```

---

## 11. Adding the YOLO Defect Detection Model

1. Place your trained road damage weights file at:
   ```
   backend/models/road_damage.pt
   ```
2. The system loads class names dynamically from `model.names` (supports custom class labels like `pothole`, `crack`, `water accumulation`, `damaged road`, etc.).
3. **Graceful Fallback**: If you do not have custom weights yet, the system automatically uses pre-warmed weights with domain detection mapping, guaranteeing smooth execution out of the box.

---

## 12. Configuring OpenRouter AI Assistant

1. Add your OpenRouter API key to `backend/.env`:
   ```env
   OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxx
   ```
2. The backend sends structured requests to formulate civil engineering explanations and field inspection checklists.
3. If no key is set or the API is unreachable, the system automatically uses the expert rule-based civil engineering recommendation generator (`app/utils/recommendation.py`).

---

## 13. Running the Backend Server

```bash
cd backend

# Populate realistic demo inspections & users (labeled as Demo Data)
python seed_demo_data.py

# Launch FastAPI with Uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be available at: `http://localhost:8000/docs`

---

## 14. Running Celery Background Workers

In a separate terminal (with virtual environment activated):
```bash
cd backend
celery -A app.workers.celery_app.celery_app worker --loglevel=info --concurrency=2
```
*(On Windows, add `--pool=solo` if required: `celery -A app.workers.celery_app.celery_app worker --pool=solo --loglevel=info`)*

---

## 15. Running the React Frontend

In a separate terminal:
```bash
cd frontend
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 16. Docker Deployment

To launch the complete infrastructure (PostgreSQL, Redis, Celery Worker, FastAPI Backend, React Frontend with Nginx):

```bash
docker compose up --build
```
Access points:
- Frontend: `http://localhost`
- Backend API: `http://localhost:8000/docs`
- Health Endpoint: `http://localhost:8000/health`

---

## 17. Multi-User Concurrency & Role Isolation

The system enforces strict user isolation through JWT authentication:
- **Citizen**: Can report road hazards, view their own submitted surveys, and monitor repair status.
- **Government Officer**: Inspects all city/state surveys, claims and manages maintenance tickets, adjusts repair status (`Pending` &rarr; `In Progress` &rarr; `Resolved`), and catalogs road segments.
- **Admin Officer**: Executive oversight, user administration, system health monitoring, and statutory dossier generation.

### Demo User Accounts:
| Role | Email | Password |
|---|---|---|
| **Admin Officer** | `admin@roadintelligence.gov` | `admin123` |
| **Government Officer** | `officer@roadintelligence.gov` | `officer123` |
| **Citizen Reporter** | `citizen@example.com` | `citizen123` |

---

## 18. Automated Damage Boxing & Officer Dispatch

As required by municipal workflows:
1. When road images or videos are processed, the YOLO engine detects defects.
2. The CV service **automatically boxes each defect** with a color-coded bounding border, semi-transparent highlight fill, and a label tag (`POTHOLE | Critical (86/100) | 94%`).
3. An **`OfficerDispatch` ticket is automatically created in the database** linking the boxed damage media, GPS coordinates, road segment, and repair priority.
4. Inspecting Officers can review these tickets in the **Maintenance Priority & Officer Dispatch** queue, claim work orders, and mark repairs complete once patched.

---

## 19. API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user account |
| `POST` | `/api/auth/login` | Authenticate & receive JWT token |
| `GET` | `/api/auth/me` | Fetch active user profile |
| `POST` | `/api/uploads/image` | Upload road image (non-blocking, returns `job_id`) |
| `POST` | `/api/uploads/video` | Upload video survey (non-blocking, returns `job_id`) |
| `GET` | `/api/jobs/{job_id}` | Poll real-time progress percentage & status |
| `GET` | `/api/inspections` | List road condition surveys |
| `GET` | `/api/inspections/{id}` | Detailed inspection data, bounding boxes & recommendations |
| `GET` | `/api/map/detections` | Mapped defect coordinates for Leaflet |
| `GET` | `/api/road-segments` | Road segment rankings & defect densities |
| `GET` | `/api/dispatches` | Automated damage dispatch tickets for officers |
| `PATCH` | `/api/dispatches/{id}/status` | Update dispatch repair progress |
| `POST` | `/api/ai/explanation` | Request OpenRouter civil engineering advisory |
| `POST` | `/api/reports/generate` | Compile official PDF dossier or CSV export |
| `GET` | `/health` | Live health probe verifying DB, Redis & Backend |

---

## 20. Troubleshooting & FAQs

- **Server blocks on video processing?**
  Ensure the upload endpoint is returning immediately with `status: "queued"`. Check that Celery or the async thread pool is handling the task.
- **Port 8000 already in use?**
  Run `uvicorn app.main:app --port 8001` and adjust `frontend/vite.config.js` proxy settings accordingly.
- **OpenRouter returns 401 Unauthorized?**
  Verify `OPENROUTER_API_KEY` in `backend/.env`. Note that if the key is invalid or offline, the system automatically uses the rule-based expert recommendation fallback.
- **Running tests?**
  From `backend/`, run:
  ```bash
  pytest tests
  ```
