# backend/sarvam_client.py
import os
import requests
import time
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)
load_dotenv()

BASE_URL = os.getenv("SARVAM_BASE_URL", "https://api.sarvam.ai/v1")
API_KEY = os.getenv("SARVAM_API_KEY")

if not API_KEY:
    raise ValueError("SARVAM_API_KEY not set in environment.")

HEADERS = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def call_groq_llm(
    prompt: str,
    model: str = "llama-3.3-70b-versatile",
    temperature: float = 0.7,
    max_tokens: int = 1024,
    system_prompt: str = "You are a specialized AI Career Advisor for Indian engineering students. Provide grounded, practical, structured career guidance without chain-of-thought metadata."
) -> str:
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not set.")
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": prompt}
    ]
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens
    }
    print("=" * 60)
    print(f"🔹 Querying Groq LLM ({model})...")
    response = requests.post(url, headers=headers, json=payload, timeout=30)
    response.raise_for_status()
    data = response.json()
    content = data["choices"][0]["message"]["content"]
    print(f"✅ Groq LLM response received ({len(content)} chars)")
    return content

def _call_sarvam_api(
    prompt: str,
    model: str,
    temperature: float,
    max_tokens: int,
    system_prompt: str
) -> str:
    url = f"{BASE_URL}/chat/completions"
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": prompt}
    ]
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens
    }

    print("=" * 60)
    print("🔹 Sending request to Sarvam API")
    print(f"URL: {url}")
    print("=" * 60)

    # sarvam-105b is a reasoning model: hidden reasoning tokens count against
    # max_tokens, so a small budget can be used up before any answer is written.
    # Retry with a larger budget, retry transient errors (timeouts, 429, 5xx),
    # and never return reasoning text as the answer.
    budgets = [max(max_tokens, 8000), 14000, 14000]
    last_error = None
    for attempt, tokens in enumerate(budgets, 1):
        payload["max_tokens"] = tokens
        try:
            response = requests.post(url, headers=HEADERS, json=payload, timeout=45)
            if response.status_code == 429 or response.status_code >= 500:
                raise requests.HTTPError(f"Sarvam HTTP {response.status_code}", response=response)
            response.raise_for_status()  # other 4xx (bad key, bad model) are not retryable
            data = response.json()
            if data.get("choices"):
                content = (data["choices"][0]["message"].get("content") or "").strip()
                if content:
                    return content
            print(f"⚠️ Sarvam attempt {attempt}: no answer text (max_tokens={tokens}).")
            last_error = Exception("Sarvam returned no answer text.")
        except (requests.Timeout, requests.ConnectionError) as e:
            print(f"⚠️ Sarvam attempt {attempt}: {type(e).__name__}")
            last_error = e
        except requests.HTTPError as e:
            status = e.response.status_code if e.response is not None else None
            if status is not None and status != 429 and status < 500:
                raise
            print(f"⚠️ Sarvam attempt {attempt}: HTTP {status}")
            last_error = e
        if attempt < len(budgets):
            time.sleep(1.5 * attempt)
    raise last_error or Exception("Sarvam API returned no usable content.")

def call_asar(
    prompt: str,
    model: str = "sarvam-105b",
    temperature: float = 0.7,
    max_tokens: int = 1024,
    system_prompt: str = "You are a specialized AI Career Advisor for Indian engineering students. Provide grounded, practical, structured career guidance without chain-of-thought metadata."
) -> str:
    # Sarvam is the primary LLM for answering questions.
    try:
        print(f"✅ Using Sarvam ({model}) as primary answering model.")
        return _call_sarvam_api(prompt, model, temperature, max_tokens, system_prompt)
    except Exception as e:
        print(f"❌ Sarvam API failed: {e}. Falling back to Groq...")

    # Fallback: Groq, if configured
    if GROQ_API_KEY:
        try:
            return call_groq_llm(prompt, "llama-3.3-70b-versatile", temperature, max_tokens, system_prompt)
        except Exception as e:
            print(f"⚠️ Groq primary attempt failed: {e}. Trying secondary Groq model...")
            try:
                return call_groq_llm(prompt, "llama-3.1-8b-instant", temperature, max_tokens, system_prompt)
            except Exception as e2:
                print(f"⚠️ Groq secondary attempt failed: {e2}.")

    raise Exception("All AI generation services (Sarvam and Groq) were unreachable.")

# ---------- SARAS (STT) ----------
def speech_to_text(audio_bytes: bytes, filename: str = "audio.wav", language_code: str = "en-IN") -> str:
    url = "https://api.sarvam.ai/speech-to-text"
    headers = {"Authorization": f"Bearer {API_KEY}"}
    mime_type = "audio/webm" if filename.endswith(".webm") else "audio/wav" if filename.endswith(".wav") else "audio/mpeg"
    files = {"file": (filename, audio_bytes, mime_type)}
    data = {"model": "saarika:v2.5", "language_code": language_code}
    try:
        response = requests.post(url, headers=headers, files=files, data=data)
        if response.status_code == 200:
            res = response.json()
            return (res.get("transcript") or res.get("text") or "").strip()
        print(f"Sarvam STT API response error ({response.status_code}): {response.text}")
    except Exception as e:
        print(f"Sarvam STT exception: {e}")
    return ""

# ---------- BULBUL (TTS) ----------
def text_to_speech(text: str, voice: str = "bulbul-1") -> bytes:
    url = f"{BASE_URL}/text-to-speech"
    payload = {"text": text, "voice": voice}
    response = requests.post(url, headers=HEADERS, json=payload)
    response.raise_for_status()
    return response.content

# ---------- VISION: Document Digitization ----------
def digitize_document(file_path: str, output_format: str = "md", language: str = "en-IN") -> dict:
    url = f"{BASE_URL}/document/digitize"
    with open(file_path, 'rb') as f:
        files = {'file': (os.path.basename(file_path), f, 'application/octet-stream')}
        data = {'output_format': output_format, 'language': language}
        response = requests.post(url, headers={"Authorization": f"Bearer {API_KEY}"}, files=files, data=data)
        response.raise_for_status()
        return response.json()

def poll_job_status(job_id: str) -> dict:
    url = f"{BASE_URL}/document/digitize/{job_id}"
    response = requests.get(url, headers={"Authorization": f"Bearer {API_KEY}"})
    response.raise_for_status()
    return response.json()

def wait_for_job_completion(job_id: str, poll_interval: int = 5, timeout: int = 300) -> dict:
    start_time = time.time()
    while time.time() - start_time < timeout:
        status_response = poll_job_status(job_id)
        status = status_response.get('status')
        if status == 'completed':
            return status_response
        elif status == 'failed':
            raise Exception(f"Job failed: {status_response.get('error')}")
        time.sleep(poll_interval)
    raise TimeoutError(f"Job {job_id} did not complete within {timeout} seconds.")