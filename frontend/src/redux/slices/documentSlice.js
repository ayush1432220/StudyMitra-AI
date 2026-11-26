import { createSlice } from "@reduxjs/toolkit";

const documentSlice = createSlice({
  name: "documents",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    setDocuments: (state, action) => {
      state.items = action.payload;
    },
    addDocument: (state, action) => {
      state.items.unshift(action.payload);
    },
    removeDocument: (state, action) => {
      state.items = state.items.filter((doc) => doc.id !== action.payload);
    },
    setDocumentLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const {
  setDocuments,
  addDocument,
  removeDocument,
  setDocumentLoading,
} = documentSlice.actions;

export default documentSlice.reducer;