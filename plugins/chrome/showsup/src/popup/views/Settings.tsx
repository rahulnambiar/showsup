import { useState } from "react";
import type { ExtensionSettings } from "../../lib/types";

interface Props {
  settings: ExtensionSettings | null;
  onSave:   (s: ExtensionSettings) => void;
}

function Field({
  label, value, onChange, type = "text", placeholder, hint,
}: {
  label:       string;
  value:       string;
  onChange:    (v: string) => void;
  type?:       string;
  placeholder?: string;
  hint?:       string;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, color: "#9ca3af", marginBottom: 5, fontWeight: 600 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width:        "100%",
          background:   "#111827",
          border:       "1px solid #1F2937",
          borderRadius: 7,
          padding:      "8px 10px",
          color:        "#e5e7eb",
          fontSize:     13,
          outline:      "none",
        }}
      />
      {hint && <div style={{ fontSize: 11, color: "#4b5563", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function Toggle({
  label, checked, onChange, hint,
}: {
  label:    string;
  checked:  boolean;
  onChange: (v: boolean) => void;
  hint?:    string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 34, height: 18, borderRadius: 9999, flexShrink: 0,
          background:  checked ? "#10B981" : "#1F2937",
          position:    "relative",
          cursor:      "pointer",
          transition:  "background 0.2s",
          marginTop:   1,
        }}
      >
        <div style={{
          position:   "absolute",
          top:        2, left: checked ? 17 : 2,
          width:      14, height: 14,
          borderRadius: 9999,
          background: "#fff",
          transition: "left 0.2s",
        }} />
      </div>
      <div>
        <div style={{ fontSize: 12, color: "#d1d5db", fontWeight: 500 }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: "#4b5563", marginTop: 2 }}>{hint}</div>}
      </div>
    </div>
  );
}

const D: ExtensionSettings = {
  apiToken:        "",
  brandName:       "",
  brandDomain:     "",
  trackedBrands:   [],
  competitors:     [],
  cloudUrl:        "https://showsup.co",
  showBadge:       true,
  monitorEnabled:  true,
  notifyOnMention: true,
  theme:           "dark",
};

export default function Settings({ settings, onSave }: Props) {
  const s = settings || D;

  const [apiToken,        setApiToken]        = useState(s.apiToken);
  const [brandName,       setBrandName]       = useState(s.brandName);
  const [brandDomain,     setBrandDomain]     = useState(s.brandDomain);
  const [trackedBrands,   setTrackedBrands]   = useState(s.trackedBrands.join(", "));
  const [competitors,     setCompetitors]     = useState(s.competitors.join(", "));
  const [cloudUrl,        setCloudUrl]        = useState(s.cloudUrl);
  const [showBadge,       setShowBadge]       = useState(s.showBadge);
  const [monitorEnabled,  setMonitorEnabled]  = useState(s.monitorEnabled);
  const [notifyOnMention, setNotifyOnMention] = useState(s.notifyOnMention);
  const [saved,           setSaved]           = useState(false);

  function save() {
    const updated: ExtensionSettings = {
      apiToken,
      brandName,
      brandDomain:     brandDomain.replace(/^https?:\/\//, "").replace(/^www\./, ""),
      trackedBrands:   trackedBrands.split(",").map((b) => b.trim()).filter(Boolean),
      competitors:     competitors.split(",").map((c) => c.trim()).filter(Boolean),
      cloudUrl:        cloudUrl || "https://showsup.co",
      showBadge,
      monitorEnabled,
      notifyOnMention,
      theme:           "dark",
    };
    onSave(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ padding: 14, overflowY: "auto", maxHeight: 440 }}>

      {/* API */}
      <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 10 }}>
        API CONNECTION
      </div>
      <Field
        label="ShowsUp API Token"
        value={apiToken}
        onChange={setApiToken}
        type="password"
        placeholder="sk-…"
        hint="Get your token at showsup.co"
      />
      <Field
        label="Cloud URL"
        value={cloudUrl}
        onChange={setCloudUrl}
        placeholder="https://showsup.co"
        hint="Leave default unless self-hosting."
      />

      <div style={{ height: 1, background: "#1F2937", margin: "4px 0 14px" }} />

      {/* Brand */}
      <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 10 }}>
        BRAND
      </div>
      <Field
        label="Brand Name"
        value={brandName}
        onChange={setBrandName}
        placeholder="Acme Inc."
        hint="Name the AI monitor watches for."
      />
      <Field
        label="Brand Domain"
        value={brandDomain}
        onChange={setBrandDomain}
        placeholder="acme.com"
        hint="Used for your dashboard score."
      />
      <Field
        label="Brand Name Variants"
        value={trackedBrands}
        onChange={setTrackedBrands}
        placeholder="Acme, ACME Corp, acme.com"
        hint="Comma-separated aliases to track."
      />
      <Field
        label="Competitors to Watch"
        value={competitors}
        onChange={setCompetitors}
        placeholder="Rival, OtherCo, competitor.com"
        hint="Comma-separated. Highlighted in amber."
      />

      <div style={{ height: 1, background: "#1F2937", margin: "4px 0 14px" }} />

      {/* Preferences */}
      <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 10 }}>
        PREFERENCES
      </div>
      <Toggle
        label="Show score badge on sites"
        checked={showBadge}
        onChange={setShowBadge}
        hint="Small badge showing AI visibility score in page corner."
      />
      <Toggle
        label="Enable AI monitor"
        checked={monitorEnabled}
        onChange={setMonitorEnabled}
        hint="Floating panel on ChatGPT, Claude, Gemini, Perplexity."
      />
      <Toggle
        label="Notify on brand mention"
        checked={notifyOnMention}
        onChange={setNotifyOnMention}
        hint="Desktop notification when your brand is mentioned."
      />

      {/* Save */}
      <button
        onClick={save}
        style={{
          width:        "100%",
          background:   saved ? "#059669" : "#10B981",
          color:        "#fff",
          border:       "none",
          borderRadius: 8,
          padding:      "10px",
          fontSize:     13,
          fontWeight:   600,
          cursor:       "pointer",
          marginTop:    4,
          transition:   "background 0.2s",
        }}
      >
        {saved ? "Saved ✓" : "Save Settings"}
      </button>

      <div style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: "#374151" }}>
        <a
          href="https://showsup.co"
          target="_blank"
          rel="noopener"
          style={{ color: "#10B981", textDecoration: "none" }}
        >
          showsup.co
        </a>
        {" · "}
        <span>v1.0.0</span>
      </div>
    </div>
  );
}
