import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Globe2, Github } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { getIndexData, getLatestMonth, getPublishedInsights } from "./_lib/data";
import { RankingsTable } from "./_components/rankings-table";
import { StockScatterPreview } from "./_components/stock-scatter";
import { toSlug, scoreHex, scoreLabel, formatMonth, categoryToSlug } from "./_lib/utils";
import { BRAND_INDEX } from "@/lib/brand-index/brands";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Visibility Index — Top 100 Global Brands Ranked | ShowsUp",
  description:
    "Monthly ranking of the world's top 100 brands by AI visibility across ChatGPT, Claude, and Gemini. 6 signal layers, stock correlation, open methodology.",
  keywords: [
    "AI visibility index", "brand AI ranking", "ChatGPT brand visibility",
    "top 100 brands AI", "AEO index", "AI brand ranking 2026",
  ],
  openGraph: {
    type: "website",
    title: "AI Visibility Index — Top 100 Global Brands Ranked",
    description: "Monthly ranking of 100 brands across ChatGPT, Claude, and Gemini. 6 signal layers.",
    url: "https://showsup.co/index",
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "https://showsup.co/index" },
};

const SIGNAL_LABELS = [
  { key: "llm_probing_score",        label: "LLM Probing",        desc: "Mention rate across ChatGPT, Claude, Gemini"         },
  { key: "structured_data_score",    label: "Structured Data",    desc: "llms.txt, schema markup, robots.txt configuration"   },
  { key: "training_data_score",      label: "Training Data",      desc: "Wikipedia, Reddit presence — training corpus depth"  },
  { key: "citation_sources_score",   label: "Citation Sources",   desc: "G2, Trustpilot, third-party citation quality"         },
  { key: "search_correlation_score", label: "Search Correlation", desc: "Organic search ranking correlation"                  },
  { key: "crawler_readiness_score",  label: "Crawler Readiness",  desc: "AI bot access permissions"                           },
] as const;

const container = "max-w-[1200px] mx-auto px-6";

