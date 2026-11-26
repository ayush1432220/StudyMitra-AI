import { config } from "../config/index.js";
import { HttpError } from "../utils/HttpError.js";

async function call(path, init = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), config.aiTimeoutMs);
  try {
    const res = await fetch(`${config.aiServiceUrl}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Key": config.aiInternalKey,
      },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new HttpError(502, body.error || `AI service error (${res.status}).`);
    return body;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    if (err.name === "AbortError") throw new HttpError(504, "The AI service timed out.");
    throw new HttpError(503, "The AI service is unavailable. Please try again later.");
  } finally {
    clearTimeout(timer);
  }
}

export const aiService = {
  ask: ({ question, history, profile, language }) =>
    call("/rag/query", {
      method: "POST",
      body: JSON.stringify({ question, history, profile, language }),
    }),
  health: () => call("/health"),
};
