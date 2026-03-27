/**
 * ShowsUp scan engine — platform-agnostic.
 * Used by:
 *   - app/api/scan/route.ts (Next.js API route)
 *   - app/api/v1/scan/route.ts (cloud API)
 *   - cli/src/commands/scan.ts (CLI standalone mode)
 */

import { generateQueries, type QueryConfig } from "@/lib/query-generator";
import { getRegion, type Region } from "./regions";
import type {
  AnalysisResult, BrandProfile, CompetitorProfile, CompetitorsData,
  PerceptionData, CitationData, ImprovementPlan,
  BenchmarkData, Recommendation, ModelResult, ModelPromptResult,
  ScanInput, ScanOutput, ScanQuery, RegionalScore,
} from "./types";

// ── Provider availability warnings (fire once at module load) ─────────────────

if (!process.env.OPENAI_API_KEY)    console.log("ShowsUp: No OPENAI_API_KEY — ChatGPT disabled");
if (!process.env.ANTHROPIC_API_KEY) console.log("ShowsUp: No ANTHROPIC_API_KEY — Claude disabled, analysis uses text fallback");
if (!process.env.GOOGLE_AI_API_KEY) console.log("ShowsUp: No GOOGLE_AI_API_KEY — Gemini disabled");

// ── Custom errors ─────────────────────────────────────────────────────────────

export class RateLimitError extends Error {
  constructor(provider: string) {
    super(`Rate limit reached for ${provider}. Please try again later.`);
    this.name = "RateLimitError";
  }
}

// ── Model callers ─────────────────────────────────────────────────────────────

export async function callOpenAI(prompt: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], max_tokens: 400 }),
  });
  const data = await res.json() as { error?: { message?: string }; choices?: Array<{ message?: { content?: string } }> };
  if (res.status === 429) throw new RateLimitError("OpenAI");
  if (!res.ok) throw new Error(data.error?.message ?? "OpenAI error");
  return data.choices?.[0]?.message?.content ?? "";
}

export async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 400 },
      }),
    }
  );
  const data = await res.json() as {
    error?: { message?: string };
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  if (res.status === 429) throw new RateLimitError("Gemini");
  if (!res.ok) throw new Error(data.error?.message ?? "Gemini error");
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function openAIFallback(prompt: string, maxTokens: number, model: "gpt-4o-mini" | "gpt-4o" = "gpt-4o-mini"): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], max_tokens: maxTokens }),
  });
  const data = await res.json() as { error?: { message?: string }; choices?: Array<{ message?: { content?: string } }> };
  if (res.status === 429) throw new RateLimitError("OpenAI");
  if (!res.ok) throw new Error(data.error?.message ?? `OpenAI ${model} error`);
  return data.choices?.[0]?.message?.content ?? "";
}

export async function callAnthropic(prompt: string, maxTokens = 400): Promise<string> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] }),
    });
    const data = await res.json() as { error?: { message?: string }; content?: Array<{ text?: string }> };
    if (res.ok) return data.content?.[0]?.text ?? "";
    // Hard-throw on auth/permission/rate-limit errors (OpenAI fallback won't help for auth; propagate rate limits)
    if (res.status === 401 || res.status === 403) {
      throw new Error(data.error?.message ?? "Anthropic error");
    }
    if (res.status === 429) throw new RateLimitError("Anthropic");
    console.warn(`[scan] Claude Haiku ${res.status} — falling back to gpt-4o-mini`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Anthropic error") || msg.includes("OpenAI")) throw err; // re-throw hard errors
    console.warn("[scan] Claude Haiku unavailable — falling back to gpt-4o-mini:", msg);
  }
  return openAIFallback(prompt, maxTokens, "gpt-4o-mini");
}

export async function callAnthropicSonnet(prompt: string, maxTokens = 800): Promise<string> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] }),
    });
    const data = await res.json() as { error?: { message?: string }; content?: Array<{ text?: string }> };
    if (res.ok) return data.content?.[0]?.text ?? "";
    if (res.status === 401 || res.status === 403) {
      throw new Error(data.error?.message ?? "Anthropic Sonnet error");
    }
    console.warn(`[scan] Claude Sonnet ${res.status} — falling back to gpt-4o`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Anthropic") || msg.includes("OpenAI")) throw err;
    console.warn("[scan] Claude Sonnet unavailable — falling back to gpt-4o:", msg);
  }
  return openAIFallback(prompt, maxTokens, "gpt-4o");
}

