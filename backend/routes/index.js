import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as auth from "../controllers/authController.js";
import * as user from "../controllers/userController.js";
import * as chat from "../controllers/chatController.js";
import { health } from "../controllers/healthController.js";

// Express 4 does not catch async errors; wrap handlers so they reach errorHandler.
const h = (fn) => (req, res, next) => {
  try {
    Promise.resolve(fn(req, res, next)).catch(next);
  } catch (e) {
    next(e);
  }
};

const r = Router();
r.get("/health", h(health));

r.post("/auth/register", h(auth.register));
r.post("/auth/login", h(auth.login));
r.post("/auth/logout", auth.logout);
r.get("/auth/me", requireAuth, auth.me);

r.get("/users/profile", requireAuth, user.getProfile);
r.put("/users/profile", requireAuth, h(user.updateProfile));

r.post("/chat", requireAuth, h(chat.sendMessage));
r.get("/conversations", requireAuth, h(chat.listConversations));
r.get("/conversations/:id", requireAuth, h(chat.getConversation));
r.delete("/conversations/:id", requireAuth, h(chat.deleteConversation));

// Placeholder until document upload is built.
r.get("/documents", requireAuth, (_req, res) => res.json([]));

export default r;
