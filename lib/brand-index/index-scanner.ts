/**
 * Brand Index scan orchestrator.
 * Runs the 6-signal engine across a list of brands, persists results, and
 * detects month-over-month website changes.
 *
 * Can be called for a subset of brands (cron batches) or all 100 (admin trigger).
 */

import { createClient } from "@supabase/supabase-js";
import { runScan } from "@/lib/engine/scan";
import type { ScanOutput } from "@/lib/engine/types";
import { analyzeStructuredData } from "./signals/structured-data";
import { analyzeTrainingData } from "./signals/training-data";
import { analyzeCitationSources } from "./signals/citation-sources";
import { analyzeSearchCorrelation } from "./signals/search-correlation";
import {
  computeCompositeScore,
  crawlerReadinessScore,
  type SignalScores,
} from "./composite-score";
import { detectChanges, type SnapshotRow } from "./change-detection";
import { fetchStockData, upsertStockPrice } from "./stock-fetcher";
import type { Brand } from "./brands";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

function currentMonth(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function prevMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-brand result
// ─────────────────────────────────────────────────────────────────────────────

export interface BrandScanResult {
  brand: string;
  url: string;
  month: string;
  composite_score: number;
  llm_probing_score: number;
  structured_data_score: number;
  training_data_score: number;
  citation_sources_score: number;
  search_correlation_score: number;
  crawler_readiness_score: number;
  score_delta: number | null;
  changes_detected: number;
  stock_fetched: boolean;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function fetchPreviousSnapshot(
  brandUrl: string,
  month: string
): Promise<SnapshotRow | null> {
  const admin = getAdmin();
  const prev = prevMonth(month);
  const { data } = await admin
    .from("brand_snapshots")
    .select("*")
    .eq("brand_url", brandUrl)
    .eq("month", prev)
    .single();
  return data as SnapshotRow | null;
}

async function fetchPreviousScore(
  brandUrl: string,
  month: string
): Promise<number | null> {
  const admin = getAdmin();
  const prev = prevMonth(month);
  const { data } = await admin
    .from("brand_index")
    .select("composite_score")
    .eq("brand_url", brandUrl)
    .eq("month", prev)
    .single();
  return (data as { composite_score: number | null } | null)?.composite_score ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Single-brand scan
// ─────────────────────────────────────────────────────────────────────────────

export async function scanBrand(
  brand: Brand,
  month: string
): Promise<BrandScanResult> {
  const admin = getAdmin();

  // ── 1. LLM probing via existing scan engine ───────────────────────────────

  let scanOutput: ScanOutput | null = null;
  let llm_probing_score = 0;
  let mentionRate = 0;
  let avgPosition: number | null = null;
  let recommendationRate = 0;
  let sentiment: string | null = null;
  let chatgptScore: number | null = null;
  let claudeScore: number | null = null;
  let geminiScore: number | null = null;
  let competitors: unknown[] = [];
  let keyDescriptors: string[] = [];
  let categoryScores: Record<string, number> = {};

  try {
    scanOutput = await runScan({
      brand: brand.name,
      category: brand.category,
      url: brand.url,
      reportConfig: { type: "standard", addons: [], extra_competitors: 0 },
      models: { chatgpt: true, claude: true, gemini: true },
    });

    llm_probing_score = scanOutput.overall_score;
    categoryScores = scanOutput.category_scores ?? {};

    // Extract per-model scores
    for (const r of scanOutput.results) {
      if (r.model === "chatgpt") chatgptScore = r.score;
      else if (r.model === "claude") claudeScore = r.score;
      else if (r.model === "gemini") geminiScore = r.score;
    }

    // Brand profile metrics
    const bp = scanOutput.competitors_data?.brand_profile;
    if (bp) {
      mentionRate = bp.mention_rate;
      avgPosition = bp.avg_position ?? null;
      recommendationRate = bp.recommend_count / Math.max(bp.total_queries, 1);
      sentiment = bp.sentiment;
    }

    // Competitor list
    competitors = (scanOutput.competitors_data?.competitors ?? [])
      .slice(0, 5)
      .map((c) => ({ name: c.name, mention_rate: c.mention_rate }));

    // Key descriptors from perception data
    keyDescriptors = [
      ...(scanOutput.perception_data?.positive_descriptors ?? []),
      ...(scanOutput.perception_data?.negative_descriptors ?? []),
    ].slice(0, 10);
  } catch (err) {
    console.error(`[index-scanner] LLM scan failed for ${brand.name}:`, err);
  }

  // ── 2-5. Parallel free signals ─────────────────────────────────────────────

  const [structuredData, trainingData, citationSources, searchCorrelation] =
    await Promise.all([
      analyzeStructuredData(brand.url).catch((e) => {
        console.error(`[index-scanner] Signal 2 failed for ${brand.name}:`, e);
        return null;
      }),
      analyzeTrainingData(brand.name, brand.url).catch((e) => {
        console.error(`[index-scanner] Signal 3 failed for ${brand.name}:`, e);
        return null;
      }),
      analyzeCitationSources(brand.name, brand.url, scanOutput).catch((e) => {
        console.error(`[index-scanner] Signal 4 failed for ${brand.name}:`, e);
        return null;
      }),
      analyzeSearchCorrelation(brand.name, brand.url, brand.category).catch((e) => {
        console.error(`[index-scanner] Signal 5 failed for ${brand.name}:`, e);
        return null;
      }),
    ]);

  // ── 6. Crawler readiness derived from Signal 2 ────────────────────────────

  const crawlerScore = crawlerReadinessScore(
    structuredData?.allowed_crawler_count ?? 0
  );

  // ── Composite score ───────────────────────────────────────────────────────

  const signals: SignalScores = {
    llm_probing: llm_probing_score,
    structured_data: structuredData?.score ?? 0,
    training_data: trainingData?.score ?? 0,
    citation_sources: citationSources?.score ?? 0,
    search_correlation: searchCorrelation?.score ?? 50,
    crawler_readiness: crawlerScore,
  };

  const { composite } = computeCompositeScore(signals);

  // ── Previous month comparison ─────────────────────────────────────────────

  const [prevSnapshot, prevScore] = await Promise.all([
    fetchPreviousSnapshot(brand.url, month),
    fetchPreviousScore(brand.url, month),
  ]);

  const score_delta = prevScore !== null ? composite - prevScore : null;

  // ── Change detection ──────────────────────────────────────────────────────

  const currentSnapshotRow: SnapshotRow = {
    brand_url: brand.url,
    month,
    homepage_h1: structuredData?.h1_text ?? null,
    meta_description: structuredData?.meta_description ?? null,
    llms_txt_exists: structuredData?.llms_txt_exists ?? false,
    llms_txt_length: structuredData?.llms_txt_length ?? 0,
    schema_types: structuredData?.schema_types ?? [],
    faq_schema_exists: structuredData?.has_faq_schema ?? false,
    org_schema_exists: structuredData?.has_org_schema ?? false,
    robots_txt_ai_rules: (structuredData?.ai_crawlers ?? {}) as Record<string, { allowed: boolean | null }>,
    sitemap_exists: structuredData?.sitemap_exists ?? false,
  };

  const changes = detectChanges(prevSnapshot, currentSnapshotRow);

  // ── Stock price ───────────────────────────────────────────────────────────

  let stockData = null;
  if (brand.stock_ticker) {
    stockData = await fetchStockData(brand.stock_ticker).catch(() => null);
    if (stockData) {
      await upsertStockPrice(stockData, month);
    }
  }

  // ── Website snapshot JSON (for brand_index.website_snapshot) ──────────────

  const websiteSnapshot = structuredData
    ? {
        llms_txt_exists: structuredData.llms_txt_exists,
        llms_txt_quality: structuredData.llms_txt_quality,
        has_faq_schema: structuredData.has_faq_schema,
        has_org_schema: structuredData.has_org_schema,
        has_product_schema: structuredData.has_product_schema,
        schema_types: structuredData.schema_types,
        allowed_crawler_count: structuredData.allowed_crawler_count,
        sitemap_exists: structuredData.sitemap_exists,
        word_count: structuredData.word_count,
        page_load_ms: structuredData.page_load_ms,
      }
    : {};

  // ── Signal details JSON ───────────────────────────────────────────────────

  const signalDetails = {
    structured_data: structuredData ?? null,
    training_data: trainingData ?? null,
    citation_sources: citationSources ?? null,
    search_correlation: searchCorrelation ?? null,
  };

  // ── Persist brand_index ───────────────────────────────────────────────────

  const { error: indexError } = await admin.from("brand_index").upsert(
    {
      brand_name: brand.name,
      brand_url: brand.url,
      category: brand.category,
      month,
      composite_score: composite,
      llm_probing_score: llm_probing_score,
      structured_data_score: structuredData?.score ?? null,
      training_data_score: trainingData?.score ?? null,
      citation_sources_score: citationSources?.score ?? null,
      search_correlation_score: searchCorrelation?.score ?? null,
      crawler_readiness_score: crawlerScore,
      signal_details: signalDetails,
      chatgpt_score: chatgptScore,
      claude_score: claudeScore,
      gemini_score: geminiScore,
      category_scores: categoryScores,
      mention_rate: mentionRate,
      avg_position: avgPosition,
      recommendation_rate: recommendationRate,
      sentiment,
      competitors,
      key_descriptors: keyDescriptors,
      website_snapshot: websiteSnapshot,
      changes_detected: changes,
      score_delta,
      stock_ticker: brand.stock_ticker ?? null,
      stock_price_close: stockData?.close_price ?? null,
      stock_price_change_pct: stockData?.change_pct ?? null,
      market_cap_billions: stockData?.market_cap_billions ?? null,
    },
    { onConflict: "brand_url,month" }
  );

  if (indexError) {
    console.error(`[index-scanner] brand_index upsert failed for ${brand.name}:`, indexError.message);
  }

  // ── Persist brand_snapshots ───────────────────────────────────────────────

  if (structuredData) {
    const { error: snapError } = await admin.from("brand_snapshots").upsert(
      {
        brand_url: brand.url,
        month,
        homepage_h1: structuredData.h1_text,
        meta_description: structuredData.meta_description,
        llms_txt_exists: structuredData.llms_txt_exists,
        llms_txt_length: structuredData.llms_txt_length,
        schema_types: structuredData.schema_types,
        faq_schema_exists: structuredData.has_faq_schema,
        org_schema_exists: structuredData.has_org_schema,
        robots_txt_ai_rules: structuredData.ai_crawlers,
        sitemap_exists: structuredData.sitemap_exists,
        sitemap_url_count: structuredData.sitemap_url_count,
        page_load_ms: structuredData.page_load_ms,
        word_count: structuredData.word_count,
        h2_count: structuredData.h2_count,
      },
      { onConflict: "brand_url,month" }
    );

    if (snapError) {
      console.error(`[index-scanner] brand_snapshots upsert failed for ${brand.name}:`, snapError.message);
    }
  }

  return {
    brand: brand.name,
    url: brand.url,
    month,
    composite_score: composite,
    llm_probing_score: llm_probing_score,
    structured_data_score: structuredData?.score ?? 0,
    training_data_score: trainingData?.score ?? 0,
    citation_sources_score: citationSources?.score ?? 0,
    search_correlation_score: searchCorrelation?.score ?? 50,
    crawler_readiness_score: crawlerScore,
    score_delta,
    changes_detected: changes.length,
    stock_fetched: !!stockData,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Batch runner (used by cron)
// ─────────────────────────────────────────────────────────────────────────────

export interface BatchScanOptions {
  brands: Brand[];
  month?: string;
  /** Milliseconds to wait between brands. Default: 5000 */
  delayMs?: number;
}

export async function runBatchScan(
  options: BatchScanOptions
): Promise<BrandScanResult[]> {
  const { brands, month = currentMonth(), delayMs = 5_000 } = options;
  const results: BrandScanResult[] = [];

  for (let i = 0; i < brands.length; i++) {
    const brand = brands[i];
    console.log(`[index-scanner] Scanning ${i + 1}/${brands.length}: ${brand.name}`);

    try {
      const result = await scanBrand(brand, month);
      results.push(result);
      console.log(
        `[index-scanner] ${brand.name} done — composite: ${result.composite_score}, delta: ${result.score_delta ?? "N/A"}`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[index-scanner] Fatal error for ${brand.name}:`, msg);
      results.push({
        brand: brand.name,
        url: brand.url,
        month,
        composite_score: 0,
        llm_probing_score: 0,
        structured_data_score: 0,
        training_data_score: 0,
        citation_sources_score: 0,
        search_correlation_score: 50,
        crawler_readiness_score: 0,
        score_delta: null,
        changes_detected: 0,
        stock_fetched: false,
        error: msg,
      });
    }

    if (i < brands.length - 1 && delayMs > 0) {
      await sleep(delayMs);
    }
  }

  return results;
}
