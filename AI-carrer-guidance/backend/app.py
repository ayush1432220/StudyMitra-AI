"""ApexForge - AI Career Guidance & Mentor Platform (backend).

Reconstructed against the API surface documented in RUN_GUIDE.md.

This is a JSON API only. The dashboard is the Next.js app in ../frontend,
which proxies /api/* here so the browser stays on one origin.
"""
import json
import os
import sqlite3
import time
from datetime import date, datetime, timezone
from functools import wraps

import requests
from dotenv import load_dotenv
from flask import Flask, g, jsonify, request, session
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

DB_PATH = os.getenv("DB_PATH", os.path.join(BASE_DIR, "users.db"))
LOG_FILE = os.getenv("LOG_FILE", os.path.join(BASE_DIR, "metrics.log"))
CHROMA_PATH = os.getenv("CHROMA_PATH", os.path.join(BASE_DIR, "chroma_db"))
RELEVANCE_THRESHOLD = float(os.getenv("RELEVANCE_THRESHOLD", "0.65"))
SARVAM_TIMEOUT = int(os.getenv("SARVAM_TIMEOUT_SECONDS", "15"))
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "apexforge-dev-secret")
CORS(app, supports_credentials=True)

SYSTEM_PROMPT = (
    "You are ApexForge, a career mentor for Indian engineering students. "
    "Answer with concrete, actionable guidance. If a question is clearly "
    "outside careers, skills, education or placements, say so honestly "
    "instead of inventing an answer."
)

