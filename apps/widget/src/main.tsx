// apps/widget/src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { DurmahWidget } from "./DurmahWidget";
import "./styles.css";

// Build API base from Vite env (fallback to /v1)
export const API_BASE = "/v1";

// Minimal config compatible with your DurmahWidget props
const config = {
  id: "durmah-widget-default",
  brand: {
    name: "Durmah • Legal Eagle Buddy",
    iconUrl: "/durmah-icon.webp",
    logoUrl: "/durmah-logo.webp",
    colors: {
      primary: "#7c3aed",
      accent: "#6b21a8", 
      text: "#111827",
      bg: "#ffffff"
    }
  },
  voice: {
    provider: "elevenlabs" as const,
    voiceId: "cgSgspJ2msm6clMCkdW9",
    rate: 1.0,
    pitch: 0
  },
  ai: {
    chatModel: "gpt-4o",
    temperature: 0.2,
    maxTokens: 2048
  },
  features: {
    voiceMode: true,
    textMode: true,
    autoOpenTranscriptOnSessionEnd: true,
    saveTranscriptsByDefault: false
  },
  contentPackId: "default",
  policies: {
    piiAllowed: false,
    retainAudio: false
  },
  endpoints: {
    // Netlify function routes (you already redirect /v1/* to the function)
    health: `${API_BASE}/healthz`,
    chat: `${API_BASE}/chat`,
    transcripts: `${API_BASE}/transcripts` // optional; not used now
  }
} as any;

function App() {
  return <DurmahWidget config={config} />;
}

// (Optional) keep the health check display if your index.html has #status/#data
async function setStatus() {
  const status = document.getElementById("status");
  const data = document.getElementById("data");
  if (!status || !data) return;

  try {
    const res = await fetch(config.endpoints.health);
    status.textContent = res.ok ? "OK" : `HTTP ${res.status}`;
    const json = await res.json().catch(() => null);
    if (json) data.textContent = JSON.stringify(json, null, 2);
  } catch (e: any) {
    status.textContent = "error";
    data.textContent = String(e?.message ?? e);
  }
}
setStatus();

createRoot(document.getElementById("app")!).render(<App />);
