import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const CONFIG_DIR  = join(homedir(), ".showsup");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export interface CliConfig {
  anthropic_key?: string;
  openai_key?: string;
  cloud_token?: string;
  cloud_url?: string;
}

export function loadConfig(): CliConfig {
  try {
    if (!existsSync(CONFIG_FILE)) return {};
    return JSON.parse(readFileSync(CONFIG_FILE, "utf8")) as CliConfig;
  } catch {
    return {};
  }
}

export function saveConfig(updates: Partial<CliConfig>): void {
  const current = loadConfig();
  const merged  = { ...current, ...updates };
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2) + "\n", "utf8");
}

/** Apply API keys from config to process.env so the engine can pick them up. */
export function applyEnvFromConfig(config: CliConfig): void {
  if (config.anthropic_key && !process.env.ANTHROPIC_API_KEY) {
    process.env.ANTHROPIC_API_KEY = config.anthropic_key;
  }
  if (config.openai_key && !process.env.OPENAI_API_KEY) {
    process.env.OPENAI_API_KEY = config.openai_key;
  }
}

/** Returns the effective cloud token (flag > env > config). */
export function resolveCloudToken(flagToken?: string): string | undefined {
  return flagToken ?? process.env.SHOWSUP_TOKEN ?? loadConfig().cloud_token;
}

/** Returns the effective cloud URL. */
export function resolveCloudUrl(config: CliConfig): string {
  return config.cloud_url ?? process.env.SHOWSUP_API_URL ?? "https://showsup.co";
}

export function hasAnyProvider(): boolean {
  return !!(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
}