// ── Analysis via Claude Haiku ─────────────────────────────────────────────────

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
    key_context: mentioned ? `${brand} appears in the response` : `${brand} was not found in the response`,
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
Query Type: '${scoreCategory}'
Response: '${truncated}'
Return ONLY valid JSON: { "brand_mentioned": true/false, "mention_position": 1-10 or null, "is_recommended": true/false, "sentiment": "positive"|"neutral"|"negative"|null, "sentiment_reason": "brief explanation", "brand_description": "how the AI described the brand in 1 sentence, or null", "key_phrases": ["phrase1", "phrase2"], "competitors_found": [{"name": "string", "position": number, "is_recommended": boolean, "sentiment": "positive"|"neutral"|"negative"|null}], "cited_urls": ["url1"], "key_context": "1-sentence summary" }`;
  try {
    const text = await callAnthropic(prompt, 700);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON");
    const parsed = JSON.parse(jsonMatch[0]) as AnalysisResult;
    parsed.key_phrases        = Array.isArray(parsed.key_phrases)        ? parsed.key_phrases        : [];
    parsed.cited_urls         = Array.isArray(parsed.cited_urls)         ? parsed.cited_urls         : [];
    parsed.competitors_found  = Array.isArray(parsed.competitors_found)  ? parsed.competitors_found  : [];
    parsed.brand_description  = parsed.brand_description ?? null;
    return parsed;
  } catch {
    return fallbackAnalysis(brand, response);
  }
}

// ── Scoring ───────────────────────────────────────────────────────────────────

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
  if (sentiment === "neutral")  return 60;
  if (sentiment === "negative") return 20;
  return 0;
}

export function scoreFromAnalyses(analyses: AnalysisResult[]): number {
  if (analyses.length === 0) return 0;
  const n = analyses.length;
  const mentionRate    = (analyses.filter((a) => a.brand_mentioned).length / n) * 100;
  const positionScore  = analyses.reduce((s, a) => s + positionToScore(a.mention_position, a.brand_mentioned), 0) / n;
  const recommendScore = (analyses.filter((a) => a.is_recommended).length / n) * 100;
  const sentimentScore = analyses.reduce((s, a) => s + sentimentToScore(a.sentiment, a.brand_mentioned), 0) / n;
  return Math.round(mentionRate * 0.30 + positionScore * 0.25 + recommendScore * 0.25 + sentimentScore * 0.20);
}

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

// ── Competitor profiles ───────────────────────────────────────────────────────

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
      : counts.neg > counts.neu ? "negative"
      : "neutral";
  }

  const example_quotes = mentioned
    .filter((p) => p.analysis.key_context && p.model)
    .slice(0, 3)
    .map((p) => ({ model: p.model!, prompt: p.analysis.key_context!, key_context: p.analysis.key_context! }));

  void analyses;
  return {
    name: brand,
    mention_count: mentioned.length,
    total_queries: totalQueries,
    mention_rate: Math.round((mentioned.length / Math.max(1, totalQueries)) * 100),
    avg_position: positions.length > 0
      ? Math.round((positions.reduce((s, p) => s + p, 0) / positions.length) * 10) / 10
      : null,
    recommend_count: allPromptResults.filter((p) => p.analysis.is_recommended).length,
    sentiment: topSentiment,
    sentiment_breakdown,
    sentiment_by_model,
    example_quotes,
  };
}

function buildCompetitorProfiles(
  brand: string,
  allPromptResults: Array<{ analysis: AnalysisResult }>,
  passedCompetitors: string[] = []
): CompetitorProfile[] {
  const brandLower    = brand.toLowerCase();
  const totalQueries  = allPromptResults.length;
  const profileMap    = new Map<string, { displayName: string; positions: number[]; recommend_count: number; mention_count: number }>();

  for (const name of passedCompetitors) {
    if (!name || name.length < 2) continue;
    const key = name.toLowerCase().trim();
    if (key.includes(brandLower) || brandLower.includes(key)) continue;
    if (!profileMap.has(key)) profileMap.set(key, { displayName: name, positions: [], recommend_count: 0, mention_count: 0 });
  }

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

  const passedLower = passedCompetitors.map((p) => p.toLowerCase().trim());
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
    .filter((c) => passedLower.includes(c.name.toLowerCase().trim()) || c.mention_count >= 1)
    .sort((a, b) => b.mention_count - a.mention_count)
    .slice(0, 8);
}

function calculateShareOfVoice(
  brandProfile: BrandProfile,
  competitors: CompetitorProfile[]
): CompetitorsData["share_of_voice"] {
  const all   = [brandProfile, ...competitors.slice(0, 4)];
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
    ...competitors.slice(0, 4).map((c) => `Competitor ${c.name}: mentioned ${c.mention_rate}% of queries, avg position ${c.avg_position ?? "N/A"}, recommended ${c.recommend_count} times`),
  ].join("\n");
  const prompt = `Based on this AI visibility comparison:\n${lines}\nGenerate exactly 3 brief competitive insights (1 sentence each). Return as JSON array of strings.`;
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

function fallbackRecommendations(brand: string, category: string, score: number): Recommendation[] {
  const recs: Recommendation[] = [];
  if (score < 30) {
    recs.push({ title: "Establish AI-friendly content", description: `Create clear, authoritative content about ${brand} that AI models can reference.`, priority: "High" });
    recs.push({ title: "Build brand mentions across the web", description: "Get cited in industry publications, review sites, and comparison articles.", priority: "High" });
  } else if (score < 60) {
    recs.push({ title: "Strengthen competitive positioning", description: `Publish comparison content between ${brand} and key ${category} competitors.`, priority: "High" });
  }
  recs.push({ title: "Optimize for category keywords", description: `Ensure your website prominently features ${category.toLowerCase()} terminology.`, priority: "Medium" });
  recs.push({ title: "Gather and publish customer reviews", description: "AI models often cite review content. Collect testimonials on authoritative platforms.", priority: "Medium" });
  recs.push({ title: "Monitor your AI visibility", description: "Run weekly scans to track progress.", priority: "Low" });
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
    const prompt = `You are an AI visibility consultant. Brand: "${brand}" in ${category}. Overall score: ${score}/100. Per-model: ${summary}.
