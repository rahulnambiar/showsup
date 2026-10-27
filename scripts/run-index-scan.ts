/**
 * Run the monthly index scan locally against production Supabase.
 * Usage: npx tsx --tsconfig tsconfig.json scripts/run-index-scan.ts [batch=0]
 *
 * Batches 0-9, 10 brands each. Pass "all" to run all 10 batches sequentially.
 */

// Load .env.local before anything else
import { config } from "dotenv";
config({ path: ".env.local" });

import { BRAND_INDEX } from "../lib/brand-index/brands";
import { runBatchScan } from "../lib/brand-index/index-scanner";

const arg = process.argv[2] ?? "0";
const BATCH_SIZE = 10;

function currentMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function runBatch(batchIndex: number, month: string) {
  const start = batchIndex * BATCH_SIZE;
  const brands = BRAND_INDEX.slice(start, start + BATCH_SIZE);
  if (brands.length === 0) {
    console.log(`Batch ${batchIndex}: no brands, skipping.`);
    return;
  }
  console.log(`\n=== Batch ${batchIndex}: brands ${start + 1}–${start + brands.length} (${month}) ===`);
  const results = await runBatchScan({ brands, month, delayMs: 3_000 });
  const ok = results.filter((r) => !r.error).length;
  const errs = results.filter((r) => r.error).length;
  console.log(`Batch ${batchIndex} complete — ${ok} ok, ${errs} errors`);
  for (const r of results) {
    if (r.error) console.error(`  ERROR ${r.brand}: ${r.error}`);
    else console.log(`  ${r.brand}: ${r.composite_score} (delta: ${r.score_delta ?? "N/A"})`);
  }
}

async function main() {
  const month = currentMonth();
  console.log(`Month: ${month}`);

  if (arg === "all") {
    for (let i = 0; i <= 9; i++) {
      await runBatch(i, month);
    }
  } else {
    const batchIndex = parseInt(arg, 10);
    if (isNaN(batchIndex) || batchIndex < 0 || batchIndex > 9) {
      console.error("Usage: npx tsx scripts/run-index-scan.ts [0-9|all]");
      process.exit(1);
    }
    await runBatch(batchIndex, month);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
