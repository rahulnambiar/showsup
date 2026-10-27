import { useState } from "react";
import type { ExtensionSettings } from "../../lib/types";

const SHOWSUP_URL = "https://showsup.co";

interface Props {
  settings: ExtensionSettings | null;
  onSave:   (s: ExtensionSettings) => void;
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

export function Settings({ settings, onSave }: Props) {
  const s = settings || D;
  const [apiToken, setApiToken] = useState(s.apiToken);
  const [visible,  setVisible]  = useState(false);
  const [saved,    setSaved]    = useState(false);

  function save() {
    onSave({ ...s, apiToken });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ padding: 14 }}>
      <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 12 }}>
        API KEY
      </div>

      <div style={{ position: "relative", marginBottom: 8 }}>
        <input
          type={visible ? "text" : "password"}
          value={apiToken}
          onChange={(e) => setApiToken(e.target.value)}
          placeholder="su_…"
          style={{
            width: "100%", background: "#111827",
            border: "1px solid #1F2937", borderRadius: 8,
            padding: "9px 36px 9px 10px",
            color: "#e5e7eb", fontSize: 13, outline: "none",
            boxSizing: "border-box",
          }}
        />
        <button
          onClick={() => setVisible((v) => !v)}
          style={{
            position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer",
            color: "#4b5563", fontSize: 13, padding: 2,
          }}
        >
          {visible ? "🙈" : "👁"}
        </button>
      </div>

      <div style={{ fontSize: 11, color: "#4b5563", marginBottom: 16, lineHeight: 1.5 }}>
        Get your key from{" "}
        <a
          href={`${SHOWSUP_URL}/app/settings`}
          target="_blank"
          rel="noopener"
          style={{ color: "#10B981", textDecoration: "none" }}
          onClick={() => chrome.tabs.create({ url: `${SHOWSUP_URL}/app/settings` })}
        >
          showsup.co → Settings → API Key
        </a>
      </div>

      <button
        onClick={save}
        disabled={!apiToken.trim()}
        style={{
          width: "100%", background: saved ? "#059669" : "#10B981",
          color: "#fff", border: "none", borderRadius: 8,
          padding: "10px", fontSize: 13, fontWeight: 600,
          cursor: apiToken.trim() ? "pointer" : "not-allowed",
          opacity: apiToken.trim() ? 1 : 0.5,
          transition: "background 0.2s",
        }}
      >
        {saved ? "Saved ✓" : "Save & Connect"}
      </button>
    </div>
  );
}

export default Settings;
