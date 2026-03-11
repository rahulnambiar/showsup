import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { getBalance, deductTokens } from "@/lib/tokens";
import { TOKEN_COSTS } from "@/lib/token-costs";
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

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface BrandProfile extends CompetitorProfile {}

export interface CompetitorsData {
  brand_profile: BrandProfile;
  competitors: CompetitorProfile[];
  share_of_voice: Array<{ name: string; share: number; mentions: number; isBrand: boolean }>;
  insights: string[];
}

function buildBrandProfile(
  brand: string,
  allPromptResults: Array<{ analysis: AnalysisResult }>
): BrandProfile {
  const totalQueries = allPromptResults.length;
  const analyses     = allPromptResults.map((p) => p.analysis);
  const mentioned    = analyses.filter((a) => a.brand_mentioned);
  const positions    = mentioned
    .map((a) => a.mention_position)
    .filter((p): p is number => p !== null && p !== undefined);

  const sentimentCounts: Record<string, number> = {};
  for (const a of mentioned) {
    if (a.sentiment) sentimentCounts[a.sentiment] = (sentimentCounts[a.sentiment] ?? 0) + 1;
  }
  const topSentiment = (
    Object.entries(sentimentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  ) as BrandProfile["sentiment"];

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
  if (!config) return TOKEN_COSTS.STANDARD_REPORT;

  const base: Record<string, number> = {
    quick_check: TOKEN_COSTS.QUICK_CHECK,
    standard:    TOKEN_COSTS.STANDARD_REPORT,
    deep:        TOKEN_COSTS.DEEP_ANALYSIS,
  };

  const ADDON_COSTS: Record<string, number> = {
    persona_analysis:    TOKEN_COSTS.PERSONA_ANALYSIS,
    commerce_deep_dive:  TOKEN_COSTS.COMMERCE_DEEP_DIVE,
    sentiment_deep_dive: TOKEN_COSTS.SENTIMENT_DEEP_DIVE,
    citation_tracking:   TOKEN_COSTS.CITATION_TRACKING,
    improvement_plan:    TOKEN_COSTS.IMPROVEMENT_PLAN,
    category_benchmark:  TOKEN_COSTS.CATEGORY_BENCHMARK,
  };

  const baseCost = base[config.type] ?? TOKEN_COSTS.STANDARD_REPORT;
  const addonCost = (config.addons ?? []).reduce((sum, k) => sum + (ADDON_COSTS[k] ?? 0), 0);
  const competitorCost = (config.extra_competitors ?? 0) * TOKEN_COSTS.ADD_COMPETITOR;
  return baseCost + addonCost + competitorCost;
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
              const analysis = await analyzeResponse(brand, category, q.text, response);
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
      mr.prompts.map((p) => ({ scoreCategory: p.scoreCategory, analysis: p.analysis }))
    );
    const categoryScores = calculateCategorySubScores(allPromptResults);

    // Competitor profiles (pure JS — zero extra API calls)
    const brandProfile  = buildBrandProfile(brand, allPromptResults);
    const competitors   = buildCompetitorProfiles(brand, allPromptResults);
    const shareOfVoice  = calculateShareOfVoice(brandProfile, competitors);

    // Recommendations + competitive insights in parallel
    const [recommendations, competitiveInsights] = await Promise.all([
      generateRecommendations(brand, category, finalScore, modelResults),
      generateCompetitiveInsights(brand, brandProfile, competitors),
    ]);

    const competitorsData: CompetitorsData = {
      brand_profile: brandProfile,
      competitors,
      share_of_voice: shareOfVoice,
      insights: competitiveInsights,
    };

    // Persist to Supabase
    let scanId: string | null = null;
    try {
      let scan: { id: string } | null = null;

      const { data: fullScan, error: fullError } = await supabase
        .from("scans")
        .insert({ user_id: user.id, brand_name: brand, website: url || null, url: url || null, category, status: "completed", overall_score: finalScore, recommendations, category_scores: categoryScores, competitors_data: competitorsData })
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

        // ── Existing scan_results table (keep for results display) ────────────
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
          await supabase.from("scan_results").insert(
            modelResults.flatMap((mr) =>
              mr.prompts.map((pr) => ({
                scan_id: scanId, model: mr.model, prompt: pr.prompt, response: pr.response,
                brand_mentioned: pr.analysis.brand_mentioned, mention_count: pr.count, score: pr.score,
              }))
            )
          );
        }

        // ── Normalised audit tables (service role bypasses RLS) ──────────────
        const admin = getAdmin();
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
                    is_recommended:        pr.analysis.is_recommended,
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

    return NextResponse.json({ scan_id: scanId, brand, category, url, overall_score: finalScore, category_scores: categoryScores, results: modelResults, recommendations, competitors_data: competitorsData });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
