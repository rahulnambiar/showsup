import { NextResponse } from "next/server";
import { BRAND_INDEX } from "@/lib/brand-index/brands";
import { runBatchScan } from "@/lib/brand-index/index-scanner";
import { generateMonthlySummary } from "@/lib/brand-index/summary-generator";

// Admin-only manual trigger for the full 100-brand index scan.
// POST /api/admin/run-index-scan
// Authorization: Bearer <ADMIN_API_KEY>
//
// Optional body params:
//   month: "YYYY-MM"        — override month (default: current UTC month)
//   brands: string[]        — subset of brand names (default: all 100)
//   delay_ms: number        — ms between brands (default: 30000)
//   generate_summary: bool  — generate monthly summary after scanning (default: true)

export const maxDuration = 300; // 5-minute Vercel timeout for Pro/Enterprise

export async function POST(request: Request) {
  // ── Auth ──────────────────────────────────────────────────────────────────

  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    return NextResponse.json({ error: "ADMIN_API_KEY not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  if (authHeader !== `Bearer ${adminKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────

  let body: {
    month?: string;
    brands?: string[];
    delay_ms?: number;
    generate_summary?: boolean;
  } = {};
  try {
    body = await request.json() as typeof body;
  } catch {
    // No body is fine — use defaults
  }

  const month = body.month ?? (() => {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  })();

  const brandFilter = Array.isArray(body.brands) && body.brands.length > 0
    ? new Set(body.brands.map((n) => n.toLowerCase()))
    : null;

  const brandsToScan = brandFilter
    ? BRAND_INDEX.filter((b) => brandFilter.has(b.name.toLowerCase()))
    : BRAND_INDEX;

  const delayMs = typeof body.delay_ms === "number" ? body.delay_ms : 30_000;
  const generateSummary = body.generate_summary !== false;

  if (brandsToScan.length === 0) {
    return NextResponse.json({ error: "No matching brands found" }, { status: 400 });
  }

  console.log(
    `[run-index-scan] Starting ${brandsToScan.length} brands for ${month} (delay: ${delayMs}ms)`
  );

  // ── Run scans ─────────────────────────────────────────────────────────────

  const results = await runBatchScan({
    brands: brandsToScan,
    month,
    delayMs,
  });

  // ── Monthly summary ───────────────────────────────────────────────────────

  let summary = null;
  if (generateSummary) {
    try {
      summary = await generateMonthlySummary(month);
    } catch (err) {
      console.error("[run-index-scan] Summary generation failed:", err);
    }
  }

  const errors = results.filter((r) => r.error);

  return NextResponse.json({
    success: true,
    month,
    scanned: results.length,
    errors: errors.length,
    results,
    summary: summary ?? null,
  });
}
