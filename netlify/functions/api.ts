import type { Handler } from "@netlify/functions";

// Helper to build JSON responses consistently
const json = (status: number, body: unknown) => ({
  statusCode: status,
  headers: {
    "content-type": "application/json",
    "cache-control": "no-store",
  },
  body: JSON.stringify(body),
});

/**
 * Netlify function handler providing a minimal API surface for the Durmah widget.
 *
 * Exposes three endpoints under the `/v1` path:
 *   - GET /v1/healthz: returns a simple JSON payload containing an ok status and timestamp.
 *   - POST /v1/chat: proxy to OpenAI's chat completions API, returns the assistant's text.
 *   - POST /v1/tts: proxy to ElevenLabs text‑to‑speech API, returns an MP3 audio payload encoded as base64.
 *
 * Environment variables expected at runtime:
 *   - OPENAI_API_KEY: API key for OpenAI.
 *   - ELEVENLABS_API_KEY: API key for ElevenLabs TTS.
 *   - ELEVENLABS_VOICE_ID: ID of the ElevenLabs voice to synthesise.
 */
export const handler: Handler = async (event) => {
  try {
    const { httpMethod, path } = event;

    // Health check endpoint – returns immediately with status and current timestamp
    if (
      httpMethod === "GET" &&
      (path?.endsWith("/v1/healthz") || path?.endsWith("/healthz"))
    ) {
      return json(200, { status: "ok", timestamp: new Date().toISOString() });
    }

    // Chat endpoint – delegates to OpenAI Chat Completions API
    if (httpMethod === "POST" && path?.endsWith("/v1/chat")) {
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return json(500, { error: "OPENAI_API_KEY missing" });
      }

      // Parse incoming body; default to a hello message
      const body = event.body ? JSON.parse(event.body) : {};
      const messages = Array.isArray(body?.messages) && body.messages.length
        ? body.messages
        : [{ role: "user", content: "Hello" }];

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          authorization: `Bearer ${openaiApiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          temperature: 0.6,
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        return json(response.status, { error: "OpenAI error", details: text });
      }
      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content ?? "";
      return json(200, { text });
    }

    // Text‑to‑Speech endpoint – delegates to ElevenLabs API
    if (httpMethod === "POST" && path?.endsWith("/v1/tts")) {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      const voiceId = process.env.ELEVENLABS_VOICE_ID;
      if (!apiKey || !voiceId) {
        return json(500, { error: "ElevenLabs vars missing" });
      }
      const body = event.body ? JSON.parse(event.body) : {};
      const text: string = String(body?.text ?? "");
      if (!text) {
        return json(400, { error: "No text" });
      }

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_monolingual_v1",
            voice_settings: { stability: 0.5, similarity_boost: 0.6 },
          }),
        }
      );

      if (!response.ok) {
        const details = await response.text().catch(() => "");
        return json(response.status, { error: "ElevenLabs error", details });
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      return {
        statusCode: 200,
        headers: {
          "content-type": "audio/mpeg",
          "cache-control": "no-store",
        },
        body: buffer.toString("base64"),
        isBase64Encoded: true,
      };
    }

    // Fallback for unsupported routes
    return json(404, { error: "Not found" });
  } catch (err: any) {
    return json(500, { error: "Server error", details: err?.message || String(err) });
  }
};
