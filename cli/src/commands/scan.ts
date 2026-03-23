import chalk from "chalk";
import ora from "ora";
import type { Command } from "commander";
import { detectBrand } from "../../../lib/engine/detect-brand";
import { runScan } from "../../../lib/engine/scan";
import type { ScanInput } from "../../../lib/engine/types";
import { formatJson } from "../output/json";
import { formatTable } from "../output/table";
import { loadConfig, applyEnvFromConfig, resolveCloudToken, resolveCloudUrl, hasAnyProvider } from "../config";
import { CloudClient } from "../cloud";

export function registerScan(program: Command): void {
  program
    .command("scan <url>")
    .description("Scan a brand's AI visibility")
    .option("-d, --depth <depth>", "Scan depth: quick|standard|deep", "standard")
    .option("-p, --platforms <platforms>", "Comma-separated: claude,chatgpt", "claude,chatgpt")
    .option("-o, --output <format>", "Output format: table|json|markdown", "table")
    .option("--brand <name>",    "Brand name (skip auto-detection)")
    .option("--category <cat>",  "Category (skip auto-detection)")
    .option("--cloud",           "Use cloud API (requires --token or SHOWSUP_TOKEN)")
    .option("--token <token>",   "ShowsUp API token for cloud mode")
    .action(async (url: string, opts: {
      depth: string;
      platforms: string;
      output: string;
      brand?: string;
      category?: string;
      cloud?: boolean;
      token?: string;
    }) => {
      const config = loadConfig();
      applyEnvFromConfig(config);

      // Validate depth
      const depthMap: Record<string, "quick_check" | "standard" | "deep"> = {
        quick: "quick_check", standard: "standard", deep: "deep",
      };
      const scanDepth: "quick_check" | "standard" | "deep" = depthMap[opts.depth] ?? "standard";

      // Parse platforms
      const platforms = opts.platforms.split(",").map((p) => p.trim().toLowerCase());
      const models    = {
        chatgpt: platforms.includes("chatgpt"),
        claude:  platforms.includes("claude"),
      };

      try {
        // ── Cloud mode ──────────────────────────────────────────────────────
        if (opts.cloud) {
          const token   = resolveCloudToken(opts.token);
          if (!token) {
            console.error(chalk.red("Cloud mode requires a token. Use --token or set SHOWSUP_TOKEN."));
            process.exit(1);
          }
          const client = new CloudClient(token, resolveCloudUrl(config));
          const spinner = ora("Running cloud scan…").start();
          try {
            const result = await client.scan({
              brand:    opts.brand ?? url,
              category: opts.category ?? "Other",
              url,
              reportConfig: { type: scanDepth, addons: [], extra_competitors: 0 },
              models,
            });
            spinner.succeed("Scan complete");
            printResult(result, opts.output);
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
          console.error(chalk.dim("Or use --cloud --token <token> for cloud mode."));
          process.exit(1);
        }

        // Detect brand (or use flags)
        let brand    = opts.brand;
        let category = opts.category ?? "Other";
        let niche    = "";
        let competitors: string[] = [];

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
            spinner.fail("Brand detection failed");
            console.error(chalk.dim(String(err instanceof Error ? err.message : err)));
            brand    = new URL(url.startsWith("http") ? url : "https://" + url).hostname.split(".")[0] ?? "Brand";
            category = "Other";
          }
        }

        console.log();

        // Run scan
        const scanInput: ScanInput = {
          brand,
          category,
          niche,
          url,
          competitors,
          reportConfig: { type: scanDepth, addons: [], extra_competitors: competitors.length },
          models,
        };

        // Show per-model progress
        const activeModels: string[] = [];
        if (models.chatgpt && process.env.OPENAI_API_KEY)    activeModels.push("ChatGPT");
        if (models.claude  && process.env.ANTHROPIC_API_KEY) activeModels.push("Claude");

        const spinner = ora(`Scanning across ${activeModels.join(", ")}…`).start();
        const result  = await runScan(scanInput);
        spinner.succeed(`Scan complete — ${result.overall_score}/100`);

        console.log();
        printResult(result, opts.output);
      } catch (err) {
        console.error(chalk.red("Scan failed:"), err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });
}

function printResult(result: Parameters<typeof formatTable>[0], format: string): void {
  if (format === "json") {
    console.log(formatJson(result));
  } else {
    console.log(formatTable(result));
  }
}
