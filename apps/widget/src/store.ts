import { create } from "zustand";

import { WidgetConfig as SchemaWidgetConfig } from '@durmah/schema';

/** Extended config that includes runtime endpoints */
export interface WidgetConfig extends SchemaWidgetConfig {
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
    // Enhanced voice interaction with better UX
    const { chatUrl, isProcessing } = get();
    if (!chatUrl) {
      alert("Chat endpoint not ready. Please start a session first.");
      return;
    }

    if (isProcessing) {
      return; // Don't allow new requests while processing
    }

    // Show a more professional input dialog
    const message = window.prompt(
      "💬 Speak with your Legal Eagle Buddy\n\n" +
      "Ask about:\n" +
      "• Legal concepts and definitions\n" +
      "• Case law and precedents\n" +
      "• Study techniques and exam prep\n" +
      "• Assignment help and research guidance\n\n" +
      "What would you like to discuss?"
    );

    const trimmedMessage = (message || "").trim();
    if (!trimmedMessage) return;

    // Add user message with timestamp
    get().addToTranscript({ 
      role: "user", 
      content: trimmedMessage 
    });

    // Send to backend with enhanced error handling
    (async () => {
      try {
        set({ isProcessing: true });

        const res = await fetch(chatUrl, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-Session-ID": get().sessionId || "anonymous"
          },
          body: JSON.stringify({ 
            message: trimmedMessage,
            context: "legal_tutor",
            history: get().transcript.slice(-6) // Send last 3 exchanges for context
          })
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Chat error: ${res.status} ${errText}`);
        }

        const json = await res.json();
        const replyText: string = json?.text || "I'm here to help with your legal studies. Could you please rephrase your question?";
        const audioBase64: string | undefined = json?.audioBase64;
        const audioMime: string | undefined = json?.audioMime;

        // Add assistant response
        get().addToTranscript({ 
          role: "assistant", 
          content: replyText 
        });

        // Play voice with error handling
        if (audioBase64) {
          try {
            await playBase64Audio(audioBase64, audioMime || "audio/mpeg");
          } catch (audioError) {
            console.warn('Audio playback failed:', audioError);
            // Continue without audio - don't show error to user
          }
        }

      } catch (e) {
        console.error('Chat error:', e);
        let errorMessage = "I'm having trouble connecting right now. Please try again in a moment.";
        
        if (e instanceof Error) {
          if (e.message.includes('voice_not_found')) {
            errorMessage = "Voice service temporarily unavailable, but I can still help you with text responses.";
          } else if (e.message.includes('OpenAI')) {
            errorMessage = "AI service is temporarily busy. Please try again in a few seconds.";
          } else if (e.message.includes('ElevenLabs')) {
            errorMessage = "Voice synthesis temporarily unavailable, but I can still provide text responses.";
          } else if (e.message.includes('Network')) {
            errorMessage = "Network connection issue. Please check your internet and try again.";
          }
        }
        
        get().addToTranscript({ 
          role: "assistant", 
          content: `⚠️ ${errorMessage}` 
        });
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
