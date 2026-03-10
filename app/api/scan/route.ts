import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ── Prompts ───────────────────────────────────────────────────────────────────

const COMMERCE_CATEGORIES = ["Insurance", "Travel", "Finance", "E-commerce"];

function buildPrompts(brand: string, category: string) {
  const prompts = [
    { id: "direct",      text: `What is ${brand}? Describe what they do in 2-3 sentences.` },
    { id: "category",    text: `What are the top ${category} companies/tools? List 5-8.` },
    { id: "competitive", text: `Compare ${brand} with its main competitors in ${category}.` },
    { id: "reputation",  text: `${brand} reviews — is it worth using? What are pros and cons?` },
    { id: "alternatives",text: `What are the best alternatives to ${brand}?` },
    { id: "usecase",     text: `Best ${category} solutions for small businesses or startups.` },
  ];

  if (COMMERCE_CATEGORIES.includes(category)) {
    prompts.push({ id: "value",       text: `Which ${category} company should I choose for the best value?` });
    prompts.push({ id: "reliability", text: `Recommend a good ${category} option for someone looking for reliability.` });
  }

  return prompts;
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

// ── Analysis via Claude Haiku ─────────────────────────────────────────────────

export interface AnalysisResult {
  brand_mentioned: boolean;
  mention_position: number | null;
  is_recommended: boolean;
  sentiment: "positive" | "neutral" | "negative" | null;
  sentiment_reason: string;
  competitors_found: Array<{ name: string; position: number; is_recommended: boolean }>;
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
    competitors_found: [],
    key_context: mentioned
      ? `${brand} appears in the response`
      : `${brand} was not found in the response`,
  };
}

