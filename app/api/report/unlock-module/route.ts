import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { getBalance, deductTokens } from "@/lib/tokens";
import { getActionCost } from "@/lib/pricing/cost-calculator";
import { isSelfHost } from "@/lib/mode";

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

// ── LLM helpers ───────────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

async function callAnthropic(prompt: string, maxTokens = 600): Promise<string> {
  const res = await withTimeout(fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  }), 25000);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Anthropic error");
  return data.content?.[0]?.text ?? "";
}

async function callAnthropicSonnet(prompt: string, maxTokens = 1500): Promise<string> {
  const res = await withTimeout(fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  }), 45000);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Anthropic Sonnet error");
  return data.content?.[0]?.text ?? "";
}

// ── Module runners ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ScanResultRow = Record<string, any>;

async function unlockSentiment(brand: string, scanResults: ScanResultRow[]) {
  const descriptions = scanResults
    .filter((r) => r.key_context)
    .map((r) => r.key_context as string);
  const responses = scanResults
    .filter((r) => r.response && r.brand_mentioned)
    .map((r) => r.response as string)
    .slice(0, 20);

  if (descriptions.length === 0 && responses.length === 0) return null;

  const combined = [...descriptions, ...responses.map((r) => r.slice(0, 200))].join("; ");
  const prompt = `Based on these AI platform descriptions of "${brand}": ${combined}
Summarize: 1) How AI perceives this brand in 2-3 sentences, 2) Top 5 positive descriptors, 3) Top 3 negative/neutral descriptors, 4) Any perception mismatches vs likely brand positioning.
Return ONLY valid JSON: { "summary": "...", "positive_descriptors": ["..."], "negative_descriptors": ["..."], "perception_mismatches": ["..."] }`;

  try {
    const text = await callAnthropic(prompt, 600);
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function unlockCitations(brand: string, scanResults: ScanResultRow[]) {
  const urlCounts = new Map<string, number>();
  for (const row of scanResults) {
    const urls: string[] = row.cited_urls ?? [];
    for (const url of urls) {
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

async function unlockImprovementPlan(
  brand: string,
  category: string,
  finalScore: number,
  categoryScores: Record<string, number>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  competitorsData: any
) {
  const compSummary = (competitorsData?.competitors ?? [])
    .slice(0, 3)
    .map((c: { name: string; mention_rate: number; avg_position: number | null }) =>
      `${c.name}: ${c.mention_rate}% mention rate, avg position ${c.avg_position ?? "N/A"}`
    )
    .join("; ");

  const prompt = `Based on this AI visibility audit for ${brand} in ${category}:
Overall Score: ${finalScore}/100
Category Scores: ${JSON.stringify(categoryScores)}
Competitor comparison: ${compSummary || "No competitors detected"}

Generate a 3-tier improvement plan as JSON:
{
  "quick_wins": [{"title": "...", "description": "...", "impact": "+X pts", "effort": "1 hour|1 day|1 week", "affected_categories": ["..."]}],
  "this_month": [...same structure...],
  "this_quarter": [...same structure...]
}
Be SPECIFIC — reference actual query gaps, competitor advantages, and concrete actions. Include at least 3 items per tier. Return ONLY valid JSON.`;

  try {
    const text = await callAnthropicSonnet(prompt, 1500);
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

async function unlockBenchmark(
  category: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  competitorsData: any,
  brandScore: number,
) {
  const competitors: Array<{ name: string; mention_rate?: number; avg_position?: number | null; sentiment?: string | null }> =
    competitorsData?.competitors ?? [];

  const compLines = competitors.length > 0
    ? competitors.slice(0, 6).map((c) =>
        `- ${c.name}: mention_rate=${c.mention_rate ?? "unknown"}%, avg_position=${c.avg_position ?? "unknown"}`
      ).join("\n")
    : "No competitor data available";

  const prompt = `You are benchmarking AI visibility scores for a brand in the "${category}" category.
The scanned brand has an overall AI visibility score of ${brandScore}/100.

The following competitors were detected in the scan:
${compLines}

Based on this actual competitive set, estimate realistic AI visibility benchmark scores.
Return ONLY valid JSON — no explanation:
{
  "leader":      { "score": 0-100, "mention_rate": 0-100, "avg_position": 1-10, "recommend_rate": 0-100 },
  "average":     { "score": 0-100, "mention_rate": 0-100, "avg_position": 1-10, "recommend_rate": 0-100 },
  "new_entrant": { "score": 0-100, "mention_rate": 0-100, "avg_position": 1-10, "recommend_rate": 0-100 }
}`;

  try {
    const text = await callAnthropic(prompt, 400);
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
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
    const { scan_id, module, force } = body as { scan_id: string; module: string; force?: boolean };

    const validModules = ["sentiment", "citations", "improvement_plan", "benchmark"];
    if (!scan_id || !module || !validModules.includes(module)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const admin = getAdminClient();

    // Fetch the scan — verify ownership
    const { data: scan, error: scanError } = await admin
      .from("scans")
      .select("*")
      .eq("id", scan_id)
      .eq("user_id", user.id)
      .single();

    if (scanError || !scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    // Check if already unlocked
    const alreadyUnlocked = (() => {
      if (module === "sentiment")        return !!scan.perception_data;
      if (module === "citations")        return !!scan.citation_data;
      if (module === "improvement_plan") return !!scan.improvement_plan;
      if (module === "benchmark")        return !!scan.benchmark_data;
      return false;
    })();

    if (alreadyUnlocked && !force) {
      // Return existing data without charging
      const data = (() => {
        if (module === "sentiment")        return scan.perception_data;
        if (module === "citations")        return scan.citation_data;
        if (module === "improvement_plan") return scan.improvement_plan;
        if (module === "benchmark")        return scan.benchmark_data;
      })();
      return NextResponse.json({ data });
    }

    // Token check (skipped in self-host mode)
    const cost = getActionCost(`unlock_${module}`);
    if (!isSelfHost) {
      const balance = await getBalance(user.id);
      if (balance < cost) {
        return NextResponse.json(
          { error: "Insufficient tokens", required: cost, balance },
          { status: 402 }
        );
      }
    }

    // Fetch scan results for re-analysis modules
    const { data: scanResults } = await admin
      .from("scan_results")
      .select("*")
      .eq("scan_id", scan_id);

    const results: ScanResultRow[] = scanResults ?? [];

    // Run the requested module
    let moduleData: unknown = null;
    let updateField = "";

    if (module === "sentiment") {
      moduleData = await unlockSentiment(scan.brand_name, results);
      updateField = "perception_data";
    } else if (module === "citations") {
      moduleData = unlockCitations(scan.brand_name, results);
      updateField = "citation_data";
    } else if (module === "improvement_plan") {
      moduleData = await unlockImprovementPlan(
        scan.brand_name,
        scan.category ?? "General",
        scan.overall_score ?? 0,
        scan.category_scores ?? {},
        scan.competitors_data
      );
      updateField = "improvement_plan";
    } else if (module === "benchmark") {
      moduleData = await unlockBenchmark(
        scan.category ?? "General",
        scan.competitors_data,
        scan.overall_score ?? 0,
      );
      updateField = "benchmark_data";
    }

    if (!moduleData) {
      return NextResponse.json(
        { error: "AI generation failed — please try again. Your tokens were not charged." },
        { status: 500 }
      );
    }

    // Persist module data to scan row
    await admin
      .from("scans")
      .update({ [updateField]: moduleData })
      .eq("id", scan_id);

    // Deduct tokens (skipped in self-host mode)
    if (!isSelfHost) {
      const deduction = await deductTokens(
        user.id,
        cost,
        `Unlock ${module.replace(/_/g, " ")} for scan ${scan_id}`,
        scan_id
      );
      if (!deduction.success) {
        // Data already saved — log but don't fail
        console.error("[unlock-module] token deduction failed:", deduction.error);
      }
      return NextResponse.json({ data: moduleData, balance: deduction.balance });
    }

    return NextResponse.json({ data: moduleData });
  } catch (err) {
    console.error("[unlock-module]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
