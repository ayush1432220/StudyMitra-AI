import axiosInstance from "./axiosInstance.js";

export const authAPI = {
  login: (credentials) => axiosInstance.post("/api/auth/login", credentials),
  register: (payload) => axiosInstance.post("/api/auth/register", payload),
  getCurrentUser: () => axiosInstance.get("/api/auth/me"),
};