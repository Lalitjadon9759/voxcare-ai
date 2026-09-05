function CallStatus({
  status = "Ready",
  active = false,
  processing = false,
}) {
  const statusClass = active
    ? processing
      ? "processing"
      : "active"
    : "";

  return (
    <div className="status-wrapper">
      <div className={`status ${statusClass}`}>
        <span className="status-dot"></span>
        <span>{status}</span>
      </div>
    </div>
  );
}

export default CallStatus;