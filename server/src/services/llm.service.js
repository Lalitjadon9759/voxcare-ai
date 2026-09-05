const ollama = require("ollama").default;
const { HEALTH_SYSTEM_PROMPT } = require("../prompts/health.prompt");

const AI_PROVIDER = (
  process.env.AI_PROVIDER || "ollama"
).toLowerCase();

const generateWithOllama = async (conversation) => {
  const model =
    process.env.OLLAMA_MODEL || "llama3.2:3b";

  const messages = [
    {
      role: "system",
      content: HEALTH_SYSTEM_PROMPT,
    },
    ...conversation,
  ];

  const response = await ollama.chat({
    model,
    messages,
    options: {
      temperature: 0.4,
    },
  });

  const aiText =
    response?.message?.content?.trim();

  if (!aiText) {
    throw new Error(
      "Ollama returned an empty response."
    );
  }

  return aiText;
};

const generateWithAPI = async (conversation) => {
  const apiUrl = process.env.AI_API_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;

  if (!apiUrl) {
    throw new Error("AI_API_URL is not configured.");
  }

  if (!apiKey) {
    throw new Error("AI_API_KEY is not configured.");
  }

  if (!model) {
    throw new Error("AI_MODEL is not configured.");
  }

  const messages = [
    {
      role: "system",
      content: HEALTH_SYSTEM_PROMPT,
    },
    ...conversation,
  ];

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
    }),
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      `AI provider returned an invalid response (${response.status}).`
    );
  }

  if (!response.ok) {
    console.error("AI provider error:", data);

    throw new Error(
      data?.error?.message ||
        data?.message ||
        `AI provider request failed with status ${response.status}.`
    );
  }

  const aiText =
    data?.choices?.[0]?.message?.content?.trim();

  if (!aiText) {
    throw new Error(
      "AI provider returned an empty response."
    );
  }

  return aiText;
};

const generateAIResponse = async (conversation) => {
  if (!Array.isArray(conversation)) {
    throw new Error(
      "Conversation must be an array."
    );
  }

  try {
    if (AI_PROVIDER === "ollama") {
      console.log(
        "🤖 AI Provider: Ollama"
      );

      return await generateWithOllama(
        conversation
      );
    }

    if (
      AI_PROVIDER === "api" ||
      AI_PROVIDER === "hosted"
    ) {
      console.log(
        "🤖 AI Provider: Hosted API"
      );

      return await generateWithAPI(
        conversation
      );
    }

    throw new Error(
      `Unsupported AI_PROVIDER: ${AI_PROVIDER}`
    );
  } catch (error) {
    console.error(
      "❌ AI response generation error:",
      error
    );

    throw error;
  }
};

module.exports = {
  generateAIResponse,
};