import { create } from "zustand";

/** Local copy of the WidgetConfig shape so we don't rely on @durmah/schema */
export interface WidgetConfig {
  brand: {
    name: string;
    iconUrl: string;
    logoUrl: string;
    colors: {
      primary: string;
      accent: string;
      text: string;
      bg: string;
    };
  };
  features: {
    voiceMode: boolean;
  };
  endpoints: {
    health: string;
    chat: string;
    transcripts?: string;
  };
}

interface TranscriptEntry {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface WidgetState {
  // session-ish state
  sessionId: string | null;
  isProcessing: boolean;

  // for convenience we keep URLs here after startSession
  serverUrl: string;       // base (derived from endpoints.chat)
  chatUrl: string;         // exact chat endpoint

  // ui/logs
  transcript: TranscriptEntry[];

  // actions
  startSession: (config: WidgetConfig) => Promise<void>;
  endSession: () => Promise<void>;
  toggleListening: () => void;         // for now: prompt() to simulate voice input
  addToTranscript: (entry: Omit<TranscriptEntry, "timestamp">) => void;
}

/** Small helper to play base64 audio returned by the API */
async function playBase64Audio(base64: string, mime = "audio/mpeg") {
  const src = `data:${mime};base64,${base64}`;
  const a = new Audio(src);
  await a.play();
}

export const useStore = create<WidgetState>((set, get) => ({
  sessionId: null,
  isProcessing: false,
  serverUrl: "",
  chatUrl: "",
  transcript: [],

  startSession: async (config: WidgetConfig) => {
    // Derive base url from chat endpoint (everything before trailing "/chat")
    const chatUrl = config.endpoints.chat.replace(/\/+$/, "");
    const base = chatUrl.replace(/\/chat$/, "");
    set({ serverUrl: base, chatUrl, sessionId: crypto.randomUUID() });
    // Optional: you could ping health here if desired
  },

  endSession: async () => {
    set({ sessionId: null, transcript: [], isProcessing: false });
  },

  toggleListening: () => {
    // Minimal implementation: ask for text and send it to /v1/chat
    // (You can wire real mic streaming later.)
    const { chatUrl } = get();
    if (!chatUrl) {
      alert("Chat endpoint not ready. Did the session start?");
      return;
    }

    const promptText = window.prompt("Say/type your message to Durmah:");
    const message = (promptText || "").trim();
    if (!message) return;

    // push user line immediately
    get().addToTranscript({ role: "user", content: message });

    // send to backend
    (async () => {
      try {
        set({ isProcessing: true });

        const res = await fetch(chatUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message })
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Chat error: ${res.status} ${errText}`);
        }

        const json = await res.json();
        const replyText: string = json?.text || "(no reply text)";
        const audioBase64: string | undefined = json?.audioBase64;
        const audioMime: string | undefined = json?.audioMime;

        // add assistant text
        get().addToTranscript({ role: "assistant", content: replyText });

        // play voice if present
        if (audioBase64) {
          await playBase64Audio(audioBase64, audioMime || "audio/mpeg");
        }
      } catch (e) {
        console.error(e);
        alert("Chat failed. Check console for details.");
      } finally {
        set({ isProcessing: false });
      }
    })();
  },

  addToTranscript: (entry) =>
    set((state) => ({
      transcript: [
        ...state.transcript,
        { ...entry, timestamp: Date.now() }
      ]
    }))
}));
