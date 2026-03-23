import chalk from "chalk";
import ora from "ora";
import type { Command } from "commander";
import { detectBrand } from "../../../lib/engine/detect-brand";
import { runScan } from "../../../lib/engine/scan";
import { loadConfig, applyEnvFromConfig, resolveCloudToken, resolveCloudUrl, hasAnyProvider } from "../config";
import { CloudClient } from "../cloud";

export function registerVerify(program: Command): void {
  program
    .command("verify <url>")
    .description("Re-scan a URL and compare against a baseline score or scan ID")
    .option("-b, --baseline <value>",  "Baseline score (number) or scan_id from a previous scan")
    .option("--brand <name>",          "Brand name")
    .option("--category <cat>",        "Category")
    .option("--cloud",                 "Use cloud API")
    .option("--token <token>",         "ShowsUp API token")
    .action(async (url: string, opts: {
      baseline?: string;
      brand?: string;
      category?: string;
      cloud?: boolean;
      token?: string;
    }) => {
      const config = loadConfig();
      applyEnvFromConfig(config);

      if (!opts.cloud && !hasAnyProvider()) {
        console.error(chalk.red("No API keys configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY."));
        process.exit(1);
      }

      let brand    = opts.brand;
      let category = opts.category ?? "Other";
      let niche    = "";
      let competitors: string[] = [];

      if (!brand) {
        const spinner = ora("Detecting brand…").start();
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
          category = "Other";
        }
      }

      // Parse baseline
      let baselineScore: number | null = null;
      if (opts.baseline) {
        const parsed = parseInt(opts.baseline, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
          baselineScore = parsed;
        } else {
          // Treat as scan_id — for now just note it (cloud would look it up)
          console.log(chalk.dim(`  Using scan_id as baseline: ${opts.baseline}`));
        }
      }

      const spinner = ora("Running scan…").start();
      let newScore: number;

      try {
        if (opts.cloud) {
          const token = resolveCloudToken(opts.token);
          if (!token) {
            spinner.fail("Cloud mode requires a token.");
            process.exit(1);
          }
          const client = new CloudClient(token, resolveCloudUrl(config));
          const result = await client.scan({ brand: brand!, category, url, niche, competitors });
          newScore = result.overall_score;
        } else {
          const result = await runScan({
            brand:        brand!,
            category,
            niche,
            url,
            competitors,
            reportConfig: { type: "standard", addons: [], extra_competitors: 0 },
          });
          newScore = result.overall_score;
        }
        spinner.succeed(`New score: ${newScore}/100`);
      } catch (err) {
        spinner.fail(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }

      console.log();

      if (baselineScore !== null) {
        const delta = newScore - baselineScore;
        const sign  = delta >= 0 ? "+" : "";
        const color = delta >= 5 ? chalk.green : delta > 0 ? chalk.yellow : delta === 0 ? chalk.gray : chalk.red;

        console.log(`  ${chalk.bold(brand!)}  ${chalk.dim("baseline:")} ${baselineScore}/100  →  ${chalk.bold(newScore + "/100")}  ${color(sign + delta)}`);
        console.log();

        if (delta >= 10) {
          console.log(chalk.green("  Significant improvement! AI models are picking up your changes."));
        } else if (delta >= 3) {
          console.log(chalk.yellow("  Modest improvement. Keep implementing fixes."));
        } else if (delta === 0) {
          console.log(chalk.dim("  No change detected yet. Allow 2-4 weeks for changes to be indexed."));
        } else {
          console.log(chalk.red("  Score dropped. Check for content removals or crawlability issues."));
        }
      } else {
        console.log(`  ${chalk.bold(brand!)} current score: ${chalk.bold(newScore + "/100")}`);
        console.log(chalk.dim("  Use --baseline <score> on next run to track improvement."));
      }

      console.log();
    });
}
