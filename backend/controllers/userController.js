import { Users, publicUser } from "../models/User.js";
import { HttpError } from "../utils/HttpError.js";

export const getProfile = (req, res) => res.json({ success: true, user: publicUser(req.user) });

export function updateProfile(req, res) {
  const { name, branch, skills } = req.body || {};
  const patch = {};
  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) throw new HttpError(400, "Invalid name.");
    patch.name = name.trim();
  }
  const profile = { ...(req.user.profile || { branch: "", skills: [] }) };
  if (branch !== undefined) {
    if (typeof branch !== "string") throw new HttpError(400, "Invalid branch.");
    profile.branch = branch.trim();
  }
  if (skills !== undefined) {
    if (!Array.isArray(skills) || skills.some((s) => typeof s !== "string"))
      throw new HttpError(400, "skills must be an array of strings.");
    profile.skills = skills.map((s) => s.trim()).filter(Boolean);
  }
  patch.profile = profile;
  res.json({ success: true, user: publicUser(Users.update(req.user.id, patch)) });
}
