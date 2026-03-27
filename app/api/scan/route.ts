import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { getBalance, deductTokens } from "@/lib/tokens";
import { calculateReportCost as calcDynamicCost } from "@/lib/pricing/cost-calculator";
import { isSelfHost } from "@/lib/mode";
import { runScan, RateLimitError } from "@/lib/engine/scan";
import type { ScanInput, ScanOutput } from "@/lib/engine/types";

// Re-export types that other parts of the app still import from here
export type { AnalysisResult, CompetitorProfile, BrandProfile, CompetitorsData, PerceptionData, CitationData, ImprovementPlan, ImprovementPlanItem, BenchmarkData, Recommendation, ModelResult } from "@/lib/engine/types";

function getAdmin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

interface ReportConfig {
  type: "quick_check" | "standard" | "deep";
  addons: string[];
  extra_competitors: number;
}

function calculateTokenCost(config: ReportConfig | null, regions: string[] = ["global"]): number {
  const addons = config?.addons ?? [];
  const extraRegions = regions.filter((r) => r !== "global").length;
  return calcDynamicCost({
    scanDepth:       (config?.type ?? "standard") as "quick_check" | "standard" | "deep",
    models:          ["gpt-4o-mini", "claude-3-haiku"],
    competitorCount: config?.extra_competitors ?? 0,
    regionCount:     extraRegions + 1,
    modules: {
      persona:           addons.includes("persona_analysis"),
      commerce:          addons.includes("commerce_deep_dive"),
      sentiment:         addons.includes("sentiment_deep_dive"),
      citations:         addons.includes("citation_tracking"),
      improvementPlan:   addons.includes("improvement_plan"),
      categoryBenchmark: addons.includes("category_benchmark"),
    },
  }).totalTokens;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as {
      brand?: string; category?: string; niche?: string; url?: string; website?: string;
      report_config?: ReportConfig; competitors?: unknown[]; models?: Record<string, boolean>;
      regions?: string[];
    };

    const brand:    string = (body.brand    ?? "").trim();
    const category: string = (body.category ?? "Other").trim();
    const niche:    string = (body.niche    ?? "").trim();
    const url:      string = (body.url ?? body.website ?? "").trim();
    const reportConfig: ReportConfig | null = body.report_config ?? null;

    if (!brand) return NextResponse.json({ error: "Brand name is required" }, { status: 400 });

    const regions: string[] = Array.isArray(body.regions)
      ? body.regions.filter((r): r is string => typeof r === "string")
      : ["global"];

    // Token check — skipped in self-host mode
    const tokenCost = calculateTokenCost(reportConfig, regions);
    if (!isSelfHost) {
      const balance = await getBalance(user.id);
      if (balance < tokenCost) {
        return NextResponse.json({ error: "Insufficient tokens", required: tokenCost, balance }, { status: 402 });
      }
    }

    const passedCompetitors: string[] = Array.isArray(body.competitors)
      ? body.competitors.filter((c): c is string => typeof c === "string" && !!c.trim()).slice(0, 8)
      : [];

    // Run scan via shared engine
    const scanInput: ScanInput = {
      brand,
      category,
      niche,
      url,
      competitors:  passedCompetitors,
      reportConfig: reportConfig ?? null,
      models:       body.models ?? { chatgpt: true, claude: true, gemini: true },
      regions,
    };

    let result: ScanOutput;
    try {
      result = await runScan(scanInput);
    } catch (err) {
      if (err instanceof RateLimitError) {
        return NextResponse.json({ error: "rate_limited", message: err.message }, { status: 429 });
      }
      const msg = err instanceof Error ? err.message : "Scan failed";
      return NextResponse.json({ error: msg }, { status: 503 });
    }

    // ── Persist to Supabase ───────────────────────────────────────────────────
    let scanId: string | null = null;
    try {
      const { data: fullScan, error: fullError } = await supabase
        .from("scans")
        .insert({
          user_id: user.id, brand_name: brand, website: url || null,
          category, status: "completed", overall_score: result.overall_score,
          category_scores: result.category_scores, competitors_data: result.competitors_data,
          regions: regions.length > 0 ? regions : ["global"],
          ...(result.perception_data   && { perception_data:    result.perception_data   }),
          ...(result.citation_data     && { citation_data:      result.citation_data     }),
          ...(result.improvement_plan  && { improvement_plan:   result.improvement_plan  }),
          ...(result.benchmark_data    && { benchmark_data:     result.benchmark_data    }),
          ...(result.regional_scores   && { regional_scores:    result.regional_scores   }),
          ...(result.regional_insights && { regional_insights:  result.regional_insights }),
        })
        .select("id").single();

      if (!fullError && fullScan?.id) {
        scanId = fullScan.id as string;
      } else {
        console.error("[scans] full insert error:", fullError?.message);
        const { data: minScan, error: minErr } = await supabase
          .from("scans")
          .insert({ user_id: user.id, brand_name: brand, website: url || null, status: "completed", overall_score: result.overall_score, category_scores: result.category_scores })
          .select("id").single();
        if (minErr) console.error("[scans] fallback insert error:", minErr.message);
        scanId = (minScan?.id as string) ?? null;
      }

      if (scanId) {
        const admin = getAdmin();

        // scan_results
        const coreRows = result.results.flatMap((mr) =>
          mr.prompts.map((pr) => ({
            scan_id: scanId, model: mr.model, prompt: pr.prompt, response: pr.response,
            brand_mentioned: pr.analysis.brand_mentioned, mention_count: pr.count, score: pr.score,
          }))
        );
        const { error: rowsError } = await admin.from("scan_results").insert(coreRows);
        if (rowsError) console.error("[scan_results] insert error:", rowsError.message);

        // audit tables
        try {
          const queryTypeMap: Record<string, string> = {
            competitive: "comparison", alternatives: "comparison",
            reputation: "review",
            awareness: "recommendation", discovery: "recommendation", purchase_intent: "recommendation",
          };

          let brandId: string | null = null;
          const { data: existingBrand } = await admin.from("brands").select("id").eq("user_id", user.id).ilike("name", brand).maybeSingle();
          if (existingBrand?.id) {
            brandId = existingBrand.id as string;
          } else {
            const { data: newBrand, error: brandErr } = await admin.from("brands")
              .insert({ user_id: user.id, name: brand, domain: url || `${brand.toLowerCase().replace(/\s+/g, "")}.com`, category })
              .select("id").single();
            if (brandErr) console.error("[brands] insert error:", brandErr.message);
            else brandId = (newBrand?.id as string) ?? null;
          }

          if (brandId) {
            let auditId: string | null = null;
            const { data: auditRow, error: auditErr } = await admin.from("audits")
              .insert({ brand_id: brandId, user_id: user.id })
              .select("id").single();
            if (auditErr) {
              const { data: auditRow2, error: auditErr2 } = await admin.from("audits").insert({ brand_id: brandId }).select("id").single();
              if (auditErr2) console.error("[audits] insert error:", auditErr2.message);
              else auditId = (auditRow2?.id as string) ?? null;
            } else {
              auditId = (auditRow?.id as string) ?? null;
            }

            if (auditId) {
              const auditQueryRows = result.queries.map((q) => ({
                id: q.auditId, audit_id: auditId, query_text: q.text,
                query_type: queryTypeMap[q.scoreCategory] ?? "recommendation", is_commerce: q.isCommerce,
              }));
              const { error: aqErr } = await admin.from("audit_queries").insert(auditQueryRows);
              if (!aqErr) {
                const auditResultRows = result.results.flatMap((mr) => {
                  const provider   = mr.model === "chatgpt" ? "openai" : "anthropic";
                  return mr.prompts.map((pr) => ({
                    audit_id: auditId, audit_query_id: pr.auditQueryId, provider, model: mr.model, model_tier: "free",
                    response_text: pr.response, brand_mentioned: pr.analysis.brand_mentioned,
                    mention_position: pr.analysis.mention_position ?? null, sentiment: pr.analysis.sentiment ?? null,
                    is_recommended: pr.analysis.is_recommended ?? false,
                    competitors_mentioned: pr.analysis.competitors_found?.map((c) => c.name) ?? [],
                  }));
                });
                const { error: arErr } = await admin.from("audit_results").insert(auditResultRows);
                if (arErr) console.error("[audit_results] insert error:", arErr.message);
              } else {
                console.error("[audit_queries] insert error:", aqErr.message);
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

    // Deduct tokens — skipped in self-host mode
    if (!isSelfHost) {
      await deductTokens(user.id, tokenCost, `Standard scan: ${brand}`, scanId ?? undefined);
    }

    return NextResponse.json({
      scan_id: scanId,
      ...result,
      // Exclude queries array from API response (internal use only)
      queries: undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
