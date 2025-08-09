// apps/widget/src/main.ts
import React from "react";
import { createRoot } from "react-dom/client";
import { DurmahWidget } from "./DurmahWidget";

// Build API base from Vite env (fallback to /v1)
const API_BASE = (import.meta.env.VITE_API_BASE || "/v1").replace(/\/$/, "");

// Minimal config compatible with your DurmahWidget props
const config = {
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
  features: {
    voiceMode: true
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
