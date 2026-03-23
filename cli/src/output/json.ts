import type { ScanOutput } from "../../../lib/engine/types";

function scoreVerdict(score: number): string {
  if (score >= 80) return "Excellent — strong AI presence";
  if (score >= 65) return "Good presence — room to grow";
  if (score >= 45) return "Average — needs improvement";
  if (score >= 25) return "Weak — significant gaps";
  return "Very low — not yet visible to AI";
}

export function formatJson(result: ScanOutput): string {
  const platforms: Record<string, unknown> = {};
  for (const mr of result.results) {
    platforms[mr.model] = {
      score:        mr.score,
      mention_rate: +(mr.prompts.filter((p) => p.mentioned).length / Math.max(1, mr.prompts.length)).toFixed(2),
      sentiment:    mr.prompts
        .filter((p) => p.analysis.sentiment)
        .map((p) => p.analysis.sentiment)
        .reduce((acc: Record<string, number>, s) => {
          if (s) acc[s] = (acc[s] ?? 0) + 1;
          return acc;
        }, {} as Record<string, number>),
    };
  }

  const competitors = result.competitors_data.competitors.slice(0, 5).map((c) => ({
    name:  c.name,
    score: Math.round(c.mention_rate * 0.7 + (c.recommend_count / Math.max(1, c.total_queries)) * 30),
  }));

  const top_opportunities: string[] = [];
  const sorted = Object.entries(result.category_scores).sort(([, a], [, b]) => a - b);
  for (const [cat] of sorted.slice(0, 2)) {
    top_opportunities.push(
      `Not well represented for "${cat.replace("_", " ")}" queries — high AI search volume category`
    );
  }

  const output = {
    brand:    result.brand,
    url:      result.url,
    category: result.category,
    score:    result.overall_score,
    verdict:  scoreVerdict(result.overall_score),
    platforms,
    category_scores: result.category_scores,
    competitors,
    top_opportunities,
    recommendations: result.recommendations.slice(0, 3).map((r) => r.title),
    fixes_available: ["llms_txt", "schema", "content_briefs", "comparison_pages", "citation_playbook", "crawlability_audit", "brand_narrative"],
  };

  return JSON.stringify(output, null, 2);
}
