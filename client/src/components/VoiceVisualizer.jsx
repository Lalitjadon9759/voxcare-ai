function VoiceVisualizer({ active = false, processing = false }) {
  if (!active) {
    return (
      <div className="voice-visualizer">
        <div className="visualizer-bars">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`voice-visualizer ${
        processing ? "processing" : "recording"
      }`}
      aria-label={processing ? "Processing voice" : "Listening"}
    >
      <div className="visualizer-bars">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
}

export default VoiceVisualizer;