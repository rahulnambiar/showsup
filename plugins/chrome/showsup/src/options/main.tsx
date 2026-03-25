/**
 * Options page — full-page Settings view opened on first install.
 */
import { StrictMode, useEffect, useState } from "react";
import { createRoot }  from "react-dom/client";
import type { ExtensionSettings } from "../lib/types";
import Settings from "../popup/views/Settings";

function OptionsApp() {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_SETTINGS" }).then((res) => {
      if (res?.settings) setSettings(res.settings);
    });
  }, []);

  function handleSave(s: ExtensionSettings) {
    chrome.runtime.sendMessage({ type: "SAVE_SETTINGS", settings: s });
    setSettings(s);
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "#10B981",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 800, color: "#fff",
          }}>S</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#e5e7eb" }}>ShowsUp</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>AI Visibility Extension Settings</div>
          </div>
        </div>
        <p style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.6 }}>
          Add your API token and brand name to start monitoring AI visibility in ChatGPT,
          Claude, Gemini, and Perplexity — and scanning any site's AI score.
        </p>
      </div>
      <div style={{
        background: "#111827",
        border: "1px solid #1F2937",
        borderRadius: 12,
        padding: 20,
      }}>
        <Settings settings={settings} onSave={handleSave} />
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode><OptionsApp /></StrictMode>
);
