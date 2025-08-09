import { LLMProvider, STTProvider, TTSProvider } from "./types";

type AnyProvider = LLMProvider | STTProvider | TTSProvider;

export class ProviderRegistry {
  private tts: Record<string, TTSProvider> = {};
  private stt: Record<string, STTProvider> = {};
  private llm: Record<string, LLMProvider> = {};

  registerTTS(name: string, p: TTSProvider) {
    this.tts[name] = p;
  }
  
  registerSTT(name: string, p: STTProvider) {
    this.stt[name] = p;
  }
  
  registerLLM(name: string, p: LLMProvider) {
    this.llm[name] = p;
  }

  getTTS(name: string) {
    return this.tts[name];
  }
  
  getSTT(name: string) {
    return this.stt[name];
  }
  
  getLLM(name: string) {
    return this.llm[name];
  }
}

export const providerRegistry = new ProviderRegistry();
