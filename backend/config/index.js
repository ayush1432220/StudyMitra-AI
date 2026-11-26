import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  clientOrigins: (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(","),
  aiServiceUrl: process.env.AI_SERVICE_URL || "http://127.0.0.1:8000",
  aiInternalKey: process.env.AI_INTERNAL_KEY || "",
  aiTimeoutMs: Number(process.env.AI_TIMEOUT_MS) || 150000,
  dataDir: process.env.DATA_DIR || path.join(here, "..", "data"),
};
