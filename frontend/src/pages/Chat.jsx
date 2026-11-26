import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, BookOpen, Plus, Sparkles, Paperclip } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  addMessage,
  createConversation,
  setCurrentConversation,
  setConversations,
  setConversationMessages,
  persistConversation,
  setChatLoading,
} from "../redux/slices/chatSlice.js";
import { chatAPI } from "../api/chatAPI.js";
import { Link } from "react-router-dom";

export default function Chat() {
  const dispatch = useDispatch();
  const { conversations, currentConversationId, loading } = useSelector((state) => state.chat);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  // Load saved conversations from the backend.
  useEffect(() => {
    chatAPI
      .listConversations()
      .then(({ data }) => dispatch(setConversations(data.conversations)))
      .catch(() => {});
  }, [dispatch]);

  const openConversation = async (item) => {
    dispatch(setCurrentConversation(item.id));
    setError("");
    if (item.persisted && item.messages.length === 0) {
      try {
        const { data } = await chatAPI.getConversation(item.id);
        dispatch(setConversationMessages({ id: item.id, messages: data.conversation.messages }));
      } catch {
        setError("Could not load this conversation.");
      }
    }
  };

  const conversation = useMemo(
    () => conversations.find((item) => item.id === currentConversationId),
    [conversations, currentConversationId]
  );

  const messages = conversation?.messages || [];

  // Keep the newest message in view; only this container scrolls.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, loading, error]);

  const ensureConversation = () => {
    if (currentConversationId) return currentConversationId;
    const id = crypto.randomUUID();
    dispatch(createConversation(id));
    return id;
  };

  const send = async (event) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const id = ensureConversation();
    const persisted = conversations.find((c) => c.id === id)?.persisted;

    setError("");
    dispatch(addMessage({
      conversationId: id,
      message: { id: crypto.randomUUID(), role: "user", content: text },
    }));
    setInput("");
    dispatch(setChatLoading(true));

    try {
      const { data } = await chatAPI.sendMessage({
        message: text,
        conversationId: persisted ? id : undefined,
      });
      let targetId = id;
      if (!persisted) {
        dispatch(persistConversation({ localId: id, serverId: data.conversationId, title: text.slice(0, 60) }));
        targetId = data.conversationId;
      }
      dispatch(addMessage({
        conversationId: targetId,
        message: { id: data.messageId, role: "assistant", content: data.answer, sources: data.sources },
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      dispatch(setChatLoading(false));
    }
  };

  const newChat = () => dispatch(createConversation());

  return (
    <div className="chat-page">
      <aside className="chat-history">
        <div className="chat-history-head">
          <div>
            <span className="section-kicker">CONVERSATIONS</span>
            <h2>Assistant</h2>
          </div>
          <button className="small-icon-button" onClick={newChat}><Plus size={17} /></button>
        </div>

        {conversations.length === 0 ? (
          <div className="history-empty">Your recent conversations will appear here.</div>
        ) : (
          conversations.map((item) => (
            <button
              key={item.id}
              className={`history-item ${item.id === currentConversationId ? "active" : ""}`}
              onClick={() => openConversation(item)}
            >
              <MessageSquareIcon />
              <span>{item.title}</span>
            </button>
          ))
        )}

        <div className="history-bottom">
          <Link to="/documents"><BookOpen size={16} /> Use my documents</Link>
        </div>
      </aside>

      <section className="chat-main">
        <div className="chat-titlebar">
          <div>
            <div className="online-dot"><span /> StudyMitra AI</div>
            <p>Academic reasoning assistant</p>
          </div>
          <div className="rag-status"><Sparkles size={14} /> RAG ready</div>
        </div>

        <div className="conversation" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="chat-empty">
              <div className="big-ai-mark"><Sparkles size={25} /></div>
              <h1>What are you learning today?</h1>
              <p>Ask a question or start with one of these prompts.</p>
              <div className="prompt-grid">
                {[
                  "Explain this concept simply",
                  "Summarize my notes",
                  "Create practice questions",
                  "Compare two topics",
                ].map((prompt) => (
                  <button key={prompt} onClick={() => setInput(prompt)}>{prompt}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="message-list">
              {messages.map((message) => (
                <div key={message.id} className={`message-row ${message.role === "user" ? "user-message" : "ai-message"}`}>
                  {message.role !== "user" && <div className="message-avatar">S</div>}
                  <div className="message-bubble">
                    <p style={{ whiteSpace: "pre-wrap" }}>{message.content}</p>
                    {message.sources?.length > 0 && (
                      <p className="message-sources" style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
                        Sources: {message.sources.map((s) => `[${s.id}] ${s.topic}`).join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="message-row ai-message">
                  <div className="message-avatar">S</div>
                  <div className="message-bubble"><p>Thinking…</p></div>
                </div>
              )}
            </div>
          )}
          {error && <div className="form-error" style={{ margin: "12px 20px" }}>{error}</div>}
        </div>

        <form className="composer" onSubmit={send}>
          <button type="button" className="composer-icon"><Paperclip size={18} /></button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask StudyMitra AI anything about your studies..."
          />
          <button className="send-button" type="submit" disabled={loading}><ArrowUp size={19} /></button>
        </form>
        <div className="composer-note">StudyMitra AI can make mistakes. Verify important academic information.</div>
      </section>
    </div>
  );
}

function MessageSquareIcon() {
  return <span className="history-symbol">•</span>;
}