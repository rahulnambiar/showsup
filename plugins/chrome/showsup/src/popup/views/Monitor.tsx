import type { AIPlatform, ExtensionSettings, MonitorSession } from "../../lib/types";
import { PLATFORM_CONFIGS } from "../../lib/types";

interface Props {
  settings:       ExtensionSettings | null;
  activePlatform: AIPlatform | null;
  session:        MonitorSession | null;
  currentUrl:     string;
}

const AI_LINKS: { name: string; url: string; platform: AIPlatform }[] = [
  { name: "ChatGPT",    url: "https://chat.openai.com",        platform: "chatgpt" },
  { name: "Claude",     url: "https://claude.ai",              platform: "claude" },
  { name: "Gemini",     url: "https://gemini.google.com",      platform: "gemini" },
  { name: "Perplexity", url: "https://www.perplexity.ai",      platform: "perplexity" },
];

function sentimentColor(s: string) {
  if (s === "positive") return "#10B981";
  if (s === "negative") return "#EF4444";
  return "#9ca3af";
}

function sentimentIcon(s: string) {
  if (s === "positive") return "↑";
  if (s === "negative") return "↓";
  return "→";
}

export default function Monitor({ settings, activePlatform, session, currentUrl }: Props) {
  const brand     = settings?.brandName || "Your brand";
  const config    = activePlatform ? PLATFORM_CONFIGS[activePlatform] : null;
  const mentions  = session?.brandMentions || [];
  const responses = session?.responses || 0;
  const winRate   = responses > 0 ? Math.round((mentions.length / responses) * 100) : null;
  const compMentions = session?.competitors || [];

  function openPlatform(url: string) {
    chrome.tabs.create({ url });
  }

  function insertPrompt(platform: AIPlatform) {
    const query = settings?.brandName
      ? `Tell me about ${settings.brandName} — what are they known for and do you recommend them?`
      : "";
    if (!query) return;
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: "INSERT_PROMPT", prompt: query });
      }
    });
  }

  // ── Not on AI platform ─────────────────────────────────────────────────────

  if (!activePlatform) {
    return (
      <div style={{ padding: 14 }}>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 14, lineHeight: 1.5 }}>
          Open an AI chat platform to start monitoring brand mentions in real time.
        </div>

        <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 10 }}>
          OPEN IN NEW TAB
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {AI_LINKS.map(({ name, url, platform }) => {
            const cfg = PLATFORM_CONFIGS[platform];
            return (
              <button
                key={platform}
                onClick={() => openPlatform(url)}
                style={{
                  display:       "flex",
                  alignItems:    "center",
                  justifyContent:"space-between",
                  background:    "#111827",
                  border:        `1px solid #1F2937`,
                  borderRadius:  8,
                  padding:       "10px 12px",
                  cursor:        "pointer",
                  color:         "#e5e7eb",
                  fontSize:      13,
                  fontWeight:    500,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: cfg.color, flexShrink: 0,
                  }} />
                  <span>{name}</span>
                </div>
                <span style={{ fontSize: 11, color: "#4b5563" }}>↗</span>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 14, padding: "10px 12px", background: "#111827", borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>
            Shortcut: <kbd style={{ background: "#1F2937", padding: "1px 5px", borderRadius: 4, fontFamily: "monospace", fontSize: 11 }}>Alt+Shift+S</kbd>
          </div>
          <div style={{ fontSize: 11, color: "#4b5563" }}>
            Toggle the monitor panel while on any AI chat platform.
          </div>
        </div>
      </div>
    );
  }

  // ── On AI platform ─────────────────────────────────────────────────────────

  const platformColor = config?.color || "#10B981";

  return (
    <div style={{ padding: 14 }}>

      {/* Platform indicator */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 12px",
        background: "#111827",
        borderRadius: 8,
        marginBottom: 12,
        border: `1px solid ${platformColor}33`,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: platformColor,
          animation: "pulse 2s infinite",
          flexShrink: 0,
        }} />
        <span style={{ fontSize: 12, color: platformColor, fontWeight: 600 }}>
          Monitoring {config?.name}
        </span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#4b5563" }}>Live</span>
      </div>

      {/* Session stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[
          { label: "Responses",     value: String(responses),                 color: "#9ca3af" },
          { label: `${brand} mentions`, value: String(mentions.length),       color: mentions.length > 0 ? "#10B981" : "#6b7280" },
          { label: "Win rate",      value: winRate !== null ? `${winRate}%` : "—",
            color: winRate === null ? "#6b7280" : winRate >= 50 ? "#10B981" : winRate >= 25 ? "#F59E0B" : "#EF4444" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: "#111827", borderRadius: 8, padding: "10px 8px", textAlign: "center",
          }}>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4, lineHeight: 1.2 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Competitor mentions */}
      {compMentions.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 8 }}>
            COMPETITOR MENTIONS
          </div>
          {compMentions.map((c) => (
            <div key={c.brand} style={{
              display: "flex", justifyContent: "space-between",
              padding: "6px 0",
              borderBottom: "1px solid #1F2937",
              fontSize: 12,
            }}>
              <span style={{ color: "#d1d5db" }}>{c.brand}</span>
              <span style={{ color: "#F59E0B", fontWeight: 600 }}>{c.count}×</span>
            </div>
          ))}
        </div>
      )}

      {/* Recent brand mentions */}
      {mentions.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 8 }}>
            RECENT MENTIONS
          </div>
          {mentions.slice(-4).reverse().map((m, i) => (
            <div key={i} style={{
              padding: "7px 0",
              borderBottom: i < Math.min(3, mentions.length - 1) ? "1px solid #1F2937" : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                <span style={{ color: sentimentColor(m.sentiment), fontSize: 12, fontWeight: 700 }}>
                  {sentimentIcon(m.sentiment)}
                </span>
                <span style={{ fontSize: 11, color: sentimentColor(m.sentiment), fontWeight: 600 }}>
                  {m.sentiment}
                </span>
                <span style={{ fontSize: 10, color: "#4b5563", marginLeft: "auto" }}>
                  Response #{m.responseIndex}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.5 }}>
                "…{m.context.slice(0, 90)}…"
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No mentions yet */}
      {responses === 0 && mentions.length === 0 && (
        <div style={{ textAlign: "center", color: "#4b5563", padding: "10px 0", fontSize: 12 }}>
          Send a message to start tracking mentions
        </div>
      )}

      {/* Insert prompt CTA */}
      <button
        onClick={() => activePlatform && insertPrompt(activePlatform)}
        style={{
          width:        "100%",
          background:   "#10B981",
          color:        "#fff",
          border:       "none",
          borderRadius: 8,
          padding:      "9px 14px",
          fontSize:     13,
          fontWeight:   600,
          cursor:       "pointer",
          marginTop:    4,
        }}
      >
        Ask about {brand} →
      </button>

      <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }`}</style>
    </div>
  );
}
