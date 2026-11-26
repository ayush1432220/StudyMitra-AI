import { app } from "./app.js";
import { config } from "./config/index.js";
import { logger } from "./utils/logger.js";

app.listen(config.port, () =>
  logger.info(`StudyMitra backend on http://localhost:${config.port} (AI service: ${config.aiServiceUrl})`)
);
