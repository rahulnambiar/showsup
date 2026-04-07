import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink, Lock } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { BRAND_INDEX } from "@/lib/brand-index/brands";
import { getBrandHistory, getBrandSnapshot, getUserBrandBySlug } from "../_lib/data";
import { ScoreTrend } from "../_components/score-trend";
import {
  toSlug, slugToBrand, scoreHex, scoreLabel, scoreLabelColor,
  formatMonth, categoryToSlug, toComparisonSlug,
} from "../_lib/utils";

export const revalidate = 3600;

export async function generateStaticParams() {
  return BRAND_INDEX.map((b) => ({ slug: toSlug(b.name) }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const brand = slugToBrand(params.slug);
  if (brand) {
    let score: number | null = null;
    let chatgpt: number | null = null;
    let claude: number | null = null;
    try {
      const history = await getBrandHistory(brand.url);
      const latest  = history[history.length - 1] ?? null;
      score   = latest?.composite_score ?? null;
      chatgpt = latest?.chatgpt_score ?? null;
      claude  = latest?.claude_score ?? null;
    } catch { /* DB unavailable at build time */ }
    return {
      title: `${brand.name} AI Visibility Score: ${score ?? "—"}/100 — ShowsUp Index`,
      description: `${brand.name} scores ${score ?? "—"}/100 for AI visibility across ChatGPT, Claude, and Gemini. See 6-signal breakdown, trends, and competitor comparison.`,
      openGraph: {
        title:       `${brand.name} AI Visibility: ${score ?? "—"}/100`,
        description: `${brand.name} AI visibility score. ChatGPT: ${chatgpt ?? "—"}, Claude: ${claude ?? "—"}.`,
        url:         `https://showsup.co/index/${params.slug}`,
      },
      twitter: { card: "summary_large_image" },
      alternates: { canonical: `https://showsup.co/index/${params.slug}` },
    };
  }

  // User-generated brand page
  let userData: Awaited<ReturnType<typeof getUserBrandBySlug>> = null;
  try {
    userData = await getUserBrandBySlug(params.slug);
  } catch { /* DB unavailable at build time */ }
  if (!userData) return { title: "Brand Not Found" };

  const score = userData.overall_score;
  return {
    title: `${userData.brand_name} AI Visibility Score: ${score ?? "—"}/100 — ShowsUp`,
    description: `${userData.brand_name} was scanned for AI visibility across ChatGPT, Claude, and Gemini. Overall score: ${score ?? "—"}/100.`,
    openGraph: {
      title:       `${userData.brand_name} AI Visibility: ${score ?? "—"}/100`,
      description: `See how ${userData.brand_name} appears in AI search results.`,
      url:         `https://showsup.co/index/${params.slug}`,
    },
    twitter: { card: "summary_large_image" },
    alternates: { canonical: `https://showsup.co/index/${params.slug}` },
  };
}

const SIGNALS = [
  { key: "llm_probing_score",        label: "LLM Probing"        },
  { key: "structured_data_score",    label: "Structured Data"    },
  { key: "training_data_score",      label: "Training Data"      },
  { key: "citation_sources_score",   label: "Citation Sources"   },
  { key: "search_correlation_score", label: "Search Correlation" },
  { key: "crawler_readiness_score",  label: "Crawler Readiness"  },
] as const;

const container = "max-w-[1200px] mx-auto px-6";

// ─────────────────────────────────────────────────────────────────────────────
// User-generated (scan-based) brand profile — limited public view
// ─────────────────────────────────────────────────────────────────────────────

async function UserBrandPage({ slug }: { slug: string }) {
  let data: Awaited<ReturnType<typeof getUserBrandBySlug>> = null;
  try {
    data = await getUserBrandBySlug(slug);
  } catch {
    // DB unavailable
  }
  if (!data) notFound();

  const { brand_name, website, category, overall_score, chatgpt_score, claude_score, gemini_score, scanned_at } = data;
  const scannedDate = new Date(scanned_at).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const domain = website ? website.replace(/^https?:\/\/(www\.)?/, "") : slug.replace(/-/g, ".");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${brand_name} AI Visibility Score`,
    description: `AI visibility tracking for ${brand_name} across ChatGPT, Claude, and Gemini`,
    url: `https://showsup.co/index/${slug}`,
    creator: { "@type": "Organization", name: "ShowsUp", url: "https://showsup.co" },
  };

  return (
    <div style={{ background: "#FFFFFF", color: "#111827" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarketingNav />
      <main className="pt-24">
        <div className={container}>
          {/* Breadcrumb */}
          <nav className="text-[12px] text-[#9CA3AF] flex items-center gap-2 mb-6">
            <Link href="/" className="hover:text-[#111827] transition-colors">Home</Link>
            <span>/</span>
            <Link href="/index" className="hover:text-[#111827] transition-colors">AI Visibility Index</Link>
            <span>/</span>
            <span className="text-[#111827] font-medium">{brand_name}</span>
          </nav>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-10 pb-8 border-b border-[#E5E7EB]">
            <div>
              {category && (
                <span className="text-[12px] font-medium text-[#6B7280] border border-[#E5E7EB] rounded-full px-3 py-1 mb-3 inline-block">{category}</span>
              )}
              <h1 className="text-[36px] md:text-[44px] font-bold text-[#111827] leading-tight mb-2">{brand_name}</h1>
              <a href={website} target="_blank" rel="noopener noreferrer"
                className="text-[13px] text-[#9CA3AF] hover:text-[#10B981] transition-colors flex items-center gap-1">
                {domain} <ExternalLink className="w-3 h-3" />
              </a>
              <p className="text-[12px] text-[#9CA3AF] mt-2">Scanned {scannedDate} · User-submitted brand</p>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-[13px] text-[#9CA3AF] mb-1">ShowsUp Score</p>
              <p className="text-[64px] font-black tabular-nums leading-none" style={{ color: scoreHex(overall_score) }}>
                {overall_score ?? "—"}
              </p>
              <p className="text-[14px] font-semibold" style={{ color: scoreLabelColor(overall_score) }}>{scoreLabel(overall_score)}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Platform scores (teaser) */}
              <section className="border border-[#E5E7EB] rounded-2xl p-6">
                <h2 className="text-[16px] font-semibold text-[#111827] mb-4">AI Platform Visibility</h2>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "ChatGPT", score: chatgpt_score },
                    { label: "Claude",  score: claude_score  },
                    { label: "Gemini",  score: gemini_score  },
                  ].map(({ label, score: s }) => (
                    <div key={label} className="text-center border border-[#E5E7EB] rounded-xl p-4">
                      <p className="text-[12px] text-[#6B7280] mb-1">{label}</p>
                      <p className="text-[32px] font-black tabular-nums" style={{ color: s !== null ? scoreHex(s) : "#D1D5DB" }}>
                        {s ?? "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Full data locked */}
              <section className="border border-dashed border-[#E5E7EB] rounded-2xl p-6 bg-[#F9FAFB]">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#F3F4F6] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Lock className="w-5 h-5 text-[#9CA3AF]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[15px] font-semibold text-[#111827] mb-1">Full 6-Signal AEO Breakdown</h3>
                    <p className="text-[13px] text-[#6B7280] mb-4">
                      LLM Probing, Structured Data, Training Data, Citation Sources, Search Correlation, and Crawler Readiness — plus monthly trend tracking and competitor benchmarking.
                    </p>
                    <Link href="/signup"
                      className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-semibold px-4 py-2 rounded-xl text-[13px] transition-colors">
                      Get your full score <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Claim / CTA */}
              <div className="border border-[#D1FAE5] bg-[#F0FDF4] rounded-2xl p-5">
                <p className="text-[14px] font-bold text-[#111827] mb-1">Is this your brand?</p>
                <p className="text-[12px] text-[#4B5563] mb-4">
                  Claim this profile to see your full AEO breakdown, track monthly progress, and get a personalised improvement plan.
                </p>
                <Link href="/signup"
                  className="flex items-center justify-center gap-1.5 bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-[13px] px-4 py-2.5 rounded-xl transition-colors">
                  Claim this profile <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Index link */}
              <Link href="/index"
                className="flex items-center justify-between group border border-[#E5E7EB] rounded-xl px-4 py-3 text-[13px] text-[#4B5563] hover:border-[#10B981] hover:text-[#10B981] transition-all">
                <span>View AI Visibility Index</span>
                <ArrowRight className="w-4 h-4 text-[#D1D5DB] group-hover:text-[#10B981]" />
              </Link>
            </div>
          </div>
        </div>
      </main>
      <div className="mt-16">
        <MarketingFooter />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Full BRAND_INDEX brand profile
// ─────────────────────────────────────────────────────────────────────────────

export default async function BrandProfilePage({ params }: { params: { slug: string } }) {
  const brand = slugToBrand(params.slug);

  // Fall through to user-generated page if not in BRAND_INDEX
  if (!brand) {
    return <UserBrandPage slug={params.slug} />;
  }

  let history: Awaited<ReturnType<typeof getBrandHistory>> = [];
  let snapshot: Awaited<ReturnType<typeof getBrandSnapshot>> = null;
  try {
    history = await getBrandHistory(brand.url);
    const latestMonthForSnapshot = history[history.length - 1]?.month ?? null;
    if (latestMonthForSnapshot) {
      snapshot = await getBrandSnapshot(brand.url, latestMonthForSnapshot);
    }
  } catch {
    // DB unavailable at build time — render with empty data
  }
  const latest       = history[history.length - 1] ?? null;
  const latestMonth  = latest?.month ?? null;
  const score        = latest?.composite_score ?? null;
  const trendData    = history.map((h) => ({ month: h.month, score: h.composite_score }));

  // Related brands in same category
  const related = BRAND_INDEX.filter((b) => b.category === brand.category && b.url !== brand.url).slice(0, 5);

  // Comparison pairs (within category top 3)
  const categoryTop3  = BRAND_INDEX.filter((b) => b.category === brand.category).slice(0, 3);
  const comparePairs  = categoryTop3
    .filter((b) => b.url !== brand.url)
    .map((b) => ({ brand: b, slug: toComparisonSlug(brand.name, b.name) }));

  // AEO checklist
  type SignalDetails = {
    training_data?: { wikipedia?: { exists?: boolean }; reddit?: { post_count?: number } };
    citation_sources?: { g2_exists?: boolean; trustpilot_exists?: boolean };
  };
  const sd = latest?.signal_details as SignalDetails | null;
  const aeoChecks = [
    { label: "llms.txt present",    ok: !!snapshot?.llms_txt_exists },
    { label: "FAQ schema markup",   ok: !!snapshot?.faq_schema_exists },
    { label: "Organization schema", ok: !!snapshot?.org_schema_exists },
    { label: "AI crawlers allowed", ok: snapshot ? Object.values(snapshot.robots_txt_ai_rules ?? {}).some((r) => r.allowed) : null },
    { label: "Sitemap present",     ok: !!snapshot?.sitemap_exists },
    { label: "Wikipedia presence",  ok: sd?.training_data?.wikipedia?.exists ?? null },
    { label: "Reddit presence",     ok: (sd?.training_data?.reddit?.post_count ?? 0) > 0 },
    { label: "G2 profile",          ok: sd?.citation_sources?.g2_exists ?? null },
    { label: "Trustpilot profile",  ok: sd?.citation_sources?.trustpilot_exists ?? null },
  ] as Array<{ label: string; ok: boolean | null }>;

  // JSON-LD Dataset structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${brand.name} AI Visibility Score`,
    description: `Monthly AI visibility tracking for ${brand.name} across ChatGPT, Claude, and Gemini. Composite score: ${score ?? "n/a"}/100.`,
    url: `https://showsup.co/index/${params.slug}`,
    temporalCoverage: "2026-04/..",
    measurementTechnique: "LLM probing, structured data analysis, training data signals, citation source analysis, search correlation, crawler readiness",
    creator: { "@type": "Organization", name: "ShowsUp", url: "https://showsup.co" },
    ...(score !== null && {
      variableMeasured: [
        { "@type": "PropertyValue", name: "Composite AI Visibility Score", value: score, unitText: "out of 100" },
        ...(latest?.chatgpt_score !== null && latest?.chatgpt_score !== undefined
          ? [{ "@type": "PropertyValue", name: "ChatGPT Visibility Score", value: latest.chatgpt_score, unitText: "out of 100" }]
          : []),
        ...(latest?.claude_score !== null && latest?.claude_score !== undefined
          ? [{ "@type": "PropertyValue", name: "Claude Visibility Score", value: latest.claude_score, unitText: "out of 100" }]
          : []),
        ...(latest?.gemini_score !== null && latest?.gemini_score !== undefined
          ? [{ "@type": "PropertyValue", name: "Gemini Visibility Score", value: latest.gemini_score, unitText: "out of 100" }]
          : []),
      ],
    }),
  };

  return (
    <div style={{ background: "#FFFFFF", color: "#111827" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarketingNav />

      <main className="pt-24">
        <div className={container}>
          {/* Breadcrumb */}
          <nav className="text-[12px] text-[#9CA3AF] flex items-center gap-2 mb-6">
            <Link href="/" className="hover:text-[#111827] transition-colors">Home</Link>
            <span>/</span>
            <Link href="/index" className="hover:text-[#111827] transition-colors">AI Visibility Index</Link>
            <span>/</span>
            <Link href={`/index/category/${categoryToSlug(brand.category)}`} className="hover:text-[#111827] transition-colors">{brand.category}</Link>
            <span>/</span>
            <span className="text-[#111827] font-medium">{brand.name}</span>
          </nav>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-10 pb-8 border-b border-[#E5E7EB]">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[12px] font-medium text-[#6B7280] border border-[#E5E7EB] rounded-full px-3 py-1">{brand.category}</span>
                {brand.stock_ticker && (
                  <span className="text-[12px] font-mono text-[#9CA3AF] border border-[#E5E7EB] rounded-full px-3 py-1">{brand.stock_ticker}</span>
                )}
              </div>
              <h1 className="text-[36px] md:text-[48px] font-bold text-[#111827] leading-tight mb-2">{brand.name}</h1>
              <a href={brand.url} target="_blank" rel="noopener noreferrer"
                className="text-[13px] text-[#9CA3AF] hover:text-[#10B981] transition-colors flex items-center gap-1">
                {brand.url.replace("https://", "")} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-[13px] text-[#9CA3AF] mb-1">Composite Score</p>
              <p className="text-[64px] font-black tabular-nums leading-none" style={{ color: scoreHex(score) }}>
                {score ?? "—"}
              </p>
              <p className="text-[14px] font-semibold" style={{ color: scoreLabelColor(score) }}>{scoreLabel(score)}</p>
              {latest?.score_delta !== null && latest?.score_delta !== undefined && (
                <p className="text-[13px] font-semibold mt-1"
                  style={{ color: latest.score_delta > 0 ? "#10B981" : latest.score_delta < 0 ? "#EF4444" : "#9CA3AF" }}>
                  {latest.score_delta > 0 ? "↑" : latest.score_delta < 0 ? "↓" : ""} {Math.abs(latest.score_delta)} pts vs last month
                </p>
              )}
              {latestMonth && <p className="text-[12px] text-[#9CA3AF] mt-1">As of {formatMonth(latestMonth)}</p>}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">

              {/* Score trend */}
              <section className="border border-[#E5E7EB] rounded-2xl p-6">
                <h2 className="text-[16px] font-semibold text-[#111827] mb-4">Score Trend</h2>
                <ScoreTrend data={trendData} color={scoreHex(score)} />
              </section>

              {/* 6-signal breakdown */}
              <section className="border border-[#E5E7EB] rounded-2xl p-6">
                <h2 className="text-[16px] font-semibold text-[#111827] mb-5">Signal Breakdown</h2>
                {latest === null ? (
                  <p className="text-[13px] text-[#9CA3AF]">No scan data yet.</p>
                ) : (
                  <div className="space-y-4">
                    {SIGNALS.map(({ key, label }) => {
                      const val = latest[key];
                      return (
                        <div key={key} className="flex items-center gap-4">
                          <span className="text-[13px] text-[#4B5563] w-36 flex-shrink-0">{label}</span>
                          <div className="flex-1 bg-[#F3F4F6] rounded-full h-5 overflow-hidden">
                            {val !== null ? (
                              <div
                                className="h-5 rounded-full flex items-center justify-end pr-2"
                                style={{ width: `${val}%`, background: scoreHex(val), minWidth: val > 0 ? "32px" : "0" }}
                              >
                                <span className="text-[10px] font-bold text-white">{val}</span>
                              </div>
                            ) : (
                              <div className="h-5 flex items-center px-3">
                                <span className="text-[10px] text-[#9CA3AF]">—</span>
                              </div>
                            )}
                          </div>
                          <span className="text-[12px] font-semibold w-16 text-right" style={{ color: scoreLabelColor(val) }}>
                            {scoreLabel(val)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Platform breakdown */}
              {latest && (latest.chatgpt_score !== null || latest.claude_score !== null || latest.gemini_score !== null) && (
                <section className="border border-[#E5E7EB] rounded-2xl p-6">
                  <h2 className="text-[16px] font-semibold text-[#111827] mb-4">Platform Scores</h2>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "ChatGPT", score: latest.chatgpt_score },
                      { label: "Claude",  score: latest.claude_score  },
                      { label: "Gemini",  score: latest.gemini_score  },
                    ].map(({ label, score: s }) => (
                      <div key={label} className="text-center border border-[#E5E7EB] rounded-xl p-4">
                        <p className="text-[12px] text-[#6B7280] mb-1">{label}</p>
                        <p className="text-[32px] font-black tabular-nums" style={{ color: s !== null ? scoreHex(s) : "#D1D5DB" }}>
                          {s ?? "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Changes timeline */}
              {history.length > 0 && (
                <section className="border border-[#E5E7EB] rounded-2xl p-6">
                  <h2 className="text-[16px] font-semibold text-[#111827] mb-4">Changes Timeline</h2>
                  <div className="space-y-3">
                    {[...history].reverse().slice(0, 6).map((h) => {
                      const changes = h.changes_detected ?? [];
                      return (
                        <div key={h.month} className="flex items-start gap-3 text-[13px]">
                          <div className="flex-shrink-0 w-20 text-[#9CA3AF] font-medium">{h.month}</div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="font-bold tabular-nums" style={{ color: scoreHex(h.composite_score) }}>
                              {h.composite_score ?? "—"}
                            </span>
                            {h.score_delta !== null && (
                              <span className="text-[12px]" style={{ color: h.score_delta > 0 ? "#10B981" : h.score_delta < 0 ? "#EF4444" : "#9CA3AF" }}>
                                ({h.score_delta > 0 ? "+" : ""}{h.score_delta})
                              </span>
                            )}
                          </div>
                          <div className="flex-1 text-[#4B5563]">
                            {changes.length > 0 ? changes.slice(0, 2).map((c) => c.detail).join("; ") : "No changes detected"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* AEO Checklist */}
              <section className="border border-[#E5E7EB] rounded-2xl p-5">
                <h2 className="text-[14px] font-semibold text-[#111827] mb-4">AEO Signals Checklist</h2>
                <div className="space-y-2.5">
                  {aeoChecks.map(({ label, ok }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <span className="text-[14px] flex-shrink-0">
                        {ok === null ? "⬜" : ok ? "✅" : "❌"}
                      </span>
                      <span className="text-[13px] text-[#4B5563]">{label}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Compare */}
              {comparePairs.length > 0 && (
                <section className="border border-[#E5E7EB] rounded-2xl p-5">
                  <h2 className="text-[14px] font-semibold text-[#111827] mb-4">Compare with</h2>
                  <div className="space-y-2">
                    {comparePairs.map(({ brand: b, slug }) => (
                      <Link key={b.url} href={`/index/compare/${slug}`}
                        className="flex items-center justify-between group hover:text-[#10B981] transition-colors text-[13px] text-[#4B5563] py-1">
                        <span>{b.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#D1D5DB] group-hover:text-[#10B981] transition-colors" />
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Related brands */}
              {related.length > 0 && (
                <section className="border border-[#E5E7EB] rounded-2xl p-5">
                  <h2 className="text-[14px] font-semibold text-[#111827] mb-1">Other {brand.category} brands</h2>
                  <Link href={`/index/category/${categoryToSlug(brand.category)}`}
                    className="text-[12px] text-[#10B981] hover:text-[#059669] transition-colors mb-4 block">
                    View all →
                  </Link>
                  <div className="space-y-2">
                    {related.map((b) => (
                      <Link key={b.url} href={`/index/${toSlug(b.name)}`}
                        className="flex items-center justify-between group hover:text-[#10B981] transition-colors text-[13px] text-[#4B5563] py-1">
                        <span>{b.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#D1D5DB] group-hover:text-[#10B981] transition-colors" />
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* CTA */}
              <div className="bg-gradient-to-br from-[#F0FDF4] to-white border border-[#D1FAE5] rounded-2xl p-5">
                <p className="text-[14px] font-semibold text-[#111827] mb-2">How does your brand compare?</p>
                <p className="text-[12px] text-[#6B7280] mb-4">Get your AI visibility score and see how you stack up.</p>
                <Link href="/signup"
                  className="flex items-center justify-center gap-1.5 bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-[13px] px-4 py-2.5 rounded-xl transition-colors">
                  Check your AI visibility <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="mt-16">
        <MarketingFooter />
      </div>
    </div>
  );
}
