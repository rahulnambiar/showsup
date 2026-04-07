import { createClient } from "@supabase/supabase-js";
import { BRAND_INDEX } from "@/lib/brand-index/brands";
import { currentMonth, toSlug, domainToSlug } from "./utils";

export interface IndexRow {
  brand_name: string;
  brand_url: string;
  category: string;
  month: string;
  composite_score: number | null;
  llm_probing_score: number | null;
  structured_data_score: number | null;
  training_data_score: number | null;
  citation_sources_score: number | null;
  search_correlation_score: number | null;
  crawler_readiness_score: number | null;
  chatgpt_score: number | null;
  claude_score: number | null;
  gemini_score: number | null;
  mention_rate: number | null;
  score_delta: number | null;
  stock_ticker: string | null;
  stock_price_change_pct: number | null;
  market_cap_billions: number | null;
  website_snapshot: Record<string, unknown> | null;
  changes_detected: Array<{ type: string; detail: string }>;
  key_descriptors: string[];
  sentiment: string | null;
  avg_position: number | null;
  recommendation_rate: number | null;
  signal_details: Record<string, unknown> | null;
}

export interface PublishedInsight {
  id: string;
  title: string;
  description: string;
  insight_type: string;
  brands_involved: string[];
  months_analyzed: string[];
  confidence: string;
  published_at: string | null;
  data_evidence: Record<string, unknown>;
  category?: string | null;
}

