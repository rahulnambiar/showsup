/**
 * ShowsUp AI Monitor — content script for AI chat platforms.
 *
 * Injected into: ChatGPT, Claude, Gemini, Perplexity, Copilot
 *
 * What it does:
 *  1. Detects the current AI platform
 *  2. Watches for new AI responses via MutationObserver
 *  3. Checks responses for brand/competitor mentions
 *  4. Shows a floating monitor panel with session stats
 *  5. Highlights brand mentions inline in the chat
 */

import type { AIPlatform, BrandMention, CompetitorMention } from "../lib/types";
import { PLATFORM_CONFIGS } from "../lib/types";

// ── Platform detection ─────────────────────────────────────────────────────────

function detectPlatform(): AIPlatform {
  const h = location.hostname;
  if (h.includes("chat.openai") || h.includes("chatgpt.com")) return "chatgpt";
  if (h.includes("claude.ai"))                                  return "claude";
  if (h.includes("gemini.google"))                              return "gemini";
  if (h.includes("perplexity"))                                 return "perplexity";
  if (h.includes("copilot.microsoft"))                          return "copilot";
  return "unknown";
}

// ── State ──────────────────────────────────────────────────────────────────────

interface Settings {
  brandName:       string;
  brandDomain:     string;
  trackedBrands:   string[];
  competitors:     string[];
  monitorEnabled:  boolean;
}

let settings: Settings = {
  brandName:      "",
  brandDomain:    "",
  trackedBrands:  [],
  competitors:    [],
  monitorEnabled: true,
};

let sessionResponses     = 0;
let sessionBrandMentions = 0;
let sessionCompMentions: Record<string, number> = {};
let processedNodes       = new WeakSet<Element>();
let panelEl: HTMLElement | null = null;
let isVisible = true;
const platform = detectPlatform();
const config   = PLATFORM_CONFIGS[platform];

// ── Init ───────────────────────────────────────────────────────────────────────

async function init() {
  // Load settings from background
  const response = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" });
  if (response?.settings) {
    settings = response.settings;
  }

  if (!settings.monitorEnabled || !settings.brandName) return;

  // Initialize monitor session in background
  await chrome.runtime.sendMessage({
    type: "MONITOR_EVENT",
    event: { kind: "session_reset" },
  });

  injectPanel();
  startObserver();
}

// ── Observer ───────────────────────────────────────────────────────────────────

function startObserver() {
  const observer = new MutationObserver(() => {
    const nodes = document.querySelectorAll(config.responseSelector);
    nodes.forEach(processResponse);
  });

  observer.observe(document.body, {
    childList: true,
    subtree:   true,
    characterData: true,
  });
}

function isStreamingComplete(el: Element): boolean {
  // ChatGPT streams into a container; we check for a "stop" indicator
  const isStreaming =
    el.closest("[data-is-streaming='true']") !== null ||
    document.querySelector("[data-is-streaming='true']") !== null;

  if (platform === "chatgpt") {
    // Stop button presence = still streaming
    return !document.querySelector('[data-testid="stop-button"]');
  }
  if (platform === "claude") {
    return el.getAttribute("data-is-streaming") !== "true";
  }
  // For others, a small debounce handles it
  return true;
}

let debounceTimers = new WeakMap<Element, ReturnType<typeof setTimeout>>();

