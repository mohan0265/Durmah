// apps/widget/src/store.ts
import { create } from 'zustand';
import type { WidgetConfig } from '@durmah/schema';
import { AudioCapture, AudioPlayback } from './audio';

type TranscriptEntry = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
};

type ServerEvent =
  | { type: 'partial_transcript'; text: string }
  | { type: 'final_transcript'; text: string }
  | { type: 'assistant_speaking_started' }
  | { type: 'assistant_speaking_finished' }
  | { type: 'assistant_message'; text: string }
  | { type: 'error'; message: string };

interface WidgetState {
  apiBase: string | null;
  sessionId: string | null;
  transcript: TranscriptEntry[];
  isProcessing: boolean;
  isListening: boolean;
  ws: WebSocket | null;
  audioCapture: AudioCapture | null;
  audioPlayback: AudioPlayback | null;

  startSession: (config: WidgetConfig & { serverUrl?: string }) => Promise<void>;
  endSession: () => Promise<void>;

  // internal helpers
  startListening: () => void;
  stopListening: () => void;
  addToTranscript: (entry: Omit<TranscriptEntry, 'timestamp'>) => void;
}

/** Choose API base:
 *  1) serverUrl in config (if provided)
 *  2) VITE_API_BASE env (if defined and non-empty)
 *  3) same origin (window.location.origin)
 */
function resolveApiBase(config?: { serverUrl?: string }): string {
  const fromConfig = config?.serverUrl?.trim();
  if (fromConfig) return stripTrailingSlash(fromConfig);

  const envBase = (import.meta as any)?.env?.VITE_API_BASE as string | undefined;
  if (envBase && envBase.trim() && envBase.trim() !== 'https://') {
    return stripTrailingSlash(envBase.trim());
  }

  return stripTrailingSlash(window.location.origin);
}

function stripTrailingSlash(u: string) {
  return u.endsWith('/') ? u.slice(0, -1) : u;
}

function toWsOrigin(httpOrigin: string): string {
  // Convert http(s) origin to ws(s) origin reliably
  try {
    const u = new URL(httpOrigin);
    u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
    return u.origin;
  } catch {
    // Fallback – simple replace as last resort
    return httpOrigin.startsWith('https')
      ? httpOrigin.replace(/^https:/, 'wss:')
      : httpOrigin.replace(/^http:/, 'ws:');
  }
}

export const useStore = create<WidgetState>((set, get) => ({
  apiBase: null,
  sessionId: null,
  transcript: [],
  isProcessing: false,
  isListening: false,
  ws: null,
  audioCapture: null,
  audioPlayback: null,

  startSession: async (config) => {
    const apiBase = resolveApiBase(config);

    // Initialize audio systems
    const audioCapture = new AudioCapture();
    const audioPlayback = new AudioPlayback();

    const micOK = await audioCapture.initialize();
    const playbackOK = await audioPlayback.initialize();

    if (!micOK) {
      throw new Error('Failed to initialize microphone access');
    }
    if (!playbackOK) {
      // Non-fatal for now, but log it
      console.warn('[Durmah] Audio playback could not be initialized.');
    }

    set({ audioCapture, audioPlayback });

    // 1) Start session
    const startRes = await fetch(`${apiBase}/v1/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configId: config.id }),
    });

    if (!startRes.ok) {
      const text = await startRes.text().catch(() => '');
      throw new Error(
        `Failed to start session (${startRes.status}): ${text || startRes.statusText}`
      );
    }

    const { sessionId, token } = await startRes.json();

    // 2) Open WebSocket
    const wsOrigin = toWsOrigin(apiBase);
    const wsUrl = `${wsOrigin}/v1/session/stream?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      // Immediately begin listening (continuous mode)
      get().startListening();
    };

    ws.onmessage = (event) => {
      const data: ServerEvent = JSON.parse(event.data);

      switch (data.type) {
        case 'partial_transcript':
          // Optional: store live partials elsewhere if you want a live overlay
          break;

        case 'final_transcript':
          get().addToTranscript({ role: 'user', content: data.text });
          set({ isProcessing: true });
          break;

        case 'assistant_speaking_started':
          set({ isProcessing: false, isListening: false });
          break;

        case 'assistant_message':
          get().addToTranscript({ role: 'assistant', content: data.text });
          break;

        case 'assistant_speaking_finished':
          // Auto re-arm mic for the next turn
          get().startListening();
          break;

        case 'error':
          console.error('[Voice WS] error:', data.message);
          set({ isProcessing: false, isListening: false });
          break;

        default:
          // ignore unknown events
          break;
      }
    };

    ws.onclose = () => {
      set({ ws: null, isListening: false, isProcessing: false });
    };

    set({ sessionId, ws, apiBase });
  },

  endSession: async () => {
    const { ws, sessionId, apiBase, audioCapture, audioPlayback } = get();

    // Stop audio capture / playback
    audioCapture?.cleanup();
    audioPlayback?.cleanup();

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }

    if (sessionId && apiBase) {
      try {
        await fetch(`${apiBase}/v1/session/${sessionId}/end`, { method: 'POST' });
      } catch (e) {
        console.warn('[Durmah] Failed to notify server about session end:', e);
      }
    }

    set({
      sessionId: null,
      ws: null,
      transcript: [],
      isListening: false,
      isProcessing: false,
      audioCapture: null,
      audioPlayback: null,
    });
  },

  startListening: () => {
    const { ws, audioCapture } = get();

    if (ws && ws.readyState === WebSocket.OPEN && audioCapture) {
      const ok = audioCapture.startRecording((chunk, isFinal) => {
        // Convert ArrayBuffer to base64 for transmission
        const base64 = btoa(String.fromCharCode(...new Uint8Array(chunk)));

        ws.send(
          JSON.stringify({
            type: 'audio_chunk',
            audio: base64,
            isFinal,
            sequence: Date.now(), // simple monotonically increasing
          })
        );
      });

      if (ok) {
        ws.send(JSON.stringify({ type: 'start_listening' }));
        set({ isListening: true, isProcessing: false });
      }
    }
  },

  stopListening: () => {
    const { ws, audioCapture } = get();

    audioCapture?.stopRecording();

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'stop_listening' }));
      set({ isListening: false });
    }
  },

  addToTranscript: (entry) => {
    set((state) => ({
      transcript: [...state.transcript, { ...entry, timestamp: Date.now() }],
    }));
  },
}));
