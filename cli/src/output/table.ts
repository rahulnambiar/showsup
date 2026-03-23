import chalk from "chalk";
import type { ScanOutput } from "../../../lib/engine/types";

const WIDTH = 52;

function scoreColor(score: number): typeof chalk {
  if (score >= 70) return chalk.green;
  if (score >= 45) return chalk.yellow;
  return chalk.red;
}

function bar(score: number, width = 25): string {
  const filled = Math.round((score / 100) * width);
  const empty  = width - filled;
  return chalk.green("█".repeat(filled)) + chalk.gray("░".repeat(empty));
}

function line(content: string, pad = true): string {
  const inner  = pad ? ` ${content}` : content;
  const spaces = Math.max(0, WIDTH - 2 - Array.from(inner).length);
  return `│${inner}${" ".repeat(spaces)}│`;
}

function divider(): string {
  return `├${"─".repeat(WIDTH - 2)}┤`;
}

function scoreVerdict(score: number): string {
  if (score >= 80) return "Excellent — strong AI presence";
  if (score >= 65) return "Good presence — room to grow";
  if (score >= 45) return "Average — needs improvement";
  if (score >= 25) return "Weak — significant gaps";
  return "Very low — not yet visible to AI";
}

export function formatTable(result: ScanOutput): string {
  const lines: string[] = [];
  const top    = `┌${"─".repeat(WIDTH - 2)}┐`;
  const bottom = `└${"─".repeat(WIDTH - 2)}┘`;

  lines.push(top);

  // Header: score + verdict
  const score   = result.overall_score;
  const verdict = scoreVerdict(score);
  const colored = scoreColor(score)(`${score}/100`);
  lines.push(line(`ShowsUp Score: ${colored} — ${verdict}`));

  // Brand info
  const urlDisplay = result.url ? ` (${result.url.replace(/^https?:\/\//, "")})` : "";
  lines.push(line(chalk.dim(`Brand: ${result.brand}${urlDisplay} • ${result.category}`)));

  // Per-platform scores
  if (result.results.length > 0) {
    lines.push(divider());
    for (const mr of result.results) {
      const label = mr.label.padEnd(8);
      const b     = bar(mr.score);
      const s     = scoreColor(mr.score)(String(mr.score).padStart(3));
      lines.push(line(`${label} ${b} ${s}`));
    }
  }

  // Category scores (top 3 and bottom 2)
  const catEntries = Object.entries(result.category_scores).sort(([, a], [, b]) => b - a);
  if (catEntries.length > 0) {
    lines.push(divider());
    lines.push(line(chalk.bold("Category Scores:")));
    for (const [cat, s] of catEntries.slice(0, 4)) {
      const label = cat.replace("_", " ").padEnd(16);
      const mini  = bar(s, 15);
      lines.push(line(`  ${label} ${mini} ${scoreColor(s)(String(s))}`));
    }
  }

  // Top competitors
  const comps = result.competitors_data.competitors.slice(0, 3);
  if (comps.length > 0) {
    lines.push(divider());
    lines.push(line(chalk.bold("Competitor Visibility:")));
    for (const c of comps) {
      const rate = `${c.mention_rate}% mentions`;
      lines.push(line(`  ${c.name.padEnd(18)} ${chalk.dim(rate)}`));
    }
  }

  // Top recommendation
  if (result.recommendations.length > 0) {
    lines.push(divider());
    lines.push(line(chalk.bold("Top Recommendation:")));
    const rec   = result.recommendations[0]!;
    const words = rec.title.split(" ");
    let   curr  = "  ";
    for (const word of words) {
      if (curr.length + word.length + 1 > WIDTH - 4) {
        lines.push(line(curr.trimEnd()));
        curr = "  " + word + " ";
      } else {
        curr += word + " ";
      }
    }
    if (curr.trim()) lines.push(line(curr.trimEnd()));

    lines.push(line(""));
    lines.push(line(chalk.dim("  Run `showsup fix` to generate implementation files")));
  }

  lines.push(bottom);
  return lines.join("\n");
}

export function formatScoreLine(result: ScanOutput): string {
  const sc = scoreColor(result.overall_score);
  return `${result.brand}: ${sc(`${result.overall_score}/100`)} — ${scoreVerdict(result.overall_score)}`;
}
