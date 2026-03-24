/**
 * Correlation engine — computes Pearson correlation between user-uploaded
 * metric time series and ShowsUp scan scores, then generates AI insight text.
 */

export interface TimePoint {
  date: string;   // ISO date string e.g. "2025-01-15"
  value: number;
}

export interface ScanPoint {
  date: string;
  score: number;
  mention_rate?: number;
  sentiment_score?: number; // +1 positive, 0 neutral, -1 negative
}

export interface CorrelationResult {
  metric_name: string;
  source_name: string;
  pearson: number | null;
  sample_size: number;
  insight: string;
  trend: "rising" | "falling" | "flat" | "unknown";
}

// ── Maths ──────────────────────────────────────────────────────────────────

export function pearsonCorrelation(xs: number[], ys: number[]): number | null {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return null;
  const ax = xs.slice(0, n);
  const ay = ys.slice(0, n);
  const mx = ax.reduce((s, v) => s + v, 0) / n;
  const my = ay.reduce((s, v) => s + v, 0) / n;
  let num = 0, sdx = 0, sdy = 0;
  for (let i = 0; i < n; i++) {
    const dx = ax[i]! - mx;
    const dy = ay[i]! - my;
    num += dx * dy;
    sdx += dx * dx;
    sdy += dy * dy;
  }
  const denom = Math.sqrt(sdx * sdy);
  if (denom === 0) return null;
  return Math.round((num / denom) * 1000) / 1000;
}

/** Align two time series by date — inner join on shared dates. */
function alignSeries(
  a: TimePoint[],
  b: TimePoint[],
): { av: number[]; bv: number[] } {
  const bMap = new Map(b.map((p) => [p.date, p.value]));
  const av: number[] = [];
  const bv: number[] = [];
  for (const p of a) {
    const bVal = bMap.get(p.date);
    if (bVal !== undefined) {
      av.push(p.value);
      bv.push(bVal);
    }
  }
  return { av, bv };
}

/** Detect trend direction from a series. */
function detectTrend(values: number[]): CorrelationResult["trend"] {
  if (values.length < 2) return "unknown";
  const first = values.slice(0, Math.ceil(values.length / 2));
  const last  = values.slice(Math.floor(values.length / 2));
  const avgFirst = first.reduce((s, v) => s + v, 0) / first.length;
  const avgLast  = last.reduce((s, v) => s + v, 0) / last.length;
  const pctChange = (avgLast - avgFirst) / (Math.abs(avgFirst) || 1);
  if (pctChange > 0.05)  return "rising";
  if (pctChange < -0.05) return "falling";
  return "flat";
}

// ── Insight generator ──────────────────────────────────────────────────────

export function generateInsightText(
  metricName: string,
  sourceName: string,
  pearson: number | null,
  trend: CorrelationResult["trend"],
): string {
  if (pearson === null) {
    return `Not enough overlapping data points between ${metricName} and your ShowsUp Score to calculate correlation yet.`;
  }

  const abs = Math.abs(pearson);
  const dir = pearson >= 0 ? "positive" : "negative";
  const strength = abs >= 0.7 ? "strong" : abs >= 0.4 ? "moderate" : "weak";
  const trendPhrase =
    trend === "rising"  ? "is trending up" :
    trend === "falling" ? "is trending down" :
    trend === "flat"    ? "has been flat" : "";

  if (abs >= 0.7 && pearson > 0) {
    return `Strong positive link (r=${pearson}): when your AI visibility rises, ${metricName} from ${sourceName} rises too${trendPhrase ? " — and it " + trendPhrase : ""}. AI recommendations appear to be driving real-world impact.`;
  }
  if (abs >= 0.7 && pearson < 0) {
    return `Strong inverse link (r=${pearson}): ${metricName} from ${sourceName} moves opposite to your AI visibility. This may indicate a lag effect or a segment that AI is capturing away from you.`;
  }
  if (abs >= 0.4) {
    return `Moderate ${dir} correlation (r=${pearson}) between ${metricName} and AI visibility. The signals are partially aligned — growing AI presence appears to ${pearson > 0 ? "support" : "trade off against"} ${metricName}.`;
  }
  return `Weak correlation (r=${pearson}) between ${metricName} from ${sourceName} and your ShowsUp Score. These two signals appear to be moving independently for now.`;
}

// ── Main entry point ───────────────────────────────────────────────────────

export function computeCorrelations(
  metrics: Array<{ name: string; source: string; series: TimePoint[] }>,
  scanSeries: ScanPoint[],
): CorrelationResult[] {
  const scoreSeries: TimePoint[] = scanSeries.map((s) => ({ date: s.date, value: s.score }));

  return metrics.map(({ name, source, series }) => {
    const { av, bv } = alignSeries(series, scoreSeries);
    const pearson = pearsonCorrelation(av, bv);
    const trend   = detectTrend(series.map((p) => p.value));
    return {
      metric_name:  name,
      source_name:  source,
      pearson,
      sample_size:  av.length,
      insight:      generateInsightText(name, source, pearson, trend),
      trend,
    };
  });
}
