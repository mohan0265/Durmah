// apps/widget/src/main.ts

// Define the API base URL from environment variables (Vite exposes only VITE_* to the client)
const apiBase: string =
  import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || "";

// Construct the health check endpoint URL
const healthUrl = `${apiBase}/v1/healthz`;

// Immediately Invoked Async Function Expression for running the check
(async () => {
  const status = document.getElementById("status")!;
  const data = document.getElementById("data")!;

  try {
    const res = await fetch(healthUrl);

    status.textContent = res.ok ? "OK" : `HTTP ${res.status}`;

    const json = await res.json().catch(() => null);
    if (json) {
      data.textContent = JSON.stringify(json, null, 2);
    }
  } catch (e: any) {
    status.textContent = "error";
    data.textContent = String(e?.message ?? e);
  }
})();
