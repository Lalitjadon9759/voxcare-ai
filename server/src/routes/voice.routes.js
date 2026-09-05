const express = require("express");

const {
  generateAIResponse,
} = require("../services/llm.service");

const {
  generateHealthReport,
} = require("../services/report.service");

const router = express.Router();

// ==========================================
// HEALTH SCREENING GREETING
// ==========================================

const getGreeting = () => {
  return "Hello! I'm your VoxCare AI health screening assistant. I'll ask you a few basic questions about how you're feeling. This is not a medical diagnosis. May I know your name?";
};

// ==========================================
// PROTECT CONVERSATION DATA
// ==========================================

const sanitizeConversation = (conversation) => {
  if (!Array.isArray(conversation)) {
    return [];
  }

  return conversation
    .filter(
      (message) =>
        message &&
        typeof message === "object" &&
        ["user", "assistant"].includes(message.role) &&
        typeof message.content === "string" &&
        message.content.trim() !== ""
    )
    .map((message) => ({
      role: message.role,
      content: message.content.trim(),
    }));
};

// ==========================================
// START CALL
// ==========================================

router.post("/start", async (req, res) => {
  try {
    console.log("");
    console.log("========================================");
    console.log("📞 Starting VoxCare AI call...");
    console.log("========================================");

    const greeting = getGreeting();

    const conversation = [
      {
        role: "assistant",
        content: greeting,
      },
    ];

    console.log("🤖 AI:", greeting);

    return res.json({
      success: true,
      aiText: greeting,
      conversation,
      audio: null,
      audioAvailable: false,
    });
  } catch (error) {
    console.error("❌ Start call error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to start the voice call.",
      error: error.message || "Unknown server error",
      code: "START_CALL_FAILED",
    });
  }
});

// ==========================================
// BACKWARD COMPATIBILITY
// /greeting
// ==========================================

router.post("/greeting", async (req, res) => {
  try {
    const greeting = getGreeting();

    const conversation = [
      {
        role: "assistant",
        content: greeting,
      },
    ];

    console.log("📞 Generating VoxCare AI greeting...");

    return res.json({
      success: true,
      aiText: greeting,
      conversation,
      audio: null,
      audioAvailable: false,
    });
  } catch (error) {
    console.error("❌ Greeting error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate greeting.",
      error: error.message || "Unknown server error",
      code: "GREETING_FAILED",
    });
  }
});

// ==========================================
// TEXT CONVERSATION
// ==========================================
//
// Browser:
// Speech → Text
//
// React sends:
//
// {
//   text: "I have chest pain",
//   conversation: []
// }
//
// Express sends the conversation to the
// configured AI provider.
//
// ==========================================

router.post("/conversation", async (req, res) => {
  try {
    console.log("");
    console.log("========================================");
    console.log("🎤 New conversation turn");
    console.log("========================================");

    const {
      text,
      conversation: clientConversation,
    } = req.body;

    // --------------------------------------
    // VALIDATE USER TEXT
    // --------------------------------------

    if (
      !text ||
      typeof text !== "string" ||
      !text.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Speech text is required.",
        code: "TEXT_REQUIRED",
      });
    }

    const userText = text.trim();

    console.log("👤 User:", userText);

    // --------------------------------------
    // SANITIZE CONVERSATION
    // --------------------------------------

    let conversation = sanitizeConversation(
      clientConversation
    );

    // --------------------------------------
    // ADD USER MESSAGE
    // --------------------------------------

    conversation.push({
      role: "user",
      content: userText,
    });

    // --------------------------------------
    // GENERATE AI RESPONSE
    // --------------------------------------

    console.log("🤖 Generating AI response...");

    const aiText = await generateAIResponse(
      conversation
    );

    if (
      !aiText ||
      typeof aiText !== "string"
    ) {
      throw new Error(
        "AI provider returned an empty response."
      );
    }

    console.log("🤖 AI:", aiText);

    // --------------------------------------
    // ADD AI MESSAGE
    // --------------------------------------

    conversation.push({
      role: "assistant",
      content: aiText,
    });

    // --------------------------------------
    // SUCCESS
    // --------------------------------------

    console.log(
      "✅ Conversation turn completed."
    );

    return res.json({
      success: true,
      empty: false,
      userText,
      aiText,
      conversation,
      audio: null,
      audioAvailable: false,
    });
  } catch (error) {
    console.error("");
    console.error("❌ Conversation error:");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to process the conversation.",
      error: error.message || "Unknown server error",
      code: "CONVERSATION_FAILED",
    });
  }
});

// ==========================================
// GENERATE HEALTH REPORT
// ==========================================

router.post("/report", async (req, res) => {
  try {
    const {
      conversation,
    } = req.body;

    if (!Array.isArray(conversation)) {
      return res.status(400).json({
        success: false,
        message: "Conversation must be an array.",
        code: "INVALID_CONVERSATION",
      });
    }

    const safeConversation =
      sanitizeConversation(conversation);

    if (!safeConversation.length) {
      return res.status(400).json({
        success: false,
        message:
          "Conversation is empty. Please complete a health screening first.",
        code: "EMPTY_CONVERSATION",
      });
    }

    console.log("");
    console.log(
      "📋 Generating health report..."
    );

    const report =
      await generateHealthReport(
        safeConversation
      );

    console.log(
      "✅ Health report generated."
    );

    return res.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error(
      "❌ Report generation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to generate health report.",
      error:
        error.message ||
        "Unknown server error",
      code:
        "REPORT_GENERATION_FAILED",
    });
  }
});

// ==========================================
// MODULE EXPORT
// ==========================================

module.exports = router;