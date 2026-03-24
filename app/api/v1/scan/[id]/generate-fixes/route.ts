/**
 * POST /api/v1/scan/:scan_id/generate-fixes
 * Generates AEO fix artifacts for a completed scan.
 * 80 tokens.
 */

import { NextResponse } from "next/server";
import { authenticateApiToken, chargeTokens, getAdmin } from "@/lib/api/auth";
import { generateFixes } from "@/lib/fixes/generator";
import { isSelfHost } from "@/lib/mode";
import { deliverWebhook } from "@/lib/webhooks/delivery";

export async function POST(
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
    .select("id, brand_name, website, category, overall_score, category_scores, competitors_data")
    .eq("id", params.id)
    .eq("user_id", user.userId)
    .maybeSingle();

  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  // Token charge
  if (!isSelfHost) {
    const charge = await chargeTokens(
      user.userId,
      "generate-fixes",
      `Generate fixes: ${scan.brand_name as string}`,
      params.id,
    );
    if (!charge.ok) {
      return NextResponse.json(
        { error: "Insufficient tokens", required: charge.required, balance: charge.balance },
        { status: 402 }
      );
    }
  }

  // Parse body for optional overrides
  let body: { types?: string[] } = {};
  try { body = await request.json() as { types?: string[] }; } catch { /* optional */ }

  // Extract category scores + competitors
  const categoryScores = scan.category_scores as Record<string, number> | null;
  const competitorsData = scan.competitors_data as { competitors?: Array<{ name: string }> } | null;
  const competitors = competitorsData?.competitors?.map((c) => c.name) ?? [];

  const result = await generateFixes({
    brand:           scan.brand_name as string,
    category:        scan.category as string ?? "Other",
    url:             scan.website as string ?? "",
    competitors,
    category_scores: categoryScores ?? undefined,
    types:           body.types as never ?? undefined,
  });

  // Persist fixes back to the scan row
  await admin.from("scans").update({
    generated_fixes:     result.fixes,
    fixes_generated_at:  new Date().toISOString(),
  }).eq("id", params.id);

  // Fire webhook
  void deliverWebhook(user.userId, "fixes.generated", {
    scan_id:         params.id,
    brand:           scan.brand_name,
    fix_count:       result.fixes.length,
    estimated_impact: result.estimated_impact,
  });

  return NextResponse.json({
    scan_id:          params.id,
    brand:            scan.brand_name,
    estimated_impact: result.estimated_impact,
    fixes:            result.fixes,
    tokens_used:      80,
  });
}
