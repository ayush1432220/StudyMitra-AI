import { aiService } from "../services/aiService.js";

export async function health(_req, res) {
  let ai;
  try {
    ai = { reachable: true, ...(await aiService.health()) };
  } catch (e) {
    ai = { reachable: false, error: e.message };
  }
  res.json({ success: true, backend: "ok", ai });
}
