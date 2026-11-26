import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { Users } from "../models/User.js";
import { HttpError } from "../utils/HttpError.js";

export const signToken = (user) =>
  jwt.sign({ id: user.id }, config.jwtSecret, { expiresIn: "7d" });

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, "Not authenticated."));
  try {
    const { id } = jwt.verify(token, config.jwtSecret);
    const user = Users.find((u) => u.id === id);
    if (!user) return next(new HttpError(401, "User not found."));
    req.user = user;
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token."));
  }
}
