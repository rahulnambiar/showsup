import readline from "readline";
import chalk    from "chalk";
import ora      from "ora";
import type { Command } from "commander";
import { loadConfig, applyEnvFromConfig, resolveCloudToken, resolveCloudUrl } from "../config";

// ── Helper: stream a chat message via the v1 API ──────────────────────────────

interface ChatMsg { role: "user" | "assistant"; content: string }

async function streamChat(
  token:    string,
  baseUrl:  string,
  domain:   string,
  scanId:   string | undefined,
  messages: ChatMsg[],
): Promise<string> {
  const res = await fetch(`${baseUrl}/api/v1/chat`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ domain, scanId, messages }),
  });

  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try { errMsg = ((await res.json()) as { error?: string }).error ?? errMsg; } catch { /* ignore */ }
    throw new Error(errMsg);
  }

  const reader  = res.body!.getReader();
  const decoder = new TextDecoder();
  let full = "";

  process.stdout.write(chalk.green("AI Analyst: "));
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    full += chunk;
    process.stdout.write(chunk);
  }
  process.stdout.write("\n\n");
  return full;
}

// ── Register commands ─────────────────────────────────────────────────────────

export function registerChat(program: Command): void {
  // ── showsup ask <url> <question> ─────────────────────────────────────────
  program
    .command("ask <url> <question>")
    .description("Ask a single question about a brand's scan data")
    .option("--scan-id <id>", "Use a specific scan ID instead of latest")
    .option("--cloud",         "Use cloud API (required)")
    .option("--token <token>", "ShowsUp API token")
    .action(async (url: string, question: string, opts: {
      scanId?: string;
      cloud?:  boolean;
      token?:  string;
    }) => {
      const config = loadConfig();
      applyEnvFromConfig(config);

      const token = resolveCloudToken(opts.token);
      if (!token) {
        console.error(chalk.red("ask requires cloud mode. Provide --token or run: showsup auth <token>"));
        process.exit(1);
      }

      const baseUrl = resolveCloudUrl(config);
      const domain  = url.replace(/^https?:\/\//, "").split("/")[0];
      const spinner = ora(`Asking AI about ${domain}…`).start();

      try {
        spinner.stop();
        await streamChat(token, baseUrl, domain!, opts.scanId, [
          { role: "user", content: question },
        ]);
      } catch (err) {
        spinner.fail(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  // ── showsup chat <url> ────────────────────────────────────────────────────
  program
    .command("chat <url>")
    .description("Interactive AI chat session about a brand's scan data")
    .option("--scan-id <id>", "Use a specific scan ID instead of latest")
    .option("--cloud",         "Use cloud API (required)")
    .option("--token <token>", "ShowsUp API token")
    .action(async (url: string, opts: {
      scanId?: string;
      cloud?:  boolean;
      token?:  string;
    }) => {
      const config = loadConfig();
      applyEnvFromConfig(config);

      const token = resolveCloudToken(opts.token);
      if (!token) {
        console.error(chalk.red("chat requires cloud mode. Provide --token or run: showsup auth <token>"));
        process.exit(1);
      }

      const baseUrl   = resolveCloudUrl(config);
      const domain    = url.replace(/^https?:\/\//, "").split("/")[0]!;
      const messages: ChatMsg[] = [];

      console.log();
      console.log(chalk.bold("ShowsUp AI Analyst") + chalk.dim(` — ${domain}`));
      console.log(chalk.dim("Type a question and press Enter. Type 'exit' to quit.\n"));

      const rl = readline.createInterface({
        input:  process.stdin,
        output: process.stdout,
      });

      const ask = () => {
        rl.question(chalk.cyan("You: "), async (input) => {
          const trimmed = input.trim();
          if (!trimmed || trimmed.toLowerCase() === "exit" || trimmed.toLowerCase() === "quit") {
            console.log(chalk.dim("\nGoodbye!\n"));
            rl.close();
            return;
          }

          messages.push({ role: "user", content: trimmed });
          console.log();

          try {
            const reply = await streamChat(token, baseUrl, domain, opts.scanId, messages);
            messages.push({ role: "assistant", content: reply.trim() });
          } catch (err) {
            console.error(chalk.red("Error:"), err instanceof Error ? err.message : String(err));
            messages.pop(); // remove failed user message so conversation stays clean
          }

          ask();
        });
      };

      ask();
    });
}
