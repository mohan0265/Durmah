import { STTProvider, STTChunk, STTPartialResult, ProviderInfo, RequestContext } from "../types";

export class DeepgramSTT implements STTProvider {
  private apiKey: string;
  private sessions: Map<string, any> = new Map();
  
  constructor() {
    this.apiKey = process.env.DEEPGRAM_API_KEY || '';
  }
  
  info(): ProviderInfo {
    return {
      name: "deepgram-stt",
      version: "1.0.0",
      capabilities: ["stt:stream", "stt:punctuation", "stt:diarization"]
    };
  }
  
  async startSession(ctx: RequestContext): Promise<string> {
    const sessionId = crypto.randomUUID();
    
    // Initialize Deepgram WebSocket connection
    const ws = new WebSocket(
      `wss://api.deepgram.com/v1/listen?` +
      `encoding=linear16&sample_rate=16000&channels=1&` +
      `punctuate=true&interim_results=true`,
      {
        headers: {
          'Authorization': `Token ${this.apiKey}`
        }
      }
    );
    
    this.sessions.set(sessionId, { ws, buffer: Buffer.alloc(0) });
    
    return sessionId;
  }
  
  async pushAudio(sessionId: string, chunk: STTChunk): Promise<STTPartialResult | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    // Send audio to Deepgram
    if (session.ws.readyState === WebSocket.OPEN) {
      session.ws.send(chunk.audio);
    }
    
    // Handle Deepgram response
    return new Promise((resolve) => {
      session.ws.onmessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        
        if (data.channel?.alternatives?.[0]) {
          const alternative = data.channel.alternatives[0];
          resolve({
            text: alternative.transcript,
            isFinal: data.is_final || false,
            confidence: alternative.confidence || 0.9
          });
        } else {
          resolve(null);
        }
      };
      
      // Timeout if no response
      setTimeout(() => resolve(null), 1000);
    });
  }
  
  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session?.ws) {
      session.ws.close();
    }
    this.sessions.delete(sessionId);
  }
}
