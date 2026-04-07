/**
 * Signal 2: Structured Data Readiness (20% weight)
 * Pure HTTP fetches + HTML parsing. Zero LLM cost.
 */

export interface AIBotStatus {
  allowed: boolean | null; // null = no explicit rule
}

export interface StructuredDataResult {
  // llms.txt
  llms_txt_exists: boolean;
  llms_txt_length: number;
  llms_txt_quality: "good" | "basic" | "minimal" | "none";

  // robots.txt AI crawlers
  ai_crawlers: Record<string, AIBotStatus>;
  allowed_crawler_count: number;

  // Schema markup
  schema_types: string[];
  has_org_schema: boolean;
  has_faq_schema: boolean;
  has_product_schema: boolean;

  // Content structure
  meta_description: string | null;
  meta_description_length: number;
  h1_text: string | null;
  h2_count: number;
  word_count: number;

  // Sitemap
  sitemap_exists: boolean;
  sitemap_url_count: number | null;
  sitemap_latest_lastmod: string | null;

  // Performance
  page_load_ms: number;

  // Computed
  score: number;
}

const AI_BOTS = [
  "GPTBot",
  "ClaudeBot",
  "PerplexityBot",
  "GoogleOther",
  "Google-Extended",
  "OAI-SearchBot",
];

const FETCH_TIMEOUT_MS = 10_000;

async function fetchWithTimeout(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "ShowsUp-Scanner/1.0 (AEO Brand Index)" },
      redirect: "follow",
    });
    return res;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchText(url: string): Promise<{ text: string | null; durationMs: number }> {
  const start = Date.now();
  const res = await fetchWithTimeout(url);
  const durationMs = Date.now() - start;
  if (!res || !res.ok) return { text: null, durationMs };
  const text = await res.text().catch(() => null);
  return { text, durationMs };
}

function parseLlmsTxt(text: string | null): Pick<StructuredDataResult, "llms_txt_exists" | "llms_txt_length" | "llms_txt_quality"> {
  if (!text) return { llms_txt_exists: false, llms_txt_length: 0, llms_txt_quality: "none" };
  const length = text.trim().length;
  let quality: StructuredDataResult["llms_txt_quality"] = "minimal";
  if (length > 200) quality = "good";
  else if (length > 50) quality = "basic";
  return { llms_txt_exists: true, llms_txt_length: length, llms_txt_quality: quality };
}

function parseRobotsTxt(text: string | null): Pick<StructuredDataResult, "ai_crawlers" | "allowed_crawler_count"> {
  const result: Record<string, AIBotStatus> = {};
  for (const bot of AI_BOTS) result[bot] = { allowed: null };

  if (!text) return { ai_crawlers: result, allowed_crawler_count: 0 };

  // Track disallow/allow rules per user-agent block
  const lines = text.split("\n").map((l) => l.trim());
  let currentAgents: string[] = [];

  for (const line of lines) {
    if (line.startsWith("#") || line === "") {
      currentAgents = [];
      continue;
    }
    if (line.toLowerCase().startsWith("user-agent:")) {
      const agent = line.slice("user-agent:".length).trim();
      currentAgents = [agent];
    } else if (line.toLowerCase().startsWith("disallow:")) {
      const path = line.slice("disallow:".length).trim();
      for (const agent of currentAgents) {
        const match = AI_BOTS.find((b) => b.toLowerCase() === agent.toLowerCase() || agent === "*");
        if (match && path === "/") {
          result[match] = { allowed: false };
        }
      }
    } else if (line.toLowerCase().startsWith("allow:")) {
      for (const agent of currentAgents) {
        const match = AI_BOTS.find((b) => b.toLowerCase() === agent.toLowerCase());
        if (match) result[match] = { allowed: true };
      }
    }
  }

  // Bots with no explicit rule default to allowed
  for (const bot of AI_BOTS) {
    if (result[bot].allowed === null) result[bot] = { allowed: true };
  }

  const allowed_crawler_count = Object.values(result).filter((s) => s.allowed).length;
  return { ai_crawlers: result, allowed_crawler_count };
}

function extractJsonLd(html: string): string[] {
  const types: string[] = [];
  const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const json = JSON.parse(match[1]);
      const graphs = Array.isArray(json) ? json : json["@graph"] ? json["@graph"] : [json];
      for (const node of graphs) {
        const t = node["@type"];
        if (typeof t === "string") types.push(t);
        else if (Array.isArray(t)) types.push(...t);
      }
    } catch {
      // ignore malformed JSON-LD
    }
  }
  return Array.from(new Set(types));
}

