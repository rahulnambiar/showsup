import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { getBalance, deductTokens } from "@/lib/tokens";
import { calculateReportCost as calcDynamicCost } from "@/lib/pricing/cost-calculator";
import { generateQueries, type QueryConfig } from "@/lib/query-generator";

function getAdmin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

// ── Model callers ─────────────────────────────────────────────────────────────

async function callOpenAI(prompt: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], max_tokens: 400 }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "OpenAI error");
  return data.choices?.[0]?.message?.content ?? "";
}

async function callAnthropic(prompt: string, maxTokens = 400): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Anthropic error");
  return data.content?.[0]?.text ?? "";
}

async function callAnthropicSonnet(prompt: string, maxTokens = 800): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Anthropic Sonnet error");
  return data.content?.[0]?.text ?? "";
}

// ── Analysis via Claude Haiku ─────────────────────────────────────────────────

export interface AnalysisResult {
  brand_mentioned: boolean;
  mention_position: number | null;
  is_recommended: boolean;
  sentiment: "positive" | "neutral" | "negative" | null;
  sentiment_reason: string;
  brand_description: string | null;
  key_phrases: string[];
  competitors_found: Array<{ name: string; position: number; is_recommended: boolean; sentiment: string | null }>;
  cited_urls: string[];
  key_context: string;
}

function fallbackAnalysis(brand: string, response: string): AnalysisResult {
  const mentioned = response.toLowerCase().includes(brand.toLowerCase());
  return {
    brand_mentioned: mentioned,
    mention_position: mentioned ? 5 : null,
    is_recommended: false,
    sentiment: mentioned ? "neutral" : null,
    sentiment_reason: "Fallback: text match only",
    brand_description: null,
    key_phrases: [],
    competitors_found: [],
    cited_urls: [],
    key_context: mentioned
      ? `${brand} appears in the response`
      : `${brand} was not found in the response`,
  };
}

async function analyzeResponse(
  brand: string,
  category: string,
  query: string,
  scoreCategory: string,
  response: string
): Promise<AnalysisResult> {
  const truncated = response.length > 600 ? response.slice(0, 600) + "…" : response;
  const prompt = `Analyze this AI response about '${brand}' in the ${category} industry.
Query: '${query}'
Query Type: '${scoreCategory}' (one of: awareness, discovery, competitive, purchase_intent, alternatives, reputation, persona, commerce)
Response: '${truncated}'
Return ONLY valid JSON: { "brand_mentioned": true/false, "mention_position": 1-10 or null, "is_recommended": true/false, "sentiment": "positive"|"neutral"|"negative"|null, "sentiment_reason": "brief explanation", "brand_description": "how the AI described the brand in 1 sentence, or null", "key_phrases": ["phrase1", "phrase2"], "competitors_found": [{"name": "string", "position": number, "is_recommended": boolean, "sentiment": "positive"|"neutral"|"negative"|null}], "cited_urls": ["url1"], "key_context": "1-sentence summary of how brand was mentioned or why not" }`;

  try {
    const text = await callAnthropic(prompt, 700);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    const parsed = JSON.parse(jsonMatch[0]) as AnalysisResult;
    parsed.key_phrases   = Array.isArray(parsed.key_phrases)   ? parsed.key_phrases   : [];
    parsed.cited_urls    = Array.isArray(parsed.cited_urls)    ? parsed.cited_urls    : [];
    parsed.competitors_found = Array.isArray(parsed.competitors_found) ? parsed.competitors_found : [];
    parsed.brand_description = parsed.brand_description ?? null;
    return parsed;
  } catch {
    return fallbackAnalysis(brand, response);
  }
}

// ── Multi-dimensional scoring ─────────────────────────────────────────────────

function positionToScore(position: number | null, mentioned: boolean): number {
  if (!mentioned || position === null) return 0;
  if (position <= 1) return 100;
  if (position === 2) return 75;
  if (position === 3) return 50;
  return 25;
}

function sentimentToScore(sentiment: string | null, mentioned: boolean): number {
  if (!mentioned || sentiment === null) return 0;
  if (sentiment === "positive") return 100;
  if (sentiment === "neutral") return 60;
  if (sentiment === "negative") return 20;
  return 0;
}

