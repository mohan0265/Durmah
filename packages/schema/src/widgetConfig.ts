import { z } from "zod";

export const WidgetConfig = z.object({
  id: z.string(),
  brand: z.object({
    name: z.string(),
    logoUrl: z.string().url(),
    iconUrl: z.string().url(),
    colors: z.object({
      primary: z.string(),
      accent: z.string(),
      text: z.string(),
      bg: z.string()
    })
  }),
  voice: z.object({
    provider: z.enum(["elevenlabs", "azure"]).default("elevenlabs"),
    voiceId: z.string().default("Rachel"),
    rate: z.number().min(0.75).max(1.25).default(1),
    pitch: z.number().min(-4).max(4).default(0)
  }),
  ai: z.object({
    chatModel: z.string().default("gpt-4o"),
    temperature: z.number().min(0).max(1).default(0.2),
    maxTokens: z.number().min(512).max(8192).default(2048)
  }),
  features: z.object({
    voiceMode: z.boolean().default(true),
    textMode: z.boolean().default(true),
    autoOpenTranscriptOnSessionEnd: z.boolean().default(true),
    saveTranscriptsByDefault: z.boolean().default(false)
  }),
  contentPackId: z.string(),
  policies: z.object({
    gdprRegion: z.string().optional(),
    piiAllowed: z.boolean().default(false),
    retainAudio: z.boolean().default(false)
  })
});

export type WidgetConfig = z.infer<typeof WidgetConfig>;
