import axiosInstance from "./axiosInstance.js";

export const documentAPI = {
  getAll: () => axiosInstance.get("/api/documents"),
  upload: (formData) =>
    axiosInstance.post("/api/documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};