import { useEffect, useState } from "react";
import type { ExtensionSettings, ScanResult, MonitorSession, AIPlatform } from "../lib/types";
import { PLATFORM_CONFIGS } from "../lib/types";
import { extractDomain } from "../lib/api";
import Dashboard from "./views/Dashboard";
import Monitor   from "./views/Monitor";
import Scanner   from "./views/Scanner";
import Settings  from "./views/Settings";

type Tab = "dashboard" | "monitor" | "scanner" | "settings";

const AI_HOSTS = [
  "chat.openai.com", "chatgpt.com", "claude.ai",
  "gemini.google.com", "perplexity.ai", "copilot.microsoft.com",
];

function detectPlatformFromUrl(url: string): AIPlatform | null {
  try {
    const h = new URL(url).hostname;
    if (h.includes("chat.openai") || h.includes("chatgpt"))  return "chatgpt";
    if (h.includes("claude"))                                  return "claude";
    if (h.includes("gemini"))                                  return "gemini";
    if (h.includes("perplexity"))                              return "perplexity";
    if (h.includes("copilot.microsoft"))                       return "copilot";
    return null;
  } catch {
    return null;
  }
}

export default function App() {
  const [tab,          setTab]          = useState<Tab>("dashboard");
  const [settings,     setSettings]     = useState<ExtensionSettings | null>(null);
  const [currentUrl,   setCurrentUrl]   = useState("");
  const [currentDomain, setCurrentDomain] = useState("");
  const [activePlatform, setActivePlatform] = useState<AIPlatform | null>(null);
  const [monitorSession, setMonitorSession] = useState<MonitorSession | null>(null);
  const [ownScan,       setOwnScan]     = useState<ScanResult | null>(null);
  const [loading,       setLoading]     = useState(true);

  // ── Bootstrap ────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      const [settingsRes, sessionRes] = await Promise.all([
        chrome.runtime.sendMessage({ type: "GET_SETTINGS" }),
        chrome.runtime.sendMessage({ type: "GET_MONITOR_SESSION" }),
      ]);

      if (settingsRes?.settings)  setSettings(settingsRes.settings);
      if (sessionRes?.session)    setMonitorSession(sessionRes.session);

      // Get active tab
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab?.url) {
        setCurrentUrl(activeTab.url);
        const dom = extractDomain(activeTab.url);
        setCurrentDomain(dom);

        const platform = detectPlatformFromUrl(activeTab.url);
        setActivePlatform(platform);

        // Auto-switch to Monitor tab if on AI platform
        if (platform) setTab("monitor");

        // Load cached scan for current domain
        const scanRes = await chrome.runtime.sendMessage({ type: "GET_SCAN", domain: dom });
        if (scanRes?.scan) setOwnScan(scanRes.scan);
      }

      // If brand domain is set, load that scan
      const brandDomain = settingsRes?.settings?.brandDomain;
      if (brandDomain) {
        const ownRes = await chrome.runtime.sendMessage({ type: "GET_SCAN", domain: brandDomain });
        if (ownRes?.scan) setOwnScan(ownRes.scan);
      }

      setLoading(false);
    }

    load();

    // Listen for monitor updates
    const handler = (msg: any) => {
      if (msg.type === "MONITOR_UPDATE" && msg.session) {
        setMonitorSession(msg.session);
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────────

  const needsSetup = !settings?.apiToken || !settings?.brandName;

  const tabDef: { id: Tab; label: string; indicator?: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "monitor",   label: "Monitor",   indicator: activePlatform ? "●" : undefined },
    { id: "scanner",   label: "Scanner" },
    { id: "settings",  label: "Settings",  indicator: needsSetup ? "!" : undefined },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
        <div style={{ color: "#10B981", fontSize: 13 }}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 480 }}>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 14px 0",
        borderBottom: "1px solid #1F2937",
        paddingBottom: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 6,
            background: "#10B981",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 800, color: "#fff",
          }}>S</div>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#e5e7eb" }}>ShowsUp</span>
        </div>

        {/* Nav tabs */}
        <div style={{ display: "flex", gap: 2 }}>
          {tabDef.map(({ id, label, indicator }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                background:    "none",
                border:        "none",
                borderBottom:  tab === id ? "2px solid #10B981" : "2px solid transparent",
                color:         tab === id ? "#10B981" : "#9ca3af",
                cursor:        "pointer",
                padding:       "8px 10px",
                fontSize:      12,
                fontWeight:    tab === id ? 600 : 400,
                transition:    "color 0.15s",
                position:      "relative",
              }}
            >
              {label}
              {indicator && (
                <span style={{
                  position:    "absolute",
                  top:         4,
                  right:       2,
                  fontSize:    indicator === "!" ? 9 : 7,
                  color:       indicator === "!" ? "#EF4444" : "#10B981",
                  lineHeight:  1,
                }}>
                  {indicator}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {tab === "dashboard" && (
          <Dashboard
            settings={settings}
            ownScan={ownScan}
            onScanComplete={setOwnScan}
          />
        )}
        {tab === "monitor" && (
          <Monitor
            settings={settings}
            activePlatform={activePlatform}
            session={monitorSession}
            currentUrl={currentUrl}
          />
        )}
        {tab === "scanner" && (
          <Scanner
            settings={settings}
            currentDomain={currentDomain}
            currentUrl={currentUrl}
          />
        )}
        {tab === "settings" && (
          <Settings
            settings={settings}
            onSave={(s) => {
              setSettings(s);
              chrome.runtime.sendMessage({ type: "SAVE_SETTINGS", settings: s });
            }}
          />
        )}
      </div>

    </div>
  );
}
