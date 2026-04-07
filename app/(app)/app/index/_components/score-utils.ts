// Shared score color utilities for the Brand Index dashboard.

export function scoreColor(n: number | null | undefined): string {
  if (n == null) return "text-gray-400";
  if (n >= 60) return "text-emerald-600";
  if (n >= 30) return "text-amber-600";
  return "text-red-500";
}

export function scoreBg(n: number | null | undefined): string {
  if (n == null) return "bg-gray-100 text-gray-400";
  if (n >= 60) return "bg-emerald-50 text-emerald-700";
  if (n >= 30) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-600";
}

export function scoreBorder(n: number | null | undefined): string {
  if (n == null) return "border-gray-200";
  if (n >= 60) return "border-emerald-200";
  if (n >= 30) return "border-amber-200";
  return "border-red-200";
}

export function scoreHex(n: number | null | undefined): string {
  if (n == null) return "#9CA3AF";
  if (n >= 60) return "#10B981";
  if (n >= 30) return "#F59E0B";
  return "#EF4444";
}

export function deltaColor(n: number | null | undefined): string {
  if (n == null || n === 0) return "text-gray-400";
  return n > 0 ? "text-emerald-600" : "text-red-500";
}

export function deltaPrefix(n: number | null | undefined): string {
  if (n == null || n === 0) return "—";
  return n > 0 ? `↑ +${n}` : `↓ ${n}`;
}

export const CATEGORY_COLORS: Record<string, string> = {
  "Technology":          "#10B981",
  "Automotive":          "#60A5FA",
  "Luxury":              "#C084FC",
  "Fashion":             "#F472B6",
  "Consumer Goods":      "#FBBF24",
  "Food & Beverage":     "#F97316",
  "Financial Services":  "#34D399",
  "Insurance":           "#A78BFA",
  "Entertainment":       "#38BDF8",
  "Media":               "#818CF8",
  "Travel":              "#FB923C",
  "Hospitality":         "#4ADE80",
  "Retail":              "#E879F9",
  "Telecom":             "#22D3EE",
  "Logistics":           "#FCD34D",
  "Healthcare":          "#86EFAC",
  "Industrial":          "#94A3B8",
  "Energy":              "#FCA5A5",
};

export interface BrandRow {
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
  avg_position: number | null;
  recommendation_rate: number | null;
  sentiment: string | null;
  score_delta: number | null;
  stock_ticker: string | null;
  stock_price_close: number | null;
  stock_price_change_pct: number | null;
  market_cap_billions: number | null;
  website_snapshot: Record<string, unknown> | null;
  changes_detected: Array<{ type: string; detail: string; old_value: unknown; new_value: unknown }>;
  signal_details: Record<string, unknown> | null;
}
