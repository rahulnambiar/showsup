/**
 * Shared analyst system prompt builder for report chat.
 */

export const FREE_CHAT_MESSAGES = 5;
export const CHAT_TOKEN_COST    = 2;

export type ChatMessage = { role: "user" | "assistant"; content: string };

type ScanRow    = Record<string, unknown>;
type ResultRow  = {
  model:           string;
  prompt:          string | null;
  response:        string | null;
  brand_mentioned: boolean | null;
  score:           number | null;
  sentiment:       string | null;
  key_context:     string | null;
};
type FixRow = { type?: string; description?: string; estimated_impact?: string };

export function buildAnalystPrompt(
  scan:    ScanRow,
  results: ResultRow[],
  fixes:   FixRow[] | null,
): string {
  const categoryScores = scan.category_scores as Record<string, number> | null;
  const cd = scan.competitors_data as {
    brand_profile?:  { mention_rate?: number; sentiment?: string | null };
    competitors?:    Array<{ name: string; mention_rate?: number; avg_position?: number | null; sentiment?: string | null }>;
    share_of_voice?: Array<{ name: string; share: number; mentions: number }>;
    insights?:       string[];
    recommendations?: Array<{ title: string; description: string; priority: string }>;
  } | null;
  const regional = scan.regional_scores as Record<string, { score: number }> | null;
  const recs = (
    (scan.recommendations as Array<{ title: string; description: string; priority: string }> | null) ??
    cd?.recommendations ??
    []
  );

  // Group results by platform
  const byModel: Record<string, ResultRow[]> = {};
  for (const r of results) {
    (byModel[r.model] ??= []).push(r);
  }

  const missed = results.filter(r => !r.brand_mentioned).slice(0, 10);
  const won    = results.filter(r =>  r.brand_mentioned).slice(0, 5);

  const platformLines = Object.entries(byModel).map(([model, rs]) => {
    const avg       = Math.round(rs.reduce((s, r) => s + (r.score ?? 0), 0) / Math.max(1, rs.length));
    const mentioned = rs.some(r => r.brand_mentioned);
    return `- ${model}: ${avg}/100 (${mentioned ? "brand mentioned" : "brand NOT mentioned"})`;
  }).join("\n");

  const categoryLines = categoryScores
    ? Object.entries(categoryScores).map(([k, v]) => `- ${k}: ${v}/100`).join("\n")
    : "No category breakdown available";

  const wonLines = won.length
    ? won.map(r => `- [${r.model}] "${r.prompt}" → ${r.sentiment ?? "neutral"} — "${r.key_context ?? ""}"`).join("\n")
    : "Brand not mentioned in any queried responses";

  const missedLines = missed.length
    ? missed.map(r => `- [${r.model}] "${r.prompt}"`).join("\n")
    : "Brand appears in all queries";

  const compLines = cd?.competitors?.length
    ? cd.competitors.slice(0, 8).map(c =>
        `- ${c.name}: mention_rate=${c.mention_rate ?? 0}%, avg_position=${c.avg_position ?? "N/A"}, sentiment=${c.sentiment ?? "N/A"}`
      ).join("\n")
    : "No competitor data available";

  const sovLines = cd?.share_of_voice?.length
    ? `\n## SHARE OF VOICE\n${cd.share_of_voice.map(s => `- ${s.name}: ${s.share}% (${s.mentions} mentions)`).join("\n")}`
    : "";

  const regionalLines = regional && Object.keys(regional).filter(k => k !== "global").length > 0
    ? Object.entries(regional).filter(([k]) => k !== "global").map(([r, d]) => `- ${r}: ${d.score}/100`).join("\n")
    : "No regional data (global scan only)";

  const recLines = recs.length
    ? recs.map(r => `- [${r.priority}] ${r.title}: ${r.description}`).join("\n")
    : "No recommendations available";

  const fixLines = fixes?.length
    ? fixes.map(f => `- ${f.type ?? "fix"}: ${f.description ?? ""}${f.estimated_impact ? ` — Impact: ${f.estimated_impact}` : ""}`).join("\n")
    : "No fix files generated yet";

  return `You are ShowsUp's AI Analyst — an expert in AI brand visibility, AEO (Answer Engine Optimization), and digital marketing strategy. You help marketers understand their AI visibility report and take concrete action.

You have COMPLETE access to this scan's data. Be specific — use actual numbers, queries, and competitors. Never fabricate data.

## BRAND
- Brand: ${scan.brand_name}
- URL: ${scan.website ?? "Not provided"}
- Category: ${scan.category ?? "Other"}
- Overall ShowsUp Score: **${scan.overall_score}/100**

## PLATFORM SCORES
${platformLines || "No platform data"}

## VISIBILITY BY CATEGORY
${categoryLines}

## QUERIES WHERE YOUR BRAND APPEARS (${won.length} of ${results.length} total)
${wonLines}

## KEY GAPS — QUERIES WHERE YOU DON'T APPEAR (top missed)
${missedLines}

## COMPETITOR DATA
${compLines}
${sovLines}

## REGIONAL PERFORMANCE
${regionalLines}

## RECOMMENDATIONS
${recLines}

## GENERATED FIX FILES
${fixLines}

## YOUR ROLE
- Keep answers SHORT — 3 to 5 sentences max unless the user explicitly asks for a full plan or list.
- Lead with the key number or insight. **Bold key numbers**.
- Be specific: use actual scores, query text, and competitor names from the data above.
- No preamble, no restating the question, no filler phrases ("Great question!", "Of course!", etc.).
- Use bullet points only when listing 3+ items — never for a single point.
- Tone: sharp consultant. Direct, data-backed, zero fluff.
- If asked about data you don't have, say so in one sentence.`;
}
