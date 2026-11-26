# ApexForge — AI Career Guidance & Mentor Platform

ApexForge is an intelligent, multi-hub career guidance and mentorship platform designed for engineering and technical students. It leverages Retrieval-Augmented Generation (RAG) with ChromaDB, Sarvam AI, and Groq fallback to provide tailored roadmaps, resume analysis, interview coaching, and community support.

---

## 📖 Quick Links & Documentation

- **🚀 Setup & Run Guide**: See [RUN_GUIDE.md](file:///d:/Desktop/AI-carrer-guidance/RUN_GUIDE.md) for full setup, environment variables, local execution, and Render deployment instructions.
- **📜 Development Log**: See [DEVELOPMENT_LOG.txt](file:///d:/Desktop/AI-carrer-guidance/DEVELOPMENT_LOG.txt) for changelogs, architecture notes, and feature logs.
- **⚙️ Render Deployment Spec**: See [render.yaml](file:///d:/Desktop/AI-carrer-guidance/render.yaml) for cloud hosting configuration.

---

## 🏗️ Architecture

Two processes, run side by side in development:

| Part | Stack | Port | Location |
|---|---|---|---|
| **API** | Python / Flask (JSON only) | `5000` | `backend/` |
| **Web UI** | Next.js 16, React 19, TypeScript, Tailwind v4 | `3000` | `frontend/` |

The Next.js app proxies `/api/*` to Flask (see `frontend/next.config.ts`), so the
browser stays on a single origin and the Flask session cookie works without CORS.

---

## ⚡ Quick Start

**Terminal 1 — API**

```powershell
.\venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
python backend/app.py
```

**Terminal 2 — Web UI**

```powershell
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`. The API alone answers on `http://127.0.0.1:5000`.

Add your `SARVAM_API_KEY` or `GROQ_API_KEY` to `backend/.env` (copy from
`backend/.env.example`) before the AI Mentor will answer.
