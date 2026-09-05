import { useRef, useState } from "react";

import VoiceRecorder from "./components/VoiceRecorder";
import {
  startVoiceCall,
  sendTextForConversation,
  endVoiceCall,
} from "./services/voiceService";

function App() {
  // ==========================================
  // CALL STATE
  // ==========================================

  const [callActive, setCallActive] = useState(false);
  const [startingCall, setStartingCall] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [generatingReport, setGeneratingReport] =
    useState(false);

  // ==========================================
  // CONVERSATION
  // ==========================================

  const [conversation, setConversation] = useState([]);
  const [userText, setUserText] = useState("");

  const [aiText, setAiText] = useState(
    "Press Start Screening to begin your health conversation."
  );

  // ==========================================
  // REPORT
  // ==========================================

  const [report, setReport] = useState(null);

  // ==========================================
  // ERROR
  // ==========================================

  const [error, setError] = useState("");

  // ==========================================
  // STATUS
  // ==========================================

  const [status, setStatus] = useState("Ready");

  // ==========================================
  // SPEECH STATE
  // ==========================================

  const speechUtteranceRef = useRef(null);

  // ==========================================
  // TEXT TO SPEECH
  // ==========================================

  const speakText = (text) => {
    if (!text || !window.speechSynthesis) {
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance =
        new SpeechSynthesisUtterance(text);

      speechUtteranceRef.current = utterance;

      utterance.lang = "en-IN";
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => {
        setStatus("AI is speaking");
      };

      utterance.onend = () => {
        speechUtteranceRef.current = null;

        setStatus((currentStatus) => {
          if (
            currentStatus === "AI is speaking"
          ) {
            return "Listening";
          }

          return currentStatus;
        });
      };

      utterance.onerror = (event) => {
        speechUtteranceRef.current = null;

        // "interrupted" and "canceled" can happen
        // normally when speechSynthesis.cancel()
        // is called. They are not application errors.
        if (
          event.error === "interrupted" ||
          event.error === "canceled"
        ) {
          return;
        }

        console.error(
          "Speech synthesis error:",
          event
        );

        if (callActive) {
          setStatus("Listening");
        }
      };

      window.speechSynthesis.speak(
        utterance
      );
    } catch (error) {
      console.error(
        "Text-to-speech error:",
        error
      );

      if (callActive) {
        setStatus("Listening");
      }
    }
  };

  // ==========================================
  // STOP SPEECH
  // ==========================================

  const stopSpeech = () => {
    if (!window.speechSynthesis) {
      return;
    }

    try {
      window.speechSynthesis.cancel();
      speechUtteranceRef.current = null;
    } catch (error) {
      console.error(
        "Speech cancellation error:",
        error
      );
    }
  };

  // ==========================================
  // START CALL
  // ==========================================

  const handleStartCall = async () => {
    if (
      startingCall ||
      processing ||
      generatingReport
    ) {
      return;
    }

    try {
      setStartingCall(true);
      setError("");
      setReport(null);
      setConversation([]);
      setUserText("");
      setStatus("Starting screening");

      stopSpeech();

      const result =
        await startVoiceCall();

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Unable to start the health screening."
        );
      }

      const newConversation =
        Array.isArray(result.conversation)
          ? result.conversation
          : [];

      setConversation(
        newConversation
      );

      const greeting =
        typeof result.aiText === "string" &&
        result.aiText.trim()
          ? result.aiText.trim()
          : "Hello! How can I help you today?";

      setAiText(greeting);
      setCallActive(true);

      speakText(greeting);
    } catch (error) {
      console.error(
        "❌ Start call error:",
        error
      );

      setCallActive(false);

      const message =
        error?.message ||
        "Unable to start the health screening.";

      setError(message);
      setAiText(message);
      setStatus("Ready");
    } finally {
      setStartingCall(false);
    }
  };

  // ==========================================
  // HANDLE RECOGNIZED TEXT
  // ==========================================

  const handleAudioReady = async (
    recognizedText
  ) => {
    if (!callActive) {
      return;
    }

    if (processing) {
      return;
    }

    if (typeof recognizedText !== "string") {
      console.error(
        "❌ Invalid speech result:",
        recognizedText
      );

      setError(
        "The speech recorder returned an invalid response. Please try again."
      );

      return;
    }

    const text =
      recognizedText.trim();

    if (!text) {
      setError(
        "I couldn't hear your response. Please try again."
      );

      return;
    }

    try {
      setProcessing(true);
      setError("");
      setStatus("Processing response");

      console.log(
        "🎤 User:",
        text
      );

      const result =
        await sendTextForConversation(
          text,
          conversation
        );

      if (
        !result ||
        !result.success
      ) {
        throw new Error(
          result?.message ||
            "The AI could not process your response."
        );
      }

      setUserText(
        result.userText || text
      );

      const responseText =
        typeof result.aiText === "string"
          ? result.aiText.trim()
          : "";

      if (!responseText) {
        throw new Error(
          "The AI returned an empty response."
        );
      }

      setAiText(responseText);

      if (
        Array.isArray(
          result.conversation
        )
      ) {
        setConversation(
          result.conversation
        );
      }

      speakText(responseText);
    } catch (error) {
      console.error(
        "❌ Voice conversation error:",
        error
      );

      const message =
        error?.message ||
        "Sorry, something went wrong. Please try again.";

      setError(message);
      setAiText(message);
      setStatus("Listening");
    } finally {
      setProcessing(false);
    }
  };

  // ==========================================
  // END CALL
  // ==========================================

  const handleEndCall = async () => {
    if (
      generatingReport ||
      startingCall ||
      processing
    ) {
      return;
    }

    try {
      setCallActive(false);

      // Cancelling current speech is expected.
      // The "interrupted" browser event is ignored.
      stopSpeech();

      setGeneratingReport(true);
      setError("");
      setStatus(
        "Generating health report"
      );

      const result =
        await endVoiceCall(
          conversation
        );

      if (
        !result ||
        !result.success
      ) {
        throw new Error(
          result?.message ||
            "Unable to generate the health report."
        );
      }

      setReport(
        result.report || null
      );

      const completedMessage =
        "The screening has ended. Your health report is ready.";

      setAiText(
        completedMessage
      );

      setStatus("Screening completed");
    } catch (error) {
      console.error(
        "❌ Report generation error:",
        error
      );

      setError(
        error?.message ||
          "Unable to generate the health report."
      );

      setStatus("Report generation failed");
    } finally {
      setGeneratingReport(false);
    }
  };

  // ==========================================
  // NEW CALL
  // ==========================================

  const handleNewCall = () => {
    stopSpeech();

    setCallActive(false);
    setStartingCall(false);
    setProcessing(false);
    setGeneratingReport(false);

    setConversation([]);
    setUserText("");
    setAiText(
      "Press Start Screening to begin your health conversation."
    );

    setReport(null);
    setError("");
    setStatus("Ready");
  };

  // ==========================================
  // REPORT VALUE HELPER
  // ==========================================

  const displayValue = (
    value,
    fallback = "Not provided"
  ) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return fallback;
    }

    return value;
  };

  // ==========================================
  // STATUS CLASS
  // ==========================================

  const getStatusClass = () => {
    if (processing) {
      return "status-processing";
    }

    if (generatingReport) {
      return "status-report";
    }

    if (callActive) {
      return "status-active";
    }

    if (report) {
      return "status-complete";
    }

    return "status-ready";
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="app-shell">
      {/* ====================================== */}
      {/* HEADER */}
      {/* ====================================== */}

      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            🩺
          </div>

          <div>
            <div className="brand-name">
              VoxCare AI
            </div>

            <div className="brand-subtitle">
              Voice Health Screening
            </div>
          </div>
        </div>

        <div className="topbar-badge">
          <span className="online-dot" />
          AI Assistant
        </div>
      </header>

      {/* ====================================== */}
      {/* MAIN */}
      {/* ====================================== */}

      <main className="main-container">
        {/* HERO */}

        <section className="hero-section">
          <div className="hero-badge">
            ✨ Conversational Health Screening
          </div>

          <h1 className="hero-title">
            Your health conversation,
            <br />
            made <span>simple.</span>
          </h1>

          <p className="hero-description">
            Talk naturally with VoxCare AI to
            collect basic health information
            and receive a structured screening
            summary.
          </p>

          <div className="hero-notice">
            <span>⚕️</span>

            <span>
              Screening support only — this
              is not a medical diagnosis.
            </span>
          </div>
        </section>

        {/* STATUS */}

        <div
          className={`status-bar ${getStatusClass()}`}
        >
          <div className="status-left">
            <span className="status-dot" />

            <span>{status}</span>
          </div>

          <span className="status-label">
            {callActive
              ? "Live screening"
              : "Ready to start"}
          </span>
        </div>

        {/* ERROR */}

        {error && (
          <div className="error-banner">
            <div className="error-icon">
              !
            </div>

            <div>
              <strong>
                Something went wrong
              </strong>

              <p>{error}</p>
            </div>
          </div>
        )}

        {/* ==================================== */}
        {/* MAIN AI CARD */}
        {/* ==================================== */}

        <section className="ai-panel">
          <div className="ai-panel-header">
            <div className="ai-avatar">
              🤖
            </div>

            <div>
              <h2>VoxCare AI</h2>
              <p>
                Your conversational screening
                assistant
              </p>
            </div>
          </div>

          <div className="ai-message-box">
            <span className="quote-mark">
              "
            </span>

            <p>{aiText}</p>
          </div>

          {callActive && (
            <div className="speaking-indicator">
              <span className="pulse-dot" />
              <span>
                {processing
                  ? "Processing your response..."
                  : "Speak when you're ready"}
              </span>
            </div>
          )}
        </section>

        {/* ==================================== */}
        {/* USER RESPONSE */}
        {/* ==================================== */}

        {userText && (
          <section className="response-card">
            <div className="response-header">
              <span className="response-icon">
                🎤
              </span>

              <span>Your latest response</span>
            </div>

            <p className="response-text">
              {userText}
            </p>
          </section>
        )}

        {/* ==================================== */}
        {/* CALL CONTROL */}
        {/* ==================================== */}

        <section className="call-control">
          <div
            className={`call-orb ${
              callActive
                ? "call-orb-active"
                : ""
            }`}
          >
            <span>
              {callActive ? "🎙️" : "📞"}
            </span>
          </div>

          {!callActive ? (
            <button
              className="primary-button large-button"
              type="button"
              onClick={
                report
                  ? handleNewCall
                  : handleStartCall
              }
              disabled={
                startingCall ||
                generatingReport
              }
            >
              <span>
                {startingCall
                  ? "Starting screening..."
                  : report
                  ? "Start New Screening"
                  : "Start Health Screening"}
              </span>

              {!startingCall && (
                <span className="button-arrow">
                  →
                </span>
              )}
            </button>
          ) : (
            <>
              <div className="recorder-container">
                <VoiceRecorder
                  onAudioReady={
                    handleAudioReady
                  }
                  disabled={
                    processing ||
                    generatingReport
                  }
                />
              </div>

              <button
                className="danger-button end-call-button"
                type="button"
                onClick={
                  handleEndCall
                }
                disabled={
                  processing ||
                  generatingReport
                }
              >
                {generatingReport
                  ? "Generating Report..."
                  : "End Screening"}
              </button>
            </>
          )}

          {!callActive && !report && (
            <p className="control-hint">
              🎤 Your browser microphone will be
              used for voice input
            </p>
          )}
        </section>

        {/* ==================================== */}
        {/* CONVERSATION */}
        {/* ==================================== */}

        {conversation.length > 0 && (
          <section className="content-card">
            <div className="section-heading">
              <div>
                <span className="section-eyebrow">
                  LIVE TRANSCRIPT
                </span>

                <h2>
                  Conversation
                </h2>
              </div>

              <span className="message-count">
                {conversation.length} messages
              </span>
            </div>

            <div className="conversation-list">
              {conversation.map(
                (message, index) => {
                  const isUser =
                    message.role === "user";

                  return (
                    <div
                      key={`${message.role}-${index}`}
                      className={`conversation-item ${
                        isUser
                          ? "conversation-user"
                          : "conversation-ai"
                      }`}
                    >
                      <div className="message-avatar">
                        {isUser
                          ? "👤"
                          : "🤖"}
                      </div>

                      <div className="message-body">
                        <div className="message-role">
                          {isUser
                            ? "You"
                            : "VoxCare AI"}
                        </div>

                        <p>
                          {message.content}
                        </p>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </section>
        )}

        {/* ==================================== */}
        {/* REPORT */}
        {/* ==================================== */}

        {report && (
          <section className="report-card">
            <div className="report-top">
              <div>
                <span className="section-eyebrow">
                  SCREENING RESULT
                </span>

                <h2>
                  Health Screening Report
                </h2>

                <p>
                  Summary generated from the
                  information shared during
                  your conversation.
                </p>
              </div>

              <span className="report-status">
                {report.status ||
                  "completed"}
              </span>
            </div>

            {/* BASIC INFORMATION */}

            <div className="report-grid">
              <div className="report-item">
                <span className="report-label">
                  Patient
                </span>

                <strong>
                  {displayValue(
                    report.patientName
                  )}
                </strong>
              </div>

              <div className="report-item">
                <span className="report-label">
                  Main Concern
                </span>

                <strong>
                  {displayValue(
                    report.mainConcern
                  )}
                </strong>
              </div>

              <div className="report-item">
                <span className="report-label">
                  Duration
                </span>

                <strong>
                  {displayValue(
                    report.duration
                  )}
                </strong>
              </div>

              <div className="report-item">
                <span className="report-label">
                  Severity
                </span>

                <strong>
                  {displayValue(
                    report.severity
                  )}
                </strong>
              </div>
            </div>

            {/* SYMPTOMS */}

            <ReportSection
              title="Symptoms"
              items={report.symptoms}
              emptyText="No symptoms provided."
            />

            <ReportSection
              title="Related Symptoms"
              items={
                report.relatedSymptoms
              }
              emptyText="None reported."
            />

            <ReportSection
              title="Important Flags"
              items={
                report.importantFlags
              }
              emptyText="No specific flags reported."
            />

            {/* FOLLOW UP */}

            <div className="report-text-section">
              <h3>Follow-up</h3>

              <p>
                {displayValue(
                  report.followUp
                )}
              </p>
            </div>

            {/* MISSING INFORMATION */}

            <ReportSection
              title="Missing Information"
              items={
                report.missingInformation
              }
              emptyText="No important information is missing."
            />

            {/* DISCLAIMER */}

            <div className="report-disclaimer">
              <span>⚠️</span>

              <p>
                This report is an AI-generated
                screening summary based only on
                the conversation. It is not a
                medical diagnosis and should not
                replace professional medical
                advice.
              </p>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={handleNewCall}
            >
              Start Another Screening
            </button>
          </section>
        )}

        {/* ==================================== */}
        {/* FOOTER */}
        {/* ==================================== */}

        <footer className="footer">
          <div>
            <strong>
              VoxCare AI
            </strong>

            <span>
              Conversational health screening
            </span>
          </div>

          <span>
            For informational screening purposes
            only
          </span>
        </footer>
      </main>
    </div>
  );
}

// ==========================================
// REPORT SECTION COMPONENT
// ==========================================

function ReportSection({
  title,
  items,
  emptyText,
}) {
  return (
    <div className="report-list-section">
      <h3>{title}</h3>

      {Array.isArray(items) &&
      items.length > 0 ? (
        <ul>
          {items.map(
            (item, index) => (
              <li key={index}>
                {item}
              </li>
            )
          )}
        </ul>
      ) : (
        <p className="empty-report-text">
          {emptyText}
        </p>
      )}
    </div>
  );
}

export default App;