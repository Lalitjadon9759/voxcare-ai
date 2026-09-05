import { useRef, useState } from "react";

function VoiceRecorder({ onAudioReady, disabled = false }) {
  const recognitionRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const startRecording = () => {
    if (disabled || isRecording) return;

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);

      alert(
        "Speech recognition is not supported in this browser. Please use Google Chrome."
      );

      return;
    }

    try {
      const recognition = new SpeechRecognition();

      recognitionRef.current = recognition;

      // Listen for one speech response at a time
      recognition.continuous = false;

      // Don't return partial results
      recognition.interimResults = false;

      // Indian English
      recognition.lang = "en-IN";

      recognition.onstart = () => {
        console.log("🎤 Speech recognition started");
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        const transcript =
          event.results?.[0]?.[0]?.transcript?.trim();

        console.log("📝 Recognized text:", transcript);

        if (transcript) {
          // IMPORTANT:
          // App.jsx expects a STRING here.
          onAudioReady(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.error(
          "❌ Speech recognition error:",
          event.error
        );

        if (event.error === "not-allowed") {
          alert(
            "Microphone permission was denied. Please allow microphone access."
          );
        } else if (event.error === "no-speech") {
          alert("No speech detected. Please try again.");
        } else if (event.error === "audio-capture") {
          alert(
            "No microphone was detected. Please check your microphone."
          );
        } else {
          alert(
            "Speech recognition failed. Please try again."
          );
        }

        setIsRecording(false);
        recognitionRef.current = null;
      };

      recognition.onend = () => {
        console.log("🎤 Speech recognition ended");

        setIsRecording(false);
        recognitionRef.current = null;
      };

      recognition.start();
    } catch (error) {
      console.error(
        "❌ Unable to start speech recognition:",
        error
      );

      setIsRecording(false);
      recognitionRef.current = null;

      alert(
        error.message ||
          "Unable to start speech recognition."
      );
    }
  };

  const stopRecording = () => {
    if (!recognitionRef.current) return;

    console.log("⏹ Stopping speech recognition...");

    recognitionRef.current.stop();
  };

  if (!isSupported) {
    return (
      <div className="recorder-wrapper">
        <p>
          Please use Google Chrome for voice conversations.
        </p>
      </div>
    );
  }

  return (
    <div className="recorder-wrapper">
      {!isRecording ? (
        <button
          type="button"
          className="primary-button"
          onClick={startRecording}
          disabled={disabled}
        >
          🎤 Start Speaking
        </button>
      ) : (
        <button
          type="button"
          className="danger-button"
          onClick={stopRecording}
        >
          ⏹ Stop Speaking
        </button>
      )}
    </div>
  );
}

export default VoiceRecorder;