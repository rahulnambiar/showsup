/**
 * POST /api/v1/fix
 *
 * Cloud API endpoint for generating AEO fix files.
 * Authenticates via X-Api-Token header.
 *
 * Request body:
 *   { brand, url, category?, niche?, competitors?, types? }
 *
 * Returns: { fixes: [{ filename, content, description }], estimated_impact }
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateFixes } from "@/lib/fixes/generator";
import type { FixType } from "@/lib/fixes/types";
import { ALL_FIX_TYPES } from "@/lib/fixes/types";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function POST(request: Request) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
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
      competitors?: string[]; types?: string[];
      category_scores?: Record<string, number>;
      recommendations?: Array<{ title: string; description: string; priority: string }>;
    };

    const brand    = (body.brand ?? "").trim();
    const url      = (body.url   ?? "").trim();
    const category = (body.category ?? "Other").trim();

    if (!brand) {
      return NextResponse.json({ error: "brand is required" }, { status: 400 });
    }

    const types: FixType[] = Array.isArray(body.types)
      ? body.types.filter((t): t is FixType => ALL_FIX_TYPES.includes(t as FixType))
      : ALL_FIX_TYPES;

    // ── Generate fixes ──────────────────────────────────────────────────────
    const result = await generateFixes({
      brand,
      url,
      category,
      niche:            body.niche,
      competitors:      body.competitors ?? [],
      category_scores:  body.category_scores,
      recommendations:  body.recommendations,
      types,
    });

    return NextResponse.json({
      brand:            result.brand,
      estimated_impact: result.estimated_impact,
      fixes: result.fixes.map(({ filename, content, description, sizeBytes }) => ({
        filename,
        content,
        description,
        size_bytes: sizeBytes,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