function scoreFromAnalyses(analyses: AnalysisResult[]): number {
  if (analyses.length === 0) return 0;
  const n = analyses.length;
  const mentionRate       = (analyses.filter((a) => a.brand_mentioned).length / n) * 100;
  const positionScore     = analyses.reduce((s, a) => s + positionToScore(a.mention_position, a.brand_mentioned), 0) / n;
  const recommendScore    = (analyses.filter((a) => a.is_recommended).length / n) * 100;
  const sentimentScore    = analyses.reduce((s, a) => s + sentimentToScore(a.sentiment, a.brand_mentioned), 0) / n;
  return Math.round(mentionRate * 0.30 + positionScore * 0.25 + recommendScore * 0.25 + sentimentScore * 0.20);
}

// ── Category sub-scores ───────────────────────────────────────────────────────

function calculateCategorySubScores(
  allPromptResults: Array<{ scoreCategory: string; analysis: AnalysisResult }>
): Record<string, number> {
  const groups: Record<string, AnalysisResult[]> = {
    awareness: [], discovery: [], competitive: [],
    reputation: [], alternatives: [], purchase_intent: [],
  };
  for (const { scoreCategory, analysis } of allPromptResults) {
    if (scoreCategory && groups[scoreCategory]) groups[scoreCategory].push(analysis);
  }
  const scores: Record<string, number> = {};
  for (const [cat, analyses] of Object.entries(groups)) {
    scores[cat] = scoreFromAnalyses(analyses);
  }
  return scores;
}

// ── Competitor benchmarking ───────────────────────────────────────────────────

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
}

function buildBrandProfile(
  brand: string,
  allPromptResults: Array<{ model?: string; analysis: AnalysisResult }>
): BrandProfile {
  const totalQueries = allPromptResults.length;
  const analyses     = allPromptResults.map((p) => p.analysis);
  const mentioned    = allPromptResults.filter((p) => p.analysis.brand_mentioned);
  const positions    = mentioned
    .map((p) => p.analysis.mention_position)
    .filter((p): p is number => p !== null && p !== undefined);

  // Per-sentiment counts among brand-mentioned results
  let posCount = 0, neuCount = 0, negCount = 0;
  for (const { analysis: a } of mentioned) {
    if (a.sentiment === "positive") posCount++;
    else if (a.sentiment === "neutral") neuCount++;
    else if (a.sentiment === "negative") negCount++;
  }
  const sentTotal = Math.max(1, posCount + neuCount + negCount);
  const sentiment_breakdown = {
    positive: Math.round((posCount / sentTotal) * 100),
    neutral:  Math.round((neuCount / sentTotal) * 100),
    negative: Math.round((negCount / sentTotal) * 100),
  };

  const topSentiment = (
    posCount >= neuCount && posCount >= negCount ? (posCount > 0 ? "positive" : null)
    : negCount > neuCount ? "negative"
    : neuCount > 0 ? "neutral"
    : null
  ) as BrandProfile["sentiment"];

  // Per-model dominant sentiment
  const modelSentMap: Record<string, { pos: number; neu: number; neg: number }> = {};
  for (const { model, analysis: a } of mentioned) {
    if (!model) continue;
    if (!modelSentMap[model]) modelSentMap[model] = { pos: 0, neu: 0, neg: 0 };
    if (a.sentiment === "positive") modelSentMap[model]!.pos++;
    else if (a.sentiment === "neutral") modelSentMap[model]!.neu++;
    else if (a.sentiment === "negative") modelSentMap[model]!.neg++;
  }
  const sentiment_by_model: Record<string, "positive" | "neutral" | "negative"> = {};
  for (const [modelId, counts] of Object.entries(modelSentMap)) {
    sentiment_by_model[modelId] = counts.pos >= counts.neg && counts.pos >= counts.neu
      ? "positive"
      : counts.neg > counts.neu
      ? "negative"
      : "neutral";
  }

  // Example quotes (key_context from brand-mentioned results, up to 3)
  const example_quotes = mentioned
    .filter((p) => p.analysis.key_context && p.model)
    .slice(0, 3)
    .map((p) => ({ model: p.model!, prompt: p.analysis.key_context!, key_context: p.analysis.key_context! }));

  return {
    name: brand,
    mention_count: mentioned.length,
    total_queries: totalQueries,
    mention_rate: Math.round((mentioned.length / Math.max(1, totalQueries)) * 100),
    avg_position: positions.length > 0
      ? Math.round((positions.reduce((s, p) => s + p, 0) / positions.length) * 10) / 10
      : null,
    recommend_count: analyses.filter((a) => a.is_recommended).length,
    sentiment: topSentiment,
    sentiment_breakdown,
    sentiment_by_model,
    example_quotes,
  };
}

