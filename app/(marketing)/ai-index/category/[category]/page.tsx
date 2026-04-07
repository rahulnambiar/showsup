import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { BRAND_INDEX } from "@/lib/brand-index/brands";
import { getIndexData, getLatestMonth, getPublishedInsights, getCategoryHistory } from "../../_lib/data";
import { ScoreTrend } from "../../_components/score-trend";
import { toSlug, slugToCategory, scoreHex, formatMonth, categoryToSlug, toComparisonSlug } from "../../_lib/utils";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const categories = Array.from(new Set(BRAND_INDEX.map((b) => b.category)));
  return categories.map((cat) => ({ category: categoryToSlug(cat) }));
}

export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
  const category = slugToCategory(params.category);
  if (!category) return { title: "Category Not Found" };

  return {
    title: `AI Visibility: Top ${category} Brands Ranked | ShowsUp Index`,
    description: `Monthly ranking of ${category} brands by AI visibility across ChatGPT, Claude, and Gemini. Scores, trends, and signal breakdown.`,
    openGraph: {
      title: `AI Visibility: Top ${category} Brands`,
      description: `See which ${category} brands show up most in ChatGPT, Claude, and Gemini.`,
      url: `https://showsup.co/index/category/${params.category}`,
    },
    alternates: { canonical: `https://showsup.co/index/category/${params.category}` },
  };
}

