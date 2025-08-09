import { z } from "zod";

export const ProviderSelection = z.object({
  primary: z.string(),
  fallback: z.array(z.string()).default([]),
  canaryPercentage: z.number().min(0).max(100).default(0),
  canary: z.string().optional()
});

export const ProviderConfig = z.object({
  tts: ProviderSelection,
  stt: ProviderSelection,
  llm: ProviderSelection
});

export type ProviderConfig = z.infer<typeof ProviderConfig>;
