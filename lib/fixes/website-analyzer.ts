/**
 * Website analyzer for AEO improvement plan generation.
 * Fetches and analyzes key pages to assess AI-readiness.
 */

export interface PageAnalysis {
  url: string;
  title: string;
  metaDescription: string;
  h1: string;
  headings: string[];
  wordCount: number;
  hasSchemaFAQ: boolean;
  hasFAQContent: boolean;
  hasStatistics: boolean;
  hasQuotes: boolean;
  answerFirst: boolean;
  schemaTypes: string[];
  contentPreview: string; // first 800 chars of body text
  lastModified: string | null;
  fetchError?: string;
}

export interface WebsiteAnalysis {
  homepageUrl: string;
  pages: PageAnalysis[];
  llmsTxt: { exists: boolean; content: string; wordCount: number };
  robotsTxt: { exists: boolean; content: string; blockedCrawlers: string[] };
  sitemapXml: { exists: boolean; urlCount: number; hasLastmod: boolean };
  hasOrganizationSchema: boolean;
  isSSR: boolean; // false if content requires JS to render
  analyzedAt: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, ms = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "ShowsUp-Analyzer/1.0 (AEO analysis bot)" },
    });
  } finally {
    clearTimeout(timer);
  }
}

function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMeta(html: string, name: string): string {
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, "i"),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return "";
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1]?.trim() ?? "";
}

function extractH1(html: string): string {
  const m = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  return m?.[1]?.trim() ?? "";
}

function extractHeadings(html: string): string[] {
  const headings: string[] = [];
  const re = /<h[2-3][^>]*>([^<]+)<\/h[2-3]>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null && headings.length < 20) {
    const text = m[1]?.trim();
    if (text) headings.push(text);
  }
  return headings;
}

function extractSchemaTypes(html: string): string[] {
  const types: string[] = [];
  const re = /"@type"\s*:\s*"([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (m[1] && !types.includes(m[1])) types.push(m[1]);
  }
  return types;
}

function estimateWordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function hasAnswerFirst(text: string): boolean {
  // Check if first sentence (within first 200 chars) contains a direct claim/answer
  const first200 = text.slice(0, 200).toLowerCase();
  const hasKeyword = /\b(is|are|was|were|provides?|offers?|helps?|enables?|allows?|starts? at|\$|free|#1|best|leading|trusted)\b/.test(first200);
  return hasKeyword;
}

function extractNavLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const base = new URL(baseUrl);

  // Extract links from nav elements
  const navRe = /<nav[\s\S]*?<\/nav>/gi;
  let navMatch: RegExpExecArray | null;
  const navHtml = (navMatch = navRe.exec(html)) ? navMatch[0] : html.slice(0, 5000);

  const linkRe = /href=["']([^"'#?]+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(navHtml)) !== null && links.length < 15) {
    try {
      const href = m[1]!;
      if (href.startsWith("mailto:") || href.startsWith("tel:") || href.endsWith(".pdf")) continue;

      let url: string;
      if (href.startsWith("http")) {
        const u = new URL(href);
        if (u.hostname !== base.hostname) continue;
        url = href.split("?")[0]!.split("#")[0]!;
      } else if (href.startsWith("/")) {
        url = `${base.protocol}//${base.hostname}${href.split("?")[0]!.split("#")[0]!}`;
      } else {
        continue;
      }

      if (url !== baseUrl && url !== `${base.protocol}//${base.hostname}/` && !links.includes(url)) {
        links.push(url);
      }
    } catch {
      // skip
    }
  }
  return links.slice(0, 8);
}

// ── Page analyzer ─────────────────────────────────────────────────────────────

async function analyzePage(url: string): Promise<PageAnalysis> {
  try {
    const res = await fetchWithTimeout(url, 7000);
    if (!res.ok) {
      return { url, title: "", metaDescription: "", h1: "", headings: [], wordCount: 0, hasSchemaFAQ: false, hasFAQContent: false, hasStatistics: false, hasQuotes: false, answerFirst: false, schemaTypes: [], contentPreview: "", lastModified: null, fetchError: `HTTP ${res.status}` };
    }

    const html = await res.text();
    const text = extractText(html);
    const schemaTypes = extractSchemaTypes(html);
    const lastMod = res.headers.get("last-modified") ?? null;

    return {
      url,
      title: extractTitle(html),
      metaDescription: extractMeta(html, "description"),
      h1: extractH1(html),
      headings: extractHeadings(html),
      wordCount: estimateWordCount(text),
      hasSchemaFAQ: schemaTypes.includes("FAQPage") || schemaTypes.includes("Question"),
      hasFAQContent: /\b(faq|frequently asked|common questions?|q&a)\b/i.test(html),
      hasStatistics: /\b\d+[%x]\b|\b\d+\s*(times?|million|billion|thousand|hundred)\b/i.test(text),
      hasQuotes: /"[^"]{20,}"/.test(html) || /blockquote/i.test(html),
      answerFirst: hasAnswerFirst(text),
      schemaTypes,
      contentPreview: text.slice(0, 800),
      lastModified: lastMod,
      fetchError: undefined,
    };
  } catch (err) {
    return {
      url, title: "", metaDescription: "", h1: "", headings: [], wordCount: 0,
      hasSchemaFAQ: false, hasFAQContent: false, hasStatistics: false, hasQuotes: false,
      answerFirst: false, schemaTypes: [], contentPreview: "", lastModified: null,
      fetchError: err instanceof Error ? err.message : "Fetch failed",
    };
  }
}

