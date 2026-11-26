import express from "express";
import cors from "cors";
import { config } from "./config/index.js";
import routes from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

export const app = express();
app.use(cors({ origin: config.clientOrigins, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);
