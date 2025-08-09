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
const ELEVEN_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "cgSgspJ2msm6clMCkdW9"; // fallback voice

async function readJson<T = any>(body: string | null): Promise<T | null> {
  if (!body) return null;
  try { return JSON.parse(body); } catch { return null; }
}

async function chatAndSpeak(req: ChatRequest) {
  const defaultVoiceId = "cgSgspJ2msm6clMCkdW9";
  let voiceId = ELEVEN_VOICE_ID;
  
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
        { 
          role: "system", 
          content: `You are Durmah, the Legal Eagle Buddy - an expert AI tutor specializing in law education. You're warm, encouraging, and highly knowledgeable about legal concepts, case law, study techniques, and student welfare.

Your personality:
- Supportive and encouraging, like the best human tutor
- Knowledgeable but approachable - explain complex legal concepts clearly
- Proactive in offering study tips and mental health support
- Use real case examples when helpful
- Keep responses conversational but informative (2-4 sentences max for voice)

Your expertise covers:
- All areas of law (contract, tort, criminal, constitutional, etc.)
- Legal research and writing techniques
- Exam preparation and study strategies
- Case briefing and legal analysis
- Student mental health and stress management
- Career guidance in law

Always be encouraging and remind students that law school is challenging but achievable with the right support.` 
        },
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
  const text: string = oaiJson.choices?.[0]?.message?.content?.trim() || "I'm here.";

  // --- 2) ElevenLabs TTS -> base64 mp3 ---
  let ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
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

  // If voice not found and we're not using the default, retry with default voice
  if (!ttsRes.ok && ttsRes.status === 422 && voiceId !== defaultVoiceId) {
    const errTxt = await ttsRes.text();
    if (errTxt.includes('voice_not_found')) {
      console.warn(`ElevenLabs: Voice ${voiceId} not found, retrying with default voice ${defaultVoiceId}`);
      voiceId = defaultVoiceId;
      
      ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
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
    }
  }

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
