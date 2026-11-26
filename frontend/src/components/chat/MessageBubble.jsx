export default function MessageBubble({ role, content }) {
  const isUser = role === "user";

  return (
    <div className={`message-row ${isUser ? "user-message" : "ai-message"}`}>
      {!isUser && <div className="message-avatar">S</div>}
      <div className="message-bubble">
        <p>{content}</p>
      </div>
    </div>
  );
}