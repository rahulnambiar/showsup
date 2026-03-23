/**
 * Detects brand info from a URL using Claude Haiku.
 * Used by CLI (standalone mode) and API routes.
 */

export interface BrandInfo {
  brand_name: string;
  category: string;
  niche: string;
  description: string;
  competitors: string[];
}

export async function detectBrand(url: string): Promise<BrandInfo> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Brand detection requires ANTHROPIC_API_KEY. Use --brand and --category flags to skip detection.");
  }

  let targetUrl = url.trim();
  if (!targetUrl.startsWith("http")) targetUrl = "https://" + targetUrl;

  let title = "", description = "", ogTitle = "", ogDescription = "";
  try {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 10000);
    const res        = await fetch(targetUrl, {
      signal:  controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ShowsUpBot/1.0)" },
    });
    clearTimeout(timeout);
    const html = await res.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) title = titleMatch[1].trim();

    const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    if (metaDesc) description = metaDesc[1].trim();

    const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
    if (ogTitleMatch) ogTitle = ogTitleMatch[1].trim();

    const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);
    if (ogDescMatch) ogDescription = ogDescMatch[1].trim();
  } catch {
    // Fetch failed — proceed with just the URL
  }

  const combinedTitle = ogTitle || title;
  const combinedDesc  = ogDescription || description;

  const prompt = `Based on this website:
URL: ${targetUrl}
Title: ${combinedTitle || "(not available)"}
Description: ${combinedDesc || "(not available)"}

Return JSON only (no markdown):
{
  "brand_name": "the company or product name",
  "category": "one of: Insurance, Travel, Finance, E-commerce, SaaS, Healthcare, Other",
  "niche": "specific type in 3-5 words, e.g. 'project management software'",
  "description": "one sentence describing what the brand does",
  "competitors": [{"name": "competitor1"}, {"name": "competitor2"}, {"name": "competitor3"}]
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:  "POST",
    headers: {
      "Content-Type":       "application/json",
      "x-api-key":          process.env.ANTHROPIC_API_KEY!,
      "anthropic-version":  "2023-06-01",
    },
    body: JSON.stringify({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages:   [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json() as { content?: Array<{ type: string; text?: string }> };
  const text    = data.content?.[0]?.type === "text" ? data.content[0].text ?? "" : "";
  const cleaned = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
  const parsed  = JSON.parse(cleaned) as {
    brand_name?: string;
    category?: string;
    niche?: string;
    description?: string;
    competitors?: Array<{ name?: string }>;
  };

  return {
    brand_name:  parsed.brand_name  ?? "",
    category:    parsed.category    ?? "Other",
    niche:       parsed.niche       ?? "",
    description: parsed.description ?? "",
    competitors: Array.isArray(parsed.competitors)
      ? parsed.competitors.map((c) => c.name ?? "").filter(Boolean)
      : [],
  };
}
