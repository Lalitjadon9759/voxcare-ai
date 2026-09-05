const ollama = require("ollama").default;
const { HEALTH_SYSTEM_PROMPT } = require("../prompts/health.prompt");

const AI_PROVIDER = (
  process.env.AI_PROVIDER || "ollama"
).toLowerCase();

const buildReportPrompt = (conversation) => `
Generate a structured health screening report from the
conversation between the user and VoxCare AI.

This is NOT a medical diagnosis.

Only use information explicitly provided by the user.
Never invent symptoms, duration, severity, medical history,
or any other information.

Return ONLY valid JSON.

Use exactly this structure:

{
  "patientName": "",
  "mainConcern": "",
  "symptoms": [],
  "duration": "",
  "severity": "",
  "relatedSymptoms": [],
  "importantFlags": [],
  "followUp": "",
  "missingInformation": [],
  "status": ""
}

Rules:

patientName:
The user's name if provided.

mainConcern:
The main health concern or symptom mentioned.

symptoms:
Symptoms explicitly mentioned by the user.

duration:
How long the symptoms have been present.

severity:
Severity if the user provided a number or description.

relatedSymptoms:
Other symptoms explicitly mentioned.

importantFlags:
Potentially concerning symptoms explicitly mentioned.
Do not diagnose.

followUp:
A short and safe recommendation based only on
the information provided.

missingInformation:
Important screening information that was not provided.

status:
Use "complete" if enough basic information was collected.
Use "incomplete" if the call ended before enough information
was collected.

Conversation:

${JSON.stringify(conversation, null, 2)}
`;

const generateWithOllama = async (conversation) => {
  const model =
    process.env.OLLAMA_MODEL || "llama3.2:3b";

  const response = await ollama.chat({
    model,
    messages: [
      {
        role: "system",
        content: HEALTH_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: buildReportPrompt(conversation),
      },
    ],
    format: "json",
    options: {
      temperature: 0.2,
    },
  });

  const content =
    response?.message?.content?.trim();

  if (!content) {
    throw new Error(
      "Ollama returned an empty report."
    );
  }

  return parseReport(content);
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

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: HEALTH_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: buildReportPrompt(conversation),
        },
      ],
      temperature: 0.2,
      response_format: {
        type: "json_object",
      },
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
    console.error("AI report provider error:", data);

    throw new Error(
      data?.error?.message ||
        data?.message ||
        `AI provider request failed with status ${response.status}.`
    );
  }

  const content =
    data?.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error(
      "AI provider returned an empty report."
    );
  }

  return parseReport(content);
};

const parseReport = (content) => {
  try {
    const report = JSON.parse(content);

    if (
      !report ||
      typeof report !== "object" ||
      Array.isArray(report)
    ) {
      throw new Error("Report is not a valid object.");
    }

    return report;
  } catch (error) {
    console.error(
      "❌ Invalid report JSON:",
      content
    );

    throw new Error(
      "AI provider returned invalid report JSON."
    );
  }
};

const generateHealthReport = async (conversation) => {
  if (!Array.isArray(conversation)) {
    throw new Error(
      "Conversation must be an array."
    );
  }

  try {
    if (AI_PROVIDER === "ollama") {
      console.log(
        "📋 Report provider: Ollama"
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
        "📋 Report provider: Hosted API"
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
      "❌ Health report generation error:",
      error
    );

    throw error;
  }
};

module.exports = {
  generateHealthReport,
};