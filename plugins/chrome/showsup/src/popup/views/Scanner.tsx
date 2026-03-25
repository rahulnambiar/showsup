import { useState, useEffect } from "react";
import type { ExtensionSettings, ScanResult } from "../../lib/types";
import { scoreColor, scoreLabel, extractDomain } from "../../lib/api";

interface Props {
  settings:      ExtensionSettings | null;
  currentDomain: string;
  currentUrl:    string;
}

function ScoreRing({ score }: { score: number }) {
  const color  = scoreColor(score);
  const r      = 34;
  const circ   = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <svg width="88" height="88" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="44" cy="44" r={r} fill="none" stroke="#1F2937" strokeWidth="6" />
      <circle
        cx="44" cy="44" r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text
        x="44" y="44"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ transform: "rotate(90deg)", transformOrigin: "44px 44px" }}
        fill={color}
        fontSize="16"
        fontWeight="800"
        fontFamily="-apple-system, sans-serif"
      >
        {score}
      </text>
    </svg>
  );
}

export default function Scanner({ settings, currentDomain, currentUrl }: Props) {
  const [domain,  setDomain]  = useState(currentDomain);
  const [scan,    setScan]    = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    setDomain(currentDomain);
    // Load cached scan for this domain
    if (currentDomain) {
      chrome.runtime.sendMessage({ type: "GET_SCAN", domain: currentDomain })
        .then((res) => { if (res?.scan) setScan(res.scan); });
    }
  }, [currentDomain]);

  async function runScan() {
    if (!domain.trim()) { setError("Enter a domain to scan."); return; }
    if (!settings?.apiToken) { setError("Add your API token in Settings."); return; }

    setScanning(true);
    setError("");

    try {
      const res = await chrome.runtime.sendMessage({ type: "TRIGGER_SCAN", domain: domain.trim() });
      if (res?.ok && res.result) {
        setScan(res.result);
      } else {
        setError(res?.error || "Scan failed.");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setScanning(false);
    }
  }

  const platforms = scan
    ? [
        { name: "ChatGPT",    score: scan.chatgpt_score    ?? 0 },
        { name: "Claude",     score: scan.claude_score     ?? 0 },
        { name: "Gemini",     score: scan.gemini_score     ?? 0 },
        { name: "Perplexity", score: scan.perplexity_score ?? 0 },
      ].filter((p) => p.score > 0)
    : [];

  return (
    <div style={{ padding: 14 }}>

      {/* URL input */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <div style={{
            position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
            fontSize: 11, color: "#4b5563",
          }}>🔍</div>
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runScan()}
            placeholder="domain.com"
            style={{
              width:        "100%",
              background:   "#111827",
              border:       "1px solid #1F2937",
              borderRadius: 7,
              padding:      "8px 8px 8px 26px",
              color:        "#e5e7eb",
              fontSize:     13,
              outline:      "none",
            }}
          />
        </div>
        <button
          onClick={runScan}
          disabled={scanning}
          style={{
            background:   scanning ? "#1F2937" : "#10B981",
            color:        scanning ? "#6b7280" : "#fff",
            border:       "none",
            borderRadius: 7,
            padding:      "8px 14px",
            fontSize:     13,
            fontWeight:   600,
            cursor:       scanning ? "default" : "pointer",
            flexShrink:   0,
            transition:   "background 0.15s",
          }}
        >
          {scanning ? "…" : "Scan"}
        </button>
      </div>

      {error && (
        <div style={{ padding: "7px 10px", background: "#EF444422", borderRadius: 6, color: "#EF4444", fontSize: 12, marginBottom: 12 }}>
          {error}
        </div>
      )}

      {scanning && (
        <div style={{ textAlign: "center", padding: "30px 0", color: "#6b7280" }}>
          <div style={{ fontSize: 11, marginBottom: 8 }}>Testing across ChatGPT, Claude, Gemini…</div>
          <div style={{ fontSize: 11, color: "#4b5563" }}>This takes 30–90 seconds</div>
        </div>
      )}

      {!scanning && scan && (
        <>
          {/* Score hero */}
          <div style={{
            display: "flex", alignItems: "center", gap: 16,
            background: "#111827", borderRadius: 10, padding: "14px 16px", marginBottom: 12,
          }}>
            <ScoreRing score={scan.overall_score} />
            <div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 2 }}>{scan.domain}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: scoreColor(scan.overall_score) }}>
                {scoreLabel(scan.overall_score)}
              </div>
              <div style={{ fontSize: 11, color: "#4b5563", marginTop: 4 }}>
                {scan.queries_won ?? 0}/{scan.query_count ?? 0} queries won
              </div>
              {scan.scanned_at && (
                <div style={{ fontSize: 10, color: "#374151", marginTop: 3 }}>
                  {new Date(scan.scanned_at).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>

          {/* Platform scores */}
          {platforms.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              {platforms.map(({ name, score }) => {
                const c = scoreColor(score);
                return (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 68, fontSize: 11, color: "#9ca3af" }}>{name}</div>
                    <div style={{ flex: 1, height: 5, background: "#1F2937", borderRadius: 9999, overflow: "hidden" }}>
                      <div style={{ width: `${score}%`, height: "100%", background: c, borderRadius: 9999 }} />
                    </div>
                    <div style={{ width: 28, textAlign: "right", fontSize: 11, fontWeight: 600, color: c }}>{score}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Top recs */}
          {scan.recommendations && scan.recommendations.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 8 }}>
                KEY ISSUES
              </div>
              {scan.recommendations.slice(0, 3).map((r, i) => (
                <div key={i} style={{
                  display: "flex", gap: 7, padding: "6px 0",
                  borderBottom: i < 2 ? "1px solid #1F2937" : "none",
                }}>
                  <span style={{
                    fontSize: 9, padding: "2px 4px", borderRadius: 3, flexShrink: 0, marginTop: 1, fontWeight: 700,
                    background:
                      r.impact === "high"   ? "#EF444422" :
                      r.impact === "medium" ? "#F59E0B22" : "#6b728022",
                    color:
                      r.impact === "high"   ? "#EF4444" :
                      r.impact === "medium" ? "#F59E0B" : "#9ca3af",
                  }}>
                    {r.impact?.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 11, color: "#d1d5db", lineHeight: 1.4 }}>{r.title}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!scanning && !scan && !error && (
        <div style={{ textAlign: "center", padding: "20px 0", color: "#4b5563", fontSize: 12 }}>
          Enter any domain to check its AI visibility score
        </div>
      )}
    </div>
  );
}