Provide 3-5 actionable recommendations. Return ONLY JSON array:
[{"title":"...", "description":"...", "priority":"High"},...]
Priority must be "High", "Medium", or "Low".`;
    const response  = await callAnthropic(prompt, 500);
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return fallbackRecommendations(brand, category, score);
    const parsed = JSON.parse(jsonMatch[0]) as Recommendation[];
    if (!Array.isArray(parsed) || parsed.length === 0) return fallbackRecommendations(brand, category, score);
    const valid = parsed.every((r) => typeof r.title === "string" && ["High", "Medium", "Low"].includes(r.priority));
    return valid ? parsed.slice(0, 5) : fallbackRecommendations(brand, category, score);
  } catch {
    return fallbackRecommendations(brand, category, score);
  }
}

// ── Module: Sentiment Deep Dive ───────────────────────────────────────────────

async function runSentimentDeepDive(
  brand: string,
  allPromptResults: Array<{ scoreCategory: string; analysis: AnalysisResult }>
): Promise<PerceptionData | null> {
  const descriptions = allPromptResults.filter((p) => p.analysis.brand_description).map((p) => p.analysis.brand_description as string);
  const allPhrases   = allPromptResults.flatMap((p) => p.analysis.key_phrases ?? []);
  if (descriptions.length === 0 && allPhrases.length === 0) return null;
  const prompt = `Based on these descriptions of "${brand}" from AI platforms: ${descriptions.join("; ")}
Key phrases: ${allPhrases.join(", ")}
Return ONLY valid JSON: { "summary": "...", "positive_descriptors": ["..."], "negative_descriptors": ["..."], "perception_mismatches": ["..."] }`;
  try {
    const text  = await callAnthropic(prompt, 600);
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as PerceptionData;
  } catch {
    return null;
  }
}

// ── Module: Citation Tracking (sync) ─────────────────────────────────────────

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
    ? `No pages from ${brand}'s domain were cited in this scan.`
    : `${cited_pages[0].url} was the most cited page (${cited_pages[0].count} citation${cited_pages[0].count !== 1 ? "s" : ""}).`;
  return { cited_pages, total_citations, insight };
}

// ── Module: Improvement Plan ──────────────────────────────────────────────────

