import crypto from "crypto";
import { Conversations } from "../models/Conversation.js";
import { aiService } from "../services/aiService.js";
import { HttpError } from "../utils/HttpError.js";

const MAX_MESSAGE = 4000;

const owned = (req) => {
  const c = Conversations.find((x) => x.id === req.params.id && x.userId === req.user.id);
  if (!c) throw new HttpError(404, "Conversation not found.");
  return c;
};

export async function sendMessage(req, res) {
  const { message, conversationId, language } = req.body || {};
  if (typeof message !== "string" || !message.trim())
    throw new HttpError(400, "message is required.");
  if (message.length > MAX_MESSAGE)
    throw new HttpError(400, `message must be at most ${MAX_MESSAGE} characters.`);

  let conversation = null;
  if (conversationId) {
    conversation = Conversations.find((c) => c.id === conversationId && c.userId === req.user.id);
    if (!conversation) throw new HttpError(404, "Conversation not found.");
  }

  // Pair up previous turns for the RAG pipeline's conversation memory.
  const history = [];
  const msgs = conversation?.messages || [];
  for (let i = 0; i + 1 < msgs.length; i++) {
    if (msgs[i].role === "user" && msgs[i + 1].role === "assistant")
      history.push({ user: msgs[i].content, assistant: msgs[i + 1].content });
  }

  // Throws (502/503/504) on AI failure; nothing is stored in that case.
  const result = await aiService.ask({
    question: message.trim(),
    history: history.slice(-3),
    profile: req.user.profile,
    language: language || "en",
  });

  const now = new Date().toISOString();
  const userMsg = { id: crypto.randomUUID(), role: "user", content: message.trim(), createdAt: now };
  const aiMsg = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: result.answer,
    sources: result.citations || [],
    outOfScope: !!result.out_of_scope,
    createdAt: now,
  };

  if (conversation) {
    Conversations.update(conversation.id, {
      messages: [...conversation.messages, userMsg, aiMsg],
      updatedAt: now,
    });
  } else {
    conversation = Conversations.insert({
      id: crypto.randomUUID(),
      userId: req.user.id,
      title: message.trim().slice(0, 60),
      messages: [userMsg, aiMsg],
      createdAt: now,
      updatedAt: now,
    });
  }

  res.json({
    success: true,
    answer: result.answer,
    sources: result.citations || [],
    outOfScope: !!result.out_of_scope,
    conversationId: conversation.id,
    messageId: aiMsg.id,
  });
}

export const listConversations = (req, res) => {
  const items = Conversations.all()
    .filter((c) => c.userId === req.user.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map(({ id, title, createdAt, updatedAt }) => ({ id, title, createdAt, updatedAt }));
  res.json({ success: true, conversations: items });
};

export const getConversation = (req, res) =>
  res.json({ success: true, conversation: owned(req) });

export function deleteConversation(req, res) {
  owned(req);
  Conversations.remove(req.params.id);
  res.json({ success: true });
}
