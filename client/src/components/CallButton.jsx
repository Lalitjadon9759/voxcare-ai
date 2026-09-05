
function CallButton({
  active = false,
  loading = false,
  disabled = false,
  onClick,
}) {
  const getButtonText = () => {
    if (loading) {
      return active
        ? "Ending Call..."
        : "Starting Call...";
    }

    return active ? "End Call" : "Start Call";
  };

  return (
    <button
      type="button"
      className={
        active
          ? "danger-button"
          : "primary-button"
      }
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={getButtonText()}
    >
      {getButtonText()}
    </button>
  );
}

export default CallButton;

