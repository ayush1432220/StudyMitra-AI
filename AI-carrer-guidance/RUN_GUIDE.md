# 🚀 ApexForge (Career AI) — Complete Setup & Run Guide

Comprehensive guide to setting up, configuring, and running the **ApexForge / AI Career Guidance** platform locally and in production environments.

---

## 📌 1. Project Overview & Architecture

ApexForge is an AI-powered Career Guidance and Mentorship platform built for students and engineers.

- **Backend Framework**: Python (Flask / Gunicorn) — JSON API only, no server-rendered pages
- **AI & RAG Engine**: ChromaDB Vector Database + Sarvam AI (Primary) with Groq (LLaMA-3 fallback)
- **Database**: SQLite3 (`users.db`) for user authentication, profiles, todo lists, and gamification metrics
- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4, in `frontend/`, keeping the liquid-glass glassmorphism look
- **Deployment Spec**: Render Web Service (`render.yaml`)

The frontend proxies `/api/*` to the Flask process via `rewrites()` in
`frontend/next.config.ts` (override the target with the `BACKEND_URL` env var).
Because the browser only ever talks to the Next origin, the Flask session cookie
is sent and received without CORS or SameSite workarounds.

---

## 📋 2. Prerequisites

Ensure you have the following installed on your system:

| Requirement | Minimum Version | Note |
|---|---|---|
| **Python** | 3.10+ (3.11 or 3.12 recommended) | Check with `python --version` |
| **pip** | Latest | Check with `pip --version` |
| **Git** | Latest | Version control |
| **API Keys** | Sarvam AI / Groq API Keys | Required for AI Mentor & RAG endpoints |

---

## 🛠️ 3. Step-by-Step Local Setup

### Step 3.1: Clone or Navigate to the Repository

```bash
cd "d:\Desktop\AI-carrer-guidance"
```

---

### Step 3.2: Activate / Create Virtual Environment

If a virtual environment `venv` already exists:

**On Windows (PowerShell):**
```powershell
.\venv\Scripts\Activate.ps1
```
*(If PowerShell execution policy blocks activation, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first)*

**On Windows (Command Prompt):**
```cmd
venv\Scripts\activate.bat
```

**On Linux / macOS:**
```bash
source venv/bin/activate
```

*(If creating a fresh virtual environment from scratch):*
```bash
python -m venv venv
```

---

### Step 3.3: Install Dependencies

Activate your virtual environment and install the required Python packages:

```bash
# If requirements.txt is in the backend/ directory:
pip install -r backend/requirements.txt

# Or if in root:
pip install -r requirements.txt
```

#### Key Required Packages Overview:
- `flask`, `flask-cors`, `werkzeug` (Backend API & session management)
- `gunicorn` (Production WSGI server)
- `chromadb` (Vector database for RAG retrieval)
- `requests`, `httpx` (HTTP client for Sarvam AI & Groq APIs)
- `python-dotenv` (Environment variable loading)

---

### Step 3.4: Configure Environment Variables (`.env`)

Create a `.env` file in the `backend/` folder (or project root):

```env
# ==============================================================================
# Server Configuration
# ==============================================================================
PORT=5000
FLASK_ENV=development
FLASK_DEBUG=1
SECRET_KEY=apexforge_super_secure_session_secret_2026

# ==============================================================================
# AI & LLM Provider API Keys
# ==============================================================================
SARVAM_API_KEY=your_sarvam_ai_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# ==============================================================================
# Storage & Database Paths
# ==============================================================================
DB_PATH=users.db
CHROMA_PATH=chroma_db
LOG_FILE=metrics.log

# ==============================================================================
# RAG System Thresholds
# ==============================================================================
RELEVANCE_THRESHOLD=0.65
SARVAM_TIMEOUT_SECONDS=15
```

---

### Step 3.5: Initialize Vector DB & SQLite Database (First-time only)

If running the RAG pipeline for the first time:

1. **SQLite Database**: Automatically initialized on startup (`users.db`) by the backend auth module.
2. **ChromaDB Ingestion**: If documents need to be indexed/embedded:
   ```bash
   python backend/ingest.py
   ```
   *(or corresponding indexing script if provided)*

---

## 💻 4. Running the Application

Development needs **two processes**.

### Option A: Local Development Servers (Recommended for Debugging)

**Terminal 1 — Flask API:**
```powershell
.\venv\Scripts\Activate.ps1
python backend/app.py
```
API on 👉 **`http://127.0.0.1:5000`**

**Terminal 2 — Next.js UI:**
```powershell
cd frontend
npm install    # first run only
npm run dev
```
App on 👉 **`http://localhost:3000`** — this is the URL you actually open.

> **Note:** if you open the app on `127.0.0.1` or a LAN IP rather than
> `localhost`, Next blocks its own `/_next/hmr` dev resources and the page
> renders but never becomes interactive. `allowedDevOrigins` in
> `frontend/next.config.ts` already permits both; add any other host you use.

### Frontend production build

```powershell
cd frontend
npm run build
npm start
```

---

### Option B: Production Server with Gunicorn (Linux / Render / WSL)

```bash
cd backend
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

---

## 🌐 5. Verifying the Endpoints & Features

Once the server is running, you can test the primary endpoints:

| Endpoint | Method | Purpose |
|---|---|---|
| `GET /` | `GET` | Service info and the list of registered API routes |
| `GET /api/health` | `GET` | Provider/RAG configuration status (used by the UI) |
| `POST /api/auth/register` | `POST` | Register a new user |
| `POST /api/auth/login` | `POST` | Authenticate and create session |
| `POST /api/auth/logout` | `POST` | Terminate active session |
| `POST /api/v1/ask` | `POST` | AI Mentor RAG query with ChromaDB context |
| `GET /api/gamification/stats` | `GET` | User points, streaks, level, and leaderboard |
| `POST /api/gamification/update` | `POST` | Update user activity points |
| `POST /api/ocr/analyze` | `POST` | Extract and analyze resume / PDF / images |

---

## ☁️ 6. Deployment Guide (Render)

This repository includes a `render.yaml` blueprint:

1. Connect your Git repository to [Render](https://render.com/).
2. Create a **Blueprint** or **Web Service**.
3. Ensure the persistent disk is mounted:
   - **Mount Path**: `/opt/render/project/data`
   - **Size**: `1GB`
4. Set the required environment variables in Render Dashboard:
   - `SARVAM_API_KEY`
   - `GROQ_API_KEY`
   - `DB_PATH`: `/opt/render/project/data/users.db`
   - `CHROMA_PATH`: `/opt/render/project/data/chroma_db`
   - `LOG_FILE`: `/opt/render/project/data/metrics.log`
5. Build and Start Commands:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn -w 4 -b 0.0.0.0:$PORT app:app`

---

## 🔍 7. Troubleshooting & FAQs

### 1. `ModuleNotFoundError`
Ensure your virtual environment is active:
```powershell
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. RAG Request Hanging / Slow Response
- The system includes a **15-second timeout** for the Sarvam AI API.
- If Sarvam experiences high latency, the backend automatically switches to **Groq (LLaMA-3)** fallback. Ensure `GROQ_API_KEY` is configured in your `.env`.

### 3. Database Permission / Path Issues
- By default, `users.db` and `metrics.log` are stored relative to the working directory. Ensure write permissions exist for the folder.

### 4. PowerShell Script Execution Error (`Activate.ps1 cannot be loaded`)
Run PowerShell as Administrator or execute in your terminal:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```
Then run `.\venv\Scripts\Activate.ps1`.
