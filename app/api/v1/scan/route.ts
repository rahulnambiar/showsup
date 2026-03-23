/**
 * POST /api/v1/scan
 *
 * Cloud API endpoint for the ShowsUp CLI and third-party integrations.
 * Authenticates via X-Api-Token header.
 *
 * Request body:
 *   { brand, url?, category?, niche?, competitors?, depth? }
 *
 * Depth: "quick" | "standard" | "deep" (default: "standard")
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runScan } from "@/lib/engine/scan";
import type { ScanInput } from "@/lib/engine/types";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function POST(request: Request) {
  try {
    // ── Auth via API token ──────────────────────────────────────────────────
    const token =
      request.headers.get("x-api-token") ??
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    if (!token) {
      return NextResponse.json({ error: "API token required. Pass X-Api-Token header." }, { status: 401 });
    }

    const admin = getAdmin();
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("api_token", token)
      .maybeSingle();

    if (!profile?.id) {
      return NextResponse.json({ error: "Invalid API token." }, { status: 401 });
    }

    // ── Parse body ──────────────────────────────────────────────────────────
    const body = await request.json() as {
      brand?: string; url?: string; category?: string; niche?: string;
      competitors?: string[]; depth?: string; models?: Record<string, boolean>;
    };

    const brand    = (body.brand ?? "").trim();
    const url      = (body.url   ?? "").trim();
    const category = (body.category ?? "Other").trim();
    const niche    = (body.niche ?? "").trim();
    const competitors: string[] = Array.isArray(body.competitors) ? body.competitors.slice(0, 8) : [];

    if (!brand) {
      return NextResponse.json({ error: "brand is required" }, { status: 400 });
    }

    const depthMap: Record<string, "quick_check" | "standard" | "deep"> = {
      quick: "quick_check", standard: "standard", deep: "deep",
    };
    const scanDepth = depthMap[body.depth ?? "standard"] ?? "standard";

    // ── Run scan ────────────────────────────────────────────────────────────
    const scanInput: ScanInput = {
      brand,
      category,
      niche,
      url,
      competitors,
      reportConfig: { type: scanDepth, addons: [], extra_competitors: competitors.length },
      models: body.models ?? { chatgpt: true, claude: true },
    };

    let result;
    try {
      result = await runScan(scanInput);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Scan failed";
      return NextResponse.json({ error: msg }, { status: 503 });
    }

    // Return results (no DB persistence for v1 API — stateless)
    return NextResponse.json({
      brand:           result.brand,
      category:        result.category,
      url:             result.url,
      overall_score:   result.overall_score,
      category_scores: result.category_scores,
      results:         result.results.map((mr) => ({
        model:        mr.model,
        label:        mr.label,
        score:        mr.score,
        mentioned:    mr.mentioned,
      })),
      recommendations: result.recommendations,
      competitors_data: {
        brand_profile:   result.competitors_data.brand_profile,
        competitors:     result.competitors_data.competitors,
        share_of_voice:  result.competitors_data.share_of_voice,
        insights:        result.competitors_data.insights,
      },
      ...(result.improvement_plan && { improvement_plan: result.improvement_plan }),
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
