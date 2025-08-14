(function () {
  const script = document.currentScript;
  const widgetUrl = (script && script.dataset && script.dataset.widgetUrl) || "/";
  // Create floating button
  const btn = document.createElement("button");
  btn.textContent = "Durmah";
  Object.assign(btn.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: "2147483647",
    padding: "12px 16px",
    border: "none",
    borderRadius: "999px",
    fontWeight: "600",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    cursor: "pointer",
  });

  // Create overlay container
  const overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    background: "rgba(0,0,0,0.35)",
    zIndex: "2147483646",
    display: "none",
    alignItems: "center",
    justifyContent: "center",
  });

  // Create panel wrapper for iframe
  const panel = document.createElement("div");
  Object.assign(panel.style, {
    width: "min(420px, 95vw)",
    height: "min(680px, 90vh)",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
    background: "#000",
  });

  // Create iframe pointing to widgetUrl
  const frame = document.createElement("iframe");
  frame.src = widgetUrl;
  frame.title = "Durmah";
  frame.allow = "microphone; autoplay; clipboard-read; clipboard-write";
  Object.assign(frame.style, {
    width: "100%",
    height: "100%",
    border: "0",
  });

  // Assemble
  panel.appendChild(frame);
  overlay.appendChild(panel);
  document.body.appendChild(btn);
  document.body.appendChild(overlay);

  // Open overlay on button click
  btn.addEventListener("click", () => {
    overlay.style.display = "flex";
  });

  // Close overlay when clicking outside panel
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      overlay.style.display = "none";
    }
  });

  // Prevent close when clicking inside panel
  panel.addEventListener("click", (event) => {
    event.stopPropagation();
  });
})();
