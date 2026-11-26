import axiosInstance from "./axiosInstance.js";

export const chatAPI = {
  // payload: { message, conversationId? }
  sendMessage: (payload) => axiosInstance.post("/api/chat", payload),
  listConversations: () => axiosInstance.get("/api/conversations"),
  getConversation: (id) => axiosInstance.get(`/api/conversations/${id}`),
  deleteConversation: (id) => axiosInstance.delete(`/api/conversations/${id}`),
};
