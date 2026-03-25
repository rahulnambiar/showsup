import type { ExtensionSettings, StoredScan, ScanResult, MonitorSession } from "./types";

const DEFAULTS: ExtensionSettings = {
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

// ── Settings ──────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<ExtensionSettings> {
  const result = await chrome.storage.sync.get("settings");
  return { ...DEFAULTS, ...(result.settings || {}) };
}

export async function saveSettings(partial: Partial<ExtensionSettings>): Promise<void> {
  const current = await getSettings();
  await chrome.storage.sync.set({ settings: { ...current, ...partial } });
}

// ── Scans ─────────────────────────────────────────────────────────────────────

export async function getStoredScan(domain: string): Promise<ScanResult | null> {
  const result = await chrome.storage.local.get("scans");
  const scans: StoredScan = result.scans || {};
  return scans[domain] || null;
}

export async function storeScan(domain: string, scan: ScanResult): Promise<void> {
  const result = await chrome.storage.local.get("scans");
  const scans: StoredScan = result.scans || {};
  scans[domain] = scan;
  // Keep only 50 most recent
  const entries = Object.entries(scans).sort(([, a], [, b]) => b.scanned_at - a.scanned_at);
  const trimmed = Object.fromEntries(entries.slice(0, 50));
  await chrome.storage.local.set({ scans: trimmed });
}

export async function getAllScans(): Promise<StoredScan> {
  const result = await chrome.storage.local.get("scans");
  return result.scans || {};
}

// ── Monitor session ───────────────────────────────────────────────────────────

export async function getMonitorSession(): Promise<MonitorSession | null> {
  const result = await chrome.storage.session.get("monitorSession").catch(() =>
    chrome.storage.local.get("monitorSession")
  );
  return result.monitorSession || null;
}

export async function saveMonitorSession(session: MonitorSession): Promise<void> {
  await chrome.storage.session.set({ monitorSession: session }).catch(() =>
    chrome.storage.local.set({ monitorSession: session })
  );
}

export async function clearMonitorSession(): Promise<void> {
  await chrome.storage.session.remove("monitorSession").catch(() =>
    chrome.storage.local.remove("monitorSession")
  );
}
