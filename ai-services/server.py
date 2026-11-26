"""HTTP wrapper around the existing RAG pipeline (rag.py).

Only exposes the pipeline to the Node backend; contains no auth/user logic.
"""
import os
import hmac
import logging
from flask import Flask, jsonify, request
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("ai-services")

INTERNAL_KEY = os.getenv("AI_INTERNAL_KEY", "")
app = Flask(__name__)

_rag = None
def rag():
    """Import lazily so /health works even if models/keys are missing."""
    global _rag
    if _rag is None:
        import rag as module
        _rag = module
    return _rag

@app.get("/health")
def health():
    status = {"service": "ai-services", "ok": True, "rag_loaded": _rag is not None}
    try:
        status["chunks"] = rag().collection.count()
        status["rag_loaded"] = True
    except Exception as e:
        status["ok"] = False
        status["error"] = str(e)
    return jsonify(status), (200 if status["ok"] else 503)

@app.post("/rag/query")
def query():
    if not INTERNAL_KEY or not hmac.compare_digest(
        request.headers.get("X-Internal-Key", ""), INTERNAL_KEY
    ):
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json(silent=True) or {}
    question = (data.get("question") or "").strip()
    if not question:
        return jsonify({"error": "question is required"}), 400
    history = [
        {"user": h["user"], "assistant": h["assistant"]}
        for h in data.get("history", [])
        if isinstance(h, dict) and "user" in h and "assistant" in h
    ]
    try:
        result = rag().answer_question(
            question, history, data.get("profile"), None,
            language=data.get("language", "en"),
        )
    except Exception as e:
        log.exception("RAG failure")
        return jsonify({"error": f"RAG pipeline failed: {e}"}), 500
    if result.get("error"):
        # LLM provider failed: report as an error instead of a fake answer.
        return jsonify({"error": result.get("answer", "LLM generation failed.")}), 502
    return jsonify(result)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.getenv("AI_SERVICE_PORT", 8000)))
