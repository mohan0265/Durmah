(function () {
  const script = document.currentScript;
  const widgetUrl = (script && script.dataset && script.dataset.widgetUrl) || "/";
  const btn = document.createElement("button");
  btn.textContent = "Durmah";
  Object.assign(btn.style, {
    position: "fixed", right: "20px", bottom: "20px", zIndex: "2147483647",
    padding: "12px 16px", borderRadius: "999px", fontWeight: "600",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)", cursor: "pointer"
  });

  const overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed", inset: "0", background: "rgba(0,0,0,0.35)",
    zIndex: "2147483646", display: "none", alignItems: "center", justifyContent: "center"
  });

  const panel = document.createElement("div");
  Object.assign(panel.style, {
    width: "min(420px,95vw)", height: "min(680px,90vh)", borderRadius: "16px",
    overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.35)", background: "#000"
  });

  const frame = document.createElement("iframe");
  frame.src = widgetUrl;
  frame.title = "Durmah";
  frame.allow = "microphone; autoplay; clipboard-read; clipboard-write";
  Object.assign(frame.style, { width: "100%", height: "100%", border: "0" });

  panel.appendChild(frame);
  overlay.appendChild(panel);
  document.body.appendChild(btn);
  document.body.appendChild(overlay);

  btn.onclick = () => (overlay.style.display = "flex");
  overlay.onclick = () => (overlay.style.display = "none");
  panel.onclick = (e) => e.stopPropagation();
})();
