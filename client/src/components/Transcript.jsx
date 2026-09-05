function Transcript({ conversation = [] }) {
  if (!conversation.length) {
    return (
      <div className="transcript">
        <p className="transcript-empty">
          Your conversation will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="transcript">
      {conversation.map((message, index) => (
        <div
          key={`${message.role}-${index}`}
          className={`transcript-message ${message.role}`}
        >
          <div className="message-role">
            {message.role === "assistant" ? "VoxCare AI" : "You"}
          </div>

          <div className="message-content">
            {message.content}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Transcript;