function parseHomepageHtml(html: string): Pick<StructuredDataResult, "meta_description" | "meta_description_length" | "h1_text" | "h2_count" | "word_count" | "schema_types" | "has_org_schema" | "has_faq_schema" | "has_product_schema"> {
  // Meta description
  const metaMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*?)["']/i)
    ?? html.match(/<meta[^>]+content=["']([^"']*?)["'][^>]+name=["']description["']/i);
  const meta_description = metaMatch ? metaMatch[1].trim() : null;

  // H1
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1_text = h1Match ? h1Match[1].replace(/<[^>]+>/g, "").trim() : null;

  // H2 count
  const h2_count = (html.match(/<h2[/\s>]/gi) ?? []).length;

  // Word count from body
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyText = bodyMatch
    ? bodyMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    : html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const word_count = bodyText.split(" ").filter((w) => w.length > 0).length;

  // Schema
  const schema_types = extractJsonLd(html);
  const has_org_schema = schema_types.some((t) => t === "Organization" || t === "Corporation");
  const has_faq_schema = schema_types.some((t) => t === "FAQPage");
  const has_product_schema = schema_types.some((t) => t === "Product");

  return {
    meta_description,
    meta_description_length: meta_description?.length ?? 0,
    h1_text,
    h2_count,
    word_count,
    schema_types,
    has_org_schema,
    has_faq_schema,
    has_product_schema,
  };
}

function parseSitemap(text: string | null): Pick<StructuredDataResult, "sitemap_exists" | "sitemap_url_count" | "sitemap_latest_lastmod"> {
  if (!text) return { sitemap_exists: false, sitemap_url_count: null, sitemap_latest_lastmod: null };

  const urlMatches = text.match(/<loc>/gi);
  const sitemap_url_count = urlMatches ? urlMatches.length : 0;

  const lastmods = Array.from(text.matchAll(/<lastmod>([^<]+)<\/lastmod>/gi)).map((m) => m[1].trim());
  const sitemap_latest_lastmod = lastmods.length > 0 ? lastmods.sort().reverse()[0] : null;

  return { sitemap_exists: true, sitemap_url_count, sitemap_latest_lastmod };
}

function computeScore(r: Omit<StructuredDataResult, "score">): number {
  let score = 0;

  if (r.llms_txt_exists) score += 20;
  if (r.allowed_crawler_count >= 4) score += 15;
  else if (r.allowed_crawler_count >= 2) score += 8;
  if (r.has_org_schema) score += 10;
  if (r.has_faq_schema) score += 15;
  if (r.has_product_schema) score += 5;
  if (r.schema_types.length >= 3) score += 5;
  if (r.meta_description_length > 50) score += 10;
  if (r.word_count >= 500) score += 10;
  if (r.sitemap_exists) score += 5;
  if (r.page_load_ms > 0 && r.page_load_ms < 3000) score += 5;

  return Math.min(score, 100);
}

export async function analyzeStructuredData(url: string): Promise<StructuredDataResult> {
  const baseUrl = url.replace(/\/$/, "");

  const [llmsRes, robotsRes, homepageRes, sitemapRes] = await Promise.all([
    fetchText(`${baseUrl}/llms.txt`),
    fetchText(`${baseUrl}/robots.txt`),
    fetchText(baseUrl),
    fetchText(`${baseUrl}/sitemap.xml`),
  ]);

  const llmsParsed = parseLlmsTxt(llmsRes.text);
  const robotsParsed = parseRobotsTxt(robotsRes.text);
  const homepageParsed = homepageRes.text ? parseHomepageHtml(homepageRes.text) : {
    meta_description: null, meta_description_length: 0, h1_text: null,
    h2_count: 0, word_count: 0, schema_types: [], has_org_schema: false,
    has_faq_schema: false, has_product_schema: false,
  };
  const sitemapParsed = parseSitemap(sitemapRes.text);

  const partial: Omit<StructuredDataResult, "score"> = {
    ...llmsParsed,
    ...robotsParsed,
    ...homepageParsed,
    ...sitemapParsed,
    page_load_ms: homepageRes.durationMs,
  };

  return { ...partial, score: computeScore(partial) };
}
