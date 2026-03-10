import { NextResponse } from "next/server";

function extractMeta(html: string, property: string): string {
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  const match = html.match(regex);
  if (match) return match[1];
  // Try reversed attribute order
  const regex2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
    "i"
  );
  const match2 = html.match(regex2);
  return match2 ? match2[1] : "";
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : "";
}

function domainToBrand(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    const parts = hostname.split(".");
    const name = parts[0] ?? hostname;
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return url;
  }
}

function detectCategory(text: string): string {
  const lower = text.toLowerCase();
  if (/insurance|coverage|policy|premium|claim/.test(lower)) return "Insurance";
  if (/travel|hotel|flight|booking|trip|vacation/.test(lower)) return "Travel";
  if (/finance|banking|invest|fintech|payment|crypto/.test(lower)) return "Finance";
  if (/shop|store|ecommerce|marketplace|checkout/.test(lower)) return "E-commerce";
  if (/software|platform|saas|dashboard|api|automation/.test(lower)) return "SaaS";
  if (/health|medical|clinic|doctor|patient|therapy/.test(lower)) return "Healthcare";
  return "Other";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const url: string = (body.url ?? "").trim();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let normalizedUrl = url;
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    let html = "";
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(normalizedUrl, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 ShowsUpBot/1.0" },
      });
      clearTimeout(timeout);
      html = await res.text();
    } catch {
      // Fetch failed — derive brand from domain
      const brand = domainToBrand(normalizedUrl);
      return NextResponse.json({ brand, category: "Other", description: "", title: "" });
    }

    const title = extractTitle(html);
    const ogTitle = extractMeta(html, "og:title");
    const ogSiteName = extractMeta(html, "og:site_name");
    const ogDescription = extractMeta(html, "og:description");
    const metaDescription = extractMeta(html, "description");

    const description = ogDescription || metaDescription || "";
    const combinedText = [title, ogTitle, ogSiteName, description].join(" ");

    // Extract brand
    let brand = ogSiteName || domainToBrand(normalizedUrl);
    if (!brand && ogTitle) {
      // e.g. "Acme Corp - Home" → "Acme Corp"
      brand = ogTitle.split(/[-|]/)[0].trim();
    }
    if (!brand) brand = domainToBrand(normalizedUrl);

    const category = detectCategory(combinedText);

    return NextResponse.json({ brand, category, description, title: title || ogTitle || "" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Detection failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
