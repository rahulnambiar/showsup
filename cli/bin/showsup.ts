#!/usr/bin/env node
/**
 * ShowsUp CLI
 *
 * Standalone:  npx tsx cli/bin/showsup.ts scan https://yoursite.com
 * Cloud:       npx tsx cli/bin/showsup.ts scan https://yoursite.com --cloud --token st_xxx
 *
 * Or after npm link / global install: showsup scan https://yoursite.com
 */

import { Command } from "commander";
import { registerScan }    from "../src/commands/scan";
import { registerFix }     from "../src/commands/fix";
import { registerScore }   from "../src/commands/score";
import { registerCompare } from "../src/commands/compare";
import { registerVerify }  from "../src/commands/verify";
import { loadConfig, applyEnvFromConfig, saveConfig } from "../src/config";

// Apply saved API keys before any command runs
const config = loadConfig();
applyEnvFromConfig(config);

const program = new Command();

program
  .name("showsup")
  .description("Open source AEO agent — scan AI visibility and generate fixes")
  .version("0.1.0");

// ── Commands ──────────────────────────────────────────────────────────────────

registerScan(program);
registerFix(program);
registerScore(program);
registerCompare(program);
registerVerify(program);

// ── Auth: save cloud token ────────────────────────────────────────────────────

program
  .command("auth <token>")
  .description("Save a ShowsUp cloud API token")
  .option("--url <url>", "Custom API URL (self-hosted cloud instance)")
  .action((token: string, opts: { url?: string }) => {
    saveConfig({ cloud_token: token, ...(opts.url ? { cloud_url: opts.url } : {}) });
    console.log("✓ Token saved to ~/.showsup/config.json");
    if (opts.url) console.log(`  API URL: ${opts.url}`);
  });

// ── Config: set API keys ──────────────────────────────────────────────────────

program
  .command("config")
  .description("Configure API keys for standalone mode")
  .option("--anthropic <key>",  "Anthropic API key")
  .option("--openai <key>",     "OpenAI API key")
  .action((opts: { anthropic?: string; openai?: string }) => {
    const updates: Record<string, string> = {};
    if (opts.anthropic) updates.anthropic_key = opts.anthropic;
    if (opts.openai)    updates.openai_key    = opts.openai;
    if (Object.keys(updates).length === 0) {
      const current = loadConfig();
      console.log("Current config (~/.showsup/config.json):");
      console.log(`  anthropic_key: ${current.anthropic_key ? "set" : "not set"}`);
      console.log(`  openai_key:    ${current.openai_key    ? "set" : "not set"}`);
      console.log(`  cloud_token:   ${current.cloud_token   ? "set" : "not set"}`);
      console.log(`  cloud_url:     ${current.cloud_url     ?? "https://showsup.co (default)"}`);
      return;
    }
    saveConfig(updates);
    console.log("✓ Config saved to ~/.showsup/config.json");
  });

program.parse(process.argv);