function buildCompetitorProfiles(
  brand: string,
  allPromptResults: Array<{ analysis: AnalysisResult }>
): CompetitorProfile[] {
  const brandLower = brand.toLowerCase();
  const totalQueries = allPromptResults.length;
  const profileMap = new Map<string, {
    displayName: string;
    positions: number[];
    recommend_count: number;
    mention_count: number;
  }>();

  for (const { analysis } of allPromptResults) {
    for (const comp of (analysis.competitors_found ?? [])) {
      if (!comp.name || comp.name.length < 2) continue;
      const key = comp.name.toLowerCase().trim();
      if (key.includes(brandLower) || brandLower.includes(key)) continue;
      if (!profileMap.has(key)) profileMap.set(key, { displayName: comp.name, positions: [], recommend_count: 0, mention_count: 0 });
      const entry = profileMap.get(key)!;
      entry.mention_count++;
      if (comp.position > 0) entry.positions.push(comp.position);
      if (comp.is_recommended) entry.recommend_count++;
    }
  }

  return Array.from(profileMap.values())
    .map((d) => ({
      name: d.displayName,
      mention_count: d.mention_count,
      total_queries: totalQueries,
      mention_rate: Math.round((d.mention_count / Math.max(1, totalQueries)) * 100),
      avg_position: d.positions.length > 0
        ? Math.round((d.positions.reduce((s, p) => s + p, 0) / d.positions.length) * 10) / 10
        : null,
      recommend_count: d.recommend_count,
      sentiment: null as null,
    }))
    .filter((c) => c.mention_count >= 1)
    .sort((a, b) => b.mention_count - a.mention_count)
    .slice(0, 4);
}

function calculateShareOfVoice(
  brandProfile: BrandProfile,
  competitors: CompetitorProfile[]
): CompetitorsData["share_of_voice"] {
  const all = [brandProfile, ...competitors.slice(0, 4)];
  const total = all.reduce((s, e) => s + e.mention_count, 0);
  if (total === 0) return [];
  return all.map((e, i) => ({
    name: e.name,
    share: Math.round((e.mention_count / total) * 100),
    mentions: e.mention_count,
    isBrand: i === 0,
  }));
}

async function generateCompetitiveInsights(
  brand: string,
  brandProfile: BrandProfile,
  competitors: CompetitorProfile[]
): Promise<string[]> {
  if (competitors.length === 0) return [];
  const lines = [
    `Brand: ${brand} — mentioned ${brandProfile.mention_rate}% of queries, avg position ${brandProfile.avg_position ?? "N/A"}, recommended ${brandProfile.recommend_count} times`,
    ...competitors.slice(0, 4).map(
      (c) => `Competitor ${c.name}: mentioned ${c.mention_rate}% of queries, avg position ${c.avg_position ?? "N/A"}, recommended ${c.recommend_count} times`
    ),
  ].join("\n");

  const prompt = `Based on this AI visibility comparison data:\n${lines}\nGenerate exactly 3 brief competitive insights (1 sentence each) about how the brand compares to competitors in AI visibility. Be specific with numbers. Return as JSON array of strings.`;
  try {
    const text  = await callAnthropic(prompt, 400);
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]) as string[];
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string").slice(0, 3) : [];
  } catch {
    return [];
  }
}

// ── Recommendations ───────────────────────────────────────────────────────────

interface Recommendation {
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
}

function fallbackRecommendations(brand: string, category: string, score: number): Recommendation[] {
  const recs: Recommendation[] = [];
  if (score < 30) {
    recs.push({ title: "Establish AI-friendly content", description: `Create clear, authoritative content about ${brand} that AI models can reference. Focus on your unique value proposition in ${category}.`, priority: "High" });
    recs.push({ title: "Build brand mentions across the web", description: "Get cited in industry publications, review sites, and comparison articles to increase your brand's presence in AI training data.", priority: "High" });
  } else if (score < 60) {
    recs.push({ title: "Strengthen competitive positioning", description: `Publish comparison content between ${brand} and key ${category} competitors to appear in alternative-seeking queries.`, priority: "High" });
  }
  recs.push({ title: "Optimize for category keywords", description: `Ensure your website prominently features ${category.toLowerCase()} terminology so AI models associate your brand with the right category.`, priority: "Medium" });
  recs.push({ title: "Gather and publish customer reviews", description: "AI models often cite review content. Actively collect testimonials and ensure they appear on authoritative platforms.", priority: "Medium" });
  recs.push({ title: "Monitor and track your AI visibility", description: "Run weekly scans to track progress and identify which query types are improving.", priority: "Low" });
  return recs.slice(0, 5);
}

