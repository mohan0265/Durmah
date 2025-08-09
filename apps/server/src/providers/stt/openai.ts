import { STTProvider, STTChunk, STTPartialResult, ProviderInfo, RequestContext } from "../types";
import OpenAI from 'openai';

export class OpenAISTT implements STTProvider {
  private openai: OpenAI;
  private sessions: Map<string, any> = new Map();
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  
  info(): ProviderInfo {
    return {
      name: "openai-stt",
      version: "1.0.0",
      capabilities: ["stt:stream", "stt:punctuation"]
    };
  }
  
  async startSession(ctx: RequestContext): Promise<string> {
    const sessionId = crypto.randomUUID();
    this.sessions.set(sessionId, {
      buffer: Buffer.alloc(0),
      ctx
    });
    return sessionId;
  }
  
  async pushAudio(sessionId: string, chunk: STTChunk): Promise<STTPartialResult | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    // Accumulate audio buffer
    session.buffer = Buffer.concat([session.buffer, chunk.audio]);
    
    // Process when we have enough audio or it's final
    if (chunk.isFinal || session.buffer.length > 16000) {
      const audioFile = new File([session.buffer], 'audio.wav', { type: 'audio/wav' });
      
      const transcript = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        response_format: 'json'
      });
      
      session.buffer = Buffer.alloc(0);
      
      return {
        text: transcript.text,
        isFinal: chunk.isFinal || false,
        confidence: 0.95
      };
    }
    
    return null;
  }
  
  async endSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }
}
