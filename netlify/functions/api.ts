// netlify/functions/api.ts
// Minimal router + Chat (OpenAI) + TTS (ElevenLabs) + Health

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "*"
};

type ChatRequest = {
  message: string;
  history?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
};

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const ELEVEN_API_KEY = process.env.ELEVENLABS_API_KEY!;
const ELEVEN_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "Rachel"; // fallback voice

async function readJson<T = any>(body: string | null): Promise<T | null> {
  if (!body) return null;
  try { return JSON.parse(body); } catch { return null; }
}

async function chatAndSpeak(req: ChatRequest) {
  // --- 1) Ask OpenAI (short, friendly, natural) ---
  const oaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are Durmah, a warm, concise, encouraging voice mentor for law students. Keep replies brief and conversational." },
        ...(req.history ?? []),
        { role: "user", content: req.message }
      ],
      temperature: 0.6,
      max_tokens: 250
    })
  });

  if (!oaiRes.ok) {
    const errTxt = await oaiRes.text();
    throw new Error(`OpenAI error: ${oaiRes.status} ${errTxt}`);
  }

  const oaiJson = await oaiRes.json();
  const text: string = oaiJson.choices?.[0]?.message?.content?.trim() || "I’m here.";

  // --- 2) ElevenLabs TTS -> base64 mp3 ---
  const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE_ID}`, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVEN_API_KEY,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg"
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.8 }
    })
  });

  if (!ttsRes.ok) {
    const errTxt = await ttsRes.text();
    throw new Error(`ElevenLabs error: ${ttsRes.status} ${errTxt}`);
  }

  const audioArrayBuffer = await ttsRes.arrayBuffer();
  const audioBase64 = Buffer.from(audioArrayBuffer).toString("base64");

  return { text, audioBase64, audioMime: "audio/mpeg" };
}

export const handler = async (event: any) => {
  // CORS
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  const path = event.path || "";

  // Health
  if (path.includes("/v1/healthz")) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", ...CORS },
      body: JSON.stringify({ ok: true, service: "durmah-api", path, ts: new Date().toISOString() })
    };
  }

  // Chat + TTS
  if (path.endsWith("/v1/chat") && event.httpMethod === "POST") {
    try {
      const payload = await readJson<ChatRequest>(event.body);
      if (!payload?.message) {
        return { statusCode: 400, headers: CORS, body: "Missing { message }" };
      }
      const result = await chatAndSpeak(payload);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", ...CORS },
        body: JSON.stringify(result)
      };
    } catch (e: any) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json", ...CORS },
        body: JSON.stringify({ error: e?.message || "Server error" })
      };
    }
  }

  // 404
  return {
    statusCode: 404,
    headers: { "Content-Type": "application/json", ...CORS },
    body: JSON.stringify({ error: "Not found", path })
  };
};
