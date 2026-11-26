import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Users, publicUser } from "../models/User.js";
import { signToken } from "../middleware/auth.js";
import { HttpError } from "../utils/HttpError.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function register(req, res) {
  const { name, email, password } = req.body || {};
  if (typeof name !== "string" || !name.trim() || typeof email !== "string" || typeof password !== "string")
    throw new HttpError(400, "Name, email and password are required.");
  if (!EMAIL_RE.test(email.trim())) throw new HttpError(400, "Enter a valid email address.");
  if (password.length < 6) throw new HttpError(400, "Password must be at least 6 characters.");

  const normalized = email.trim().toLowerCase();
  if (Users.find((u) => u.email === normalized))
    throw new HttpError(409, "An account with this email already exists.");

  const user = Users.insert({
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalized,
    passwordHash: await bcrypt.hash(password, 10),
    profile: { branch: "", skills: [] },
    createdAt: new Date().toISOString(),
  });
  res.status(201).json({ success: true, user: publicUser(user), token: signToken(user) });
}

export async function login(req, res) {
  const { email, password } = req.body || {};
  if (typeof email !== "string" || typeof password !== "string" || !email || !password)
    throw new HttpError(400, "Email and password are required.");
  const user = Users.find((u) => u.email === email.trim().toLowerCase());
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    throw new HttpError(400, "Invalid email or password.");
  res.json({ success: true, user: publicUser(user), token: signToken(user) });
}

// JWTs are stateless; the client discards the token.
export const logout = (_req, res) => res.json({ success: true });

export const me = (req, res) => res.json({ success: true, user: publicUser(req.user) });
