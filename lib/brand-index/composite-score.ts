/**
 * Composite score calculator for the Brand Index.
 * Combines 6 signal scores into a weighted 0-100 composite.
 */

export const SIGNAL_WEIGHTS = {
  llm_probing: 0.30,
  structured_data: 0.20,
  training_data: 0.15,
  citation_sources: 0.15,
  search_correlation: 0.10,
  crawler_readiness: 0.10,
} as const;

export type SignalKey = keyof typeof SIGNAL_WEIGHTS;

export interface SignalBreakdown {
  score: number;       // raw signal score (0-100)
  weighted: number;    // score * weight (0-100 range contribution)
  weight: number;      // weight percentage (e.g. 0.30)
}

export interface CompositeScoreResult {
  composite: number;
  breakdown: Record<SignalKey, SignalBreakdown>;
}

export interface SignalScores {
  llm_probing: number;
  structured_data: number;
  training_data: number;
  citation_sources: number;
  search_correlation: number;
  crawler_readiness: number;
}

/**
 * Derive crawler_readiness score from the allowed_crawler_count
 * produced by Signal 2 (structured data).
 */
export function crawlerReadinessScore(allowedCrawlerCount: number): number {
  if (allowedCrawlerCount >= 5) return 90;
  if (allowedCrawlerCount === 4) return 80;
  if (allowedCrawlerCount >= 2) return 50;
  return 20;
}

/**
 * Compute the composite score from 6 signal scores.
 * All input scores must be in the range [0, 100].
 */
export function computeCompositeScore(signals: SignalScores): CompositeScoreResult {
  let composite = 0;
  const breakdown = {} as Record<SignalKey, SignalBreakdown>;

  for (const [key, weight] of Object.entries(SIGNAL_WEIGHTS) as [SignalKey, number][]) {
    const score = Math.max(0, Math.min(100, signals[key]));
    const weighted = score * weight;
    composite += weighted;
    breakdown[key] = { score, weighted: Math.round(weighted * 10) / 10, weight };
  }

  return {
    composite: Math.round(composite),
    breakdown,
  };
}
