import { z } from "zod";

export const DiscoverySource = z.enum([
  "openai_blog","anthropic_blog","mistral_blog","google_ai_blog","microsoft_azure_updates",
  "aws_ai_blog","deepgram_releases","assemblyai_changelog","elevenlabs_changelog",
  "huggingface_models","github_releases","arxiv_rss","paperswithcode","lmsys_arenahard","helm"
]);

export const DiscoveryItem = z.object({
  id: z.string(),
  ts: z.string(),
  source: DiscoverySource,
  title: z.string(),
  url: z.string().url(),
  summary: z.string(),
  raw: z.any().optional()
});

export const CapabilityTag = z.enum([
  "tts:stream","tts:voice-clone","tts:multilingual","stt:stream","stt:punctuation","stt:diarization",
  "llm:functions","llm:realtime","llm:tooluse","llm:low-latency","llm:privacy-region","pricing:cheap"
]);

export const ProviderCandidate = z.object({
  id: z.string(),
  vendor: z.string(),
  category: z.enum(["tts","stt","llm","tool","infra"]),
  capabilities: z.array(CapabilityTag),
  jurisdictions: z.array(z.string()).default([]),
  pricingNote: z.string().optional(),
  latencyClaimMs: z.number().optional(),
  reliabilityClaim: z.string().optional(),
  sources: z.array(DiscoveryItem),
  fitScore: z.number().min(0).max(100),
  riskScore: z.number().min(0).max(100),
  status: z.enum(["new","under_review","poc","canary","adopted","rejected"]).default("new"),
  suggestedAdapterPath: z.string().optional(),
  suggestedConfig: z.any().optional(),
  notes: z.string().optional()
});

export type ProviderCandidate = z.infer<typeof ProviderCandidate>;
