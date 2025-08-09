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
    const defaultVoiceId = 'cgSgspJ2msm6clMCkdW9';
    const voiceId = req.voiceId || process.env.ELEVENLABS_VOICE_ID || defaultVoiceId;
    const model = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
    
    try {
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
        const errorText = await response.text();
        
        // If voice not found and we're not already using the default, retry with default voice
        if (response.status === 422 && voiceId !== defaultVoiceId && errorText.includes('voice_not_found')) {
          console.warn(`ElevenLabs: Voice ${voiceId} not found, retrying with default voice ${defaultVoiceId}`);
          return this.speak({ ...req, voiceId: defaultVoiceId }, ctx);
        }
        
        throw new Error(`ElevenLabs TTS failed (${response.status}): ${errorText}`);
      }
      
      // Return proxy URL that the server will handle
      const streamId = crypto.randomUUID();
      return {
        streamUrl: `/api/v1/tts/stream/${streamId}`
      };
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      throw new Error(`ElevenLabs TTS failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Helper method to fetch available voices
  async getAvailableVoices(): Promise<any[]> {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Failed to fetch ElevenLabs voices:', error);
      return [];
    }
  }
}
