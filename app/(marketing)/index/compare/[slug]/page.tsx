import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { getBrandHistory } from "../../_lib/data";
import { MultiScoreTrend } from "../../_components/score-trend";
import {
  toSlug, slugToBrand, parseComparisonSlug, scoreHex, scoreLabel,
  categoryToSlug, getComparisonPairs, formatMonth,
} from "../../_lib/utils";

export const revalidate = 3600;

export async function generateStaticParams() {
  return getComparisonPairs().map(({ slugA, slugB }) => ({
    slug: `${slugA}-vs-${slugB}`,
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const parsed = parseComparisonSlug(params.slug);
  if (!parsed) return { title: "Comparison Not Found" };
  const brandA = slugToBrand(parsed.slugA);
  const brandB = slugToBrand(parsed.slugB);
  if (!brandA || !brandB) return { title: "Comparison Not Found" };

  return {
    title: `${brandA.name} vs ${brandB.name}: AI Visibility Comparison | ShowsUp`,
    description: `Compare ${brandA.name} and ${brandB.name} AI visibility across ChatGPT, Claude, and Gemini. Side-by-side signal breakdown and score trends.`,
    openGraph: {
      title: `${brandA.name} vs ${brandB.name}: AI Visibility`,
      description: `Head-to-head AI visibility comparison between ${brandA.name} and ${brandB.name}.`,
      url: `https://showsup.co/index/compare/${params.slug}`,
    },
    alternates: { canonical: `https://showsup.co/index/compare/${params.slug}` },
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

type SigKey = typeof SIGNALS[number]["key"];

const COLORS = { a: "#10B981", b: "#60A5FA" };

const container = "max-w-[1200px] mx-auto px-6";

export default async function ComparePage({ params }: { params: { slug: string } }) {
  const parsed = parseComparisonSlug(params.slug);
  if (!parsed) notFound();

  const brandA = slugToBrand(parsed.slugA);
  const brandB = slugToBrand(parsed.slugB);
  if (!brandA || !brandB) notFound();

  const [historyA, historyB] = await Promise.all([
    getBrandHistory(brandA.url),
    getBrandHistory(brandB.url),
  ]);

  const latestA = historyA[historyA.length - 1] ?? null;
  const latestB = historyB[historyB.length - 1] ?? null;
  const month = latestA?.month ?? latestB?.month ?? null;

  const trendSeriesA = { name: brandA.name, data: historyA.map((h) => ({ month: h.month, score: h.composite_score })), color: COLORS.a };
  const trendSeriesB = { name: brandB.name, data: historyB.map((h) => ({ month: h.month, score: h.composite_score })), color: COLORS.b };

  // Head-to-head winner per signal
  function winner(key: SigKey): "a" | "b" | "tie" | null {
    const va = latestA?.[key] ?? null;
    const vb = latestB?.[key] ?? null;
    if (va === null || vb === null) return null;
    if (va > vb) return "a";
    if (vb > va) return "b";
    return "tie";
  }

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
            <Link href={`/index/category/${categoryToSlug(brandA.category)}`} className="hover:text-[#111827] transition-colors">{brandA.category}</Link>
            <span>/</span>
            <span className="text-[#111827] font-medium">{brandA.name} vs {brandB.name}</span>
          </nav>

          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-[32px] md:text-[44px] font-bold text-[#111827] mb-2">
              {brandA.name} vs {brandB.name}
            </h1>
            <p className="text-[15px] text-[#6B7280]">
              AI Visibility Comparison · {brandA.category} · {month ? formatMonth(month) : "No data yet"}
            </p>
          </div>

          {/* Score cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {[
              { brand: brandA, latest: latestA, color: COLORS.a, history: historyA },
              { brand: brandB, latest: latestB, color: COLORS.b, history: historyB },
            ].map(({ brand, latest, color }) => (
              <Link
                key={brand.url}
                href={`/index/${toSlug(brand.name)}`}
                className="group block border border-[#E5E7EB] rounded-2xl p-8 hover:shadow-md transition-all text-center"
                style={{ borderTopColor: color, borderTopWidth: 3 }}
              >
                <p className="text-[13px] text-[#9CA3AF] mb-1">{brand.category}</p>
                <h2 className="text-[28px] font-bold text-[#111827] group-hover:text-emerald-600 transition-colors mb-3">{brand.name}</h2>
                <p className="text-[72px] font-black tabular-nums leading-none mb-2" style={{ color: latest?.composite_score != null ? scoreHex(latest.composite_score) : "#D1D5DB" }}>
                  {latest?.composite_score ?? "—"}
                </p>
                <p className="text-[14px] text-[#9CA3AF]">{scoreLabel(latest?.composite_score)}</p>
                {latest?.score_delta != null && (
                  <p className="text-[13px] font-semibold mt-2"
                    style={{ color: latest.score_delta > 0 ? "#10B981" : latest.score_delta < 0 ? "#EF4444" : "#9CA3AF" }}>
                    {latest.score_delta > 0 ? `↑ +${latest.score_delta}` : `↓ ${latest.score_delta}`} pts
                  </p>
                )}
              </Link>
            ))}
          </div>

          {/* Signal breakdown */}
          <section className="border border-[#E5E7EB] rounded-2xl p-6 mb-8">
            <h2 className="text-[18px] font-bold text-[#111827] mb-6">Signal-by-Signal Breakdown</h2>
            <div className="space-y-5">
              {SIGNALS.map(({ key, label }) => {
                const va = latestA?.[key] ?? null;
                const vb = latestB?.[key] ?? null;
                const w = winner(key);
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-medium text-[#4B5563]">{label}</span>
                      {w === "tie" && <span className="text-[11px] text-[#9CA3AF]">Tied</span>}
                      {w === "a" && <span className="text-[11px] font-semibold" style={{ color: COLORS.a }}>{brandA.name} leads</span>}
                      {w === "b" && <span className="text-[11px] font-semibold" style={{ color: COLORS.b }}>{brandB.name} leads</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { brand: brandA, val: va, color: COLORS.a },
                        { brand: brandB, val: vb, color: COLORS.b },
                      ].map(({ brand, val, color: c }) => (
                        <div key={brand.url} className="flex items-center gap-2">
                          <span className="text-[11px] text-[#9CA3AF] w-20 flex-shrink-0 truncate">{brand.name}</span>
                          <div className="flex-1 bg-[#F3F4F6] rounded-full h-4 overflow-hidden">
                            {val !== null ? (
                              <div
                                className="h-4 rounded-full"
                                style={{ width: `${val}%`, background: c, minWidth: val > 0 ? "16px" : "0" }}
                              />
                            ) : null}
                          </div>
                          <span className="text-[12px] font-semibold tabular-nums w-7 text-right flex-shrink-0" style={{ color: val !== null ? c : "#9CA3AF" }}>
                            {val ?? "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Platform comparison */}
          {(latestA || latestB) && (
            <section className="border border-[#E5E7EB] rounded-2xl p-6 mb-8">
              <h2 className="text-[18px] font-bold text-[#111827] mb-4">Platform Comparison</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[#E5E7EB]">
                      <th className="py-2 text-left text-[#6B7280] font-medium">Platform</th>
                      <th className="py-2 text-center font-semibold" style={{ color: COLORS.a }}>{brandA.name}</th>
                      <th className="py-2 text-center font-semibold" style={{ color: COLORS.b }}>{brandB.name}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "ChatGPT", keyA: "chatgpt_score" as keyof typeof latestA, keyB: "chatgpt_score" as keyof typeof latestB },
                      { label: "Claude",  keyA: "claude_score"  as keyof typeof latestA, keyB: "claude_score"  as keyof typeof latestB },
                      { label: "Gemini",  keyA: "gemini_score"  as keyof typeof latestA, keyB: "gemini_score"  as keyof typeof latestB },
                    ].map(({ label, keyA, keyB }) => {
                      const va = (latestA?.[keyA] as number | null) ?? null;
                      const vb = (latestB?.[keyB] as number | null) ?? null;
                      return (
                        <tr key={label} className="border-b border-[#F3F4F6] last:border-0">
                          <td className="py-3 text-[#4B5563]">{label}</td>
                          <td className="py-3 text-center font-bold text-[18px] tabular-nums" style={{ color: va !== null ? scoreHex(va) : "#D1D5DB" }}>{va ?? "—"}</td>
                          <td className="py-3 text-center font-bold text-[18px] tabular-nums" style={{ color: vb !== null ? scoreHex(vb) : "#D1D5DB" }}>{vb ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Trend lines */}
          <section className="border border-[#E5E7EB] rounded-2xl p-6 mb-8">
            <h2 className="text-[18px] font-bold text-[#111827] mb-4">Score Trends</h2>
            <MultiScoreTrend series={[trendSeriesA, trendSeriesB]} height={220} />
          </section>

          {/* Links */}
          <div className="grid md:grid-cols-3 gap-4 mb-10">
            {[
              { href: `/index/${toSlug(brandA.name)}`, label: `${brandA.name} Full Profile` },
              { href: `/index/${toSlug(brandB.name)}`, label: `${brandB.name} Full Profile` },
              { href: `/index/category/${categoryToSlug(brandA.category)}`, label: `All ${brandA.category} Brands` },
            ].map(({ href, label }) => (
              <Link key={href} href={href}
                className="flex items-center justify-between group border border-[#E5E7EB] rounded-xl px-4 py-3 text-[13px] text-[#4B5563] hover:border-[#10B981] hover:text-[#10B981] transition-all">
                <span>{label}</span>
                <ArrowRight className="w-4 h-4 text-[#D1D5DB] group-hover:text-[#10B981]" />
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center border border-[#D1FAE5] bg-[#F0FDF4] rounded-2xl p-8">
            <p className="text-[20px] font-bold text-[#111827] mb-2">How does your brand compare?</p>
            <p className="text-[14px] text-[#4B5563] mb-5">Get your AI visibility score and see where you stand.</p>
            <Link href="/signup"
              className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-semibold px-6 py-3 rounded-xl text-[15px] transition-colors">
              Check your AI visibility <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
