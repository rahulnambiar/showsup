/**
 * Analytics helpers — thin wrappers around posthog.capture.
 * All functions are no-ops when PostHog is not configured.
 */
import { posthog } from "./posthog";

function capture(event: string, props?: Record<string, unknown>) {
  try {
    posthog.capture(event, props);
  } catch {
    // silently ignore — PostHog not loaded
  }
}

// ── Auth ───────────────────────────────────────────────────────────────────────

export function trackSignupStarted(method: "email" | "google") {
  capture("signup_started", { method });
}

export function trackSignupCompleted(method: "email" | "google") {
  const utm = (() => {
    try { return JSON.parse(localStorage.getItem("utm_data") ?? "{}"); } catch { return {}; }
  })();
  capture("signup_completed", { method, ...utm });
}

export function trackLoginCompleted(method: "email" | "google") {
  capture("login_completed", { method });
}

// ── Scan ───────────────────────────────────────────────────────────────────────

export function trackScanStarted(props: { brand?: string; url?: string; depth?: string; models?: string[] }) {
  capture("scan_started", props);
}

export function trackScanCompleted(props: { brand: string; score: number; category: string; depth?: string }) {
  capture("scan_completed", props);
}

export function trackScanFailed(reason: string) {
  capture("scan_failed", { reason });
}

// ── Report ─────────────────────────────────────────────────────────────────────

export function trackReportViewed(props: { scan_id: string; score: number; brand?: string }) {
  capture("report_viewed", props);
}

export function trackPdfDownloaded(scan_id: string) {
  capture("pdf_downloaded", { scan_id });
}

export function trackReportShared(scan_id: string) {
  capture("report_shared", { scan_id });
}

// ── Fixes ──────────────────────────────────────────────────────────────────────

export function trackFixGenerated(props: { brand?: string; fix_types?: string[]; scan_id?: string }) {
  capture("fix_generated", props);
}

// ── Tokens ─────────────────────────────────────────────────────────────────────

export function trackTokensPageViewed() {
  capture("tokens_page_viewed");
}

export function trackTokensPackageSelected(pkg: { id: string; tokens: number; price_sgd: number }) {
  capture("tokens_package_selected", pkg);
}

export function trackTokensPurchaseClicked(pkg: { id: string; tokens: number; price_sgd: number }) {
  capture("tokens_purchase_clicked", pkg);
}

// ── Report builder ─────────────────────────────────────────────────────────────

export function trackReportBuilderOpened(url?: string) {
  capture("report_builder_opened", { url });
}