function fallbackImprovementPlan(brand: string, category: string, score: number): ImprovementPlan {
  return {
    quick_wins: [
      { title: "Add an AI-optimised FAQ page", description: `Create a FAQ covering common questions about ${brand} in ${category}.`, impact: "+5 pts", effort: "1 day", affected_categories: ["awareness", "discovery"] },
      { title: "Submit to AI data sources", description: "List your brand on Wikidata, Crunchbase, and industry directories.", impact: "+4 pts", effort: "2 hours", affected_categories: ["awareness"] },
      { title: "Publish a brand comparison page", description: `Write a transparent comparison of ${brand} vs key competitors.`, impact: "+6 pts", effort: "1 day", affected_categories: ["competitive", "alternatives"] },
    ],
    this_month: [
      { title: "Get featured in industry publications", description: `Pitch byline articles to ${category} industry blogs.`, impact: "+8 pts", effort: "1 week", affected_categories: ["awareness", "reputation"] },
      { title: "Collect and publish case studies", description: "Publish 2-3 detailed case studies showing measurable results.", impact: "+7 pts", effort: "1 week", affected_categories: ["reputation", "purchase_intent"] },
      { title: "Build review presence on G2/Trustpilot", description: `Gather 10+ reviews on major review platforms.`, impact: "+6 pts", effort: "2 weeks", affected_categories: ["reputation", "discovery"] },
    ],
    this_quarter: [
      { title: "Launch a thought leadership content series", description: `Publish 4-6 in-depth guides positioning ${brand} as a definitive resource.`, impact: "+10 pts", effort: "1 month", affected_categories: ["discovery", "awareness"] },
      { title: "Build strategic backlink profile", description: "Acquire links from authoritative sources in your industry.", impact: "+9 pts", effort: "1 month", affected_categories: ["awareness", "competitive"] },
      { title: "Create a 'How it works' resource hub", description: `Build comprehensive docs about how ${brand} solves ${category} problems.`, impact: "+8 pts", effort: "3 weeks", affected_categories: ["discovery", "purchase_intent"] },
    ],
  };
  void score;
}

async function runImprovementPlan(
  brand: string,
  category: string,
  finalScore: number,
  categoryScores: Record<string, number>,
  competitorsData: CompetitorsData
): Promise<ImprovementPlan> {
  const compSummary = competitorsData.competitors.slice(0, 3)
    .map((c) => `${c.name}: ${c.mention_rate}% mention rate`)
    .join("; ");
  const prompt = `Generate a prioritised improvement plan for ${brand} (${category}).
Score: ${finalScore}/100. Category scores: ${JSON.stringify(categoryScores)}. Competitors: ${compSummary || "none"}.
Return ONLY JSON: {"quick_wins":[{"title":"...","description":"...","impact":"+X pts","effort":"...","affected_categories":["..."]}],"this_month":[...],"this_quarter":[...]}
3 items per tier, specific to ${brand}.`;
  try {
    const text  = await callAnthropicSonnet(prompt, 1500);
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return fallbackImprovementPlan(brand, category, finalScore);
    const parsed = JSON.parse(match[0]) as ImprovementPlan;
    const valid  =
      Array.isArray(parsed.quick_wins) && parsed.quick_wins.length > 0 &&
      Array.isArray(parsed.this_month) && parsed.this_month.length > 0 &&
      Array.isArray(parsed.this_quarter) && parsed.this_quarter.length > 0;
    return valid ? parsed : fallbackImprovementPlan(brand, category, finalScore);
  } catch {
    return fallbackImprovementPlan(brand, category, finalScore);
  }
}

// ── Module: Category Benchmark ────────────────────────────────────────────────

async function runCategoryBenchmark(category: string): Promise<BenchmarkData | null> {
  const prompt = `For the ${category} industry, what would typical AI visibility scores look like for a market leader, average brand, and new entrant?
Return ONLY valid JSON:
{"leader":{"score":0-100,"mention_rate":0-100,"avg_position":1-10,"recommend_rate":0-100},"average":{...},"new_entrant":{...}}`;
  try {
    const text  = await callAnthropic(prompt, 400);
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as BenchmarkData;
  } catch {
    return null;
  }
}

// ── Regional scanning ─────────────────────────────────────────────────────────