export interface SnapshotRow {
  brand_url: string;
  month: string;
  llms_txt_exists: boolean;
  faq_schema_exists: boolean;
  org_schema_exists: boolean;
  robots_txt_ai_rules: Record<string, { allowed: boolean | null }>;
  sitemap_exists: boolean;
  word_count: number | null;
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

const SELECT_COLS = "brand_name,brand_url,category,month,composite_score,llm_probing_score,structured_data_score,training_data_score,citation_sources_score,search_correlation_score,crawler_readiness_score,chatgpt_score,claude_score,gemini_score,mention_rate,score_delta,stock_ticker,stock_price_change_pct,market_cap_billions,website_snapshot,changes_detected,key_descriptors,sentiment,avg_position,recommendation_rate,signal_details";

export async function getLatestMonth(): Promise<string> {
  const admin = getAdminClient();
  const { data } = await admin
    .from("brand_index")
    .select("month")
    .order("month", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as { month: string } | null)?.month ?? currentMonth();
}

export async function getIndexData(month?: string): Promise<IndexRow[]> {
  const admin = getAdminClient();
  const m = month ?? await getLatestMonth();
  const { data } = await admin
    .from("brand_index")
    .select(SELECT_COLS)
    .eq("month", m)
    .order("composite_score", { ascending: false, nullsFirst: false });
  return (data ?? []) as IndexRow[];
}

export async function getBrandHistory(brandUrl: string): Promise<IndexRow[]> {
  const admin = getAdminClient();
  const { data } = await admin
    .from("brand_index")
    .select(SELECT_COLS)
    .eq("brand_url", brandUrl)
    .order("month", { ascending: true });
  return (data ?? []) as IndexRow[];
}

export async function getBrandSnapshot(brandUrl: string, month: string): Promise<SnapshotRow | null> {
  const admin = getAdminClient();
  const { data } = await admin
    .from("brand_snapshots")
    .select("brand_url,month,llms_txt_exists,faq_schema_exists,org_schema_exists,robots_txt_ai_rules,sitemap_exists,word_count")
    .eq("brand_url", brandUrl)
    .eq("month", month)
    .maybeSingle();
  return data as SnapshotRow | null;
}

export async function getPublishedInsights(limit = 6): Promise<PublishedInsight[]> {
  const admin = getAdminClient();
  const { data } = await admin
    .from("brand_insights")
    .select("id,title,description,insight_type,brands_involved,months_analyzed,confidence,published_at,data_evidence")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as PublishedInsight[];
}

export async function getCategoryHistory(category: string): Promise<{ month: string; avg: number }[]> {
  const admin = getAdminClient();
  const { data } = await admin
    .from("brand_index")
    .select("month,composite_score")
    .eq("category", category)
    .not("composite_score", "is", null)
    .order("month", { ascending: true });

  if (!data || data.length === 0) return [];

  // Group by month → average
  const byMonth: Record<string, number[]> = {};
  for (const row of data as Array<{ month: string; composite_score: number }>) {
    if (!byMonth[row.month]) byMonth[row.month] = [];
    byMonth[row.month].push(row.composite_score);
  }
  return Object.entries(byMonth).map(([month, scores]) => ({
    month,
    avg: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
  }));
}

export interface UserBrandPageData {
  brand_name: string;
  website: string;
  category: string | null;
  overall_score: number | null;
  chatgpt_score: number | null;
  claude_score: number | null;
  gemini_score: number | null;
  scanned_at: string;
  scan_id: string;
}

export async function getUserBrandBySlug(slug: string): Promise<UserBrandPageData | null> {
  const admin = getAdminClient();
  type ScanRow = { id: string; brand_name: string; website: string; category: string | null; overall_score: number | null; created_at: string };
  const { data: scans } = await admin
    .from("scans")
    .select("id,brand_name,website,category,overall_score,created_at")
    .eq("status", "completed")
    .not("website", "is", null)
    .neq("website", "")
    .order("created_at", { ascending: false })
    .limit(500);

  if (!scans || scans.length === 0) return null;
  const match = (scans as ScanRow[]).find((s) => domainToSlug(s.website) === slug);
  if (!match) return null;

  // Per-model average scores from scan_results
  type ResultRow = { model: string; score: number };
  const { data: results } = await admin
    .from("scan_results")
    .select("model,score")
    .eq("scan_id", match.id);

  let chatgptScore: number | null = null;
  let claudeScore: number | null = null;
  let geminiScore: number | null = null;

  if (results && results.length > 0) {
    const byModel: Record<string, number[]> = {};
    for (const r of results as ResultRow[]) {
      if (!byModel[r.model]) byModel[r.model] = [];
      byModel[r.model].push(r.score);
    }
    const avg = (arr: number[]) => Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
    if (byModel.chatgpt) chatgptScore = avg(byModel.chatgpt);
    if (byModel.claude)  claudeScore  = avg(byModel.claude);
    if (byModel.gemini)  geminiScore  = avg(byModel.gemini);
  }

  return {
    brand_name:   match.brand_name,
    website:      match.website,
    category:     match.category,
    overall_score: match.overall_score,
    chatgpt_score: chatgptScore,
    claude_score:  claudeScore,
    gemini_score:  geminiScore,
    scanned_at:   match.created_at,
    scan_id:      match.id,
  };
}

export async function getUserBrandsForSitemap(): Promise<{ slug: string; scannedAt: string }[]> {
  const admin = getAdminClient();
  type ScanRow = { website: string; created_at: string };
  const { data } = await admin
    .from("scans")
    .select("website,created_at")
    .eq("status", "completed")
    .not("website", "is", null)
    .neq("website", "")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (!data) return [];

  const knownSlugs = new Set(BRAND_INDEX.map((b) => toSlug(b.name)));
  const seen = new Set<string>();
  const result: { slug: string; scannedAt: string }[] = [];

  for (const row of data as ScanRow[]) {
    const slug = domainToSlug(row.website);
    if (slug && !seen.has(slug) && !knownSlugs.has(slug)) {
      seen.add(slug);
      result.push({ slug, scannedAt: row.created_at });
    }
  }
  return result;
}

export async function getAllAvailableMonths(): Promise<string[]> {
  const admin = getAdminClient();
  const { data } = await admin
    .from("brand_index")
    .select("month")
    .order("month", { ascending: false });
  return Array.from(new Set((data ?? []).map((r: { month: string }) => r.month)));
}