function processResponse(el: Element) {
  if (processedNodes.has(el)) return;

  // Debounce 600ms to wait for stream completion
  const existing = debounceTimers.get(el);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    if (processedNodes.has(el)) return;

    const text = el.textContent || "";
    if (text.length < 20) return; // Skip tiny fragments

    processedNodes.add(el);
    sessionResponses++;

    // Detect brand mentions
    const brandNames = [settings.brandName, ...settings.trackedBrands].filter(Boolean);
    let foundBrand = false;

    brandNames.forEach((brand) => {
      if (!brand) return;
      const regex = new RegExp(`\\b${escapeRegex(brand)}\\b`, "gi");
      const matches = text.match(regex);
      if (matches) {
        foundBrand = true;
        sessionBrandMentions += matches.length;
        highlightMentions(el, brand, "#10B981");

        // Extract context
        const idx   = text.toLowerCase().indexOf(brand.toLowerCase());
        const start = Math.max(0, idx - 60);
        const end   = Math.min(text.length, idx + brand.length + 60);
        const ctx   = text.slice(start, end).trim();

        const sentiment = detectSentiment(text, brand);

        const mention: BrandMention = {
          brand,
          context:       ctx,
          sentiment,
          responseIndex: sessionResponses,
        };

        chrome.runtime.sendMessage({
          type:  "MONITOR_EVENT",
          event: { kind: "brand_mention", mention },
        });
      }
    });

    // Detect competitor mentions
    settings.competitors.forEach((comp) => {
      if (!comp) return;
      const regex = new RegExp(`\\b${escapeRegex(comp)}\\b`, "gi");
      const matches = text.match(regex);
      if (matches) {
        sessionCompMentions[comp] = (sessionCompMentions[comp] || 0) + matches.length;
        highlightMentions(el, comp, "#F59E0B");

        chrome.runtime.sendMessage({
          type:  "MONITOR_EVENT",
          event: {
            kind:    "competitor_mention",
            mention: { brand: comp, count: matches.length, context: text.slice(0, 100) },
          },
        });
      }
    });

    // Notify background of response completion
    chrome.runtime.sendMessage({
      type:  "MONITOR_EVENT",
      event: { kind: "response_complete", text: text.slice(0, 500), index: sessionResponses },
    });

    updatePanel();
  }, 600);

  debounceTimers.set(el, timer);
}

// ── Mention highlighting ───────────────────────────────────────────────────────

function highlightMentions(el: Element, term: string, color: string) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let node: Text | null;

  while ((node = walker.nextNode() as Text)) {
    textNodes.push(node);
  }

  const regex = new RegExp(`(${escapeRegex(term)})`, "gi");

  textNodes.forEach((textNode) => {
    if (!regex.test(textNode.nodeValue || "")) return;

    const parent = textNode.parentNode;
    if (!parent || parent.nodeName === "MARK") return;

    // Already highlighted
    if ((parent as Element).closest?.("mark[data-showsup]")) return;

    const frag = document.createDocumentFragment();
    const parts = (textNode.nodeValue || "").split(regex);

    parts.forEach((part) => {
      if (part.toLowerCase() === term.toLowerCase()) {
        const mark = document.createElement("mark");
        mark.setAttribute("data-showsup", "true");
        mark.style.cssText = `
          background: ${color}33;
          border-bottom: 2px solid ${color};
          border-radius: 2px;
          padding: 0 1px;
          color: inherit;
        `;
        mark.textContent = part;
        frag.appendChild(mark);
      } else {
        frag.appendChild(document.createTextNode(part));
      }
    });

    parent.replaceChild(frag, textNode);
    regex.lastIndex = 0;
  });
}

// ── Floating panel ─────────────────────────────────────────────────────────────