export default async function IndexPage() {
  let month = "";
  let insights: Awaited<ReturnType<typeof getPublishedInsights>> = [];
  let rows: Awaited<ReturnType<typeof getIndexData>> = [];
  try {
    [month, insights] = await Promise.all([getLatestMonth(), getPublishedInsights(6)]);
    rows = await getIndexData(month);
  } catch { /* DB unavailable at build time */ }

  const categories = Array.from(new Set(BRAND_INDEX.map((b) => b.category))).sort();
  const top10 = rows.slice(0, 10);
  const top3 = top10.slice(0, 3);
  const rest7 = top10.slice(3, 10);

  // Signal averages
  const signalAvgs = SIGNAL_LABELS.map(({ key, label, desc }) => {
    const vals = rows.filter((r) => r[key] !== null).map((r) => r[key] as number);
    const avg = vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : null;
    return { key, label, desc, avg };
  });

  // Category leaders
  const categoryLeaders = categories.map((cat) => {
    const catRows = rows.filter((r) => r.category === cat && r.composite_score !== null);
    const leader = catRows[0] ?? null;
    return { category: cat, leader };
  }).filter((c) => c.leader !== null);

  // Biggest mover
  const movers = rows.filter((r) => r.score_delta !== null).sort((a, b) => Math.abs(b.score_delta!) - Math.abs(a.score_delta!));
  const biggestMover = movers[0];

  // llms.txt adoption
  const llmsCount = rows.filter((r) => (r.website_snapshot as { llms_txt_exists?: boolean } | null)?.llms_txt_exists).length;

  return (
    <div style={{ background: "#FFFFFF", color: "#111827" }}>
      <MarketingNav />

      {/* Hero */}
      <section className="pt-28 pb-16 bg-gradient-to-b from-[#F9FAFB] to-white border-b border-[#E5E7EB]">
        <div className={container}>
          <div className="max-w-[680px]">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[11px] font-semibold text-[#10B981] uppercase tracking-wider border border-[#D1FAE5] bg-[#F0FDF4] px-2.5 py-1 rounded-full">
                Open Index
              </span>
              <span className="text-[11px] text-[#9CA3AF]">Updated monthly</span>
            </div>
            <h1 className="text-[40px] md:text-[52px] font-bold text-[#111827] leading-[1.1] tracking-tight mb-4">
              AI Visibility Index
            </h1>
            <p className="text-[18px] text-[#4B5563] leading-relaxed mb-2">
              How the world&apos;s top brands rank across ChatGPT, Claude, and Gemini.
            </p>
            <p className="text-[15px] text-[#6B7280]">
              6 signal layers · Open methodology · Stock correlation data
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-6 text-[13px] text-[#6B7280]">
              <span className="flex items-center gap-1.5">
                <Globe2 className="w-4 h-4 text-[#10B981]" />
                {rows.length > 0 ? `${rows.length} brands tracked` : "100 brands tracked"}
              </span>
              {month && <span>Last updated: {formatMonth(month)}</span>}
              {rows.length > 0 && <span>{llmsCount} brands with llms.txt ({Math.round(llmsCount / rows.length * 100)}%)</span>}
            </div>
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className={`${container} py-3`}>
        <nav className="text-[12px] text-[#9CA3AF] flex items-center gap-2">
          <Link href="/" className="hover:text-[#111827] transition-colors">Home</Link>
          <span>/</span>
          <span className="text-[#111827] font-medium">AI Visibility Index</span>
        </nav>
      </div>

      {/* Stats bar */}
      {rows.length > 0 && (
        <section className="border-y border-[#E5E7EB] bg-[#F9FAFB]">
          <div className={`${container} py-5`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: "Brands Tracked", value: "100", note: "Global top 100" },
                { label: "Avg AI Score", value: rows.length > 0 ? `${Math.round(rows.filter((r) => r.composite_score !== null).reduce((s, r) => s + r.composite_score!, 0) / rows.filter((r) => r.composite_score !== null).length)}/100` : "—", note: "Composite across 6 signals" },
                { label: "llms.txt Adoption", value: `${llmsCount}%`, note: `${llmsCount} of ${rows.length} brands` },
                { label: "Biggest Mover", value: biggestMover ? biggestMover.brand_name : "—", note: biggestMover ? `${biggestMover.score_delta! > 0 ? "+" : ""}${biggestMover.score_delta} pts` : "—" },
              ].map(({ label, value, note }) => (
                <div key={label}>
                  <p className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-[22px] font-bold text-[#111827] tabular-nums leading-tight">{value}</p>
                  <p className="text-[12px] text-[#6B7280]">{note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <main className={`${container} py-16 space-y-20`}>

        {/* Top 10 */}
        <section>
          <h2 className="text-[28px] font-bold text-[#111827] mb-2">Top 10 Brands</h2>
          <p className="text-[15px] text-[#6B7280] mb-8">
            Highest composite AI visibility scores for {formatMonth(month)}.
          </p>

          {rows.length === 0 ? (
            <div className="text-center py-16 border border-[#E5E7EB] rounded-2xl bg-[#F9FAFB]">
              <Globe2 className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
              <p className="text-[#6B7280] font-medium">First monthly scan in progress.</p>
              <p className="text-[13px] text-[#9CA3AF] mt-1">Rankings will appear after the scan completes on the 1st of each month.</p>
            </div>
          ) : (
            <>
              {/* Top 3 large cards */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {top3.map((row, i) => {
                  const rankColors = ["#F59E0B", "#9CA3AF", "#CD7C2F"];
                  const descriptors = row.key_descriptors?.slice(0, 3) ?? [];
                  return (
                    <Link
                      key={row.brand_url}
                      href={`/index/${toSlug(row.brand_name)}`}
                      className="group block border border-[#E5E7EB] rounded-2xl p-6 hover:border-[#10B981] hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <span className="text-[13px] font-bold" style={{ color: rankColors[i] }}>
                          #{i + 1}
                        </span>
                        <span className="text-[11px] text-[#9CA3AF] border border-[#E5E7EB] rounded-full px-2 py-0.5">
                          {row.category}
                        </span>
                      </div>
                      <p className="text-[20px] font-bold text-[#111827] group-hover:text-[#10B981] transition-colors mb-1">
                        {row.brand_name}
                      </p>
                      <p className="text-[40px] font-black tabular-nums leading-none mb-3" style={{ color: scoreHex(row.composite_score) }}>
                        {row.composite_score ?? "—"}
                      </p>
                      {row.score_delta !== null && (
                        <p className="text-[13px] font-semibold mb-3"
                          style={{ color: row.score_delta > 0 ? "#10B981" : row.score_delta < 0 ? "#EF4444" : "#9CA3AF" }}>
                          {row.score_delta > 0 ? "↑" : "↓"} {Math.abs(row.score_delta)} pts vs last month
                        </p>
                      )}
                      {descriptors.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {descriptors.map((d) => (
                            <span key={d} className="text-[11px] px-2 py-0.5 bg-[#F3F4F6] text-[#6B7280] rounded-full">{d}</span>
                          ))}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* #4–10 list */}
              <div className="border border-[#E5E7EB] rounded-2xl overflow-hidden">
                {rest7.map((row, i) => (
                  <Link
                    key={row.brand_url}
                    href={`/index/${toSlug(row.brand_name)}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#F9FAFB] transition-colors border-b border-[#F3F4F6] last:border-0 group"
                  >
                    <span className="text-[14px] font-mono text-[#9CA3AF] w-6 text-right flex-shrink-0">#{i + 4}</span>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-[#111827] group-hover:text-[#10B981] transition-colors">{row.brand_name}</span>
                      <span className="text-[12px] text-[#9CA3AF] ml-2">{row.category}</span>
                    </div>
                    <span className="text-[18px] font-bold tabular-nums flex-shrink-0" style={{ color: scoreHex(row.composite_score) }}>
                      {row.composite_score ?? "—"}
                    </span>
                    {row.score_delta !== null && (
                      <span className="text-[12px] font-semibold w-12 text-right flex-shrink-0 tabular-nums"
                        style={{ color: row.score_delta > 0 ? "#10B981" : row.score_delta < 0 ? "#EF4444" : "#9CA3AF" }}>
                        {row.score_delta > 0 ? `+${row.score_delta}` : row.score_delta === 0 ? "—" : row.score_delta}
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-[#D1D5DB] group-hover:text-[#10B981] flex-shrink-0 transition-colors" />
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Full rankings */}
        <section id="rankings">
          <h2 className="text-[28px] font-bold text-[#111827] mb-2">Full Rankings</h2>
          <p className="text-[15px] text-[#6B7280] mb-6">
            All 100 brands sorted by composite AI visibility. Click headers to sort.
          </p>
          <RankingsTable rows={rows} categories={categories} />
        </section>

        {/* Category leaders */}
        <section id="categories">
          <h2 className="text-[28px] font-bold text-[#111827] mb-2">Category Leaders</h2>
          <p className="text-[15px] text-[#6B7280] mb-6">#1 brand per category for {formatMonth(month)}.</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {categories.map((cat) => {
              const catSlug = categoryToSlug(cat);
              const leader = categoryLeaders.find((c) => c.category === cat)?.leader;
              return (
                <Link
                  key={cat}
                  href={`/index/category/${catSlug}`}
                  className="group block border border-[#E5E7EB] rounded-xl p-4 hover:border-[#10B981] hover:shadow-sm transition-all"
                >
                  <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wide mb-2">{cat}</p>
                  {leader ? (
                    <>
                      <p className="font-bold text-[#111827] text-[14px] group-hover:text-[#10B981] transition-colors mb-1 leading-tight">
                        {leader.brand_name}
                      </p>
                      <p className="text-[24px] font-black tabular-nums" style={{ color: scoreHex(leader.composite_score) }}>
                        {leader.composite_score ?? "—"}
                      </p>
                    </>
                  ) : (
                    <p className="text-[13px] text-[#9CA3AF]">No data yet</p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>

        {/* Signal averages */}
        <section id="signals">
          <h2 className="text-[28px] font-bold text-[#111827] mb-2">Signal Layer Averages</h2>
          <p className="text-[15px] text-[#6B7280] mb-8">
            Where the biggest global gaps are — average score per signal across all 100 brands.
          </p>

          <div className="space-y-4">
            {signalAvgs.map(({ label, desc, avg }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="w-36 flex-shrink-0">
                  <p className="text-[13px] font-semibold text-[#111827]">{label}</p>
                  <p className="text-[11px] text-[#9CA3AF] hidden md:block">{desc}</p>
                </div>
                <div className="flex-1 bg-[#F3F4F6] rounded-full h-6 overflow-hidden">
                  {avg !== null ? (
                    <div
                      className="h-6 rounded-full flex items-center justify-end pr-3 transition-all"
                      style={{ width: `${avg}%`, background: scoreHex(avg), minWidth: avg > 0 ? "40px" : "0" }}
                    >
                      <span className="text-[11px] font-bold text-white">{avg}</span>
                    </div>
                  ) : (
                    <div className="h-6 flex items-center px-3">
                      <span className="text-[11px] text-[#9CA3AF]">No data</span>
                    </div>
                  )}
                </div>
                {avg !== null && (
                  <span className="text-[12px] font-semibold w-16 text-right"
                    style={{ color: scoreHex(avg) }}>
                    {scoreLabel(avg)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Published insights */}
        {insights.length > 0 && (
          <section id="insights">
            <h2 className="text-[28px] font-bold text-[#111827] mb-2">Monthly Insights</h2>
            <p className="text-[15px] text-[#6B7280] mb-8">Data-backed findings from the Brand Index research team.</p>
            <div className="grid md:grid-cols-2 gap-4">
              {insights.map((insight) => (
                <div key={insight.id} className="border border-[#E5E7EB] rounded-2xl p-6 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${insight.confidence === "high" ? "bg-[#F0FDF4] border-[#D1FAE5] text-[#059669]" : "bg-[#FFF7ED] border-[#FED7AA] text-[#D97706]"}`}>
                      {insight.confidence} confidence
                    </span>
                    <span className="text-[11px] text-[#9CA3AF]">{insight.insight_type}</span>
                  </div>
                  <h3 className="text-[16px] font-semibold text-[#111827] mb-2 leading-snug">{insight.title}</h3>
                  <p className="text-[13px] text-[#4B5563] leading-relaxed">{insight.description}</p>
                  {insight.brands_involved.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {insight.brands_involved.slice(0, 5).map((b) => (
                        <Link
                          key={b}
                          href={`/index/${toSlug(b)}`}
                          className="text-[11px] px-2 py-0.5 bg-[#F0FDF4] text-[#059669] rounded-full hover:bg-[#D1FAE5] transition-colors"
                        >
                          {b}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Stock correlation preview */}
        <section id="stock">
          <h2 className="text-[28px] font-bold text-[#111827] mb-2">AI Visibility × Stock Performance</h2>
          <p className="text-[15px] text-[#6B7280] mb-6">
            Do brands that show up more in AI also perform better on the stock market? Each dot is a public company.
          </p>
          <div className="border border-[#E5E7EB] rounded-2xl p-6">
            <StockScatterPreview rows={rows} />
          </div>
        </section>

        {/* Methodology teaser */}
        <section className="border border-[#E5E7EB] rounded-2xl p-8 bg-[#F9FAFB]">
          <h2 className="text-[20px] font-bold text-[#111827] mb-3">Open Methodology</h2>
          <p className="text-[15px] text-[#4B5563] mb-5 max-w-2xl">
            The Brand Index uses 6 signal layers: LLM probing (30%), structured data readiness (20%), training data footprint (15%), citation source analysis (15%), search correlation (10%), and AI crawler accessibility (10%).
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/methodology" className="text-[13px] font-medium text-[#10B981] hover:text-[#059669] transition-colors flex items-center gap-1.5">
              Read the full methodology <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <a href="https://github.com/rahulnambiar/showsup" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[13px] text-[#6B7280] hover:text-[#111827] transition-colors">
              <Github className="w-3.5 h-3.5" />
              View on GitHub
            </a>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-8">
          <h2 className="text-[28px] font-bold text-[#111827] mb-3">How does your brand compare?</h2>
          <p className="text-[16px] text-[#4B5563] mb-8 max-w-lg mx-auto">
            Check your AI visibility score, see how you compare to global brands, and get a fix plan.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-semibold px-6 py-3 rounded-xl text-[15px] transition-colors shadow-sm"
            >
              Check your AI visibility <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://github.com/rahulnambiar/showsup"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-[#E5E7EB] hover:border-[#D1D5DB] text-[#4B5563] font-medium px-6 py-3 rounded-xl text-[15px] transition-colors"
            >
              <Github className="w-4 h-4" />
              View on GitHub
            </a>
          </div>
        </section>

      </main>

      <MarketingFooter />
    </div>
  );
}
