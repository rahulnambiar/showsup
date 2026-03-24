import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import chalk from "chalk";
import ora from "ora";
import type { Command } from "commander";
import { detectBrand } from "../../../lib/engine/detect-brand";
import { runScan } from "../../../lib/engine/scan";
import { generateFixes } from "../../../lib/fixes/generator";
import type { FixType } from "../../../lib/fixes/types";
import { ALL_FIX_TYPES } from "../../../lib/fixes/types";
import { loadConfig, applyEnvFromConfig, resolveCloudToken, resolveCloudUrl, hasAnyProvider } from "../config";
import { CloudClient } from "../cloud";

export function registerFix(program: Command): void {
  program
    .command("fix <url>")
    .description("Generate AEO fix files for a brand")
    .option("-o, --output <dir>",  "Output directory", "./fixes")
    .option("-t, --type <types>",  `Fix type(s): ${ALL_FIX_TYPES.join(",")}`)
    .option("--brand <name>",      "Brand name (skip auto-detection)")
    .option("--category <cat>",    "Category (skip auto-detection)")
    .option("--region <code>",     "Region code for regional fix content (e.g. sg, us, uk)")
    .option("--cloud",             "Use cloud API")
    .option("--token <token>",     "ShowsUp API token")
    .action(async (url: string, opts: {
      output: string;
      type?: string;
      brand?: string;
      category?: string;
      region?: string;
      cloud?: boolean;
      token?: string;
    }) => {
      const config = loadConfig();
      applyEnvFromConfig(config);

      // Parse fix types
      const types: FixType[] = opts.type
        ? opts.type.split(",").map((t) => t.trim() as FixType).filter((t) => ALL_FIX_TYPES.includes(t))
        : ALL_FIX_TYPES;

      if (types.length === 0) {
        console.error(chalk.red(`Invalid fix type. Choose from: ${ALL_FIX_TYPES.join(", ")}`));
        process.exit(1);
      }

      try {
        // ── Cloud mode ──────────────────────────────────────────────────────
        if (opts.cloud) {
          const token = resolveCloudToken(opts.token);
          if (!token) {
            console.error(chalk.red("Cloud mode requires a token. Use --token or set SHOWSUP_TOKEN."));
            process.exit(1);
          }
          const client  = new CloudClient(token, resolveCloudUrl(config));
          const spinner = ora("Generating fixes via cloud…").start();
          try {
            const result = await client.fix({
              brand:    opts.brand ?? url,
              category: opts.category ?? "Other",
              url,
              types,
            });
            spinner.succeed("Fixes generated");
            writeFixFiles(result.fixes, opts.output);
            printSummary(result.fixes, opts.output, result.estimated_impact);
          } catch (err) {
            spinner.fail(String(err instanceof Error ? err.message : err));
            process.exit(1);
          }
          return;
        }

        // ── Standalone mode ─────────────────────────────────────────────────
        if (!hasAnyProvider()) {
          console.error(chalk.red("No API keys configured."));
          console.error(chalk.dim("Set ANTHROPIC_API_KEY or OPENAI_API_KEY in your environment."));
          process.exit(1);
        }

        // Detect brand
        let brand      = opts.brand;
        let category   = opts.category ?? "Other";
        let niche      = "";
        let competitors: string[] = [];
        let category_scores: Record<string, number> | undefined;
        let recommendations: Array<{ title: string; description: string; priority: string }> | undefined;

        if (!brand) {
          const spinner = ora(`Detecting brand from ${url}…`).start();
          try {
            const info = await detectBrand(url);
            brand      = info.brand_name;
            category   = info.category;
            niche      = info.niche;
            competitors = info.competitors;
            spinner.succeed(`${chalk.bold(brand)} — ${category}`);
          } catch (err) {
            spinner.fail("Brand detection failed — using URL as brand name");
            brand    = new URL(url.startsWith("http") ? url : "https://" + url).hostname.split(".")[0] ?? "Brand";
            category = "Other";
          }
        }

        // Quick scan for context (improves fix quality)
        const scanSpinner = ora("Running quick scan for context…").start();
        try {
          const scan = await runScan({ brand, category, niche, url, competitors, reportConfig: { type: "quick_check", addons: [], extra_competitors: 0 } });
          category_scores = scan.category_scores;
          recommendations = scan.recommendations;
          scanSpinner.succeed(`Scan: ${scan.overall_score}/100 — context ready`);
        } catch {
          scanSpinner.warn("Quick scan skipped — generating fixes from brand info only");
        }

        console.log();
        console.log(chalk.dim("  Generating fix files…"));
        console.log();

        const fixResult = await generateFixes({
          brand:    brand!,
          category,
          url,
          niche,
          competitors,
          category_scores,
          recommendations,
          types,
          region: opts.region,
        });

        writeFixFiles(fixResult.fixes, opts.output);
        printSummary(fixResult.fixes, opts.output, fixResult.estimated_impact);
      } catch (err) {
        console.error(chalk.red("Fix generation failed:"), err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });
}

function writeFixFiles(
  fixes: Array<{ filename: string; content: string; sizeBytes: number; description: string }>,
  outputDir: string
): void {
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
  for (const fix of fixes) {
    writeFileSync(join(outputDir, fix.filename), fix.content, "utf8");
    const sizeKb = (fix.sizeBytes / 1024).toFixed(1);
    console.log(`  ${chalk.green("✓")} Generated ${chalk.bold(outputDir + "/" + fix.filename)} — ${fix.description} (${sizeKb} KB)`);
  }
}

function printSummary(
  fixes: Array<{ filename: string }>,
  outputDir: string,
  impact: string
): void {
  console.log();
  console.log(`  ${chalk.bold(fixes.length + " files")} generated in ${chalk.cyan(outputDir)}`);
  console.log(`  Estimated impact: ${chalk.green(impact)}`);
  console.log();
}
