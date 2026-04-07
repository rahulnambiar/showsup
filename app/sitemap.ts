import type { MetadataRoute } from "next";
import { BRAND_INDEX } from "@/lib/brand-index/brands";
import { toSlug, categoryToSlug, getComparisonPairs } from "@/app/(marketing)/ai-index/_lib/utils";
import { getLatestMonth, getUserBrandsForSitemap } from "@/app/(marketing)/ai-index/_lib/data";

export const revalidate = 3600;

const BASE = "https://showsup.co";

// Blog posts — static, keep in sync with app/(marketing)/blog
const BLOG_SLUGS: { slug: string; date: string }[] = [
  { slug: "what-is-aeo-answer-engine-optimisation-guide-2026", date: "2026-03-18" },
  { slug: "how-chatgpt-decides-which-brands-to-recommend",     date: "2026-03-05" },
  { slug: "we-scanned-100-saas-brands-on-claude",              date: "2026-02-20" },
  { slug: "llms-txt-the-new-robots-txt-for-ai",                date: "2026-02-04" },
  { slug: "google-sge-vs-chatgpt-vs-claude-where-to-focus",    date: "2026-01-22" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Latest scan date drives lastmod for all brand/category/compare pages
  let latestMonth = "2026-04";
  try {
    latestMonth = await getLatestMonth();
  } catch { /* build-time: DB not yet available */ }

  const indexLastMod = new Date(`${latestMonth}-01`);

  // ── Static pages ────────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,              lastModified: new Date("2026-04-01"), changeFrequency: "weekly",   priority: 1.0  },
    { url: `${BASE}/index`,         lastModified: indexLastMod,           changeFrequency: "monthly",  priority: 0.95 },
    { url: `${BASE}/methodology`,   lastModified: new Date("2026-03-01"), changeFrequency: "monthly",  priority: 0.7  },
    { url: `${BASE}/blog`,          lastModified: new Date("2026-03-18"), changeFrequency: "weekly",   priority: 0.7  },
    { url: `${BASE}/learn/what-is-aeo`,     lastModified: new Date("2026-04-01"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/learn/llms-txt`,        lastModified: new Date("2026-04-01"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/learn/ai-visibility`,   lastModified: new Date("2026-04-01"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/about`,         lastModified: new Date("2026-03-01"), changeFrequency: "monthly",  priority: 0.5  },
    { url: `${BASE}/changelog`,     lastModified: new Date("2026-04-01"), changeFrequency: "monthly",  priority: 0.5  },
    { url: `${BASE}/cli`,           lastModified: new Date("2026-03-01"), changeFrequency: "monthly",  priority: 0.6  },
    { url: `${BASE}/chrome-extension`, lastModified: new Date("2026-03-01"), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/wordpress`,     lastModified: new Date("2026-03-01"), changeFrequency: "monthly",  priority: 0.6  },
    { url: `${BASE}/shopify`,       lastModified: new Date("2026-03-01"), changeFrequency: "monthly",  priority: 0.6  },
    { url: `${BASE}/privacy`,       lastModified: new Date("2026-01-01"), changeFrequency: "yearly",   priority: 0.2  },
    { url: `${BASE}/terms`,         lastModified: new Date("2026-01-01"), changeFrequency: "yearly",   priority: 0.2  },
  ];

  // ── Blog posts ──────────────────────────────────────────────────────────────
  const blogPages: MetadataRoute.Sitemap = BLOG_SLUGS.map(({ slug, date }) => ({
    url:             `${BASE}/blog/${slug}`,
    lastModified:    new Date(date),
    changeFrequency: "monthly" as const,
    priority:        0.7,
  }));

  // ── Brand profile pages (100 from BRAND_INDEX) ──────────────────────────────
  const brandPages: MetadataRoute.Sitemap = BRAND_INDEX.map((b) => ({
    url:             `${BASE}/index/${toSlug(b.name)}`,
    lastModified:    indexLastMod,
    changeFrequency: "monthly" as const,
    priority:        0.85,
  }));

  // ── Category pages ──────────────────────────────────────────────────────────
  const categories = Array.from(new Set(BRAND_INDEX.map((b) => b.category)));
  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url:             `${BASE}/index/category/${categoryToSlug(cat)}`,
    lastModified:    indexLastMod,
    changeFrequency: "monthly" as const,
    priority:        0.75,
  }));

  // ── Comparison pages ────────────────────────────────────────────────────────
  const pairs = getComparisonPairs();
  const comparisonPages: MetadataRoute.Sitemap = pairs.map(({ slugA, slugB }) => ({
    url:             `${BASE}/index/compare/${slugA}-vs-${slugB}`,
    lastModified:    indexLastMod,
    changeFrequency: "monthly" as const,
    priority:        0.6,
  }));

  // ── User-generated brand pages ──────────────────────────────────────────────
  let userPages: MetadataRoute.Sitemap = [];
  try {
    const userBrands = await getUserBrandsForSitemap();
    userPages = userBrands.map(({ slug, scannedAt }) => ({
      url:             `${BASE}/index/${slug}`,
      lastModified:    new Date(scannedAt),
      changeFrequency: "monthly" as const,
      priority:        0.55,
    }));
  } catch { /* non-fatal — omit user pages from sitemap this build */ }

  return [
    ...staticPages,
    ...blogPages,
    ...brandPages,
    ...categoryPages,
    ...comparisonPages,
    ...userPages,
  ];
}
