import { BRAND_INDEX, type Brand } from "@/lib/brand-index/brands";

// ── Slug helpers ──────────────────────────────────────────────────────────────

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "")          // apostrophes
    .replace(/&/g, "and")
    .replace(/[éèê]/g, "e")
    .replace(/[àâ]/g, "a")
    .replace(/[ô]/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function slugToBrand(slug: string): Brand | undefined {
  return BRAND_INDEX.find((b) => toSlug(b.name) === slug);
}

// ── Score display ─────────────────────────────────────────────────────────────

export function scoreHex(n: number | null | undefined): string {
  if (n == null) return "#9CA3AF";
  if (n >= 60) return "#10B981";
  if (n >= 30) return "#F59E0B";
  return "#EF4444";
}

export function scoreLabel(n: number | null | undefined): string {
  if (n == null) return "No data";
  if (n >= 60) return "Strong";
  if (n >= 30) return "Moderate";
  return "Weak";
}

export function scoreLabelColor(n: number | null | undefined): string {
  if (n == null) return "#9CA3AF";
  if (n >= 60) return "#059669";
  if (n >= 30) return "#D97706";
  return "#DC2626";
}

// ── Month helpers ─────────────────────────────────────────────────────────────

export function currentMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function formatMonth(m: string): string {
  const [y, mo] = m.split("-");
  return new Date(Number(y), Number(mo) - 1, 1)
    .toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// ── Category slug ─────────────────────────────────────────────────────────────

export function categoryToSlug(category: string): string {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function slugToCategory(slug: string): string | undefined {
  const categories = Array.from(new Set(BRAND_INDEX.map((b) => b.category)));
  return categories.find((c) => categoryToSlug(c) === slug);
}

// ── Comparison slug helpers ───────────────────────────────────────────────────

export function toComparisonSlug(brandA: string, brandB: string): string {
  return `${toSlug(brandA)}-vs-${toSlug(brandB)}`;
}

export function parseComparisonSlug(slug: string): { slugA: string; slugB: string } | null {
  const idx = slug.indexOf("-vs-");
  if (idx === -1) return null;
  return { slugA: slug.slice(0, idx), slugB: slug.slice(idx + 4) };
}

// ── Domain / URL slug helpers ─────────────────────────────────────────────────

export function domainToSlug(url: string): string {
  try {
    const { hostname } = new URL(url.startsWith("http") ? url : `https://${url}`);
    return hostname
      .replace(/^www\./, "")
      .replace(/\./g, "-")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "");
  } catch {
    return url.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
}

// ── Comparison pair generation (top 2-3 brands per category) ─────────────────

export function getComparisonPairs(): Array<{ slugA: string; slugB: string; category: string }> {
  const pairs: Array<{ slugA: string; slugB: string; category: string }> = [];
  const categories = Array.from(new Set(BRAND_INDEX.map((b) => b.category)));

  for (const category of categories) {
    const brands = BRAND_INDEX.filter((b) => b.category === category).slice(0, 3);
    for (let i = 0; i < brands.length; i++) {
      for (let j = i + 1; j < brands.length; j++) {
        pairs.push({
          slugA: toSlug(brands[i].name),
          slugB: toSlug(brands[j].name),
          category,
        });
      }
    }
  }
  return pairs;
}