# --------------------------------------------------------------------------
# Database
# --------------------------------------------------------------------------

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT UNIQUE NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS gamification (
    user_id     INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    points      INTEGER NOT NULL DEFAULT 0,
    streak      INTEGER NOT NULL DEFAULT 0,
    last_active TEXT
);
CREATE TABLE IF NOT EXISTS chats (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role       TEXT NOT NULL,
    content    TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS todos (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task    TEXT NOT NULL,
    done    INTEGER NOT NULL DEFAULT 0
);
"""


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(_exc):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.executescript(SCHEMA)
    conn.commit()
    conn.close()


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "authentication required"}), 401
        return fn(*args, **kwargs)

    return wrapper


def log_metric(**fields):
    record = {"timestamp": datetime.now(timezone.utc).isoformat(), **fields}
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(record) + "\n")
    except OSError:
        pass


# --------------------------------------------------------------------------
# Auth
# --------------------------------------------------------------------------

@app.post("/api/auth/register")
def register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not username or not email or len(password) < 6:
        return jsonify({"error": "username, email and a 6+ char password are required"}), 400

    db = get_db()
    try:
        cur = db.execute(
            "INSERT INTO users (username, email, password_hash, created_at) VALUES (?,?,?,?)",
            (username, email, generate_password_hash(password),
             datetime.now(timezone.utc).isoformat()),
        )
        db.execute("INSERT INTO gamification (user_id) VALUES (?)", (cur.lastrowid,))
        db.commit()
    except sqlite3.IntegrityError:
        return jsonify({"error": "username or email already registered"}), 409

    session["user_id"] = cur.lastrowid
    session["username"] = username
    return jsonify({"id": cur.lastrowid, "username": username, "email": email}), 201


@app.post("/api/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    identifier = (data.get("username") or data.get("email") or "").strip()
    password = data.get("password") or ""
    row = get_db().execute(
        "SELECT * FROM users WHERE username = ? OR email = ?",
        (identifier, identifier.lower()),
    ).fetchone()
    if row is None or not check_password_hash(row["password_hash"], password):
        return jsonify({"error": "invalid credentials"}), 401
    session["user_id"] = row["id"]
    session["username"] = row["username"]
    return jsonify({"id": row["id"], "username": row["username"], "email": row["email"]})


@app.post("/api/auth/logout")
def logout():
    session.clear()
    return jsonify({"ok": True})


@app.get("/api/auth/me")
def me():
    if "user_id" not in session:
        return jsonify({"authenticated": False})
    return jsonify({
        "authenticated": True,
        "id": session["user_id"],
        "username": session["username"],
    })


# --------------------------------------------------------------------------
# LLM providers: Sarvam primary, Groq fallback
# --------------------------------------------------------------------------

def ask_sarvam(question, context):
    if not SARVAM_API_KEY:
        raise RuntimeError("SARVAM_API_KEY not configured")
    resp = requests.post(
        "https://api.sarvam.ai/v1/chat/completions",
        headers={"api-subscription-key": SARVAM_API_KEY,
                 "Content-Type": "application/json"},
        json={
            "model": "sarvam-m",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT + context},
                {"role": "user", "content": question},
            ],
        },
        timeout=SARVAM_TIMEOUT,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"], "sarvam"


def ask_groq(question, context):
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY not configured")
    resp = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": "Bearer " + GROQ_API_KEY,
                 "Content-Type": "application/json"},
        json={
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT + context},
                {"role": "user", "content": question},
            ],
        },
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"], "groq"


def retrieve_context(_question):
    """RAG retrieval hook.

    The original ChromaDB corpus is not present in this repository, so this
    returns no citations. Point CHROMA_PATH at an index and implement the
    lookup here to restore retrieval.
    """
    return [], ""


@app.post("/api/v1/ask")
def ask():
    started = time.time()
    data = request.get_json(silent=True) or {}
    question = (data.get("question") or data.get("query") or "").strip()
    if not question:
        return jsonify({"error": "question is required"}), 400

    citations, context = retrieve_context(question)
    answer = None
    provider = None
    error = None
    for provider_fn in (ask_sarvam, ask_groq):
        try:
            answer, provider = provider_fn(question, context)
            break
        except Exception as exc:  # noqa: BLE001 - fall through to next provider
            error = str(exc)

    elapsed_ms = int((time.time() - started) * 1000)

    if answer is None:
        log_metric(endpoint="/api/v1/ask", question=question,
                   response_time_ms=elapsed_ms, out_of_scope=False,
                   citation_count=0, error=error)
        return jsonify({
            "error": "no LLM provider available",
            "detail": error,
            "hint": "set SARVAM_API_KEY or GROQ_API_KEY in backend/.env",
        }), 503

    if "user_id" in session:
        db = get_db()
        now = datetime.now(timezone.utc).isoformat()
        db.execute(
            "INSERT INTO chats (user_id, role, content, created_at) VALUES (?,?,?,?)",
            (session["user_id"], "user", question, now))
        db.execute(
            "INSERT INTO chats (user_id, role, content, created_at) VALUES (?,?,?,?)",
            (session["user_id"], "assistant", answer, now))
        db.commit()

    log_metric(endpoint="/api/v1/ask", question=question,
               response_time_ms=elapsed_ms, out_of_scope=False,
               citation_count=len(citations))
    return jsonify({"answer": answer, "citations": citations, "provider": provider})


# --------------------------------------------------------------------------
# Gamification
# --------------------------------------------------------------------------

LEVEL_SIZE = 100


@app.get("/api/gamification/stats")
@login_required
def gamification_stats():
    db = get_db()
    row = db.execute("SELECT * FROM gamification WHERE user_id = ?",
                     (session["user_id"],)).fetchone()
    points = row["points"] if row else 0
    leaderboard = db.execute(
        "SELECT u.username, g.points FROM gamification g "
        "JOIN users u ON u.id = g.user_id ORDER BY g.points DESC LIMIT 10"
    ).fetchall()
    return jsonify({
        "points": points,
        "streak": row["streak"] if row else 0,
        "level": points // LEVEL_SIZE + 1,
        "next_level_at": (points // LEVEL_SIZE + 1) * LEVEL_SIZE,
        "leaderboard": [dict(r) for r in leaderboard],
    })


@app.post("/api/gamification/update")
@login_required
def gamification_update():
    delta = int((request.get_json(silent=True) or {}).get("points", 10))
    db = get_db()
    row = db.execute("SELECT * FROM gamification WHERE user_id = ?",
                     (session["user_id"],)).fetchone()
    today = date.today().isoformat()
    streak = row["streak"] if row else 0
    if not row or row["last_active"] != today:
        streak = streak + 1 if row and row["last_active"] else 1
    db.execute(
        "INSERT INTO gamification (user_id, points, streak, last_active) VALUES (?,?,?,?) "
        "ON CONFLICT(user_id) DO UPDATE SET points = points + ?, streak = ?, last_active = ?",
        (session["user_id"], delta, streak, today, delta, streak, today),
    )
    db.commit()
    return jsonify({"ok": True, "streak": streak})


# --------------------------------------------------------------------------
# Todos
# --------------------------------------------------------------------------

@app.route("/api/todos", methods=["GET", "POST"])
@login_required
def todos():
    db = get_db()
    if request.method == "POST":
        task = ((request.get_json(silent=True) or {}).get("task") or "").strip()
        if not task:
            return jsonify({"error": "task is required"}), 400
        cur = db.execute("INSERT INTO todos (user_id, task) VALUES (?,?)",
                         (session["user_id"], task))
        db.commit()
        return jsonify({"id": cur.lastrowid, "task": task, "done": 0}), 201
    rows = db.execute("SELECT id, task, done FROM todos WHERE user_id = ?",
                      (session["user_id"],)).fetchall()
    return jsonify([dict(r) for r in rows])


# --------------------------------------------------------------------------
# OCR
# --------------------------------------------------------------------------

@app.post("/api/ocr/analyze")
@login_required
def ocr_analyze():
    """Resume / document analysis.

    The original vision pipeline depended on Sarvam's OCR models and is not
    part of this rebuild; it reports unavailable rather than guessing.
    """
    if "file" not in request.files:
        return jsonify({"error": "file is required (multipart/form-data)"}), 400
    if not SARVAM_API_KEY:
        return jsonify({"error": "OCR unavailable",
                        "hint": "set SARVAM_API_KEY in backend/.env"}), 503
    return jsonify({"error": "OCR pipeline not implemented in this build"}), 501


# --------------------------------------------------------------------------
# Health + service root
# --------------------------------------------------------------------------

@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "providers": {"sarvam": bool(SARVAM_API_KEY), "groq": bool(GROQ_API_KEY)},
        "rag_index": os.path.isdir(CHROMA_PATH),
        "relevance_threshold": RELEVANCE_THRESHOLD,
        "db": DB_PATH,
    })


@app.get("/")
def index():
    return jsonify({
        "service": "apexforge-api",
        "frontend": "Next.js app in ../frontend (npm run dev)",
        "endpoints": sorted(
            str(rule) for rule in app.url_map.iter_rules()
            if str(rule).startswith("/api")
        ),
    })


init_db()

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", "5000")),
        debug=os.getenv("FLASK_DEBUG", "1") == "1",
    )
