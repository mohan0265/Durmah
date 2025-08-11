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

type WidgetConfigWithServer = WidgetConfig & { serverUrl: string };

interface WidgetState {
  serverUrl: string | null;
  sessionId: string | null;
  transcript: TranscriptEntry[];
  isProcessing: boolean;
  isListening: boolean;
  ws: WebSocket | null;
  audioCapture: AudioCapture | null;
  audioPlayback: AudioPlayback | null;

  startSession: (config: WidgetConfigWithServer) => Promise<void>;
  endSession: () => Promise<void>;

  // internal helpers
  startListening: () => void;
  stopListening: () => void;
  addToTranscript: (entry: Omit<TranscriptEntry, 'timestamp'>) => void;
}

export const useStore = create<WidgetState>((set, get) => ({
  serverUrl: null,
  sessionId: null,
  transcript: [],
  isProcessing: false,
  isListening: false,
  ws: null,
  audioCapture: null,
  audioPlayback: null,

  startSession: async (config) => {
    // Initialize audio systems
    const audioCapture = new AudioCapture();
    const audioPlayback = new AudioPlayback();

    const audioInitialized = await audioCapture.initialize();
    const playbackInitialized = await audioPlayback.initialize();

    if (!audioInitialized || !playbackInitialized) {
      throw new Error('Failed to initialize audio devices');
    }

    set({ audioCapture, audioPlayback });

    // 1) Start session
    const res = await fetch(`${config.serverUrl}/v1/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configId: config.id })
    });

    if (!res.ok) {
      throw new Error(`Failed to start session (${res.status})`);
    }

    const { sessionId, token } = (await res.json()) as { sessionId: string; token: string };

    // 2) Open WS
    const wsUrl = `${config.serverUrl.replace('http', 'ws')}/v1/session/stream?token=${encodeURIComponent(
      token
    )}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      // Immediately begin listening (continuous mode)
      get().startListening();
    };

    ws.onmessage = (event) => {
      const data: ServerEvent = JSON.parse(event.data);

      switch (data.type) {
        case 'partial_transcript':
          // (Optional) Render live partials elsewhere if desired
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
      }
    };

    ws.onclose = () => {
      set({ ws: null, isListening: false, isProcessing: false });
    };

    set({ sessionId, ws, serverUrl: config.serverUrl });
  },

  endSession: async () => {
    const { ws, sessionId, serverUrl, audioCapture, audioPlayback } = get();

    // Stop audio devices
    audioCapture?.cleanup();
    audioPlayback?.cleanup();

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
    if (sessionId && serverUrl) {
      await fetch(`${serverUrl}/v1/session/${encodeURIComponent(sessionId)}/end`, { method: 'POST' });
    }
    set({
      sessionId: null,
      ws: null,
      transcript: [],
      isListening: false,
      isProcessing: false,
      audioCapture: null,
      audioPlayback: null
    });
  },

  startListening: () => {
    const { ws, audioCapture } = get();

    if (ws && ws.readyState === WebSocket.OPEN && audioCapture) {
      const success = audioCapture.startRecording((chunk: ArrayBuffer, isFinal: boolean) => {
        const bytes = new Uint8Array(chunk);
        // fast base64 encoder without TextEncoder (browser safe)
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        const base64 = btoa(binary);

        ws.send(
          JSON.stringify({
            type: 'audio_chunk',
            audio: base64,
            isFinal,
            sequence: Date.now() // simple sequence
          })
        );
      });

      if (success) {
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
      transcript: [...state.transcript, { ...entry, timestamp: Date.now() }]
    }));
  }
}));
