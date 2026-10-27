import { useEffect, useState } from "react";
import type { ExtensionSettings, ScanResult } from "../lib/types";
import { extractDomain, scoreColor, scoreLabel } from "../lib/api";
import { Settings } from "./views/Settings";

const SHOWSUP_URL = "https://showsup.co";

// ── Score ring ─────────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const color = scoreColor(score);
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width={96} height={96} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={48} cy={48} r={r} fill="none" stroke="#1F2937" strokeWidth={7} />
      <circle
        cx={48} cy={48} r={r}
        fill="none"
        stroke={color}
        strokeWidth={7}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text
        x={48} y={48}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ transform: "rotate(90deg)", transformOrigin: "48px 48px" }}
        fill={color}
        fontSize={18}
        fontWeight="800"
        fontFamily="-apple-system, sans-serif"
      >
        {score}
      </text>
    </svg>
  );
}

// ── Platform bar ───────────────────────────────────────────────────────────────

function PlatformBar({ name, score }: { name: string; score: number }) {
  const color = scoreColor(score);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
      <div style={{ width: 68, fontSize: 11, color: "#9ca3af", flexShrink: 0 }}>{name}</div>
      <div style={{ flex: 1, height: 5, background: "#1F2937", borderRadius: 9999, overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 9999, transition: "width 0.5s ease" }} />
      </div>
      <div style={{ width: 28, textAlign: "right", fontSize: 11, fontWeight: 700, color }}>{score}</div>
    </div>
  );
}

// ── Main view ──────────────────────────────────────────────────────────────────

function MainView({
  domain,
  settings,
  scan,
  scanning,
  error,
  onScan,
  onOpenSettings,
  scanId,
}: {
  domain: string;
  settings: ExtensionSettings | null;
  scan: ScanResult | null;
  scanning: boolean;
  error: string;
  onScan: () => void;
  onOpenSettings: () => void;
  scanId: string | null;
}) {
  const hasToken = !!settings?.apiToken;

  const platforms = scan
    ? [
        { name: "ChatGPT",    score: scan.chatgpt_score    ?? 0 },
        { name: "Claude",     score: scan.claude_score     ?? 0 },
        { name: "Gemini",     score: scan.gemini_score     ?? 0 },
        { name: "Perplexity", score: scan.perplexity_score ?? 0 },
      ].filter((p) => p.score > 0)
    : [];

  const reportUrl = scanId
    ? `${SHOWSUP_URL}/app/scan/${scanId}`
    : `${SHOWSUP_URL}/app/dashboard`;

  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Domain pill */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#0A0E17", borderRadius: 8, padding: "7px 10px",
        border: "1px solid #1F2937",
      }}>
        <span style={{ fontSize: 12, color: "#9ca3af", fontFamily: "monospace" }}>
          {domain || "No active tab"}
        </span>
        <button
          onClick={onOpenSettings}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#4b5563", fontSize: 14, padding: 2 }}
          title="Settings"
        >
          ⚙
        </button>
      </div>

      {/* No token state */}
      {!hasToken && (
        <div style={{
          textAlign: "center", padding: "20px 12px",
          background: "#111827", borderRadius: 10, border: "1px solid #1F2937",
        }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🔑</div>
          <div style={{ fontSize: 13, color: "#e5e7eb", fontWeight: 600, marginBottom: 6 }}>Connect your ShowsUp account</div>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 14, lineHeight: 1.5 }}>
            Generate an API key in ShowsUp Settings, then paste it here.
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button
              onClick={() => chrome.tabs.create({ url: `${SHOWSUP_URL}/app/settings` })}
              style={btnSecondary}
            >
              Get API key
            </button>
            <button onClick={onOpenSettings} style={btnPrimary}>
              Enter key
            </button>
          </div>
        </div>
      )}

      {/* Scan results */}
      {hasToken && scan && !scanning && (
        <>
          {/* Score hero */}
          <div style={{
            display: "flex", alignItems: "center", gap: 14,
            background: "#111827", borderRadius: 10, padding: "14px 16px",
            border: "1px solid #1F2937",
          }}>
            <ScoreRing score={scan.overall_score} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: scoreColor(scan.overall_score), lineHeight: 1 }}>
                {scoreLabel(scan.overall_score)}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>
                AI Visibility Score
              </div>
              {scan.query_count && (
                <div style={{ fontSize: 11, color: "#4b5563", marginTop: 6 }}>
                  {scan.queries_won ?? 0}/{scan.query_count} queries won
                </div>
              )}
            </div>
          </div>

          {/* Platform breakdown */}
          {platforms.length > 0 && (
            <div style={{ background: "#111827", borderRadius: 10, padding: "12px 14px", border: "1px solid #1F2937" }}>
              <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 10 }}>
                PLATFORM BREAKDOWN
              </div>
              {platforms.map((p) => <PlatformBar key={p.name} name={p.name} score={p.score} />)}
            </div>
          )}

          {/* CTAs */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => chrome.tabs.create({ url: reportUrl })}
              style={{ ...btnPrimary, flex: 1 }}
            >
              View full report →
            </button>
            <button onClick={onScan} style={btnSecondary}>
              Re-scan
            </button>
          </div>
        </>
      )}

      {/* Scanning state */}
      {hasToken && scanning && (
        <div style={{
          textAlign: "center", padding: "28px 12px",
          background: "#111827", borderRadius: 10, border: "1px solid #1F2937",
        }}>
          <div style={{ fontSize: 11, color: "#10B981", marginBottom: 6, fontWeight: 600 }}>
            Scanning across ChatGPT, Claude, Gemini…
          </div>
          <div style={{ fontSize: 11, color: "#4b5563" }}>This takes 30–90 seconds</div>
          <div style={{
            marginTop: 14, height: 3, background: "#1F2937", borderRadius: 9999, overflow: "hidden",
          }}>
            <div style={{
              height: "100%", background: "#10B981", borderRadius: 9999,
              animation: "progress 90s linear forwards",
              width: "0%",
            }} />
          </div>
        </div>
      )}

      {/* No scan yet */}
      {hasToken && !scan && !scanning && (
        <div style={{
          textAlign: "center", padding: "24px 12px",
          background: "#111827", borderRadius: 10, border: "1px solid #1F2937",
        }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 14, lineHeight: 1.6 }}>
            No scan yet for <strong style={{ color: "#9ca3af" }}>{domain}</strong>.<br />
            Run a scan to see how visible this site is in AI.
          </div>
          <button onClick={onScan} style={btnPrimary} disabled={!domain}>
            Scan this site
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          padding: "8px 10px", background: "#EF444422", borderRadius: 8,
          color: "#EF4444", fontSize: 12, border: "1px solid #EF444433",
        }}>
          {error}
        </div>
      )}

    </div>
  );
}

