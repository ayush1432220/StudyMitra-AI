import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    conversations: [],
    currentConversationId: null,
    loading: false,
  },
  reducers: {
    addMessage: (state, action) => {
      const { conversationId, message } = action.payload;
      let conversation = state.conversations.find(
        (item) => item.id === conversationId
      );
      if (!conversation) {
        conversation = {
          id: conversationId,
          title: "New conversation",
          messages: [],
        };
        state.conversations.unshift(conversation);
      }
      conversation.messages.push(message);
    },
    createConversation: (state, action) => {
      const id = action.payload || crypto.randomUUID();
      state.conversations.unshift({
        id,
        title: "New conversation",
        messages: [],
      });
      state.currentConversationId = id;
    },
    setCurrentConversation: (state, action) => {
      state.currentConversationId = action.payload;
    },
    // Replace the list with server conversations (summaries only); keep any
    // locally-open conversation that has not been saved yet.
    setConversations: (state, action) => {
      const local = state.conversations.filter((c) => !c.persisted);
      const known = new Map(state.conversations.map((c) => [c.id, c]));
      const server = action.payload.map((c) => ({
        ...c,
        messages: known.get(c.id)?.messages || [],
        persisted: true,
      }));
      state.conversations = [...local, ...server];
    },
    setConversationMessages: (state, action) => {
      const { id, messages } = action.payload;
      const c = state.conversations.find((x) => x.id === id);
      if (c) c.messages = messages;
    },
    // After the first reply the server assigns the real conversation id.
    persistConversation: (state, action) => {
      const { localId, serverId, title } = action.payload;
      const c = state.conversations.find((x) => x.id === localId);
      if (c) {
        c.id = serverId;
        c.persisted = true;
        if (title) c.title = title;
      }
      if (state.currentConversationId === localId) state.currentConversationId = serverId;
    },
    removeConversation: (state, action) => {
      state.conversations = state.conversations.filter((c) => c.id !== action.payload);
      if (state.currentConversationId === action.payload) state.currentConversationId = null;
    },
    setChatLoading: (state, action) => {
      state.loading = action.payload;
    },
    clearChat: (state) => {
      state.conversations = [];
      state.currentConversationId = null;
    },
  },
});

export const {
  addMessage,
  createConversation,
  setCurrentConversation,
  clearChat,
  setConversations,
  setConversationMessages,
  persistConversation,
  removeConversation,
  setChatLoading,
} = chatSlice.actions;

export default chatSlice.reducer;