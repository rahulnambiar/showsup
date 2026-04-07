/**
 * Monthly summary generator.
 * After all brands are scanned for a month, auto-generates a brand_insights
 * entry with type='finding' summarising key trends.
 */

import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

interface BrandIndexRow {
  brand_name: string;
  brand_url: string;
  category: string;
  composite_score: number | null;
  score_delta: number | null;
  llm_probing_score: number | null;
  structured_data_score: number | null;
  training_data_score: number | null;
  citation_sources_score: number | null;
  search_correlation_score: number | null;
  crawler_readiness_score: number | null;
  changes_detected: unknown[];
  website_snapshot: Record<string, unknown>;
}

export interface MonthlySummaryData {
  month: string;
  total_brands_scanned: number;
  top_10: Array<{ brand: string; category: string; score: number }>;
  biggest_gainers: Array<{ brand: string; category: string; delta: number; score: number }>;
  biggest_losers: Array<{ brand: string; category: string; delta: number; score: number }>;
  category_averages: Record<string, number>;
  llms_txt_adoption: { count: number; pct: number };
  total_changes_detected: number;
  notable_changes: Array<{ brand: string; change_type: string; detail: string }>;
}

export async function generateMonthlySummary(month: string): Promise<MonthlySummaryData | null> {
  const admin = getAdmin();

  const { data: rows, error } = await admin
    .from("brand_index")
    .select(
      "brand_name, brand_url, category, composite_score, score_delta, llm_probing_score, structured_data_score, training_data_score, citation_sources_score, search_correlation_score, crawler_readiness_score, changes_detected, website_snapshot"
    )
    .eq("month", month)
    .not("composite_score", "is", null);

  if (error || !rows || rows.length === 0) {
    console.error("[summary] No data for month:", month, error?.message);
    return null;
  }

  const brands = rows as BrandIndexRow[];

  // ── Top 10 ────────────────────────────────────────────────────────────────

  const top_10 = brands
    .filter((b) => b.composite_score !== null)
    .sort((a, b) => (b.composite_score ?? 0) - (a.composite_score ?? 0))
    .slice(0, 10)
    .map((b) => ({ brand: b.brand_name, category: b.category, score: b.composite_score! }));

  // ── Movers (require previous month score_delta) ───────────────────────────

  const withDelta = brands.filter((b) => b.score_delta !== null);

  const biggest_gainers = withDelta
    .filter((b) => (b.score_delta ?? 0) > 0)
    .sort((a, b) => (b.score_delta ?? 0) - (a.score_delta ?? 0))
    .slice(0, 5)
    .map((b) => ({
      brand: b.brand_name,
      category: b.category,
      delta: b.score_delta!,
      score: b.composite_score ?? 0,
    }));

  const biggest_losers = withDelta
    .filter((b) => (b.score_delta ?? 0) < 0)
    .sort((a, b) => (a.score_delta ?? 0) - (b.score_delta ?? 0))
    .slice(0, 5)
    .map((b) => ({
      brand: b.brand_name,
      category: b.category,
      delta: b.score_delta!,
      score: b.composite_score ?? 0,
    }));

  // ── Category averages ─────────────────────────────────────────────────────

  const categoryMap: Record<string, number[]> = {};
  for (const b of brands) {
    if (b.composite_score === null) continue;
    if (!categoryMap[b.category]) categoryMap[b.category] = [];
    categoryMap[b.category].push(b.composite_score);
  }
  const category_averages: Record<string, number> = {};
  for (const [cat, scores] of Object.entries(categoryMap)) {
    category_averages[cat] = Math.round(scores.reduce((a, x) => a + x, 0) / scores.length);
  }

  // ── llms.txt adoption ─────────────────────────────────────────────────────

  const llmsTxtCount = brands.filter((b) => {
    const snap = b.website_snapshot as { llms_txt_exists?: boolean } | null;
    return snap?.llms_txt_exists === true;
  }).length;
  const llms_txt_adoption = {
    count: llmsTxtCount,
    pct: Math.round((llmsTxtCount / brands.length) * 100),
  };

  // ── Notable changes ───────────────────────────────────────────────────────

  type ChangeItem = { type: string; detail: string };
  const notable_changes: Array<{ brand: string; change_type: string; detail: string }> = [];
  let total_changes_detected = 0;

  for (const b of brands) {
    const changes = (b.changes_detected ?? []) as ChangeItem[];
    total_changes_detected += changes.length;
    for (const c of changes.slice(0, 2)) {
      notable_changes.push({ brand: b.brand_name, change_type: c.type, detail: c.detail });
    }
  }

  const summary: MonthlySummaryData = {
    month,
    total_brands_scanned: brands.length,
    top_10,
    biggest_gainers,
    biggest_losers,
    category_averages,
    llms_txt_adoption,
    total_changes_detected,
    notable_changes: notable_changes.slice(0, 20),
  };

  // ── Persist as brand_insights ─────────────────────────────────────────────

  const title = `Brand Index Monthly Report — ${month}`;
  const description =
    `Scanned ${summary.total_brands_scanned} brands. ` +
    `Top scorer: ${top_10[0]?.brand ?? "N/A"} (${top_10[0]?.score ?? "—"}). ` +
    `llms.txt adoption: ${llms_txt_adoption.count}/${summary.total_brands_scanned} brands (${llms_txt_adoption.pct}%). ` +
    `${total_changes_detected} website changes detected.`;

  const { error: insightError } = await admin.from("brand_insights").insert({
    insight_type: "finding",
    title,
    description,
    data_evidence: summary,
    months_analyzed: [month],
    brands_involved: top_10.map((b) => b.brand),
    confidence: "high",
    status: "draft",
  });

  if (insightError) {
    console.error("[summary] Failed to insert brand_insights:", insightError.message);
  }

  return summary;
}
