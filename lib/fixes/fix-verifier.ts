/**
 * Automated verification checks for AEO improvement plan items.
 * Each check re-fetches the live site and confirms whether a fix is in place.
 */

import type { WebsiteAnalysis } from "./website-analyzer";

export type VerificationResult = {
  passed: boolean;
  message: string;
  checkedAt: string;
};

type CheckFn = (
  url: string,
  analysis?: WebsiteAnalysis
) => Promise<VerificationResult>;

// ── Helpers ──────────────────────────────────────────────────────────────────

async function fetchText(url: string, ms = 8000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "ShowsUp-Verifier/1.0 (AEO verification bot)" },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function origin(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}`;
  } catch {
    return url;
  }
}

function ok(message: string): VerificationResult {
  return { passed: true, message, checkedAt: new Date().toISOString() };
}

function fail(message: string): VerificationResult {
  return { passed: false, message, checkedAt: new Date().toISOString() };
}

// ── Individual checks ─────────────────────────────────────────────────────────

const CHECKS: Record<string, CheckFn> = {
  // robots.txt is blocking AI crawlers
  robots_txt_block: async (url) => {
    const content = await fetchText(`${origin(url)}/robots.txt`);
    if (!content) return fail("Could not fetch /robots.txt");

    const aiCrawlers = ["GPTBot", "ClaudeBot", "PerplexityBot", "ChatGPT-User", "Anthropic-ai"];
    const blocked = aiCrawlers.filter((crawler) =>
      new RegExp(`User-agent:\\s*${crawler}[\\s\\S]*?Disallow:\\s*/`, "i").test(content)
    );

    if (blocked.length === 0) return ok("No AI crawlers are blocked in robots.txt");
    return fail(`Still blocking: ${blocked.join(", ")}`);
  },

  // Missing llms.txt
  missing_llms_txt: async (url) => {
    const content = await fetchText(`${origin(url)}/llms.txt`);
    if (!content || content.length < 50)
      return fail("llms.txt not found or too short (needs >50 chars of real content)");
    return ok(`llms.txt exists with ${content.length} characters`);
  },

  // Missing FAQ schema
  missing_schema_faq: async (url) => {
    const html = await fetchText(url);
    if (!html) return fail("Could not fetch page");
    const hasFaqSchema =
      /"@type"\s*:\s*"FAQPage"/i.test(html) ||
      /"@type"\s*:\s*"Question"/i.test(html);
    if (hasFaqSchema) return ok("FAQPage JSON-LD schema found");
    return fail("FAQPage schema not found in page source");
  },

  // Missing Organization schema
  missing_organization_schema: async (url) => {
    const html = await fetchText(url);
    if (!html) return fail("Could not fetch page");
    const hasOrgSchema =
      /"@type"\s*:\s*"Organization"/i.test(html) ||
      /"@type"\s*:\s*"LocalBusiness"/i.test(html) ||
      /"@type"\s*:\s*"Corporation"/i.test(html);
    if (hasOrgSchema) return ok("Organization schema found on homepage");
    return fail("Organization schema not found on homepage");
  },

  // No sitemap
  missing_sitemap: async (url) => {
    const content = await fetchText(`${origin(url)}/sitemap.xml`);
    if (!content) return fail("sitemap.xml not found");
    const hasSitemap =
      content.includes("<urlset") || content.includes("<sitemapindex");
    if (!hasSitemap) return fail("sitemap.xml exists but is malformed");
    const urlCount = (content.match(/<url>/g) ?? []).length;
    const hasLastmod = content.includes("<lastmod>");
    if (!hasLastmod)
      return fail(`Sitemap found (${urlCount} URLs) but missing <lastmod> dates`);
    return ok(`Sitemap found with ${urlCount} URLs and lastmod dates`);
  },

  // Thin content (word count)
  thin_content: async (url) => {
    const html = await fetchText(url);
    if (!html) return fail("Could not fetch page");
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const words = text.split(/\s+/).filter(Boolean).length;
    if (words >= 300) return ok(`Page has ${words} words (≥300 threshold met)`);
    return fail(`Page only has ${words} words (need ≥300 for AI readability)`);
  },

  // No FAQ content
  no_faq_content: async (url) => {
    const html = await fetchText(url);
    if (!html) return fail("Could not fetch page");
    const hasFaq = /\b(faq|frequently asked|common questions?|q&a)\b/i.test(html);
    if (hasFaq) return ok("FAQ content detected on page");
    return fail("No FAQ section detected on page");
  },

  // No statistics / data
  no_statistics: async (url) => {
    const html = await fetchText(url);
    if (!html) return fail("Could not fetch page");
    const text = html.replace(/<[^>]+>/g, " ");
    const hasStats =
      /\b\d+[%x]\b|\b\d+\s*(times?|million|billion|thousand|hundred)\b/i.test(text);
    if (hasStats) return ok("Statistics or quantitative data found on page");
    return fail("No statistics found — add data points to support AI citations");
  },

  // No quotes / citations
  no_quotes: async (url) => {
    const html = await fetchText(url);
    if (!html) return fail("Could not fetch page");
    const hasQuotes =
      /"[^"]{20,}"/.test(html) || /blockquote/i.test(html);
    if (hasQuotes) return ok("Quotes or blockquotes found on page");
    return fail("No expert quotes or blockquotes found");
  },

  // Answer-first writing not detected
  no_answer_first: async (url) => {
    const html = await fetchText(url);
    if (!html) return fail("Could not fetch page");
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const first200 = text.slice(0, 200).toLowerCase();
    const hasKeyword =
      /\b(is|are|was|were|provides?|offers?|helps?|enables?|allows?|starts? at|\$|free|#1|best|leading|trusted)\b/.test(
        first200
      );
    if (hasKeyword) return ok("Answer-first writing pattern detected in opening");
    return fail("Opening text does not lead with a direct answer or claim");
  },

  // Page not indexed by SSR
  not_ssr: async (url) => {
    const html = await fetchText(url);
    if (!html) return fail("Could not fetch page");
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (text.length > 500)
      return ok("Page renders meaningful content server-side (SSR confirmed)");
    return fail("Page appears to require JavaScript — AI crawlers may see empty content");
  },

  // No H1
  missing_h1: async (url) => {
    const html = await fetchText(url);
    if (!html) return fail("Could not fetch page");
    const m = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (m?.[1]?.trim()) return ok(`H1 found: "${m[1].trim().slice(0, 60)}"`);
    return fail("No H1 tag found on page");
  },

  // Missing meta description
  missing_meta_description: async (url) => {
    const html = await fetchText(url);
    if (!html) return fail("Could not fetch page");
    const patterns = [
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
    ];
    for (const p of patterns) {
      const m = html.match(p);
      if (m?.[1]?.trim())
        return ok(`Meta description found: "${m[1].trim().slice(0, 80)}"`);
    }
    return fail("Meta description is missing");
  },

  // Generic manual verification fallback
  manual: async () => {
    return fail("This fix requires manual verification — mark as complete when done");
  },
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Run the automated check for a given verification type against a live URL.
 * Falls back to a manual reminder if no automated check exists.
 */
export async function verifyFix(
  verificationType: string,
  siteUrl: string,
  pageUrl?: string,
  analysis?: WebsiteAnalysis
): Promise<VerificationResult> {
  const checkUrl = pageUrl ?? siteUrl;
  const check = CHECKS[verificationType] ?? CHECKS.manual!;
  return check(checkUrl, analysis);
}

/**
 * Run all checks for a website and return a summary.
 * Useful for bulk re-verification after changes.
 */
export async function verifyAll(
  siteUrl: string,
  verificationTypes: string[]
): Promise<Record<string, VerificationResult>> {
  const results = await Promise.allSettled(
    verificationTypes.map(async (type) => ({
      type,
      result: await verifyFix(type, siteUrl),
    }))
  );

  const out: Record<string, VerificationResult> = {};
  for (const r of results) {
    if (r.status === "fulfilled") {
      out[r.value.type] = r.value.result;
    }
  }
  return out;
}
