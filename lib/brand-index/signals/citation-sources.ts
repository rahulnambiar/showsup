/**
 * Signal 4: Citation Source Analysis (15% weight)
 * Extracts citations from existing scan results + checks G2/Trustpilot presence.
 */

import type { ScanOutput } from "@/lib/engine/types";

export interface CitationSourceResult {
  // From scan results
  citation_count: number;
  cited_urls: string[];

  // Platform presence
  g2_exists: boolean;
  trustpilot_exists: boolean;
  platform_count: number;

  score: number;
}

const FETCH_TIMEOUT_MS = 8_000;

async function checkUrlExists(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "User-Agent": "ShowsUp-Scanner/1.0 (AEO Brand Index)" },
      redirect: "follow",
    });
    return res.status < 400;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function toSlug(brandName: string): string {
  return brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function extractCitationsFromScan(scanOutput: ScanOutput | null): string[] {
  if (!scanOutput?.citation_data?.cited_pages) return [];
  return scanOutput.citation_data.cited_pages.map((p) => p.url);
}

function computeScore(r: Omit<CitationSourceResult, "score">): number {
  let score = 0;

  if (r.citation_count >= 5) score += 30;
  else if (r.citation_count >= 2) score += 15;

  if (r.g2_exists) score += 20;
  if (r.trustpilot_exists) score += 15;

  // Platform count bonus: +10 per platform beyond citations, max 35
  const platformBonus = Math.min(r.platform_count * 10, 35);
  score += platformBonus;

  return Math.min(score, 100);
}

export async function analyzeCitationSources(
  brandName: string,
  brandUrl: string,
  scanOutput: ScanOutput | null
): Promise<CitationSourceResult> {
  const brandSlug = toSlug(brandName);
  const brandDomain = extractDomain(brandUrl);

  const cited_urls = extractCitationsFromScan(scanOutput);
  const citation_count = cited_urls.length;

  const [g2_exists, trustpilot_exists] = await Promise.all([
    checkUrlExists(`https://www.g2.com/products/${brandSlug}`),
    checkUrlExists(`https://www.trustpilot.com/review/${brandDomain}`),
  ]);

  const platform_count = [g2_exists, trustpilot_exists].filter(Boolean).length;

  const partial = { citation_count, cited_urls, g2_exists, trustpilot_exists, platform_count };
  return { ...partial, score: computeScore(partial) };
}
