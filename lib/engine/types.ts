// Shared types for the ShowsUp scan engine.
// Used by API routes, CLI, and cloud v1 API.

export interface ReportConfig {
  type: "quick_check" | "standard" | "deep";
  addons: string[];
  extra_competitors: number;
}

export interface AnalysisResult {
  brand_mentioned: boolean;
  mention_position: number | null;
  is_recommended: boolean;
  sentiment: "positive" | "neutral" | "negative" | null;
  sentiment_reason: string;
  brand_description: string | null;
  key_phrases: string[];
  competitors_found: Array<{
    name: string;
    position: number;
    is_recommended: boolean;
    sentiment: string | null;
  }>;
  cited_urls: string[];
  key_context: string;
}

export interface CompetitorProfile {
  name: string;
  mention_count: number;
  total_queries: number;
  mention_rate: number;
  avg_position: number | null;
  recommend_count: number;
  sentiment: "positive" | "neutral" | "negative" | null;
}

export interface BrandProfile extends CompetitorProfile {
  sentiment_breakdown: { positive: number; neutral: number; negative: number };
  sentiment_by_model: Record<string, "positive" | "neutral" | "negative">;
  example_quotes: Array<{ model: string; prompt: string; key_context: string }>;
}

export interface CompetitorsData {
  brand_profile: BrandProfile;
  competitors: CompetitorProfile[];
  share_of_voice: Array<{ name: string; share: number; mentions: number; isBrand: boolean }>;
  insights: string[];
  recommendations?: Recommendation[];
}

export interface PerceptionData {
  summary: string;
  positive_descriptors: string[];
  negative_descriptors: string[];
  perception_mismatches: string[];
}

export interface CitationData {
  cited_pages: Array<{ url: string; count: number }>;
  total_citations: number;
  insight: string;
}

export interface ImprovementPlanItem {
  title: string;
  description: string;
  impact: string;
  effort: string;
  affected_categories: string[];
}

export interface ImprovementPlan {
  quick_wins: ImprovementPlanItem[];
  this_month: ImprovementPlanItem[];
  this_quarter: ImprovementPlanItem[];
}

export interface BenchmarkProfile {
  score: number;
  mention_rate: number;
  avg_position: number;
  recommend_rate: number;
}

export interface BenchmarkData {
  leader: BenchmarkProfile;
  average: BenchmarkProfile;
  new_entrant: BenchmarkProfile;
}

export interface Recommendation {
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
}

export interface ModelPromptResult {
  promptId: string;
  auditQueryId: string;
  scoreCategory: string;
  prompt: string;
  response: string;
  analysis: AnalysisResult;
  mentioned: boolean;
  count: number;
  score: number;
  error?: string;
}

export interface ModelResult {
  model: string;
  label: string;
  score: number;
  mentioned: boolean;
  prompts: ModelPromptResult[];
}

export interface ScanQuery {
  id: string;
  auditId: string;
  text: string;
  scoreCategory: string;
  isCommerce: boolean;
}

export interface ScanInput {
  brand: string;
  category: string;
  niche?: string;
  url?: string;
  competitors?: string[];
  reportConfig?: ReportConfig | null;
  models?: { chatgpt?: boolean; claude?: boolean };
  regions?: string[]; // region codes e.g. ['global','us','sg']; defaults to ['global']
}

export interface RegionalScore {
  score: number;
  mention_rate: number;
  avg_position: number | null;
  sentiment: "positive" | "neutral" | "negative" | null;
  top_competitor: string | null;
}

export interface ScanOutput {
  brand: string;
  category: string;
  url: string;
  overall_score: number;
  category_scores: Record<string, number>;
  results: ModelResult[];
  recommendations: Recommendation[];
  competitors_data: CompetitorsData;
  perception_data: PerceptionData | null;
  citation_data: CitationData | null;
  improvement_plan: ImprovementPlan | null;
  benchmark_data: BenchmarkData | null;
  queries: ScanQuery[];
  regional_scores?: Record<string, RegionalScore>;
  regional_insights?: string[];
}
