import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice.js";
import chatReducer from "./slices/chatSlice.js";
import documentReducer from "./slices/documentSlice.js";
import uiReducer from "./slices/uiSlice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    documents: documentReducer,
    ui: uiReducer,
  },
});