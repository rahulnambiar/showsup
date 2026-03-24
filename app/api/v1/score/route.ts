/**
 * GET /api/v1/score?domain=example.com
 *
 * Returns the latest cached scan score for a domain.
 * 0 tokens (read-only, cached).
 */

import { NextResponse } from "next/server";
import { authenticateApiToken, getAdmin } from "@/lib/api/auth";

export async function GET(request: Request) {
  const user = await authenticateApiToken(request);
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized. Pass Authorization: Bearer <api_token>" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain")?.trim().toLowerCase()
    .replace(/^https?:\/\//, "").replace(/\/$/, "");

  if (!domain) {
    return NextResponse.json({ error: "domain query parameter is required" }, { status: 400 });
  }

  const admin = getAdmin();

  // Find latest scan for this domain belonging to the user
  const { data: scan } = await admin
    .from("scans")
    .select("id, brand_name, website, overall_score, category_scores, created_at")
    .eq("user_id", user.userId)
    .ilike("website", `%${domain}%`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!scan) {
    return NextResponse.json({ error: "No scan found for this domain. Run POST /api/v1/scan first." }, { status: 404 });
  }

  // Build platform scores from scan_results
  const { data: results } = await admin
    .from("scan_results")
    .select("model, score")
    .eq("scan_id", scan.id);

  const platformMap: Record<string, number[]> = {};
  for (const r of results ?? []) {
    const m = r.model as string;
    if (!platformMap[m]) platformMap[m] = [];
    platformMap[m]!.push(r.score as number ?? 0);
  }
  const platforms = Object.fromEntries(
    Object.entries(platformMap).map(([m, scores]) => [
      m,
      Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
    ])
  );

  return NextResponse.json({
    domain,
    brand:      scan.brand_name,
    scan_id:    scan.id,
    score:      scan.overall_score,
    category_scores: scan.category_scores,
    platforms,
    scanned_at: scan.created_at,
  });
}