const container = "max-w-[1200px] mx-auto px-6";

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const category = slugToCategory(params.category);
  if (!category) notFound();

  let month = "";
  let catHistory: Awaited<ReturnType<typeof getCategoryHistory>> = [];
  let insights: Awaited<ReturnType<typeof getPublishedInsights>> = [];
  let allRows: Awaited<ReturnType<typeof getIndexData>> = [];
  try {
    [month, catHistory, insights] = await Promise.all([
      getLatestMonth(),
      getCategoryHistory(category),
      getPublishedInsights(10),
    ]);
    allRows = await getIndexData(month);
  } catch { /* DB unavailable at build time */ }

  const rows = allRows
    .filter((r) => r.category === category)
    .sort((a, b) => (b.composite_score ?? -1) - (a.composite_score ?? -1));

  const brandsInCategory = BRAND_INDEX.filter((b) => b.category === category);
  const avgScore = rows.filter((r) => r.composite_score !== null).length > 0
    ? Math.round(rows.filter((r) => r.composite_score !== null).reduce((s, r) => s + r.composite_score!, 0) / rows.filter((r) => r.composite_score !== null).length)
    : null;

  // Category insights
  const catInsights = insights.filter((i) => !i.category || i.category === category);

  // Top 2 brands for comparison pairs
  const top3Static = BRAND_INDEX.filter((b) => b.category === category).slice(0, 3);
  const comparePairs: Array<{ nameA: string; nameB: string; slug: string }> = [];
  for (let i = 0; i < top3Static.length; i++) {
    for (let j = i + 1; j < top3Static.length; j++) {
      comparePairs.push({
        nameA: top3Static[i].name,
        nameB: top3Static[j].name,
        slug: toComparisonSlug(top3Static[i].name, top3Static[j].name),
      });
    }
  }

  // ChatGPT vs Claude for category
  const chatgptLeader = rows.filter((r) => r.chatgpt_score !== null).sort((a, b) => (b.chatgpt_score ?? 0) - (a.chatgpt_score ?? 0))[0];
  const claudeLeader = rows.filter((r) => r.claude_score !== null).sort((a, b) => (b.claude_score ?? 0) - (a.claude_score ?? 0))[0];

  return (
    <div style={{ background: "#FFFFFF", color: "#111827" }}>
      <MarketingNav />

      <main className="pt-24 pb-16">
        <div className={container}>
          {/* Breadcrumb */}
          <nav className="text-[12px] text-[#9CA3AF] flex items-center gap-2 mb-6">
            <Link href="/" className="hover:text-[#111827] transition-colors">Home</Link>
            <span>/</span>
            <Link href="/index" className="hover:text-[#111827] transition-colors">AI Visibility Index</Link>
            <span>/</span>
            <span className="text-[#111827] font-medium">{category}</span>
          </nav>

          {/* Header */}
          <div className="mb-10">
            <Link href="/index" className="inline-flex items-center gap-1.5 text-[13px] text-[#6B7280] hover:text-[#10B981] transition-colors mb-4">
              <ArrowLeft className="w-3.5 h-3.5" />
              All categories
            </Link>
            <h1 className="text-[36px] md:text-[48px] font-bold text-[#111827] leading-tight mb-2">{category}</h1>
            <p className="text-[16px] text-[#4B5563]">
              {brandsInCategory.length} brands tracked ·{" "}
              {avgScore !== null ? `Avg score: ${avgScore}/100` : "Scan data coming soon"} ·{" "}
              {formatMonth(month)}
            </p>
          </div>

          {/* Stats row */}
          {rows.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-10 p-5 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
              <div>
                <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wide mb-1">Leader</p>
                <p className="font-bold text-[#111827]">{rows[0]?.brand_name ?? "—"}</p>
                <p className="text-[24px] font-black tabular-nums" style={{ color: scoreHex(rows[0]?.composite_score) }}>{rows[0]?.composite_score ?? "—"}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wide mb-1">Average</p>
                <p className="text-[24px] font-black text-[#111827] tabular-nums">{avgScore ?? "—"}</p>
                <p className="text-[12px] text-[#6B7280]">{rows.length} brands tracked</p>
              </div>
              <div>
                <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wide mb-1">Biggest Mover</p>
                {(() => {
                  const mover = rows.filter((r) => r.score_delta !== null).sort((a, b) => Math.abs(b.score_delta!) - Math.abs(a.score_delta!))[0];
                  return mover ? (
                    <>
                      <p className="font-bold text-[#111827]">{mover.brand_name}</p>
                      <p className="text-[20px] font-black tabular-nums" style={{ color: mover.score_delta! > 0 ? "#10B981" : "#EF4444" }}>
                        {mover.score_delta! > 0 ? "+" : ""}{mover.score_delta}
                      </p>
                    </>
                  ) : <p className="text-[#9CA3AF] text-[13px]">—</p>;
                })()}
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">

              {/* Rankings */}
              <section>
                <h2 className="text-[20px] font-bold text-[#111827] mb-4">Rankings</h2>
                <div className="border border-[#E5E7EB] rounded-2xl overflow-hidden">
                  {rows.length === 0 ? (
                    <p className="text-center py-10 text-[#9CA3AF] text-[13px]">No scan data yet for this category.</p>
                  ) : (
                    rows.map((row, i) => (
                      <Link
                        key={row.brand_url}
                        href={`/index/${toSlug(row.brand_name)}`}
                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#F9FAFB] transition-colors border-b border-[#F3F4F6] last:border-0 group"
                      >
                        <span className="text-[14px] font-mono text-[#9CA3AF] w-6 text-right flex-shrink-0">#{i + 1}</span>
                        <span className="flex-1 font-semibold text-[#111827] group-hover:text-[#10B981] transition-colors">{row.brand_name}</span>
                        <span className="text-[18px] font-bold tabular-nums flex-shrink-0" style={{ color: scoreHex(row.composite_score) }}>
                          {row.composite_score ?? "—"}
                        </span>
                        {row.score_delta !== null && (
                          <span className="text-[12px] font-semibold w-10 text-right flex-shrink-0 tabular-nums"
                            style={{ color: row.score_delta > 0 ? "#10B981" : row.score_delta < 0 ? "#EF4444" : "#9CA3AF" }}>
                            {row.score_delta > 0 ? `+${row.score_delta}` : row.score_delta === 0 ? "—" : row.score_delta}
                          </span>
                        )}
                        <ArrowRight className="w-4 h-4 text-[#D1D5DB] group-hover:text-[#10B981] flex-shrink-0 transition-colors" />
                      </Link>
                    ))
                  )}
                </div>
              </section>

              {/* Category trend */}
              {catHistory.length > 0 && (
                <section className="border border-[#E5E7EB] rounded-2xl p-6">
                  <h2 className="text-[16px] font-semibold text-[#111827] mb-4">Category Average Over Time</h2>
                  <ScoreTrend data={catHistory.map((h) => ({ month: h.month, score: h.avg }))} color="#10B981" />
                </section>
              )}

              {/* ChatGPT vs Claude */}
              {(chatgptLeader || claudeLeader) && (
                <section className="border border-[#E5E7EB] rounded-2xl p-6">
                  <h2 className="text-[16px] font-semibold text-[#111827] mb-4">Platform Comparison</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#F0FFF4] border border-[#D1FAE5] rounded-xl p-4">
                      <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide mb-2">ChatGPT Favors</p>
                      {chatgptLeader ? (
                        <>
                          <Link href={`/index/${toSlug(chatgptLeader.brand_name)}`} className="font-bold text-[#111827] hover:text-[#10B981] transition-colors">{chatgptLeader.brand_name}</Link>
                          <p className="text-[28px] font-black tabular-nums text-[#10A37F]">{chatgptLeader.chatgpt_score}</p>
                        </>
                      ) : <p className="text-[#9CA3AF]">—</p>}
                    </div>
                    <div className="bg-[#FFF8F3] border border-[#FED7AA] rounded-xl p-4">
                      <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Claude Favors</p>
                      {claudeLeader ? (
                        <>
                          <Link href={`/index/${toSlug(claudeLeader.brand_name)}`} className="font-bold text-[#111827] hover:text-[#10B981] transition-colors">{claudeLeader.brand_name}</Link>
                          <p className="text-[28px] font-black tabular-nums text-[#CD7C2F]">{claudeLeader.claude_score}</p>
                        </>
                      ) : <p className="text-[#9CA3AF]">—</p>}
                    </div>
                  </div>
                </section>
              )}

              {/* Insights */}
              {catInsights.length > 0 && (
                <section>
                  <h2 className="text-[20px] font-bold text-[#111827] mb-4">Category Insights</h2>
                  <div className="space-y-3">
                    {catInsights.slice(0, 3).map((insight) => (
                      <div key={insight.id} className="border border-[#E5E7EB] rounded-xl p-5">
                        <h3 className="text-[14px] font-semibold text-[#111827] mb-1">{insight.title}</h3>
                        <p className="text-[13px] text-[#4B5563]">{insight.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Comparison pairs */}
              {comparePairs.length > 0 && (
                <section className="border border-[#E5E7EB] rounded-2xl p-5">
                  <h2 className="text-[14px] font-semibold text-[#111827] mb-3">Head-to-Head Comparisons</h2>
                  <div className="space-y-2">
                    {comparePairs.map(({ nameA, nameB, slug }) => (
                      <Link
                        key={slug}
                        href={`/index/compare/${slug}`}
                        className="flex items-center justify-between group hover:text-[#10B981] transition-colors text-[13px] text-[#4B5563] py-1.5 border-b border-[#F3F4F6] last:border-0"
                      >
                        <span>{nameA} vs {nameB}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#D1D5DB] group-hover:text-[#10B981]" />
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* All brands in category */}
              <section className="border border-[#E5E7EB] rounded-2xl p-5">
                <h2 className="text-[14px] font-semibold text-[#111827] mb-3">All {category} Brands</h2>
                <div className="space-y-1.5">
                  {brandsInCategory.map((b) => (
                    <Link
                      key={b.url}
                      href={`/index/${toSlug(b.name)}`}
                      className="flex items-center justify-between group hover:text-[#10B981] text-[13px] text-[#4B5563] py-1 transition-colors"
                    >
                      <span>{b.name}</span>
                      <ArrowRight className="w-3 h-3 text-[#D1D5DB] group-hover:text-[#10B981]" />
                    </Link>
                  ))}
                </div>
              </section>

              {/* Back to full index */}
              <Link href="/index" className="flex items-center justify-center gap-2 border border-[#E5E7EB] rounded-xl px-4 py-3 text-[13px] text-[#6B7280] hover:border-[#10B981] hover:text-[#10B981] transition-colors">
                <ArrowLeft className="w-4 h-4" />
                All Categories
              </Link>

              {/* CTA */}
              <div className="bg-gradient-to-br from-[#F0FDF4] to-white border border-[#D1FAE5] rounded-2xl p-5">
                <p className="text-[14px] font-semibold text-[#111827] mb-2">Compare your brand</p>
                <p className="text-[12px] text-[#6B7280] mb-4">Are you keeping up with the top {category} brands in AI?</p>
                <Link href="/signup" className="flex items-center justify-center gap-1.5 bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-[13px] px-4 py-2.5 rounded-xl transition-colors">
                  Check your score <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
