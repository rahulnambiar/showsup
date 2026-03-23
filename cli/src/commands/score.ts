import chalk from "chalk";
import ora from "ora";
import type { Command } from "commander";
import { detectBrand } from "../../../lib/engine/detect-brand";
import { runScan } from "../../../lib/engine/scan";
import { formatScoreLine } from "../output/table";
import { loadConfig, applyEnvFromConfig, hasAnyProvider } from "../config";

export function registerScore(program: Command): void {
  program
    .command("score <url>")
    .description("Get a quick AI visibility score for a URL")
    .option("--brand <name>",    "Brand name (skip auto-detection)")
    .option("--category <cat>",  "Category")
    .action(async (url: string, opts: { brand?: string; category?: string }) => {
      const config = loadConfig();
      applyEnvFromConfig(config);

      if (!hasAnyProvider()) {
        console.error(chalk.red("No API keys configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY."));
        process.exit(1);
      }

      let brand    = opts.brand;
      let category = opts.category ?? "Other";
      let niche    = "";
      let competitors: string[] = [];

      if (!brand) {
        const spinner = ora(`Detecting brand…`).start();
        try {
          const info  = await detectBrand(url);
          brand       = info.brand_name;
          category    = info.category;
          niche       = info.niche;
          competitors = info.competitors;
          spinner.succeed(`${chalk.bold(brand)} — ${category}`);
        } catch {
          spinner.stop();
          brand    = new URL(url.startsWith("http") ? url : "https://" + url).hostname.split(".")[0] ?? "Brand";
          category = "Other";
        }
      }

      const spinner = ora("Scanning…").start();
      try {
        const result = await runScan({
          brand,
          category,
          niche,
          url,
          competitors,
          reportConfig: { type: "quick_check", addons: [], extra_competitors: 0 },
        });
        spinner.succeed("Done");
        console.log();
        console.log("  " + formatScoreLine(result));
        console.log();
        for (const mr of result.results) {
          const col = mr.score >= 70 ? chalk.green : mr.score >= 45 ? chalk.yellow : chalk.red;
          console.log(`  ${mr.label.padEnd(10)} ${col(mr.score + "/100")}  ${mr.mentioned ? chalk.green("mentioned") : chalk.dim("not mentioned")}`);
        }
        console.log();
        console.log(chalk.dim(`  Run 'showsup scan ${url}' for the full report`));
      } catch (err) {
        spinner.fail(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });
}
