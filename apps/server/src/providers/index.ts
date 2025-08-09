import { providerRegistry } from "./registry";
import { ElevenLabsTTS } from "./tts/elevenlabs";
import { AzureTTS } from "./tts/azure";
import { OpenAISTT } from "./stt/openai";
import { DeepgramSTT } from "./stt/deepgram";
import { OpenAILLM } from "./llm/openai";
import { MistralLLM } from "./llm/mistral";

export function initProviders() {
  // Register TTS providers
  providerRegistry.registerTTS("elevenlabs", new ElevenLabsTTS());
  providerRegistry.registerTTS("azure-tts", new AzureTTS());
  
  // Register STT providers
  providerRegistry.registerSTT("openai-stt", new OpenAISTT());
  providerRegistry.registerSTT("deepgram-stt", new DeepgramSTT());
  
  // Register LLM providers
  providerRegistry.registerLLM("openai", new OpenAILLM());
  providerRegistry.registerLLM("mistral", new MistralLLM());
}

export * from "./registry";
export * from "./types";