async function generateRecommendations(
  brand: string,
  category: string,
  score: number,
  modelResults: Array<{ label: string; score: number; mentioned: boolean }>
): Promise<Recommendation[]> {
  try {
    const summary = modelResults.map((mr) => `${mr.label}: score ${mr.score}, mentioned: ${mr.mentioned}`).join("; ");
    const prompt = `You are an AI visibility consultant. A brand called "${brand}" in the ${category} category has been scanned across AI models. Overall score: ${score}/100. Per-model results: ${summary}.
Based on this data, provide exactly 3-5 actionable recommendations to improve their AI visibility score. Return ONLY a JSON array with this exact format, no other text:
[{"title":"...", "description":"...", "priority":"High"},{"title":"...", "description":"...", "priority":"Medium"},{"title":"...", "description":"...", "priority":"Low"}]
Priority must be exactly "High", "Medium", or "Low". Make recommendations specific to ${category} and their current score of ${score}.`;

    const response = await callAnthropic(prompt, 500);
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return fallbackRecommendations(brand, category, score);
    const parsed = JSON.parse(jsonMatch[0]) as Recommendation[];
    if (!Array.isArray(parsed) || parsed.length === 0) return fallbackRecommendations(brand, category, score);
    const valid = parsed.every((r) => typeof r.title === "string" && typeof r.description === "string" && ["High", "Medium", "Low"].includes(r.priority));
    if (!valid) return fallbackRecommendations(brand, category, score);
    return parsed.slice(0, 5);
  } catch {
    return fallbackRecommendations(brand, category, score);
  }
}

// ── Dynamic cost calculation from report config ───────────────────────────────

interface ReportConfig {
  type: "quick_check" | "standard" | "deep";
  addons: string[];
  extra_competitors: number;
}

function calculateTokenCost(config: ReportConfig | null): number {
  const addons = config?.addons ?? [];
  return calcDynamicCost({
    scanDepth:       (config?.type ?? 'standard') as 'quick_check' | 'standard' | 'deep',
    models:          ['gpt-4o-mini', 'claude-3-haiku'],
    competitorCount: config?.extra_competitors ?? 0,
    modules: {
      persona:         addons.includes('persona_analysis'),
      commerce:        addons.includes('commerce_deep_dive'),
      sentiment:       addons.includes('sentiment_deep_dive'),
      citations:       addons.includes('citation_tracking'),
      improvementPlan: addons.includes('improvement_plan'),
      categoryBenchmark: addons.includes('category_benchmark'),
    },
  }).totalTokens;
}

// ── Module: Sentiment Deep Dive ───────────────────────────────────────────────

export interface PerceptionData {
  summary: string;
  positive_descriptors: string[];
  negative_descriptors: string[];
  perception_mismatches: string[];
}

async function runSentimentDeepDive(
  brand: string,
  allPromptResults: Array<{ scoreCategory: string; analysis: AnalysisResult }>
): Promise<PerceptionData | null> {
  const descriptions = allPromptResults
    .filter((p) => p.analysis.brand_description)
    .map((p) => p.analysis.brand_description as string);
  const allPhrases = allPromptResults.flatMap((p) => p.analysis.key_phrases ?? []);
  if (descriptions.length === 0 && allPhrases.length === 0) return null;

  const prompt = `Based on these descriptions of "${brand}" from AI platforms: ${descriptions.join("; ")}
Key phrases used: ${allPhrases.join(", ")}
Summarize: 1) How AI perceives this brand in 2-3 sentences, 2) Top 5 positive descriptors, 3) Top 3 negative/neutral descriptors, 4) Any perception mismatches vs likely brand positioning.
Return ONLY valid JSON: { "summary": "...", "positive_descriptors": ["..."], "negative_descriptors": ["..."], "perception_mismatches": ["..."] }`;

  try {
    const text = await callAnthropic(prompt, 600);
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as PerceptionData;
  } catch {
    return null;
  }
}

// ── Module: Citation Tracking ─────────────────────────────────────────────────

export interface CitationData {
  cited_pages: Array<{ url: string; count: number }>;
  total_citations: number;
  insight: string;
}

