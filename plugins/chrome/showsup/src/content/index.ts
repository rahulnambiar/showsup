/**
 * ShowsUp site badge — injected on all non-AI-platform pages.
 *
 * Shows a small floating score badge if we have a cached score
 * for the current domain. Click → opens the popup focused on this site.
 */

import type { ScanResult } from "../lib/types";
import { scoreColor, scoreLabel, extractDomain } from "../lib/api";

const domain = extractDomain(location.href);

// Don't show on internal browser pages or the ShowsUp site itself
if (!domain || domain.includes("showsup.co") || !location.href.startsWith("http")) {
  // exit — no badge needed
} else {
  init();
}

async function init() {
  const res = await chrome.runtime.sendMessage({ type: "GET_SCAN", domain });
  if (res?.scan) {
    injectBadge(res.scan);
  }

  // Settings check for badge visibility
  const settingsRes = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" });
  if (!settingsRes?.settings?.showBadge) return;
}

function injectBadge(scan: ScanResult) {
  if (document.getElementById("showsup-badge")) return;

  const score = scan.overall_score;
  const color = scoreColor(score);
  const label = scoreLabel(score);

  const badge = document.createElement("div");
  badge.id = "showsup-badge";
  badge.innerHTML = `
    <div id="showsup-badge-inner">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <circle cx="5" cy="5" r="4.5" stroke="${color}" stroke-width="1"/>
        <circle cx="5" cy="5" r="2" fill="${color}"/>
      </svg>
      <span id="showsup-badge-score">${score}</span>
    </div>
    <div id="showsup-badge-tooltip">
      <div class="su-tt-title">AI Visibility: <strong>${label}</strong></div>
      <div class="su-tt-score" style="color:${color}">${score}/100</div>
      <div class="su-tt-hint">Click to scan or see details</div>
    </div>
  `;

  const css = document.createElement("style");
  css.textContent = `
    #showsup-badge {
      position: fixed;
      bottom: 16px;
      left: 16px;
      z-index: 2147483647;
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    #showsup-badge-inner {
      display: flex;
      align-items: center;
      gap: 5px;
      background: #0A0E17;
      border: 1px solid ${color}55;
      border-radius: 9999px;
      padding: 5px 10px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.4);
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    #showsup-badge:hover #showsup-badge-inner {
      border-color: ${color};
      box-shadow: 0 2px 20px ${color}33;
    }
    #showsup-badge-score {
      font-size: 12px;
      font-weight: 700;
      color: ${color};
      line-height: 1;
    }
    #showsup-badge-tooltip {
      display: none;
      position: absolute;
      bottom: calc(100% + 8px);
      left: 0;
      background: #111827;
      border: 1px solid #1F2937;
      border-radius: 8px;
      padding: 10px 12px;
      min-width: 180px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      color: #e5e7eb;
    }
    #showsup-badge:hover #showsup-badge-tooltip { display: block; }
    .su-tt-title { font-size: 12px; color: #9ca3af; margin-bottom: 4px; }
    .su-tt-score { font-size: 20px; font-weight: 800; margin-bottom: 4px; }
    .su-tt-hint  { font-size: 11px; color: #6b7280; }
  `;

  document.head.appendChild(css);
  document.body.appendChild(badge);

  badge.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "OPEN_POPUP" });
  });
}
