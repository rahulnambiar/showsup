import chalk from "chalk";
import ora from "ora";
import type { Command } from "commander";
import { detectBrand } from "../../../lib/engine/detect-brand";
import { runScan } from "../../../lib/engine/scan";
import type { ScanOutput } from "../../../lib/engine/types";
import { loadConfig, applyEnvFromConfig, hasAnyProvider } from "../config";

export function registerCompare(program: Command): void {
  program
    .command("compare <urlA> <urlB>")
    .description("Compare AI visibility of two brands")
    .option("-o, --output <format>", "Output: table|json", "table")
    .action(async (urlA: string, urlB: string, opts: { output: string }) => {
      const config = loadConfig();
      applyEnvFromConfig(config);

      if (!hasAnyProvider()) {
        console.error(chalk.red("No API keys configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY."));
        process.exit(1);
      }

      async function scanOne(url: string): Promise<ScanOutput> {
        let brand = "", category = "Other", niche = "", competitors: string[] = [];
        const spinner = ora(`Detecting ${url}…`).start();
        try {
          const info = await detectBrand(url);
          brand      = info.brand_name;
          category   = info.category;
          niche      = info.niche;
          competitors = info.competitors;
          spinner.succeed(`${chalk.bold(brand)} — ${category}`);
        } catch {
          spinner.stop();
          brand    = new URL(url.startsWith("http") ? url : "https://" + url).hostname.split(".")[0] ?? "Brand";
        }
        const scanSpinner = ora(`Scanning ${brand}…`).start();
        const result = await runScan({ brand, category, niche, url, competitors, reportConfig: { type: "quick_check", addons: [], extra_competitors: 0 } });
        scanSpinner.succeed(`${brand}: ${result.overall_score}/100`);
        return result;
      }

      // Run scans sequentially to avoid overwhelming APIs
      const a = await scanOne(urlA);
      const b = await scanOne(urlB);

      console.log();

      if (opts.output === "json") {
        console.log(JSON.stringify({ a: summarize(a), b: summarize(b), winner: a.overall_score >= b.overall_score ? a.brand : b.brand }, null, 2));
        return;
      }

      // Table comparison
      const W = 54;
      const top    = `┌${"─".repeat(W - 2)}┐`;
      const divid  = `├${"─".repeat(W - 2)}┤`;
      const bottom = `└${"─".repeat(W - 2)}┘`;

      function row(left: string, right: string): string {
        const mid = " ".repeat(Math.max(1, Math.floor((W - 2 - left.length - right.length) / 2)));
        const inner = ` ${left}${mid}${right}`;
        return `│${inner.padEnd(W - 2)}│`;
      }

      function col(score: number): typeof chalk {
        return score >= 70 ? chalk.green : score >= 45 ? chalk.yellow : chalk.red;
      }

      console.log(top);
      console.log(row(chalk.bold(a.brand), chalk.bold(b.brand)));
      console.log(row(col(a.overall_score)(`${a.overall_score}/100`), col(b.overall_score)(`${b.overall_score}/100`)));
      console.log(divid);

      // Per-platform
      const allModels = Array.from(new Set([...a.results.map((r) => r.model), ...b.results.map((r) => r.model)]));
      for (const m of allModels) {
        const ra = a.results.find((r) => r.model === m);
        const rb = b.results.find((r) => r.model === m);
        const la = ra ? `${ra.label}: ${col(ra.score)(String(ra.score))}` : chalk.dim("n/a");
        const lb = rb ? `${rb.label}: ${col(rb.score)(String(rb.score))}` : chalk.dim("n/a");
        console.log(row(la, lb));
      }

      console.log(divid);

      // Category comparison
      const cats = Object.keys(a.category_scores);
      for (const cat of cats.slice(0, 4)) {
        const sa = a.category_scores[cat] ?? 0;
        const sb = b.category_scores[cat] ?? 0;
        const label = cat.replace("_", " ");
        console.log(row(
          `${label.padEnd(14)} ${col(sa)(String(sa))}`,
          `${label.padEnd(14)} ${col(sb)(String(sb))}`
        ));
      }

      console.log(divid);
      const winner = a.overall_score >= b.overall_score ? a.brand : b.brand;
      const inner  = ` Winner: ${chalk.green.bold(winner)}`;
      console.log(`│${inner.padEnd(W - 2)}│`);
      console.log(bottom);
    });
}

function summarize(r: ScanOutput) {
  return {
    brand:           r.brand,
    url:             r.url,
    score:           r.overall_score,
    category_scores: r.category_scores,
  };
}