// ── Root App ───────────────────────────────────────────────────────────────────

export default function App() {
  const [view,     setView]     = useState<"main" | "settings">("main");
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [domain,   setDomain]   = useState("");
  const [scan,     setScan]     = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error,    setError]    = useState("");
  const [scanId,   setScanId]   = useState<string | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    async function init() {
      const [settingsRes] = await Promise.all([
        chrome.runtime.sendMessage({ type: "GET_SETTINGS" }),
      ]);
      if (settingsRes?.settings) setSettings(settingsRes.settings);

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        const dom = extractDomain(tab.url);
        setDomain(dom);
        if (dom) {
          const cached = await chrome.runtime.sendMessage({ type: "GET_SCAN", domain: dom });
          if (cached?.scan) {
            setScan(cached.scan);
            setScanId(cached.scanId ?? null);
          }
        }
      }
      setLoading(false);
    }
    init();
  }, []);

  async function handleScan() {
    if (!domain) return;
    setScanning(true);
    setError("");
    setScan(null);
    try {
      const res = await chrome.runtime.sendMessage({ type: "TRIGGER_SCAN", domain });
      if (res?.ok && res.result) {
        setScan(res.result);
        setScanId(res.scanId ?? null);
      } else {
        setError(res?.error || "Scan failed. Check your API key.");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setScanning(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160 }}>
        <div style={{ color: "#10B981", fontSize: 12 }}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      minHeight: 200, width: 320,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: "#0A0E17", color: "#e5e7eb",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "11px 14px",
        borderBottom: "1px solid #1F2937",
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: 6, background: "#10B981",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0,
        }}>S</div>
        <span style={{ fontWeight: 700, fontSize: 14, color: "#e5e7eb", flex: 1 }}>ShowsUp</span>
        {view === "settings" && (
          <button
            onClick={() => setView("main")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: 12 }}
          >
            ← Back
          </button>
        )}
      </div>

      {/* Content */}
      {view === "main" ? (
        <MainView
          domain={domain}
          settings={settings}
          scan={scan}
          scanning={scanning}
          error={error}
          onScan={handleScan}
          onOpenSettings={() => setView("settings")}
          scanId={scanId}
        />
      ) : (
        <Settings
          settings={settings}
          onSave={(s) => {
            setSettings(s);
            chrome.runtime.sendMessage({ type: "SAVE_SETTINGS", settings: s });
            setView("main");
          }}
        />
      )}
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const btnPrimary: React.CSSProperties = {
  background: "#10B981", color: "#fff", border: "none",
  borderRadius: 8, padding: "9px 16px", fontSize: 12,
  fontWeight: 600, cursor: "pointer", transition: "background 0.15s",
};

const btnSecondary: React.CSSProperties = {
  background: "#10B98122", color: "#10B981",
  border: "1px solid #10B98144", borderRadius: 8,
  padding: "9px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
};
