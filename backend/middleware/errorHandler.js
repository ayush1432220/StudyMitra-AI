import { logger } from "../utils/logger.js";

export const notFound = (req, res) =>
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });

// Express error handlers must declare four parameters.
export function errorHandler(err, _req, res, _next) {
  if (err.type === "entity.parse.failed")
    return res.status(400).json({ success: false, message: "Invalid JSON body." });
  const status = err.status || 500;
  if (status >= 500) logger.error(err.stack || err);
  res.status(status).json({
    success: false,
    message: err.status ? err.message : "Internal server error.",
  });
}