const PANEL_CSS = `
  #showsup-monitor {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 2147483647;
    width: 260px;
    background: #0A0E17;
    border: 1px solid #1F2937;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 13px;
    color: #e5e7eb;
    overflow: hidden;
    transition: transform 0.2s ease, opacity 0.2s ease;
    user-select: none;
  }
  #showsup-monitor.hidden {
    transform: translateY(calc(100% + 20px));
    opacity: 0;
    pointer-events: none;
  }
  #showsup-monitor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    background: #111827;
    border-bottom: 1px solid #1F2937;
    cursor: move;
  }
  #showsup-monitor-header .su-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    font-size: 12px;
    color: #10B981;
  }
  #showsup-monitor-header .su-platform {
    font-size: 11px;
    color: #6b7280;
  }
  #showsup-monitor-header .su-actions {
    display: flex;
    gap: 6px;
  }
  #showsup-monitor-header button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 4px;
    color: #6b7280;
    font-size: 14px;
    line-height: 1;
  }
  #showsup-monitor-header button:hover { color: #e5e7eb; background: #1F2937; }
  #showsup-monitor-body { padding: 12px; }
  .su-stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 0;
    border-bottom: 1px solid #1F2937;
  }
  .su-stat-row:last-child { border-bottom: none; }
  .su-stat-label { color: #9ca3af; font-size: 12px; }
  .su-stat-value { font-weight: 600; font-size: 14px; }
  .su-stat-value.green  { color: #10B981; }
  .su-stat-value.amber  { color: #F59E0B; }
  .su-stat-value.gray   { color: #6b7280; }
  .su-competitors { margin-top: 8px; padding-top: 8px; border-top: 1px solid #1F2937; }
  .su-comp-title  { font-size: 11px; color: #6b7280; margin-bottom: 6px; }
  .su-comp-item   { display: flex; justify-content: space-between; font-size: 12px; padding: 2px 0; }
  .su-comp-name   { color: #d1d5db; }
  .su-comp-count  { color: #F59E0B; font-weight: 600; }
  .su-footer      { padding: 8px 12px; border-top: 1px solid #1F2937; }
  .su-prompt-btn  {
    width: 100%;
    background: #10B981;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 7px 12px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  }
  .su-prompt-btn:hover { background: #059669; }
  .su-dot {
    width: 7px; height: 7px;
    background: #10B981;
    border-radius: 50%;
    animation: su-pulse 2s infinite;
  }
  @keyframes su-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }
`;

function injectPanel() {
  // Inject styles
  const style = document.createElement("style");
  style.textContent = PANEL_CSS;
  document.head.appendChild(style);

  panelEl = document.createElement("div");
  panelEl.id = "showsup-monitor";
  panelEl.innerHTML = buildPanelHTML();
  document.body.appendChild(panelEl);

  // Header drag
  makeDraggable(panelEl, document.getElementById("showsup-monitor-header")!);

  // Toggle visibility button
  document.getElementById("su-btn-toggle")?.addEventListener("click", () => {
    isVisible = !isVisible;
    panelEl!.classList.toggle("hidden", !isVisible);
  });

  // Reset session button
  document.getElementById("su-btn-reset")?.addEventListener("click", () => {
    sessionResponses     = 0;
    sessionBrandMentions = 0;
    sessionCompMentions  = {};
    processedNodes       = new WeakSet();
    updatePanel();
  });

  // Insert brand prompt button
  document.getElementById("su-insert-prompt")?.addEventListener("click", () => {
    insertBrandPrompt();
  });

  // Toggle via keyboard shortcut relay
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "TOGGLE_MONITOR") {
      isVisible = !isVisible;
      panelEl!.classList.toggle("hidden", !isVisible);
    }
  });
}

function buildPanelHTML(): string {
  return `
    <div id="showsup-monitor-header">
      <div class="su-title">
        <div class="su-dot"></div>
        ShowsUp Monitor
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="su-platform">${config.name}</span>
        <div class="su-actions">
          <button id="su-btn-reset" title="Reset session">↺</button>
          <button id="su-btn-toggle" title="Minimize">−</button>
        </div>
      </div>
    </div>
    <div id="showsup-monitor-body">
      <div class="su-stat-row">
        <span class="su-stat-label">Responses tracked</span>
        <span class="su-stat-value gray" id="su-responses">0</span>
      </div>
      <div class="su-stat-row">
        <span class="su-stat-label">${settings.brandName || "Your brand"} mentioned</span>
        <span class="su-stat-value green" id="su-brand-mentions">0</span>
      </div>
      <div class="su-stat-row">
        <span class="su-stat-label">Win rate</span>
        <span class="su-stat-value green" id="su-win-rate">—</span>
      </div>
      <div class="su-competitors" id="su-competitors-section" style="display:none">
        <div class="su-comp-title">COMPETITOR MENTIONS</div>
        <div id="su-competitors-list"></div>
      </div>
    </div>
    <div class="su-footer">
      <button class="su-prompt-btn" id="su-insert-prompt">
        Ask about ${settings.brandName || "your brand"} →
      </button>
    </div>
  `;
}

