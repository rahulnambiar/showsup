import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("ShowsUp: No ANTHROPIC_API_KEY — brand detection unavailable");
    return NextResponse.json(
      { error: "Brand detection requires ANTHROPIC_API_KEY. Add it to your .env.local." },
      { status: 503 }
    );
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

    // Normalize URL
    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http")) targetUrl = "https://" + targetUrl;

    // Fetch website HTML with 10s timeout
    let title = "";
    let description = "";
    let ogTitle = "";
    let ogDescription = "";

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(targetUrl, {
        signal: controller.signal,
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
      // Fetch failed — we'll still call Claude with just the URL
    }

    const combinedTitle = ogTitle || title;
    const combinedDesc = ogDescription || description;

    const prompt = `Based on this website info:
URL: ${targetUrl}
Title: ${combinedTitle || "(not available)"}
Description: ${combinedDesc || "(not available)"}

Return JSON only (no markdown, no explanation):
{
  "brand_name": "the company or product name",
  "category": "one of: Insurance, Travel, Finance, E-commerce, SaaS, Healthcare, Other",
  "niche": "specific product/service type in 3-5 words, e.g. 'project management software', 'online car insurance', 'email marketing platform', 'HR payroll software'",
  "description": "one sentence describing what the brand does",
  "competitors": [{"name": "competitor1"}, {"name": "competitor2"}, {"name": "competitor3"}]
}`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    // Strip markdown code fences if present
    const cleaned = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({
      brand_name: parsed.brand_name ?? "",
      category: parsed.category ?? "Other",
      niche: parsed.niche ?? "",
      description: parsed.description ?? "",
      competitors: Array.isArray(parsed.competitors) ? parsed.competitors : [],
    });
  } catch (err) {
    console.error("detect-brand error:", err);
    return NextResponse.json({ error: "Detection failed" }, { status: 500 });
  }
}
