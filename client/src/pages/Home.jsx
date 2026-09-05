import { useState } from "react";
import VoiceRecorder from "./VoiceRecorder";

function Home({ onConversationComplete }) {
  const [recording, setRecording] = useState(false);

  const handleAudioReady = async (audioBlob) => {
    if (onConversationComplete) {
      await onConversationComplete(audioBlob);
    }
  };

  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-badge">VoxCare AI</span>

          <h1>Your Voice, Your Health, Your Care</h1>

          <p>
            Talk naturally with VoxCare AI and share your health concerns
            through a simple voice conversation.
          </p>

          <VoiceRecorder
            onAudioReady={handleAudioReady}
            recording={recording}
            setRecording={setRecording}
          />
        </div>
      </section>
    </main>
  );
}

export default Home;