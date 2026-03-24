/**
 * GET /api/v1/scan/:scan_id
 * Returns full scan results for a previously run scan.
 * 0 tokens.
 */

import { NextResponse } from "next/server";
import { authenticateApiToken, getAdmin } from "@/lib/api/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const user = await authenticateApiToken(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdmin();
  const { data: scan } = await admin
    .from("scans")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.userId)
    .maybeSingle();

  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  const { data: results } = await admin
    .from("scan_results")
    .select("model, prompt, response, brand_mentioned, mention_count, score")
    .eq("scan_id", params.id);

  // Build per-model summary
  const byModel: Record<string, { score: number; mentioned: boolean; prompts: unknown[] }> = {};
  for (const r of results ?? []) {
    const m = r.model as string;
    if (!byModel[m]) byModel[m] = { score: 0, mentioned: false, prompts: [] };
    byModel[m]!.prompts.push({ prompt: r.prompt, response: r.response, brand_mentioned: r.brand_mentioned, score: r.score });
    if (r.brand_mentioned) byModel[m]!.mentioned = true;
  }
  for (const m of Object.keys(byModel)) {
    const scores = (byModel[m]!.prompts as Array<{ score: number }>).map((p) => p.score ?? 0);
    byModel[m]!.score = Math.round(scores.reduce((s, v) => s + v, 0) / Math.max(1, scores.length));
  }

  return NextResponse.json({
    scan_id:          scan.id,
    status:           scan.status ?? "completed",
    brand:            scan.brand_name,
    url:              scan.website,
    category:         scan.category,
    overall_score:    scan.overall_score,
    category_scores:  scan.category_scores,
    platforms:        Object.fromEntries(
      Object.entries(byModel).map(([m, d]) => [m, { score: d.score, mentioned: d.mentioned }])
    ),
    competitors_data:  scan.competitors_data,
    improvement_plan:  scan.improvement_plan ?? null,
    regional_scores:   scan.regional_scores  ?? null,
    regional_insights: scan.regional_insights ?? null,
    scanned_at:        scan.created_at,
    results:           Object.entries(byModel).map(([model, d]) => ({
      model,
      score:     d.score,
      mentioned: d.mentioned,
      prompts:   d.prompts,
    })),
  });
}
