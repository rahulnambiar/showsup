/**
 * ShowsUp Service Worker (Manifest V3)
 *
 * Handles:
 *  - Scan triggers from popup and content scripts
 *  - Domain score caching
 *  - Badge updates
 *  - Monitor session relay between content ↔ popup
 *  - Periodic background re-scans (via alarms)
 */

import { getSettings, getStoredScan, storeScan, getMonitorSession, saveMonitorSession } from "./lib/storage";
import { createClient, extractDomain, scoreColor } from "./lib/api";
import type { Message, MonitorEvent, ScanResult } from "./lib/types";

const SCAN_ALARM  = "showsup-auto-scan";
const SCAN_CACHE  = new Map<string, Promise<ScanResult>>();

// ── Message router ─────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg: Message, sender, sendResponse) => {
  (async () => {
    try {
      switch (msg.type) {
        case "PING":
          sendResponse({ ok: true });
          break;

        case "GET_SETTINGS": {
          const settings = await getSettings();
          sendResponse({ ok: true, settings });
          break;
        }

        case "SAVE_SETTINGS": {
          const { saveSettings } = await import("./lib/storage");
          await saveSettings(msg.settings);
          sendResponse({ ok: true });
          break;
        }

        case "TRIGGER_SCAN": {
          const result = await triggerScan(msg.domain);
          sendResponse({ ok: true, result });
          break;
        }

        case "GET_SCAN": {
          const cached = await getStoredScan(msg.domain);
          sendResponse({ ok: true, scan: cached });
          break;
        }

        case "GET_MONITOR_SESSION": {
          const session = await getMonitorSession();
          sendResponse({ ok: true, session });
          break;
        }

        case "MONITOR_EVENT": {
          await handleMonitorEvent(msg.event, sender.tab?.id);
          sendResponse({ ok: true });
          break;
        }

        default:
          sendResponse({ ok: false, error: "Unknown message type" });
      }
    } catch (err) {
      sendResponse({ ok: false, error: (err as Error).message });
    }
  })();
  return true; // keep channel open for async response
});

// ── Scan ───────────────────────────────────────────────────────────────────────

async function triggerScan(domain: string): Promise<ScanResult> {
  // Deduplicate concurrent scans for same domain
  if (SCAN_CACHE.has(domain)) {
    return SCAN_CACHE.get(domain)!;
  }

  const promise = (async () => {
    const settings = await getSettings();
    if (!settings.apiToken) throw new Error("No API token. Add one in ShowsUp Settings.");

    const client = createClient(settings.apiToken, settings.cloudUrl);
    const url    = `https://${domain}`;

    const raw = await client.scan({
      brand:    settings.brandDomain === domain ? settings.brandName : domain,
      url,
      category: "Other",
      regions:  ["global"],
      depth:    "quick",
    });

    const scan: ScanResult = {
      domain,
      overall_score:    raw.overall_score,
      chatgpt_score:    raw.chatgpt_score,
      claude_score:     raw.claude_score,
      gemini_score:     raw.gemini_score,
      perplexity_score: raw.perplexity_score,
      share_of_voice:   raw.share_of_voice,
      queries_won:      raw.queries_won,
      queries_missed:   raw.queries_missed,
      query_count:      raw.query_count,
      recommendations:  raw.recommendations,
      competitors:      raw.competitors,
      scanned_at:       Date.now(),
    };

    await storeScan(domain, scan);
    await updateBadge(domain, scan.overall_score);

    return scan;
  })();

  SCAN_CACHE.set(domain, promise);
  promise.finally(() => SCAN_CACHE.delete(domain));

  return promise;
}

// ── Badge ──────────────────────────────────────────────────────────────────────

async function updateBadge(domain: string, score: number): Promise<void> {
  const color = scoreColor(score);
  await chrome.action.setBadgeText({ text: String(score) });
  await chrome.action.setBadgeBackgroundColor({ color });
}

async function clearBadge(): Promise<void> {
  await chrome.action.setBadgeText({ text: "" });
}

// ── Monitor event relay ────────────────────────────────────────────────────────

async function handleMonitorEvent(event: MonitorEvent, tabId?: number): Promise<void> {
  const session = await getMonitorSession();

  if (!session) return;

  if (event.kind === "brand_mention") {
    session.brandMentions.push(event.mention);
    await saveMonitorSession(session);

    // Notification if enabled
    const settings = await getSettings();
    if (settings.notifyOnMention) {
      chrome.notifications.create({
        type:    "basic",
        iconUrl: "icons/icon-48.png",
        title:   `ShowsUp: ${event.mention.brand} mentioned!`,
        message: event.mention.context.slice(0, 100),
      });
    }
  }

  if (event.kind === "competitor_mention") {
    const existing = session.competitors.find((c) => c.brand === event.mention.brand);
    if (existing) {
      existing.count += event.mention.count;
    } else {
      session.competitors.push(event.mention);
    }
    await saveMonitorSession(session);
  }

  if (event.kind === "response_complete") {
    session.responses += 1;
    await saveMonitorSession(session);
  }

  if (event.kind === "session_reset") {
    const { clearMonitorSession } = await import("./lib/storage");
    await clearMonitorSession();
  }

  // Relay to popup if open
  chrome.runtime.sendMessage({ type: "MONITOR_UPDATE", session }).catch(() => {});
}

// ── Tab tracking (update badge on tab change) ─────────────────────────────────

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId).catch(() => null);
  if (!tab?.url) { await clearBadge(); return; }

  const domain = extractDomain(tab.url);
  const cached  = await getStoredScan(domain);
  if (cached) {
    await updateBadge(domain, cached.overall_score);
  } else {
    await clearBadge();
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;
  const domain = extractDomain(tab.url);
  const cached  = await getStoredScan(domain);
  if (cached) await updateBadge(domain, cached.overall_score);
});

// ── Commands ───────────────────────────────────────────────────────────────────

chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-monitor") {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_MONITOR" });
    });
  }
});

// ── Install ────────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") {
    chrome.tabs.create({ url: "options.html" });
  }
});