function runCitationTracking(
  brand: string,
  allPromptResults: Array<{ analysis: AnalysisResult }>
): CitationData {
  const urlCounts = new Map<string, number>();
  for (const { analysis } of allPromptResults) {
    for (const url of (analysis.cited_urls ?? [])) {
      urlCounts.set(url, (urlCounts.get(url) ?? 0) + 1);
    }
  }
  const cited_pages = Array.from(urlCounts.entries())
    .map(([url, count]) => ({ url, count }))
    .sort((a, b) => b.count - a.count);
  const total_citations = cited_pages.reduce((s, p) => s + p.count, 0);
  const insight = cited_pages.length === 0
    ? `No pages from ${brand}'s domain were cited by AI models in this scan.`
    : `${cited_pages[0].url} was the most cited page (${cited_pages[0].count} citation${cited_pages[0].count !== 1 ? "s" : ""}).`;
  return { cited_pages, total_citations, insight };
}

// ── Module: Improvement Plan ──────────────────────────────────────────────────

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function fallbackImprovementPlan(brand: string, category: string, score: number): ImprovementPlan {
  return {
    quick_wins: [
      { title: "Add an AI-optimised FAQ page", description: `Create a concise FAQ on your website covering the most common questions about ${brand} in the ${category} space. AI models often pull from FAQ content.`, impact: "+5 pts", effort: "1 day", affected_categories: ["awareness", "discovery"] },
      { title: "Submit to AI data sources", description: "Ensure your brand is listed on Wikidata, Crunchbase, and industry directories — these are commonly referenced by AI training pipelines.", impact: "+4 pts", effort: "2 hours", affected_categories: ["awareness"] },
      { title: "Publish a brand comparison page", description: `Write a transparent comparison of ${brand} vs key competitors in ${category}. This directly improves competitive query responses.`, impact: "+6 pts", effort: "1 day", affected_categories: ["competitive", "alternatives"] },
    ],
    this_month: [
      { title: "Get featured in industry publications", description: `Pitch byline articles or product features to ${category} industry blogs and news sites. Third-party coverage is the strongest AI visibility signal.`, impact: "+8 pts", effort: "1 week", affected_categories: ["awareness", "reputation"] },
      { title: "Collect and publish case studies", description: "AI models cite specific outcomes and customer results. Publish 2-3 detailed case studies showing measurable results from using your product.", impact: "+7 pts", effort: "1 week", affected_categories: ["reputation", "purchase_intent"] },
      { title: "Build review presence on G2/Trustpilot", description: `Gather 10+ reviews on major review platforms. AI models frequently reference review sites when recommending ${category} solutions.`, impact: "+6 pts", effort: "2 weeks", affected_categories: ["reputation", "discovery"] },
    ],
    this_quarter: [
      { title: "Launch a thought leadership content series", description: `Publish 4-6 in-depth guides positioning ${brand} as the definitive resource in ${category}. Target long-tail questions AI models are likely to answer.`, impact: "+10 pts", effort: "1 month", affected_categories: ["discovery", "awareness", "reputation"] },
      { title: "Build strategic backlink profile", description: "Acquire links from authoritative domain sources in your industry. AI models weight heavily-cited sources more in their responses.", impact: "+9 pts", effort: "1 month", affected_categories: ["awareness", "competitive"] },
      { title: "Create a dedicated 'How it works' resource hub", description: `Build comprehensive documentation, tutorials, and explainers about how ${brand} solves ${category} problems. Structured, factual content is ideal for AI citation.`, impact: "+8 pts", effort: "3 weeks", affected_categories: ["discovery", "purchase_intent"] },
    ],
  };
}

async function runImprovementPlan(
  brand: string,
  category: string,
  finalScore: number,
  categoryScores: Record<string, number>,
  competitorsData: CompetitorsData
): Promise<ImprovementPlan> {
  const compSummary = competitorsData.competitors.slice(0, 3)
    .map((c) => `${c.name}: ${c.mention_rate}% mention rate, avg position ${c.avg_position ?? "N/A"}`)
    .join("; ");

  const prompt = `You are an AI visibility consultant. Generate a prioritised improvement plan for ${brand} (${category} industry).

Audit data:
- Overall Score: ${finalScore}/100
- Category Scores: ${JSON.stringify(categoryScores)}
- Competitors: ${compSummary || "none detected"}

Return ONLY this exact JSON structure with NO extra text, markdown, or explanation:
{"quick_wins":[{"title":"string","description":"string","impact":"+X pts","effort":"string","affected_categories":["string"]}],"this_month":[{"title":"string","description":"string","impact":"+X pts","effort":"string","affected_categories":["string"]}],"this_quarter":[{"title":"string","description":"string","impact":"+X pts","effort":"string","affected_categories":["string"]}]}

Rules: 3 items per tier, specific to ${brand} and ${category}, reference actual score gaps.`;

  try {
    const text = await callAnthropicSonnet(prompt, 1500);
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return fallbackImprovementPlan(brand, category, finalScore);
    const parsed = JSON.parse(match[0]) as ImprovementPlan;
    // Validate — use fallback if any tier is missing or empty
    const valid =
      Array.isArray(parsed.quick_wins) && parsed.quick_wins.length > 0 &&
      Array.isArray(parsed.this_month) && parsed.this_month.length > 0 &&
      Array.isArray(parsed.this_quarter) && parsed.this_quarter.length > 0;
    return valid ? parsed : fallbackImprovementPlan(brand, category, finalScore);
  } catch {
    return fallbackImprovementPlan(brand, category, finalScore);
  }
}

