/**
 * Generates llms.txt content for a Shopify store.
 * Structured to maximise AI crawler comprehension of the store's
 * products, collections, shipping, and content.
 */

import type { ShopData } from "./shopify-data.server";

export function buildLlmsTxt(data: ShopData, scanResult?: Record<string, unknown>): string {
  const { shop, products, collections, pages, articles, policies } = data;
  const lines: string[] = [];

  // ── Header ─────────────────────────────────────────────────────────────────
  lines.push(`# ${shop.name}`);
  lines.push("");
  if (shop.description) {
    lines.push(`> ${shop.description}`);
    lines.push("");
  }
  lines.push(`- URL: ${shop.domain}`);
  lines.push(`- Category: E-commerce`);
  lines.push(`- Currency: ${shop.currency}`);
  if (shop.shipsTo.length > 0) {
    lines.push(`- Ships to: ${shop.shipsTo.slice(0, 20).join(", ")}`);
  }
  if (scanResult?.overall_score) {
    lines.push(`- AI Visibility Score: ${scanResult.overall_score}/100`);
  }
  lines.push("");

  // ── Collections ────────────────────────────────────────────────────────────
  if (collections.length > 0) {
    lines.push("## Product Collections");
    lines.push("");
    collections.forEach((col) => {
      const desc = col.description
        ? ` — ${col.description.slice(0, 100)}`
        : ` — ${col.productCount} products`;
      lines.push(`- [${col.title}](${shop.domain}/collections/${col.handle})${desc}`);
    });
    lines.push("");
  }

  // ── Products ───────────────────────────────────────────────────────────────
  if (products.length > 0) {
    lines.push("## Products");
    lines.push("");
    products.forEach((p) => {
      const price =
        p.minPrice === p.maxPrice
          ? `${p.currency} ${p.minPrice}`
          : `${p.currency} ${p.minPrice}–${p.maxPrice}`;
      const stock = p.inStock ? "In stock" : "Out of stock";
      const desc  = p.description ? p.description.slice(0, 120) : "";
      lines.push(
        `- [${p.title}](${shop.domain}/products/${p.handle}): ${price} · ${stock}${desc ? " — " + desc : ""}`
      );
    });
    lines.push("");
  }

  // ── Shipping ───────────────────────────────────────────────────────────────
  const shippingPolicy = policies.find((p) => p.title.toLowerCase().includes("ship"));
  if (shippingPolicy) {
    lines.push("## Shipping");
    lines.push("");
    lines.push(shippingPolicy.body.slice(0, 400));
    lines.push(`- Full policy: ${shippingPolicy.url}`);
    lines.push("");
  }

  // ── Returns ────────────────────────────────────────────────────────────────
  const refundPolicy = policies.find((p) => p.title.toLowerCase().includes("refund") || p.title.toLowerCase().includes("return"));
  if (refundPolicy) {
    lines.push("## Returns & Refunds");
    lines.push("");
    lines.push(refundPolicy.body.slice(0, 300));
    lines.push(`- Full policy: ${refundPolicy.url}`);
    lines.push("");
  }

  // ── Blog / Content ─────────────────────────────────────────────────────────
  if (articles.length > 0) {
    lines.push("## Blog");
    lines.push("");
    articles.slice(0, 15).forEach((a) => {
      const excerpt = a.excerpt ? `: ${a.excerpt.slice(0, 100)}` : "";
      lines.push(`- [${a.title}](${shop.domain}/blogs/${a.blogHandle}/${a.handle})${excerpt}`);
    });
    lines.push("");
  }

  // ── Pages ──────────────────────────────────────────────────────────────────
  if (pages.length > 0) {
    lines.push("## Pages");
    lines.push("");
    pages.forEach((pg) => {
      const snippet = pg.body ? `: ${pg.body.slice(0, 80)}` : "";
      lines.push(`- [${pg.title}](${shop.domain}/pages/${pg.handle})${snippet}`);
    });
    lines.push("");
  }

  // ── Scan gap queries (what AI models ask that we should answer) ────────────
  if (scanResult && Array.isArray((scanResult as any).recommendations)) {
    const recs = (scanResult as any).recommendations as Array<{ title?: string }>;
    if (recs.length > 0) {
      lines.push("## What Customers Ask (AI Gap Queries)");
      lines.push("");
      recs.slice(0, 10).forEach((r) => {
        if (r.title) lines.push(`- ${r.title}`);
      });
      lines.push("");
    }
  }

  return lines.join("\n");
}
