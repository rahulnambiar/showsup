/**
 * POST /api/v1/scan
 *
 * Public REST API — trigger a brand scan.
 * Auth: Authorization: Bearer <api_token>
 *
 * Request: { url, brand?, category?, depth?, regions? }
 * Response: { scan_id, status, brand, score, ... }
 *
 * Token costs: quick=40, standard=140, deep=335
 */

import { NextResponse } from "next/server";
import { runScan } from "@/lib/engine/scan";
import type { ScanInput } from "@/lib/engine/types";
import { isSelfHost } from "@/lib/mode";
import { authenticateApiToken, chargeTokens, getAdmin, API_TOKEN_COSTS } from "@/lib/api/auth";
import { deliverWebhook } from "@/lib/webhooks/delivery";

export async function POST(request: Request) {
  try {
    const user = await authenticateApiToken(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Pass Authorization: Bearer <api_token>" },
        { status: 401 }
      );
    }

    const body = await request.json() as {
      url?: string;
      brand?: string;
      category?: string;
      niche?: string;
      competitors?: string[];
      depth?: string;
      regions?: string[];
    };

    const url       = (body.url      ?? "").trim();
    const brand     = (body.brand    ?? "").trim();
    const category  = (body.category ?? "Other").trim();
    const niche     = (body.niche    ?? "").trim();
    const competitors = Array.isArray(body.competitors)
      ? body.competitors.filter((c): c is string => typeof c === "string").slice(0, 8)
      : [];
    const regions   = Array.isArray(body.regions)
      ? body.regions.filter((r): r is string => typeof r === "string")
      : ["global"];

    if (!url && !brand) {
      return NextResponse.json({ error: "url or brand is required" }, { status: 400 });
    }

    const depthMap: Record<string, "quick_check" | "standard" | "deep"> = {
      quick: "quick_check", standard: "standard", deep: "deep",
    };
    const scanDepth = depthMap[body.depth ?? "standard"] ?? "standard";

    // Token check
    if (!isSelfHost) {
      const charge = await chargeTokens(
        user.userId,
        `scan.${scanDepth}`,
        `API scan: ${brand || url} (${scanDepth})`,
      );
      if (!charge.ok) {
        return NextResponse.json(
          { error: "Insufficient tokens", required: charge.required, balance: charge.balance },
          { status: 402 }
        );
      }
    }

    // Run scan
    const scanInput: ScanInput = {
      brand: brand || new URL(url.startsWith("http") ? url : "https://" + url).hostname,
      category,
      niche,
      url,
      competitors,
      regions,
      reportConfig: { type: scanDepth, addons: [], extra_competitors: competitors.length },
      models: { chatgpt: true, claude: true },
    };

    let result;
    try {
      result = await runScan(scanInput);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Scan failed";
      return NextResponse.json({ error: msg }, { status: 503 });
    }

    // Persist to scans table
    const admin = getAdmin();
    let scanId: string | null = null;
    try {
      const { data: scan } = await admin.from("scans").insert({
        user_id:         user.userId,
        brand_name:      result.brand,
        website:         url || null,
        category,
        status:          "completed",
        overall_score:   result.overall_score,
        category_scores: result.category_scores,
        competitors_data: result.competitors_data,
        regions:         regions.length > 0 ? regions : ["global"],
        ...(result.improvement_plan  && { improvement_plan:  result.improvement_plan  }),
        ...(result.regional_scores   && { regional_scores:   result.regional_scores   }),
        ...(result.regional_insights && { regional_insights: result.regional_insights }),
      }).select("id").single();
      scanId = (scan?.id as string) ?? null;
    } catch { /* Non-fatal */ }

    // Fire webhook (fire-and-forget)
    void deliverWebhook(user.userId, "scan.completed", {
      scan_id: scanId,
      brand:   result.brand,
      score:   result.overall_score,
      url,
    });

    const tokenCost = API_TOKEN_COSTS[`scan.${scanDepth}`] ?? 0;

    return NextResponse.json({
      scan_id:         scanId,
      status:          "completed",
      estimated_time:  0,
      brand:           result.brand,
      url:             url || null,
      category,
      overall_score:   result.overall_score,
      category_scores: result.category_scores,
      platforms:       Object.fromEntries(
        result.results.map((mr) => [mr.model, mr.score])
      ),
      scanned_at:      new Date().toISOString(),
      results:         result.results.map((mr) => ({
        model:     mr.model,
        label:     mr.label,
        score:     mr.score,
        mentioned: mr.mentioned,
      })),
      competitors_data: {
        brand_profile:  result.competitors_data.brand_profile,
        competitors:    result.competitors_data.competitors,
        share_of_voice: result.competitors_data.share_of_voice,
        insights:       result.competitors_data.insights,
      },
      ...(result.improvement_plan  && { improvement_plan:  result.improvement_plan  }),
      ...(result.regional_scores   && { regional_scores:   result.regional_scores   }),
      tokens_used: tokenCost,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
