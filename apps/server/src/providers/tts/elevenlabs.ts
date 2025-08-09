import { TTSProvider, TTSRequest, TTSStreamHandle, ProviderInfo, RequestContext } from "../types";

export class ElevenLabsTTS implements TTSProvider {
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || '';
  }
  
  info(): ProviderInfo {
    return {
      name: "elevenlabs",
      version: "1.0.0",
      capabilities: ["tts:stream", "tts:multilingual", "tts:voice-clone"]
    };
  }

  async speak(req: TTSRequest, ctx: RequestContext): Promise<TTSStreamHandle> {
    const voiceId = req.voiceId || process.env.ELEVENLABS_VOICE_ID || 'Rachel';
    const model = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: req.text,
        model_id: model,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0,
          use_speaker_boost: true
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`ElevenLabs TTS failed: ${response.statusText}`);
    }
    
    // Return proxy URL that the server will handle
    const streamId = crypto.randomUUID();
    return {
      streamUrl: `/api/v1/tts/stream/${streamId}`
    };
  }
}