// ── Module: Category Benchmark ────────────────────────────────────────────────

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

async function runCategoryBenchmark(category: string): Promise<BenchmarkData | null> {
  const prompt = `For the ${category} industry, what would typical AI visibility scores look like for: a market leader, an average brand, and a new entrant?
Return ONLY valid JSON:
{
  "leader":      { "score": 0-100, "mention_rate": 0-100, "avg_position": 1-10, "recommend_rate": 0-100 },
  "average":     { "score": 0-100, "mention_rate": 0-100, "avg_position": 1-10, "recommend_rate": 0-100 },
  "new_entrant": { "score": 0-100, "mention_rate": 0-100, "avg_position": 1-10, "recommend_rate": 0-100 }
}`;

  try {
    const text = await callAnthropic(prompt, 400);
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as BenchmarkData;
  } catch {
    return null;
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const brand: string    = (body.brand    ?? "").trim();
    const category: string = (body.category ?? "Other").trim();
    const niche: string    = (body.niche    ?? "").trim();
    const url: string      = (body.url ?? body.website ?? "").trim();
    const reportConfig: ReportConfig | null = body.report_config ?? null;

    if (!brand) return NextResponse.json({ error: "Brand name is required" }, { status: 400 });

    // Token check — cost varies based on report config
    const tokenCost = calculateTokenCost(reportConfig);
    const balance = await getBalance(user.id);
    if (balance < tokenCost) {
      return NextResponse.json(
        { error: "Insufficient tokens", required: tokenCost, balance },
        { status: 402 }
      );
    }

    const passedCompetitors: string[] = Array.isArray(body.competitors)
      ? body.competitors.filter((c: unknown) => typeof c === "string" && c.trim()).slice(0, 8)
      : [];

    // Build query config — fall back to standard if none provided
    const queryConfig: QueryConfig = reportConfig
      ? { type: reportConfig.type, addons: reportConfig.addons ?? [] }
      : { type: "standard", addons: [] };

    // Generate queries — may call Claude for deep/addon queries
    const rawQueries = await generateQueries(
      brand, category, niche, passedCompetitors, queryConfig, callAnthropic
    );
    // Assign a stable UUID to each query so audit tables can be linked
    const queries = rawQueries.map((q) => ({
      ...q,
      auditId: crypto.randomUUID() as string,
      isCommerce: q.id.startsWith("c_") || q.id.startsWith("cc_"),
    }));

    const enabledModels = body.models ?? { chatgpt: true, claude: true };
    const allModels = [
      { id: "chatgpt", label: "ChatGPT", call: callOpenAI },
      { id: "claude",  label: "Claude",  call: (p: string) => callAnthropic(p) },
    ];
    const models = allModels.filter((m) => enabledModels[m.id] !== false);

    const modelResults = await Promise.all(
      models.map(async (model) => {
        const promptResults = await Promise.all(
          queries.map(async (q) => {
            try {
              const response = await model.call(q.text);
              const analysis = await analyzeResponse(brand, category, q.text, q.scoreCategory, response);
              const score = scoreFromAnalyses([analysis]);
              return { promptId: q.id, auditQueryId: q.auditId, scoreCategory: q.scoreCategory, prompt: q.text, response, analysis, mentioned: analysis.brand_mentioned, count: analysis.mention_position ?? 0, score };
            } catch (err) {
              const msg = err instanceof Error ? err.message : "Unknown error";
              const analysis = fallbackAnalysis(brand, "");
              return { promptId: q.id, auditQueryId: q.auditId, scoreCategory: q.scoreCategory, prompt: q.text, response: "", analysis, mentioned: false, count: 0, score: 0, error: msg };
            }
          })
        );

        const modelScore   = scoreFromAnalyses(promptResults.map((pr) => pr.analysis));
        const anyMentioned = promptResults.some((pr) => pr.mentioned);
        return { model: model.id, label: model.label, score: modelScore, mentioned: anyMentioned, prompts: promptResults };
      })
    );

    const finalScore = Math.round(
      modelResults.reduce((s, mr) => s + mr.score, 0) / Math.max(1, modelResults.length)
    );

    // Category sub-scores (across all platforms combined)
    const allPromptResults = modelResults.flatMap((mr) =>
      mr.prompts.map((p) => ({ model: mr.model, scoreCategory: p.scoreCategory, analysis: p.analysis }))
    );
    const categoryScores = calculateCategorySubScores(allPromptResults);

    // Competitor profiles (pure JS — zero extra API calls)
    const brandProfile  = buildBrandProfile(brand, allPromptResults);
    const competitors   = buildCompetitorProfiles(brand, allPromptResults);
    const shareOfVoice  = calculateShareOfVoice(brandProfile, competitors);

    const addons = reportConfig?.addons ?? [];

    // Recommendations, insights, and all selected modules — all in parallel
    const [
      recommendations,
      competitiveInsights,
      perceptionData,
      improvementPlan,
      benchmarkData,
    ] = await Promise.all([
      generateRecommendations(brand, category, finalScore, modelResults),
      generateCompetitiveInsights(brand, brandProfile, competitors),
      addons.includes("sentiment_deep_dive")
        ? runSentimentDeepDive(brand, allPromptResults)
        : Promise.resolve(null),
      // Improvement plan always runs — it's useful for every report
      runImprovementPlan(brand, category, finalScore, categoryScores, {
        brand_profile: brandProfile, competitors, share_of_voice: shareOfVoice, insights: [],
      }),
      addons.includes("category_benchmark")
        ? runCategoryBenchmark(category)
        : Promise.resolve(null),
    ]);

    // Citation tracking always runs (synchronous — no extra API calls)
    const citationData = runCitationTracking(brand, allPromptResults);

    const competitorsData: CompetitorsData & { recommendations?: typeof recommendations } = {
      brand_profile: brandProfile,
      competitors,
      share_of_voice: shareOfVoice,
      insights: competitiveInsights,
      recommendations,
    };

    // Persist to Supabase
    let scanId: string | null = null;
    try {
      let scan: { id: string } | null = null;

      const { data: fullScan, error: fullError } = await supabase
        .from("scans")
        .insert({
          user_id: user.id, brand_name: brand, website: url || null,
          category, status: "completed", overall_score: finalScore,
          category_scores: categoryScores, competitors_data: competitorsData,
          ...(perceptionData  && { perception_data:   perceptionData  }),
          ...(citationData    && { citation_data:      citationData    }),
          ...(improvementPlan && { improvement_plan:   improvementPlan }),
          ...(benchmarkData   && { benchmark_data:     benchmarkData   }),
        })
        .select("id").single();

      if (!fullError && fullScan?.id) {
        scan = fullScan;
      } else {
        console.error("[scans] full insert error:", fullError?.message, fullError?.details);
        const { data: minScan, error: minErr } = await supabase
          .from("scans")
          .insert({
            user_id: user.id, brand_name: brand, website: url || null,
            status: "completed", overall_score: finalScore,
            category_scores: categoryScores,
          })
          .select("id").single();
        if (minErr) console.error("[scans] fallback insert error:", minErr.message, minErr.details);
        scan = minScan ?? null;
      }

      if (scan?.id) {
        scanId = scan.id;

        // ── Normalised audit tables (service role bypasses RLS) ──────────────
        const admin = getAdmin();

        // ── scan_results — use admin to bypass RLS on insert ─────────────────
        // Core columns (guaranteed to exist): scan_id, model, prompt, response,
        //   brand_mentioned, mention_count, score
        // Optional columns added progressively — each tier falls back if the
        //   previous tier fails due to a missing column.
        const coreRows = modelResults.flatMap((mr) =>
          mr.prompts.map((pr) => ({
            scan_id: scanId, model: mr.model, prompt: pr.prompt, response: pr.response,
            brand_mentioned: pr.analysis.brand_mentioned,
            mention_count: pr.count,
            score: pr.score,
          }))
        );
        // Only insert columns confirmed to exist in this DB schema.
        // Missing from schema: is_recommended, sentiment, key_context, mention_position
        const { error: rowsError } = await admin.from("scan_results").insert(coreRows);
        if (rowsError) console.error("[scan_results] insert error:", rowsError.message, rowsError.details);
        try {
          // Map our score categories to the DB check-constraint values
          const queryTypeMap: Record<string, string> = {
            competitive:     "comparison",
            alternatives:    "comparison",
            reputation:      "review",
            awareness:       "recommendation",
            discovery:       "recommendation",
            purchase_intent: "recommendation",
          };

          // 1. brands — upsert by user + name, return id
          let brandId: string | null = null;
          const { data: existingBrand } = await admin
            .from("brands")
            .select("id")
            .eq("user_id", user.id)
            .ilike("name", brand)
            .maybeSingle();

          if (existingBrand?.id) {
            brandId = existingBrand.id;
          } else {
            const { data: newBrand, error: brandErr } = await admin
              .from("brands")
              .insert({ user_id: user.id, name: brand, domain: url || `${brand.toLowerCase().replace(/\s+/g, "")}.com`, category })
              .select("id").single();
            if (brandErr) console.error("[brands] insert error:", brandErr.message);
            else brandId = newBrand?.id ?? null;
          }

          if (!brandId) {
            console.error("[audit] skipping audit tables — no brand_id");
          } else {
            // 2. audits — one row per scan, linked to brand
            let auditId: string | null = null;
            const { data: auditRow, error: auditErr } = await admin
              .from("audits")
              .insert({ brand_id: brandId, user_id: user.id })
              .select("id").single();
            if (auditErr) {
              // Retry without user_id in case it's not a column
              const { data: auditRow2, error: auditErr2 } = await admin
                .from("audits")
                .insert({ brand_id: brandId })
                .select("id").single();
              if (auditErr2) console.error("[audits] insert error:", auditErr2.message);
              else auditId = auditRow2?.id ?? null;
            } else {
              auditId = auditRow?.id ?? null;
            }

            if (!auditId) {
              console.error("[audit] no audit id returned");
            } else {
              // 3. audit_queries — one row per unique query
              const auditQueryRows = queries.map((q) => ({
                id:          q.auditId,
                audit_id:    auditId,
                query_text:  q.text,
                query_type:  queryTypeMap[q.scoreCategory] ?? "recommendation",
                is_commerce: q.isCommerce,
              }));
              const { error: aqErr } = await admin.from("audit_queries").insert(auditQueryRows);
              if (aqErr) {
                console.error("[audit_queries] insert error:", aqErr.message, aqErr.details);
              } else {
                // 4. audit_results — one row per model × query (requires audit_queries to exist first)
                const auditResultRows = modelResults.flatMap((mr) => {
                  const provider   = mr.model === "chatgpt" ? "openai" : "anthropic";
                  const model_tier = "free"; // DB allows: "free" | "paid"
                  return mr.prompts.map((pr) => ({
                    audit_id:              auditId,
                    audit_query_id:        pr.auditQueryId,
                    provider,
                    model:                 mr.model,
                    model_tier,
                    response_text:         pr.response,
                    brand_mentioned:       pr.analysis.brand_mentioned,
                    mention_position:      pr.analysis.mention_position ?? null,
                    sentiment:             pr.analysis.sentiment ?? null,
                    is_recommended:        pr.analysis.is_recommended ?? false,
                    competitors_mentioned: pr.analysis.competitors_found?.map((c) => c.name) ?? [],
                  }));
                });
                const { error: arErr } = await admin.from("audit_results").insert(auditResultRows);
                if (arErr) console.error("[audit_results] insert error:", arErr.message, arErr.details);
              }
            }
          }
        } catch (e) {
          console.error("[audit tables] unexpected error:", e);
        }
      }
    } catch {
      // DB not set up — results still returned to client
    }

    // Deduct tokens
    await deductTokens(user.id, tokenCost, `Standard scan: ${brand}`, scanId ?? undefined);

    return NextResponse.json({
      scan_id: scanId, brand, category, url,
      overall_score: finalScore, category_scores: categoryScores,
      results: modelResults, recommendations, competitors_data: competitorsData,
      ...(perceptionData  && { perception_data:   perceptionData  }),
      ...(citationData    && { citation_data:      citationData    }),
      ...(improvementPlan && { improvement_plan:   improvementPlan }),
      ...(benchmarkData   && { benchmark_data:     benchmarkData   }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
