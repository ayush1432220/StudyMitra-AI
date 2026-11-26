import MessageBubble from "./MessageBubble.jsx";

export default function ChatWindow({ messages }) {
  return (
    <div className="chat-messages">
      {messages.map((message, index) => (
        <MessageBubble key={message.id || index} {...message} />
      ))}
    </div>
  );
}