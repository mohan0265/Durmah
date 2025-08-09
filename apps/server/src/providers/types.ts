export type Capability =
  | "tts:stream"
  | "tts:voice-clone"
  | "tts:multilingual"
  | "stt:stream"
  | "stt:punctuation"
  | "stt:diarization"
  | "llm:functions"
  | "llm:realtime"
  | "llm:tooluse";

export interface ProviderInfo {
  name: string;
  version: string;
  capabilities: Capability[];
}

export interface TTSRequest {
  text: string;
  voiceId?: string;
  rate?: number;
  pitch?: number;
  locale?: string;
  stream?: boolean;
  metadata?: Record<string, unknown>;
}

export interface TTSStreamHandle {
  streamUrl?: string;
  nodeStream?: NodeJS.ReadableStream;
}

export interface TTSProvider {
  info(): ProviderInfo;
  speak(req: TTSRequest, ctx: RequestContext): Promise<TTSStreamHandle>;
}

export interface STTChunk {
  audio: Buffer;
  sequence: number;
  isFinal?: boolean;
}

export interface STTPartialResult {
  text: string;
  isFinal: boolean;
  confidence?: number;
}

export interface STTProvider {
  info(): ProviderInfo;
  startSession(ctx: RequestContext): Promise<string>;
  pushAudio(sessionId: string, chunk: STTChunk): Promise<STTPartialResult | null>;
  endSession(sessionId: string): Promise<void>;
}

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMRequest {
  model?: string;
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  tools?: unknown[];
  metadata?: Record<string, unknown>;
}

export interface LLMChunk {
  delta?: string;
  done?: boolean;
  toolCall?: unknown;
}

export interface LLMProvider {
  info(): ProviderInfo;
  complete(req: LLMRequest, ctx: RequestContext): AsyncIterable<LLMChunk>;
}

export interface RequestContext {
  orgId: string;
  userId?: string;
  traceId?: string;
  abortSignal?: AbortSignal;
}
