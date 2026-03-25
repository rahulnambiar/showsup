import { useState } from "react";
import type { ExtensionSettings, ScanResult } from "../../lib/types";
import { scoreColor, scoreLabel } from "../../lib/api";

interface Props {
  settings:       ExtensionSettings | null;
  ownScan:        ScanResult | null;
  onScanComplete: (s: ScanResult) => void;
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      background: "#111827", borderRadius: 8, padding: "10px 12px",
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      <div style={{ fontSize: 11, color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: color || "#e5e7eb" }}>{value}</div>
    </div>
  );
}

function PlatformBar({ name, score, max = 100 }: { name: string; score: number; max?: number }) {
  const color = scoreColor(score);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <div style={{ width: 70, fontSize: 11, color: "#9ca3af", flexShrink: 0 }}>{name}</div>
      <div style={{ flex: 1, height: 5, background: "#1F2937", borderRadius: 9999, overflow: "hidden" }}>
        <div style={{ width: `${(score / max) * 100}%`, height: "100%", background: color, borderRadius: 9999 }} />
      </div>
      <div style={{ width: 34, textAlign: "right", fontSize: 11, fontWeight: 600, color }}>{score}</div>
    </div>
  );
}

export default function Dashboard({ settings, ownScan, onScanComplete }: Props) {
  const [scanning, setScanning] = useState(false);
  const [error,    setError]    = useState("");

  const domain = settings?.brandDomain || "";

  async function runScan() {
    if (!domain) { setError("Set your brand domain in Settings first."); return; }
    if (!settings?.apiToken) { setError("Add your API token in Settings first."); return; }

    setScanning(true);
    setError("");

    try {
      const res = await chrome.runtime.sendMessage({ type: "TRIGGER_SCAN", domain });
      if (res?.ok && res.result) {
        onScanComplete(res.result);
      } else {
        setError(res?.error || "Scan failed.");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setScanning(false);
    }
  }

  const noScan    = !ownScan;
  const score     = ownScan?.overall_score ?? 0;
  const color     = scoreColor(score);
  const label     = scoreLabel(score);
  const winRate   = ownScan?.query_count
    ? Math.round(((ownScan.queries_won ?? 0) / ownScan.query_count) * 100)
    : null;
  const sov       = ownScan?.share_of_voice ?? null;
  const scannedAgo = ownScan?.scanned_at
    ? timeSince(ownScan.scanned_at)
    : null;

  const platforms = ownScan
    ? [
        { name: "ChatGPT",    score: ownScan.chatgpt_score    ?? 0 },
        { name: "Claude",     score: ownScan.claude_score     ?? 0 },
        { name: "Gemini",     score: ownScan.gemini_score     ?? 0 },
        { name: "Perplexity", score: ownScan.perplexity_score ?? 0 },
      ].filter((p) => p.score > 0)
    : [];

  return (
    <div style={{ padding: 14 }}>

      {noScan ? (
        <div style={{
          textAlign: "center", padding: "24px 0",
          color: "#6b7280", fontSize: 13,
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
          <div style={{ marginBottom: 6 }}>No scan yet</div>
          <div style={{ fontSize: 11, color: "#4b5563", marginBottom: 16 }}>
            {domain
              ? `Scan ${domain} to see AI visibility score`
              : "Set your brand domain in Settings first"}
          </div>
          {domain && (
            <button onClick={runScan} disabled={scanning} style={btnPrimary}>
              {scanning ? "Scanning…" : "Run First Scan"}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Score hero */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "#111827", borderRadius: 10, padding: "14px 16px", marginBottom: 12,
          }}>
            <div>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>
                {settings?.brandName || domain}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 44, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
                <span style={{ fontSize: 18, color: "#4b5563" }}>/100</span>
              </div>
              <div style={{ fontSize: 11, color, marginTop: 2, fontWeight: 600 }}>{label}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              {scannedAgo && (
                <div style={{ fontSize: 11, color: "#4b5563", marginBottom: 8 }}>{scannedAgo}</div>
              )}
              <button onClick={runScan} disabled={scanning} style={btnSmall}>
                {scanning ? "…" : "Re-scan"}
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <Stat
              label="Purchase Win Rate"
              value={winRate !== null ? `${winRate}%` : "—"}
              color={winRate !== null ? scoreColor(winRate) : undefined}
            />
            <Stat
              label="Share of Voice"
              value={sov !== null ? `${Math.round(sov)}%` : "—"}
              color={sov !== null ? scoreColor(sov) : undefined}
            />
          </div>

          {/* Platform breakdown */}
          {platforms.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8, fontWeight: 600, letterSpacing: "0.05em" }}>
                PLATFORM BREAKDOWN
              </div>
              {platforms.map((p) => <PlatformBar key={p.name} name={p.name} score={p.score} />)}
            </div>
          )}

          {/* Top recs */}
          {ownScan.recommendations && ownScan.recommendations.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8, fontWeight: 600, letterSpacing: "0.05em" }}>
                TOP IMPROVEMENTS
              </div>
              {ownScan.recommendations.slice(0, 3).map((rec, i) => (
                <div key={i} style={{
                  display: "flex", gap: 8, alignItems: "flex-start",
                  padding: "7px 0",
                  borderBottom: i < 2 ? "1px solid #1F2937" : "none",
                }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: "2px 5px",
                    borderRadius: 4, flexShrink: 0, marginTop: 1,
                    background:
                      rec.impact === "high"   ? "#EF444433" :
                      rec.impact === "medium" ? "#F59E0B33" : "#6b728033",
                    color:
                      rec.impact === "high"   ? "#EF4444" :
                      rec.impact === "medium" ? "#F59E0B" : "#9ca3af",
                  }}>
                    {rec.impact?.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 12, color: "#d1d5db", lineHeight: 1.4 }}>{rec.title}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {error && (
        <div style={{ marginTop: 10, padding: "8px 10px", background: "#EF444422", borderRadius: 6, color: "#EF4444", fontSize: 12 }}>
          {error}
        </div>
      )}
    </div>
  );
}

// ── Micro-styles ───────────────────────────────────────────────────────────────

const btnPrimary: React.CSSProperties = {
  background:   "#10B981",
  color:        "#fff",
  border:       "none",
  borderRadius: 7,
  padding:      "8px 18px",
  fontSize:     13,
  fontWeight:   600,
  cursor:       "pointer",
};

const btnSmall: React.CSSProperties = {
  background:   "#10B98122",
  color:        "#10B981",
  border:       "1px solid #10B98144",
  borderRadius: 6,
  padding:      "5px 10px",
  fontSize:     11,
  fontWeight:   600,
  cursor:       "pointer",
};

function timeSince(ms: number): string {
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 1)   return "just now";
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
