import type { Handler } from "@netlify/functions";

const json = (status: number, body: unknown) => ({
  statusCode: status,
  headers: {
    "content-type": "application/json",
    "cache-control": "no-store"
  },
  body: JSON.stringify(body)
});

export const handler: Handler = async (event) => {
  try {
    const { path, httpMethod } = event;

    // 1) Health check
    if (httpMethod === "GET" && (path?.endsWith("/v1/healthz") || path?.endsWith("/healthz"))) {
      return json(200, { status: "ok", timestamp: new Date().toISOString() });
    }

    // 2) Minimal chat endpoint (OpenAI)
    if (httpMethod === "POST" && path?.endsWith("/v1/chat")) {
      const apiKey = process.env.OPENAI_API_KEY!;
      if (!apiKey) return json(500, { error: "OPENAI_API_KEY missing" });

      const body = event.body ? JSON.parse(event.body) : {};
      const messages = body?.messages ?? [{ role: "user", content: "Hello" }];

      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "authorization": `Bearer ${apiKey}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          temperature: 0.6
        })
      });

      if (!resp.ok) {
        const t = await resp.text();
        return json(resp.status, { error: "OpenAI error", details: t });
      }
      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content ?? "";
      return json(200, { text });
    }

    // 3) Minimal TTS endpoint (ElevenLabs)
    if (httpMethod === "POST" && path?.endsWith("/v1/tts")) {
      const apiKey = process.env.ELEVENLABS_API_KEY!;
      const voiceId = process.env.ELEVENLABS_VOICE_ID!;
      if (!apiKey || !voiceId) return json(500, { error: "ElevenLabs vars missing" });

      const body = event.body ? JSON.parse(event.body) : {};
      const text = String(body?.text ?? "");
      if (!text) return json(400, { error: "No text" });

      const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: { stability: 0.5, similarity_boost: 0.6 }
        })
      });

      if (!resp.ok) {
        const t = await resp.text();
        return json(resp.status, { error: "ElevenLabs error", details: t });
      }

      const buf = Buffer.from(await resp.arrayBuffer());
      return {
        statusCode: 200,
        headers: {
          "content-type": "audio/mpeg",
          "cache-control": "no-store"
        },
        body: buf.toString("base64"),
        isBase64Encoded: true
      };
    }

    // 4) Optional STT is omitted in this fastest path (browser can use Web Speech API).
    return json(404, { error: "Not found" });
  } catch (e: any) {
    return json(500, { error: "Server error", details: e?.message || String(e) });
  }
};
