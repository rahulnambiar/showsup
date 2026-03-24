/**
 * GET /api/v1/history?domain=example.com&from=2026-01-01&to=2026-03-20
 * Returns score time series for a domain.
 * 0 tokens.
 */

import { NextResponse } from "next/server";
import { authenticateApiToken, getAdmin } from "@/lib/api/auth";

export async function GET(request: Request) {
  const user = await authenticateApiToken(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain")?.trim().toLowerCase()
    .replace(/^https?:\/\//, "").replace(/\/$/, "");
  const from   = searchParams.get("from");
  const to     = searchParams.get("to");
  const limit  = Math.min(parseInt(searchParams.get("limit") ?? "100"), 500);

  if (!domain) {
    return NextResponse.json({ error: "domain query parameter is required" }, { status: 400 });
  }

  const admin = getAdmin();
  let query = admin
    .from("scans")
    .select("id, brand_name, overall_score, category_scores, created_at")
    .eq("user_id", user.userId)
    .ilike("website", `%${domain}%`)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (from) query = query.gte("created_at", from);
  if (to)   query = query.lte("created_at", to + "T23:59:59Z");

  const { data: scans, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const series = (scans ?? []).map((s) => ({
    scan_id:         s.id,
    score:           s.overall_score,
    category_scores: s.category_scores,
    scanned_at:      s.created_at,
  }));

  const scores = series.map((s) => s.score as number);
  const avg    = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;
  const trend  = scores.length >= 2
    ? (scores.at(-1)! > scores[0]! ? "rising" : scores.at(-1)! < scores[0]! ? "falling" : "flat")
    : "unknown";

  return NextResponse.json({
    domain,
    brand:         scans?.[0]?.brand_name ?? null,
    data_points:   series.length,
    average_score: avg,
    trend,
    series,
  });
}