async function runRegionalPass(
  brand: string,
  category: string,
  queries: ScanQuery[],
  region: Region,
  models: Array<{ id: string; call: (p: string) => Promise<string> }>
): Promise<RegionalScore> {
  const suffix = region.prompt_suffix;
  const regionalQueries = queries.map((q) => ({
    ...q,
    text: suffix ? `${q.text} ${suffix}` : q.text,
  }));

  const allAnalyses: AnalysisResult[] = [];
  await Promise.all(
    models.map(async (model) => {
      await Promise.all(
        regionalQueries.map(async (q) => {
          try {
            const response = await model.call(q.text);
            const analysis = await analyzeResponse(brand, category, q.text, q.scoreCategory, response);
            allAnalyses.push(analysis);
          } catch (err) {
            if (err instanceof RateLimitError) throw err;
            allAnalyses.push(fallbackAnalysis(brand, ""));
          }
        })
      );
    })
  );

  const score       = scoreFromAnalyses(allAnalyses);
  const mentioned   = allAnalyses.filter((a) => a.brand_mentioned);
  const mention_rate = Math.round((mentioned.length / Math.max(1, allAnalyses.length)) * 100);
  const positions   = mentioned.map((a) => a.mention_position).filter((p): p is number => p !== null);
  const avg_position = positions.length > 0
    ? Math.round((positions.reduce((s, p) => s + p, 0) / positions.length) * 10) / 10
    : null;

  const sentCounts = { positive: 0, neutral: 0, negative: 0 };
  for (const a of mentioned) {
    if (a.sentiment === "positive")  sentCounts.positive++;
    else if (a.sentiment === "neutral")  sentCounts.neutral++;
    else if (a.sentiment === "negative") sentCounts.negative++;
  }
  const sentiment = (
    sentCounts.positive >= sentCounts.neutral && sentCounts.positive >= sentCounts.negative
      ? (sentCounts.positive > 0 ? "positive" : null)
      : sentCounts.negative > sentCounts.neutral ? "negative"
      : sentCounts.neutral > 0 ? "neutral"
      : null
  ) as RegionalScore["sentiment"];

  const compCounts = new Map<string, number>();
  const brandLower = brand.toLowerCase();
  for (const a of allAnalyses) {
    for (const c of a.competitors_found ?? []) {
      if (c.name && !c.name.toLowerCase().includes(brandLower)) {
        compCounts.set(c.name, (compCounts.get(c.name) ?? 0) + 1);
      }
    }
  }
  const top_competitor = compCounts.size > 0
    ? Array.from(compCounts.entries()).sort((a, b) => b[1] - a[1])[0]![0]
    : null;

  return { score, mention_rate, avg_position, sentiment, top_competitor };
}

async function generateRegionalInsights(
  brand: string,
  regionalScores: Record<string, RegionalScore>
): Promise<string[]> {
  const lines = Object.entries(regionalScores)
    .map(([code, rs]) =>
      `${code}: score ${rs.score}, mention_rate ${rs.mention_rate}%, top_competitor ${rs.top_competitor ?? "none"}`
    )
    .join("\n");
  const prompt = `Analyze AI visibility of "${brand}" across these regions:\n${lines}\nGenerate exactly 3 insights comparing regional performance (1 sentence each). Return a JSON array of strings only.`;
  try {
    const text  = await callAnthropicSonnet(prompt, 400);
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]) as string[];
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string").slice(0, 3) : [];
  } catch {
    return [];
  }
}

// ── Main scan orchestration ───────────────────────────────────────────────────

