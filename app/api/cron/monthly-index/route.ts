import { NextResponse } from "next/server";
import { BRAND_INDEX } from "@/lib/brand-index/brands";
import { runBatchScan } from "@/lib/brand-index/index-scanner";
import { generateMonthlySummary } from "@/lib/brand-index/summary-generator";

// Vercel cron handler — runs on the 1st of each month across 10 batches.
// GET /api/cron/monthly-index?batch=N   (N = 0..9, 10 brands each)
//
// Each batch fires 5 minutes after the previous, so all 100 brands complete
// within 50 minutes of midnight UTC on the 1st.
//
// Batch 9 (last) also auto-generates the monthly summary.

export const maxDuration = 300;

const BATCH_SIZE = 10;

export async function GET(request: Request) {
  // ── Auth ──────────────────────────────────────────────────────────────────

  const authHeader = request.headers.get("authorization") ?? "";
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Batch index ───────────────────────────────────────────────────────────

  const { searchParams } = new URL(request.url);
  const batchParam = searchParams.get("batch");
  const batchIndex = batchParam !== null ? parseInt(batchParam, 10) : 0;

  if (isNaN(batchIndex) || batchIndex < 0 || batchIndex > 9) {
    return NextResponse.json({ error: "Invalid batch (0-9)" }, { status: 400 });
  }

  // ── Select brands for this batch ──────────────────────────────────────────

  const start = batchIndex * BATCH_SIZE;
  const brandsForBatch = BRAND_INDEX.slice(start, start + BATCH_SIZE);

  if (brandsForBatch.length === 0) {
    return NextResponse.json({ ok: true, scanned: 0, message: "No brands in batch" });
  }

  const month = (() => {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  })();

  console.log(
    `[monthly-index] Batch ${batchIndex}: brands ${start + 1}-${start + brandsForBatch.length} for ${month}`
  );

  // ── Run batch ─────────────────────────────────────────────────────────────

  const results = await runBatchScan({
    brands: brandsForBatch,
    month,
    delayMs: 3_000, // lighter delay for cron — LLM scans themselves take ~15-30s each
  });

  // ── Last batch: generate monthly summary ──────────────────────────────────

  let summary = null;
  const isLastBatch = batchIndex === 9;

  if (isLastBatch) {
    try {
      // Brief pause to ensure all prior batches have finished writing to DB
      await new Promise((resolve) => setTimeout(resolve, 5_000));
      summary = await generateMonthlySummary(month);
      console.log(`[monthly-index] Summary generated for ${month}`);
    } catch (err) {
      console.error("[monthly-index] Summary generation failed:", err);
    }
  }

  return NextResponse.json({
    ok: true,
    batch: batchIndex,
    month,
    scanned: results.length,
    errors: results.filter((r) => r.error).length,
    results,
    summary: summary ?? undefined,
  });
}
