const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

// ==========================================
// HELPER: PARSE SERVER RESPONSE
// ==========================================

const parseResponse = async (response) => {
  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      `Server returned an invalid response (${response.status}).`
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed with status ${response.status}.`
    );
  }

  return data;
};

// ==========================================
// HELPER: NETWORK ERROR
// ==========================================

const getNetworkError = () => {
  return new Error(
    "Unable to connect to VoxCare AI server. Please check your internet connection or try again."
  );
};

// ==========================================
// START CALL
// ==========================================

export const startVoiceCall = async () => {
  try {
    console.log("📞 Starting VoxCare AI call...");

    const response = await fetch(
      `${API_URL}/voice/start`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      }
    );

    const data =
      await parseResponse(response);

    console.log(
      "✅ Call started successfully."
    );

    return data;
  } catch (error) {
    console.error(
      "❌ Start call error:",
      error
    );

    if (
      error instanceof TypeError &&
      error.message === "Failed to fetch"
    ) {
      throw getNetworkError();
    }

    throw error;
  }
};

// ==========================================
// SEND TEXT FOR CONVERSATION
// ==========================================

export const sendTextForConversation =
  async (
    text,
    conversation = []
  ) => {
    try {
      if (
        typeof text !== "string" ||
        !text.trim()
      ) {
        throw new Error(
          "Speech text is required."
        );
      }

      console.log(
        "🎤 Sending text for processing..."
      );

      const safeConversation =
        Array.isArray(conversation)
          ? conversation
          : [];

      const response =
        await fetch(
          `${API_URL}/voice/conversation`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },
            body: JSON.stringify({
              text: text.trim(),
              conversation:
                safeConversation,
            }),
          }
        );

      const data =
        await parseResponse(response);

      console.log(
        "✅ Conversation turn processed."
      );

      return data;
    } catch (error) {
      console.error(
        "❌ Voice conversation error:",
        error
      );

      if (
        error instanceof TypeError &&
        error.message === "Failed to fetch"
      ) {
        throw getNetworkError();
      }

      throw error;
    }
  };

// ==========================================
// END CALL / GENERATE HEALTH REPORT
// ==========================================

export const endVoiceCall = async (
  conversation = []
) => {
  try {
    console.log(
      "🛑 Ending VoxCare AI call..."
    );

    const safeConversation =
      Array.isArray(conversation)
        ? conversation
        : [];

    const response =
      await fetch(
        `${API_URL}/voice/report`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Accept:
              "application/json",
          },
          body: JSON.stringify({
            conversation:
              safeConversation,
          }),
        }
      );

    const data =
      await parseResponse(response);

    console.log(
      "✅ Health report generated."
    );

    return data;
  } catch (error) {
    console.error(
      "❌ End call error:",
      error
    );

    if (
      error instanceof TypeError &&
      error.message === "Failed to fetch"
    ) {
      throw getNetworkError();
    }

    throw error;
  }
};

// ==========================================
// GENERATE HEALTH REPORT
// ==========================================

export const generateHealthReport =
  async (
    conversation = []
  ) => {
    try {
      const safeConversation =
        Array.isArray(conversation)
          ? conversation
          : [];

      const response =
        await fetch(
          `${API_URL}/voice/report`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },
            body: JSON.stringify({
              conversation:
                safeConversation,
            }),
          }
        );

      return await parseResponse(
        response
      );
    } catch (error) {
      console.error(
        "❌ Report generation error:",
        error
      );

      if (
        error instanceof TypeError &&
        error.message === "Failed to fetch"
      ) {
        throw getNetworkError();
      }

      throw error;
    }
  };