// ── Main export ──────────────────────────────────────────────────────────────

export async function analyzeWebsite(rawUrl: string): Promise<WebsiteAnalysis> {
  // Normalize URL
  let baseUrl = rawUrl.trim();
  if (!baseUrl.startsWith("http")) baseUrl = `https://${baseUrl}`;
  const base = new URL(baseUrl);
  const origin = `${base.protocol}//${base.hostname}`;

  // Fetch homepage
  const homepage = await analyzePage(baseUrl);

  // Get nav links from homepage HTML for additional pages
  let navLinks: string[] = [];
  try {
    const res = await fetchWithTimeout(baseUrl, 7000);
    if (res.ok) {
      const html = await res.text();
      navLinks = extractNavLinks(html, baseUrl);

      // Check SSR: does the raw HTML contain meaningful text content?
      const textLen = extractText(html).length;
      homepage.fetchError; // already analyzed above

      // Check org schema on homepage
      const schemaTypes = extractSchemaTypes(html);
      const hasOrgSchema = schemaTypes.includes("Organization") || schemaTypes.includes("LocalBusiness") || schemaTypes.includes("Corporation");

      // Parallel fetch: sub-pages + /llms.txt + /robots.txt + /sitemap.xml
      const [subPageResults, llmsRes, robotsRes, sitemapRes] = await Promise.allSettled([
        Promise.all(navLinks.slice(0, 6).map(analyzePage)),
        fetchWithTimeout(`${origin}/llms.txt`, 5000).catch(() => null),
        fetchWithTimeout(`${origin}/robots.txt`, 5000).catch(() => null),
        fetchWithTimeout(`${origin}/sitemap.xml`, 5000).catch(() => null),
      ]);

      // llms.txt
      let llmsTxt = { exists: false, content: "", wordCount: 0 };
      if (llmsRes.status === "fulfilled" && llmsRes.value && llmsRes.value.ok) {
        const content = await llmsRes.value.text().catch(() => "");
        llmsTxt = { exists: content.length > 20, content: content.slice(0, 2000), wordCount: estimateWordCount(content) };
      }

      // robots.txt
      let robotsTxt = { exists: false, content: "", blockedCrawlers: [] as string[] };
      if (robotsRes.status === "fulfilled" && robotsRes.value && robotsRes.value.ok) {
        const content = await robotsRes.value.text().catch(() => "");
        const blocked: string[] = [];
        const crawlers = ["GPTBot", "ClaudeBot", "PerplexityBot", "GoogleOther", "ChatGPT-User", "Anthropic-ai", "cohere-ai"];
        for (const crawler of crawlers) {
          if (new RegExp(`User-agent:\\s*${crawler}[\\s\\S]*?Disallow:\\s*/`, "i").test(content)) {
            blocked.push(crawler);
          }
        }
        robotsTxt = { exists: true, content: content.slice(0, 1000), blockedCrawlers: blocked };
      }

      // sitemap.xml
      let sitemapXml = { exists: false, urlCount: 0, hasLastmod: false };
      if (sitemapRes.status === "fulfilled" && sitemapRes.value && sitemapRes.value.ok) {
        const content = await sitemapRes.value.text().catch(() => "");
        const urlMatches = content.match(/<url>/g) ?? [];
        sitemapXml = {
          exists: content.includes("<urlset") || content.includes("<sitemapindex"),
          urlCount: urlMatches.length,
          hasLastmod: content.includes("<lastmod>"),
        };
      }

      const subPages: PageAnalysis[] = subPageResults.status === "fulfilled" ? subPageResults.value : [];

      return {
        homepageUrl: baseUrl,
        pages: [homepage, ...subPages],
        llmsTxt,
        robotsTxt,
        sitemapXml,
        hasOrganizationSchema: hasOrgSchema,
        isSSR: textLen > 500,
        analyzedAt: new Date().toISOString(),
      };
    }
  } catch {
    // fall through to minimal return
  }

  return {
    homepageUrl: baseUrl,
    pages: [homepage],
    llmsTxt: { exists: false, content: "", wordCount: 0 },
    robotsTxt: { exists: false, content: "", blockedCrawlers: [] },
    sitemapXml: { exists: false, urlCount: 0, hasLastmod: false },
    hasOrganizationSchema: false,
    isSSR: false,
    analyzedAt: new Date().toISOString(),
  };
}
