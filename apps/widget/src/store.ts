import { create } from 'zustand';
import { WidgetConfig } from '@durmah/schema';

interface WidgetState {
  sessionId: string | null;
  transcript: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
  isProcessing: boolean;
  ws: WebSocket | null;
  
  startSession: (config: WidgetConfig) => Promise<void>;
  endSession: () => Promise<void>;
  toggleListening: () => void;
  addToTranscript: (entry: any) => void;
}

export const useStore = create<WidgetState>((set, get) => ({
  sessionId: null,
  transcript: [],
  isProcessing: false,
  ws: null,
  
  startSession: async (config) => {
    const response = await fetch(`${config.serverUrl}/v1/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configId: config.id })
    });
    
    const { sessionId, token } = await response.json();
    
    const ws = new WebSocket(`${config.serverUrl.replace('http', 'ws')}/v1/session/stream`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      get().addToTranscript(data);
    };
    
    set({ sessionId, ws });
  },
  
  endSession: async () => {
    const { ws, sessionId } = get();
    
    if (ws) {
      ws.close();
    }
    
    if (sessionId) {
      await fetch(`${get().serverUrl}/v1/session/${sessionId}/end`, {
        method: 'POST'
      });
    }
    
    set({ sessionId: null, ws: null, transcript: [] });
  },
  
  toggleListening: () => {
    const { ws } = get();
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'toggle_listening' }));
    }
  },
  
  addToTranscript: (entry) => {
    set(state => ({
      transcript: [...state.transcript, {
        ...entry,
        timestamp: Date.now()
      }]
    }));
  }
}));
