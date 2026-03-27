import type { Metadata } from "next";
import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getBalance } from "@/lib/tokens";
import { cn } from "@/lib/utils";

const SAMPLE_SCAN_ID = "9627517f-3baa-4213-b7d6-be97b8b1e634";

export const metadata: Metadata = { title: "Dashboard — ShowsUp" };

// ── Helpers ────────────────────────────────────────────────────────────────────

function scoreTextColor(s: number) {
  if (s >= 71) return "text-emerald-600";
  if (s >= 51) return "text-teal-600";
  if (s >= 31) return "text-amber-600";
  return "text-red-500";
}

function scoreBarColor(s: number): string {
  if (s >= 71) return "#10B981";
  if (s >= 51) return "#14B8A6";
  if (s >= 31) return "#F59E0B";
  return "#EF4444";
}

function scoreBg(s: number) {
  if (s >= 51) return "bg-emerald-50 border-emerald-200";
  if (s >= 31) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: allScans }, { data: platformData }, tokenBalance] = await Promise.all([
    supabase.from("scans").select("*").order("created_at", { ascending: false }),
    supabase.from("scan_results").select("model, score"),
    user ? getBalance(user.id) : Promise.resolve(0),
  ]);

  // Fetch sample scan for onboarding (service role bypasses RLS)
  const adminSb = await createServiceClient();
  const { data: sampleScan } = await adminSb
    .from("scans")
    .select("id, brand_name, website, overall_score, category_scores, created_at")
    .eq("id", SAMPLE_SCAN_ID)
    .single();

  const scans        = allScans ?? [];
  const totalScans   = scans.length;
  const latestScore  = scans[0]?.overall_score ?? null;
  const uniqueBrands = new Set(scans.map((s) => s.brand_name.toLowerCase())).size;
  const recentScans  = scans.slice(0, 10);

  const pMap: Record<string, { total: number; count: number }> = {};
  for (const row of platformData ?? []) {
    if (!row.model || row.score === null) continue;
    if (!pMap[row.model]) pMap[row.model] = { total: 0, count: 0 };
    pMap[row.model].total += row.score;
    pMap[row.model].count++;
  }
  const platformScores = (["chatgpt", "claude"] as const)
    .filter((m) => pMap[m])
    .map((m) => ({
      model: m,
      label: m === "chatgpt" ? "ChatGPT" : "Claude",
      avg: Math.round(pMap[m].total / pMap[m].count),
    }));

  const firstName = user?.email?.split("@")[0] ?? "there";

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">

      {/* ── First-time / no-scan onboarding ── */}
      {totalScans === 0 ? (<>
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-8 space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-widest">Welcome to ShowsUp</p>
            <h1 className="text-2xl font-bold text-gray-900">
              Hi {firstName}, let&apos;s see if your brand shows up in AI.
            </h1>
            <p className="text-gray-500 text-sm max-w-lg">
              ShowsUp scans ChatGPT, Claude and Gemini to measure how visible your brand is when people ask AI for recommendations. Your first scan takes about 60 seconds.
            </p>
          </div>

          {/* Steps */}
          <ol className="space-y-3">
            {[
              { n: "1", text: "Enter your website URL and brand name" },
              { n: "2", text: "We query the AI platforms and calculate your ShowsUp Score" },
              { n: "3", text: "Get a research-backed improvement plan with specific fixes" },
            ].map(({ n, text }) => (
              <li key={n} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {n}
                </span>
                <span className="text-sm text-gray-600">{text}</span>
              </li>
            ))}
          </ol>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link
              href="/app/report-builder"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg px-6 py-3 text-sm transition-colors shadow-sm"
            >
              Run your first scan →
            </Link>
            {tokenBalance !== null && tokenBalance > 0 && (
              <p className="text-xs text-gray-400">
                You have <span className="font-semibold text-emerald-600">{tokenBalance.toLocaleString()} tokens</span> ready to use
              </p>
            )}
          </div>
        </div>

        {/* Sample scan preview */}
        {sampleScan && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Sample Report</span>
              <span className="text-xs text-gray-400">See what a full scan looks like</span>
            </div>
            <Link
              href={`/app/report/${SAMPLE_SCAN_ID}`}
              className="flex items-center gap-4 rounded-xl border border-dashed border-emerald-200 bg-white px-5 py-4 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-700 text-sm font-bold">
                {sampleScan.brand_name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">{sampleScan.brand_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{sampleScan.website} · Sample report</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className={cn(
                    "text-lg font-bold tabular-nums font-mono",
                    (sampleScan.overall_score ?? 0) >= 51 ? "text-emerald-600" :
                    (sampleScan.overall_score ?? 0) >= 31 ? "text-amber-600" : "text-red-500"
                  )}>
                    {sampleScan.overall_score ?? "—"}
                  </p>
                  <p className="text-[10px] text-gray-400">ShowsUp Score</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        )}
      </>) : (
        /* Page header — returning users only */
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {firstName}.</p>
        </div>
      )}

      {/* ── Content for users with scans ── */}
      {totalScans > 0 && (<>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* ShowsUp Score */}
        <div className={cn(
          "rounded-xl border p-5 space-y-3",
          latestScore !== null ? scoreBg(latestScore) : "bg-white border-gray-200"
        )}>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">ShowsUp Score</p>
          {latestScore !== null ? (
            <>
              <p className={cn("text-5xl font-bold leading-none tabular-nums font-mono", scoreTextColor(latestScore))}>
                {latestScore}
              </p>
              <p className="text-xs text-gray-500">Latest scan result</p>
            </>
          ) : (
            <>
              <p className="text-5xl font-bold leading-none text-gray-300 font-mono">—</p>
              <p className="text-xs text-gray-400">No scans yet</p>
            </>
          )}
        </div>

        {/* Brands Tracked */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Brands Tracked</p>
          <p className="text-5xl font-bold leading-none text-gray-900 tabular-nums font-mono">{uniqueBrands}</p>
          <p className="text-xs text-gray-400">Unique brands scanned</p>
        </div>

        {/* Scans Run */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Scans Run</p>
          <p className="text-5xl font-bold leading-none text-gray-900 tabular-nums font-mono">{totalScans}</p>
          <p className="text-xs text-gray-400">Total scans completed</p>
        </div>
      </div>

      {/* ── Platform Performance ── */}
      {platformScores.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Platform Performance</h2>
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-5">
            {platformScores.map((p) => (
              <div key={p.model}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">{p.label} Average</span>
                  <span className={cn("text-sm font-bold tabular-nums font-mono", scoreTextColor(p.avg))}>
                    {p.avg}
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-gray-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${p.avg}%`, backgroundColor: scoreBarColor(p.avg) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent Scans ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Recent Scans</h2>
            <div className="flex items-center gap-4">
              <Link href="/app/scores" className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
                View all
              </Link>
              <Link
                href="/app/report-builder"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                New analysis →
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            {recentScans.map((scan, i) => {
              const siteUrl = scan.url || scan.website;
              return (
                <Link
                  key={scan.id}
                  href={`/app/report/${scan.id}`}
                  className={cn(
                    "flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors",
                    i !== recentScans.length - 1 && "border-b border-gray-100"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{scan.brand_name}</p>
                    {siteUrl && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{siteUrl}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-5 flex-shrink-0">
                    <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:block">
                      {timeAgo(scan.created_at)}
                    </span>
                    <span className={cn(
                      "text-sm font-bold tabular-nums font-mono w-8 text-right",
                      scoreTextColor(scan.overall_score ?? 0)
                    )}>
                      {scan.overall_score ?? "—"}
                    </span>
                    <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </>)}
    </div>
  );
}

