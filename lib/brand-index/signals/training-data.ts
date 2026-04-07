/**
 * Signal 3: Training Data Footprint (15% weight)
 * Uses free APIs (Wikipedia, Reddit) + HTML parsing.
 */

export interface WikipediaResult {
  exists: boolean;
  extract_length: number;
  depth: "extensive" | "moderate" | "brief" | "none";
  title: string | null;
  url: string | null;
}

export interface RedditResult {
  post_count: number;
  total_upvotes: number;
  unique_subreddits: number;
  high_quality_post_count: number; // 3+ upvotes
  presence: "strong" | "moderate" | "weak" | "absent";
}

export interface DomainAgeResult {
  estimated_year: number | null;
  age_years: number | null;
  maturity: "established" | "growing" | "young" | "unknown";
}

export interface TrainingDataResult {
  wikipedia: WikipediaResult;
  reddit: RedditResult;
  domain_age: DomainAgeResult;
  score: number;
}

const CURRENT_YEAR = new Date().getFullYear();
const FETCH_TIMEOUT_MS = 8_000;

async function fetchJson<T>(url: string, headers?: Record<string, string>): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "ShowsUp-Scanner/1.0 (AEO Brand Index; contact@showsup.co)",
        ...headers,
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchText(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "ShowsUp-Scanner/1.0 (AEO Brand Index)" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

interface WikiSummary {
  type?: string;
  extract?: string;
  extract_html?: string;
  content_urls?: { desktop?: { page?: string } };
  title?: string;
}

async function fetchWikipedia(brandName: string): Promise<WikipediaResult> {
  const slugs = [
    brandName.replace(/ /g, "_"),
    `${brandName.replace(/ /g, "_")}_(company)`,
    `${brandName.replace(/ /g, "_")}_(brand)`,
    `${brandName.replace(/ /g, "_")}_(website)`,
  ];

  for (const slug of slugs) {
    const data = await fetchJson<WikiSummary>(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`
    );
    if (data && data.type !== "https://mediawiki.org/wiki/HyperSwitch/errors/not_found") {
      const length = data.extract?.length ?? 0;
      let depth: WikipediaResult["depth"] = "brief";
      if (length > 2000) depth = "extensive";
      else if (length > 500) depth = "moderate";
      return {
        exists: true,
        extract_length: length,
        depth,
        title: data.title ?? null,
        url: data.content_urls?.desktop?.page ?? null,
      };
    }
  }

  return { exists: false, extract_length: 0, depth: "none", title: null, url: null };
}

interface RedditPost {
  data: {
    score: number;
    subreddit: string;
  };
}

interface RedditSearchResponse {
  data?: {
    children?: Array<{ data: RedditPost["data"] }>;
  };
}

async function fetchReddit(brandName: string): Promise<RedditResult> {
  const query = encodeURIComponent(`"${brandName}"`);
  const data = await fetchJson<RedditSearchResponse>(
    `https://www.reddit.com/search.json?q=${query}&sort=relevance&limit=25&t=year`,
    { Accept: "application/json" }
  );

  if (!data?.data?.children) {
    return { post_count: 0, total_upvotes: 0, unique_subreddits: 0, high_quality_post_count: 0, presence: "absent" };
  }

  const posts = data.data.children;
  const post_count = posts.length;
  const total_upvotes = posts.reduce((sum, p) => sum + (p.data.score ?? 0), 0);
  const unique_subreddits = new Set(posts.map((p) => p.data.subreddit)).size;
  const high_quality_post_count = posts.filter((p) => (p.data.score ?? 0) >= 3).length;

  let presence: RedditResult["presence"] = "absent";
  if (post_count >= 20) presence = "strong";
  else if (post_count >= 10) presence = "moderate";
  else if (post_count >= 3) presence = "weak";

  return { post_count, total_upvotes, unique_subreddits, high_quality_post_count, presence };
}

async function estimateDomainAge(url: string): Promise<DomainAgeResult> {
  const html = await fetchText(url);
  if (!html) return { estimated_year: null, age_years: null, maturity: "unknown" };

  // Look for copyright year patterns
  const patterns = [
    /©\s*(\d{4})/,
    /copyright\s+(\d{4})/i,
    /since\s+(\d{4})/i,
    /founded\s+in\s+(\d{4})/i,
    /established\s+(\d{4})/i,
  ];

  let earliest: number | null = null;
  for (const pattern of patterns) {
    const matches = Array.from(html.matchAll(new RegExp(pattern.source, pattern.flags + "g")));
    for (const match of matches) {
      const year = parseInt(match[1], 10);
      if (year >= 1990 && year <= CURRENT_YEAR) {
        if (earliest === null || year < earliest) earliest = year;
      }
    }
  }

  if (!earliest) return { estimated_year: null, age_years: null, maturity: "unknown" };

  const age_years = CURRENT_YEAR - earliest;
  let maturity: DomainAgeResult["maturity"] = "young";
  if (age_years >= 15) maturity = "established";
  else if (age_years >= 5) maturity = "growing";

  return { estimated_year: earliest, age_years, maturity };
}

function computeScore(r: Omit<TrainingDataResult, "score">): number {
  let score = 0;

  // Wikipedia
  if (r.wikipedia.depth === "extensive") score += 30;
  else if (r.wikipedia.depth === "moderate") score += 20;
  else if (r.wikipedia.depth === "brief") score += 10;

  // Reddit presence
  if (r.reddit.presence === "strong") score += 25;
  else if (r.reddit.presence === "moderate") score += 15;
  else if (r.reddit.presence === "weak") score += 5;

  // Domain age
  if (r.domain_age.maturity === "established") score += 20;
  else if (r.domain_age.maturity === "growing") score += 10;

  // High-quality Reddit posts
  if (r.reddit.high_quality_post_count >= 10) score += 15;
  else if (r.reddit.high_quality_post_count >= 5) score += 8;

  return Math.min(score, 100);
}

export async function analyzeTrainingData(brandName: string, url: string): Promise<TrainingDataResult> {
  const [wikipedia, reddit, domain_age] = await Promise.all([
    fetchWikipedia(brandName),
    fetchReddit(brandName),
    estimateDomainAge(url),
  ]);

  const partial = { wikipedia, reddit, domain_age };
  return { ...partial, score: computeScore(partial) };
}
