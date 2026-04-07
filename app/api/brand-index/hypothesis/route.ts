import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "rahul@showsup.co";

function getAdminDb() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

interface HypothesisResult {
  supported: boolean | "partial";
  confidence: "high" | "medium" | "low";
  summary: string;
  evidence: Array<{ metric: string; value: string }>;
  examples: Array<{ brand: string; detail: string }>;
  caveats: string[];
  visualization: "scatter" | "bar" | "line" | "table";
}

// POST /api/brand-index/hypothesis
// Body: { hypothesis: string }

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { hypothesis?: string };
  const hypothesis = body.hypothesis?.trim();
  if (!hypothesis) return NextResponse.json({ error: "hypothesis required" }, { status: 400 });

  // ── Fetch all brand data (latest month per brand) ─────────────────────────

  const admin = getAdminDb();
  const { data: rows } = await admin
    .from("brand_index")
    .select("brand_name, category, month, composite_score, llm_probing_score, structured_data_score, training_data_score, citation_sources_score, search_correlation_score, crawler_readiness_score, mention_rate, stock_price_change_pct, website_snapshot, signal_details")
    .order("month", { ascending: false })
    .limit(300); // last 3 months × 100 brands

  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: "No brand index data available yet" }, { status: 404 });
  }

  // Deduplicate: keep most recent entry per brand
  const latestByBrand = new Map<string, typeof rows[0]>();
  for (const row of rows) {
    if (!latestByBrand.has(row.brand_name)) latestByBrand.set(row.brand_name, row);
  }
  const dataset = Array.from(latestByBrand.values());

  // ── Build summary stats for the prompt ───────────────────────────────────

  const withLlmsTxt = dataset.filter((r) => {
    const snap = r.website_snapshot as { llms_txt_exists?: boolean } | null;
    return snap?.llms_txt_exists === true;
  });

  const summary = {
    total_brands: dataset.length,
    avg_composite: Math.round(dataset.reduce((s, r) => s + (r.composite_score ?? 0), 0) / dataset.length),
    llms_txt_count: withLlmsTxt.length,
    categories: Array.from(new Set(dataset.map((r) => r.category))),
    top_3: dataset.slice(0, 3).map((r) => ({ brand: r.brand_name, score: r.composite_score })),
    bottom_3: dataset.slice(-3).map((r) => ({ brand: r.brand_name, score: r.composite_score })),
  };

  // Compact dataset for LLM (trim to essentials)
  const compact = dataset.map((r) => ({
    brand: r.brand_name,
    category: r.category,
    composite: r.composite_score,
    llm: r.llm_probing_score,
    structured: r.structured_data_score,
    training: r.training_data_score,
    citations: r.citation_sources_score,
    search: r.search_correlation_score,
    crawler: r.crawler_readiness_score,
    mention_rate: r.mention_rate,
    stock_delta: r.stock_price_change_pct,
    has_llms_txt: (r.website_snapshot as { llms_txt_exists?: boolean } | null)?.llms_txt_exists ?? false,
    has_faq: (r.website_snapshot as { has_faq_schema?: boolean } | null)?.has_faq_schema ?? false,
  }));

  // ── Call Claude ───────────────────────────────────────────────────────────

  const systemPrompt = `You are a data analyst examining the ShowsUp AI Visibility Index — a dataset tracking how visible 100 global brands are to AI systems (ChatGPT, Claude, Gemini) and how well their websites are optimized for AI consumption.

Signal definitions:
- llm_probing (0-100): How often the brand is mentioned/recommended by AI models
- structured_data (0-100): Website technical readiness (llms.txt, schema markup, robots.txt)
- training_data (0-100): Estimated presence in AI training data (Wikipedia, Reddit)
- citation_sources (0-100): Quality of citation sources (G2, Trustpilot, scan citations)
- search_correlation (0-100): Organic search visibility
- crawler_readiness (0-100): AI crawler access permissions

Analyze the dataset and test the user's hypothesis. Return ONLY valid JSON in this exact format:
{
  "supported": true|false|"partial",
  "confidence": "high"|"medium"|"low",
  "summary": "one concise sentence",
  "evidence": [{"metric": "...", "value": "..."}],
  "examples": [{"brand": "...", "detail": "..."}],
  "caveats": ["..."],
  "visualization": "scatter"|"bar"|"line"|"table"
}`;

  const userPrompt = `Dataset summary: ${JSON.stringify(summary)}

Full dataset (${compact.length} brands): ${JSON.stringify(compact)}

Hypothesis to test: "${hypothesis}"

Analyze the data rigorously. Compute actual statistics where possible (means, counts, correlations). Cite specific brands. Be honest about whether the data supports the hypothesis.`;

  const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!aiRes.ok) {
    return NextResponse.json({ error: "AI analysis failed" }, { status: 502 });
  }

  const aiData = await aiRes.json() as { content?: Array<{ text?: string }> };
  const rawText = aiData.content?.[0]?.text ?? "";

  let result: HypothesisResult;
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    result = JSON.parse(jsonMatch?.[0] ?? rawText) as HypothesisResult;
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response", raw: rawText }, { status: 500 });
  }

  return NextResponse.json({ result, hypothesis });
}
