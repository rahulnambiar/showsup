/**
 * Signal 5: Search Correlation (10% weight)
 * Uses Bing Search API (free tier: 1,000 calls/month) if BING_API_KEY is set.
 * Falls back to neutral score (50) when key is absent.
 */

export interface SearchQueryResult {
  query: string;
  brand_found: boolean;
  brand_position: number | null; // 1-10, null if not found
}

export interface SearchCorrelationResult {
  queries: SearchQueryResult[];
  queries_in_top_10: number;
  avg_position: number | null;
  bing_available: boolean;
  score: number;
}

const BING_SEARCH_ENDPOINT = "https://api.bing.microsoft.com/v7.0/search";
const FETCH_TIMEOUT_MS = 8_000;

interface BingSearchResult {
  webPages?: {
    value?: Array<{ url: string; name: string }>;
  };
}

async function bingSearch(query: string, apiKey: string): Promise<BingSearchResult | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const url = `${BING_SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}&count=10`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "Ocp-Apim-Subscription-Key": apiKey },
    });
    if (!res.ok) return null;
    return await res.json() as BingSearchResult;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function findBrandInResults(
  results: BingSearchResult | null,
  brandName: string,
  brandUrl: string
): { found: boolean; position: number | null } {
  const pages = results?.webPages?.value ?? [];
  const brandDomain = (() => {
    try { return new URL(brandUrl).hostname.replace(/^www\./, ""); } catch { return ""; }
  })();
  const nameLower = brandName.toLowerCase();

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const urlLower = page.url.toLowerCase();
    const titleLower = page.name.toLowerCase();
    if (
      (brandDomain && urlLower.includes(brandDomain)) ||
      titleLower.includes(nameLower)
    ) {
      return { found: true, position: i + 1 };
    }
  }
  return { found: false, position: null };
}

function computeScore(r: Omit<SearchCorrelationResult, "score">): number {
  if (!r.bing_available) return 50; // neutral fallback

  let score = 0;
  score += r.queries_in_top_10 * 25;

  if (r.avg_position !== null && r.avg_position <= 3) score += 25;

  return Math.min(score, 100);
}

export async function analyzeSearchCorrelation(
  brandName: string,
  brandUrl: string,
  category: string
): Promise<SearchCorrelationResult> {
  const apiKey = process.env.BING_API_KEY;

  if (!apiKey) {
    return {
      queries: [],
      queries_in_top_10: 0,
      avg_position: null,
      bing_available: false,
      score: 50,
    };
  }

  const searchQueries = [
    `best ${category.toLowerCase()} brands`,
    `${brandName} review`,
    `${brandName} vs competitors`,
  ];

  const results = await Promise.all(
    searchQueries.map((q) => bingSearch(q, apiKey))
  );

  const queries: SearchQueryResult[] = searchQueries.map((query, i) => {
    const { found, position } = findBrandInResults(results[i], brandName, brandUrl);
    return { query, brand_found: found, brand_position: position };
  });

  const queries_in_top_10 = queries.filter((q) => q.brand_found).length;

  const positions = queries.map((q) => q.brand_position).filter((p): p is number => p !== null);
  const avg_position = positions.length > 0
    ? positions.reduce((a, b) => a + b, 0) / positions.length
    : null;

  const partial = { queries, queries_in_top_10, avg_position, bing_available: true };
  return { ...partial, score: computeScore(partial) };
}
