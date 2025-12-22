const { AzureOpenAI } = require("openai");

const OPENAI_API_KEY_SECRET_NAME = process.env.AZURE_OPENAI_API_KEY_SECRET_NAME || "foundry-call-handling";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

async function getSecretValue(secretClient, secretName, envFallback) {
  if (!secretClient) {
    const envValue = process.env[envFallback];
    if (!envValue) {
      throw new Error(`Secret client unavailable and environment variable ${envFallback} is not set.`);
    }
    return envValue;
  }

  try {
    const secret = await secretClient.getSecret(secretName);
    if (secret?.value) {
      return secret.value;
    }
  } catch (error) {
    console.warn(`[KEY-VAULT] Failed to get ${secretName}:`, error?.message || error);
  }

  const envValue = process.env[envFallback];
  if (!envValue) {
    throw new Error(`Secret ${secretName} unavailable and environment variable ${envFallback} is not set.`);
  }
  return envValue;
}

function tryParseJsonObject(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function registerDraftingRoutes(app, secretClient) {
  app.post("/api/ai/draft-tel-note", async (req, res) => {
    try {
      const { noteObject, promptText } = req.body || {};
      if (!noteObject || typeof noteObject !== "object") {
        return res.status(400).json({
          error: "Invalid request",
          message: "noteObject must be an object",
          timestamp: new Date().toISOString(),
        });
      }

      if (typeof promptText !== "string" || promptText.trim().length === 0) {
        return res.status(400).json({
          error: "Invalid request",
          message: "promptText must be a non-empty string",
          timestamp: new Date().toISOString(),
        });
      }

      const endpoint = requireEnv("AZURE_OPENAI_ENDPOINT");
      const deployment = requireEnv("AZURE_OPENAI_DEPLOYMENT_NAME");
      const apiVersion = process.env.OPENAI_API_VERSION || "2024-10-21";
      const apiKey = await getSecretValue(secretClient, OPENAI_API_KEY_SECRET_NAME, "AZURE_OPENAI_API_KEY");

      const client = new AzureOpenAI({
        endpoint,
        apiKey,
        apiVersion,
        deployment,
      });

      const systemPrompt = [
        "You are a legal assistant at a UK law firm.",
        "Write a concise, professional follow-up email based on a telephone attendance.",
        "Return ONLY valid JSON (no markdown) with this schema:",
        "{",
        "  \"emailSubject\": string,",
        "  \"emailBody\": string,",
        "  \"polishedNote\": string,",
        "  \"updatedNoteObject\": object",
        "}",
        "Keep the tone neutral and factual. Do not invent facts not present in the attendance narrative.",
      ].join("\n");

      const userPrompt = [
        "Telephone attendance (raw prompt + structured object):",
        promptText,
        "",
        "Reminder: Return JSON only.",
      ].join("\n");

      const completion = await client.chat.completions.create({
        model: deployment,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 900,
        temperature: 0.2,
        response_format: { type: "json_object" },
      });

      const content = completion?.choices?.[0]?.message?.content ?? "";
      const parsed = tryParseJsonObject(content);

      if (!parsed) {
        return res.status(502).json({
          error: "AI response parse failure",
          message: "Model did not return valid JSON.",
          raw: content,
          timestamp: new Date().toISOString(),
        });
      }

      const payload = {
        emailSubject: typeof parsed.emailSubject === "string" ? parsed.emailSubject : "",
        emailBody: typeof parsed.emailBody === "string" ? parsed.emailBody : "",
        polishedNote: typeof parsed.polishedNote === "string" ? parsed.polishedNote : "",
        updatedNoteObject:
          parsed.updatedNoteObject && typeof parsed.updatedNoteObject === "object" ? parsed.updatedNoteObject : noteObject,
      };

      return res.json({
        ...payload,
        draftedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[AI-DRAFT-TEL-NOTE] Failed", error);
      return res.status(500).json({
        error: "Draft generation failed",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  });
}

module.exports = { registerDraftingRoutes };