function updatePanel() {
  if (!panelEl) return;

  const el = (id: string) => document.getElementById(id);

  const responses = el("su-responses");
  const mentions  = el("su-brand-mentions");
  const winRate   = el("su-win-rate");
  const compSec   = el("su-competitors-section");
  const compList  = el("su-competitors-list");

  if (responses) responses.textContent = String(sessionResponses);
  if (mentions)  mentions.textContent  = String(sessionBrandMentions);

  if (winRate) {
    if (sessionResponses === 0) {
      winRate.textContent = "—";
    } else {
      const rate = Math.round((sessionBrandMentions / sessionResponses) * 100);
      winRate.textContent = `${rate}%`;
      winRate.className = `su-stat-value ${rate >= 50 ? "green" : rate >= 25 ? "amber" : "gray"}`;
    }
  }

  const compEntries = Object.entries(sessionCompMentions).filter(([, c]) => c > 0);
  if (compSec && compList) {
    if (compEntries.length > 0) {
      compSec.style.display = "block";
      compList.innerHTML = compEntries
        .sort(([, a], [, b]) => b - a)
        .map(([name, count]) => `
          <div class="su-comp-item">
            <span class="su-comp-name">${name}</span>
            <span class="su-comp-count">${count}×</span>
          </div>
        `)
        .join("");
    } else {
      compSec.style.display = "none";
    }
  }
}

// ── Insert brand prompt ────────────────────────────────────────────────────────

function insertBrandPrompt() {
  const brand  = settings.brandName || "my brand";
  const prompt = `Tell me about ${brand} — what are they known for, and do you recommend them?`;

  const input = document.querySelector(config.inputSelector) as HTMLElement | null;
  if (!input) return;

  if (input.tagName === "TEXTAREA") {
    const ta   = input as HTMLTextAreaElement;
    ta.value   = prompt;
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    ta.dispatchEvent(new Event("change", { bubbles: true }));
  } else if (input.contentEditable === "true") {
    input.textContent = prompt;
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
  }

  input.focus();
}

// ── Drag ───────────────────────────────────────────────────────────────────────

function makeDraggable(panel: HTMLElement, handle: HTMLElement) {
  let startX = 0, startY = 0, origLeft = 0, origTop = 0;

  handle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    startX   = e.clientX;
    startY   = e.clientY;
    const rect = panel.getBoundingClientRect();
    origLeft = rect.left;
    origTop  = rect.top;

    panel.style.right  = "auto";
    panel.style.bottom = "auto";
    panel.style.left   = `${origLeft}px`;
    panel.style.top    = `${origTop}px`;

    function onMove(ev: MouseEvent) {
      panel.style.left = `${origLeft + ev.clientX - startX}px`;
      panel.style.top  = `${origTop  + ev.clientY - startY}px`;
    }

    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup",   onUp);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
  });
}

// ── Sentiment ─────────────────────────────────────────────────────────────────

function detectSentiment(text: string, brand: string): "positive" | "neutral" | "negative" {
  const lc = text.toLowerCase();
  const bi = lc.indexOf(brand.toLowerCase());
  if (bi === -1) return "neutral";

  const window = lc.slice(Math.max(0, bi - 100), bi + 100 + brand.length);

  const pos = ["recommend", "great", "excellent", "best", "top", "popular", "trust", "reliable", "leading"];
  const neg = ["avoid", "bad", "poor", "scam", "unreliable", "worst", "not recommend", "fraud"];

  if (pos.some((w) => window.includes(w))) return "positive";
  if (neg.some((w) => window.includes(w))) return "negative";
  return "neutral";
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ── Boot ───────────────────────────────────────────────────────────────────────

init();