async function analyzeResponse(
  brand: string,
  category: string,
  query: string,
  response: string
): Promise<AnalysisResult> {
  const truncated = response.length > 600 ? response.slice(0, 600) + "…" : response;
  const prompt = `Analyze this AI response about the brand '${brand}' in the ${category} industry.
Query: '${query}'
Response: '${truncated}'
Return ONLY valid JSON: { "brand_mentioned": true/false, "mention_position": 1-10 or null, "is_recommended": true/false, "sentiment": "positive"|"neutral"|"negative"|null, "sentiment_reason": "brief explanation", "competitors_found": [{"name": "string", "position": number, "is_recommended": boolean}], "key_context": "1-sentence summary of how brand was mentioned or why not" }`;

  try {
    const text = await callAnthropic(prompt, 600);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    return JSON.parse(jsonMatch[0]) as AnalysisResult;
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

const PROMPT_CATEGORY_MAP: Record<string, string> = {
  direct:      "awareness",
  category:    "discovery",
  competitive: "competitive",
  reputation:  "reputation",
  alternatives:"alternatives",
  usecase:     "purchase_intent",
  value:       "purchase_intent",
  reliability: "purchase_intent",
};

function calculateCategorySubScores(
  allPromptResults: Array<{ promptId: string; analysis: AnalysisResult }>
): Record<string, number> {
  const groups: Record<string, AnalysisResult[]> = {
    awareness: [], discovery: [], competitive: [],
    reputation: [], alternatives: [], purchase_intent: [],
  };
  for (const { promptId, analysis } of allPromptResults) {
    const cat = PROMPT_CATEGORY_MAP[promptId];
    if (cat && groups[cat]) groups[cat].push(analysis);
  }
  const scores: Record<string, number> = {};
  for (const [cat, analyses] of Object.entries(groups)) {
    scores[cat] = scoreFromAnalyses(analyses);
  }
  return scores;
}

// ── Competitor extraction from analyses ───────────────────────────────────────

function extractCompetitorsFromAnalyses(
  modelResults: Array<{ model: string; prompts: Array<{ analysis: AnalysisResult }> }>
): Array<{ name: string; mentions: number; platforms: number }> {
  const counts: Record<string, { count: number; platforms: Set<string> }> = {};
  modelResults.forEach((mr) => {
    mr.prompts.forEach((pr) => {
      (pr.analysis.competitors_found ?? []).forEach((comp) => {
        if (!comp.name || comp.name.length < 2) return;
        if (!counts[comp.name]) counts[comp.name] = { count: 0, platforms: new Set() };
        counts[comp.name].count++;
        counts[comp.name].platforms.add(mr.model);
      });
    });
  });
  return Object.entries(counts)
    .map(([name, { count, platforms }]) => ({ name, mentions: count, platforms: platforms.size }))
    .filter((c) => c.mentions >= 1)
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 5);
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

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const brand: string    = (body.brand    ?? "").trim();
    const category: string = (body.category ?? "Other").trim();
    const url: string      = (body.url ?? body.website ?? "").trim();

    if (!brand) return NextResponse.json({ error: "Brand name is required" }, { status: 400 });

    const prompts = buildPrompts(brand, category);
    const enabledModels = body.models ?? { chatgpt: true, claude: true };
    const allModels = [
      { id: "chatgpt", label: "ChatGPT", call: callOpenAI },
      { id: "claude",  label: "Claude",  call: (p: string) => callAnthropic(p) },
    ];
    const models = allModels.filter((m) => enabledModels[m.id] !== false);

    const modelResults = await Promise.all(
      models.map(async (model) => {
        const promptResults = await Promise.all(
          prompts.map(async (p) => {
            try {
              const response = await model.call(p.text);
              // Analyze with Claude Haiku in parallel (already running after model call)
              const analysis = await analyzeResponse(brand, category, p.text, response);
              const score = scoreFromAnalyses([analysis]);
              return { promptId: p.id, prompt: p.text, response, analysis, mentioned: analysis.brand_mentioned, count: analysis.mention_position ?? 0, score };
            } catch (err) {
              const msg = err instanceof Error ? err.message : "Unknown error";
              const analysis = fallbackAnalysis(brand, "");
              return { promptId: p.id, prompt: p.text, response: "", analysis, mentioned: false, count: 0, score: 0, error: msg };
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
      mr.prompts.map((p) => ({ promptId: p.promptId, analysis: p.analysis }))
    );
    const categoryScores = calculateCategorySubScores(allPromptResults);

    // Competitors + recommendations in parallel
    const competitors = extractCompetitorsFromAnalyses(modelResults);
    const recommendations = await generateRecommendations(brand, category, finalScore, modelResults);

    // Persist to Supabase
    let scanId: string | null = null;
    try {
      let scan: { id: string } | null = null;

      const { data: fullScan, error: fullError } = await supabase
        .from("scans")
        .insert({ user_id: user.id, brand_name: brand, website: url || null, url: url || null, category, status: "completed", overall_score: finalScore, recommendations, category_scores: categoryScores })
        .select("id").single();

      if (!fullError && fullScan?.id) {
        scan = fullScan;
      } else {
        const { data: minScan } = await supabase
          .from("scans")
          .insert({ user_id: user.id, brand_name: brand, website: url || null, status: "completed", overall_score: finalScore })
          .select("id").single();
        scan = minScan ?? null;
      }

      if (scan?.id) {
        scanId = scan.id;
        const rows = modelResults.flatMap((mr) =>
          mr.prompts.map((pr) => ({
            scan_id: scanId, model: mr.model, prompt: pr.prompt, response: pr.response,
            brand_mentioned: pr.analysis.brand_mentioned, mention_count: pr.count, score: pr.score,
            mention_position: pr.analysis.mention_position, is_recommended: pr.analysis.is_recommended,
            sentiment: pr.analysis.sentiment, key_context: pr.analysis.key_context,
          }))
        );
        const { error: rowsError } = await supabase.from("scan_results").insert(rows);
        if (rowsError) {
          // Fallback: basic columns only
          await supabase.from("scan_results").insert(
            modelResults.flatMap((mr) =>
              mr.prompts.map((pr) => ({
                scan_id: scanId, model: mr.model, prompt: pr.prompt, response: pr.response,
                brand_mentioned: pr.analysis.brand_mentioned, mention_count: pr.count, score: pr.score,
              }))
            )
          );
        }
      }
    } catch {
      // DB not set up — results still returned to client
    }

    return NextResponse.json({ scan_id: scanId, brand, category, url, overall_score: finalScore, category_scores: categoryScores, results: modelResults, recommendations, competitors });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