export async function runScan(input: ScanInput): Promise<ScanOutput> {
  const {
    brand,
    category,
    niche     = "",
    url       = "",
    competitors: passedCompetitors = [],
    reportConfig  = null,
    models: enabledModels = {},
  } = input;

  const queryConfig: QueryConfig = reportConfig
    ? { type: reportConfig.type, addons: reportConfig.addons ?? [] }
    : { type: "standard", addons: [] };

  // Generate queries (deep mode calls Claude for extra queries)
  const rawQueries = await generateQueries(brand, category, niche, passedCompetitors, queryConfig, callAnthropic);
  const queries: ScanQuery[] = rawQueries.map((q) => ({
    ...q,
    auditId:    crypto.randomUUID(),
    isCommerce: q.id.startsWith("c_") || q.id.startsWith("cc_"),
  }));

  // Build model runners filtered by available keys
  const allModels = [
    ...(process.env.OPENAI_API_KEY    ? [{ id: "chatgpt", label: "ChatGPT", call: callOpenAI }]                    : []),
    ...(process.env.ANTHROPIC_API_KEY ? [{ id: "claude",  label: "Claude",  call: (p: string) => callAnthropic(p) }] : []),
    ...(process.env.GOOGLE_AI_API_KEY ? [{ id: "gemini",  label: "Gemini",  call: callGemini }]                    : []),
  ];
  const models = allModels.filter((m) => (enabledModels as Record<string, boolean>)[m.id] !== false);
  if (models.length === 0) {
    throw new Error("No LLM providers configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY in your environment.");
  }

  // Run queries on all models in parallel
  const modelResults: ModelResult[] = await Promise.all(
    models.map(async (model) => {
      const promptResults: ModelPromptResult[] = await Promise.all(
        queries.map(async (q) => {
          try {
            const response = await model.call(q.text);
            const analysis = await analyzeResponse(brand, category, q.text, q.scoreCategory, response);
            const score    = scoreFromAnalyses([analysis]);
            return {
              promptId: q.id, auditQueryId: q.auditId, scoreCategory: q.scoreCategory,
              prompt: q.text, response, analysis,
              mentioned: analysis.brand_mentioned, count: analysis.mention_position ?? 0, score,
            };
          } catch (err) {
            if (err instanceof RateLimitError) throw err; // propagate rate limit errors
            const msg      = err instanceof Error ? err.message : "Unknown error";
            const analysis = fallbackAnalysis(brand, "");
            return {
              promptId: q.id, auditQueryId: q.auditId, scoreCategory: q.scoreCategory,
              prompt: q.text, response: "", analysis,
              mentioned: false, count: 0, score: 0, error: msg,
            };
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

  const allPromptResults = modelResults.flatMap((mr) =>
    mr.prompts.map((p) => ({ model: mr.model, scoreCategory: p.scoreCategory, analysis: p.analysis }))
  );
  const categoryScores = calculateCategorySubScores(allPromptResults);

  const brandProfile  = buildBrandProfile(brand, allPromptResults);
  const competitors   = buildCompetitorProfiles(brand, allPromptResults, passedCompetitors);
  const shareOfVoice  = calculateShareOfVoice(brandProfile, competitors);
  const addons        = reportConfig?.addons ?? [];

  const [recommendations, competitiveInsights, perceptionData, improvementPlan, benchmarkData] = await Promise.all([
    generateRecommendations(brand, category, finalScore, modelResults),
    generateCompetitiveInsights(brand, brandProfile, competitors),
    addons.includes("sentiment_deep_dive") ? runSentimentDeepDive(brand, allPromptResults) : Promise.resolve(null),
    runImprovementPlan(brand, category, finalScore, categoryScores, {
      brand_profile: brandProfile, competitors, share_of_voice: shareOfVoice, insights: [],
    }),
    addons.includes("category_benchmark") ? runCategoryBenchmark(category) : Promise.resolve(null),
  ]);

  const citationData = runCitationTracking(brand, allPromptResults);

  // ── Regional scanning ───────────────────────────────────────────────────────
  let regional_scores: Record<string, RegionalScore> | undefined;
  let regional_insights: string[] | undefined;

  const regionCodes = (input.regions ?? ["global"]).filter(Boolean);
  const extraRegions = regionCodes.filter((c) => c !== "global");

  if (extraRegions.length > 0) {
    // Use global main result as the 'global' entry
    const globalScore: RegionalScore = {
      score:         finalScore,
      mention_rate:  brandProfile.mention_rate,
      avg_position:  brandProfile.avg_position,
      sentiment:     brandProfile.sentiment,
      top_competitor: competitors[0]?.name ?? null,
    };
    regional_scores = { global: globalScore };

    // Run additional regions in parallel
    const regionalResults = await Promise.all(
      extraRegions.map(async (code) => {
        const region = getRegion(code);
        const rs = await runRegionalPass(brand, category, queries, region, models);
        return { code, rs };
      })
    );
    for (const { code, rs } of regionalResults) {
      regional_scores[code] = rs;
    }

    regional_insights = await generateRegionalInsights(brand, regional_scores);
  }

  return {
    brand,
    category,
    url,
    overall_score: finalScore,
    category_scores: categoryScores,
    results: modelResults,
    recommendations,
    competitors_data: {
      brand_profile: brandProfile,
      competitors,
      share_of_voice: shareOfVoice,
      insights: competitiveInsights,
      recommendations,
    },
    perception_data: perceptionData ?? null,
    citation_data: citationData,
    improvement_plan: improvementPlan,
    benchmark_data: benchmarkData ?? null,
    queries,
    ...(regional_scores   && { regional_scores }),
    ...(regional_insights && { regional_insights }),
  };
}
